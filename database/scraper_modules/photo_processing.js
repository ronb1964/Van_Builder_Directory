// Photo processing utilities for van builder scraper

async function extractPhotos(page, targetPhotoCount = 8) {
    console.log('📸 Extracting photos from builder website (prioritizing website over social media)...');
    
    const photos = [];
    const seenUrls = new Set();
    const originalUrl = page.url();
    
    // PRIORITY 1: Extract photos from the main website page
    console.log('🏠 Step 1: Checking main website page...');
    const mainPagePhotos = await extractPhotosFromPage(page, targetPhotoCount);
    for (const photo of mainPagePhotos) {
        if (!seenUrls.has(photo)) {
            seenUrls.add(photo);
            photos.push(photo);
        }
    }
    console.log(`✅ Found ${photos.length} photos from main page`);
    
    // PRIORITY 2: If we need more photos, try gallery pages (still on their domain)
    if (photos.length < targetPhotoCount) {
        const galleryUrl = await findGalleryPage(page);
        
        if (galleryUrl) {
            try {
                console.log('🖼️ Step 2: Checking gallery page...');
                await page.goto(galleryUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
                await page.waitForTimeout(2000);
                
                const galleryPhotos = await extractPhotosFromPage(page, targetPhotoCount - photos.length);
                for (const photo of galleryPhotos) {
                    if (!seenUrls.has(photo)) {
                        seenUrls.add(photo);
                        photos.push(photo);
                        if (photos.length >= targetPhotoCount) break;
                    }
                }
                console.log(`✅ Found ${galleryPhotos.length} additional photos from gallery`);
            } catch (error) {
                console.log('⚠️ Could not load gallery page:', error.message);
            }
        }
    }
    
    // PRIORITY 3: Only if we still need photos, try Facebook (skip Instagram due to CORS)
    if (photos.length < targetPhotoCount) {
        try {
            // Go back to main page to get social media links
            await page.goto(originalUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(1000);
            
            console.log('📘 Step 3: Checking Facebook as last resort...');
            const facebookPhotos = await extractFacebookOnly(page, targetPhotoCount - photos.length);
            for (const photo of facebookPhotos) {
                if (!seenUrls.has(photo)) {
                    seenUrls.add(photo);
                    photos.push(photo);
                    if (photos.length >= targetPhotoCount) break;
                }
            }
            console.log(`✅ Found ${facebookPhotos.length} additional photos from Facebook`);
        } catch (error) {
            console.log('⚠️ Error checking Facebook:', error.message);
        }
    }
    
    console.log(`🎯 Total photos collected: ${photos.length}/${targetPhotoCount}`);
    return photos.slice(0, targetPhotoCount);
}

async function extractFacebookOnly(page, maxPhotos) {
    const photos = [];
    
    // Get Facebook link from the current page
    const facebookLink = await page.evaluate(() => {
        const facebookLinks = document.querySelectorAll('a[href*="facebook.com"]');
        return facebookLinks.length > 0 ? facebookLinks[0].href : null;
    });
    
    // Try Facebook if available
    if (facebookLink) {
        try {
            console.log('📘 Checking Facebook for van photos...');
            await page.goto(facebookLink, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(3000);
            
            const facebookPhotos = await extractFacebookPhotos(page, maxPhotos);
            photos.push(...facebookPhotos);
        } catch (error) {
            console.log('⚠️ Could not load Facebook page:', error.message);
        }
    }
    
    return photos;
}

async function extractPhotosFromSocialMedia(page, maxPhotos) {
    const photos = [];
    
    // Get social media links from the current page
    const socialLinks = await page.evaluate(() => {
        const links = {};
        
        // Find Instagram links
        const instagramLinks = document.querySelectorAll('a[href*="instagram.com"]');
        if (instagramLinks.length > 0) {
            links.instagram = instagramLinks[0].href;
        }
        
        // Find Facebook links  
        const facebookLinks = document.querySelectorAll('a[href*="facebook.com"]');
        if (facebookLinks.length > 0) {
            links.facebook = facebookLinks[0].href;
        }
        
        return links;
    });
    
    // Skip Instagram due to CORS issues - Instagram blocks external image loading
    console.log('⚠️ Skipping Instagram due to CORS restrictions');
    
    // Try Facebook if we still need more photos
    if (socialLinks.facebook && photos.length < maxPhotos) {
        try {
            console.log('📘 Checking Facebook for van photos...');
            await page.goto(socialLinks.facebook, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(3000);
            
            const facebookPhotos = await extractFacebookPhotos(page, maxPhotos - photos.length);
            photos.push(...facebookPhotos);
        } catch (error) {
            console.log('⚠️ Could not load Facebook page:', error.message);
        }
    }
    
    return photos;
}

async function extractInstagramPhotos(page, maxPhotos) {
    return await page.evaluate((maxPhotos) => {
        const photos = [];
        
        // Instagram photo selectors
        const imageSelectors = [
            'img[src*="instagram"]',
            'img[src*="cdninstagram"]', 
            'img[src*="fbcdn"]',
            'article img',
            '[role="img"] img',
            'a[href*="/p/"] img'
        ];
        
        for (const selector of imageSelectors) {
            const images = document.querySelectorAll(selector);
            
            for (const img of images) {
                if (photos.length >= maxPhotos) break;
                
                const src = img.src;
                if (src && 
                    !src.includes('profile') && 
                    !src.includes('avatar') &&
                    !src.includes('story') &&
                    img.naturalWidth >= 300 &&
                    img.naturalHeight >= 300) {
                    
                    photos.push(src);
                }
            }
            
            if (photos.length >= maxPhotos) break;
        }
        
        return photos;
    }, maxPhotos);
}

async function extractFacebookPhotos(page, maxPhotos) {
    return await page.evaluate((maxPhotos) => {
        const photos = [];
        
        // Facebook photo selectors
        const imageSelectors = [
            'img[src*="facebook"]',
            'img[src*="fbcdn"]',
            'img[src*="scontent"]',
            '[data-pagelet*="photo"] img',
            '[role="img"] img'
        ];
        
        for (const selector of imageSelectors) {
            const images = document.querySelectorAll(selector);
            
            for (const img of images) {
                if (photos.length >= maxPhotos) break;
                
                const src = img.src;
                if (src && 
                    !src.includes('profile') && 
                    !src.includes('avatar') &&
                    !src.includes('cover') &&
                    img.naturalWidth >= 300 &&
                    img.naturalHeight >= 300) {
                    
                    photos.push(src);
                }
            }
            
            if (photos.length >= maxPhotos) break;
        }
        
        return photos;
    }, maxPhotos);
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
        
        // Score function for van relevance - STRICT: only real van photos
        function scoreVanRelevance(img) {
            let score = 0;
            const src = (img.src || '').toLowerCase();
            const alt = (img.alt || '').toLowerCase();
            const title = (img.title || '').toLowerCase();
            const context = alt + ' ' + title + ' ' + src;
            
            // STRICT EXCLUSIONS - immediately disqualify
            const strictExclusions = [
                'logo', 'icon', 'avatar', 'profile', 'header', 'footer', 'nav', 'menu',
                'facebook', 'instagram', 'youtube', 'twitter', 'linkedin', 'social',
                'team', 'staff', 'owner', 'founder', 'about', 'contact',
                'badge', 'award', 'certificate', 'testimonial', 'review',
                'map', 'location', 'directions', 'address',
                'button', 'banner', 'ad', 'advertisement', 'sponsor',
                'skull', 'design', 'google-logo', 'brand', 'thumbnail'
            ];
            
            // Check for strict exclusions first - use word boundaries to avoid partial matches
            for (const exclusion of strictExclusions) {
                // Create regex with word boundaries to avoid partial matches like "ad" in "edits"
                const regex = new RegExp(`\\b${exclusion}\\b`, 'i');
                if (regex.test(context)) {
                    return -10; // Immediately disqualify
                }
            }
            
            // Additional filename-based logo detection
            if (src.includes('-logo') || src.includes('_logo') || src.includes('logo-') || src.includes('logo_') ||
                src.includes('-icon') || src.includes('_icon') || src.includes('icon-') || src.includes('icon_') ||
                src.includes('brand') || src.includes('skull') || src.includes('design-01') ||
                src.includes('google') || src.includes('thumbnail') || src.includes('screenshot')) {
                return -10; // Logo/branding content
            }
            
            // Size requirements - must be substantial photo size
            if (img.naturalWidth < 400 || img.naturalHeight < 300) {
                return -5; // Too small, likely not a showcase photo
            }
            
            // High-value van keywords - actual van photos
            const highValueKeywords = ['van', 'sprinter', 'transit', 'promaster', 'conversion', 'camper', 'motorhome', 'rv'];
            const mediumValueKeywords = ['interior', 'exterior', 'build', 'custom', 'adventure', 'overland', 'expedition'];
            const lowValueKeywords = ['kitchen', 'bed', 'bathroom', 'solar', 'awning', 'gear', 'storage'];
            
            // Photo-specific indicators (good signs it's an actual photo)
            const photoIndicators = ['jpg', 'jpeg', 'png', 'webp'];
            const hasPhotoExtension = photoIndicators.some(ext => src.includes('.' + ext));
            
            // Score based on keywords
            highValueKeywords.forEach(keyword => {
                if (context.includes(keyword)) score += 5;
            });
            mediumValueKeywords.forEach(keyword => {
                if (context.includes(keyword)) score += 3;
            });
            lowValueKeywords.forEach(keyword => {
                if (context.includes(keyword)) score += 2;
            });
            
            // Large photo bonus (likely showcase photos)
            if (img.naturalWidth >= 800 && img.naturalHeight >= 600) score += 3;
            if (img.naturalWidth >= 1200 && img.naturalHeight >= 800) score += 2;
            
            // Good aspect ratio for van photos
            const ratio = img.naturalWidth / img.naturalHeight;
            if (ratio >= 1.2 && ratio <= 1.8) score += 2;
            
            // Gallery/portfolio context bonus
            const parent = img.closest('.gallery, .portfolio, [class*="gallery"], [class*="portfolio"], [class*="work"], [class*="project"]');
            if (parent) score += 4;
            
            // File name analysis
            if (src.includes('van') || src.includes('conversion') || src.includes('build')) score += 3;
            
            // Bonus for actual photo files
            if (hasPhotoExtension && (src.includes('jpg') || src.includes('jpeg'))) score += 2;
            
            // Penalty for obvious graphics/designs
            if (src.includes('png') && img.naturalWidth < 600) score -= 2; // Small PNGs often logos
            if (src.includes('svg')) score -= 5; // SVGs are usually graphics/logos
            
            return score;
        }
        
        // Get all images
        const allImages = Array.from(document.querySelectorAll('img'));
        
        // Score and sort images - ONLY INCLUDE POSITIVE SCORES
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
            .filter(img => img.score > 0) // ONLY include photos with positive scores
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
