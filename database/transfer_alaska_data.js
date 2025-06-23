const sqlite3 = require('sqlite3').verbose();
const { scraperConfig } = require('./scraper_config');

async function transferAlaskaData() {
    console.log('🗺️ Transferring Alaska Builder Data from Scraper DB to Site DB');
    console.log('==========================================================\n');

    const scraperDb = new sqlite3.Database('./builders.db');
    const siteDb = new sqlite3.Database('../server/database/builders.db');
    
    try {
        // Get Alaska builders from scraper database
        const scraperBuilders = await new Promise((resolve, reject) => {
            scraperDb.all(
                "SELECT * FROM builders WHERE state = 'AK'",
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        console.log(`Found ${scraperBuilders.length} Alaska builders in scraper database\n`);
        
        // Get existing Alaska builders from site database
        const siteBuilders = await new Promise((resolve, reject) => {
            siteDb.all(
                "SELECT * FROM builders WHERE state = 'AK'",
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        console.log(`Found ${siteBuilders.length} Alaska builders in site database\n`);
        
        // Process each scraper builder
        for (const scraperBuilder of scraperBuilders) {
            console.log(`\n🏢 Processing: ${scraperBuilder.name}`);
            
            // Find matching builder in site database (by name or website)
            const siteBuilder = siteBuilders.find(sb => 
                sb.name === scraperBuilder.name || 
                sb.website === scraperBuilder.website ||
                (scraperBuilder.website && sb.website && 
                 scraperBuilder.website.includes(sb.website.replace('https://', '').replace('http://', '').split('/')[0]))
            );
            
            if (siteBuilder) {
                console.log(`   📍 Found existing builder in site DB (ID: ${siteBuilder.id})`);
                
                // Consolidate the best data from both sources
                const consolidatedData = {
                    name: scraperBuilder.name || siteBuilder.name,
                    city: scraperBuilder.city || siteBuilder.city,
                    address: scraperBuilder.address || siteBuilder.address || `${scraperBuilder.city || siteBuilder.city}, AK`,
                    phone: scraperBuilder.phone || siteBuilder.phone || '',
                    email: scraperBuilder.email || siteBuilder.email || '',
                    website: scraperBuilder.website || siteBuilder.website,
                    social_media: scraperBuilder.social_media || siteBuilder.social_media || '{}',
                    photos: scraperBuilder.photos || siteBuilder.photos || '[]',
                    description: scraperBuilder.description || siteBuilder.description || '',
                    lat: scraperBuilder.lat || siteBuilder.lat,
                    lng: scraperBuilder.lng || siteBuilder.lng
                };
                
                console.log(`   🏠 Address: ${consolidatedData.address}`);
                console.log(`   📞 Phone: ${consolidatedData.phone || 'None'}`);
                console.log(`   📍 Current coords: ${consolidatedData.lat || 'None'}, ${consolidatedData.lng || 'None'}`);
                
                // If we have a proper address, geocode it with Google Maps
                if (consolidatedData.address && consolidatedData.address !== `${consolidatedData.city}, AK`) {
                    console.log(`   🌍 Geocoding with Google Maps...`);
                    const coords = await scraperConfig.geocodeAddress(consolidatedData.address, consolidatedData.name);
                    
                    if (coords) {
                        console.log(`   ✅ Google coordinates: ${coords.lat}, ${coords.lng} (accuracy: ${coords.accuracy})`);
                        consolidatedData.lat = coords.lat;
                        consolidatedData.lng = coords.lng;
                    }
                }
                
                // Update the existing builder in site database
                await new Promise((resolve, reject) => {
                    siteDb.run(`
                        UPDATE builders SET 
                            name = ?, city = ?, address = ?, phone = ?, email = ?, 
                            website = ?, lat = ?, lng = ?, social_media = ?, photos = ?, description = ?
                        WHERE id = ?
                    `, [
                        consolidatedData.name, consolidatedData.city, consolidatedData.address,
                        consolidatedData.phone, consolidatedData.email, consolidatedData.website,
                        consolidatedData.lat, consolidatedData.lng, consolidatedData.social_media,
                        consolidatedData.photos, consolidatedData.description, siteBuilder.id
                    ], function(err) {
                        if (err) reject(err);
                        else {
                            console.log(`   ✅ Updated existing builder in site database`);
                            resolve();
                        }
                    });
                });
                
            } else {
                console.log(`   ➕ New builder - adding to site database`);
                
                // Geocode the address if we have one
                let lat = scraperBuilder.lat;
                let lng = scraperBuilder.lng;
                
                if (scraperBuilder.address && scraperBuilder.address !== `${scraperBuilder.city}, AK`) {
                    console.log(`   🌍 Geocoding with Google Maps...`);
                    const coords = await scraperConfig.geocodeAddress(scraperBuilder.address, scraperBuilder.name);
                    
                    if (coords) {
                        console.log(`   ✅ Google coordinates: ${coords.lat}, ${coords.lng} (accuracy: ${coords.accuracy})`);
                        lat = coords.lat;
                        lng = coords.lng;
                    }
                }
                
                // Insert new builder into site database
                await new Promise((resolve, reject) => {
                    siteDb.run(`
                        INSERT INTO builders (
                            name, city, state, zip, address, phone, email, website, lat, lng,
                            van_types, amenities, services, social_media, photos, description, lead_time
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        scraperBuilder.name, scraperBuilder.city, 'AK', scraperBuilder.zip || '',
                        scraperBuilder.address || `${scraperBuilder.city}, AK`, scraperBuilder.phone || '',
                        scraperBuilder.email || '', scraperBuilder.website, lat, lng,
                        scraperBuilder.van_types || '["Custom Van"]', scraperBuilder.amenities || '["Custom Build"]',
                        scraperBuilder.services || '["Custom Builds"]', scraperBuilder.social_media || '{}',
                        scraperBuilder.photos || '[]', scraperBuilder.description || '', scraperBuilder.lead_time || ''
                    ], function(err) {
                        if (err) reject(err);
                        else {
                            console.log(`   ✅ Added new builder to site database (ID: ${this.lastID})`);
                            resolve();
                        }
                    });
                });
            }
        }
        
        console.log('\n🎯 Alaska data transfer complete!');
        console.log('Alaska builders now have enhanced data in the site database.');
        
        // Show final summary
        const finalBuilders = await new Promise((resolve, reject) => {
            siteDb.all(
                "SELECT name, city, address, phone, lat, lng FROM builders WHERE state = 'AK'",
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        console.log(`\n📊 FINAL ALASKA BUILDERS IN SITE DATABASE:`);
        finalBuilders.forEach(builder => {
            console.log(`   🏢 ${builder.name}`);
            console.log(`      📍 ${builder.address}`);
            console.log(`      📞 ${builder.phone || 'No phone'}`);
            console.log(`      🗺️ ${builder.lat}, ${builder.lng}`);
        });
        
    } catch (error) {
        console.error('Error transferring Alaska data:', error);
    } finally {
        scraperDb.close();
        siteDb.close();
    }
}

// Run the transfer
transferAlaskaData().catch(console.error); 