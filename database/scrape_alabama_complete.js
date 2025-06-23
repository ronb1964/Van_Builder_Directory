const sqlite3 = require('sqlite3').verbose();
const { chromium } = require('playwright');
const path = require('path');

class AlabamaBuilderScraper {
    constructor() {
        this.browser = null;
        this.context = null;
        this.db = null;
    }

    async initialize() {
        console.log('🚀 Initializing Alabama Builder Scraper...');
        
        // Initialize database
        this.db = new sqlite3.Database(path.join(__dirname, 'builders.db'));
        
        // Initialize browser
        this.browser = await chromium.launch({ 
            headless: false,
            timeout: 60000 
        });
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
    }

    async getAlabamaBuilders() {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT * FROM builders WHERE state IN ('Alabama', 'AL') ORDER BY name",
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async geocodeAddress(address) {
        console.log(`   🌍 Geocoding address: ${address}`);
        
        // Use the enhanced geocoding system with Google Maps
        const { EnhancedGeocodingSystem } = require('./enhanced_geocoding_system');
        const geocoder = new EnhancedGeocodingSystem();
        
        try {
            const result = await geocoder.geocodeAddress(address);
            
            if (result) {
                console.log(`   ✅ Google Maps geocoded: ${result.lat}, ${result.lng} (accuracy: ${result.accuracy})`);
                return { 
                    lat: result.lat, 
                    lng: result.lng,
                    accuracy: result.accuracy,
                    source: result.service
                };
            }
        } catch (error) {
            console.log(`   ⚠️ Google geocoding failed: ${error.message}`);
        }

        // Fallback to Alabama city coordinates
        const alabamaCities = {
            'birmingham': { lat: 33.5207, lng: -86.8025 },
            'huntsville': { lat: 34.7304, lng: -86.5861 },
            'mobile': { lat: 30.6954, lng: -88.0399 },
            'montgomery': { lat: 32.3668, lng: -86.3000 },
            'tuscaloosa': { lat: 33.2098, lng: -87.5692 },
            'midfield': { lat: 33.4668, lng: -86.9036 }
        };

        const addressLower = address.toLowerCase();
        for (const [city, coords] of Object.entries(alabamaCities)) {
            if (addressLower.includes(city)) {
                console.log(`   📍 Using coordinates for ${city}: ${coords.lat}, ${coords.lng}`);
                return { ...coords, accuracy: 'city-level', source: 'fallback' };
            }
        }

        // Default to Birmingham
        return { lat: 33.5207, lng: -86.8025, accuracy: 'default', source: 'fallback' };
    }

    async scrapeBuilderWebsite(builder) {
        console.log(`\n🔍 Scraping: ${builder.name} - ${builder.website}`);
        const page = await this.context.newPage();
        
        try {
            await page.goto(builder.website, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(3000);
            
            const scrapedData = {
                address: '',
                phone: '',
                email: '',
                social_media: {},
                van_types: [],
                amenities: [],
                services: [],
                description: '',
                photos: [],
                lat: null,
                lng: null
            };

            // Extract phone numbers
            console.log('   📞 Extracting phone numbers...');
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
                scrapedData.phone = this.formatPhone(phoneElements[0]);
                console.log(`   📞 Found phone: ${scrapedData.phone}`);
            }

            // Extract email addresses
            console.log('   ✉️ Extracting email addresses...');
            const emailElements = await page.$$eval('*', elements => {
                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                const emails = [];
                elements.forEach(el => {
                    const text = el.textContent || '';
                    const href = el.href || '';
                    const matches = (text + ' ' + href).match(emailRegex);
                    if (matches) emails.push(...matches);
                });
                return [...new Set(emails)].filter(email => 
                    !email.includes('example.') && !email.includes('placeholder')
                );
            });
            
            if (emailElements.length > 0) {
                scrapedData.email = emailElements[0];
                console.log(`   ✉️ Found email: ${scrapedData.email}`);
            }

            // Extract address
            console.log('   🏠 Extracting address...');
            const addressElements = await page.$$eval('*', elements => {
                const addresses = [];
                const addressPattern = /\b\d+[^,\n]*(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)[^,\n]*,?\s*[^,\n]*,?\s*(alabama|al)\s*\d{5}/gi;
                
                elements.forEach(el => {
                    const text = el.textContent || '';
                    const matches = text.match(addressPattern);
                    if (matches) {
                        addresses.push(...matches.map(addr => addr.trim()));
                    }
                });
                return [...new Set(addresses)];
            });
            
            if (addressElements.length > 0) {
                scrapedData.address = addressElements[0];
                console.log(`   🏠 Found address: ${scrapedData.address}`);
            }

            // Extract social media links
            console.log('   📱 Extracting social media links...');
            const socialLinks = await page.$$eval('a[href]', links => {
                const socials = {};
                const socialPlatforms = {
                    'facebook.com': 'facebook',
                    'instagram.com': 'instagram',
                    'twitter.com': 'twitter',
                    'youtube.com': 'youtube',
                    'linkedin.com': 'linkedin',
                    'tiktok.com': 'tiktok'
                };
                
                links.forEach(link => {
                    const href = link.href || '';
                    for (const [domain, platform] of Object.entries(socialPlatforms)) {
                        if (href.includes(domain) && !href.includes('sharer')) {
                            socials[platform] = href;
                        }
                    }
                });
                return socials;
            });
            
            scrapedData.social_media = socialLinks;
            console.log(`   📱 Found social media:`, Object.keys(socialLinks));

            // Extract van types and services
            console.log('   🚐 Extracting van types and services...');
            const vanTypesAndServices = await page.$$eval('*', elements => {
                const vanTypes = new Set();
                const services = new Set();
                const amenities = new Set();
                
                const vanKeywords = ['sprinter', 'transit', 'promaster', 'ram', 'mercedes', 'ford', 'fiat', 'van conversion', 'campervan', 'motorhome', 'rv', 'bus conversion'];
                const serviceKeywords = ['custom build', 'conversion', 'upfit', 'modification', 'installation', 'design', 'fabrication', 'electrical', 'plumbing', 'cabinetry'];
                const amenityKeywords = ['solar', 'lithium', 'toilet', 'shower', 'kitchen', 'bed', 'storage', 'heating', 'air conditioning', 'inverter', 'refrigerator', 'water tank'];
                
                elements.forEach(el => {
                    const text = el.textContent?.toLowerCase() || '';
                    
                    vanKeywords.forEach(keyword => {
                        if (text.includes(keyword)) {
                            vanTypes.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
                        }
                    });
                    
                    serviceKeywords.forEach(keyword => {
                        if (text.includes(keyword)) {
                            services.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
                        }
                    });
                    
                    amenityKeywords.forEach(keyword => {
                        if (text.includes(keyword)) {
                            amenities.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
                        }
                    });
                });
                
                return {
                    vanTypes: Array.from(vanTypes),
                    services: Array.from(services),
                    amenities: Array.from(amenities)
                };
            });
            
            scrapedData.van_types = vanTypesAndServices.vanTypes;
            scrapedData.services = vanTypesAndServices.services;
            scrapedData.amenities = vanTypesAndServices.amenities;
            
            console.log(`   🚐 Found van types: ${scrapedData.van_types.join(', ')}`);
            console.log(`   🔧 Found services: ${scrapedData.services.join(', ')}`);
            console.log(`   ⚡ Found amenities: ${scrapedData.amenities.join(', ')}`);

            // Extract description
            console.log('   📝 Extracting description...');
            const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
            if (description) {
                scrapedData.description = description;
                console.log(`   📝 Found description: ${description.substring(0, 100)}...`);
            }

            // Extract photos
            console.log('   📸 Extracting photos...');
            const photos = await page.$$eval('img', imgs => {
                return imgs
                    .map(img => img.src)
                    .filter(src => src && 
                        (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp')) &&
                        !src.includes('logo') && !src.includes('icon') &&
                        !src.includes('avatar') && src.length > 50
                    )
                    .slice(0, 8); // Limit to 8 photos as per PRD
            });
            
            scrapedData.photos = photos;
            console.log(`   📸 Found ${photos.length} photos`);

            // Geocode the address if we found one
            if (scrapedData.address) {
                const coords = await this.geocodeAddress(scrapedData.address);
                scrapedData.lat = coords.lat;
                scrapedData.lng = coords.lng;
            }

            await page.close();
            return scrapedData;
            
        } catch (error) {
            console.error(`   ❌ Error scraping ${builder.name}: ${error.message}`);
            await page.close();
            return null;
        }
    }

    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    }

    async updateBuilder(builderId, scrapedData) {
        return new Promise((resolve, reject) => {
            const updateQuery = `
                UPDATE builders SET 
                    address = COALESCE(?, address),
                    phone = COALESCE(?, phone),
                    email = COALESCE(?, email),
                    social_media = ?,
                    van_types = ?,
                    amenities = ?,
                    services = ?,
                    description = COALESCE(?, description),
                    photos = ?,
                    lat = COALESCE(?, lat),
                    lng = COALESCE(?, lng),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const values = [
                scrapedData.address || null,
                scrapedData.phone || null,
                scrapedData.email || null,
                JSON.stringify(scrapedData.social_media),
                JSON.stringify(scrapedData.van_types),
                JSON.stringify(scrapedData.amenities),
                JSON.stringify(scrapedData.services),
                scrapedData.description || null,
                JSON.stringify(scrapedData.photos),
                scrapedData.lat || null,
                scrapedData.lng || null,
                builderId
            ];

            this.db.run(updateQuery, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    async scrapeAllAlabamaBuilders() {
        console.log('🏁 Starting Alabama builders comprehensive scrape...\n');
        
        const builders = await this.getAlabamaBuilders();
        console.log(`Found ${builders.length} Alabama builders to scrape:`);
        
        builders.forEach(builder => {
            console.log(`- ${builder.name} (${builder.website})`);
        });

        let successCount = 0;
        let errorCount = 0;

        for (const builder of builders) {
            try {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`Processing: ${builder.name}`);
                console.log(`${'='.repeat(60)}`);
                
                const scrapedData = await this.scrapeBuilderWebsite(builder);
                
                if (scrapedData) {
                    const changes = await this.updateBuilder(builder.id, scrapedData);
                    console.log(`   ✅ Successfully updated ${builder.name} (${changes} changes)`);
                    successCount++;
                } else {
                    console.log(`   ❌ Failed to scrape data for ${builder.name}`);
                    errorCount++;
                }
                
                // Add delay between scrapes to be respectful
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`   ❌ Error processing ${builder.name}: ${error.message}`);
                errorCount++;
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log('SCRAPING SUMMARY');
        console.log(`${'='.repeat(60)}`);
        console.log(`Total builders processed: ${builders.length}`);
        console.log(`Successfully updated: ${successCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Success rate: ${((successCount / builders.length) * 100).toFixed(1)}%`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
        if (this.db) {
            this.db.close();
        }
    }
}

// Main execution
async function main() {
    const scraper = new AlabamaBuilderScraper();
    
    try {
        await scraper.initialize();
        await scraper.scrapeAllAlabamaBuilders();
        console.log('\n🎉 Alabama scraping completed successfully!');
    } catch (error) {
        console.error('\n💥 Scraping failed:', error);
    } finally {
        await scraper.close();
    }
}

if (require.main === module) {
    main();
}

module.exports = AlabamaBuilderScraper; 