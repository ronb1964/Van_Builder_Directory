const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const sqlite3 = require('sqlite3').verbose();

const CSV_FILE = path.join(__dirname, 'manual_builder_entry.csv');
const DB_PATH = path.join(__dirname, '..', 'Shell', 'server', 'van_builders.db');

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid 10-digit US phone number
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
        // Remove country code if present
        return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    // Return original if can't format
    return phone;
}

// Process van types to extract base models only
function processVanTypes(vanTypesString) {
    if (!vanTypesString || vanTypesString.trim() === '') return '';
    
    // Split by comma and process each type
    const types = vanTypesString.split(',').map(type => type.trim().toLowerCase());
    
    // Map of variations to base models
    const modelMap = {
        'sprinter': ['sprinter', 'mercedes sprinter', 'mercedes-benz sprinter'],
        'transit': ['transit', 'ford transit'],
        'promaster': ['promaster', 'ram promaster'],
        'express': ['express', 'chevy express', 'chevrolet express'],
        'savana': ['savana', 'gmc savana'],
        'e-series': ['e-series', 'e series', 'ford e-series', 'ford e series', 'econoline'],
        'nv': ['nv', 'nissan nv'],
        'crafter': ['crafter', 'vw crafter', 'volkswagen crafter']
    };
    
    const baseModels = new Set();
    
    types.forEach(type => {
        // Remove numbers and common suffixes
        let cleanType = type
            .replace(/\d+/g, '') // Remove numbers (144, 170, 2500, 3500, etc.)
            .replace(/\s+ft/gi, '') // Remove 'ft' (feet)
            .replace(/\s+wb/gi, '') // Remove 'wb' (wheelbase)
            .replace(/\s+hr/gi, '') // Remove 'hr' (high roof)
            .replace(/\s+mr/gi, '') // Remove 'mr' (medium roof)
            .replace(/\s+lr/gi, '') // Remove 'lr' (low roof)
            .replace(/\s+ext/gi, '') // Remove 'ext' (extended)
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
        
        // Check if it matches any known model
        let foundModel = false;
        for (const [baseModel, variations] of Object.entries(modelMap)) {
            if (variations.some(variation => cleanType.includes(variation))) {
                baseModels.add(baseModel);
                foundModel = true;
                break;
            }
        }
        
        // If no known model found but it's not empty, add the cleaned type
        if (!foundModel && cleanType) {
            baseModels.add(cleanType);
        }
    });
    
    return Array.from(baseModels).join(',');
}

async function importManualEntries() {
    try {
        // Read and parse CSV
        const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
        
        // Skip the example record
        const dataRecords = records.filter(record => 
            record.name && record.name !== 'Example Builder'
        );
        
        if (dataRecords.length === 0) {
            console.log('⚠️ No data records found (only example record present)');
            return;
        }
        
        console.log(`📋 Found ${dataRecords.length} builders to import`);
        
        // Validate required fields
        const validRecords = dataRecords.filter(record => {
            if (!record.name || !record.city || !record.state) {
                console.warn(`⚠️ Skipping record: Missing required fields (name, city, or state)`);
                return false;
            }
            return true;
        });
        
        if (validRecords.length === 0) {
            console.error('❌ No valid records to import');
            return;
        }
        
        // Open database
        const db = new sqlite3.Database(DB_PATH);
        
        let successCount = 0;
        let errorCount = 0;
        
        // Process each entry sequentially
        const processEntries = () => {
            if (validRecords.length === 0) {
                // All done
                console.log(`\n📊 Import complete: ${successCount} builders added to database`);
                
                // Clean CSV file after successful import
                if (successCount > 0) {
                    console.log('\n🧹 Cleaning CSV file...');
                    const headerAndExample = 
`name,city,state,zip,phone,website,email,facebook,instagram,youtube,van_types,amenities,description,photos
"Example Builder","Example City","State Name","12345","(555) 123-4567","https://example.com","info@example.com","https://facebook.com/example","https://instagram.com/example","https://youtube.com/example","Sprinter 144, Sprinter 170, Ford Transit","Solar Power, Shower, Kitchen, Heating","Full description of the builder and their specialties","photo1.jpg,photo2.jpg"
`;
                    fs.writeFileSync(CSV_FILE, headerAndExample);
                    console.log('✅ CSV file reset to header and example only');
                }
                
                db.close();
                return;
            }
            
            const entry = validRecords.shift();
            
            // Clean up empty strings
            const cleanEntry = {
                name: entry.name?.trim(),
                city: entry.city?.trim(),
                state: entry.state?.trim().toUpperCase(), // Store state as uppercase abbreviation
                zip: entry.zip?.trim(),
                phone: formatPhoneNumber(entry.phone),
                website: entry.website?.trim(),
                email: entry.email?.trim(),
                facebook: entry.facebook?.trim(),
                instagram: entry.instagram?.trim(),
                youtube: entry.youtube?.trim(),
                van_types: processVanTypes(entry.van_types), // Process van types to base models
                amenities: entry.amenities?.trim().toLowerCase(), // Convert to lowercase
                description: entry.description?.trim(),
                photos: entry.photos?.trim()
            };
            
            // Create social media JSON
            const socialMedia = {};
            if (cleanEntry.facebook) socialMedia.facebook = cleanEntry.facebook;
            if (cleanEntry.instagram) socialMedia.instagram = cleanEntry.instagram;
            if (cleanEntry.youtube) socialMedia.youtube = cleanEntry.youtube;
            
            // For manual entries, we don't have lat/lng so use 0
            db.run(`
                INSERT INTO builders (
                    name, city, state, lat, lng, zip, phone, email, website,
                    description, van_types, amenities, social_media, photos,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `, [
                cleanEntry.name,
                cleanEntry.city,
                cleanEntry.state,
                0, // lat - required field
                0, // lng - required field
                cleanEntry.zip || null,
                cleanEntry.phone || null,
                cleanEntry.email || null,
                cleanEntry.website || null,
                cleanEntry.description || null,
                cleanEntry.van_types || null,
                cleanEntry.amenities || null,
                JSON.stringify(socialMedia),
                cleanEntry.photos || null
            ], function(err) {
                if (err) {
                    console.error(`❌ Error importing ${cleanEntry.name}:`, err.message);
                    errorCount++;
                } else {
                    console.log(`✅ Imported: ${cleanEntry.name}`);
                    successCount++;
                }
                
                // Process next entry
                processEntries();
            });
        };
        
        // Start processing
        processEntries();
        
    } catch (error) {
        console.error('Import error:', error);
    }
}

// Run import
importManualEntries();
