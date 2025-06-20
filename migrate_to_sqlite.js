const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Paths
const JSON_FILE = path.join(__dirname, 'public/data/builders.json');
const DB_PATH = path.join(__dirname, 'server/database/builders.db');
const SCHEMA_FILE = path.join(__dirname, 'server/schema.sql');

console.log('🚀 Starting JSON to SQLite migration...');
console.log(`📂 JSON Source: ${JSON_FILE}`);
console.log(`🗄️ SQLite Target: ${DB_PATH}`);

// Create database directory if it doesn't exist
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(DB_PATH);

// Helper function to run SQL with promise
function runSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

// Helper function to get data with promise
function getSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Helper function to get all data with promise
function getAllSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to get or create lookup table entry
async function getOrCreateLookupId(table, name) {
  if (!name || name.trim() === '') return null;
  
  // Try to get existing
  const existing = await getSQL(`SELECT id FROM ${table} WHERE name = ?`, [name.trim()]);
  if (existing) {
    return existing.id;
  }
  
  // Create new
  const result = await runSQL(`INSERT INTO ${table} (name) VALUES (?)`, [name.trim()]);
  return result.lastID;
}

async function migrate() {
  try {
    // 1. Create schema
    console.log('📋 Creating database schema...');
    const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await runSQL(statement + ';');
      }
    }
    console.log('✅ Schema created successfully');

    // 2. Load JSON data
    console.log('📖 Loading JSON data...');
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    console.log(`📊 Found ${jsonData.length} builders to migrate`);

    // 3. Migrate each builder
    let migratedCount = 0;
    
    for (const builder of jsonData) {
      console.log(`🔄 Migrating: ${builder.name} (${builder.location?.state || 'No State'})`);
      
      // Insert main builder record
      await runSQL(`
        INSERT OR REPLACE INTO builders (
          id, name, city, state, lat, lng, zip, phone, email, website, 
          description, price_min, price_max, lead_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        builder.id,
        builder.name,
        builder.location?.city || '',
        builder.location?.state || '',
        builder.location?.lat || null,
        builder.location?.lng || null,
        builder.location?.zip || null,
        builder.phone || null,
        builder.email || null,
        builder.website || null,
        builder.description || '',
        builder.priceRange?.min || null,
        builder.priceRange?.max || null,
        builder.leadTime || null
      ]);

      // Van Types
      if (builder.vanTypes && Array.isArray(builder.vanTypes)) {
        for (const vanType of builder.vanTypes) {
          const vanTypeId = await getOrCreateLookupId('van_types', vanType);
          if (vanTypeId) {
            await runSQL(`
              INSERT OR IGNORE INTO builder_van_types (builder_id, van_type_id) 
              VALUES (?, ?)
            `, [builder.id, vanTypeId]);
          }
        }
      }

      // Amenities
      if (builder.amenities && Array.isArray(builder.amenities)) {
        for (const amenity of builder.amenities) {
          const amenityId = await getOrCreateLookupId('amenities', amenity);
          if (amenityId) {
            await runSQL(`
              INSERT OR IGNORE INTO builder_amenities (builder_id, amenity_id) 
              VALUES (?, ?)
            `, [builder.id, amenityId]);
          }
        }
      }

      // Services
      if (builder.services && Array.isArray(builder.services)) {
        for (const service of builder.services) {
          const serviceId = await getOrCreateLookupId('services', service);
          if (serviceId) {
            await runSQL(`
              INSERT OR IGNORE INTO builder_services (builder_id, service_id) 
              VALUES (?, ?)
            `, [builder.id, serviceId]);
          }
        }
      }

      // Certifications
      if (builder.certifications && Array.isArray(builder.certifications)) {
        for (const cert of builder.certifications) {
          const certId = await getOrCreateLookupId('certifications', cert);
          if (certId) {
            await runSQL(`
              INSERT OR IGNORE INTO builder_certifications (builder_id, certification_id) 
              VALUES (?, ?)
            `, [builder.id, certId]);
          }
        }
      }

      // Social Media
      if (builder.socialMedia) {
        await runSQL(`
          INSERT OR REPLACE INTO builder_social_media (
            builder_id, facebook, instagram, youtube, twitter, tiktok
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          builder.id,
          builder.socialMedia.facebook || null,
          builder.socialMedia.instagram || null,
          builder.socialMedia.youtube || null,
          builder.socialMedia.twitter || null,
          builder.socialMedia.tiktok || null
        ]);
      }

      // Gallery
      if (builder.gallery && Array.isArray(builder.gallery)) {
        for (let i = 0; i < builder.gallery.length; i++) {
          const photo = builder.gallery[i];
          await runSQL(`
            INSERT INTO builder_gallery (
              builder_id, url, alt_text, caption, sort_order
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            builder.id,
            photo.url,
            photo.alt || '',
            photo.caption || '',
            i
          ]);
        }
      }

      migratedCount++;
    }

    // 4. Verify migration
    console.log('🔍 Verifying migration...');
    const totalBuilders = await getSQL('SELECT COUNT(*) as count FROM builders');
    const stateBreakdown = await getAllSQL(`
      SELECT state, COUNT(*) as count 
      FROM builders 
      GROUP BY state 
      ORDER BY state
    `);

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated ${migratedCount} builders`);
    console.log(`🗄️ Database now contains ${totalBuilders.count} total builders`);
    console.log('\n📍 Builders by state:');
    stateBreakdown.forEach(row => {
      console.log(`   ${row.state}: ${row.count} builders`);
    });

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run migration
if (require.main === module) {
  migrate().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { migrate }; 