const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'van_builders.db');

console.log('🔧 Updating Vulcan Coach address...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Update Vulcan Coach with the real address
const updateSQL = `
  UPDATE builders 
  SET address = ? 
  WHERE name = ?
`;

db.run(updateSQL, ['614 Woodward Road', 'Vulcan Coach'], function(err) {
  if (err) {
    console.error('❌ Error updating Vulcan address:', err);
    return;
  }
  
  if (this.changes > 0) {
    console.log('✅ Updated Vulcan Coach address');
  } else {
    console.log('⚠️ No rows updated - Vulcan Coach not found');
  }
  
  // Verify the update
  db.get(`SELECT name, address, city, state FROM builders WHERE name = ?`, 
    ['Vulcan Coach'], (err, row) => {
    if (err) {
      console.error('❌ Error verifying update:', err);
    } else if (row) {
      console.log('📍 Vulcan Coach address:', `${row.address}, ${row.city}, ${row.state}`);
    } else {
      console.log('⚠️ Vulcan Coach not found in database');
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  });
});
