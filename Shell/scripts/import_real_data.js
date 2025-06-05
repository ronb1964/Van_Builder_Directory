const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path to the real data file
const realDataPath = path.join(__dirname, '../../camper-van-builders/Backup/backup_2025-06-01_17-54-14_Before-Alaska-Research/builders-legitimate-only.json');
const dbPath = path.join(__dirname, '../server/van_builders.db');

// Global counters
let imported = 0;
let errors = 0;

console.log('🔄 Starting real data import...');

// Read the real builders data
let buildersData;
try {
  const rawData = fs.readFileSync(realDataPath, 'utf8');
  buildersData = JSON.parse(rawData);
  console.log(`📊 Found ${buildersData.length} legitimate builders to import`);
} catch (error) {
  console.error('❌ Error reading real data file:', error);
  process.exit(1);
}

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Clear existing fake data
db.run('DELETE FROM builders', (err) => {
  if (err) {
    console.error('❌ Error clearing fake data:', err);
    return;
  }
  console.log('🗑️  Cleared all existing fake data from database');
  
  // Reset auto-increment counter
  db.run('DELETE FROM sqlite_sequence WHERE name="builders"', (err) => {
    if (err) {
      console.log('ℹ️  No auto-increment sequence to reset');
    } else {
      console.log('🔄 Reset auto-increment sequence');
    }
    
    // Import real data
    importRealData();
  });
});

function importRealData() {
  const insertSQL = `
    INSERT INTO builders (
      name, city, state, lat, lng, zip, phone, email, website,
      description, van_types, price_range_min, price_range_max,
      amenities, services, certifications, lead_time, social_media
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const stmt = db.prepare(insertSQL);

  buildersData.forEach((builder, index) => {
    try {
      // Convert arrays to JSON strings for storage
      const vanTypes = Array.isArray(builder.vanTypes) ? builder.vanTypes.join('|') : '';
      const amenities = Array.isArray(builder.amenities) ? builder.amenities.join('|') : '';
      const services = Array.isArray(builder.services) ? builder.services.join('|') : '';
      const certifications = Array.isArray(builder.certifications) ? builder.certifications.join('|') : '';
      const socialMedia = builder.socialMedia ? JSON.stringify(builder.socialMedia) : '';

      stmt.run([
        builder.name || '',
        builder.location?.city || '',
        builder.location?.state || '',
        builder.location?.lat || 0,
        builder.location?.lng || 0,
        builder.location?.zip || '',
        builder.phone || '',
        builder.email || '',
        builder.website || '',
        builder.description || '',
        vanTypes,
        builder.priceRange?.min || 0,
        builder.priceRange?.max || 0,
        amenities,
        services,
        certifications,
        builder.leadTime || '',
        socialMedia
      ], function(err) {
        if (err) {
          console.error(`❌ Error importing builder ${builder.name}:`, err);
          errors++;
        } else {
          imported++;
          console.log(`✅ Imported: ${builder.name} (${builder.location?.city}, ${builder.location?.state})`);
        }

        // Check if this is the last builder
        if (imported + errors === buildersData.length) {
          finishImport();
        }
      });
    } catch (error) {
      console.error(`❌ Error processing builder ${builder.name}:`, error);
      errors++;
      
      if (imported + errors === buildersData.length) {
        finishImport();
      }
    }
  });

  stmt.finalize();
}

function finishImport() {
  console.log('\n📈 Import Summary:');
  console.log(`✅ Successfully imported: ${imported} builders`);
  console.log(`❌ Errors: ${errors} builders`);
  console.log(`📊 Total processed: ${imported + errors} builders`);
  
  // Verify the import
  db.get('SELECT COUNT(*) as count FROM builders', (err, row) => {
    if (err) {
      console.error('❌ Error verifying import:', err);
    } else {
      console.log(`🔍 Database now contains: ${row.count} builders`);
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
        console.log('🎉 Real data import completed successfully!');
      }
    });
  });
}
