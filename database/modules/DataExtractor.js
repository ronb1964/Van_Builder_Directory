/**
 * Data Extractor Module
 * Handles extraction of builder data from web pages
 */

class DataExtractor {
    constructor() {
        // Van type and amenity keywords for extraction
        this.vanTypeKeywords = [
            'class b', 'class b+', 'sprinter', 'transit', 'promaster', 'ram promaster',
            'mercedes sprinter', 'ford transit', 'chevy express', 'gmc savana',
            'nissan nv200', 'custom van', 'camper van', 'conversion van'
        ];

        this.amenityKeywords = [
            'solar', 'bathroom', 'shower', 'kitchen', 'bed', 'storage', 'awning',
            'air conditioning', 'heating', 'refrigerator', 'sink', 'stove', 'oven',
            'microwave', 'water tank', 'grey water', 'black water', 'inverter',
            'battery', 'generator', 'wifi', 'tv', 'entertainment', 'seating'
        ];

        this.socialPlatforms = {
            facebook: ['facebook.com', 'fb.com'],
            instagram: ['instagram.com'],
            youtube: ['youtube.com', 'youtu.be'],
            tiktok: ['tiktok.com'],
            x: ['twitter.com', 'x.com']
        };
    }

    cleanText(text) {
        return text.replace(/\s+/g, ' ').trim();
    }

    async extractBuilderData(page, result, targetState) {
        console.log(`📊 Extracting data for: ${result.title}`);
        
        try {
            // Take screenshot for verification
            const builderScreenshot = `builder_${Date.now()}.png`;
            await page.screenshot({ 
                path: builderScreenshot,
                fullPage: true 
            });

            const builderData = await page.evaluate((params) => {
                const { url, title, vanTypeKeywords, amenityKeywords, socialPlatforms } = params;
                const data = {
                    name: title,
                    website: url,
                    description: '',
                    phone: '',
                    email: '',
                    address: '',
                    city: '',
                    state: '',
                    zip: '',
                    lat: null,
                    lng: null,
                    specialties: '',
                    van_types: [],
                    services: '',
                    amenities: [],
                    photos: [],
                    social_media: {
                        facebook: '',
                        instagram: '',
                        youtube: '',
                        tiktok: '',
                        x: ''
                    }
                };

                const bodyText = document.body.innerText || '';
                const htmlContent = document.documentElement.innerHTML;

                // Extract business name from various sources
                const nameSelectors = [
                    'h1', '.company-name', '.business-name', '.site-title',
                    '[class*="name"]', '[class*="title"]', '.logo'
                ];
                
                for (const selector of nameSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim() && !data.name) {
                        data.name = element.textContent.trim();
                        break;
                    }
                }

                // Extract description from meta tags and content
                const metaDescription = document.querySelector('meta[name="description"]');
                if (metaDescription) {
                    data.description = metaDescription.content;
                } else {
                    // Fallback to first paragraph or content section
                    const contentSelectors = ['p', '.description', '.about', '.intro'];
                    for (const selector of contentSelectors) {
                        const element = document.querySelector(selector);
                        if (element && element.textContent.trim().length > 50) {
                            data.description = element.textContent.trim().substring(0, 300);
                            break;
                        }
                    }
                }

                // Extract contact information with multiple patterns
                const phonePatterns = [
                    /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
                    /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g,
                    /(\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g
                ];
                
                const emailPatterns = [
                    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
                    /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
                ];
                
                // Try multiple phone patterns
                for (const pattern of phonePatterns) {
                    const phoneMatch = bodyText.match(pattern);
                    if (phoneMatch) {
                        data.phone = phoneMatch[0].replace(/mailto:/i, '');
                        break;
                    }
                }
                
                // Try multiple email patterns and also check href attributes
                for (const pattern of emailPatterns) {
                    const emailMatch = bodyText.match(pattern);
                    if (emailMatch) {
                        data.email = emailMatch[0].replace(/mailto:/i, '');
                        break;
                    }
                }
                
                // Also check mailto links specifically
                const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
                if (!data.email && mailtoLinks.length > 0) {
                    data.email = mailtoLinks[0].href.replace('mailto:', '');
                }

                // Extract address information
                const addressPatterns = [
                    /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)[^,\n]*,?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/gi,
                    /\d+\s+[A-Za-z\s]+[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}\s*\d{5}/gi
                ];
                
                for (const pattern of addressPatterns) {
                    const addressMatch = bodyText.match(pattern);
                    if (addressMatch) {
                        data.address = addressMatch[0].trim();
                        break;
                    }
                }

                // Extract social media links with comprehensive search
                const links = document.querySelectorAll('a[href]');
                const socialMediaFound = {};
                
                links.forEach(link => {
                    const href = link.href.toLowerCase();
                    const linkText = link.textContent.toLowerCase();
                    const linkClass = link.className.toLowerCase();
                    
                    Object.entries(socialPlatforms).forEach(([platform, domains]) => {
                        domains.forEach(domain => {
                            if ((href.includes(domain) || linkText.includes(platform) || linkClass.includes(platform)) 
                                && !socialMediaFound[platform]) {
                                // Prefer actual URLs over text/class matches
                                if (href.includes(domain)) {
                                    socialMediaFound[platform] = link.href;
                                } else if (!socialMediaFound[platform]) {
                                    // Look for the actual URL in nearby elements or data attributes
                                    const actualUrl = link.getAttribute('data-url') || 
                                                    link.getAttribute('data-href') ||
                                                    link.href;
                                    if (actualUrl && actualUrl.includes(domain)) {
                                        socialMediaFound[platform] = actualUrl;
                                    }
                                }
                            }
                        });
                    });
                });
                
                // Also check for social media icons/buttons in footer and header areas
                const footerElements = document.querySelectorAll('footer, .footer, #footer, .social, .social-media, .social-links');
                footerElements.forEach(footer => {
                    const footerLinks = footer.querySelectorAll('a[href]');
                    footerLinks.forEach(link => {
                        const href = link.href.toLowerCase();
                        Object.entries(socialPlatforms).forEach(([platform, domains]) => {
                            domains.forEach(domain => {
                                if (href.includes(domain) && !socialMediaFound[platform]) {
                                    socialMediaFound[platform] = link.href;
                                }
                            });
                        });
                    });
                });
                
                // Copy found social media to data object
                Object.keys(socialPlatforms).forEach(platform => {
                    data.social_media[platform] = socialMediaFound[platform] || '';
                });

                // Extract van types and amenities from content
                const contentLower = bodyText.toLowerCase();
                
                vanTypeKeywords.forEach(keyword => {
                    if (contentLower.includes(keyword)) {
                        data.van_types.push(keyword);
                    }
                });

                amenityKeywords.forEach(keyword => {
                    if (contentLower.includes(keyword)) {
                        data.amenities.push(keyword);
                    }
                });

                console.log('🖼️ Starting enhanced photo extraction...');
                
                // Multiple image selection strategies
                const imageSelectors = [
                    'img[src]',
                    'img[data-src]', // Lazy loaded images
                    'img[data-lazy]',
                    'div[style*="background-image"]', // Background images
                    'section img', // Gallery sections
                    '.gallery img',
                    '.portfolio img',
                    '.slider img',
                    '.carousel img',
                    '.lightbox img'
                ];
                
                const photoTargets = [
                    'van', 'build', 'interior', 'exterior', 'custom', 'conversion', 'camper',
                    'sprinter', 'transit', 'promaster', 'rv', 'motorhome', 'coach',
                    'kitchen', 'bathroom', 'bedroom', 'solar', 'adventure', 'overland',
                    'gallery', 'portfolio', 'project', 'work', 'completed'
                ];
                
                const excludeKeywords = [
                    'logo', 'icon', 'avatar', 'profile', 'header', 'footer', 'nav',
                    'banner', 'ad', 'advertisement', 'placeholder', 'loading',
                    'thumbnail', 'thumb', 'social', 'facebook', 'instagram'
                ];
                
                let allImages = [];
                
                // Collect images from multiple selectors
                imageSelectors.forEach(selector => {
                    try {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(element => {
                            let src = null;
                            let alt = '';
                            
                            if (element.tagName === 'IMG') {
                                src = element.src || element.dataset.src || element.dataset.lazy;
                                alt = element.alt || '';
                            } else if (element.style.backgroundImage) {
                                const bgMatch = element.style.backgroundImage.match(/url\\(['"]?([^'")]+)['"]?\\)/);
                                if (bgMatch) src = bgMatch[1];
                                alt = element.getAttribute('aria-label') || element.title || '';
                            }
                            
                            if (src && src !== 'undefined' && !src.includes('data:image')) {
                                allImages.push({
                                    src,
                                    alt: alt.toLowerCase(),
                                    className: (element.className || '').toLowerCase(),
                                    width: element.width || element.offsetWidth || 0,
                                    height: element.height || element.offsetHeight || 0,
                                    element
                                });
                            }
                        });
                    } catch (e) {
                        console.log(`Error with selector ${selector}:`, e.message);
                    }
                });
                
                console.log(`Found ${allImages.length} total images`);
                
                // Filter and score images
                const scoredImages = allImages
                    .filter(img => {
                        // Basic quality filters
                        if (img.width < 150 || img.height < 100) return false;
                        if (img.src.length < 10) return false;
                        
                        // Exclude unwanted image types
                        const textToCheck = `${img.src} ${img.alt} ${img.className}`.toLowerCase();
                        return !excludeKeywords.some(keyword => textToCheck.includes(keyword));
                    })
                    .map(img => {
                        let score = 0;
                        const textToCheck = `${img.src} ${img.alt} ${img.className}`.toLowerCase();
                        
                        // Score based on van-related keywords
                        photoTargets.forEach(target => {
                            if (textToCheck.includes(target)) score += 3;
                        });
                        
                        // Bonus for larger images
                        if (img.width > 400 && img.height > 300) score += 2;
                        if (img.width > 600 && img.height > 400) score += 3;
                        
                        // Bonus for gallery/portfolio context
                        if (textToCheck.includes('gallery') || textToCheck.includes('portfolio')) score += 2;
                        
                        // Bonus for high-quality image formats
                        if (img.src.includes('.jpg') || img.src.includes('.jpeg') || img.src.includes('.png')) score += 1;
                        
                        return { ...img, score };
                    })
                    .sort((a, b) => b.score - a.score); // Sort by score descending
                
                console.log(`Filtered to ${scoredImages.length} quality images`);
                
                // Select top images (aim for 8, minimum 3)
                const selectedImages = scoredImages.slice(0, 12); // Take top 12 to have options
                
                selectedImages.forEach((img, index) => {
                    if (data.photos.length >= 8) return;
                    
                    try {
                        const fullSrc = img.src.startsWith('http') ? img.src : new URL(img.src, window.location.href).href;
                        
                        // Avoid duplicates
                        if (!data.photos.some(photo => photo.url === fullSrc)) {
                            data.photos.push({
                                url: fullSrc,
                                alt: img.element.alt || `Van build image ${data.photos.length + 1}`,
                                caption: ''
                            });
                            console.log(`Added photo ${data.photos.length}: ${fullSrc.substring(0, 60)}... (score: ${img.score})`);
                        }
                    } catch (e) {
                        console.log('Error processing image:', e.message);
                    }
                });
                
                console.log(`✅ Extracted ${data.photos.length} photos`);

                return data;
            }, { 
                url: result.url, 
                title: result.title, 
                vanTypeKeywords: this.vanTypeKeywords, 
                amenityKeywords: this.amenityKeywords,
                socialPlatforms: this.socialPlatforms 
            });

            // Ensure required fields have values
            if (!builderData.name) builderData.name = result.title;
            if (!builderData.state) builderData.state = targetState;
            
            // Ensure arrays have at least one item
            if (builderData.van_types.length === 0) {
                builderData.van_types.push('custom van');
            }
            if (builderData.amenities.length === 0) {
                builderData.amenities.push('custom build');
            }
            if (builderData.photos.length === 0) {
                builderData.photos.push({
                    url: '',
                    alt: 'No photos available',
                    caption: 'Photos not found on website'
                });
            }

            console.log(`✅ Data extracted for: ${builderData.name}`);
            console.log(`   📧 Email: ${builderData.email || 'Not found'}`);
            console.log(`   📞 Phone: ${builderData.phone || 'Not found'}`);
            console.log(`   📍 Address: ${builderData.address || 'Not found'}`);
            console.log(`   📱 Social Media: ${Object.keys(builderData.social_media).length} platforms found`);
            console.log(`   📷 Photos: ${builderData.photos.length} photos collected (target: 8)`);
            
            return { data: builderData, screenshot: builderScreenshot };
            
        } catch (error) {
            console.error(`❌ Error extracting data for ${result.title}:`, error.message);
            return null;
        }
    }
}

module.exports = DataExtractor;
