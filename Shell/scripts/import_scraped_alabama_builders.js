const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Path to the latest scraped data
const scrapedDataPath = path.join(__dirname, '../../database/van_builders_alabama_2025-06-05T22-21-35-040Z.json');
const dbPath = path.join(__dirname, '../server/van_builders.db');

function extractCityFromAddress(address) {
    if (!address) return null;
    const cityMatch = address.match(/, ([A-Za-z\s]+),/);
    return cityMatch && cityMatch[1].trim();
}

function importScrapedBuilders() {
    console.log('🚀 Starting import of scraped Alabama builders...');
    
    // Read the scraped data
    if (!fs.existsSync(scrapedDataPath)) {
        console.error('❌ Scraped data file not found:', scrapedDataPath);
        return;
    }
    
    const scrapedData = JSON.parse(fs.readFileSync(scrapedDataPath, 'utf8'));
    console.log(`📊 Found ${scrapedData.builders.length} scraped builders`);
    
    const db = new sqlite3.Database(dbPath);
    
    // Clear existing Alabama builders
    db.run('DELETE FROM builders WHERE state = ?', ['Alabama'], function(err) {
        if (err) {
            console.error('❌ Error clearing existing Alabama builders:', err);
            return;
        }
        console.log(`🗑️ Cleared ${this.changes} existing Alabama builders`);
        
        // Insert scraped builders
        const insertStmt = db.prepare(`
            INSERT INTO builders (
                name, city, state, lat, lng, zip, phone, email, website, 
                description, van_types, amenities, social_media, photos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        let imported = 0;
        let skipped = 0;
        
        scrapedData.builders.forEach(builder => {
            // Filter out directory/listing sites that aren't actual builders
            const isDirectorySite = builder.name.toLowerCase().includes('directory') ||
                                  builder.name.toLowerCase().includes('source') ||
                                  builder.name.toLowerCase().includes('explore vanx') ||
                                  builder.website.includes('vanlifedirectory') ||
                                  builder.website.includes('campervansource') ||
                                  builder.website.includes('vanx.com');
            
            // Only import builders that appear to be in Alabama or have Alabama in their data
            const hasAlabamaConnection = builder.state === 'Alabama' ||
                                       builder.address.toLowerCase().includes('alabama') ||
                                       builder.description.toLowerCase().includes('alabama') ||
                                       (builder.phone && builder.phone.startsWith('205')) || // Alabama area code
                                       (builder.phone && builder.phone.startsWith('256')) || // Alabama area code
                                       (builder.phone && builder.phone.startsWith('334')) || // Alabama area code
                                       (builder.phone && builder.phone.startsWith('938'));   // Alabama area code
            
            if (isDirectorySite) {
                console.log(`⏭️ Skipping directory site: ${builder.name}`);
                skipped++;
                return;
            }
            
            if (!hasAlabamaConnection) {
                console.log(`⏭️ Skipping non-Alabama builder: ${builder.name} (${builder.state})`);
                skipped++;
                return;
            }
            
            // Clean up the data
            const cleanBuilder = {
                name: builder.name.length > 100 ? builder.name.substring(0, 100) : builder.name,
                city: builder.city || extractCityFromAddress(builder.address) || 'Birmingham',
                state: 'Alabama', // Force to Alabama since we're importing Alabama builders
                lat: builder.lat || 33.5186, // Default to Birmingham, AL coordinates
                lng: builder.lng || -86.8104,
                zip: builder.zip || '',
                phone: builder.phone || '',
                email: builder.email ? builder.email.replace(/HoursOpen$/, '') : '', // Clean up email
                website: builder.website || '',
                description: builder.description || 'Professional van builder specializing in custom conversions.',
                van_types: JSON.stringify(builder.van_types || ['Custom Builds']),
                amenities: JSON.stringify(builder.amenities || ['Custom Build']),
                social_media: JSON.stringify(builder.social_media || {}),
                photos: JSON.stringify(builder.photos || [])
            };
            
            insertStmt.run([
                cleanBuilder.name,
                cleanBuilder.city,
                cleanBuilder.state,
                cleanBuilder.lat,
                cleanBuilder.lng,
                cleanBuilder.zip,
                cleanBuilder.phone,
                cleanBuilder.email,
                cleanBuilder.website,
                cleanBuilder.description,
                cleanBuilder.van_types,
                cleanBuilder.amenities,
                cleanBuilder.social_media,
                cleanBuilder.photos
            ], function(err) {
                if (err) {
                    console.error(`❌ Error inserting ${cleanBuilder.name}:`, err);
                } else {
                    console.log(`✅ Imported: ${cleanBuilder.name}`);
                    imported++;
                }
            });
        });
        
        insertStmt.finalize(() => {
            console.log(`\n🎉 Import completed!`);
            console.log(`✅ Imported: ${imported} builders`);
            console.log(`⏭️ Skipped: ${skipped} builders`);
            
            // Verify the import
            db.all('SELECT COUNT(*) as count FROM builders WHERE state = ?', ['Alabama'], (err, rows) => {
                if (err) {
                    console.error('❌ Error verifying import:', err);
                } else {
                    console.log(`📊 Total Alabama builders in database: ${rows[0].count}`);
                }
                db.close();
            });
        });
    });
}

// Run the import
importScrapedBuilders();
