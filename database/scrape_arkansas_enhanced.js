const { EnhancedWebsiteScraper } = require('./enhanced_scraper_with_geocoding');

// Arkansas-specific configuration
const ARKANSAS_CONFIG = {
    name: 'Arkansas',
    websites: [
        { url: 'https://www.ozkcustoms.com/', name: 'OZK Customs' },
        { url: 'https://www.openroad.cool/', name: 'Open Road' }
    ]
};

// Arkansas major cities for geocoding fallbacks
const ARKANSAS_CITY_COORDINATES = {
    'fayetteville': { lat: 36.0822, lng: -94.1719 },
    'little rock': { lat: 34.7465, lng: -92.2896 },
    'fort smith': { lat: 35.3859, lng: -94.3985 },
    'springdale': { lat: 36.1867, lng: -94.1288 },
    'jonesboro': { lat: 35.8423, lng: -90.7043 },
    'north little rock': { lat: 34.7695, lng: -92.2671 },
    'conway': { lat: 35.0887, lng: -92.4421 },
    'rogers': { lat: 36.3320, lng: -94.1185 },
    'pine bluff': { lat: 34.2284, lng: -92.0032 },
    'bentonville': { lat: 36.3729, lng: -94.2088 }
};

class ArkansasVanBuilderScraper extends EnhancedWebsiteScraper {
    constructor() {
        super();
        this.stateName = 'Arkansas';
        this.stateAbbrev = 'AR';
        this.cityCoordinates = ARKANSAS_CITY_COORDINATES;
    }

    // Override geocoding to use Arkansas-specific city coordinates
    estimateCoordinatesByCity(address) {
        console.log(`   📍 Estimating Arkansas coordinates for: ${address}`);
        
        const addressLower = address.toLowerCase();
        
        // Check Arkansas cities
        for (const [city, coords] of Object.entries(this.cityCoordinates)) {
            if (addressLower.includes(city)) {
                console.log(`   📍 Found ${city} coordinates: ${coords.lat}, ${coords.lng}`);
                return {
                    lat: coords.lat,
                    lng: coords.lng,
                    accuracy: 'city-level',
                    source: 'arkansas-specific'
                };
            }
        }

        // Default to Fayetteville (where both current builders are located)
        console.log(`   📍 Using Fayetteville default coordinates`);
        return {
            lat: 36.0822,
            lng: -94.1719,
            accuracy: 'default',
            source: 'arkansas-fallback'
        };
    }

    // Arkansas-specific address extraction
    async extractArkansasAddress(page) {
        const addressElements = await page.$$eval('*', elements => {
            const addresses = [];
            elements.forEach(el => {
                const text = el.textContent || '';
                // Look for Arkansas addresses
                if ((text.includes('Arkansas') || text.match(/AR\s+\d{5}/)) && 
                    text.length < 200 && text.length > 10) {
                    addresses.push(text.trim());
                }
            });
            return addresses;
        });

        return addressElements;
    }

    async scrapeWebsite(url, expectedBuilderName) {
        console.log(`\n🔍 Scraping Arkansas: ${url}`);
        const page = await this.context.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(3000);
            
            const builderData = {
                name: expectedBuilderName,
                website: url,
                address: '',
                city: '',
                state: 'Arkansas',
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
            
            // Extract contact information
            console.log('   📋 Extracting contact information...');
            
            // Phone numbers
            const phoneElements = await page.$$eval('*', elements => {
                const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
                const phones = [];
                elements.forEach(el => {
                    const text = el.textContent || '';
                    const matches = text.match(phoneRegex);
                    if (matches) phones.push(...matches);
                });
                return [...new Set(phones)];
            });
            
            if (phoneElements.length > 0) {
                builderData.phone = this.cleanPhone(phoneElements[0]);
                console.log(`   📞 Phone: ${builderData.phone}`);
            }
            
            // Email addresses
            const emailElements = await page.$$eval('*', elements => {
                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                const emails = [];
                elements.forEach(el => {
                    const text = el.textContent || '';
                    const href = el.href || '';
                    const matches = (text + ' ' + href).match(emailRegex);
                    if (matches) emails.push(...matches);
                });
                return [...new Set(emails)];
            });
            
            if (emailElements.length > 0) {
                builderData.email = emailElements[0];
                console.log(`   ✉️ Email: ${builderData.email}`);
            }
            
            // Extract Arkansas address
            console.log('   🏠 Extracting Arkansas address...');
            const addressElements = await this.extractArkansasAddress(page);
            
            if (addressElements.length > 0) {
                const bestAddress = addressElements.reduce((best, current) => {
                    return current.length > best.length ? current : best;
                }, '');
                
                builderData.address = bestAddress;
                
                // Extract city and ZIP for Arkansas
                const cityMatch = builderData.address.match(/([^,\d]+),?\s*(Arkansas|AR)\s*(\d{5})?/i);
                if (cityMatch) {
                    builderData.city = cityMatch[1].trim();
                    if (cityMatch[3]) {
                        builderData.zip = cityMatch[3];
                    }
                }
                
                console.log(`   🏠 Address: ${builderData.address}`);
                console.log(`   🏙️ City: ${builderData.city}`);
                console.log(`   📮 ZIP: ${builderData.zip}`);
                
                // GEOCODE THE ADDRESS with Arkansas-specific fallbacks
                builderData.coordinates = await this.geocodeAddress(builderData.address);
            }
            
            // Extract social media
            console.log('   📱 Extracting social media...');
            const socialLinks = await page.$$eval('a[href*="instagram"], a[href*="facebook"], a[href*="twitter"], a[href*="youtube"], a[href*="tiktok"]', links => {
                return links.map(link => link.href).filter(href => 
                    href.includes('instagram.com') || 
                    href.includes('facebook.com') ||
                    href.includes('twitter.com') ||
                    href.includes('youtube.com') ||
                    href.includes('tiktok.com')
                );
            });
            
            builderData.social_media = [...new Set(socialLinks)];
            console.log(`   📱 Social Media: ${builderData.social_media.length} links found`);
            
            // Extract photos in standardized format
            console.log('   📸 Extracting photos...');
            const images = await page.$$eval('img', imgs => {
                return imgs.map(img => ({
                    src: img.src,
                    alt: img.alt || '',
                    width: img.naturalWidth || 0,
                    height: img.naturalHeight || 0
                })).filter(img => 
                    img.src && 
                    !img.src.toLowerCase().includes('logo') && 
                    !img.src.toLowerCase().includes('icon') &&
                    img.width > 200 && 
                    img.height > 150
                );
            });
            
            const sortedImages = images.sort((a, b) => (b.width * b.height) - (a.width * a.height));
            builderData.photos = sortedImages.slice(0, 8).map(img => ({
                url: img.src,
                alt: img.alt || `${expectedBuilderName} van conversion`,
                caption: ''
            }));
            console.log(`   📸 Photos: ${builderData.photos.length} high-quality images found`);
            
            // Extract description
            console.log('   📝 Extracting description...');
            const descriptionElements = await page.$$eval('p, div', elements => {
                return elements.map(el => el.textContent || '').filter(text => 
                    text.length > 100 && 
                    text.length < 1000 &&
                    (text.toLowerCase().includes('van') || 
                     text.toLowerCase().includes('custom') ||
                     text.toLowerCase().includes('build'))
                );
            });
            
            if (descriptionElements.length > 0) {
                builderData.description = descriptionElements[0].trim();
                console.log(`   📝 Description: ${builderData.description.substring(0, 100)}...`);
            }
            
            // Extract van types and amenities
            console.log('   🚐 Extracting van types and amenities...');
            const pageText = await page.evaluate(() => document.body.textContent.toLowerCase());
            
            const vanTypes = ['sprinter', 'transit', 'promaster', 'ram promaster', 'ford transit', 'mercedes sprinter'];
            const foundVanTypes = vanTypes.filter(type => pageText.includes(type));
            builderData.van_types = foundVanTypes;
            
            const amenityKeywords = [
                'solar', 'plumbing', 'electrical', 'kitchen', 'bathroom', 'shower',
                'water tank', 'grey water', 'inverter', 'battery', 'refrigerator',
                'sink', 'stove', 'bed', 'seating', 'storage', 'cabinets', 'flooring',
                'insulation', 'ventilation', 'heating', 'air conditioning'
            ];
            
            const foundAmenities = amenityKeywords.filter(amenity => pageText.includes(amenity));
            builderData.amenities = foundAmenities;
            
            console.log(`   🚐 Van Types: ${builderData.van_types.join(', ')}`);
            console.log(`   ⚙️ Amenities: ${builderData.amenities.length} found`);
            console.log(`   📍 Coordinates: ${builderData.coordinates?.lat}, ${builderData.coordinates?.lng} (${builderData.coordinates?.accuracy})`);
            
            return builderData;
            
        } catch (error) {
            console.error(`❌ Error scraping ${url}:`, error.message);
            return null;
        } finally {
            await page.close();
        }
    }
}

async function main() {
    console.log('🚀 Starting Enhanced Arkansas Van Builder Scraper');
    console.log('📋 This will scrape with automatic geocoding for precise coordinates');
    
    const scraper = new ArkansasVanBuilderScraper();
    
    try {
        await scraper.initialize();
        
        for (const { url, name } of ARKANSAS_CONFIG.websites) {
            console.log(`\n🔄 Processing: ${name}`);
            const builderData = await scraper.scrapeWebsite(url, name);
            
            if (builderData) {
                scraper.builders.push(builderData);
                console.log(`✅ Successfully scraped: ${name}`);
                
                // Show coordinate info
                const coords = builderData.coordinates;
                if (coords) {
                    console.log(`   📍 Coordinates: ${coords.lat}, ${coords.lng} (${coords.accuracy} accuracy)`);
                }
            } else {
                console.log(`❌ Failed to scrape: ${name}`);
            }
            
            // Be respectful - wait between requests
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        await scraper.saveResults('Arkansas');
        
        console.log('\n🎉 Enhanced Arkansas scraping completed!');
        console.log(`📊 Results: ${scraper.builders.length} builders with geocoded coordinates`);
        
        // Show coordinate summary
        const withCoords = scraper.builders.filter(b => b?.coordinates?.lat);
        const highAccuracy = scraper.builders.filter(b => b?.coordinates?.accuracy === 'high');
        
        console.log(`\n📍 COORDINATE SUMMARY:`);
        console.log(`   🎯 Total with coordinates: ${withCoords.length}/${scraper.builders.length}`);
        console.log(`   🔥 High accuracy (street-level): ${highAccuracy.length}`);
        console.log(`   🏙️ City-level accuracy: ${withCoords.length - highAccuracy.length}`);
        
    } catch (error) {
        console.error('❌ Scraping failed:', error);
    } finally {
        await scraper.close();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ArkansasVanBuilderScraper, ARKANSAS_CONFIG }; 