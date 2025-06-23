const { chromium } = require('playwright');
const sqlite3 = require('sqlite3').verbose();

// CUSTOMIZE: Builder information for photo extraction
const BUILDER_CONFIG = {
    name: 'Builder Name Here',
    website: 'https://builderwebsite.com',
    state: 'STATE_ABBREV',  // e.g., 'TX', 'FL', 'CO'
    issue: 'Describe why manual extraction is needed'  // e.g., 'Complex React site', 'Timeout during scraping'
};

async function extractBuilderPhotos() {
    console.log(`📸 Manual Photo Extraction: ${BUILDER_CONFIG.name}`);
    console.log('===============================================');
    console.log(`🌐 Website: ${BUILDER_CONFIG.website}`);
    console.log(`📋 Issue: ${BUILDER_CONFIG.issue}`);
    
    const browser = await chromium.launch({ 
        headless: false,  // Show browser for debugging
        args: ['--disable-blink-features=AutomationControlled']
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    try {
        console.log('🔍 Navigating to website...');
        await page.goto(BUILDER_CONFIG.website, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Wait for dynamic content to load
        console.log('⏱️ Waiting for dynamic content...');
        await page.waitForTimeout(5000);
        
        // Try to scroll to trigger lazy-loaded images
        console.log('📜 Scrolling to trigger lazy-loaded images...');
        await page.evaluate(() => {
            return new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    
                    if(totalHeight >= scrollHeight){
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
        
        await page.waitForTimeout(3000);
        
        // Extract photos with enhanced filtering
        console.log('📸 Extracting photos...');
        const photos = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            const validPhotos = [];
            
            // Advanced photo scoring system
            const scorePhoto = (img) => {
                let score = 0;
                const src = img.src || '';
                const alt = (img.alt || '').toLowerCase();
                const className = (img.className || '').toLowerCase();
                
                // Positive indicators
                if (alt.includes('van') || alt.includes('conversion') || alt.includes('camper')) score += 3;
                if (alt.includes('build') || alt.includes('interior') || alt.includes('custom')) score += 2;
                if (className.includes('gallery') || className.includes('portfolio')) score += 2;
                if (img.naturalWidth > 800 && img.naturalHeight > 600) score += 2;
                if (img.naturalWidth > 1200) score += 1;
                
                // Negative indicators (exclusions)
                if (alt.includes('logo') || className.includes('logo')) score -= 5;
                if (alt.includes('icon') || className.includes('icon')) score -= 3;
                if (alt.includes('avatar') || alt.includes('profile')) score -= 3;
                if (src.includes('logo') || src.includes('icon')) score -= 3;
                if (img.naturalWidth < 400 || img.naturalHeight < 300) score -= 2;
                
                // Exclude common non-van content
                if (alt.includes('dental') || alt.includes('medical') || alt.includes('chair')) score -= 10;
                if (alt.includes('office') || alt.includes('clinic') || alt.includes('tooth')) score -= 10;
                
                return score;
            };
            
            images.forEach(img => {
                if (img.src && img.naturalWidth > 0 && img.naturalHeight > 0) {
                    const score = scorePhoto(img);
                    
                    if (score > 0) {  // Only include positively scored images
                        validPhotos.push({
                            url: img.src,
                            alt: img.alt || '',
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                            score: score
                        });
                    }
                }
            });
            
            // Sort by score and return top photos
            return validPhotos
                .sort((a, b) => b.score - a.score)
                .slice(0, 8)  // Limit to 8 best photos
                .map(photo => photo.url);
        });
        
        console.log(`📸 Found ${photos.length} high-quality photos`);
        photos.forEach((photo, index) => {
            console.log(`   ${index + 1}. ${photo}`);
        });
        
        if (photos.length === 0) {
            console.log('⚠️ No suitable photos found. Trying alternative extraction methods...');
            
            // Try looking for gallery or portfolio pages
            const galleryLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                return links
                    .filter(link => {
                        const text = link.textContent.toLowerCase();
                        const href = link.href.toLowerCase();
                        return text.includes('gallery') || text.includes('portfolio') || 
                               text.includes('builds') || href.includes('gallery') || 
                               href.includes('portfolio');
                    })
                    .map(link => link.href)
                    .slice(0, 3);  // Try up to 3 gallery pages
            });
            
            console.log(`🔍 Found ${galleryLinks.length} potential gallery pages`);
            
            for (const galleryLink of galleryLinks) {
                console.log(`📸 Checking gallery: ${galleryLink}`);
                await page.goto(galleryLink, { waitUntil: 'networkidle', timeout: 30000 });
                await page.waitForTimeout(3000);
                
                const galleryPhotos = await page.evaluate(() => {
                    const images = Array.from(document.querySelectorAll('img'));
                    return images
                        .filter(img => img.src && img.naturalWidth > 600 && img.naturalHeight > 400)
                        .map(img => img.src)
                        .slice(0, 5);
                });
                
                photos.push(...galleryPhotos);
                console.log(`   📸 Added ${galleryPhotos.length} photos from gallery`);
                
                if (photos.length >= 8) break;
            }
        }
        
        // Update database if photos were found
        if (photos.length > 0) {
            console.log(`\n💾 Updating database with ${photos.length} photos...`);
            
            const db = new sqlite3.Database('./builders.db');
            const serverDb = new sqlite3.Database('../server/database/builders.db');
            
            const photosJson = JSON.stringify(photos);
            
            // Update main database
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE builders SET photos = ? WHERE name = ? AND state = ?`,
                    [photosJson, BUILDER_CONFIG.name, BUILDER_CONFIG.state],
                    function(err) {
                        if (err) {
                            console.log(`❌ Main DB update failed: ${err.message}`);
                            reject(err);
                        } else {
                            console.log(`✅ Main database updated (${this.changes} rows)`);
                            resolve();
                        }
                    }
                );
            });
            
            // Update server database
            await new Promise((resolve, reject) => {
                serverDb.run(
                    `UPDATE builders SET photos = ? WHERE name = ? AND state = ?`,
                    [photosJson, BUILDER_CONFIG.name, BUILDER_CONFIG.state],
                    function(err) {
                        if (err) {
                            console.log(`❌ Server DB update failed: ${err.message}`);
                            reject(err);
                        } else {
                            console.log(`✅ Server database updated (${this.changes} rows)`);
                            resolve();
                        }
                    }
                );
            });
            
            db.close();
            serverDb.close();
            
            console.log(`\n🎉 Successfully extracted ${photos.length} photos for ${BUILDER_CONFIG.name}!`);
        } else {
            console.log('\n❌ No suitable photos could be extracted');
            console.log('💡 Suggestions:');
            console.log('   1. Check if the website requires login');
            console.log('   2. Look for social media pages (Facebook, Instagram)');
            console.log('   3. Check if images are behind a cookie consent banner');
            console.log('   4. Manually verify the website has van conversion photos');
        }
        
    } catch (error) {
        console.error('❌ Photo extraction failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the extraction
if (require.main === module) {
    extractBuilderPhotos().catch(console.error);
}

module.exports = { extractBuilderPhotos }; 