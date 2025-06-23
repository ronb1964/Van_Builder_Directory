const sqlite3 = require('sqlite3').verbose();
const { EnhancedGeocodingSystem } = require('./enhanced_geocoding_system');

async function fixAlabamaCoordinates() {
    console.log('🗺️ Fixing Alabama Builder Coordinates with Google Maps Geocoding');
    console.log('=====================================================\n');

    const geocoder = new EnhancedGeocodingSystem();
    
    // Connect to server database (the one the app uses)
    const db = new sqlite3.Database('../server/database/builders.db');
    
    try {
        // Get Alabama builders
        const builders = await new Promise((resolve, reject) => {
            db.all(
                "SELECT id, name, address, city, state, lat, lng FROM builders WHERE state = 'AL'",
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        console.log(`Found ${builders.length} Alabama builders to geocode:\n`);
        
        for (const builder of builders) {
            console.log(`\n🏢 ${builder.name}`);
            console.log(`   Address: ${builder.address}, ${builder.city}, ${builder.state}`);
            console.log(`   Current coords: ${builder.lat}, ${builder.lng}`);
            
            const fullAddress = `${builder.address}, ${builder.city}, ${builder.state}`;
            
            // Get Google coordinates
            const result = await geocoder.geocodeAddress(fullAddress, builder.name);
            
            if (result) {
                // Calculate distance difference
                const distance = geocoder.calculateDistance(
                    builder.lat, builder.lng,
                    result.lat, result.lng
                );
                
                console.log(`   New coords: ${result.lat}, ${result.lng}`);
                console.log(`   Service: ${result.service}`);
                console.log(`   Accuracy: ${result.accuracy}`);
                console.log(`   Distance change: ${distance.toFixed(3)} miles`);
                
                if (result.formatted_address) {
                    console.log(`   Google address: ${result.formatted_address}`);
                }
                
                // Update coordinates in database
                await new Promise((resolve, reject) => {
                    db.run(
                        "UPDATE builders SET lat = ?, lng = ? WHERE id = ?",
                        [result.lat, result.lng, builder.id],
                        function(err) {
                            if (err) reject(err);
                            else {
                                console.log(`   ✅ Updated coordinates in database`);
                                resolve();
                            }
                        }
                    );
                });
                
            } else {
                console.log(`   ❌ Could not geocode address`);
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('\n🎯 Alabama coordinates update complete!');
        console.log('The map markers should now be precisely positioned.');
        
    } catch (error) {
        console.error('Error fixing coordinates:', error);
    } finally {
        db.close();
    }
}

// Run the fix
fixAlabamaCoordinates().catch(console.error); 