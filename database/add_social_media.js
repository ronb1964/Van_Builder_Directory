#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

// Social media data we extracted from the test
const socialMediaData = {
  'Camplife Customs': {
    instagram: 'https://www.instagram.com/camplifecustoms',
    facebook: 'https://www.facebook.com/CamplifeCustoms'
  },
  'SoCal Custom Vans': {
    instagram: 'https://instagram.com/socalcustomvans'
  },
  'The Good Van': {
    instagram: 'https://www.instagram.com/_thegoodvan'
  },
  'Sandy Vans': {
    facebook: 'https://www.facebook.com/sandyvansofficial',
    instagram: 'https://www.instagram.com/sandyvansofficial',
    youtube: 'https://www.youtube.com/@sandyvans'
  },
  'Outpost Vans': {
    instagram: 'https://instagram.com/outpostvans',
    youtube: 'https://youtube.com/user/UCaBBSXY-wRc40Vi1LbWk6Qw',
    facebook: 'https://facebook.com/OutpostVans',
    tiktok: 'https://www.tiktok.com/@outpostvans',
    twitter: 'https://twitter.com/outpostvans'
  }
};

async function addSocialMediaData() {
  console.log('🔄 Adding social media data to database...');
  
  try {
    // Connect to database
    const dbPath = path.join(__dirname, '../server/database/builders.db');
    const db = new Database(dbPath);
    
    // Prepare update statement
    const updateStmt = db.prepare('UPDATE builders SET social_media = ? WHERE name = ?');
    
    let updatedCount = 0;
    
    // Update each builder with social media data
    for (const [builderName, socialMedia] of Object.entries(socialMediaData)) {
      const socialMediaJson = JSON.stringify(socialMedia);
      const result = updateStmt.run(socialMediaJson, builderName);
      
      if (result.changes > 0) {
        console.log(`✅ Updated ${builderName} with ${Object.keys(socialMedia).length} social media links`);
        console.log(`   ${Object.keys(socialMedia).join(', ')}`);
        updatedCount++;
      } else {
        console.log(`⚠️ Builder not found: ${builderName}`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} builders with social media data`);
    
    // Verify the data was added
    console.log('\n🔍 Verifying social media data...');
    const verifyStmt = db.prepare('SELECT name, social_media FROM builders WHERE social_media IS NOT NULL');
    const results = verifyStmt.all();
    
    results.forEach(row => {
      const socialMedia = JSON.parse(row.social_media);
      console.log(`${row.name}: ${Object.keys(socialMedia).join(', ')}`);
    });
    
    db.close();
    console.log('\n✨ Social media data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding social media data:', error);
  }
}

addSocialMediaData().catch(console.error); 