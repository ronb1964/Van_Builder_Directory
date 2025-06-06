const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'van_builders.db');

console.log('🔧 Updating Storyteller Overland address...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Update Storyteller Overland with the real address
const updateSQL = `
  UPDATE builders 
  SET address = ? 
  WHERE name = ?
`;

db.run(updateSQL, ['428 Industrial Lane', 'Storyteller Overland'], function(err) {
  if (err) {
    console.error('❌ Error updating Storyteller address:', err);
    return;
  }
  
  if (this.changes > 0) {
    console.log('✅ Updated Storyteller Overland address');
  } else {
    console.log('⚠️ No rows updated - Storyteller Overland not found');
  }
  
  // Verify the update
  db.get(`SELECT name, address, city, state FROM builders WHERE name = ?`, 
    ['Storyteller Overland'], (err, row) => {
    if (err) {
      console.error('❌ Error verifying update:', err);
    } else if (row) {
      console.log('📍 Storyteller Overland address:', `${row.address}, ${row.city}, ${row.state}`);
    } else {
      console.log('⚠️ Storyteller Overland not found in database');
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
