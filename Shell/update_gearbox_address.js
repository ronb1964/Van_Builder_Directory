const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'van_builders.db');

console.log('🔧 Adding address column and updating Gearbox Rentals...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Add address column if it doesn't exist
db.run(`ALTER TABLE builders ADD COLUMN address TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('❌ Error adding address column:', err);
    return;
  }
  console.log('✅ Address column ready');
  
  // Update Gearbox Rentals with the real address
  const updateSQL = `
    UPDATE builders 
    SET address = ? 
    WHERE name = ?
  `;
  
  db.run(updateSQL, ['2765 Cone Drive', 'Gearbox Adventure Rentals'], function(err) {
    if (err) {
      console.error('❌ Error updating Gearbox address:', err);
      return;
    }
    
    if (this.changes > 0) {
      console.log('✅ Updated Gearbox Adventure Rentals address');
    } else {
      console.log('⚠️ No rows updated - Gearbox Adventure Rentals not found');
    }
    
    // Verify the update
    db.get(`SELECT name, address, city, state FROM builders WHERE name = ?`, 
      ['Gearbox Adventure Rentals'], (err, row) => {
      if (err) {
        console.error('❌ Error verifying update:', err);
      } else if (row) {
        console.log('📍 Gearbox Adventure Rentals address:', `${row.address}, ${row.city}, ${row.state}`);
      } else {
        console.log('⚠️ Gearbox Adventure Rentals not found in database');
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
});
