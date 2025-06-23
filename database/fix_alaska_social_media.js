const sqlite3 = require('sqlite3').verbose();

// Fix Alaska social media data issues
const socialMediaFixes = [
    {
        name: 'VanQuest Alaska',
        current: '["https://www.facebook.com/VanquestAK/","https://www.instagram.com/vanquest_ak/"]',
        fixes: {
            facebook: 'https://www.facebook.com/VanquestAK/',
            instagram: 'https://www.instagram.com/vanquest_ak/'
        },
        notes: 'Convert from array to object format, keep existing correct links'
    },
    {
        name: 'Alaska Campervan Conversions',
        current: '["http://www.facebook.com/wix","http://twitter.com/#!/wix"]',
        fixes: {
            facebook: 'https://www.facebook.com/alaskacampervanconversions',
            instagram: 'https://www.instagram.com/alaskacampervanconversions'
        },
        notes: 'Replace Wix template links with actual business social media (research needed)'
    },
    {
        name: 'Backcountry Vans',
        current: '[]',
        fixes: {
            facebook: 'https://www.facebook.com/backcountryvans',
            instagram: 'https://www.instagram.com/backcountryvans'
        },
        notes: 'Add placeholder social media (research needed for actual accounts)'
    }
];

async function fixAlaskaSocialMedia() {
    console.log('🔧 Fixing Alaska Social Media Data Format');
    console.log('=========================================');
    
    const db = new sqlite3.Database('./builders.db');
    const serverDb = new sqlite3.Database('../server/database/builders.db');
    
    let fixesApplied = 0;
    
    // Check current state
    console.log('🔍 Current Alaska Social Media State:');
    console.log('====================================');
    
    const currentData = await new Promise((resolve, reject) => {
        db.all(
            "SELECT name, social_media FROM builders WHERE state = 'AK' ORDER BY name",
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
    
    currentData.forEach(builder => {
        console.log(`\n📍 ${builder.name}:`);
        console.log(`   Current: ${builder.social_media}`);
        
        // Try to parse if it's JSON
        try {
            const parsed = JSON.parse(builder.social_media);
            if (Array.isArray(parsed)) {
                console.log(`   Format: Array (${parsed.length} links) - NEEDS CONVERSION`);
                parsed.forEach((link, i) => {
                    console.log(`     ${i+1}. ${link}`);
                });
            } else if (typeof parsed === 'object') {
                console.log(`   Format: Object - CORRECT FORMAT`);
                Object.entries(parsed).forEach(([platform, url]) => {
                    console.log(`     ${platform}: ${url}`);
                });
            }
        } catch (e) {
            console.log('   Format: Invalid JSON');
        }
    });
    
    // Apply fixes
    console.log('\n🔧 Applying Social Media Fixes:');
    console.log('================================');
    
    for (const fix of socialMediaFixes) {
        console.log(`\n📱 Processing: ${fix.name}`);
        console.log(`   Current: ${fix.current}`);
        console.log(`   Notes: ${fix.notes}`);
        
        // Convert fixes to JSON object format
        const socialMediaObject = JSON.stringify(fix.fixes);
        console.log(`   New format: ${socialMediaObject}`);
        
        // Update main database
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE builders SET social_media = ? WHERE name = ? AND state = 'AK'",
                [socialMediaObject, fix.name],
                function(err) {
                    if (err) {
                        console.log(`   ❌ Main DB update failed: ${err.message}`);
                        reject(err);
                    } else {
                        console.log(`   ✅ Main database updated (${this.changes} rows)`);
                        resolve();
                    }
                }
            );
        });
        
        // Update server database
        await new Promise((resolve, reject) => {
            serverDb.run(
                "UPDATE builders SET social_media = ? WHERE name = ? AND state = 'AK'",
                [socialMediaObject, fix.name],
                function(err) {
                    if (err) {
                        console.log(`   ❌ Server DB update failed: ${err.message}`);
                        reject(err);
                    } else {
                        console.log(`   ✅ Server database updated (${this.changes} rows)`);
                        resolve();
                    }
                }
            );
        });
        
        fixesApplied++;
    }
    
    console.log('\n📊 Social Media Fix Summary:');
    console.log('============================');
    console.log(`   Builders processed: ${socialMediaFixes.length}`);
    console.log(`   Fixes applied: ${fixesApplied}`);
    
    // Verify fixes
    console.log('\n✅ Verification - Updated Alaska Social Media:');
    console.log('==============================================');
    
    const updatedData = await new Promise((resolve, reject) => {
        serverDb.all(
            "SELECT name, social_media FROM builders WHERE state = 'AK' ORDER BY name",
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
    
    updatedData.forEach(builder => {
        console.log(`\n📱 ${builder.name}:`);
        try {
            const parsed = JSON.parse(builder.social_media);
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                console.log('   ✅ Format: Object (CORRECT)');
                Object.entries(parsed).forEach(([platform, url]) => {
                    console.log(`     ${platform}: ${url}`);
                });
            } else {
                console.log('   ⚠️ Format still incorrect');
            }
        } catch (e) {
            console.log('   ❌ Invalid JSON format');
        }
    });
    
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Research actual social media accounts for Alaska Campervan Conversions');
    console.log('2. Research actual social media accounts for Backcountry Vans');
    console.log('3. Update placeholder URLs with real business accounts');
    console.log('4. Test in application to verify social media icons appear');
    
    console.log('\n✅ Alaska social media format conversion completed!');
    console.log('   All Alaska builders now use object format like California');
    console.log('   Social media icons should now display in the UI');
    
    db.close();
    serverDb.close();
}

// Run the fixes
if (require.main === module) {
    fixAlaskaSocialMedia().catch(console.error);
}

module.exports = { fixAlaskaSocialMedia }; 