// Photo processing utilities for van builder scraper

async function extractPhotos(page, targetPhotoCount = 8) {
    console.log('📸 Extracting photos...');
    
    const photos = await extractPhotosFromPage(page, targetPhotoCount);
    
    // If we don't have enough photos, try to find a gallery page
    if (photos.length < targetPhotoCount) {
        const galleryUrl = await findGalleryPage(page);
        
        if (galleryUrl) {
            try {
                console.log('🖼️ Found gallery page, extracting additional photos...');
                await page.goto(galleryUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
                await page.waitForTimeout(2000);
                
                const galleryPhotos = await extractPhotosFromPage(page, targetPhotoCount - photos.length);
                photos.push(...galleryPhotos);
            } catch (error) {
                console.log('⚠️ Could not load gallery page:', error.message);
            }
        }
    }
    
    // Deduplicate photos
    const uniquePhotos = [];
    const seenUrls = new Set();
    
    for (const photo of photos) {
        if (!seenUrls.has(photo)) {
            seenUrls.add(photo);
            uniquePhotos.push(photo);
        }
    }
    
    return uniquePhotos.slice(0, targetPhotoCount);
}

async function findGalleryPage(page) {
    return await page.evaluate(() => {
        const galleryLinks = [
            'a[href*="gallery"]', 'a[href*="photos"]', 'a[href*="portfolio"]',
            'a[href*="work"]', 'a[href*="projects"]', 'a[href*="builds"]',
            'a:contains("Gallery")', 'a:contains("Photos")', 'a:contains("Our Work")',
            'a:contains("Portfolio")', 'a:contains("Projects")'
        ];
        
        for (const selector of galleryLinks) {
            try {
                const link = document.querySelector(selector);
                if (link?.href && !link.href.includes('mailto:') && !link.href.includes('tel:')) {
                    return link.href;
                }
            } catch (e) {
                // Some selectors might not be valid
            }
        }
        
        return null;
    });
}

async function extractPhotosFromPage(page, maxPhotos) {
    return await page.evaluate((maxPhotos) => {
        const photos = [];
        const seenUrls = new Set();
        
        // Score function for van relevance
        function scoreVanRelevance(img) {
            let score = 0;
            const src = (img.src || '').toLowerCase();
            const alt = (img.alt || '').toLowerCase();
            const title = (img.title || '').toLowerCase();
            const context = alt + ' ' + title + ' ' + src;
            
            // Positive indicators
            const vanKeywords = ['van', 'camper', 'rv', 'conversion', 'build', 'interior', 'exterior', 'custom', 'sprinter', 'transit', 'promaster'];
            const negativeKeywords = ['logo', 'icon', 'avatar', 'profile', 'map', 'location', 'facebook', 'instagram', 'youtube', 'twitter'];
            
            // Check positive keywords
            vanKeywords.forEach(keyword => {
                if (context.includes(keyword)) score += 2;
            });
            
            // Check negative keywords
            negativeKeywords.forEach(keyword => {
                if (context.includes(keyword)) score -= 3;
            });
            
            // Size bonus
            if (img.naturalWidth >= 400 && img.naturalHeight >= 300) score += 2;
            if (img.naturalWidth >= 800 && img.naturalHeight >= 600) score += 1;
            
            // Aspect ratio bonus (typical photo ratios)
            const ratio = img.naturalWidth / img.naturalHeight;
            if (ratio >= 1.2 && ratio <= 1.8) score += 1;
            
            // Gallery/portfolio bonus
            const parent = img.closest('.gallery, .portfolio, [class*="gallery"], [class*="portfolio"]');
            if (parent) score += 2;
            
            return score;
        }
        
        // Get all images
        const allImages = Array.from(document.querySelectorAll('img'));
        
        // Score and sort images
        const scoredImages = allImages
            .filter(img => {
                const src = img.src || '';
                return src && 
                       !src.includes('data:image') && 
                       !src.includes('placeholder') &&
                       img.naturalWidth >= 200 &&
                       img.naturalHeight >= 150;
            })
            .map(img => ({
                url: img.src,
                score: scoreVanRelevance(img),
                width: img.naturalWidth,
                height: img.naturalHeight
            }))
            .sort((a, b) => b.score - a.score);
        
        // Add photos up to maxPhotos
        for (const img of scoredImages) {
            if (!seenUrls.has(img.url)) {
                seenUrls.add(img.url);
                photos.push(img.url);
                if (photos.length >= maxPhotos) break;
            }
        }
        
        // Also check for background images in galleries
        if (photos.length < maxPhotos) {
            const bgElements = document.querySelectorAll('[style*="background-image"], .gallery-item, .portfolio-item');
            
            bgElements.forEach(el => {
                const style = el.style.backgroundImage || '';
                const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
                
                if (match && match[1] && !seenUrls.has(match[1])) {
                    seenUrls.add(match[1]);
                    photos.push(match[1]);
                    if (photos.length >= maxPhotos) return;
                }
            });
        }
        
        return photos;
    }, maxPhotos);
}

function formatPhotosForDatabase(photos) {
    // Convert photo URLs to the format expected by the database
    return photos.map(url => ({
        url: url,
        alt: `Van conversion photo`
    }));
}

function scorePhotoRelevance(url, alt = '') {
    let score = 0;
    const searchText = `${url} ${alt}`.toLowerCase();
    
    const vanKeywords = {
        high: ['van', 'sprinter', 'transit', 'promaster', 'conversion', 'camper', 'motorhome', 'rv'],
        medium: ['interior', 'exterior', 'build', 'custom', 'adventure', 'overland', 'expedition'],
        low: ['kitchen', 'bed', 'bathroom', 'solar', 'awning', 'gear']
    };
    
    const excludeKeywords = [
        'logo', 'icon', 'avatar', 'profile', 'team', 'staff', 'owner', 'founder',
        'office', 'building', 'storefront', 'workshop', 'factory', 'facility',
        'food', 'restaurant', 'catering', 'truck', 'trailer', 'commercial',
        'badge', 'award', 'certificate', 'testimonial', 'review'
    ];
    
    // Score based on keywords
    vanKeywords.high.forEach(keyword => {
        if (searchText.includes(keyword)) score += 3;
    });
    vanKeywords.medium.forEach(keyword => {
        if (searchText.includes(keyword)) score += 2;
    });
    vanKeywords.low.forEach(keyword => {
        if (searchText.includes(keyword)) score += 1;
    });
    
    // Penalty for excluded keywords
    excludeKeywords.forEach(keyword => {
        if (searchText.includes(keyword)) score -= 5;
    });
    
    return score;
}

async function detectGalleryPage(page) {
    return await page.evaluate(() => {
        // Check if there are gallery indicators on the current page
        const gallerySelectors = [
            '.gallery', '.photo-gallery', '.image-gallery',
            '[class*="gallery"]', '[id*="gallery"]',
            '.portfolio', '.photo-grid', '.image-grid'
        ];
        
        for (const selector of gallerySelectors) {
            const element = document.querySelector(selector);
            if (element && element.querySelectorAll('img').length > 3) {
                return true;
            }
        }
        
        // Also check for gallery links
        const galleryLinks = document.querySelectorAll(
            'a[href*="gallery"], a[href*="photos"], a[href*="portfolio"]'
        );
        
        return galleryLinks.length > 0;
    });
}

module.exports = {
    extractPhotos,
    formatPhotosForDatabase,
    scorePhotoRelevance,
    detectGalleryPage
};
