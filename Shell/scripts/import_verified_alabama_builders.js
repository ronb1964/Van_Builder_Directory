const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Only import verified Alabama builders
const verifiedBuilders = [
    {
        name: "Gearbox Adventure Rentals",
        website: "https://gearboxrentals.com/",
        city: "Birmingham",
        state: "Alabama",
        lat: 33.5186,
        lng: -86.8104,
        zip: "35217",
        phone: "205-379-0027",
        email: "craig@gearboxrentals.com",
        description: "Custom Van Conversions for adventure seekers",
        specialties: "Van conversions, adventure vehicle builds",
        van_types: "Sprinter, Transit, ProMaster",
        services: "Custom conversions, rentals",
        photos: JSON.stringify([]),
        social_media: JSON.stringify({
            facebook: "https://www.facebook.com/gearboxadventurerentals",
            instagram: "https://www.instagram.com/gearboxadventurerentals",
            youtube: "",
            tiktok: ""
        })
    },
    {
        name: "Storyteller Overland",
        website: "https://storytelleroverland.com/",
        city: "Birmingham",
        state: "Alabama",
        lat: 33.5186,
        lng: -86.8104,
        zip: "35203",
        phone: "205-414-6164",
        email: "info@storytelleroverland.com",
        description: "Adventure van manufacturer specializing in MODE camper vans",
        specialties: "Adventure van manufacturing, MODE camper vans",
        van_types: "Ford Transit, Mercedes Sprinter",
        services: "Van manufacturing, custom builds",
        photos: JSON.stringify([]),
        social_media: JSON.stringify({
            facebook: "",
            instagram: "https://www.instagram.com/storytelleroverland",
            youtube: "",
            tiktok: ""
        })
    },
    {
        name: "Vulcan Coach",
        website: "https://vulcancoach.com/",
        city: "Midfield",
        state: "Alabama",
        lat: 33.4651,
        lng: -86.9069,
        zip: "35228",
        phone: "205-923-7356",
        email: "info@vulcancoach.com",
        description: "Family-owned since 1964, custom bus and RV conversions",
        specialties: "Custom bus conversions, RV modifications",
        van_types: "Buses, RVs, custom vehicles",
        services: "Custom builds, repairs, modifications",
        photos: JSON.stringify([]),
        social_media: JSON.stringify({
            facebook: "",
            instagram: "",
            youtube: "",
            tiktok: ""
        })
    }
];

const dbPath = path.join(__dirname, '..', 'server', 'van_builders.db');
const db = new sqlite3.Database(dbPath);

console.log('🧹 Importing verified Alabama builders...');

const insertBuilder = (builder) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO builders (
                name, website, city, state, lat, lng, zip, phone, email,
                description, specialties, van_types, services, photos, social_media
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            builder.name,
            builder.website,
            builder.city,
            builder.state,
            builder.lat,
            builder.lng,
            builder.zip,
            builder.phone,
            builder.email,
            builder.description,
            builder.specialties,
            builder.van_types,
            builder.services,
            builder.photos,
            builder.social_media
        ];
        
        db.run(sql, values, function(err) {
            if (err) {
                console.error(`❌ Error inserting ${builder.name}:`, err.message);
                reject(err);
            } else {
                console.log(`✅ Imported: ${builder.name}`);
                resolve(this.lastID);
            }
        });
    });
};

async function importBuilders() {
    try {
        for (const builder of verifiedBuilders) {
            await insertBuilder(builder);
        }
        
        console.log(`\n🎉 Successfully imported ${verifiedBuilders.length} verified Alabama builders!`);
        
        // Verify the import
        db.all("SELECT name, city, state, phone FROM builders WHERE state = 'Alabama'", (err, rows) => {
            if (err) {
                console.error('Error verifying import:', err.message);
            } else {
                console.log('\n📋 Verified Alabama builders in database:');
                rows.forEach((row, index) => {
                    console.log(`${index + 1}. ${row.name} - ${row.city}, ${row.state} - ${row.phone}`);
                });
            }
            db.close();
        });
        
    } catch (error) {
        console.error('❌ Import failed:', error.message);
        db.close();
    }
}

importBuilders();
