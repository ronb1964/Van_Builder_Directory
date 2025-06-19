// Database operations for van builder scraper
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'Shell', 'server', 'van_builders.db');

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
                return;
            }
        });
        
        db.serialize(() => {
            // Create the builders table if it doesn't exist - matching existing schema
            db.run(`
                CREATE TABLE IF NOT EXISTS builders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    city TEXT NOT NULL,
                    state TEXT NOT NULL,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    zip TEXT,
                    phone TEXT,
                    email TEXT,
                    website TEXT,
                    description TEXT,
                    specialties TEXT,
                    van_types TEXT,
                    price_range_min INTEGER,
                    price_range_max INTEGER,
                    pricing_tiers TEXT,
                    amenities TEXT,
                    services TEXT,
                    certifications TEXT,
                    awards TEXT,
                    social_media TEXT,
                    photos TEXT,
                    reviews_rating REAL,
                    reviews_count INTEGER,
                    business_hours TEXT,
                    payment_methods TEXT,
                    verified BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Database initialized');
                    resolve();
                }
                db.close();
            });
        });
    });
}

function saveResultsToFile(results, state) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `van_builders_${state.toLowerCase()}_${timestamp}.json`;
    const filepath = path.join(__dirname, '..', filename);
    
    const output = {
        state: state,
        timestamp: new Date().toISOString(),
        count: results.length,
        builders: results
    };
    
    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Results saved to: ${filename}`);
    
    return filepath;
}

async function saveToDatabase(results, state) {
    if (!results || results.length === 0) {
        console.log('⚠️ No results to save to database');
        return { savedCount: 0 };
    }

    console.log(`\n💾 Saving ${results.length} builders to SQLite database...`);
    
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Database connection error:', err);
                reject(err);
                return;
            }
        });

        db.serialize(() => {
            // Prepare insert statement with all fields
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO builders (
                    name, city, state, lat, lng, zip, phone, email, website, 
                    description, specialties, van_types, price_range_min, 
                    price_range_max, pricing_tiers, amenities, services, 
                    certifications, awards, social_media, photos, reviews_rating, 
                    reviews_count, business_hours, payment_methods, verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            let savedCount = 0;
            let errorCount = 0;

            results.forEach((builder) => {
                try {
                    const data = formatBuilderForDatabase(builder, state);
                    stmt.run(
                        data.name, data.city, data.state, data.lat, data.lng,
                        data.zip, data.phone, data.email, data.website,
                        data.description, data.specialties, data.van_types,
                        data.price_range_min, data.price_range_max, data.pricing_tiers,
                        data.amenities, data.services, data.certifications,
                        data.awards, data.social_media, data.photos,
                        data.reviews_rating, data.reviews_count, data.business_hours,
                        data.payment_methods, data.verified,
                        (err) => {
                            if (err) {
                                console.error(`❌ Error saving ${builder.name}:`, err.message);
                                errorCount++;
                            } else {
                                console.log(`✅ Saved: ${builder.name}`);
                                savedCount++;
                            }
                        }
                    );
                } catch (error) {
                    console.error(`❌ Error formatting ${builder.name}:`, error.message);
                    errorCount++;
                }
            });

            stmt.finalize((err) => {
                if (err) {
                    console.error('❌ Error finalizing statement:', err);
                }
                
                console.log(`\n✅ Database save complete: ${savedCount} saved, ${errorCount} errors`);
                
                db.close((closeErr) => {
                    if (closeErr) {
                        console.error('❌ Error closing database:', closeErr);
                    }
                    resolve({ savedCount });
                });
            });
        });
    });
}

function formatBuilderForDatabase(builder, state) {
    // Generate basic coordinates if not provided (will be geocoded later)
    let lat = builder.lat || 0;
    let lng = builder.lng || 0;
    
    // If we have city but no coordinates, use approximate state center
    if (!builder.lat && !builder.lng && state === 'Rhode Island') {
        lat = 41.5801;  // Rhode Island approximate center
        lng = -71.4774;
    }
    
    // Ensure all required fields exist
    const formatted = {
        name: builder.name || 'Unknown Builder',
        city: builder.city || state,  // Use state as city if not provided
        state: state,
        lat: lat,
        lng: lng,
        zip: builder.zip || '',
        phone: builder.phone || '',
        email: builder.email || '',
        website: builder.website || '',
        description: builder.description || '',
        specialties: JSON.stringify(builder.specialties || []),
        van_types: JSON.stringify(builder.van_types || []),
        price_range_min: builder.price_range_min || null,
        price_range_max: builder.price_range_max || null,
        pricing_tiers: JSON.stringify(builder.pricing_tiers || []),
        amenities: JSON.stringify(builder.amenities || []),
        services: JSON.stringify(builder.services || []),
        certifications: JSON.stringify(builder.certifications || []),
        awards: JSON.stringify(builder.awards || []),
        social_media: JSON.stringify(builder.social_media || {}),
        photos: JSON.stringify(formatGalleryForDatabase(builder.photos || [])),
        reviews_rating: builder.reviews_rating || null,
        reviews_count: builder.reviews_count || 0,
        business_hours: JSON.stringify(builder.business_hours || {}),
        payment_methods: JSON.stringify(builder.payment_methods || []),
        verified: builder.verified || 0
    };
    
    return formatted;
}

function formatGalleryForDatabase(photos) {
    // Convert photo URLs to the gallery format expected by the database
    if (Array.isArray(photos)) {
        return photos.map(photo => {
            if (typeof photo === 'string') {
                return {
                    url: photo,
                    alt: 'Van conversion photo'
                };
            }
            return photo;
        });
    }
    return [];
}

async function loadExistingData(state) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.log('📊 No existing database found');
                resolve([]);
                return;
            }
        });
        
        db.all(
            'SELECT * FROM builders WHERE state = ?',
            [state],
            (err, rows) => {
                if (err) {
                    console.log('📊 No existing data found for state');
                    resolve([]);
                } else {
                    console.log(`📊 Found ${rows.length} existing builders for ${state}`);
                    resolve(rows);
                }
                db.close();
            }
        );
    });
}

module.exports = {
    initializeDatabase,
    saveResultsToFile,
    saveToDatabase,
    formatBuilderForDatabase,
    loadExistingData
};
