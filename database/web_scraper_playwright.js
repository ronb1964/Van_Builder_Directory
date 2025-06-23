#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

// Import all scraper modules
const playwrightConfig = require('./scraper_modules/playwright_config');
const searchEngines = require('./scraper_modules/search_engines');
const extractionUtils = require('./scraper_modules/extraction_utils');
const dataExtraction = require('./scraper_modules/data_extraction');
const photoProcessing = require('./scraper_modules/photo_processing');
const validation = require('./scraper_modules/validation');
const locationUtils = require('./scraper_modules/location_utils');
const databaseOps = require('./scraper_modules/database_operations');
const cleanupUtils = require('./scraper_modules/cleanup_utils');

class VanBuilderScraper {
    constructor(options = {}) {
        this.headless = !options.headed;
        this.fastMode = options.fast || false;
        this.browser = null;
        this.context = null;
        this.page = null;
        this.screenshots = [];
        this.results = [];
        this.braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
        this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
        
        if (!this.braveApiKey) {
            throw new Error('❌ BRAVE_SEARCH_API_KEY not found in environment variables');
        }
        
        if (!this.googleApiKey) {
            console.warn('⚠️ GOOGLE_MAPS_API_KEY not found - Google Places search will be disabled');
        }
    }

    async initialize() {
        const { browser, context, page } = await playwrightConfig.launchBrowserAndCreatePage({
            headless: this.headless,
            fastMode: this.fastMode
        });
        this.browser = browser;
        this.context = context;
        this.page = page;
    }

    async searchBrave(query) {
        return searchEngines.searchBrave(query, this.braveApiKey);
    }

    async searchGooglePlaces(query, location) {
        return searchEngines.searchGooglePlaces(query, location, this.googleApiKey);
    }

    async search(query) {
        console.log(`   🔍 Searching: "${query}"`);
        const results = [];
        
        // Try Brave search first
        try {
            const braveResults = await this.searchBrave(query);
            if (braveResults && braveResults.length > 0) {
                console.log(`   ✅ Brave Search found ${braveResults.length} results`);
                results.push(...braveResults);
            }
        } catch (error) {
            console.log(`   ⚠️ Brave Search failed: ${error.message}`);
        }
        
        // Try Google Places if available
        if (this.googleApiKey) {
            try {
                const googleResults = await this.searchGooglePlaces(query);
                if (googleResults && googleResults.length > 0) {
                    console.log(`   ✅ Google Places found ${googleResults.length} results`);
                    results.push(...googleResults);
                }
            } catch (error) {
                console.log(`   ⚠️ Google Places search failed: ${error.message}`);
            }
        }
        
        return results;
    }

    async verifyBuilderLocation(result, targetState) {
        return extractionUtils.verifyBuilderLocation(this, result, targetState);
    }

    async extractBuilderData(result, targetState) {
        console.log(`📊 Extracting data for: ${result.title}`);
        
        try {
            await this.page.goto(result.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            
            // Wait for content to load and handle any modals
            await this.page.waitForTimeout(3000);
            
            // Try to close any modals that might be blocking content
            try {
                const modalSelectors = [
                    'button[aria-label*="close"]',
                    'button[aria-label*="Close"]',
                    '.modal-close',
                    '.close-button',
                    '[data-dismiss="modal"]'
                ];
                
                for (const selector of modalSelectors) {
                    const closeButton = await this.page.$(selector);
                    if (closeButton) {
                        await closeButton.click();
                        await this.page.waitForTimeout(1000);
                        break;
                    }
                }
            } catch (e) {
                // Ignore modal closing errors
            }

            // Take screenshot of builder page
            const builderScreenshot = `builder_${Date.now()}.png`;
            await this.page.screenshot({ 
                path: builderScreenshot,
                fullPage: true 
            });
            this.screenshots.push(builderScreenshot);

            // Extract comprehensive data using modular functions
            const builderData = await this.page.evaluate(({ url, title, targetState }) => {
                const data = {
                    name: title, // Will be improved below
                    website: url,
                    address: '',
                    city: '',
                    state: targetState,
                    zip: '',
                    phone: '',
                    email: '',
                    description: '',
                    van_types: [],
                    amenities: [],
                    photos: [],
                    social_media: {}
                };
                
                // Use dataExtraction module functions (these need to be passed in)
                return data;
            }, { url: result.url, title: result.title, targetState });
            
            // Extract business name using modular function
            builderData.name = await dataExtraction.extractBusinessName(this.page) || result.title;
            
            // Extract contact information
            const contactInfo = await dataExtraction.extractContactInfo(this.page, targetState);
            builderData.phone = contactInfo.phone || builderData.phone;
            builderData.email = contactInfo.email || builderData.email;
            builderData.address = contactInfo.address || builderData.address;
            
            // Extract city from address
            if (builderData.address) {
                builderData.city = locationUtils.extractCityFromAddress(builderData.address);
            }
            
            // Extract description
            builderData.description = await dataExtraction.extractDescription(this.page);
            
            // Extract van types
            const vanTypeData = await dataExtraction.extractVanTypes(this.page);
            builderData.van_types = [vanTypeData.description]; // Use the formatted description
            
            // Extract amenities
            builderData.amenities = await dataExtraction.extractAmenities(this.page);
            
            // Extract social media
            builderData.social_media = await dataExtraction.extractSocialMedia(this.page);
            
            // Extract photos
            const photos = await photoProcessing.extractPhotos(this.page);
            
            // Score and format photos
            const scoredPhotos = photos.map(photo => ({
                ...photo,
                score: photoProcessing.scorePhotoRelevance(photo.url, photo.alt || '')
            }));
            
            // Sort by score and take top 8
            scoredPhotos.sort((a, b) => b.score - a.score);
            builderData.photos = photoProcessing.formatPhotosForDatabase(scoredPhotos.slice(0, 8));
            
            // Check for gallery pages if we need more photos
            if (builderData.photos.length < 8) {
                console.log(`   🔍 Searching for gallery/portfolio pages (current photos: ${builderData.photos.length})`);
                const hasGallery = await photoProcessing.detectGalleryPage(this.page);
                if (hasGallery) {
                    console.log(`   📸 Gallery page detected but not navigated (would need additional implementation)`);
                }
            }

            // Check About and Contact pages for additional info if needed
            if (!builderData.phone || !builderData.email || !builderData.address) {
                console.log(`   🔍 Checking About/Contact pages for missing info`);
                
                const additionalPages = await this.page.evaluate(() => {
                    const pageSelectors = [
                        'a[href*="about" i]',
                        'a[href*="contact" i]',
                        'a[href*="info" i]'
                    ];
                    
                    const pages = [];
                    pageSelectors.forEach(selector => {
                        const links = document.querySelectorAll(selector);
                        links.forEach(link => {
                            if (link.href && !pages.includes(link.href)) {
                                pages.push(link.href);
                            }
                        });
                    });
                    
                    return pages.slice(0, 2); // Limit to 2 additional pages
                });

                for (const pageUrl of additionalPages) {
                    try {
                        console.log(`   📄 Checking page: ${pageUrl}`);
                        await this.page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
                        await this.page.waitForTimeout(2000);

                        const additionalContact = await dataExtraction.extractContactInfo(this.page, targetState);
                        
                        // Update missing data
                        if (!builderData.phone && additionalContact.phone) {
                            builderData.phone = additionalContact.phone;
                            console.log(`   📞 Found phone on ${pageUrl}: ${additionalContact.phone}`);
                        }
                        if (!builderData.email && additionalContact.email) {
                            builderData.email = additionalContact.email;
                            console.log(`   📧 Found email on ${pageUrl}: ${additionalContact.email}`);
                        }
                        if (!builderData.address && additionalContact.address) {
                            builderData.address = additionalContact.address;
                            builderData.city = locationUtils.extractCityFromAddress(builderData.address);
                            console.log(`   📍 Found address on ${pageUrl}: ${additionalContact.address}`);
                        }

                    } catch (error) {
                        console.log(`   ⚠️ Could not check page ${pageUrl}: ${error.message}`);
                    }
                }

                // Return to original page
                await this.page.goto(result.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            }

            // Ensure required fields have values
            if (!builderData.name) builderData.name = result.title;
            if (!builderData.state) builderData.state = targetState;
            
            // Validate this is actually a van conversion builder
            const validationResult = validation.validateVanConversion(builderData);
            if (!validationResult.isValid) {
                console.log(`❌ SKIPPING: ${builderData.name} - ${validationResult.reason}`);
                return null;
            }
            
            // Clean and format the builder data
            const cleanedData = validation.cleanBuilderData(builderData);
            
            // Ensure arrays have at least one item
            if (cleanedData.van_types.length === 0) {
                cleanedData.van_types.push('custom van');
            }
            if (cleanedData.amenities.length === 0) {
                cleanedData.amenities.push('custom build');
            }
            if (cleanedData.photos.length === 0) {
                cleanedData.photos.push({
                    url: '',
                    alt: 'No photos available',
                    caption: 'Photos not found on website'
                });
            }

            console.log(`✅ Data extracted for: ${cleanedData.name}`);
            console.log(`   📧 Email: ${cleanedData.email || 'Not found'}`);
            console.log(`   📞 Phone: ${cleanedData.phone || 'Not found'}`);
            console.log(`   📍 Address: ${cleanedData.address || 'Not found'}`);
            console.log(`   📱 Social Media: ${Object.keys(cleanedData.social_media).length} platforms found`);
            console.log(`   📷 Photos: ${cleanedData.photos.length} photos collected (target: 8)`);
            
            return cleanedData;
        } catch (error) {
            console.error(`❌ Error extracting data for ${result.title}:`, error.message);
            return null;
        }
    }

    async scrapeState(state) {
        console.log(`\n🏗️ Starting scrape for ${state}...`);
        
        // Use multiple search queries for better coverage
        const webQueries = [
            `custom camper van builders in ${state}`,
            `van conversion companies ${state}`,
            `custom van builds ${state}`,
            `van conversions ${state.split(' ')[0] === 'New' ? state.split(' ').map(w => w[0]).join('') : state.substring(0, 2)}`
        ];
        
        // Google Places specific queries
        const placesQueries = [
            `van conversion ${state}`,
            `camper van builder ${state}`,
            `RV conversion ${state}`,
            `custom van ${state}`
        ];
        
        const allResults = [];
        const seenUrls = new Set();
        
        // Search with multiple web queries
        for (const query of webQueries) {
            console.log(`🔍 Searching: "${query}"`);
            const searchResults = await this.search(query);
            
            // Add unique results
            for (const result of searchResults) {
                if (!seenUrls.has(result.url)) {
                    seenUrls.add(result.url);
                    allResults.push(result);
                }
            }
            
            // Wait between searches to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Search Google Places for local businesses
        for (const query of placesQueries) {
            const placesResults = await this.searchGooglePlaces(query, state);
            
            // Add unique results
            for (const result of placesResults) {
                if (!seenUrls.has(result.url)) {
                    seenUrls.add(result.url);
                    allResults.push(result);
                }
            }
            
            // Wait between searches to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`📋 Found ${allResults.length} unique results from ${webQueries.length + placesQueries.length} queries`);
        
        if (allResults.length === 0) {
            console.log('❌ No search results found');
            return [];
        }

        const verifiedBuilders = [];
        
        for (const result of allResults) {
            console.log(`\n🔍 Processing: ${result.title}`);
            
            if ((await this.verifyBuilderLocation(result, state)).isValid) {
                const builderData = await this.extractBuilderData(result, state);
                
                if (builderData) {
                    verifiedBuilders.push(builderData);
                    console.log(`✅ Added builder: ${builderData.name}`);
                }
            } else {
                console.log(`❌ Skipped: ${result.title} (location not verified)`);
            }
            
            // Wait 2 seconds between verifications (respectful crawling)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        this.results = verifiedBuilders;
        return verifiedBuilders;
    }

    async saveResults(state) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `van_builders_${state.toLowerCase()}_${timestamp}.json`;
        
        // Calculate photo statistics
        const totalPhotos = this.results.reduce((sum, builder) => sum + builder.photos.length, 0);
        const avgPhotos = this.results.length > 0 ? (totalPhotos / this.results.length).toFixed(1) : 0;
        
        const output = {
            state: state,
            scraped_at: new Date().toISOString(),
            total_builders: this.results.length,
            total_photos: totalPhotos,
            avg_photos_per_builder: parseFloat(avgPhotos),
            screenshots: this.screenshots,
            builders: this.results
        };

        // Save to JSON file (backup)
        fs.writeFileSync(filename, JSON.stringify(output, null, 2));
        console.log(`\n💾 JSON backup saved to: ${filename}`);
        
        // Save to SQLite database
        await this.saveToDatabase(state);
        
        console.log(`📊 Total builders found: ${this.results.length}`);
        console.log(`📷 Total photos collected: ${totalPhotos}`);
        console.log(`📷 Average photos per builder: ${avgPhotos} (target: 8)`);
        
        return filename;
    }

    async saveToDatabase(state) {
        const dbPath = path.join(__dirname, '../Shell/server/van_builders.db');
        
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('❌ Error opening database:', err.message);
                    reject(err);
                    return;
                }
                console.log('🗄️ Connected to SQLite database');
            });

            // First, remove existing data for this state
            db.run('DELETE FROM builders WHERE state = ?', [state], function(err) {
                if (err) {
                    console.error('❌ Error clearing existing data:', err.message);
                    db.close();
                    reject(err);
                    return;
                }
                
                if (this.changes > 0) {
                    console.log(`🗑️ Removed ${this.changes} existing ${state} builders`);
                }

                // Insert new data
                const insertStmt = db.prepare(`
                    INSERT INTO builders (
                        name, city, state, lat, lng, zip, phone, email, website, 
                        description, van_types, amenities, gallery, social_media, address
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                let insertedCount = 0;
                const buildersToInsert = this.results; // Store reference before callback
                const insertPromises = buildersToInsert.map(builder => {
                    return new Promise((resolveInsert, rejectInsert) => {
                        // Extract city from address or use empty string
                        const city = builder.city || this.extractCityFromAddress(builder.address) || '';
                        
                        // Use default coordinates (will need geocoding later)
                        const lat = 0.0;
                        const lng = 0.0;
                        
                        // Format photos for gallery field - convert from scraper format to API format
                        const gallery = (builder.photos || []).map(photo => ({
                            url: photo.url,
                            alt: photo.alt || photo.url.split('/').pop() || 'Van build image',
                            caption: photo.caption || ''
                        }));
                        
                        insertStmt.run([
                            builder.name,
                            city,
                            state,
                            lat,
                            lng,
                            builder.zip || null,
                            builder.phone || null,
                            builder.email || null,
                            builder.website || null,
                            builder.description || null,
                            JSON.stringify(builder.van_types || []),
                            JSON.stringify(builder.amenities || []),
                            JSON.stringify(gallery),
                            JSON.stringify(builder.social_media || {}),
                            builder.address || null
                        ], function(err) {
                            if (err) {
                                console.error(`❌ Error inserting ${builder.name}:`, err.message);
                                rejectInsert(err);
                            } else {
                                insertedCount++;
                                console.log(`✅ Inserted: ${builder.name} with ${gallery.length} photos`);
                                resolveInsert();
                            }
                        });
                    });
                });

                Promise.all(insertPromises)
                    .then(() => {
                        insertStmt.finalize();
                        db.close((err) => {
                            if (err) {
                                console.error('❌ Error closing database:', err.message);
                                reject(err);
                            } else {
                                console.log(`🎉 Successfully saved ${insertedCount} builders to database`);
                                console.log('🗄️ Database connection closed');
                                resolve({ savedCount: insertedCount });
                            }
                        });
                    })
                    .catch(reject);
            });
        });
    }

    async analyzeSearchResults(targetState) {
        console.log(`\n📊 Analyzing search results for ${targetState}...\n`);
        const validResults = [];
        const rejectedResults = [];

        for (const result of this.searchResults) {
            console.log(`🔍 Checking: ${result.title}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   Description: ${result.snippet || 'No description'}`);
            
            // Use modular location verification
            const locationCheck = await extractionUtils.verifyBuilderLocation(this, result, targetState);
            
            if (locationCheck.isValid) {
                console.log(`   ✅ VALID: ${locationCheck.reason}`);
                validResults.push(result);
            } else {
                console.log(`   ❌ INVALID: ${locationCheck.reason}`);
                rejectedResults.push({ ...result, reason: locationCheck.reason });
            }
        }

        console.log(`\n📈 Analysis Summary:`);
        console.log(`   Valid Results: ${validResults.length}`);
        console.log(`   Rejected Results: ${rejectedResults.length}`);
        
        if (rejectedResults.length > 0) {
            console.log(`\n❌ Rejected builders:`);
            rejectedResults.forEach(r => {
                console.log(`   - ${r.title}: ${r.reason}`);
            });
        }

        return validResults;
    }

    extractCityFromAddress(address) {
        if (!address) return '';
        
        // Clean up the address first
        address = address.trim();
        
        // Try to extract city from address patterns like "City, State" or "City, ST ZIP"
        const patterns = [
            /([^,\d]+),\s*[A-Z]{2}\s*\d{5}/,          // City, ST ZIP
            /([^,\d]+),\s*[A-Z]{2}/,                  // City, ST
            /([^,\d]+),\s*(?:AZ|AL|CA|TX|FL|NJ)/,            // City, Arizona
            /([A-Za-z\s]+),\s*(?:AZ|AL|CA|TX|FL|NJ)/,        // Any city before AZ
            /(?:^|\s)([A-Za-z\s]+)\s+(?:AZ|AL|CA|TX|FL|NJ)/, // City before state
            /([A-Za-z\s]+)\s+\d{5}/                   // City before ZIP
        ];
        
        for (const pattern of patterns) {
            const match = address.match(pattern);
            if (match && match[1]) {
                let city = match[1].trim();
                // Remove common address prefixes
                city = city.replace(/^\d+\s+/, ''); // Remove street numbers
                city = city.replace(/^(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Cir|Court|Ct|Place|Pl)\s+/i, '');
                // Clean up and validate city name
                city = city.replace(/[^\w\s]/g, '').trim();
                if (city.length > 2 && city.length < 50 && !/^\d+$/.test(city)) {
                    return city;
                }
            }
        }
        
        // If no pattern matches, try to extract from common Arizona cities
        const azCities = [
            'Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe', 'Peoria', 'Surprise', 'Yuma', 'Avondale', 'Flagstaff', 'Goodyear', 'Buckeye', 'Lake Havasu City', 'Casa Grande', 'Sierra Vista', 'Maricopa', 'Oro Valley', 'Prescott', 'Apache Junction', 'Marana', 'Fountain Hills', 'Bullhead City', 'Prescott Valley', 'Sahuarita', 'Kingman', 'Drexel Heights', 'San Tan Valley', 'El Mirage', 'Fortuna Foothills', 'Anthem', 'Cave Creek', 'Sedona', 'Show Low', 'Catalina Foothills', 'Florence', 'Paradise Valley', 'Casas Adobes', 'Litchfield Park', 'Nogales', 'Douglas', 'Benson', 'Safford', 'Payson', 'Page', 'Globe', 'Winslow', 'Holbrook', 'Willcox', 'Tombstone', 'Bisbee', 'Cottonwood', 'Camp Verde', 'Wickenburg', 'Parker', 'Quartzsite', 'Lake Havasu', 'Sun City', 'Sun City West', 'Ahwatukee', 'Carefree', 'Fountain Hills'
        ];
        
        for (const city of azCities) {
            if (address.toLowerCase().includes(city.toLowerCase())) {
                return city;
            }
        }

        return '';
    }

    async cleanup() {
        await playwrightConfig.closeBrowserAndCleanup(this.browser, this.screenshots);
        this.screenshots = []; // Clear the array after cleanup, as the module handles deletion
    }

    getStateAbbreviation(state) {
        const stateAbbreviations = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
            'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
            'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
            'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
            'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
            'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
            'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
            'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
        return stateAbbreviations[state];
    }

    validateVanConversion(builderData) {
        const { name, description, website } = builderData;
        const text = `${name} ${description}`.toLowerCase();
        
        // REJECT: Directories, articles, and generic listings
        const rejectPatterns = [
            /\b(directory|guide|buyers?\s+guide|article|blog|list|top\s+\d+|best\s+\d+)\b/,
            /\b(yelp|search\s+results|marketplace|portal|listings?)\b/,
            /\b(companies\s+listed|conversion\s+companies\s+::|shop\s+conversion)\b/,
            /\b(explore\s+van|parked\s+in\s+paradise|expedition\s+portal)\b/,
            /\b(divine\s+on\s+the\s+road|vanlife\s+directory)\b/,
            /^(builders?|conversion\s+van)$/,
            /\b(paul\s+sherry|gmc\s+conversion\s+vans)\b/
        ];
        
        for (const pattern of rejectPatterns) {
            if (pattern.test(text)) {
                console.log(`❌ REJECTED: ${name} - Detected as directory/article/generic listing`);
                return { isValid: false, reason: 'Directory, article, or generic listing detected' };
            }
        }
        
        // Van conversion keywords (positive indicators)
        const vanKeywords = [
            'van conversion', 'camper van', 'custom van', 'van build', 'van builder',
            'sprinter conversion', 'transit conversion', 'promaster conversion',
            'adventure vehicle', 'expedition vehicle', 'overland', 'van life',
            'mobile home', 'tiny home on wheels', 'nomad', 'rv conversion'
        ];
        
        // Business type keywords
        const businessKeywords = [
            'llc', 'inc', 'company', 'corp', 'enterprises', 'solutions',
            'custom', 'builds', 'conversions', 'outfitters', 'fabrication'
        ];
        
        // Calculate score
        let score = 0;
        
        // Check for van conversion keywords
        vanKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                score += keyword.includes('van') ? 2 : 1;
            }
        });
        
        // Check for business indicators
        businessKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                score += 1;
            }
        });
        
        // Bonus for RV companies (many do van conversions)
        if (text.includes('rv') && !text.includes('food')) {
            score += 1;
        }
        
        // Bonus for having a business website domain
        if (website && !website.includes('yelp') && !website.includes('google') && 
            !website.includes('facebook') && !website.includes('expeditionportal') &&
            !website.includes('parkedinparadise') && !website.includes('vanlifedirectory')) {
            score += 1;
        }
        
        // Must have minimum score to be considered valid
        if (score < 1) {
            console.log(`❌ REJECTED: ${name} - Van conversion score too low: ${score}/1`);
            return { isValid: false, reason: `Insufficient van conversion indicators (score: ${score})` };
        }
        
        console.log(`✅ VALIDATED: ${builderData.name} - Van conversion score: ${score}/1`);
        return { isValid: true, reason: `Van conversion validated (score: ${score})` };
    }

    cleanPhone(phone) {
        if (!phone) return phone;
        
        // Extract just digits
        const digits = phone.replace(/[^\d]/g, '');
        
        // Format as (XXX) XXX-XXXX if we have 10 digits
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        } else if (digits.length === 11 && digits[0] === '1') {
            // Remove country code
            return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
        }
        
        return phone;
    }

    getSearchQueries(targetState) {
        const stateAbbrev = locationUtils.getStateAbbreviation(targetState);
        
        return [
            `custom camper van builders in ${targetState}`,
            `van conversion companies ${targetState}`,
            `custom van builds ${targetState}`,
            `van conversions ${stateAbbrev}`
        ];
    }

    async runScraper(targetState = 'New Jersey', queries = null) {
        try {
            console.log(`🚀 Starting Van Builder Scraper for ${targetState}`);
            console.log(`📅 ${new Date().toLocaleString()}\n`);

            // Initialize database
            await databaseOps.initializeDatabase();
            
            // Initialize Playwright if not already done
            if (!this.browser) {
                await this.initialize();
            }
            
            // Use passed queries or default ones
            const searchQueries = queries || this.getSearchQueries(targetState);
            
            const allResults = [];
            const seenUrls = new Set();

            // Execute searches with all queries
            console.log(`\n🔍 Executing ${searchQueries.length} search queries:`);
            for (const query of searchQueries) {
                console.log(`\n📌 Searching: "${query}"`);
                const results = await this.search(query);
                
                // Deduplicate by URL
                const newResults = results.filter(r => {
                    if (seenUrls.has(r.url)) {
                        console.log(`   ⚠️ Duplicate URL skipped: ${r.url}`);
                        return false;
                    }
                    seenUrls.add(r.url);
                    return true;
                });
                
                console.log(`   ✅ Found ${results.length} results (${newResults.length} unique)`);
                allResults.push(...newResults);
            }
            
            console.log(`\n📊 Total unique results across all queries: ${allResults.length}`);
            this.searchResults = allResults;

            // Analyze results
            const validResults = await this.analyzeSearchResults(targetState);

            // Extract data for valid results
            console.log(`\n📦 Extracting detailed data for ${validResults.length} builders...\n`);
            this.builders = [];
            
            for (const result of validResults) {
                const builderData = await this.extractBuilderData(result, targetState);
                if (builderData) {
                    this.builders.push(builderData);
                } else {
                    console.log(`⚠️ Failed to extract data for: ${result.title}`);
                }
            }

            console.log(`\n✅ Successfully extracted data for ${this.builders.length} builders`);

            // Save results using modular database operations
            const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
            const filename = await databaseOps.saveResultsToFile(this.builders, targetState, timestamp);
            
            if (filename) {
                console.log(`\n💾 Results saved to: ${filename}`);
            }

            // Save to database using modular database operations
            const dbResult = await databaseOps.saveToDatabase(this.builders, targetState);
            
            console.log(`\n🗄️ Database Update Summary:`);
            console.log(`   Builders saved: ${dbResult.savedCount}`);
            console.log(`   Target state: ${targetState}`);

            console.log(`\n📊 Final Summary:`);
            console.log(`   Total search results: ${this.searchResults.length}`);
            console.log(`   Valid results analyzed: ${validResults.length}`);
            console.log(`   Builders extracted: ${this.builders.length}`);
            console.log(`   Success rate: ${((this.builders.length / validResults.length) * 100).toFixed(1)}%`);
            
            // Cleanup using modular cleanup utilities
            const cleanup = await cleanupUtils.cleanupTempFiles('./screenshots');
            console.log(`\n🧹 Screenshot Cleanup: ${cleanup.deletedCount} files removed, ${cleanupUtils.formatFileSize(cleanup.totalSize)} saved`);
            
            // Clean up old JSON data files (keep last 7 days)
            const dataCleanup = await cleanupUtils.cleanupOldDataFiles('./', 7);
            
            return this.builders;
        } catch (error) {
            console.error('❌ Scraper error:', error);
            throw error;
        } finally {
            await this.close();
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
🏗️ Van Builder Scraper (Playwright Edition)

Usage:
    node web_scraper_playwright.js <state> [options]

Examples:
    node web_scraper_playwright.js "New Jersey"
    node web_scraper_playwright.js "Arizona" --headed
    node web_scraper_playwright.js "California" --fast

Options:
    --headed    Run browser in headed mode (visible)
    --fast      Enable fast mode (blocks images/stylesheets)

This enhanced scraper uses 4 different query types for comprehensive coverage.

Photo Collection: Strives for 8 photos per builder (minimum 1 required)
Cleanup: Screenshots are automatically removed after scraping completes
        `);
        process.exit(1);
    }

    const state = args[0];
    const options = {
        headed: args.includes('--headed'),
        fast: args.includes('--fast')
    };

    console.log(`🎯 Target State: ${state}`);
    console.log(`🖥️ Mode: ${options.headed ? 'Headed' : 'Headless'}`);
    console.log(`⚡ Fast Mode: ${options.fast ? 'Enabled' : 'Disabled'}`);
    console.log(`📷 Photo Target: 8 photos per builder`);

    const scraper = new VanBuilderScraper(options);

    try {
        await scraper.initialize();
        const results = await scraper.runScraper(state);
        
        console.log(`\n🎉 Scraping completed successfully!`);
        console.log(`📊 Found ${results.length} verified builders in ${state}`);
        
    } catch (error) {
        console.error('❌ Scraping failed:', error);
        process.exit(1);
    } finally {
        await scraper.close();
    }
}

// Export for module use
module.exports = { VanBuilderScraper };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
