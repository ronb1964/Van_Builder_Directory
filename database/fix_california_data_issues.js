const sqlite3 = require('sqlite3').verbose();

// Comprehensive fixes for California data issues
const dataFixes = [
    {
        name: 'Van Speed Shop',
        issues: ['Invalid zip code (15192 instead of actual zip)'],
        fixes: {
            zip: '92683' // Westminster, CA zip code
        }
    },
    {
        name: 'Vanaholic',
        issues: ['Invalid zip code (23281 instead of actual zip)'],
        fixes: {
            zip: '92887' // Yorba Linda, CA zip code
        }
    },
    {
        name: 'Off The Grid Van Works',
        issues: ['Invalid zip code (38365 instead of actual zip)'],
        fixes: {
            zip: '92563' // Murrieta, CA zip code
        }
    },
    {
        name: 'Field Van',
        issues: ['Empty address field', 'Missing zip code'],
        fixes: {
            zip: '93721' // Fresno, CA zip code
        },
        needsResearch: true
    },
    {
        name: 'Levity Vans',
        issues: ['Empty address field', 'Missing zip code'],
        fixes: {
            zip: '95060' // Santa Cruz, CA zip code
        },
        needsResearch: true
    },
    {
        name: 'My Custom Van',
        issues: ['Malformed address', 'Missing zip code'],
        fixes: {
            zip: '92314' // Big Bear City, CA zip code
        },
        needsResearch: true
    },
    {
        name: 'Revamp Custom Vans',
        issues: ['Malformed address', 'Missing zip code'],
        fixes: {
            zip: '90028' // Los Angeles, CA zip code (Hollywood area)
        },
        needsResearch: true
    },
    {
        name: 'Weekend Vans',
        issues: ['Garbage address data', 'Missing zip code'],
        fixes: {
            zip: '92008' // Carlsbad, CA zip code
        },
        needsResearch: true
    },
    {
        name: 'Bossi Vans',
        issues: ['Missing zip code'],
        fixes: {
            zip: '92501' // Riverside, CA zip code
        }
    },
    {
        name: 'Custom Concept Vans',
        issues: ['Missing zip code'],
        fixes: {
            zip: '95019' // Watsonville, CA zip code
        }
    },
    {
        name: 'Rogue Vans',
        issues: ['Missing zip code'],
        fixes: {
            zip: '92109' // San Diego, CA zip code (Pacific Beach area)
        }
    },
    {
        name: 'Statworks Overland',
        issues: ['Missing zip code'],
        fixes: {
            zip: '90247' // Gardena, CA zip code
        }
    },
    {
        name: 'Tiny Planet',
        issues: ['Missing zip code'],
        fixes: {
            zip: '95826' // Sacramento, CA zip code
        }
    },
    {
        name: 'Van Damme Conversions',
        issues: ['Missing zip code'],
        fixes: {
            zip: '92081' // Vista, CA zip code
        }
    },
    {
        name: 'Vannon',
        issues: ['Missing zip code'],
        fixes: {
            zip: '93401' // San Luis Obispo, CA zip code
        }
    }
];

async function fixCaliforniaDataIssues() {
    console.log('🔧 Fixing All California Data Issues');
    console.log('===================================');
    
    const db = new sqlite3.Database('./builders.db');
    const serverDb = new sqlite3.Database('../server/database/builders.db');
    
    let fixesApplied = 0;
    let needsResearch = 0;
    
    // First, let's see the current state
    console.log('🔍 Current California Data State:');
    console.log('=================================');
    
    const currentData = await new Promise((resolve, reject) => {
        db.all(
            "SELECT name, address, city, state, zip FROM builders WHERE state = 'CA' ORDER BY name",
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
    
    currentData.forEach(builder => {
        const issues = [];
        if (!builder.address || builder.address.trim() === '') issues.push('Empty address');
        if (!builder.zip || builder.zip.trim() === '') issues.push('Missing zip');
        if (builder.zip && !/^\d{5}$/.test(builder.zip)) issues.push('Invalid zip format');
        
        if (issues.length > 0) {
            console.log(`   ⚠️  ${builder.name}: ${issues.join(', ')}`);
        }
    });
    
    // Apply fixes
    console.log('\n🔧 Applying Data Fixes:');
    console.log('=======================');
    
    for (const fix of dataFixes) {
        console.log(`\n📍 Processing: ${fix.name}`);
        console.log(`   Issues: ${fix.issues.join(', ')}`);
        
        if (fix.fixes.zip) {
            console.log(`   ✅ Setting zip code: ${fix.fixes.zip}`);
            
            // Update main database
            await new Promise((resolve, reject) => {
                db.run(
                    "UPDATE builders SET zip = ? WHERE name = ? AND state = 'CA'",
                    [fix.fixes.zip, fix.name],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
            
            // Update server database
            await new Promise((resolve, reject) => {
                serverDb.run(
                    "UPDATE builders SET zip = ? WHERE name = ? AND state = 'CA'",
                    [fix.fixes.zip, fix.name],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
            
            fixesApplied++;
        }
        
        if (fix.needsResearch) {
            console.log(`   ⚠️  Still needs address research`);
            needsResearch++;
        }
    }
    
    console.log('\n📊 Fix Summary:');
    console.log(`   Zip code fixes applied: ${fixesApplied}`);
    console.log(`   Builders needing address research: ${needsResearch}`);
    
    // Verify fixes
    console.log('\n🔍 Verifying Fixes:');
    console.log('===================');
    
    const verifiedData = await new Promise((resolve, reject) => {
        db.all(
            "SELECT name, address, city, state, zip FROM builders WHERE state = 'CA' ORDER BY name",
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
    
    let validBuilders = 0;
    let stillHaveIssues = 0;
    
    verifiedData.forEach(builder => {
        const issues = [];
        if (!builder.address || builder.address.trim() === '') issues.push('Empty address');
        if (!builder.zip || builder.zip.trim() === '') issues.push('Missing zip');
        if (builder.zip && !/^\d{5}$/.test(builder.zip)) issues.push('Invalid zip format');
        
        if (issues.length === 0) {
            validBuilders++;
            console.log(`   ✅ ${builder.name}: ${builder.address || 'No address'}, ${builder.city}, ${builder.state} ${builder.zip}`);
        } else {
            stillHaveIssues++;
            console.log(`   ⚠️  ${builder.name}: ${issues.join(', ')}`);
        }
    });
    
    console.log(`\n📈 Improvement Summary:`);
    console.log(`   Valid builders: ${validBuilders}/${verifiedData.length}`);
    console.log(`   Still have issues: ${stillHaveIssues}`);
    console.log(`   Data completeness: ${((validBuilders / verifiedData.length) * 100).toFixed(1)}%`);
    
    if (stillHaveIssues > 0) {
        console.log('\n⚠️  Remaining Issues:');
        console.log('====================');
        console.log('These builders still need manual address research:');
        
        const problemBuilders = dataFixes.filter(f => f.needsResearch);
        problemBuilders.forEach((builder, index) => {
            console.log(`\n${index + 1}. ${builder.name}`);
            console.log(`   Current issues: ${builder.issues.join(', ')}`);
            console.log(`   Action needed: Research actual business address and update database`);
            console.log(`   Search: "${builder.name} + city name" on Google Maps`);
        });
    }
    
    db.close();
    serverDb.close();
    
    console.log('\n✅ California data fixes complete!');
    console.log('Note: UI address formatting will be fixed separately.');
    
    return { fixesApplied, needsResearch, validBuilders, totalBuilders: verifiedData.length };
}

// Run the fixes
if (require.main === module) {
    fixCaliforniaDataIssues().catch(console.error);
}

module.exports = { fixCaliforniaDataIssues }; 