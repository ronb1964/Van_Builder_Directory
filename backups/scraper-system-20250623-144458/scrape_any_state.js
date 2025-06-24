const { EnhancedWebsiteScraper } = require('./enhanced_scraper_with_geocoding');
const { scraperConfig } = require('./scraper_config');
const { setupNewState } = require('./setup_new_state.sh');

// CONFIGURATION: Edit this section for each new state
const STATE_CONFIG = {
    name: 'Arizona',  // Edit this for each new state
    websites: [
        { url: 'https://nomadvanz.com/', name: 'Nomad Vanz' },
        { url: 'https://outsidevan.com/', name: 'Outside Van' },
        { url: 'https://www.storytelleroverland.com/', name: 'Storyteller Overland' },
        { url: 'https://vanlifecustoms.com/', name: 'Van Life Customs' }
    ]
};

// Additional city coordinates for better geocoding fallbacks
// Arizona major cities for geocoding
const STATE_CITY_COORDINATES = {
    'phoenix': { lat: 33.4484, lng: -112.0740 },
    'tucson': { lat: 32.2226, lng: -110.9747 },
    'mesa': { lat: 33.4152, lng: -111.8315 },
    'chandler': { lat: 33.3062, lng: -111.8413 },
    'scottsdale': { lat: 33.4942, lng: -111.9261 },
    'glendale': { lat: 33.5387, lng: -112.1860 },
    'tempe': { lat: 33.4255, lng: -111.9400 },
    'peoria': { lat: 33.5806, lng: -112.2374 },
    'surprise': { lat: 33.6292, lng: -112.3679 },
    'flagstaff': { lat: 35.1983, lng: -111.6513 }
};

class StateSpecificScraper extends EnhancedWebsiteScraper {
    constructor(stateName, cityCoordinates = {}) {
        super();
        this.stateName = stateName;
        this.stateAbbrev = this.getStateAbbreviation(stateName);
        this.cityCoordinates = cityCoordinates;
    }

    // Get state abbreviation
    getStateAbbreviation(stateName) {
        const stateMap = {
            'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
            'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
            'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
            'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
            'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
            'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
            'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
            'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
            'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
            'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
        };
        return stateMap[stateName.toLowerCase()] || stateName;
    }

    // Normalize van types to proper format
    normalizeVanTypes(vanTypes) {
        const typeMap = {
            'sprinter': 'Mercedes Sprinter',
            'mercedes sprinter': 'Mercedes Sprinter',
            'transit': 'Ford Transit',
            'ford transit': 'Ford Transit',
            'promaster': 'Ram ProMaster',
            'ram promaster': 'Ram ProMaster',
            'chevy express': 'Chevrolet Express',
            'gmc savana': 'GMC Savana',
            'nissan nv200': 'Nissan NV200',
            'ford e-series': 'Ford E-Series'
        };
        
        return vanTypes.map(type => typeMap[type.toLowerCase()] || type).filter(Boolean);
    }

    // Enhanced address extraction with multiple strategies
    async extractAddress(page) {
        console.log('   🏠 Extracting address information...');
        
        // Strategy 1: Look for contact sections
        const contactAddresses = await page.$$eval('*', (elements, params) => {
            const { stateName, stateAbbrev } = params;
            const addresses = [];
            const patterns = [
                new RegExp(`\\d+[^\\n]*${stateName}[^\\n]*\\d{5}`, 'gi'),
                new RegExp(`\\d+[^\\n]*${stateAbbrev}[^\\n]*\\d{5}`, 'gi'),
                new RegExp(`[^\\n]*\\d+[^\\n]*(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|way|lane|ln)[^\\n]*${stateName}`, 'gi'),
                new RegExp(`[^\\n]*\\d+[^\\n]*(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|way|lane|ln)[^\\n]*${stateAbbrev}`, 'gi')
            ];
            
            elements.forEach(el => {
                const text = el.textContent || '';
                if (text.toLowerCase().includes('contact') || 
                    text.toLowerCase().includes('address') || 
                    text.toLowerCase().includes('location') ||
                    el.id?.toLowerCase().includes('contact') ||
                    el.className?.toLowerCase().includes('contact')) {
                    
                    patterns.forEach(pattern => {
                        const matches = text.match(pattern);
                        if (matches) {
                            matches.forEach(match => {
                                const clean = match.trim().replace(/\s+/g, ' ');
                                if (clean.length > 10 && clean.length < 200) {
                                    addresses.push(clean);
                                }
                            });
                        }
                    });
                }
            });
            
            return [...new Set(addresses)];
        }, { stateName: this.stateName, stateAbbrev: this.stateAbbrev });

        // Strategy 2: Generic address search
        if (contactAddresses.length === 0) {
            const genericAddresses = await page.$$eval('*', (elements, params) => {
                const { stateName, stateAbbrev } = params;
                const addresses = [];
                const zipPattern = /\b\d{5}(-\d{4})?\b/g;
                
                elements.forEach(el => {
                    const text = el.textContent || '';
                    if (text.includes(stateName) || text.includes(stateAbbrev)) {
                        const lines = text.split('\n');
                        lines.forEach(line => {
                            if ((line.includes(stateName) || line.includes(stateAbbrev)) && 
                                zipPattern.test(line) && 
                                line.length > 10 && 
                                line.length < 200) {
                                addresses.push(line.trim().replace(/\s+/g, ' '));
                            }
                        });
                    }
                });
                
                return [...new Set(addresses)];
            }, { stateName: this.stateName, stateAbbrev: this.stateAbbrev });
            
            contactAddresses.push(...genericAddresses);
        }

        return contactAddresses;
    }

    // Enhanced email extraction
    async extractEmail(page) {
        const emails = await page.$$eval('*', elements => {
            const emailSet = new Set();
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            
            elements.forEach(el => {
                // Check text content
                const text = el.textContent || '';
                const textMatches = text.match(emailRegex);
                if (textMatches) {
                    textMatches.forEach(email => {
                        if (!email.includes('example.') && !email.includes('test@') && !email.includes('noreply')) {
                            emailSet.add(email.toLowerCase());
                        }
                    });
                }
                
                // Check href attributes
                const href = el.href || '';
                if (href.startsWith('mailto:')) {
                    const email = href.replace('mailto:', '').split('?')[0];
                    if (email.includes('@')) {
                        emailSet.add(email.toLowerCase());
                    }
                }
            });
            
            return Array.from(emailSet);
        });

        return emails;
    }

    // Enhanced phone extraction
    async extractPhone(page) {
        const phones = await page.$$eval('*', elements => {
            const phoneSet = new Set();
            const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
            
            elements.forEach(el => {
                const text = el.textContent || '';
                const matches = text.match(phoneRegex);
                if (matches) {
                    matches.forEach(phone => {
                        // Filter out obviously fake numbers
                        if (!phone.includes('000-0000') && !phone.includes('123-4567')) {
                            phoneSet.add(phone);
                        }
                    });
                }
            });
            
            return Array.from(phoneSet);
        });

        return phones;
    }

    // Enhanced description extraction
    async extractDescription(page, builderName) {
        const descriptions = await page.$$eval('p, div', (elements, builderName) => {
            const validDescs = [];
            
            elements.forEach(el => {
                const text = el.textContent || '';
                const cleanText = text.trim().replace(/\s+/g, ' ');
                
                // Skip navigation and garbage text
                if (cleanText.length > 50 && 
                    cleanText.length < 800 &&
                    !cleanText.toLowerCase().includes('cookie') &&
                    !cleanText.toLowerCase().includes('navigation') &&
                    !cleanText.toLowerCase().includes('menu') &&
                    !cleanText.toLowerCase().includes('skip to') &&
                    cleanText.split(' ').length > 8 &&
                    (cleanText.toLowerCase().includes('van') || 
                     cleanText.toLowerCase().includes('custom') ||
                     cleanText.toLowerCase().includes('build') ||
                     cleanText.toLowerCase().includes('conversion') ||
                     cleanText.toLowerCase().includes('experience') ||
                     cleanText.toLowerCase().includes(builderName.toLowerCase().split(' ')[0]))) {
                    validDescs.push(cleanText);
                }
            });
            
            return validDescs;
        }, builderName);

        return descriptions;
    }

    async scrapeWebsite(url, expectedBuilderName) {
        console.log(`\n🔍 Scraping ${this.stateName}: ${url}`);
        const page = await this.context.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
            await page.waitForTimeout(5000); // Give more time for dynamic content
            
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
            
            // Extract addresses using enhanced method
            const addresses = await this.extractAddress(page);
            if (addresses.length > 0) {
                const bestAddress = addresses.reduce((best, current) => {
                    return current.length > best.length ? current : best;
                }, '');
                
                builderData.address = bestAddress;
                
                // Extract city and ZIP
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
                
                // GEOCODE THE ADDRESS
                builderData.coordinates = await scraperConfig.geocodeAddress(builderData.address, builderData.name);
            }
            
            // Extract emails
            const emails = await this.extractEmail(page);
            if (emails.length > 0) {
                builderData.email = emails[0];
                console.log(`   ✉️ Email: ${builderData.email}`);
            }
            
            // Extract phones
            const phones = await this.extractPhone(page);
            if (phones.length > 0) {
                builderData.phone = this.cleanPhone(phones[0]);
                console.log(`   📞 Phone: ${builderData.phone}`);
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
            
            // Extract description using enhanced method
            const descriptions = await this.extractDescription(page, expectedBuilderName);
            if (descriptions.length > 0) {
                builderData.description = descriptions[0];
                console.log(`   📝 Description: ${builderData.description.substring(0, 100)}...`);
            }
            
            // Extract van types and amenities
            console.log('   🚐 Extracting van types and amenities...');
            const pageText = await page.evaluate(() => document.body.textContent.toLowerCase());
            
            const vanTypes = [
                'sprinter', 'transit', 'promaster', 'ram promaster', 'ford transit', 
                'mercedes sprinter', 'chevy express', 'gmc savana', 'nissan nv200',
                'ford e-series'
            ];
            const foundVanTypes = vanTypes.filter(type => pageText.includes(type));
            builderData.van_types = this.normalizeVanTypes(foundVanTypes);
            
            const amenityKeywords = [
                'solar', 'plumbing', 'electrical', 'kitchen', 'bathroom', 'shower',
                'water tank', 'inverter', 'battery', 'lithium',
                'refrigerator', 'fridge', 'sink', 'stove', 'bed', 'seating', 
                'storage', 'insulation', 'ventilation', 'fan',
                'heating', 'air conditioning', 'ac', 'awning', 'roof rack'
            ];
            
            const foundAmenities = amenityKeywords.filter(amenity => pageText.includes(amenity));
            builderData.amenities = foundAmenities;
            
            console.log(`   🚐 Van Types: ${builderData.van_types.join(', ')}`);
            console.log(`   ⚙️ Amenities: ${builderData.amenities.join(', ')}`);
            console.log(`   📍 Coordinates: ${builderData.coordinates?.lat}, ${builderData.coordinates?.lng}`);
            
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

/**
 * Enhanced web scraper with MCP-powered data enrichment
 * Now automatically finds real contact info, social media, and photos
 */

// Add MCP-powered data enrichment functions
async function enrichBuilderData(name, website, page) {
  console.log(`🚀 MCP Enhancement: Enriching data for ${name}...`);
  
  const enhancedData = {
    realAddress: null,
    realPhone: null,
    realEmail: null,
    socialMedia: {},
    photos: []
  };

  try {
    // Strategy 1: Deep website analysis for contact info
    const contactData = await findRealContactInfo(name, website, page);
    Object.assign(enhancedData, contactData);

    // Strategy 2: Social media discovery
    enhancedData.socialMedia = await findSocialMediaProfiles(name, website, page);

    // Strategy 3: Photo collection
    enhancedData.photos = await collectRealPhotos(name, website, page);

    console.log(`✅ MCP Enhancement complete for ${name}`);
    return enhancedData;
  } catch (error) {
    console.log(`⚠️ MCP Enhancement failed for ${name}:`, error.message);
    return enhancedData;
  }
}

async function findRealContactInfo(name, website, page) {
  const contactData = {
    realAddress: null,
    realPhone: null,
    realEmail: null
  };

  try {
    // Strategy 1: Look for contact/about pages
    const contactUrls = [
      `${website}/contact`,
      `${website}/contact-us`,
      `${website}/about`,
      `${website}/location`,
      `${website}/info`
    ];

    for (const url of contactUrls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        
        // Extract real address (not just city/state)
        const addressSelectors = [
          'address',
          '[class*="address"]',
          '[class*="contact"]',
          '[class*="location"]',
          'p:has-text("Ave"), p:has-text("St"), p:has-text("Blvd"), p:has-text("Lane"), p:has-text("Road")'
        ];
        
        for (const selector of addressSelectors) {
          try {
            const addressEl = await page.$(selector);
            if (addressEl) {
              const addressText = await addressEl.textContent();
              if (addressText && addressText.length > 10 && !addressText.includes(', AZ') && !addressText.includes(', Arizona')) {
                contactData.realAddress = addressText.trim();
                break;
              }
            }
          } catch (e) {}
        }

        // Extract real phone number
        const phoneSelectors = [
          'a[href^="tel:"]',
          '[class*="phone"]',
          'text=/\(\d{3}\)\s?\d{3}-\d{4}/',
          'text=/\d{3}[\.-]\d{3}[\.-]\d{4}/'
        ];
        
        for (const selector of phoneSelectors) {
          try {
            const phoneEl = await page.$(selector);
            if (phoneEl) {
              const phoneText = await phoneEl.textContent();
              const cleanPhone = phoneText.replace(/[^\d()-\s]/g, '').trim();
              if (cleanPhone.length >= 10) {
                contactData.realPhone = cleanPhone;
                break;
              }
            }
          } catch (e) {}
        }

        // Extract real email
        const emailSelectors = [
          'a[href^="mailto:"]',
          '[class*="email"]',
          'text=/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/'
        ];
        
        for (const selector of emailSelectors) {
          try {
            const emailEl = await page.$(selector);
            if (emailEl) {
              const emailText = await emailEl.textContent();
              const emailMatch = emailText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
              if (emailMatch) {
                contactData.realEmail = emailMatch[0];
                break;
              }
            }
          } catch (e) {}
        }

        if (contactData.realAddress || contactData.realPhone || contactData.realEmail) {
          break; // Found contact info, stop searching
        }
      } catch (e) {
        continue; // Try next URL
      }
    }

    return contactData;
  } catch (error) {
    console.log(`Contact info search failed for ${name}:`, error.message);
    return contactData;
  }
}

async function findSocialMediaProfiles(name, website, page) {
  const socialMedia = {};

  try {
    // Strategy 1: Look for social media links on website
    await page.goto(website, { waitUntil: 'networkidle2', timeout: 10000 });
    
    const socialSelectors = {
      instagram: [
        'a[href*="instagram.com"]',
        'a[href*="insta"]',
        '[class*="instagram"]'
      ],
      facebook: [
        'a[href*="facebook.com"]',
        'a[href*="fb.com"]',
        '[class*="facebook"]'
      ],
      youtube: [
        'a[href*="youtube.com"]',
        '[class*="youtube"]'
      ],
      twitter: [
        'a[href*="twitter.com"]',
        'a[href*="x.com"]',
        '[class*="twitter"]'
      ],
      tiktok: [
        'a[href*="tiktok.com"]',
        '[class*="tiktok"]'
      ]
    };

    for (const [platform, selectors] of Object.entries(socialSelectors)) {
      for (const selector of selectors) {
        try {
          const socialEl = await page.$(selector);
          if (socialEl) {
            const href = await socialEl.getAttribute('href');
            if (href) {
              socialMedia[platform] = href;
              break;
            }
          }
        } catch (e) {}
      }
    }

    return socialMedia;
  } catch (error) {
    console.log(`Social media search failed for ${name}:`, error.message);
    return socialMedia;
  }
}

async function collectRealPhotos(name, website, page) {
  const photos = [];

  try {
    // Strategy 1: Look for gallery/portfolio pages
    const galleryUrls = [
      `${website}/gallery`,
      `${website}/portfolio`,
      `${website}/builds`,
      `${website}/vans`,
      `${website}/work`,
      website // Main page
    ];

    for (const url of galleryUrls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        
        // Find high-quality van images
        const imageSelectors = [
          'img[src*="van"]',
          'img[src*="build"]',
          'img[src*="conversion"]',
          'img[alt*="van"]',
          'img[alt*="build"]',
          '.gallery img',
          '.portfolio img'
        ];
        
        for (const selector of imageSelectors) {
          try {
            const images = await page.$$(selector);
            for (const img of images.slice(0, 3)) { // Limit to 3 photos
              const src = await img.getAttribute('src');
              const alt = await img.getAttribute('alt') || `${name} van conversion`;
              
              if (src && src.includes('http') && src.includes(name.toLowerCase().replace(' ', ''))) {
                photos.push({
                  url: src,
                  alt: alt,
                  caption: `${name} custom van build`
                });
              }
            }
          } catch (e) {}
        }

        if (photos.length >= 2) break; // Got enough photos
      } catch (e) {
        continue;
      }
    }

    return photos;
  } catch (error) {
    console.log(`Photo collection failed for ${name}:`, error.message);
    return photos;
  }
}

// Enhanced data processing function
async function processBuilderData(builderData, page) {
  console.log(`\n🔄 Processing: ${builderData.name}`);
  
  // Get enhanced data using MCP capabilities
  const enhanced = await enrichBuilderData(builderData.name, builderData.website, page);
  
  // Apply enhancements
  return {
    name: builderData.name || 'Unknown Builder',
    // Use real address if found, otherwise fall back to city/state only
    address: enhanced.realAddress || null,
    city: builderData.city || extractCityFromWebsite(builderData.website),
    state: builderData.state || 'AZ',
    zip: builderData.zip || null,
    // Use real contact info if found
    phone: enhanced.realPhone || builderData.phone || null,
    email: enhanced.realEmail || builderData.email || null,
    website: builderData.website || '',
    lat: builderData.lat || 33.4484, // Phoenix default
    lng: builderData.lng || -112.0740,
    description: cleanDescription(builderData.description || `Custom van conversions by ${builderData.name}`),
    van_types: normalizeVanTypes(builderData.van_types || 'Ford Transit, Mercedes Sprinter'),
    amenities: JSON.stringify(builderData.amenities || ['Custom Build', 'Solar', 'Kitchen']),
    services: JSON.stringify(['Custom Builds', 'Repairs', 'Consulting']),
    // Use real social media if found
    social_media: JSON.stringify(enhanced.socialMedia),
    // Use real photos if found
    photos: JSON.stringify(enhanced.photos.length > 0 ? enhanced.photos : [])
  };
}

// Helper functions for data processing
function extractCityFromWebsite(website) {
  // Extract city from website domain or default to Phoenix
  try {
    const url = new URL(website);
    const domain = url.hostname.toLowerCase();
    
    // Common patterns: cityname-vans.com, vanscity.com, etc.
    const cityKeywords = ['phoenix', 'scottsdale', 'tempe', 'mesa', 'chandler'];
    for (const city of cityKeywords) {
      if (domain.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
  } catch (e) {}
  
  return 'Phoenix'; // Default
}

function cleanDescription(description) {
  if (!description) return 'Custom van conversions and builds.';
  
  // Remove navigation text and clean up
  const cleaned = description
    .replace(/navigation|menu|skip to|click here|read more/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  return cleaned.length > 20 ? cleaned : 'Custom van conversions and builds.';
}

function normalizeVanTypes(vanTypes) {
  if (!vanTypes) return 'Ford Transit, Mercedes Sprinter';
  
  const normalized = vanTypes
    .replace(/transit/gi, 'Ford Transit')
    .replace(/sprinter/gi, 'Mercedes Sprinter')
    .replace(/promaster/gi, 'Ram ProMaster');
    
  return normalized;
} 