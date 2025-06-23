const { EnhancedWebsiteScraper } = require('./enhanced_scraper_with_geocoding');
const { scraperConfig } = require('./scraper_config');

class BackcountryVansScraper extends EnhancedWebsiteScraper {
    constructor() {
        super('Alaska', {
            'anchorage': { lat: 61.2181, lng: -149.9003 }
        });
    }

    async scrapeBackcountryVans() {
        console.log('🔍 Manual scraping of Backcountry Vans with extended timeout...');
        const page = await this.context.newPage();
        
        try {
            // Extended timeout and more forgiving loading
            await page.goto('https://www.backcountryvans.com/', { 
                waitUntil: 'domcontentloaded', 
                timeout: 60000 // 60 seconds
            });
            
            console.log('✅ Page loaded successfully');
            await page.waitForTimeout(5000); // Extra wait for dynamic content
            
            const builderData = {
                name: 'Backcountry Vans',
                website: 'https://www.backcountryvans.com/',
                address: '',
                city: 'Anchorage',
                state: 'Alaska', 
                zip: '',
                phone: '',
                email: '',
                social_media: [],
                van_types: [],
                amenities: [],
                services: [],
                description: '',
                photos: [],
                lead_time: '',
                years_experience: '',
                coordinates: null
            };

            // Extract contact info
            console.log('📞 Extracting contact information...');
            const contactInfo = await this.extractContactInfo(page);
            Object.assign(builderData, contactInfo);
            
            // Extract business description
            console.log('📝 Extracting description...');
            builderData.description = await this.extractDescription(page);
            
            // Extract social media
            console.log('📱 Extracting social media...');
            builderData.social_media = await this.extractSocialMedia(page);
            
            // Extract van types and amenities
            console.log('🚐 Extracting van types...');
            builderData.van_types = await this.extractVanTypes(page);
            builderData.amenities = await this.extractAmenities(page);
            
            // Extract photos - focus on gallery
            console.log('📸 Extracting photos from gallery...');
            
            // First, try to find and navigate to gallery page
            const galleryUrl = await page.evaluate(() => {
                const galleryLinks = Array.from(document.querySelectorAll('a'));
                const galleryLink = galleryLinks.find(link => {
                    const text = link.textContent.toLowerCase();
                    return text.includes('gallery') || text.includes('portfolio') || 
                           text.includes('projects') || text.includes('work');
                });
                return galleryLink ? galleryLink.href : null;
            });
            
            if (galleryUrl) {
                console.log(`🎯 Found gallery page: ${galleryUrl}`);
                try {
                    await page.goto(galleryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    await page.waitForTimeout(3000);
                    console.log('✅ Gallery page loaded');
                } catch (error) {
                    console.log('⚠️ Could not load gallery page:', error.message);
                }
            }
            
            // Extract photos from current page (gallery or main page)
            builderData.photos = await this.extractPhotos(page);
            console.log(`📸 Extracted ${builderData.photos.length} photos`);
            
            // If we still don't have many photos, try to find more image sources
            if (builderData.photos.length < 5) {
                console.log('🔍 Looking for additional photo sources...');
                
                // Check for image galleries, sliders, etc.
                const additionalPhotos = await page.evaluate(() => {
                    const images = [];
                    
                    // Look for background images in CSS
                    const elementsWithBg = document.querySelectorAll('*');
                    elementsWithBg.forEach(el => {
                        const style = window.getComputedStyle(el);
                        const bgImage = style.backgroundImage;
                        if (bgImage && bgImage.includes('url(')) {
                            const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
                            if (match && match[1]) {
                                const url = match[1];
                                if (url.match(/\.(jpg|jpeg|png|webp)$/i) && 
                                    !url.includes('logo') && 
                                    !url.includes('icon')) {
                                    images.push({
                                        url: url.startsWith('http') ? url : new URL(url, window.location.href).href,
                                        alt: 'Backcountry Vans conversion',
                                        caption: ''
                                    });
                                }
                            }
                        }
                    });
                    
                    // Look for data attributes with image URLs
                    const dataImages = document.querySelectorAll('[data-src], [data-background], [data-image]');
                    dataImages.forEach(el => {
                        const dataSrc = el.getAttribute('data-src') || 
                                       el.getAttribute('data-background') || 
                                       el.getAttribute('data-image');
                        if (dataSrc && dataSrc.match(/\.(jpg|jpeg|png|webp)$/i)) {
                            images.push({
                                url: dataSrc.startsWith('http') ? dataSrc : new URL(dataSrc, window.location.href).href,
                                alt: 'Backcountry Vans conversion',
                                caption: ''
                            });
                        }
                    });
                    
                    return images;
                });
                
                // Add unique additional photos
                const existingUrls = new Set(builderData.photos.map(p => p.url));
                additionalPhotos.forEach(photo => {
                    if (!existingUrls.has(photo.url)) {
                        builderData.photos.push(photo);
                    }
                });
                
                console.log(`📸 Total photos after additional search: ${builderData.photos.length}`);
            }
            
            // Geocode the address if we found one
            if (builderData.address) {
                console.log('🌍 Geocoding address...');
                builderData.coordinates = await scraperConfig.geocodeAddress(builderData.address, builderData.name);
            }
            
            console.log('\n📊 Backcountry Vans Scraping Results:');
            console.log('=====================================');
            console.log(`Name: ${builderData.name}`);
            console.log(`Address: ${builderData.address}`);
            console.log(`Phone: ${builderData.phone}`);
            console.log(`Email: ${builderData.email}`);
            console.log(`Description: ${builderData.description ? builderData.description.substring(0, 100) + '...' : 'None'}`);
            console.log(`Van Types: ${builderData.van_types.join(', ')}`);
            console.log(`Amenities: ${builderData.amenities.length} found`);
            console.log(`Social Media: ${builderData.social_media.length} links`);
            console.log(`Photos: ${builderData.photos.length} images`);
            console.log(`Coordinates: ${builderData.coordinates ? 'Found' : 'Not found'}`);
            
            return builderData;
            
        } catch (error) {
            console.error('❌ Error scraping Backcountry Vans:', error.message);
            return null;
        } finally {
            await page.close();
        }
    }
}

async function main() {
    console.log('🚀 Starting Backcountry Vans Manual Scraper');
    
    const scraper = new BackcountryVansScraper();
    
    try {
        await scraper.initialize();
        
        const builderData = await scraper.scrapeBackcountryVans();
        
        if (builderData) {
            // Save results
            const fs = require('fs');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backcountry_vans_scraped_${timestamp}.json`;
            
            fs.writeFileSync(filename, JSON.stringify(builderData, null, 2));
            console.log(`\n💾 Results saved to: ${filename}`);
            
            // Generate SQL update
            const sqlFilename = `backcountry_vans_update.sql`;
            const sqlContent = generateUpdateSQL(builderData);
            fs.writeFileSync(sqlFilename, sqlContent);
            console.log(`📄 SQL update saved to: ${sqlFilename}`);
            
            console.log('\n✅ Backcountry Vans manual scraping completed successfully!');
        } else {
            console.log('\n❌ Scraping failed');
        }
        
    } catch (error) {
        console.error('❌ Manual scraping failed:', error);
    } finally {
        await scraper.close();
    }
}

function generateUpdateSQL(builderData) {
    return `-- Backcountry Vans manual scraping update

UPDATE builders SET 
    address = '${builderData.address.replace(/'/g, "''")}',
    phone = '${builderData.phone}',
    email = '${builderData.email}',
    description = '${builderData.description.replace(/'/g, "''")}',
    van_types = '${builderData.van_types.join(', ')}',
    amenities = '${JSON.stringify(builderData.amenities)}',
    social_media = '${JSON.stringify(builderData.social_media)}',
    photos = '${JSON.stringify(builderData.photos)}',
    lat = ${builderData.coordinates?.lat || 'NULL'},
    lng = ${builderData.coordinates?.lng || 'NULL'}
WHERE name = 'Backcountry Vans' AND state = 'AK';
`;
}

if (require.main === module) {
    main().catch(console.error);
} 