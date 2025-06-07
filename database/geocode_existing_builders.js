const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const path = require('path');

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = 'AIzaSyBX1Yk0NkpcZY7Qy7SYt2NC80b57FSjaA8';

// Function to geocode an address using Google Maps API
async function geocodeAddress(address, city, state) {
    return new Promise((resolve) => {
        try {
            // Build the query string
            let query = '';
            if (address && address.trim() && address !== city && address !== state) {
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

async function geocodeExistingBuilders() {
    const dbPath = path.join(__dirname, '../Shell/server/van_builders.db');
    const db = new sqlite3.Database(dbPath);
    
    console.log('🗄️ Connected to SQLite database');
    
    // Get all builders that need geocoding (lat = 0.0 and lng = 0.0)
    const query = `SELECT id, name, address, city, state, lat, lng FROM builders WHERE lat = 0.0 AND lng = 0.0 ORDER BY state, name`;
    
    db.all(query, async (err, builders) => {
        if (err) {
            console.error('❌ Error fetching builders:', err);
            return;
        }
        
        console.log(`📋 Found ${builders.length} builders that need geocoding`);
        
        if (builders.length === 0) {
            console.log('✅ All builders already have coordinates!');
            db.close();
            return;
        }
        
        // Process each builder
        for (const builder of builders) {
            console.log(`\n🏢 Processing: ${builder.name} (${builder.city}, ${builder.state})`);
            
            // Geocode the address
            const { lat, lng } = await geocodeAddress(builder.address, builder.city, builder.state);
            
            if (lat !== 0.0 || lng !== 0.0) {
                // Update the database with new coordinates
                const updateStmt = db.prepare(`UPDATE builders SET lat = ?, lng = ? WHERE id = ?`);
                updateStmt.run([lat, lng, builder.id], (updateErr) => {
                    if (updateErr) {
                        console.log(`❌ Error updating ${builder.name}:`, updateErr.message);
                    } else {
                        console.log(`💾 Updated ${builder.name} with coordinates: ${lat}, ${lng}`);
                    }
                });
                updateStmt.finalize();
            }
            
            // Add a small delay to be respectful to the API
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n✅ Geocoding complete!');
        db.close();
        
        // Show final results
        console.log('\n📊 Final coordinates summary:');
        db.all(`SELECT name, city, state, lat, lng FROM builders WHERE state IN ('Alabama', 'New Jersey') ORDER BY state, name`, (err, results) => {
            if (!err) {
                results.forEach(builder => {
                    const coords = builder.lat !== 0.0 ? `${builder.lat}, ${builder.lng}` : 'No coordinates';
                    console.log(`📍 ${builder.name} (${builder.city}, ${builder.state}): ${coords}`);
                });
            }
        });
    });
}

// Run the geocoding
geocodeExistingBuilders().catch(console.error);
