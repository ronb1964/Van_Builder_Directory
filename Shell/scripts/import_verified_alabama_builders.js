const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Only import verified Alabama builders
const verifiedBuilders = [
    {
        name: "ALABAMA CUSTOM TRAILER & RV",
        website: "https://actrvalabama.com/",
        city: "Pelham",
        state: "Alabama",
        lat: 33.2859,
        lng: -86.8103,
        zip: "35124",
        phone: "205-624-3291",
        email: "info@actrvalabama.com",
        description: "Food Truck Builders, Trailer Customization, Parts and Services",
        specialties: "Custom trailers, RV modifications, food truck builds",
        van_types: "Custom trailers, RVs",
        services: "Custom builds, repairs, modifications",
        photos: JSON.stringify([]),
        social_media: JSON.stringify({
            facebook: "https://www.facebook.com/actrvalabama",
            instagram: "",
            youtube: "",
            tiktok: ""
        })
    },
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
