const { EnhancedWebsiteScraper } = require('./enhanced_scraper_with_geocoding');
const { scraperConfig } = require('./scraper_config');

// CONFIGURATION: Edit this section for each new state
const STATE_CONFIG = {
    name: 'Alaska',  // Changed from Alabama to Alaska
    websites: [
        { url: 'https://www.vanquestak.com/', name: 'VanQuest Alaska' },
        { url: 'https://www.alaskacampervanconversions.com/', name: 'Alaska Campervan Conversions' },
        { url: 'https://www.backcountryvans.com/', name: 'Backcountry Vans' }
    ]
};

// Additional city coordinates for better geocoding fallbacks
// Alaska major cities for geocoding
const STATE_CITY_COORDINATES = {
    'anchorage': { lat: 61.2181, lng: -149.9003 },
    'fairbanks': { lat: 64.8378, lng: -147.7164 },
    'juneau': { lat: 58.3019, lng: -134.4197 },
    'sitka': { lat: 57.0531, lng: -135.3300 },
    'ketchikan': { lat: 55.3422, lng: -131.6461 },
    'wasilla': { lat: 61.5814, lng: -149.4394 },
    'palmer': { lat: 61.5997, lng: -149.1128 },
    'kodiak': { lat: 57.7900, lng: -152.4044 },
    'bethel': { lat: 60.7922, lng: -161.7558 },
    'nome': { lat: 64.5011, lng: -165.4064 }
};

class StateSpecificScraper extends EnhancedWebsiteScraper {
    constructor(stateName, cityCoordinates = {}) {
        super();
        this.stateName = stateName;
        this.stateAbbrev = this.getStateAbbreviation(stateName);
        this.cityCoordinates = cityCoordinates;
    }

    // Override the city estimation method to use state-specific coordinates
    estimateCoordinatesByCity(address) {
        console.log(`   📍 Estimating coordinates for: ${address}`);
        
        const addressLower = address.toLowerCase();
        
        // First try state-specific cities
        for (const [city, coords] of Object.entries(this.cityCoordinates)) {
            if (addressLower.includes(city)) {
                console.log(`   📍 Found ${city} coordinates: ${coords.lat}, ${coords.lng}`);
                return {
                    lat: coords.lat,
                    lng: coords.lng,
                    accuracy: 'city-level',
                    source: 'state-specific'
                };
            }
        }

        // Fallback to first city in the list
        const firstCity = Object.values(this.cityCoordinates)[0];
        if (firstCity) {
            console.log(`   📍 Using default coordinates: ${firstCity.lat}, ${firstCity.lng}`);
            return {
                lat: firstCity.lat,
                lng: firstCity.lng,
                accuracy: 'default',
                source: 'fallback'
            };
        }

        // Final fallback to geographic center of US
        console.log(`   📍 Using US center coordinates`);
        return {
            lat: 39.8283,
            lng: -98.5795,
            accuracy: 'country-level',
            source: 'us-center'
        };
    }

    // Enhanced address extraction for the specific state
    async extractStateAddress(page, stateName) {
        const statePattern = new RegExp(`${stateName}|${this.stateAbbrev}\\s+\\d{5}`, 'i');
        
        const addressElements = await page.$$eval('*', (elements, pattern) => {
            const addresses = [];
            const regex = new RegExp(pattern, 'i');
            
            elements.forEach(el => {
                const text = el.textContent || '';
                if (regex.test(text) && text.length < 200 && text.length > 10) {
                    addresses.push(text.trim());
                }
            });
            return addresses;
        }, statePattern.source);

        return addressElements;
    }

    async scrapeWebsite(url, expectedBuilderName) {
        console.log(`\n🔍 Scraping ${this.stateName}: ${url}`);
        const page = await this.context.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(3000);
            
            const builderData = {
                name: expectedBuilderName,
                website: url,
                address: '',
                city: '',
                state: this.stateName,
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
            
            // Enhanced address extraction using state-specific method
            console.log('   🏠 Extracting address information...');
            const addressElements = await this.extractStateAddress(page, this.stateName);
            
            if (addressElements.length > 0) {
                const bestAddress = addressElements.reduce((best, current) => {
                    return current.length > best.length ? current : best;
                }, '');
                
                builderData.address = bestAddress;
                
                // Extract city and ZIP with state-specific patterns
                const cityPattern = new RegExp(`([^,\\d]+),?\\s*(${this.stateName}|${this.stateAbbrev})\\s*(\\d{5})?`, 'i');
                const cityMatch = builderData.address.match(cityPattern);
                
                if (cityMatch) {
                    builderData.city = cityMatch[1].trim();
                    if (cityMatch[3]) {
                        builderData.zip = cityMatch[3];
                    }
                }
                
                console.log(`   🏠 Address: ${builderData.address}`);
                console.log(`   🏙️ City: ${builderData.city}`);
                console.log(`   📮 ZIP: ${builderData.zip}`);
                
                // GEOCODE THE ADDRESS with Google Maps precision
                builderData.coordinates = await scraperConfig.geocodeAddress(builderData.address, builderData.name);
            }
            
            // Extract social media
            console.log('   📱 Extracting social media...');
            const socialLinks = await page.$$eval('a[href*="instagram"], a[href*="facebook"], a[href*="twitter"], a[href*="youtube"], a[href*="tiktok"], a[href*="linkedin"]', links => {
                return links.map(link => link.href).filter(href => 
                    href.includes('instagram.com') || 
                    href.includes('facebook.com') ||
                    href.includes('twitter.com') ||
                    href.includes('youtube.com') ||
                    href.includes('tiktok.com') ||
                    href.includes('linkedin.com')
                );
            });
            
            builderData.social_media = [...new Set(socialLinks)];
            console.log(`   📱 Social Media: ${builderData.social_media.length} links found`);
            
            // Extract photos with enhanced filtering
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
                    !img.src.toLowerCase().includes('favicon') &&
                    img.width > 200 && 
                    img.height > 150 &&
                    !img.src.includes('data:image')
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
                     text.toLowerCase().includes('build') ||
                     text.toLowerCase().includes('conversion'))
                );
            });
            
            if (descriptionElements.length > 0) {
                builderData.description = descriptionElements[0].trim();
                console.log(`   📝 Description: ${builderData.description.substring(0, 100)}...`);
            }
            
            // Extract van types and amenities
            console.log('   🚐 Extracting van types and amenities...');
            const pageText = await page.evaluate(() => document.body.textContent.toLowerCase());
            
            const vanTypes = [
                'sprinter', 'transit', 'promaster', 'ram promaster', 'ford transit', 
                'mercedes sprinter', 'chevy express', 'gmc savana', 'nissan nv200',
                'ram 1500', 'ram 2500', 'ram 3500', 'ford e-series'
            ];
            const foundVanTypes = vanTypes.filter(type => pageText.includes(type));
            builderData.van_types = foundVanTypes;
            
            const amenityKeywords = [
                'solar', 'plumbing', 'electrical', 'kitchen', 'bathroom', 'shower',
                'water tank', 'grey water', 'fresh water', 'inverter', 'battery', 'lithium',
                'refrigerator', 'fridge', 'sink', 'stove', 'cooktop', 'bed', 'seating', 
                'storage', 'cabinets', 'flooring', 'insulation', 'ventilation', 'fan',
                'heating', 'air conditioning', 'ac', 'awning', 'roof rack', 'bike rack',
                'composting toilet', 'cassette toilet', 'diesel heater', 'propane'
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
    console.log(`🚀 Starting ${STATE_CONFIG.name} Van Builder Scraper`);
    console.log(`📋 Target websites: ${STATE_CONFIG.websites.length}`);
    
    const scraper = new StateSpecificScraper(STATE_CONFIG.name, STATE_CITY_COORDINATES);
    
    try {
        await scraper.initialize();
        
        for (const { url, name } of STATE_CONFIG.websites) {
            console.log(`\n🔄 Processing: ${name}`);
            const builderData = await scraper.scrapeWebsite(url, name);
            
            if (builderData) {
                scraper.builders.push(builderData);
                console.log(`✅ Successfully scraped: ${name}`);
            } else {
                console.log(`❌ Failed to scrape: ${name}`);
            }
            
            // Be respectful - wait between requests
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        await scraper.saveResults(STATE_CONFIG.name);
        
        console.log(`\n🎉 ${STATE_CONFIG.name} scraping completed!`);
        console.log(`📊 Results: ${scraper.builders.length} builders processed`);
        
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

module.exports = { StateSpecificScraper, STATE_CONFIG }; 