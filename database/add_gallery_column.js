const Database = require('../Shell/server/database.js');

async function addGalleryColumn() {
  const db = new Database();
  
  try {
    // Wait for database to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Checking database schema...');
    
    const columns = await new Promise((resolve, reject) => {
      db.db.all('PRAGMA table_info(builders)', (err, columns) => {
        if (err) reject(err);
        else resolve(columns);
      });
    });
    
    console.log('Current database columns:');
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    // Check if gallery column exists
    const hasGallery = columns.some(col => col.name === 'gallery');
    
    if (!hasGallery) {
      console.log('\n❌ Gallery column missing! Adding it...');
      
      await new Promise((resolve, reject) => {
        db.db.run('ALTER TABLE builders ADD COLUMN gallery TEXT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log('✅ Gallery column added successfully!');
    } else {
      console.log('\n✅ Gallery column already exists');
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    db.close();
  }
}

addGalleryColumn();
