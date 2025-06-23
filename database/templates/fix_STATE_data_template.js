const sqlite3 = require('sqlite3').verbose();

// CUSTOMIZE THIS: Data fixes for [STATE_NAME] builders
const dataFixes = [
    {
        name: 'Builder Name 1',
        issues: [
            'Describe specific issues found during scraping',
            'e.g., Address contains copyright footer',
            'e.g., Phone has wrong area code'
        ],
        fixes: {
            city: 'Correct City Name',
            address: 'Clean Street Address Only',
            zip: '12345',  // Correct ZIP code
            phone: '(XXX) XXX-XXXX',  // Correct local area code
            email: 'real@business.com',  // Replace error tracking emails
            description: 'Professional business description replacing navigation menus'
        },
        needsResearch: true,
        notes: 'What still needs manual research'
    },
    // Add more builders as needed
];

async function fixStateDataIssues() {
    console.log('🔧 Fixing [STATE_NAME] Data Issues');
    console.log('==================================');
    
    const db = new sqlite3.Database('./builders.db');
    const serverDb = new sqlite3.Database('../server/database/builders.db');
    
    let fixesApplied = 0;
    let needsResearch = 0;
    
    // First, import the raw scraped data if not already done
    console.log('📥 Importing raw [STATE_NAME] scraping results...');
    try {
        const { execSync } = require('child_process');
        execSync('sqlite3 builders.db < [state_name]_builders_with_coordinates.sql', { stdio: 'inherit' });
        execSync('sqlite3 ../server/database/builders.db < [state_name]_builders_with_coordinates.sql', { stdio: 'inherit' });
        console.log('✅ Raw data imported');
    } catch (error) {
        console.log('⚠️ Import may have failed or data already exists:', error.message);
    }
    
    // Check current state data
    console.log('\n🔍 Current [STATE_NAME] Data State:');
    console.log('=================================');
    
    const currentData = await new Promise((resolve, reject) => {
        db.all(
            "SELECT name, address, city, state, zip, phone, email, description FROM builders WHERE state = '[STATE_ABBREV]' ORDER BY name",
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
    
    console.log(`Found ${currentData.length} [STATE_NAME] builders in database`);
    currentData.forEach(builder => {
        console.log(`\n📍 ${builder.name}:`);
        console.log(`   Address: ${builder.address || 'None'}`);
        console.log(`   City: ${builder.city || 'None'}`);
        console.log(`   Phone: ${builder.phone || 'None'}`);
        console.log(`   Email: ${builder.email || 'None'}`);
        console.log(`   Description: ${builder.description ? builder.description.substring(0, 100) + '...' : 'None'}`);
    });
    
    // Apply fixes
    console.log('\n🔧 Applying Data Fixes:');
    console.log('=======================');
    
    for (const fix of dataFixes) {
        console.log(`\n📍 Processing: ${fix.name}`);
        console.log(`   Issues: ${fix.issues.join(', ')}`);
        
        const updates = [];
        const values = [];
        
        // Build dynamic update query based on available fixes
        Object.keys(fix.fixes).forEach(field => {
            if (fix.fixes[field]) {
                updates.push(`${field} = ?`);
                values.push(fix.fixes[field]);
                console.log(`   ✅ Setting ${field}: ${fix.fixes[field]}`);
            }
        });
        
        if (updates.length > 0) {
            values.push(fix.name); // For WHERE clause
            
            const updateQuery = `UPDATE builders SET ${updates.join(', ')} WHERE name = ? AND state = '[STATE_ABBREV]'`;
            
            // Update main database
            await new Promise((resolve, reject) => {
                db.run(updateQuery, values, function(err) {
                    if (err) {
                        console.log(`   ❌ Main DB update failed: ${err.message}`);
                        reject(err);
                    } else {
                        console.log(`   ✅ Main database updated (${this.changes} rows)`);
                        resolve();
                    }
                });
            });
            
            // Update server database
            await new Promise((resolve, reject) => {
                serverDb.run(updateQuery, values, function(err) {
                    if (err) {
                        console.log(`   ❌ Server DB update failed: ${err.message}`);
                        reject(err);
                    } else {
                        console.log(`   ✅ Server database updated (${this.changes} rows)`);
                        resolve();
                    }
                });
            });
            
            fixesApplied++;
        }
        
        if (fix.needsResearch) {
            console.log(`   ⚠️ Still needs manual research: ${fix.notes}`);
            needsResearch++;
        }
    }
    
    console.log('\n📊 [STATE_NAME] Fix Summary:');
    console.log('===========================');
    console.log(`   Builders processed: ${dataFixes.length}`);
    console.log(`   Fixes applied: ${fixesApplied}`);
    console.log(`   Builders needing research: ${needsResearch}`);
    
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Research actual business addresses for builders needing research');
    console.log('2. Find correct phone numbers and email addresses');
    console.log('3. Research actual social media accounts');
    console.log('4. Run social media format conversion script');
    console.log('5. Handle any photo extraction failures manually');
    console.log('6. Update CSP policy for new image domains');
    console.log('7. Test in application to verify all fixes work');
    
    console.log('\n✅ [STATE_NAME] data cleaning completed!');
    console.log('   Ready for social media format conversion');
    
    db.close();
    serverDb.close();
}

// Run the fixes
if (require.main === module) {
    fixStateDataIssues().catch(console.error);
}

module.exports = { fixStateDataIssues }; 