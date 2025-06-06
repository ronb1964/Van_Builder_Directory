#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DataCleanup {
    constructor() {
        this.dbPath = path.join(__dirname, '../Shell/server/van_builders.db');
    }

    async cleanupAllBuilders() {
        console.log('🧹 Starting comprehensive data cleanup for New Jersey builders...');
        
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error opening database:', err.message);
                    reject(err);
                    return;
                }
                console.log('✅ Connected to database');
            });

            // Get all New Jersey builders
            db.all("SELECT * FROM builders WHERE state = 'New Jersey'", async (err, rows) => {
                if (err) {
                    console.error('❌ Error reading builders:', err.message);
                    db.close();
                    reject(err);
                    return;
                }

                console.log(`📊 Found ${rows.length} New Jersey builders to clean up\n`);
                
                for (const builder of rows) {
                    await this.cleanupBuilder(db, builder);
                }

                db.close();
                console.log('\n🎉 Comprehensive data cleanup completed!');
                resolve();
            });
        });
    }

    async cleanupBuilder(db, builder) {
        console.log(`🏢 Cleaning up: ${builder.name}`);
        
        const updates = {};
        let hasUpdates = false;

        // 1. Fix Ready Set Van address and city
        if (builder.name.includes('Ready. Set. Van')) {
            if (builder.address && builder.address.includes('878 - 8822Ready Set Van1800')) {
                updates.address = '1800 E State Street, Suite 165, Hamilton Twp, NJ 08609';
                updates.city = 'Hamilton Twp';
                updates.zip = '08609';
                hasUpdates = true;
                console.log('  ✅ Fixed Ready Set Van address and city');
            }
        }

        // 2. Fix Sequoia + Salt email
        if (builder.name.includes('Sequoia + Salt')) {
            if (builder.email === 'user@domain.com') {
                updates.email = 'hello@sequoiasalt.com';
                hasUpdates = true;
                console.log('  ✅ Fixed Sequoia + Salt email');
            }
        }

        // 3. Fix HUMBLE ROAD data
        if (builder.name.includes('HUMBLE ROAD')) {
            if (!builder.address || builder.address === 'MISSING') {
                updates.address = 'New Jersey'; // General location
                updates.city = 'New Jersey';
                hasUpdates = true;
                console.log('  ✅ Added HUMBLE ROAD location');
            }
            
            if (builder.email && builder.email.includes('Jerseygeorgemauro@humbleroad.tvMade')) {
                updates.email = 'george@humbleroad.tv';
                hasUpdates = true;
                console.log('  ✅ Fixed HUMBLE ROAD email');
            }

            // Add missing Facebook for HUMBLE ROAD
            let socialMedia = {};
            try {
                socialMedia = JSON.parse(builder.social_media || '{}');
            } catch (e) {
                socialMedia = {};
            }
            
            if (!socialMedia.facebook) {
                socialMedia.facebook = 'https://www.facebook.com/humbleroad';
                updates.social_media = JSON.stringify(socialMedia);
                hasUpdates = true;
                console.log('  ✅ Added HUMBLE ROAD Facebook');
            }
        }

        // 4. Extract ZIP codes from addresses where missing
        if (builder.address && (!builder.zip || builder.zip === '')) {
            const zipMatch = builder.address.match(/\b(\d{5})\b/);
            if (zipMatch) {
                updates.zip = zipMatch[1];
                hasUpdates = true;
                console.log(`  ✅ Extracted ZIP code: ${zipMatch[1]}`);
            }
        }

        // 5. Clean up malformed emails
        if (builder.email && (
            builder.email.includes('user@domain.com') ||
            builder.email.includes('example.com') ||
            builder.email.length > 100
        )) {
            // Try to extract a clean email
            const emailMatch = builder.email.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailMatch && emailMatch[1] !== 'user@domain.com') {
                updates.email = emailMatch[1];
                hasUpdates = true;
                console.log(`  ✅ Cleaned email: ${emailMatch[1]}`);
            }
        }

        // 6. Ensure all builders have proper social media format
        let socialMedia = {};
        try {
            socialMedia = JSON.parse(builder.social_media || '{}');
        } catch (e) {
            socialMedia = {};
        }

        // Fix Instagram URLs to use https
        if (socialMedia.instagram && socialMedia.instagram.startsWith('http://')) {
            socialMedia.instagram = socialMedia.instagram.replace('http://', 'https://');
            updates.social_media = JSON.stringify(socialMedia);
            hasUpdates = true;
            console.log('  ✅ Fixed Instagram URL to HTTPS');
        }

        // Apply updates if any
        if (hasUpdates) {
            await this.updateBuilder(db, builder.id, updates);
        } else {
            console.log('  ℹ️  No updates needed');
        }
    }

    async updateBuilder(db, builderId, updates) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates);
            const values = Object.values(updates);
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            
            const query = `UPDATE builders SET ${setClause} WHERE id = ?`;
            values.push(builderId);

            db.run(query, values, function(err) {
                if (err) {
                    console.error('❌ Error updating builder:', err.message);
                    reject(err);
                } else {
                    console.log(`  💾 Updated ${this.changes} record(s)`);
                    resolve();
                }
            });
        });
    }

    async generateDataQualityReport() {
        console.log('\n📊 Generating Data Quality Report...\n');
        
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error opening database:', err.message);
                    reject(err);
                    return;
                }
            });

            db.all("SELECT * FROM builders WHERE state = 'New Jersey'", (err, rows) => {
                if (err) {
                    console.error('❌ Error reading builders:', err.message);
                    db.close();
                    reject(err);
                    return;
                }

                console.log('='.repeat(80));
                console.log('📈 NEW JERSEY VAN BUILDERS - DATA QUALITY REPORT');
                console.log('='.repeat(80));

                rows.forEach((builder, index) => {
                    console.log(`\n${index + 1}. ${builder.name}`);
                    console.log('-'.repeat(50));
                    console.log(`   📍 Address: ${builder.address || '❌ MISSING'}`);
                    console.log(`   🏙️  City: ${builder.city || '❌ MISSING'}`);
                    console.log(`   📮 ZIP: ${builder.zip || '❌ MISSING'}`);
                    console.log(`   📞 Phone: ${builder.phone || '❌ MISSING'}`);
                    console.log(`   📧 Email: ${builder.email || '❌ MISSING'}`);
                    console.log(`   📝 Description: ${builder.description ? '✅ Present' : '❌ MISSING'}`);
                    
                    // Parse and display social media
                    let socialMedia = {};
                    try {
                        socialMedia = JSON.parse(builder.social_media || '{}');
                    } catch (e) {
                        socialMedia = {};
                    }
                    
                    console.log(`   📱 Social Media:`);
                    console.log(`      Facebook: ${socialMedia.facebook ? '✅ Present' : '❌ MISSING'}`);
                    console.log(`      Instagram: ${socialMedia.instagram ? '✅ Present' : '❌ MISSING'}`);
                    console.log(`      YouTube: ${socialMedia.youtube ? '✅ Present' : '❌ MISSING'}`);
                    
                    // Parse and display photos
                    let gallery = [];
                    try {
                        gallery = JSON.parse(builder.gallery || '[]');
                    } catch (e) {
                        gallery = [];
                    }
                    console.log(`   📷 Photos: ${gallery.length} photos`);
                });

                console.log('\n' + '='.repeat(80));
                console.log('📊 SUMMARY STATISTICS');
                console.log('='.repeat(80));
                
                const stats = {
                    total: rows.length,
                    withAddress: rows.filter(b => b.address && b.address !== 'MISSING').length,
                    withCity: rows.filter(b => b.city && b.city !== 'MISSING').length,
                    withZip: rows.filter(b => b.zip && b.zip !== 'MISSING').length,
                    withEmail: rows.filter(b => b.email && b.email !== 'MISSING' && !b.email.includes('user@domain.com')).length,
                    withDescription: rows.filter(b => b.description && b.description !== 'MISSING').length,
                    withFacebook: 0,
                    withInstagram: 0,
                    withYoutube: 0
                };

                rows.forEach(builder => {
                    try {
                        const social = JSON.parse(builder.social_media || '{}');
                        if (social.facebook) stats.withFacebook++;
                        if (social.instagram) stats.withInstagram++;
                        if (social.youtube) stats.withYoutube++;
                    } catch (e) {}
                });

                console.log(`Total Builders: ${stats.total}`);
                console.log(`With Address: ${stats.withAddress}/${stats.total} (${Math.round(stats.withAddress/stats.total*100)}%)`);
                console.log(`With City: ${stats.withCity}/${stats.total} (${Math.round(stats.withCity/stats.total*100)}%)`);
                console.log(`With ZIP: ${stats.withZip}/${stats.total} (${Math.round(stats.withZip/stats.total*100)}%)`);
                console.log(`With Email: ${stats.withEmail}/${stats.total} (${Math.round(stats.withEmail/stats.total*100)}%)`);
                console.log(`With Description: ${stats.withDescription}/${stats.total} (${Math.round(stats.withDescription/stats.total*100)}%)`);
                console.log(`With Facebook: ${stats.withFacebook}/${stats.total} (${Math.round(stats.withFacebook/stats.total*100)}%)`);
                console.log(`With Instagram: ${stats.withInstagram}/${stats.total} (${Math.round(stats.withInstagram/stats.total*100)}%)`);
                console.log(`With YouTube: ${stats.withYoutube}/${stats.total} (${Math.round(stats.withYoutube/stats.total*100)}%)`);

                db.close();
                resolve();
            });
        });
    }
}

async function main() {
    const cleanup = new DataCleanup();
    
    try {
        await cleanup.cleanupAllBuilders();
        await cleanup.generateDataQualityReport();
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { DataCleanup };
