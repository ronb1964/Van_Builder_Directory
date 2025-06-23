const playwright = require('playwright');

async function getBackcountryPhotos() {
    console.log('🔍 Extracting photos from Backcountry Vans website...');
    
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Load main page with extended timeout
        await page.goto('https://www.backcountryvans.com/', { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 
        });
        
        console.log('✅ Main page loaded');
        await page.waitForTimeout(3000);
        
        // Look for gallery/portfolio link
        const galleryLink = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const gallery = links.find(link => {
                const text = link.textContent.toLowerCase();
                return text.includes('gallery') || text.includes('portfolio') || 
                       text.includes('work') || text.includes('projects');
            });
            return gallery ? gallery.href : null;
        });
        
        if (galleryLink) {
            console.log(`🎯 Found gallery page: ${galleryLink}`);
            await page.goto(galleryLink, { timeout: 30000 });
            await page.waitForTimeout(3000);
            console.log('✅ Gallery page loaded');
        }
        
        // Extract all images
        const photos = await page.evaluate(() => {
            const images = [];
            
            // Get all img tags
            const imgTags = document.querySelectorAll('img');
            imgTags.forEach(img => {
                if (img.src && img.src.match(/\.(jpg|jpeg|png|webp)$/i)) {
                    const src = img.src;
                    // Skip logos, icons, and check dimensions
                    if (!src.includes('logo') && !src.includes('icon')) {
                        images.push({
                            url: src,
                            alt: img.alt || 'Backcountry Vans conversion',
                            width: img.naturalWidth || 0,
                            height: img.naturalHeight || 0
                        });
                    }
                }
            });
            
            // Also check background images
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const bgImage = style.backgroundImage;
                if (bgImage && bgImage.includes('url(')) {
                    const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
                    if (match && match[1]) {
                        const url = match[1];
                        if (url.match(/\.(jpg|jpeg|png|webp)$/i) && 
                            !url.includes('logo') && !url.includes('icon')) {
                            images.push({
                                url: url.startsWith('http') ? url : new URL(url, window.location.href).href,
                                alt: 'Backcountry Vans conversion'
                            });
                        }
                    }
                }
            });
            
            return images;
        });
        
        console.log(`📸 Found ${photos.length} photos total`);
        
        // Filter and limit to 8 good photos
        const goodPhotos = photos.filter(photo => {
            // Filter out very small images and common unwanted images
            const url = photo.url.toLowerCase();
            if (url.includes('logo') || url.includes('icon') || url.includes('button') || 
                url.includes('arrow') || url.includes('social')) {
                return false;
            }
            // Keep photos that seem substantial (either have good dimensions or are likely gallery images)
            return photo.width > 200 || photo.url.includes('gallery') || photo.url.includes('portfolio');
        });
        
        // Remove duplicates and limit to 8
        const uniquePhotos = [];
        const seenUrls = new Set();
        
        for (const photo of goodPhotos) {
            if (!seenUrls.has(photo.url) && uniquePhotos.length < 8) {
                seenUrls.add(photo.url);
                uniquePhotos.push({
                    url: photo.url,
                    alt: photo.alt,
                    caption: ''
                });
            }
        }
        
        console.log('📋 Final photo list:');
        uniquePhotos.forEach((photo, i) => {
            console.log(`   ${i+1}. ${photo.url}`);
        });
        
        console.log(`\n✅ Extracted ${uniquePhotos.length} unique photos for Backcountry Vans`);
        
        return uniquePhotos;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return [];
    } finally {
        await browser.close();
    }
}

async function updateDatabase(photos) {
    if (photos.length === 0) {
        console.log('⚠️ No photos to update');
        return;
    }
    
    const sqlite3 = require('sqlite3').verbose();
    const photosJson = JSON.stringify(photos);
    
    console.log(`\n🔧 Updating database with ${photos.length} photos...`);
    
    // Update main database
    const db = new sqlite3.Database('./builders.db');
    await new Promise((resolve, reject) => {
        db.run(
            "UPDATE builders SET photos = ? WHERE name = 'Backcountry Vans' AND state = 'AK'",
            [photosJson],
            function(err) {
                if (err) {
                    console.log('❌ Main DB update failed:', err.message);
                    reject(err);
                } else {
                    console.log(`✅ Main database updated (${this.changes} rows)`);
                    resolve();
                }
            }
        );
    });
    db.close();
    
    // Update server database
    const serverDb = new sqlite3.Database('../server/database/builders.db');
    await new Promise((resolve, reject) => {
        serverDb.run(
            "UPDATE builders SET photos = ? WHERE name = 'Backcountry Vans' AND state = 'AK'",
            [photosJson],
            function(err) {
                if (err) {
                    console.log('❌ Server DB update failed:', err.message);
                    reject(err);
                } else {
                    console.log(`✅ Server database updated (${this.changes} rows)`);
                    resolve();
                }
            }
        );
    });
    serverDb.close();
    
    console.log('✅ Database update completed!');
}

async function main() {
    try {
        const photos = await getBackcountryPhotos();
        
        if (photos.length > 0) {
            const fs = require('fs');
            fs.writeFileSync('backcountry_photos.json', JSON.stringify(photos, null, 2));
            console.log('💾 Photos saved to backcountry_photos.json');
            
            await updateDatabase(photos);
        } else {
            console.log('❌ No photos extracted');
        }
    } catch (error) {
        console.error('❌ Script failed:', error);
    }
}

if (require.main === module) {
    main();
} 