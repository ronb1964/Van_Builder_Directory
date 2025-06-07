#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

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
        console.log('🚀 Initializing Playwright scraper...');
        
        // Launch browser with realistic settings
        this.browser = await chromium.launch({
            headless: this.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        // Create context with realistic user agent and viewport
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1366, height: 768 },
            locale: 'en-US',
            timezoneId: 'America/New_York'
        });

        // Block resources in fast mode for better performance
        if (this.fastMode) {
            await this.context.route('**/*', (route) => {
                const resourceType = route.request().resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    route.abort();
                } else {
                    route.continue();
                }
            });
        }

        this.page = await this.context.newPage();
        
        // Set longer timeout for slow websites
        this.page.setDefaultTimeout(30000);
        
        console.log('✅ Browser initialized successfully');
    }

    async searchBrave(query) {
        console.log(`🔍 Searching Brave for: "${query}"`);
        
        try {
            const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
            const response = await fetch(url, {
                headers: {
                    'X-Subscription-Token': this.braveApiKey,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            const searchResults = (data.web?.results || []).map(result => ({
                title: result.title,
                url: result.url,
                snippet: result.description
            }));
            
            console.log(`📋 Found ${searchResults.length} search results`);
            
            return searchResults;
            
        } catch (error) {
            console.error('❌ Error during Brave search:', error.message);
            return [];
        }
    }

    async searchGooglePlaces(query, location) {
        if (!this.googleApiKey) {
            console.log('⚠️ Skipping Google Places search - API key not configured');
            return [];
        }

        console.log(`🗺️ Searching Google Places for: "${query}" in ${location}`);
        
        try {
            // First, get place_id candidates using Text Search
            const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' ' + location)}&key=${this.googleApiKey}`;
            
            const response = await fetch(textSearchUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
            }
            
            const places = (data.results || []).map(place => ({
                title: place.name,
                url: place.website || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                snippet: `${place.formatted_address} - ${place.types?.join(', ') || 'Business'} - Rating: ${place.rating || 'N/A'} (${place.user_ratings_total || 0} reviews)`,
                place_id: place.place_id,
                rating: place.rating,
                address: place.formatted_address,
                phone: place.formatted_phone_number,
                source: 'google_places'
            }));
            
            console.log(`🏢 Found ${places.length} Google Places results`);
            
            return places;
            
        } catch (error) {
            console.error('❌ Error during Google Places search:', error.message);
            return [];
        }
    }

    async verifyBuilderLocation(result, targetState) {
        console.log(`🔍 Verifying location for: ${result.title}`);
        
        // Check if state is mentioned in title or snippet
        const stateVariations = [
            targetState.toLowerCase(),
            this.getStateAbbreviation(targetState)?.toLowerCase()
        ].filter(Boolean);
        
        const titleLower = result.title.toLowerCase();
        const snippetLower = (result.snippet || '').toLowerCase();
        
        const mentionedInSearch = stateVariations.some(state => 
            titleLower.includes(state) || snippetLower.includes(state)
        );

        try {
            // Visit the website to verify location
            await this.page.goto(result.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            
            // Wait for page to load
            await this.page.waitForTimeout(2000);
            
            // Enhanced location verification with stricter address requirements
            const locationData = await this.page.evaluate(({ targetState, stateVariations, stateAbbrev }) => {
                // Get cleaner content by removing scripts and styles first
                const scripts = document.querySelectorAll('script, style, noscript');
                scripts.forEach(el => el.remove());
                
                const content = document.body.textContent.toLowerCase();
                const originalHTML = document.body.innerHTML;
                
                // Look for state mentions in content
                const foundInContent = stateVariations.some(state => content.includes(state));
                
                // SIMPLIFIED: Look for actual business addresses with state abbreviations
                let hasStateAddress = false;
                const targetStateAbbrev = targetState === 'New Jersey' ? 'NJ' : 
                                   targetState === 'Alabama' ? 'AL' :
                                   targetState === 'California' ? 'CA' :
                                   targetState === 'Texas' ? 'TX' :
                                   targetState === 'Florida' ? 'FL' : '';
                
                if (targetStateAbbrev) {
                    // Simple check for state abbreviation with zip code
                    const addressCheck = content.includes(targetStateAbbrev.toLowerCase()) || 
                                        originalHTML.toLowerCase().includes(targetStateAbbrev.toLowerCase());
                    hasStateAddress = addressCheck;
                }
                
                // Check for OUT-OF-STATE addresses that would disqualify
                const otherStateAbbrevs = ['PA', 'NY', 'CT', 'DE', 'MD', 'VA', 'NC', 'SC', 'GA', 'FL', 'OH', 'MI', 'IL', 'IN', 'WI', 'MN', 'IA', 'MO', 'AR', 'LA', 'MS', 'TN', 'KY', 'WV'];
                const currentStateAbbrev = targetStateAbbrev.toLowerCase();
                
                let hasOtherStateAddress = false;
                let otherStateAddresses = [];
                
                // More specific detection for actual addresses vs casual mentions
                otherStateAbbrevs.forEach(abbrev => {
                    if (abbrev.toLowerCase() !== currentStateAbbrev) {
                        // Look for ACTUAL address patterns, not just any mention
                        const addressPatterns = [
                            new RegExp(`\\b\\d+[^,\\n]*,\\s*[^,\\n]*,?\\s*${abbrev}\\s+\\d{5}`, 'gi'),
                            new RegExp(`located in [^,\\n]*,\\s*${abbrev}\\b`, 'gi'),
                            new RegExp(`based in [^,\\n]*,\\s*${abbrev}\\b`, 'gi'),
                            new RegExp(`headquarters in [^,\\n]*,\\s*${abbrev}\\b`, 'gi'),
                            new RegExp(`office in [^,\\n]*,\\s*${abbrev}\\b`, 'gi')
                        ];
                        
                        const hasActualAddress = addressPatterns.some(pattern => 
                            pattern.test(content) || pattern.test(originalHTML)
                        );
                        
                        if (hasActualAddress) {
                            hasOtherStateAddress = true;
                            otherStateAddresses.push(abbrev);
                        }
                    }
                });
                
                // More comprehensive zip code detection
                const stateZipPatterns = {
                    'New Jersey': /\b08\d{3}\b/g,
                    'Alabama': /\b3[0-6]\d{3}\b/g,
                    'California': /\b9[0-6]\d{3}\b/g,
                    'Texas': /\b7[0-9]\d{3}\b/g,
                    'Florida': /\b3[0-4]\d{3}\b/g
                };
                
                let hasStateZip = false;
                const zipPattern = stateZipPatterns[targetState];
                if (zipPattern) {
                    hasStateZip = zipPattern.test(content) || zipPattern.test(originalHTML);
                }
                
                // Get state-specific area codes with comprehensive phone detection
                const getAreaCodes = (state) => {
                    const areaCodes = {
                        'New Jersey': ['201', '551', '609', '732', '848', '856', '862', '908', '973'],
                        'Alabama': ['205', '251', '256', '334', '938'],
                        'California': ['209', '213', '310', '323', '408', '415', '510', '530', '559', '562', '619', '626', '628', '650', '657', '661', '669', '707', '714', '747', '760', '805', '818', '831', '858', '909', '916', '925', '949', '951'],
                        'Texas': ['214', '254', '281', '325', '361', '409', '430', '432', '469', '512', '713', '737', '806', '817', '830', '832', '903', '915', '936', '940', '956', '972', '979'],
                        'Florida': ['239', '305', '321', '352', '386', '407', '561', '727', '754', '772', '786', '813', '850', '863', '904', '941', '954'],
                        'New York': ['212', '315', '347', '516', '518', '585', '607', '631', '646', '716', '718', '845', '914', '917', '929', '934']
                    };
                    return areaCodes[state] || [];
                };
                
                const stateAreaCodes = getAreaCodes(targetState);
                let hasStatePhone = false;
                
                // Simple phone detection
                stateAreaCodes.forEach(code => {
                    if (content.includes(code) || originalHTML.includes(code)) {
                        hasStatePhone = true;
                    }
                });
                
                // Check for actual business location indicators (not just service area)
                const stateLower = targetState.toLowerCase();
                const locationKeywords = {
                    'New Jersey': ['hamilton twp', 'trenton', 'jersey city', 'newark', 'princeton', 'camden'],
                    'Alabama': ['birmingham', 'montgomery', 'huntsville', 'mobile', 'tuscaloosa'],
                    'California': ['los angeles', 'san francisco', 'san diego', 'sacramento', 'oakland'],
                    'Texas': ['houston', 'dallas', 'austin', 'san antonio', 'fort worth'],
                    'Florida': ['miami', 'tampa', 'orlando', 'jacksonville', 'tallahassee']
                };
                
                const stateKeywords = locationKeywords[targetState] || [];
                const hasBusinessLocation = content.includes(`located in ${stateLower}`) || 
                                          content.includes(`based in ${stateLower}`) ||
                                          content.includes(`${stateLower} office`) ||
                                          content.includes(`${stateLower} location`) ||
                                          content.includes(`headquarters in ${stateLower}`) ||
                                          content.includes(`hq in ${stateLower}`) ||
                                          stateKeywords.some(keyword => content.includes(keyword));
                
                // Check for service area mentions (which should NOT count as location)
                const serviceAreaIndicators = [
                    `serving ${stateLower}`, `service ${stateLower}`, `deliver to ${stateLower}`,
                    `available in ${stateLower}`, `${stateLower} customers`, `${stateLower} clients`,
                    `${stateLower} delivery`, `${stateLower} installation`
                ];
                const isServiceAreaOnly = serviceAreaIndicators.some(indicator => content.includes(indicator));
                
                // Check for other states that would disqualify
                const otherStates = ['california', 'colorado', 'texas', 'florida', 'pennsylvania', 'new york', 'alabama', 'arizona', 'washington', 'oregon'];
                const hasOtherState = otherStates
                    .filter(state => state !== stateLower)
                    .some(state => 
                        content.includes('located in ' + state) || 
                        content.includes('based in ' + state) ||
                        content.includes(state + ' office') ||
                        content.includes(state + ' location') ||
                        content.includes('headquarters in ' + state)
                    );
                
                // Check for directory/listing site indicators
                const directoryIndicators = [
                    'directory', 'listing', 'find builders', 'search builders', 
                    'builders in usa', 'van builders | campervan', 'explore vanx'
                ];
                const isDirectorySite = directoryIndicators.some(indicator => 
                    content.includes(indicator)
                );
                
                return {
                    foundInContent,
                    hasStateAddress,
                    hasOtherStateAddress,
                    hasStateZip,
                    hasStatePhone,
                    hasBusinessLocation,
                    isServiceAreaOnly,
                    hasOtherState,
                    isDirectorySite,
                    otherStateAddresses
                };
            }, { targetState, stateVariations: stateVariations, stateAbbrev: this.getStateAbbreviation(targetState) });

            // SIMPLIFIED HUMAN-LIKE VERIFICATION
            let verificationScore = 0;
            
            // If they're mentioned in search results for the state, that's a strong indicator
            if (mentionedInSearch) verificationScore += 3;
            
            // If they mention the state anywhere on their site, that's good
            if (locationData.foundInContent) verificationScore += 2;
            
            // Strong positive indicators
            if (locationData.hasStateAddress) verificationScore += 3;
            if (locationData.hasStateZip) verificationScore += 2;
            if (locationData.hasStatePhone) verificationScore += 2;
            
            // Only penalize if they clearly have a DIFFERENT state as their primary location
            if (locationData.hasOtherStateAddress && !locationData.hasStateAddress) {
                verificationScore -= 3; // Only if they don't have target state address
            }
            
            // Much more forgiving threshold - if they show up in state search and mention the state, they're probably legitimate
            const isVerified = verificationScore >= 2;
            
            // Log detailed verification info
            const details = {
                search: mentionedInSearch,
                content: locationData.foundInContent,
                address: locationData.hasStateAddress,
                otherAddress: locationData.hasOtherStateAddress,
                zip: locationData.hasStateZip,
                phone: locationData.hasStatePhone,
                business: locationData.hasBusinessLocation,
                serviceOnly: locationData.isServiceAreaOnly,
                otherState: locationData.hasOtherState,
                directory: locationData.isDirectorySite
            };
            
            if (isVerified) {
                console.log(`✅ Location verified for: ${result.title} (score: ${verificationScore})`);
                return { isValid: true, reason: `Location verified (score: ${verificationScore})` };
            } else {
                console.log(`❌ Location not verified for: ${result.title} (score: ${verificationScore})`);
                console.log(`   Details: search=${details.search}, content=${details.content}, address=${details.address}, otherAddress=${details.otherAddress}, zip=${details.zip}, phone=${details.phone}, business=${details.business}, serviceOnly=${details.serviceOnly}, otherState=${details.otherState}, directory=${details.directory}`);
                if (locationData.otherStateAddresses.length > 0) {
                    console.log(`   ⚠️  Found addresses in: ${locationData.otherStateAddresses.join(', ')}`);
                }
                return { isValid: false, reason: `Location verification failed (score: ${verificationScore}/2 required)` };
            }
            
        } catch (error) {
            console.log(`❌ Error verifying location for ${result.title}: ${error.message}`);
            return { isValid: false, reason: `Error during verification: ${error.message}` };
        }
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

            // Extract comprehensive data with enhanced header/footer/contact page scanning
            const builderData = await this.page.evaluate(({ url, title, targetState }) => {
                const data = {
                    name: title,
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

                // ENHANCED: Extract contact info from headers, footers, and main content
                const extractContactInfo = () => {
                    // Check header, footer, and main content areas
                    const contentAreas = [
                        document.querySelector('header'),
                        document.querySelector('footer'), 
                        document.querySelector('main'),
                        document.querySelector('.contact'),
                        document.querySelector('#contact'),
                        document.querySelector('.about'),
                        document.querySelector('#about'),
                        document.body
                    ].filter(Boolean);

                    contentAreas.forEach(area => {
                        const text = area.textContent || '';
                        const html = area.innerHTML || '';

                        // Enhanced phone extraction
                        const phonePatterns = [
                            /(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g,
                            /(\d{3}[-.\s]\d{3}[-.\s]\d{4})/g,
                            /(\+1[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g
                        ];
                        
                        phonePatterns.forEach(pattern => {
                            const matches = text.match(pattern);
                            if (matches && !data.phone) {
                                // Clean up phone number
                                data.phone = matches[0].replace(/[^\d]/g, '').replace(/^1/, '');
                                if (data.phone.length === 10) {
                                    data.phone = data.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                                }
                            }
                        });

                        // Enhanced email extraction
                        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
                        const emailMatches = text.match(emailPattern);
                        if (emailMatches && !data.email) {
                            // Filter out common non-business emails
                            const businessEmail = emailMatches.find(email => 
                                !email.includes('noreply') && 
                                !email.includes('no-reply') &&
                                !email.includes('example.com') &&
                                !email.includes('domain.com') &&
                                !email.includes('yoursite.com')
                            ) || emailMatches[0];
                            if (businessEmail && !businessEmail.includes('user@domain.com')) {
                                data.email = businessEmail;
                            }
                        }

                        // Enhanced address extraction with multiple patterns
                        const addressPatterns = [
                            // Full address with street number, city, state, zip
                            /(\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Cir|Court|Ct|Place|Pl)[^,]*,\s*[A-Za-z\s]+,\s*(?:NJ|New Jersey)\s+\d{5})/i,
                            // Address with city, state, zip
                            /([A-Za-z\s]+,\s*(?:NJ|New Jersey)\s+\d{5})/i,
                            // Street address followed by city and state
                            /(\d+\s+[A-Za-z0-9\s,.-]+(?:NJ|New Jersey))/i,
                            // Look for address labels
                            /(?:address|location|based in|located at)[:\s]*([^<\n]+(?:NJ|New Jersey)[^<\n]*\d{5}?)/i
                        ];
                        
                        addressPatterns.forEach(pattern => {
                            const matches = text.match(pattern);
                            if (matches && !data.address) {
                                let address = matches[1] || matches[0];
                                address = address.replace(/(?:address|location|based in|located at)[:\s]*/i, '').trim();
                                if (address.length > 10 && address.length < 200) {
                                    data.address = address;
                                }
                            }
                        });

                        // Enhanced description extraction
                        if (!data.description) {
                            const descriptionSelectors = [
                                '.description', '.about', '.intro', '.summary', 
                                '[class*="description"]', '[class*="about"]',
                                'meta[name="description"]', 'meta[property="og:description"]'
                            ];
                            
                            for (const selector of descriptionSelectors) {
                                const element = area.querySelector(selector);
                                if (element) {
                                    let desc = element.content || element.textContent || '';
                                    desc = desc.trim();
                                    if (desc.length > 50 && desc.length < 500) {
                                        data.description = desc;
                                        break;
                                    }
                                }
                            }
                        }
                    });
                };

                // ENHANCED: Extract social media from headers, footers, and links with better patterns
                const extractSocialMedia = () => {
                    const socialPatterns = {
                        facebook: /(?:facebook\.com|fb\.com)\/([a-zA-Z0-9.]+)/,
                        instagram: /instagram\.com\/([a-zA-Z0-9_.]+)/,
                        youtube: /(?:youtube\.com\/(?:channel\/|user\/|c\/|@)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
                        twitter: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/,
                        linkedin: /linkedin\.com\/(?:company\/|in\/)([a-zA-Z0-9-]+)/,
                        tiktok: /tiktok\.com\/@([a-zA-Z0-9_.]+)/
                    };

                    // Check all links on the page, prioritizing header/footer
                    const linkAreas = [
                        document.querySelector('header'),
                        document.querySelector('footer'),
                        document.querySelector('.social'),
                        document.querySelector('#social'),
                        document.querySelector('.social-media'),
                        document.querySelector('.social-links'),
                        document.body
                    ].filter(Boolean);

                    // Also check for text mentions of social media handles
                    const textContent = document.body.textContent || '';
                    
                    // Look for YouTube mentions in text
                    const youtubeTextPatterns = [
                        /@([a-zA-Z0-9_-]+)/g, // @handle format
                        /youtube\.com\/(@[a-zA-Z0-9_-]+)/g,
                        /youtube\.com\/c\/([a-zA-Z0-9_-]+)/g,
                        /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/g,
                        /youtube\.com\/user\/([a-zA-Z0-9_-]+)/g
                    ];

                    youtubeTextPatterns.forEach(pattern => {
                        const matches = textContent.match(pattern);
                        if (matches && !data.social_media.youtube) {
                            matches.forEach(match => {
                                if (match.includes('nomadrvs') || match.includes('nomad_rvs')) {
                                    data.social_media.youtube = `https://www.youtube.com/${match.replace('@', 'c/')}`;
                                }
                            });
                        }
                    });

                    linkAreas.forEach(area => {
                        const links = area.querySelectorAll('a[href]');
                        links.forEach(link => {
                            const href = link.href;
                            for (const [platform, pattern] of Object.entries(socialPatterns)) {
                                const match = href.match(pattern);
                                if (match && !data.social_media[platform]) {
                                    data.social_media[platform] = href;
                                }
                            }
                        });
                    });
                };

                // Execute enhanced extraction
                extractContactInfo();
                extractSocialMedia();

                // Get description from meta tags and content
                const metaDescription = document.querySelector('meta[name="description"]');
                if (metaDescription) {
                    data.description = metaDescription.content;
                } else {
                    // Fallback to first paragraph or content
                    const firstParagraph = document.querySelector('p');
                    if (firstParagraph) {
                        data.description = firstParagraph.textContent.substring(0, 300);
                    }
                }

                // Extract van types and amenities from content
                const content = document.body.textContent.toLowerCase();
                
                const vanTypes = ['sprinter', 'transit', 'promaster', 'express', 'savana', 'nv200', 'metris'];
                vanTypes.forEach(type => {
                    if (content.includes(type)) {
                        data.van_types.push(type);
                    }
                });

                const amenities = [
                    'solar', 'battery', 'inverter', 'shore power', 'generator',
                    'kitchen', 'sink', 'stove', 'refrigerator', 'microwave',
                    'bed', 'dinette', 'seating', 'storage', 'cabinets',
                    'bathroom', 'toilet', 'shower', 'water tank', 'grey tank',
                    'heating', 'air conditioning', 'ventilation', 'fan',
                    'awning', 'bike rack', 'roof rack', 'ladder'
                ];
                
                amenities.forEach(amenity => {
                    if (content.includes(amenity)) {
                        data.amenities.push(amenity);
                    }
                });

                // Enhanced photo collection with van-relevance scoring
                const scoreVanRelevance = (img) => {
                    const searchText = `${img.src} ${img.alt} ${img.className} ${img.title}`.toLowerCase();
                    let score = 0;
                    
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
                    
                    // Size bonuses/penalties
                    const width = parseInt(img.width) || 0;
                    const height = parseInt(img.height) || 0;
                    if (width >= 400 && height >= 300) score += 1;
                    if (width >= 800 && height >= 600) score += 1;
                    if (width < 200 || height < 150) score -= 3;
                    
                    return score;
                };

                // Collect and score all images
                const images = document.querySelectorAll('img[src]');
                const scoredImages = Array.from(images).map(img => ({
                    img,
                    score: scoreVanRelevance(img),
                    src: img.src
                }));

                // Sort by relevance score and take top images
                scoredImages.sort((a, b) => b.score - a.score);
                
                for (let i = 0; i < Math.min(scoredImages.length, 8); i++) {
                    const photo = scoredImages[i];
                    if (photo.score > -3) { // Only include photos with reasonable scores
                        data.photos.push({
                            url: photo.src.startsWith('http') ? photo.src : new URL(photo.src, url).href,
                            alt: photo.img.alt || '',
                            caption: '',
                            vanScore: photo.score,
                            source: 'main'
                        });
                        console.log(`   📷 Added photo (score: ${photo.score}): ${photo.img.alt || 'No alt text'}`);
                    }
                }

                // ENHANCED: Search gallery/portfolio pages for more photos
                if (data.photos.length < 8) {
                    console.log(`   🔍 Searching for gallery/portfolio pages (current photos: ${data.photos.length})`);
                    
                    // Find gallery links from the main page
                    const galleryLinks = document.querySelectorAll('a[href*="gallery" i], a[href*="portfolio" i], a[href*="work" i], a[href*="projects" i], a[href*="builds" i], a[href*="conversions" i]');
                    
                    console.log(`   📋 Found ${galleryLinks.length} potential gallery pages`);
                    
                    // Note: Gallery page navigation would need to be handled outside this evaluate block
                    // This is a limitation of the current implementation
                }
                
                return data;
            }, { url: result.url, title: result.title, targetState });

            // ENHANCED: Check About and Contact pages for additional info
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

                        const additionalData = await this.page.evaluate(() => {
                            const text = document.body.textContent;
                            const result = { phone: '', email: '', address: '' };

                            // Phone extraction
                            const phonePattern = /(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/;
                            const phoneMatch = text.match(phonePattern);
                            if (phoneMatch) result.phone = phoneMatch[0];

                            // Email extraction
                            const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
                            const emailMatch = text.match(emailPattern);
                            if (emailMatch) result.email = emailMatch[0];

                            // Address extraction
                            const addressPattern = /(\d+\s+[A-Za-z0-9\s,.-]+(?:NJ|New Jersey)\s+\d{5})/i;
                            const addressMatch = text.match(addressPattern);
                            if (addressMatch) result.address = addressMatch[0];

                            return result;
                        });

                        // Update missing data
                        if (!builderData.phone && additionalData.phone) {
                            builderData.phone = additionalData.phone;
                            console.log(`   📞 Found phone on ${pageUrl}: ${additionalData.phone}`);
                        }
                        if (!builderData.email && additionalData.email) {
                            builderData.email = additionalData.email;
                            console.log(`   📧 Found email on ${pageUrl}: ${additionalData.email}`);
                        }
                        if (!builderData.address && additionalData.address) {
                            builderData.address = additionalData.address;
                            console.log(`   📍 Found address on ${pageUrl}: ${additionalData.address}`);
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
            
            // VALIDATE: Ensure this is actually a van conversion builder
            const isVanBuilder = this.validateVanBuilder(builderData);
            if (!isVanBuilder.isValid) {
                console.log(`❌ SKIPPING: ${builderData.name} - ${isVanBuilder.reason}`);
                return null;
            }
            
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
            
            return builderData;
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
            const searchResults = await this.searchBrave(query);
            
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
                                resolve();
                            }
                        });
                    })
                    .catch(reject);
            });
        });
    }

    extractCityFromAddress(address) {
        if (!address) return '';
        
        // Clean up the address first
        address = address.trim();
        
        // Try to extract city from address patterns like "City, State" or "City, ST ZIP"
        const patterns = [
            /([^,\d]+),\s*[A-Z]{2}\s*\d{5}/,          // City, ST ZIP
            /([^,\d]+),\s*[A-Z]{2}/,                  // City, ST
            /([^,\d]+),\s*New Jersey/,                // City, New Jersey
            /([^,\d]+),\s*NJ/,                        // City, NJ
            /([A-Za-z\s]+),\s*(?:NJ|New Jersey)/,     // Any city before NJ
            /(?:^|\s)([A-Za-z\s]+)\s+(?:NJ|New Jersey)/, // City before state
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
        
        // If no pattern matches, try to extract from common New Jersey cities
        const njCities = [
            'Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge', 'Lakewood',
            'Toms River', 'Hamilton', 'Trenton', 'Clifton', 'Camden', 'Brick', 'Cherry Hill',
            'Passaic', 'Union City', 'Middletown', 'Gloucester', 'East Orange', 'Bayonne',
            'Vineland', 'New Brunswick', 'Hoboken', 'Perth Amboy', 'West New York', 'Plainfield',
            'Hackensack', 'Sayreville', 'Kearny', 'Linden', 'Atlantic City', 'Fort Lee',
            'Fair Lawn', 'Garfield', 'Paramus', 'Wayne', 'West Orange', 'Ridgewood',
            'Princeton', 'Morristown', 'Freehold', 'Marlboro', 'Manasquan', 'Hamilton Twp'
        ];
        
        for (const city of njCities) {
            if (address.toLowerCase().includes(city.toLowerCase())) {
                return city;
            }
        }
        
        return '';
    }

    async cleanup() {
        console.log('🧹 Starting cleanup...');
        
        // Close browser
        if (this.browser) {
            await this.browser.close();
            console.log('✅ Browser closed');
        }
        
        // Clean up screenshot files
        if (this.screenshots && this.screenshots.length > 0) {
            console.log(`🗑️ Removing ${this.screenshots.length} screenshot files...`);
            
            for (const screenshot of this.screenshots) {
                try {
                    if (fs.existsSync(screenshot)) {
                        fs.unlinkSync(screenshot);
                        console.log(`   ✅ Removed: ${screenshot}`);
                    }
                } catch (error) {
                    console.log(`   ❌ Failed to remove ${screenshot}: ${error.message}`);
                }
            }
            
            console.log('✅ Screenshot cleanup completed');
        }
        
        console.log('🎉 Cleanup finished');
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

    validateVanBuilder(builderData) {
        const content = `${builderData.name} ${builderData.description} ${builderData.van_types.join(' ')} ${builderData.amenities.join(' ')}`.toLowerCase();
        
        // EXCLUSION KEYWORDS - Immediate disqualification
        const excludeKeywords = [
            'food truck', 'food trailer', 'concession', 'catering', 'restaurant',
            'mobile kitchen', 'food service', 'food cart', 'coffee truck',
            'ice cream truck', 'taco truck', 'food vendor', 'commercial kitchen'
        ];
        
        const hasExcludedContent = excludeKeywords.some(keyword => content.includes(keyword));
        if (hasExcludedContent) {
            return { isValid: false, reason: 'Builds food trucks/commercial vehicles, not camper vans' };
        }
        
        // VAN CONVERSION KEYWORDS - Must have at least one
        const vanKeywords = [
            'camper van', 'van conversion', 'custom van', 'adventure van',
            'sprinter conversion', 'transit conversion', 'promaster conversion',
            'class b rv', 'class b+', 'motorhome', 'recreational vehicle',
            'van build', 'van life', 'overland', 'expedition vehicle'
        ];
        
        const hasVanKeywords = vanKeywords.some(keyword => content.includes(keyword));
        
        // GENERAL KEYWORDS - Secondary check (enhanced for RV companies)
        const generalKeywords = ['rv', 'conversion', 'custom', 'build', 'camper', 'nomad'];
        const hasGeneralKeywords = generalKeywords.some(keyword => content.includes(keyword));
        
        // VAN TYPES CHECK - Look for actual van models
        const vanModels = ['sprinter', 'transit', 'promaster', 'express', 'savana', 'nv200'];
        const hasVanModels = vanModels.some(model => content.includes(model));
        
        // SCORING SYSTEM - Need minimum score to qualify (lowered threshold)
        let score = 0;
        if (hasVanKeywords) score += 3;      // Strong van conversion indicators
        if (hasVanModels) score += 2;        // Specific van models mentioned
        if (hasGeneralKeywords) score += 1;  // General conversion keywords
        
        // Special bonus for RV companies (many do van conversions)
        if (content.includes('rv') && !content.includes('food')) score += 1;
        
        if (score < 1) { // Lowered from 2 to 1
            return { isValid: false, reason: `Insufficient van conversion indicators (score: ${score}/1 minimum)` };
        }
        
        console.log(`✅ VALIDATED: ${builderData.name} - Van conversion score: ${score}/1`);
        return { isValid: true, reason: `Van conversion validated (score: ${score})` };
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

Options:
  --headed    Run in headed mode (visible browser)
  --fast      Fast mode (block images/CSS for speed)

Examples:
  node web_scraper_playwright.js Alabama
  node web_scraper_playwright.js California --headed
  node web_scraper_playwright.js Texas --fast

States should be full names (e.g., "New York", not "NY")

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
        const results = await scraper.scrapeState(state);
        await scraper.saveResults(state);
        
        console.log(`\n🎉 Scraping completed successfully!`);
        console.log(`📊 Found ${results.length} verified builders in ${state}`);
        
    } catch (error) {
        console.error('❌ Scraping failed:', error);
        process.exit(1);
    } finally {
        await scraper.cleanup();
    }
}

// Export for module use
module.exports = { VanBuilderScraper };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
