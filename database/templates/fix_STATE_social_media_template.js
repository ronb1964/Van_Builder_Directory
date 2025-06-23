const sqlite3 = require('sqlite3').verbose();

// CUSTOMIZE: Enter state abbreviation for the state you're processing
const STATE_ABBREV = 'XX';  // e.g., 'TX', 'FL', 'CO'
const STATE_NAME = 'STATE_NAME';  // e.g., 'Texas', 'Florida', 'Colorado'

async function fixSocialMediaFormat() {
    console.log(`🔄 Converting ${STATE_NAME} Social Media to Object Format`);
    console.log('=======================================================');
    
    const db = new sqlite3.Database('./builders.db');
    const serverDb = new sqlite3.Database('../server/database/builders.db');
    
    let conversionsApplied = 0;
    
    // Get current state builders with array-format social media
    console.log(`📋 Finding ${STATE_NAME} builders with array-format social media...`);
    
    const builders = await new Promise((resolve, reject) => {
        db.all(
            `SELECT name, social_media FROM builders WHERE state = ? AND social_media IS NOT NULL AND social_media != ''`,
            [STATE_ABBREV],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
    
    console.log(`Found ${builders.length} ${STATE_NAME} builders with social media data`);
    
    for (const builder of builders) {
        console.log(`\n🔍 Processing: ${builder.name}`);
        
        let socialMediaData;
        try {
            socialMediaData = JSON.parse(builder.social_media);
        } catch (error) {
            console.log(`   ⚠️ Invalid JSON in social_media field: ${builder.social_media}`);
            continue;
        }
        
        // Check if it's already in object format
        if (!Array.isArray(socialMediaData)) {
            console.log('   ✅ Already in object format - skipping');
            continue;
        }
        
        // Convert array to object format
        const socialMediaObject = {};
        
        for (const url of socialMediaData) {
            if (typeof url === 'string' && url.includes('http')) {
                // Determine platform based on URL
                if (url.includes('facebook.com') || url.includes('fb.com')) {
                    socialMediaObject.facebook = url;
                } else if (url.includes('instagram.com')) {
                    socialMediaObject.instagram = url;
                } else if (url.includes('youtube.com')) {
                    socialMediaObject.youtube = url;
                } else if (url.includes('twitter.com')) {
                    socialMediaObject.twitter = url;
                } else if (url.includes('linkedin.com')) {
                    socialMediaObject.linkedin = url;
                } else if (url.includes('tiktok.com')) {
                    socialMediaObject.tiktok = url;
                } else {
                    console.log(`   ⚠️ Unknown platform: ${url}`);
                }
            }
        }
        
        console.log(`   📱 Converting array (${socialMediaData.length} items) to object (${Object.keys(socialMediaObject).length} platforms)`);
        console.log(`   📱 Platforms: ${Object.keys(socialMediaObject).join(', ')}`);
        
        const newSocialMediaJson = JSON.stringify(socialMediaObject);
        
        // Update both databases
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE builders SET social_media = ? WHERE name = ? AND state = ?`,
                [newSocialMediaJson, builder.name, STATE_ABBREV],
                function(err) {
                    if (err) {
                        console.log(`   ❌ Main DB update failed: ${err.message}`);
                        reject(err);
                    } else {
                        console.log(`   ✅ Main database updated`);
                        resolve();
                    }
                }
            );
        });
        
        await new Promise((resolve, reject) => {
            serverDb.run(
                `UPDATE builders SET social_media = ? WHERE name = ? AND state = ?`,
                [newSocialMediaJson, builder.name, STATE_ABBREV],
                function(err) {
                    if (err) {
                        console.log(`   ❌ Server DB update failed: ${err.message}`);
                        reject(err);
                    } else {
                        console.log(`   ✅ Server database updated`);
                        resolve();
                    }
                }
            );
        });
        
        conversionsApplied++;
    }
    
    console.log(`\n📊 ${STATE_NAME} Social Media Conversion Summary:`);
    console.log('===============================================');
    console.log(`   Builders processed: ${builders.length}`);
    console.log(`   Conversions applied: ${conversionsApplied}`);
    console.log(`   Already in correct format: ${builders.length - conversionsApplied}`);
    
    // Verify the conversions
    console.log(`\n🔍 Verifying ${STATE_NAME} Social Media Format:`);
    console.log('==============================================');
    
    const verifyBuilders = await new Promise((resolve, reject) => {
        db.all(
            `SELECT name, social_media FROM builders WHERE state = ? AND social_media IS NOT NULL AND social_media != ''`,
            [STATE_ABBREV],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
    
    let objectFormatCount = 0;
    let arrayFormatCount = 0;
    
    for (const builder of verifyBuilders) {
        try {
            const socialData = JSON.parse(builder.social_media);
            if (Array.isArray(socialData)) {
                arrayFormatCount++;
                console.log(`   ❌ ${builder.name}: Still in array format`);
            } else {
                objectFormatCount++;
                console.log(`   ✅ ${builder.name}: Object format (${Object.keys(socialData).length} platforms)`);
            }
        } catch (error) {
            console.log(`   ⚠️ ${builder.name}: Invalid JSON format`);
        }
    }
    
    console.log(`\n📋 Final Status:`);
    console.log(`   Object format: ${objectFormatCount} builders`);
    console.log(`   Array format: ${arrayFormatCount} builders`);
    
    if (arrayFormatCount === 0) {
        console.log(`\n✅ ${STATE_NAME} social media conversion completed successfully!`);
        console.log('   All social media data is now in the correct object format for the UI');
    } else {
        console.log(`\n⚠️ ${arrayFormatCount} builders still need manual conversion`);
    }
    
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Test the application to verify social media icons display correctly');
    console.log('2. Handle any builders with failed photo extraction');
    console.log('3. Update CSP policy for new image domains');
    console.log('4. Move to next state following the same workflow');
    
    db.close();
    serverDb.close();
}

// Run the conversion
if (require.main === module) {
    fixSocialMediaFormat().catch(console.error);
}

module.exports = { fixSocialMediaFormat }; 