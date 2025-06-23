#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const missingBuilders = [
    {
        name: 'Levity Vans',
        city: 'Santa Cruz',
        address: '',
        website: 'https://levityvans.com/',
        lat: 36.9741,
        lng: -122.0308
    },
    {
        name: 'Vannon',
        city: 'San Luis Obispo',
        address: '4675 Thread Ln, Suite H',
        website: 'https://www.vannon.com/',
        lat: 35.2828,
        lng: -120.6596
    },
    {
        name: 'Van Damme Conversions',
        city: 'Vista',
        address: '2530 Fortune Wy',
        website: 'https://www.vandammeconversions.com/',
        lat: 33.2000,
        lng: -117.2425
    },
    {
        name: 'Custom Concept Vans',
        city: 'Watsonville',
        address: '428 Airport Blvd',
        website: 'https://customconceptvans.com/home-1',
        lat: 36.9107,
        lng: -121.7649
    },
    {
        name: 'Tiny Planet',
        city: 'Sacramento',
        address: '8866 Fruitridge Rd',
        website: 'https://tinyplanet.group/',
        lat: 38.5816,
        lng: -121.4944
    }
];

async function addMissingBuilders() {
    const dbPath = path.join(__dirname, '../server/database/builders.db');
    const db = new sqlite3.Database(dbPath);
    
    console.log('📋 Adding 5 missing CA builders...\n');
    
    for (const builder of missingBuilders) {
        try {
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO builders (
                        name, city, state, lat, lng, phone, email, website,
                        description, van_types, amenities, social_media, address,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `, [
                    builder.name,
                    builder.city,
                    'CA',
                    builder.lat,
                    builder.lng,
                    null, // phone
                    null, // email  
                    builder.website,
                    null, // description
                    'Custom Van', // van_types
                    JSON.stringify(['Custom Build']), // amenities
                    JSON.stringify({}), // social_media
                    builder.address
                ], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`✅ Added: ${builder.name} (${builder.city})`);
            
        } catch (error) {
            console.error(`❌ Error adding ${builder.name}:`, error.message);
        }
    }
    
    db.close();
    console.log('\n🎉 Missing builders added! Total CA builders should now be 22.');
}

addMissingBuilders().catch(console.error); 