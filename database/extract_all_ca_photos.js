const { chromium } = require('playwright');
const { extractPhotos } = require('./scraper_modules/photo_processing');
const Database = require('better-sqlite3');

// All CA builders from the CSV (we already did the first 5)
const allCABuilders = [
    // Already completed (1-5)
    { name: 'Camplife Customs', url: 'https://camplifecustoms.com/', status: 'completed' },
    { name: 'SoCal Custom Vans', url: 'https://www.socalcustomvans.com/', status: 'completed' },
    { name: 'The Good Van', url: 'https://www.thegoodvan.com/', status: 'completed' },
    { name: 'Sandy Vans', url: 'https://sandyvans.com/', status: 'completed' },
    { name: 'Outpost Vans', url: 'https://www.outpostvans.com/', status: 'completed' },
    
    // Remaining builders (6-22) - need photos
    { name: 'Nook Vans', url: 'https://www.nookvans.com/' },
    { name: 'Field Van', url: 'https://fieldvan.com/' },
    { name: 'Levity Vans', url: 'https://levityvans.com/' },
    { name: 'Weekend Vans', url: 'https://www.weekendvans.com/' },
    { name: 'Adventure Bumss', url: 'https://adventurebumss.com/' },
    { name: 'Bossi Vans', url: 'https://www.bossivans.com/' },
    { name: 'Revamp Custom Vans', url: 'https://www.revampcustomvans.com/' },
    { name: 'Vannon', url: 'https://www.vannon.com/' },
    { name: 'Vandamme Conversions', url: 'https://www.vandammeconversions.com/' },
    { name: 'Van Speed Shop', url: 'https://www.vanspeedshop.com/' },
    { name: 'Rogue Vans', url: 'https://roguevans.com/' },
    { name: 'My Custom Van', url: 'https://mycustomvan.com/' },
    { name: 'Custom Concept Vans', url: 'https://customconceptvans.com/home-1' },
    { name: 'Off the Grid Van Works', url: 'https://www.offthegridvanworks.com/' },
    { name: 'Vanaholic', url: 'https://vanaholic.com/' },
    { name: 'Statworks Overland', url: 'https://statworksoverland.com/' },
    { name: 'Tiny Planet', url: 'https://tinyplanet.group/' }
];

async function extractAllCAPhotos() {
    console.log('📸 Extracting Photos for All CA Builders');
    console.log('=' .repeat(60));
    
    // Connect to database
    const db = new Database('../server/database/builders.db');
    
    // Filter to only the remaining builders that need photos
    const remainingBuilders = allCABuilders.filter(builder => !builder.status);
    
    console.log(`🎯 Processing ${remainingBuilders.length} remaining CA builders`);
    console.log(`✅ Already completed: ${allCABuilders.filter(b => b.status).length} builders`);
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const [index, builder] of remainingBuilders.entries()) {
        console.log(`\n🔄 [${index + 1}/${remainingBuilders.length}] Processing: ${builder.name}`);
        console.log(`🌐 URL: ${builder.url}`);
        
        const page = await browser.newPage();
        
        try {
            await page.goto(builder.url, { 
                waitUntil: 'domcontentloaded', 
                timeout: 20000 
            });
            
            await page.waitForTimeout(3000);
            
            // Extract photos using website-first approach
            const photos = await extractPhotos(page, 8);
            
            if (photos.length > 0) {
                // Convert to JSON string for database storage
                const photosJson = JSON.stringify(photos.map(url => ({ url, alt: 'Van conversion photo' })));
                
                // Update database
                const updateStmt = db.prepare(`
                    UPDATE builders 
                    SET photos = ? 
                    WHERE name = ?
                `);
                
                const result = updateStmt.run(photosJson, builder.name);
                
                if (result.changes > 0) {
                    console.log(`✅ SUCCESS: Updated ${photos.length} photos for ${builder.name}`);
                    console.log(`📋 Sample photos:`);
                    photos.slice(0, 2).forEach((photo, photoIndex) => {
                        console.log(`  ${photoIndex + 1}. ${photo.substring(0, 70)}...`);
                    });
                    successCount++;
                } else {
                    console.log(`⚠️  Builder not found in database: ${builder.name}`);
                    failureCount++;
                }
            } else {
                console.log(`❌ FAILED: No photos found for ${builder.name}`);
                failureCount++;
            }
            
        } catch (error) {
            console.log(`❌ ERROR: Failed to process ${builder.name}: ${error.message}`);
            failureCount++;
        } finally {
            await page.close();
        }
        
        // Small delay between requests to be respectful
        if (index < remainingBuilders.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    await browser.close();
    db.close();
    
    console.log('\n🏁 CA Photo Extraction Complete!');
    console.log('=' .repeat(60));
    console.log(`✅ Successful: ${successCount} builders`);
    console.log(`❌ Failed: ${failureCount} builders`);
    console.log(`📊 Success Rate: ${Math.round((successCount / remainingBuilders.length) * 100)}%`);
    console.log('\n🎯 All photos use website-first approach (no Instagram CORS issues)');
    console.log('✨ Ready for frontend display!');
}

// Run the extraction
extractAllCAPhotos().catch(console.error); 