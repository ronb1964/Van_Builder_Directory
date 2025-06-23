const sqlite3 = require('sqlite3').verbose();

async function syncCleanAddresses() {
    console.log('🔄 Syncing Clean Address Data');
    console.log('=============================');
    
    const mainDb = new sqlite3.Database('./builders.db');
    const serverDb = new sqlite3.Database('../server/database/builders.db');
    
    try {
        // Get all builders from main database (clean data)
        const mainBuilders = await new Promise((resolve, reject) => {
            mainDb.all(
                "SELECT name, address, city, state, zip FROM builders WHERE state = 'CA' ORDER BY name",
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        // Get all builders from server database (potentially corrupted data)
        const serverBuilders = await new Promise((resolve, reject) => {
            serverDb.all(
                "SELECT name, address, city, state, zip FROM builders WHERE state = 'CA' ORDER BY name",
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        console.log('\n🔍 Comparing Databases:');
        console.log('=======================');
        
        let fixesNeeded = 0;
        let updatesApplied = 0;
        
        for (const mainBuilder of mainBuilders) {
            const serverBuilder = serverBuilders.find(sb => sb.name === mainBuilder.name);
            
            if (!serverBuilder) {
                console.log(`⚠️  ${mainBuilder.name}: Missing from server database`);
                continue;
            }
            
            // Check if addresses differ
            if (mainBuilder.address !== serverBuilder.address) {
                console.log(`\n🔧 ${mainBuilder.name}:`);
                console.log(`   Main DB:   "${mainBuilder.address || 'EMPTY'}"`);
                console.log(`   Server DB: "${serverBuilder.address || 'EMPTY'}"`);
                
                fixesNeeded++;
                
                // Update server database with clean data
                await new Promise((resolve, reject) => {
                    serverDb.run(
                        "UPDATE builders SET address = ?, city = ?, state = ?, zip = ? WHERE name = ?",
                        [mainBuilder.address, mainBuilder.city, mainBuilder.state, mainBuilder.zip, mainBuilder.name],
                        function(err) {
                            if (err) {
                                console.log(`   ❌ Failed to update`);
                                reject(err);
                            } else {
                                console.log(`   ✅ Updated successfully`);
                                updatesApplied++;
                                resolve();
                            }
                        }
                    );
                });
            }
        }
        
        console.log('\n📊 Sync Summary:');
        console.log(`   Fixes needed: ${fixesNeeded}`);
        console.log(`   Updates applied: ${updatesApplied}`);
        
        // Verify the fixes
        console.log('\n🔍 Verification:');
        console.log('================');
        
        const verifiedBuilders = await new Promise((resolve, reject) => {
            serverDb.all(
                "SELECT name, address, city, state, zip FROM builders WHERE state = 'CA' ORDER BY name",
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        let cleanBuilders = 0;
        let stillHaveIssues = 0;
        
        verifiedBuilders.forEach(builder => {
            const hasIssues = builder.address && (
                builder.address.includes(builder.city) ||
                builder.address.includes(builder.state) ||
                builder.address.length > 50 ||
                /^\d{5}/.test(builder.address) // Starts with zip code
            );
            
            if (hasIssues) {
                console.log(`   ⚠️  ${builder.name}: Still has address issues`);
                stillHaveIssues++;
            } else {
                cleanBuilders++;
            }
        });
        
        console.log(`\n✅ Clean addresses: ${cleanBuilders}/${verifiedBuilders.length}`);
        console.log(`⚠️  Still have issues: ${stillHaveIssues}`);
        
        if (stillHaveIssues === 0) {
            console.log('\n🎉 All California addresses are now clean!');
        }
        
    } catch (error) {
        console.error('❌ Error during sync:', error);
    } finally {
        mainDb.close();
        serverDb.close();
    }
}

// Run the sync
if (require.main === module) {
    syncCleanAddresses().catch(console.error);
}

module.exports = { syncCleanAddresses }; 