const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class EnhancedWebsiteScraper {
    constructor() {
        this.browser = null;
        this.context = null;
        this.builders = [];
    }

    async initialize() {
        console.log('🚀 Initializing Enhanced Website Scraper with Geocoding...');
        this.browser = await chromium.launch({ 
            headless: false,
            timeout: 60000 
        });
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
    }

    // Enhanced geocoding function using multiple services
    async geocodeAddress(address) {
        console.log(`   🌍 Geocoding address: ${address}`);
        
        try {
            // Method 1: Use OpenStreetMap Nominatim (free service)
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
            
            const page = await this.context.newPage();
            const response = await page.goto(nominatimUrl);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                
                console.log(`   ✅ Geocoded: ${lat}, ${lng}`);
                await page.close();
                
                return {
                    lat: lat,
                    lng: lng,
                    accuracy: 'high',
                    source: 'nominatim'
                };
            }
            
            await page.close();
        } catch (error) {
            console.log(`   ⚠️ Nominatim geocoding failed: ${error.message}`);
        }

        // Method 2: Fallback to coordinate estimation based on city/state
        return this.estimateCoordinatesByCity(address);
    }

    estimateCoordinatesByCity(address) {
        console.log(`   📍 Estimating coordinates for: ${address}`);
        
        // City center coordinates for common Arkansas cities
        const arkansasCities = {
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

        const addressLower = address.toLowerCase();
        
        for (const [city, coords] of Object.entries(arkansasCities)) {
            if (addressLower.includes(city)) {
                console.log(`   📍 Estimated coordinates for ${city}: ${coords.lat}, ${coords.lng}`);
                return {
                    lat: coords.lat,
                    lng: coords.lng,
                    accuracy: 'city-level',
                    source: 'estimated'
                };
            }
        }

        // Default to Fayetteville if no city match
        console.log(`   📍 Using default Fayetteville coordinates`);
        return {
            lat: 36.0822,
            lng: -94.1719,
            accuracy: 'default',
            source: 'fallback'
        };
    }

    async scrapeWebsite(url, expectedBuilderName, state = 'Arkansas') {
        console.log(`\n🔍 Scraping: ${url}`);
        const page = await this.context.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(3000);
            
            const builderData = {
                name: expectedBuilderName,
                website: url,
                address: '',
                city: '',
                state: state,
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
            
            // Extract contact info (same as before)
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
            
            // Enhanced address extraction
            console.log('   🏠 Extracting address information...');
            const addressElements = await page.$$eval('*', elements => {
                const addresses = [];
                const statePattern = new RegExp(`${state}|AR\\s+\\d{5}`, 'i');
                
                elements.forEach(el => {
                    const text = el.textContent || '';
                    if (statePattern.test(text) && text.length < 200) {
                        addresses.push(text.trim());
                    }
                });
                return addresses;
            });
            
            if (addressElements.length > 0) {
                // Find the most complete address
                const bestAddress = addressElements.reduce((best, current) => {
                    return current.length > best.length ? current : best;
                }, '');
                
                builderData.address = bestAddress;
                
                // Extract city and ZIP
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
                
                // GEOCODE THE ADDRESS
                builderData.coordinates = await this.geocodeAddress(builderData.address);
            }
            
            // Extract social media, photos, description (same as before)
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
            
            // Extract photos
            console.log('   📸 Extracting photos...');
            const images = await page.$$eval('img', imgs => {
                return imgs.map(img => ({
                    src: img.src,
                    alt: img.alt || '',
                    width: img.naturalWidth || 0,
                    height: img.naturalHeight || 0
                })).filter(img => 
                    img.src && 
                    !img.src.includes('logo') && 
                    !img.src.includes('icon') &&
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
    
    cleanPhone(phone) {
        // Remove all non-digits and format as (XXX) XXX-XXXX
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 10) {
            return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
        }
        return phone;
    }

    // Generate SQL INSERT statements with coordinates
    generateSQLInserts(state) {
        const stateAbbrev = this.getStateAbbreviation(state);
        let sql = `-- Enhanced ${state} builders with geocoded coordinates\n\n`;
        
        this.builders.forEach((builder, index) => {
            if (!builder) return;
            
            const coords = builder.coordinates || {};
            const lat = coords.lat || null;
            const lng = coords.lng || null;
            
            const cleanAddress = builder.address.replace(/,.*?(Arkansas|AR).*?\d{5}/i, '').trim();
            
            sql += `-- ${builder.name} (Coordinates: ${lat}, ${lng} - ${coords.accuracy || 'unknown'} accuracy)\n`;
            sql += `INSERT INTO builders (name, city, state, zip, address, phone, email, website, lat, lng, van_types, amenities, services, social_media, photos, description, lead_time) VALUES (\n`;
            sql += `  '${builder.name.replace(/'/g, "''")}',\n`;
            sql += `  '${builder.city || 'Unknown'}',\n`;
            sql += `  '${stateAbbrev}',\n`;
            sql += `  '${builder.zip || ''}',\n`;
            sql += `  '${cleanAddress.replace(/'/g, "''")}',\n`;
            sql += `  '${builder.phone || ''}',\n`;
            sql += `  '${builder.email || ''}',\n`;
            sql += `  '${builder.website}',\n`;
            sql += `  ${lat || 'NULL'},\n`;
            sql += `  ${lng || 'NULL'},\n`;
            sql += `  '${Array.isArray(builder.van_types) ? builder.van_types.join(', ') : 'Custom Van'}',\n`;
            sql += `  '${JSON.stringify(builder.amenities || ['Custom Build']).replace(/'/g, "''")}',\n`;
            sql += `  '${JSON.stringify(builder.services || ['Custom Builds']).replace(/'/g, "''")}',\n`;
            sql += `  '${JSON.stringify(builder.social_media || []).replace(/'/g, "''")}',\n`;
            sql += `  '${JSON.stringify(builder.photos || []).replace(/'/g, "''")}',\n`;
            sql += `  '${(builder.description || `Professional custom van conversion specialist in ${state}.`).replace(/'/g, "''")}',\n`;
            sql += `  'Contact for details'\n`;
            sql += `);\n\n`;
        });
        
        return sql;
    }

    getStateAbbreviation(stateName) {
        const stateMap = {
            'arkansas': 'AR', 'california': 'CA', 'texas': 'TX', 'florida': 'FL',
            'colorado': 'CO', 'washington': 'WA', 'oregon': 'OR', 'utah': 'UT',
            'arizona': 'AZ', 'nevada': 'NV', 'montana': 'MT', 'wyoming': 'WY',
            'idaho': 'ID', 'new mexico': 'NM', 'north carolina': 'NC', 'south carolina': 'SC',
            'georgia': 'GA', 'tennessee': 'TN', 'kentucky': 'KY', 'virginia': 'VA',
            'west virginia': 'WV', 'maryland': 'MD', 'delaware': 'DE', 'new jersey': 'NJ',
            'new york': 'NY', 'connecticut': 'CT', 'rhode island': 'RI', 'massachusetts': 'MA',
            'vermont': 'VT', 'new hampshire': 'NH', 'maine': 'ME', 'pennsylvania': 'PA',
            'ohio': 'OH', 'michigan': 'MI', 'indiana': 'IN', 'illinois': 'IL',
            'wisconsin': 'WI', 'minnesota': 'MN', 'iowa': 'IA', 'missouri': 'MO',
            'north dakota': 'ND', 'south dakota': 'SD', 'nebraska': 'NE', 'kansas': 'KS',
            'oklahoma': 'OK', 'louisiana': 'LA', 'mississippi': 'MS', 'alabama': 'AL',
            'alaska': 'AK', 'hawaii': 'HI'
        };
        return stateMap[stateName.toLowerCase()] || stateName.toUpperCase();
    }

    async saveResults(state) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `van_builders_${state.toLowerCase()}_enhanced_${timestamp}.json`;
        const filepath = path.join(__dirname, filename);
        
        const sqlFilename = `${state.toLowerCase()}_builders_with_coordinates.sql`;
        const sqlFilepath = path.join(__dirname, sqlFilename);
        
        // Save JSON
        fs.writeFileSync(filepath, JSON.stringify(this.builders, null, 2));
        console.log(`\n💾 Results saved to: ${filename}`);
        
        // Save SQL
        const sql = this.generateSQLInserts(state);
        fs.writeFileSync(sqlFilepath, sql);
        console.log(`📄 SQL inserts saved to: ${sqlFilename}`);
        
        // Summary
        console.log(`\n📊 SCRAPING SUMMARY:`);
        console.log(`   🏢 Total builders: ${this.builders.length}`);
        console.log(`   📍 With coordinates: ${this.builders.filter(b => b?.coordinates?.lat).length}`);
        console.log(`   🎯 High accuracy: ${this.builders.filter(b => b?.coordinates?.accuracy === 'high').length}`);
        console.log(`   🏙️ City-level: ${this.builders.filter(b => b?.coordinates?.accuracy === 'city-level').length}`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

// Example usage function
async function scrapeStateBuilders(websites, state = 'Arkansas') {
    const scraper = new EnhancedWebsiteScraper();
    
    try {
        await scraper.initialize();
        
        for (const { url, name } of websites) {
            const builderData = await scraper.scrapeWebsite(url, name, state);
            if (builderData) {
                scraper.builders.push(builderData);
            }
            
            // Wait between requests to be respectful
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        await scraper.saveResults(state);
        
    } catch (error) {
        console.error('❌ Scraping failed:', error);
    } finally {
        await scraper.close();
    }
}

module.exports = { EnhancedWebsiteScraper, scrapeStateBuilders }; 