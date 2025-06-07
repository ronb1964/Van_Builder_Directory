const fs = require('fs');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');

/**
 * Import van builders from CSV file to SQLite database
 * Usage: node import_csv_builders.js <csv_file_path>
 */

function parseCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const builders = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const builder = {};
            headers.forEach((header, index) => {
                builder[header] = values[index];
            });
            builders.push(builder);
        }
    }
    return builders;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

function formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle different digit lengths
    if (digits.length === 10) {
        // Format as (xxx) xxx-xxxx
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
        // Remove leading 1 and format
        const tenDigits = digits.slice(1);
        return `(${tenDigits.slice(0, 3)}) ${tenDigits.slice(3, 6)}-${tenDigits.slice(6)}`;
    } else if (digits.length === 7) {
        // Local number, format as xxx-xxxx
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
        // Return original if we can't parse it
        console.warn(`Warning: Could not format phone number: ${phone}`);
        return phone;
    }
}

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = 'AIzaSyBX1Yk0NkpcZY7Qy7SYt2NC80b57FSjaA8';

// Function to geocode an address using Google Maps API
async function geocodeAddress(address, city, state) {
    return new Promise((resolve) => {
        try {
            // Build the query string
            let query = '';
            if (address && address.trim()) {
                query = `${address}, ${city}, ${state}, USA`;
            } else {
                query = `${city}, ${state}, USA`;
            }
            
            console.log(`🌍 Geocoding: ${query}`);
            
            // URL encode the query
            const encodedQuery = encodeURIComponent(query);
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=${GOOGLE_MAPS_API_KEY}`;
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.status === 'OK' && response.results && response.results.length > 0) {
                            const location = response.results[0].geometry.location;
                            const lat = parseFloat(location.lat);
                            const lng = parseFloat(location.lng);
                            console.log(`✅ Found coordinates: ${lat}, ${lng}`);
                            resolve({ lat, lng });
                        } else {
                            console.log(`⚠️  No coordinates found for: ${query} (Status: ${response.status})`);
                            resolve({ lat: 0.0, lng: 0.0 });
                        }
                    } catch (error) {
                        console.log(`❌ Geocoding error for ${query}:`, error.message);
                        resolve({ lat: 0.0, lng: 0.0 });
                    }
                });
            }).on('error', (error) => {
                console.log(`❌ Network error geocoding ${query}:`, error.message);
                resolve({ lat: 0.0, lng: 0.0 });
            });
            
        } catch (error) {
            console.log(`❌ Geocoding error for ${query}:`, error.message);
            resolve({ lat: 0.0, lng: 0.0 });
        }
    });
}

function formatBuilderForDatabase(csvBuilder) {
    // Convert CSV format to database format
    const builder = {
        name: csvBuilder.name,
        website: csvBuilder.website,
        phone: formatPhoneNumber(csvBuilder.phone) || null,
        email: csvBuilder.email || null,
        address: csvBuilder.address || null,
        city: csvBuilder.city,
        state: csvBuilder.state,
        zip: csvBuilder.zip_code || null,
        description: csvBuilder.description || '',
        van_types: csvBuilder.van_types ? csvBuilder.van_types.split(',').map(v => v.trim()) : [],
        amenities: csvBuilder.amenities ? csvBuilder.amenities.split(',').map(a => a.trim()) : [],
        social_media: {
            facebook: csvBuilder.facebook || null,
            instagram: csvBuilder.instagram || null,
            x: csvBuilder.x || null,
            youtube: csvBuilder.youtube || null
        },
        gallery: csvBuilder.photo_urls ? 
            csvBuilder.photo_urls.split(',').map(url => ({
                url: url.trim(),
                alt: `Photo of ${csvBuilder.name} van conversion`
            })) : []
    };
    
    return builder;
}

async function importBuilders(csvFilePath) {
    try {
        console.log(`📁 Reading CSV file: ${csvFilePath}`);
        const csvContent = fs.readFileSync(csvFilePath, 'utf8');
        const csvBuilders = parseCSV(csvContent);
        
        // Filter out example rows
        const validBuilders = csvBuilders.filter(builder => {
            const name = builder.name ? builder.name.toLowerCase().trim() : '';
            const isExample = name === 'example' || name.includes('example');
            if (isExample) {
                console.log(`⏭️  Skipping example row: ${builder.name}`);
                return false;
            }
            return true;
        });
        
        console.log(`📋 Found ${csvBuilders.length} total rows in CSV`);
        console.log(`✅ Processing ${validBuilders.length} valid builders (skipped ${csvBuilders.length - validBuilders.length} example rows)`);
        
        if (validBuilders.length === 0) {
            console.log('❌ No valid builders found in CSV file');
            return;
        }
        
        // Connect to database
        const dbPath = path.join(__dirname, '../Shell/server/van_builders.db');
        const db = new sqlite3.Database(dbPath);
        
        console.log('🗄️ Connected to SQLite database');
        
        // Convert and insert builders
        for (const csvBuilder of validBuilders) {
            const builder = formatBuilderForDatabase(csvBuilder);
            
            // Geocode the address
            const { lat, lng } = await geocodeAddress(builder.address, builder.city, builder.state);
            builder.lat = lat;
            builder.lng = lng;
            
            console.log(`💾 Importing: ${builder.name} (${builder.city}, ${builder.state})`);
            
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO builders (
                    name, website, phone, email, address, city, state, zip, lat, lng,
                    description, van_types, amenities, social_media, gallery
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([
                builder.name,
                builder.website,
                builder.phone,
                builder.email,
                builder.address,
                builder.city,
                builder.state,
                builder.zip,
                builder.lat,
                builder.lng,
                builder.description,
                JSON.stringify(builder.van_types),
                JSON.stringify(builder.amenities),
                JSON.stringify(builder.social_media),
                JSON.stringify(builder.gallery)
            ]);
            
            stmt.finalize();
        }
        
        console.log(`✅ Successfully imported ${validBuilders.length} builders to database`);
        console.log('🔄 Restart your application to see the new builders');
        
        db.close();
        
    } catch (error) {
        console.error('❌ Error importing builders:', error.message);
    }
}

// Main execution
const csvFilePath = process.argv[2];
if (!csvFilePath) {
    console.log('Usage: node import_csv_builders.js <csv_file_path>');
    console.log('Example: node import_csv_builders.js arizona_builders.csv');
    process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found: ${csvFilePath}`);
    process.exit(1);
}

importBuilders(csvFilePath);
