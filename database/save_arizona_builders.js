#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Read the JSON file
const jsonFile = 'van_builders_arizona_2025-06-07T01-27-08-811Z.json';
const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

console.log(`📄 Loading ${data.total_builders} builders from ${jsonFile}`);

// Connect to database
const dbPath = path.join(__dirname, '..', 'Shell', 'server', 'van_builders.db');
const db = new sqlite3.Database(dbPath);

// Promisify database operations
const runAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes, lastID: this.lastID });
        });
    });
};

const closeAsync = () => {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

async function saveBuilders() {
    try {
        // Remove existing Arizona builders
        const deleteResult = await runAsync('DELETE FROM builders WHERE state = ?', ['Arizona']);
        console.log(`🗑️ Removed ${deleteResult.changes} existing Arizona builders`);

        let insertedCount = 0;
        
        for (const builder of data.builders) {
            try {
                // Extract city from address or use empty string
                const city = builder.city || '';
                
                // Use default coordinates (will need geocoding later)
                const lat = 0.0;
                const lng = 0.0;
                
                // Format photos for gallery field
                const gallery = (builder.photos || []).map(photo => ({
                    url: photo.url,
                    alt: photo.alt || photo.url.split('/').pop() || 'Van build image',
                    caption: photo.caption || ''
                }));
                
                await runAsync(`
                    INSERT INTO builders (
                        name, city, state, lat, lng, zip, phone, email, website, 
                        description, van_types, amenities, gallery, social_media, address
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    builder.name,
                    city,
                    'Arizona',
                    lat,
                    lng,
                    builder.zip || '',
                    builder.phone || '',
                    builder.email || '',
                    builder.website || '',
                    builder.description || '',
                    JSON.stringify(builder.van_types || []),
                    JSON.stringify(builder.amenities || []),
                    JSON.stringify(gallery),
                    JSON.stringify(builder.social_media || []),
                    builder.address || ''
                ]);
                
                insertedCount++;
                console.log(`✅ Inserted: ${builder.name}`);
                
            } catch (error) {
                console.error(`❌ Error inserting ${builder.name}:`, error.message);
            }
        }
        
        console.log(`\n🎉 Successfully inserted ${insertedCount} Arizona builders into database!`);
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await closeAsync();
    }
}

saveBuilders();
