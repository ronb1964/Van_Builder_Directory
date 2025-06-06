#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
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
        
        if (!this.braveApiKey) {
            throw new Error('❌ BRAVE_SEARCH_API_KEY not found in environment variables');
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

    async verifyBuilderLocation(result, targetState) {
        console.log(`🔍 Verifying location for: ${result.title}`);
        
        // Check if state is mentioned in title or snippet
        const stateVariations = [
            targetState.toLowerCase(),
            this.getStateAbbreviation(targetState)?.toLowerCase()
        ].filter(Boolean);
        
        const titleLower = result.title.toLowerCase();
        const snippetLower = result.snippet.toLowerCase();
        
        const mentionedInSearch = stateVariations.some(state => 
            titleLower.includes(state) || snippetLower.includes(state)
        );

        try {
            // Visit the website to verify location
            await this.page.goto(result.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            
            // Wait for page to load
            await this.page.waitForTimeout(2000);
            
            // Enhanced location verification
            const locationData = await this.page.evaluate(({ targetState, stateVariations }) => {
                const content = document.body.textContent.toLowerCase();
                
                // Look for state mentions in content
                const foundInContent = stateVariations.some(state => content.includes(state));
                
                // Look for zip code patterns with state
                const hasAlabamaZip = content.includes('35') && content.includes('alabama'); // Alabama zips start with 35
                
                // Check for Alabama area codes (205, 251, 256, 334, 938)
                const alabamaAreaCodes = ['205', '251', '256', '334', '938'];
                const hasAlabamaPhone = alabamaAreaCodes.some(code => 
                    content.includes(code + '-') || content.includes(code + ' ') || content.includes(code + '.')
                );
                
                // Check for actual business location (not just service area)
                const hasBusinessLocation = content.includes('located in alabama') || 
                                          content.includes('based in alabama') ||
                                          content.includes('alabama office') ||
                                          content.includes('alabama location');
                
                // Check for non-Alabama states that would disqualify
                const otherStates = ['california', 'colorado', 'texas', 'florida', 'pennsylvania', 'new york'];
                const hasOtherState = otherStates.some(state => 
                    content.includes('located in ' + state) || 
                    content.includes('based in ' + state) ||
                    content.includes(state + ' office') ||
                    content.includes(state + ' location')
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
                    hasAlabamaZip,
                    hasAlabamaPhone,
                    hasBusinessLocation,
                    hasOtherState,
                    isDirectorySite
                };
            }, { targetState, stateVariations });
            
            // Calculate verification score
            let verificationScore = 0;
            if (mentionedInSearch) verificationScore += 2;
            if (locationData.foundInContent) verificationScore += 1; // Reduced from 2
            if (locationData.hasAlabamaZip) verificationScore += 4; // Increased importance
            if (locationData.hasAlabamaPhone) verificationScore += 4; // Increased importance
            if (locationData.hasBusinessLocation) verificationScore += 3;
            
            // Penalize if other state location is found
            if (locationData.hasOtherState) verificationScore -= 5;
            
            // Penalize if directory site is detected
            if (locationData.isDirectorySite) verificationScore -= 10;
            
            const isVerified = verificationScore >= 4; // Increased threshold
            
            if (isVerified) {
                console.log(`✅ Location verified for: ${result.title} (score: ${verificationScore})`);
            } else {
                console.log(`❌ Location not verified for: ${result.title} (score: ${verificationScore})`);
                console.log(`   Details: search=${mentionedInSearch}, content=${locationData.foundInContent}, zip=${locationData.hasAlabamaZip}, phone=${locationData.hasAlabamaPhone}, business=${locationData.hasBusinessLocation}, otherState=${locationData.hasOtherState}, directory=${locationData.isDirectorySite}`);
            }
            
            return isVerified;
            
        } catch (error) {
            console.log(`⚠️ Could not verify location for ${result.title}: ${error.message}`);
            return mentionedInSearch; // Fall back to search result mention
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

            // Extract comprehensive data
            const builderData = await this.page.evaluate(({ url, title }) => {
                const data = {
                    name: title,
                    website: url,
                    address: '',
                    city: '',
                    state: '',
                    zip: '',
                    phone: '',
                    email: '',
                    description: '',
                    years_experience: null,
                    social_media: {},
                    van_types: [],
                    amenities: [],
                    photos: []
                };

                // Helper function to clean text
                const cleanText = (text) => {
                    return text ? text.replace(/\s+/g, ' ').trim() : '';
                };

                // Extract contact information
                const bodyText = document.body.textContent;
                
                // Phone number extraction
                const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
                const phoneMatches = bodyText.match(phoneRegex);
                if (phoneMatches && phoneMatches.length > 0) {
                    data.phone = phoneMatches[0].trim();
                }

                // Email extraction
                const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
                const emailMatches = bodyText.match(emailRegex);
                if (emailMatches && emailMatches.length > 0) {
                    data.email = emailMatches[0].trim();
                }

                // Address extraction (look for common patterns)
                const addressElements = document.querySelectorAll('*');
                for (const element of addressElements) {
                    const text = element.textContent;
                    if (text && text.length < 200) {
                        // Look for zip code patterns
                        const zipMatch = text.match(/\b\d{5}(-\d{4})?\b/);
                        if (zipMatch) {
                            const lines = text.split('\n').map(line => line.trim()).filter(line => line);
                            if (lines.length >= 2) {
                                data.address = lines[0];
                                const lastLine = lines[lines.length - 1];
                                const cityStateZip = lastLine.match(/^(.+?),\s*([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);
                                if (cityStateZip) {
                                    data.city = cityStateZip[1].trim();
                                    data.state = cityStateZip[2].trim();
                                    data.zip = cityStateZip[3].trim();
                                    break;
                                }
                            }
                        }
                    }
                }

                // Extract description from meta tags or main content
                const metaDescription = document.querySelector('meta[name="description"]');
                if (metaDescription) {
                    data.description = cleanText(metaDescription.getAttribute('content'));
                } else {
                    // Try to find main content
                    const contentSelectors = ['main', '.content', '#content', '.description', '.about'];
                    for (const selector of contentSelectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            data.description = cleanText(element.textContent).substring(0, 500);
                            break;
                        }
                    }
                }

                // Extract years of experience
                const experienceRegex = /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|in\s*business)/gi;
                const experienceMatch = bodyText.match(experienceRegex);
                if (experienceMatch) {
                    const yearMatch = experienceMatch[0].match(/\d+/);
                    if (yearMatch) {
                        data.years_experience = parseInt(yearMatch[0]);
                    }
                }

                // 4-Layer Social Media Detection Strategy
                const socialPlatforms = {
                    instagram: ['instagram.com', 'instagr.am'],
                    facebook: ['facebook.com', 'fb.com', 'fb.me'],
                    youtube: ['youtube.com', 'youtu.be'],
                    twitter: ['twitter.com', 'x.com'],
                    tiktok: ['tiktok.com'],
                    linkedin: ['linkedin.com'],
                    pinterest: ['pinterest.com', 'pin.it']
                };

                // Layer 1: Direct link scanning
                const links = document.querySelectorAll('a[href]');
                links.forEach(link => {
                    const href = link.href.toLowerCase();
                    Object.entries(socialPlatforms).forEach(([platform, domains]) => {
                        domains.forEach(domain => {
                            if (href.includes(domain) && !data.social_media[platform]) {
                                data.social_media[platform] = link.href;
                            }
                        });
                    });
                });

                // Layer 2: Icon and class-based detection
                const socialSelectors = [
                    '[class*="social"]', '[class*="icon"]', '[id*="social"]',
                    '[class*="instagram"]', '[class*="facebook"]', '[class*="youtube"]',
                    '[class*="twitter"]', '[class*="tiktok"]', '[class*="linkedin"]',
                    '[class*="pinterest"]'
                ];
                
                socialSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                        const link = element.closest('a') || element.querySelector('a');
                        if (link && link.href) {
                            const href = link.href.toLowerCase();
                            Object.entries(socialPlatforms).forEach(([platform, domains]) => {
                                domains.forEach(domain => {
                                    if (href.includes(domain) && !data.social_media[platform]) {
                                        data.social_media[platform] = link.href;
                                    }
                                });
                            });
                        }
                    });
                });

                // Layer 3: Meta tag scanning
                const metaTags = document.querySelectorAll('meta[property], meta[name]');
                metaTags.forEach(meta => {
                    const content = meta.getAttribute('content');
                    if (content) {
                        Object.entries(socialPlatforms).forEach(([platform, domains]) => {
                            domains.forEach(domain => {
                                if (content.toLowerCase().includes(domain) && !data.social_media[platform]) {
                                    data.social_media[platform] = content;
                                }
                            });
                        });
                    }
                });

                // Layer 4: JSON-LD structured data
                const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
                jsonLdScripts.forEach(script => {
                    try {
                        const jsonData = JSON.parse(script.textContent);
                        const searchJsonForSocial = (obj) => {
                            if (typeof obj === 'string') {
                                Object.entries(socialPlatforms).forEach(([platform, domains]) => {
                                    domains.forEach(domain => {
                                        if (obj.toLowerCase().includes(domain) && !data.social_media[platform]) {
                                            data.social_media[platform] = obj;
                                        }
                                    });
                                });
                            } else if (typeof obj === 'object' && obj !== null) {
                                Object.values(obj).forEach(searchJsonForSocial);
                            }
                        };
                        searchJsonForSocial(jsonData);
                    } catch (e) {
                        // Ignore JSON parsing errors
                    }
                });

                // Extract van types and amenities from content
                const vanTypeKeywords = [
                    'class b', 'class b+', 'sprinter', 'transit', 'promaster', 'ram promaster',
                    'mercedes sprinter', 'ford transit', 'chevy express', 'gmc savana',
                    'nissan nv200', 'custom van', 'camper van', 'conversion van'
                ];

                const amenityKeywords = [
                    'solar', 'bathroom', 'shower', 'kitchen', 'bed', 'storage', 'awning',
                    'air conditioning', 'heating', 'refrigerator', 'sink', 'stove', 'oven',
                    'microwave', 'water tank', 'grey water', 'black water', 'inverter',
                    'battery', 'generator', 'wifi', 'tv', 'entertainment', 'seating'
                ];

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

                // Extract photos - STRIVE FOR 8 PHOTOS
                const images = document.querySelectorAll('img[src]');
                const photoTargets = ['van', 'build', 'interior', 'exterior', 'custom', 'conversion', 'camper'];
                
                // First pass: prioritize van-related images
                images.forEach(img => {
                    if (data.photos.length >= 8) return; // Target reached
                    
                    const src = img.src;
                    const alt = (img.alt || '').toLowerCase();
                    const className = (img.className || '').toLowerCase();
                    
                    // Skip logos, icons, and small images
                    if (src.includes('logo') || src.includes('icon') || 
                        alt.includes('logo') || alt.includes('icon') ||
                        img.width < 200 || img.height < 150) {
                        return;
                    }
                    
                    // Prioritize van-related content
                    const isVanRelated = photoTargets.some(target => 
                        alt.includes(target) || className.includes(target) || src.includes(target)
                    );
                    
                    if (isVanRelated || data.photos.length < 3) { // Always take first 3, then prioritize
                        const fullSrc = src.startsWith('http') ? src : new URL(src, window.location.href).href;
                        data.photos.push({
                            url: fullSrc,
                            alt: img.alt || '',
                            caption: ''
                        });
                    }
                });
                
                // Second pass: fill remaining slots if we haven't reached 8
                if (data.photos.length < 8) {
                    images.forEach(img => {
                        if (data.photos.length >= 8) return;
                        
                        const src = img.src;
                        const alt = (img.alt || '').toLowerCase();
                        
                        // Skip if already added or is logo/icon
                        if (data.photos.some(photo => photo.url.includes(src)) ||
                            src.includes('logo') || src.includes('icon') || 
                            alt.includes('logo') || alt.includes('icon') ||
                            img.width < 150 || img.height < 100) {
                            return;
                        }
                        
                        const fullSrc = src.startsWith('http') ? src : new URL(src, window.location.href).href;
                        data.photos.push({
                            url: fullSrc,
                            alt: img.alt || '',
                            caption: ''
                        });
                    });
                }

                return data;
            }, { url: result.url, title: result.title });

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
        
        const query = `custom camper van builders in ${state}`;
        const searchResults = await this.searchBrave(query);
        
        if (searchResults.length === 0) {
            console.log('❌ No search results found');
            return [];
        }

        const verifiedBuilders = [];
        
        for (const result of searchResults) {
            console.log(`\n🔍 Processing: ${result.title}`);
            
            // Verify location
            const isVerified = await this.verifyBuilderLocation(result, state);
            
            if (isVerified) {
                // Extract detailed data
                const builderData = await this.extractBuilderData(result, state);
                
                if (builderData) {
                    verifiedBuilders.push(builderData);
                    console.log(`✅ Added builder: ${builderData.name}`);
                }
            } else {
                console.log(`❌ Skipped: ${result.title} (location not verified)`);
            }
            
            // Wait 2 seconds between verifications (respectful crawling)
            await this.page.waitForTimeout(2000);
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

        fs.writeFileSync(filename, JSON.stringify(output, null, 2));
        console.log(`\n💾 Results saved to: ${filename}`);
        console.log(`📊 Total builders found: ${this.results.length}`);
        console.log(`📷 Total photos collected: ${totalPhotos}`);
        console.log(`📷 Average photos per builder: ${avgPhotos} (target: 8)`);
        
        return filename;
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
        
        // GENERAL KEYWORDS - Secondary check
        const generalKeywords = ['rv', 'conversion', 'custom', 'build'];
        const hasGeneralKeywords = generalKeywords.some(keyword => content.includes(keyword));
        
        // VAN TYPES CHECK - Look for actual van models
        const vanModels = ['sprinter', 'transit', 'promaster', 'express', 'savana', 'nv200'];
        const hasVanModels = vanModels.some(model => content.includes(model));
        
        // SCORING SYSTEM - Need minimum score to qualify
        let score = 0;
        if (hasVanKeywords) score += 3;      // Strong van conversion indicators
        if (hasVanModels) score += 2;        // Specific van models mentioned
        if (hasGeneralKeywords) score += 1;  // General conversion keywords
        
        if (score < 2) {
            return { isValid: false, reason: `Insufficient van conversion indicators (score: ${score}/3 minimum)` };
        }
        
        console.log(`✅ VALIDATED: ${builderData.name} - Van conversion score: ${score}/3`);
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
module.exports = VanBuilderScraper;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
