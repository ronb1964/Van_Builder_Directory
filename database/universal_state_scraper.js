const fs = require('fs');
const csv = require('csv-parse');
const { chromium } = require('playwright');
const path = require('path');
const Database = require('../server/database/database');

/**
 * Universal State Scraper - MCP-Enhanced CSV Importer for Van Builders
 * Works with any state using state_builders_template.csv format
 * Features: 3x retry logic, duplicate detection, enhanced photo filtering
 * Usage: node universal_state_scraper.js <csv_file> [state_filter]
 */

class UniversalStateScraper {
  constructor() {
    this.db = new Database();
    this.browser = null;
    this.page = null;
    this.cspViolations = new Map(); // Track CSP violations across all builders
    this.retryCount = 3; // Retry failed builders 3 times
    this.maxPhotos = 8; // Maximum photos per builder
    this.processedBuilders = []; // Track results for final report
  }

  async init() {
    console.log('🚀 Initializing MCP-Enhanced CSV Importer...');
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid bot detection
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
  }

  async importFromCSV(csvPath) {
    console.log(`📄 Reading CSV: ${csvPath}`);
    
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const records = await new Promise((resolve, reject) => {
      csv.parse(csvData, { columns: true, skip_empty_lines: true }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    console.log(`Found ${records.length} builders to process`);

    for (const record of records) {
      await this.processBuilder(record.state, record.website_url, record.name);
    }
  }

  async processBuilder(state, websiteUrl, providedName = null) {
    console.log(`\n🔍 Processing: ${websiteUrl}`);
    if (providedName) {
      console.log(`📝 Using provided name: ${providedName}`);
    }
    
    let builderData = null;
    let retryCount = 0;
    
    while (retryCount <= this.retryCount) {
      try {
        await this.page.goto(websiteUrl, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Extract ALL required database fields
        builderData = await this.extractComprehensiveData(state, websiteUrl, providedName);
        
        if (!builderData) {
          throw new Error('No data extracted');
        }
        
        // Handle special cases like Sportsmobile multiple locations
        if (websiteUrl.includes('sportsmobile.com')) {
          const locationData = await this.extractSportsmobileArizonaLocation();
          Object.assign(builderData, locationData);
        }
        
        // Validate CSP compliance for photos
        if (builderData.photos) {
          try {
            const photos = JSON.parse(builderData.photos);
            if (photos && photos.length > 0) {
              console.log(`🔒 Checking CSP compliance for ${photos.length} photos...`);
              const cspCheck = this.validatePhotosForCSP(photos, websiteUrl);
              
              if (cspCheck.hasViolations) {
                this.reportCSPIssues(builderData.name, cspCheck);
                
                // Auto-update CSP policy immediately
                if (cspCheck.newDomains.length > 0) {
                  console.log(`🔧 Auto-updating CSP policy for ${builderData.name}...`);
                  const updateSuccess = await this.autoUpdateCSP(cspCheck.newDomains);
                  if (updateSuccess) {
                    console.log(`✅ CSP policy updated successfully for ${builderData.name}`);
                  } else {
                    console.log(`⚠️ CSP auto-update failed for ${builderData.name} - manual update required`);
                  }
                }
              } else {
                console.log(`✅ All photos CSP compliant for ${builderData.name}`);
              }
            }
          } catch (error) {
            console.warn(`⚠️ Could not validate CSP for ${builderData.name}:`, error.message);
          }
        }
        
        // Check for existing builder before inserting
        const existingBuilder = await this.checkExistingBuilder(builderData.name);
        if (existingBuilder) {
          const shouldOverwrite = await this.promptOverwrite(builderData, existingBuilder);
          if (!shouldOverwrite) {
            console.log(`⏭️ Skipped: ${builderData.name} (user chose not to overwrite)`);
            this.processedBuilders.push({
              name: builderData.name,
              status: 'skipped',
              reason: 'User declined overwrite'
            });
            return;
          }
        }
        
        // Insert into database
        await this.insertBuilderData(builderData);
        
        console.log(`✅ Successfully processed: ${builderData.name}`);
        this.processedBuilders.push({
          name: builderData.name,
          status: 'success',
          photos: builderData.photos ? JSON.parse(builderData.photos).length : 0,
          website: websiteUrl
        });
        
        return; // Success, exit retry loop
        
      } catch (error) {
        retryCount++;
        console.error(`❌ Attempt ${retryCount}/${this.retryCount + 1} failed for ${websiteUrl}:`, error.message);
        
        if (retryCount <= this.retryCount) {
          console.log(`🔄 Retrying in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    // All retries failed - save partial data if available
    if (builderData && builderData.name) {
      console.log(`⚠️ Saving partial data for ${builderData.name} after ${this.retryCount + 1} attempts`);
      await this.insertBuilderData(builderData);
      this.processedBuilders.push({
        name: builderData.name,
        status: 'partial',
        reason: 'Retry limit exceeded',
        website: websiteUrl
      });
    } else {
      console.log(`❌ Complete failure for ${websiteUrl} - no data saved`);
      this.processedBuilders.push({
        name: providedName || websiteUrl,
        status: 'failed',
        reason: 'No data could be extracted',
        website: websiteUrl
      });
    }
  }

  async extractComprehensiveData(state, websiteUrl, providedName = null) {
    console.log(`🔍 Extracting data from: ${websiteUrl}`);
    
    try {
      await this.page.goto(websiteUrl, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });

      // First attempt - extract from current page
      let data = await this.extractBasicData(state, websiteUrl, providedName);
      
      // If we're missing critical contact info and not on contact page, try contact page
      const pageUrl = this.page.url();
      if ((!data.email || !data.phone || !data.address || !data.city || data.city === 'Phoenix') && !pageUrl.includes('contact')) {
        console.log(`📞 Missing contact info or generic city, trying contact page...`);
        const contactData = await this.tryContactPage(websiteUrl);
        if (contactData) {
          // Track if city changed to re-geocode
          const originalCity = data.city;
          
          // Merge contact data with existing data, preferring contact page data
          if (contactData.email && !data.email) data.email = contactData.email;
          if (contactData.phone && !data.phone) data.phone = contactData.phone;
          if (contactData.address && !data.address) data.address = contactData.address;
          if (contactData.city && (!data.city || data.city === 'Phoenix')) {
            data.city = contactData.city;
            console.log(`✅ Updated city from contact page: ${contactData.city}`);
            
            // Re-geocode if city changed
            if (originalCity !== data.city) {
              console.log(`🔄 Re-geocoding with updated city: ${data.city}`);
              let newGeocodeAddress = '';
              if (data.address && data.city) {
                newGeocodeAddress = `${data.address}, ${data.city}, ${state}`;
              } else if (data.city) {
                newGeocodeAddress = `${data.city}, ${state}`;
              }
              
              if (newGeocodeAddress) {
                const newCoords = await this.geocodeAddress(newGeocodeAddress);
                if (newCoords) {
                  data.lat = newCoords.lat;
                  data.lng = newCoords.lng;
                  console.log(`✅ Updated coordinates for ${data.city}: ${newCoords.lat}, ${newCoords.lng}`);
                  return data; // Return early since we've already geocoded
                }
              }
            }
          }
        }
      }

      // Get coordinates based on available address information (only if not already set above)
      if (!data.lat || !data.lng) {
        let geocodeAddress = '';
        if (data.address && data.city) {
          geocodeAddress = `${data.address}, ${data.city}, ${state}`;
        } else if (data.city) {
          geocodeAddress = `${data.city}, ${state}`;
        } else {
          geocodeAddress = state; // State-level fallback
        }

        const coords = await this.geocodeAddress(geocodeAddress);
        if (coords) {
          data.lat = coords.lat;
          data.lng = coords.lng;
          console.log(`✅ Coordinates set: ${coords.lat}, ${coords.lng} (${coords.service})`);
        } else {
          console.log(`⚠️ No coordinates available for ${data.name}`);
          // Don't set coordinates - let database handle null values
        }
      }

      return data;
    } catch (error) {
      console.error(`❌ Error extracting data from ${websiteUrl}:`, error.message);
      return null;
    }
  }

  async tryContactPage(baseUrl) {
    const contactUrls = [
      baseUrl.replace(/\/$/, '') + '/contact',
      baseUrl.replace(/\/$/, '') + '/contact-us',
      baseUrl.replace(/\/$/, '') + '/contact/',
      baseUrl.replace(/\/$/, '') + '/contact-us/'
    ];

    for (const contactUrl of contactUrls) {
      try {
        console.log(`🔍 Trying contact page: ${contactUrl}`);
        const response = await this.page.goto(contactUrl, { 
          waitUntil: 'networkidle0', 
          timeout: 15000 
        });
        
        // Check if page loaded successfully (not 404)
        if (response && response.status() === 200) {
          const email = await this.extractEmail();
          const phone = await this.extractPhone();
          const address = await this.extractStreetAddress();
          const city = await this.extractCity(); // Extract city from contact page
          
          if (email || phone || address || city) {
            console.log(`✅ Found contact info on contact page`);
            return { 
              email: email || undefined, 
              phone: phone || undefined, 
              address: address || undefined,
              city: city || undefined  // Include city in contact data
            };
          }
        }
      } catch (e) {
        console.log(`❌ Contact page failed: ${e.message}`);
      }
    }
    
    return null;
  }

  async extractBasicData(state, websiteUrl, providedName = null) {
    const name = providedName || await this.extractCompanyName() || 'Unknown Builder';
    const email = await this.extractEmail();
    const phone = await this.extractPhone();
    const address = await this.extractStreetAddress();
    let city = await this.extractCity(state);
    const zipCode = await this.extractZipCode();
    const description = await this.extractDescription();
    const vanTypes = await this.extractVanTypes();
    const amenities = await this.extractAmenities();
    const services = await this.extractServices();
    const socialMedia = await this.extractSocialMedia();
    const photos = await this.extractPhotos();
    const leadTime = await this.extractLeadTime();
    const experience = await this.extractExperience();

    // Perform CSP validation on photos
    const cspCheck = this.validatePhotosForCSP(photos, websiteUrl);
    const hasCSPViolations = this.reportCSPIssues(name, cspCheck);

    // Store CSP info for later reference
    const cspInfo = {
      hasViolations: hasCSPViolations,
      newDomains: cspCheck.newDomains,
      violationCount: cspCheck.violations.length
    };

    const data = {
      name,
      email,
      phone,
      address,
      city,
      state,
      zip: zipCode,
      description,
      website: websiteUrl,
      van_types: vanTypes,
      amenities: JSON.stringify(amenities),
      services: JSON.stringify(services),
      social_media: JSON.stringify(socialMedia),
      photos: JSON.stringify(photos),
      lead_time: leadTime,
      years_experience: experience,
      lat: null, // Will be set by geocoding
      lng: null,
      csp_info: cspInfo // Add CSP info to data
    };

    // Handle null city - don't use a default, let geocoding handle it
    if (!data.city) {
      console.log(`⚠️ No city found for ${data.name}`);
    }

    // Get coordinates based on available address information
    let geocodeAddress = '';
    if (data.address && data.city) {
      geocodeAddress = `${data.address}, ${data.city}, ${state}`;
    } else if (data.city) {
      geocodeAddress = `${data.city}, ${state}`;
    } else if (data.address) {
      geocodeAddress = `${data.address}, ${state}`;
    } else {
      geocodeAddress = state; // State-level fallback
    }

    const coords = await this.geocodeAddress(geocodeAddress);
    if (coords) {
      data.lat = coords.lat;
      data.lng = coords.lng;
      console.log(`✅ Coordinates set: ${coords.lat}, ${coords.lng} (${coords.service})`);
    } else {
      console.log(`⚠️ No coordinates available for ${name}`);
      // Don't set coordinates - let database handle null values
    }

    return data;
  }

  async extractCompanyName() {
    // Try logo alt text first (often has clean company name)
    try {
      const logos = await this.page.$$('img[alt*="logo"], img[alt*="Logo"], .logo img[alt]');
      for (const logo of logos) {
        const alt = await logo.getAttribute('alt');
        if (alt) {
          const cleanName = this.cleanCompanyName(alt);
          if (cleanName && cleanName.length > 2 && cleanName.length < 50) {
            return cleanName;
          }
        }
      }
    } catch (e) {}

    // Try specific company name selectors
    const selectors = [
      '.company-name',
      '.brand-name',
      '[class*="company"]',
      '[class*="brand"]',
      'h1'
    ];

    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          let text = await element.textContent();
          if (text) {
            const cleanName = this.cleanCompanyName(text);
            if (cleanName && cleanName.length > 2 && cleanName.length < 50) {
              return cleanName;
            }
          }
        }
      } catch (e) {}
    }

    // Fallback to title tag (last resort)
    try {
      const titleElement = await this.page.$('title');
      if (titleElement) {
        let text = await titleElement.textContent();
        if (text) {
          const cleanName = this.cleanCompanyName(text);
          if (cleanName && cleanName.length > 2 && cleanName.length < 50) {
            return cleanName;
          }
        }
      }
    } catch (e) {}
    
    return 'Unknown Builder';
  }

  cleanCompanyName(name) {
    if (!name) return null;
    
    // Skip obvious marketing slogans and page elements
    const skipPatterns = [
      /built to adventure/i,
      /van life/i,
      /custom van/i,
      /logo$/i,
      /home$/i,
      /contact/i,
      /about/i,
      /^(skip to|menu|navigation)/i,
      /^(custom|luxury|premium|professional)\s+(van|camper)/i
    ];
    
    for (const pattern of skipPatterns) {
      if (pattern.test(name)) {
        return null;
      }
    }
    
    // Clean up the company name like CA data
    let cleaned = name
      .replace(/\s*\|\s*.*$/, '') // Remove " | subtitle"
      .replace(/\s*-\s*.*$/, '') // Remove " - subtitle" 
      .replace(/\s+(LLC|Inc|Co|Company|Corp|Corporation)\.?$/i, '') // Remove corp endings
      .replace(/^(Arizona|AZ|Phoenix|Tempe|Scottsdale)\s+/i, '') // Remove state/city prefixes
      .replace(/\s+(Arizona|AZ|Phoenix|Tempe|Scottsdale)$/i, '') // Remove state/city suffixes
      .replace(/\s+(Van|Vans|Camper|Campers|Conversion|Conversions|Builder|Builders)?\s+(in|of|at)\s+.*/i, '') // Remove location descriptions
      .replace(/^(Custom|Luxury|Premium|Professional)\s+/i, '') // Remove adjective prefixes
      .trim();

    // Additional validation - should contain actual company identifier words
    const validIndicators = /\b(van|camper|craft|motor|mobile|build|design|custom|conversion)\b/i;
    
    // If we have a reasonable length and contains business words, return it
    if (cleaned.length > 2 && cleaned.length < 50 && !/^\d+$/.test(cleaned) && validIndicators.test(cleaned)) {
      return cleaned;
    }
    
    return null;
  }

  async extractStreetAddress() {
    // First try structured selectors including footer areas
    const selectors = [
      'address',
      '[class*="address"]',
      '[class*="location"]',
      '[class*="contact"] p',
      'footer',
      '.footer',
      '[class*="bottom"]',
      'p:has-text("Ave"), p:has-text("St"), p:has-text("Blvd"), p:has-text("Lane"), p:has-text("Road"), p:has-text("Dr")'
    ];

    for (const selector of selectors) {
      try {
        const elements = await this.page.$$(selector);
        for (const element of elements) {
          const text = await element.textContent();
          if (text && this.isStreetAddress(text)) {
            return this.cleanAddress(text);
          }
        }
      } catch (e) {}
    }

    // Look specifically in contact page sections
    try {
      const pageUrl = this.page.url();
      if (pageUrl.includes('contact')) {
        const bodyText = await this.page.textContent('body');
        // Look for address patterns in the entire page content
        const addressMatches = bodyText.match(/\b\d+\s+[NSEW]?\s*[\w\s]{1,30}(Avenue|Ave|Street|St|Boulevard|Blvd|Lane|Ln|Road|Rd|Drive|Dr|Circle|Cir|Court|Ct|Way|Place|Pl)\b/gi);
        if (addressMatches) {
          for (const address of addressMatches) {
            if (this.isStreetAddress(address)) {
              return this.cleanAddress(address);
            }
          }
        }
      }
    } catch (e) {}

    // Enhanced footer address extraction
    try {
      const footerElements = await this.page.$$('footer, .footer, [class*="footer"]');
      for (const footer of footerElements) {
        const footerText = await footer.textContent();
        // Look for common address patterns in footer
        const patterns = [
          /\b\d+\s+[NSEW]?\s*[\w\s]{1,40}(Avenue|Ave|Street|St|Boulevard|Blvd|Lane|Ln|Road|Rd|Drive|Dr|Circle|Cir|Court|Ct|Way|Place|Pl)\b/gi,
          /\b\d+\s+[NSEW]\.?\s*\d+(st|nd|rd|th)\s+(Dr|Drive|St|Street|Ave|Avenue)\b/gi
        ];
        
        for (const pattern of patterns) {
          const matches = footerText.match(pattern);
          if (matches) {
            for (const match of matches) {
              if (this.isStreetAddress(match)) {
                return this.cleanAddress(match);
              }
            }
          }
        }
      }
    } catch (e) {}
    
    return null;
  }

  isStreetAddress(text) {
    const streetIndicators = /\b\d+.*?(avenue|ave|street|st|boulevard|blvd|lane|ln|road|rd|drive|dr|circle|cir|court|ct|way|place|pl)\b/i;
    
    // Must have street indicators
    if (!streetIndicators.test(text)) return false;
    
    // Must start with a number (street number)
    if (!/^\d+\s/.test(text.trim())) return false;
    
    // Filter out non-address content and promotional text
    const invalidContent = [
      'email', 'phone', 'months for', 'weeks for', 'lead time', 
      'financing', 'custom builds', 'layouts', 'standard', 'premium',
      'follow us', 'contact us', 'about us', 'schedule', 'appointment',
      'is almost', 'is nearly', 'windows to our', 'almost full', 'nearly full',
      'years of', 'months of', 'quality', 'experience', 'service', 'best',
      'custom', 'builds', 'conversions', 'vans', 'rv', 'motorhome',
      'javascript', 'jquery', 'function', 'var ', 'const ', 'let ', 'window.',
      'document.', '.html()', '.find(', '.on(', 'spinner.svg', 'gform_',
      'wp-content', 'plugins', '.js', '.css', 'src=', 'href=', '<script',
      '</script', 'onclick=', 'onload='
    ];
    
    const textLower = text.toLowerCase();
    
    // Check for invalid content
    if (invalidContent.some(invalid => textLower.includes(invalid))) {
      return false;
    }
    
    // Must be reasonable length for an address (not too short, not too long)
    if (text.trim().length < 10 || text.trim().length > 80) {
      return false;
    }
    
    // Must have proper street address format: number + street name + suffix
    // Handle numbered streets like "57TH DR", "N. 57TH DR", and regular streets like "Main St"
    const properAddressPattern = /^\d+\s+[NSEW]?\.?\s*[\w\s]*?(Avenue|Ave|Street|St|Boulevard|Blvd|Lane|Ln|Road|Rd|Drive|Dr|Circle|Cir|Court|Ct|Way|Place|Pl)\b/i;
    
    return properAddressPattern.test(text.trim());
  }

  cleanAddress(address) {
    // Remove newlines and normalize spaces
    let cleaned = address
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Try to extract just the street address part (number + street name)
    // Look for patterns like "123 Main St" or "456 North Oak Drive"
    const streetMatch = cleaned.match(/\b\d+\s+[NSEW]?\s*[\w\s]*?(Avenue|Ave|Street|St|Boulevard|Blvd|Lane|Ln|Road|Rd|Drive|Dr|Circle|Cir|Court|Ct|Way|Place|Pl)\b/i);
    if (streetMatch) {
      let streetAddress = streetMatch[0].trim();
      
      // Remove city, state, zip if they got included
      // Common patterns: "123 Main St, Phoenix, AZ 85001" or "123 Main St Phoenix AZ"
      streetAddress = streetAddress
        .replace(/,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}.*$/i, '') // Remove ", City, ST 12345"
        .replace(/,\s*[A-Za-z\s]+\s+[A-Z]{2}\s*\d{5}.*$/i, '')  // Remove ", City ST 12345"
        .replace(/\s+[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}.*$/i, '')  // Remove " City, ST 12345"
        .replace(/\s+[A-Za-z\s]+\s+[A-Z]{2}\s*\d{5}.*$/i, '')   // Remove " City ST 12345"
        .replace(/,\s*[A-Z]{2}\s*\d{5}.*$/i, '')                // Remove ", ST 12345"
        .replace(/\s+[A-Z]{2}\s*\d{5}.*$/i, '')                 // Remove " ST 12345"
        .trim();
      
      // Additional cleanup: Remove Arizona city names that got stuck at the end
      const arizonaCities = [
        'Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale',
        'Gilbert', 'Tempe', 'Peoria', 'Surprise', 'Yuma', 'Avondale',
        'Flagstaff', 'Goodyear', 'Buckeye', 'PHOENIX', 'MESA', 'TEMPE'
      ];
      
      for (const city of arizonaCities) {
        // Remove city name if it appears at the end of the address
        const cityPattern = new RegExp(`\\s+${city}\\s*$`, 'i');
        if (cityPattern.test(streetAddress)) {
          streetAddress = streetAddress.replace(cityPattern, '').trim();
          break; // Only remove one city name
        }
      }
      
      return streetAddress;
    }
    
    // If no street pattern found, take first part before comma but limit length
    const beforeComma = cleaned.split(',')[0].trim();
    
    // Filter out business hours, descriptions, and other non-address content
    const invalidPhrases = [
      'hours of operation', 'please call', 'team member', 'visit us',
      'contact us', 'email', 'phone', 'website', 'follow us', 'social',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'am', 'pm', ':', 'img:', 'sizes=', 'auto', 'months for', 'weeks for',
      'lead time', 'financing', 'custom builds', 'standard layouts',
      'about us', 'get started', 'book now', 'schedule', 'appointment'
    ];
    
    const hasInvalidPhrase = invalidPhrases.some(phrase => 
      beforeComma.toLowerCase().includes(phrase)
    );
    
    if (hasInvalidPhrase || beforeComma.length > 50) {
      // Try to find a better address in the original text
      const addressPattern = /\b\d+\s+[NSEW]?\s*\d*\s*[\w\s]{1,30}(Avenue|Ave|Street|St|Boulevard|Blvd|Lane|Ln|Road|Rd|Drive|Dr|Circle|Cir|Court|Ct|Way|Place|Pl)\b/gi;
      const matches = cleaned.match(addressPattern);
      if (matches && matches.length > 0) {
        let cleanStreet = matches[0].trim();
        // Apply same city/state/zip removal
        cleanStreet = cleanStreet
          .replace(/,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}.*$/i, '')
          .replace(/,\s*[A-Za-z\s]+\s+[A-Z]{2}\s*\d{5}.*$/i, '')
          .replace(/\s+[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}.*$/i, '')
          .replace(/\s+[A-Za-z\s]+\s+[A-Z]{2}\s*\d{5}.*$/i, '')
          .replace(/,\s*[A-Z]{2}\s*\d{5}.*$/i, '')
          .replace(/\s+[A-Z]{2}\s*\d{5}.*$/i, '')
          .trim();
          
        // Remove Arizona city names from the end of address
        const arizonaCities = [
          'Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale',
          'Gilbert', 'Tempe', 'Peoria', 'Surprise', 'Yuma', 'Avondale',
          'Flagstaff', 'Goodyear', 'Buckeye', 'PHOENIX', 'MESA', 'TEMPE'
        ];
        
        for (const city of arizonaCities) {
          const cityPattern = new RegExp(`\\s+${city}\\s*$`, 'i');
          if (cityPattern.test(cleanStreet)) {
            cleanStreet = cleanStreet.replace(cityPattern, '').trim();
            break;
          }
        }
        
        return cleanStreet;
      }
      return null; // Return null if we can't find a clean address
    }
    
    // Also clean the beforeComma of city/state/zip
    let cleanedBeforeComma = beforeComma
      .replace(/,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}.*$/i, '')
      .replace(/,\s*[A-Za-z\s]+\s+[A-Z]{2}\s*\d{5}.*$/i, '')
      .replace(/\s+[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}.*$/i, '')
      .replace(/\s+[A-Za-z\s]+\s+[A-Z]{2}\s*\d{5}.*$/i, '')
      .replace(/,\s*[A-Z]{2}\s*\d{5}.*$/i, '')
      .replace(/\s+[A-Z]{2}\s*\d{5}.*$/i, '')
      .trim();
    
    // Remove Arizona city names from the end of address
    const arizonaCities = [
      'Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale',
      'Gilbert', 'Tempe', 'Peoria', 'Surprise', 'Yuma', 'Avondale',
      'Flagstaff', 'Goodyear', 'Buckeye', 'PHOENIX', 'MESA', 'TEMPE'
    ];
    
    for (const city of arizonaCities) {
      const cityPattern = new RegExp(`\\s+${city}\\s*$`, 'i');
      if (cityPattern.test(cleanedBeforeComma)) {
        cleanedBeforeComma = cleanedBeforeComma.replace(cityPattern, '').trim();
        break;
      }
    }
    
    return cleanedBeforeComma;
  }

  async extractCity(state = 'AZ') {
    // First try to get city from address patterns, then extract just the city part
    const selectors = [
      'address',
      '[class*="address"]',
      '[class*="location"]',
      '[class*="contact"]',
      'footer',
      '.footer',
      '[class*="footer"]'
    ];

    // Get state abbreviation and full name
    const stateInfo = this.getStateInfo(state);
    const stateAbbr = stateInfo.abbr;
    const stateName = stateInfo.name;

    for (const selector of selectors) {
      try {
        const elements = await this.page.$$(selector);
        for (const element of elements) {
          const text = await element.textContent();
          
          // Look for complete address patterns: "123 Main St, City, CO 80301"
          const fullAddressMatch = text.match(new RegExp(`[\\d\\w\\s,]+,\\s*([A-Za-z\\s]{2,25}),\\s*(${stateAbbr}|${stateName})\\s*\\d{0,5}`, 'i'));
          if (fullAddressMatch) {
            const cityCandidate = fullAddressMatch[1].trim();
            // Ensure we don't capture state abbreviation in city name
            const cleanCity = cityCandidate.replace(new RegExp(`\\s*(${stateAbbr}|${stateName})\\s*$`, 'i'), '').trim();
            if (this.isValidCityName(cleanCity, state)) {
              return cleanCity;
            }
          }
          
          // Look for simpler "City, CO" patterns
          const cityStateMatch = text.match(new RegExp(`([A-Za-z\\s]{2,30}),\\s*(${stateAbbr}|${stateName})(?:\\s*\\d{5})?`, 'i'));
          if (cityStateMatch) {
            const cityCandidate = cityStateMatch[1].trim();
            // Ensure we don't capture state abbreviation in city name
            const cleanCity = cityCandidate.replace(new RegExp(`\\s*(${stateAbbr}|${stateName})\\s*$`, 'i'), '').trim();
            if (this.isValidCityName(cleanCity, state)) {
              return cleanCity;
            }
          }
        }
      } catch (e) {}
    }

    // Look for known cities in the page content
    try {
      const bodyText = await this.page.textContent('body');
      const stateCities = this.getStateCities(state);
      
      for (const city of stateCities) {
        // Look for "city, CO" or "city, Colorado" patterns
        const cityPattern = new RegExp(`\\b${city},?\\s*(${stateAbbr}|${stateName})\\b`, 'i');
        if (cityPattern.test(bodyText)) {
          return city;
        }
      }
      
      // If no pattern match, look for city names mentioned anywhere
      for (const city of stateCities) {
        if (bodyText.includes(city)) {
          return city;
        }
      }
    } catch (e) {}
    
    // Return null instead of default city - let caller handle the fallback
    return null;
  }

  // Helper method to validate if extracted text is actually a city name
  isValidCityName(cityCandidate, state = 'AZ') {
    if (!cityCandidate || cityCandidate.length < 2 || cityCandidate.length > 30) {
      return false;
    }
    
    // Remove any trailing state abbreviations that might have been captured
    const stateInfo = this.getStateInfo(state);
    const cleanedCity = cityCandidate.replace(new RegExp(`\\s*(${stateInfo.abbr}|${stateInfo.name})\\s*$`, 'i'), '').trim();
    
    // If the cleaned city is empty or too short, it's not valid
    if (!cleanedCity || cleanedCity.length < 2) {
      return false;
    }
    
    // Filter out street address fragments
    const streetIndicators = [
      'DR', 'DRIVE', 'ST', 'STREET', 'AVE', 'AVENUE', 'BLVD', 'BOULEVARD',
      'LN', 'LANE', 'RD', 'ROAD', 'CT', 'COURT', 'WAY', 'PLACE', 'PL',
      'TH DR', 'ST DR', 'ND ST', 'RD ST', 'TH ST', 'ND DR', 'RD DR',
      'NORTH', 'SOUTH', 'EAST', 'WEST', 'N', 'S', 'E', 'W'
    ];
    
    const upperCity = cleanedCity.toUpperCase().trim();
    
    // Check if it contains street indicators
    for (const indicator of streetIndicators) {
      if (upperCity.includes(indicator)) {
        return false;
      }
    }
    
    // Check if it's a valid city for the given state
    const stateCities = this.getStateCities(state);
    
    // Check for exact match (case insensitive)
    const isKnownCity = stateCities.some(city => 
      city.toLowerCase() === cleanedCity.toLowerCase()
    );
    
    if (isKnownCity) {
      return true;
    }
    
    // If not a known city, at least ensure it doesn't contain numbers or special chars
    return !/\d|[^a-zA-Z\s]/.test(cleanedCity);
  }

  // Helper method to get state information
  getStateInfo(state) {
    const stateMap = {
      'AZ': { abbr: 'AZ', name: 'Arizona' },
      'CO': { abbr: 'CO', name: 'Colorado' },
      'CA': { abbr: 'CA', name: 'California' },
      'TX': { abbr: 'TX', name: 'Texas' },
      'FL': { abbr: 'FL', name: 'Florida' },
      'WA': { abbr: 'WA', name: 'Washington' },
      'OR': { abbr: 'OR', name: 'Oregon' },
      'UT': { abbr: 'UT', name: 'Utah' },
      'NV': { abbr: 'NV', name: 'Nevada' },
      'NM': { abbr: 'NM', name: 'New Mexico' },
      'CT': { abbr: 'CT', name: 'Connecticut' },
      'AR': { abbr: 'AR', name: 'Arkansas' }
    };
    
    return stateMap[state.toUpperCase()] || { abbr: state.toUpperCase(), name: state };
  }

  // Helper method to get major cities for a state
  getStateCities(state) {
    const stateCitiesMap = {
      'AZ': [
        'Scottsdale', 'Chandler', 'Gilbert', 'Tempe', 'Peoria', 'Surprise', 
        'Glendale', 'Mesa', 'Flagstaff', 'Yuma', 'Avondale', 'Goodyear', 
        'Buckeye', 'Tucson', 'Phoenix', 'Casa Grande', 'Sierra Vista',
        'Maricopa', 'Oro Valley', 'Prescott', 'Apache Junction', 'Bullhead City',
        'Prescott Valley', 'Sun City', 'Lake Havasu City', 'Sedona'
      ],
      'CO': [
        'Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood',
        'Thornton', 'Arvada', 'Westminster', 'Pueblo', 'Centennial',
        'Boulder', 'Greeley', 'Longmont', 'Loveland', 'Grand Junction',
        'Broomfield', 'Castle Rock', 'Commerce City', 'Parker', 'Littleton',
        'Northglenn', 'Brighton', 'Englewood', 'Wheat Ridge', 'Lafayette',
        'Louisville', 'Steamboat Springs', 'Aspen', 'Vail', 'Durango',
        'Golden', 'Alamosa', 'Montrose', 'Glenwood Springs'
      ],
      'CA': [
        'Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno',
        'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim',
        'Santa Ana', 'Riverside', 'Stockton', 'Irvine', 'Chula Vista',
        'Fremont', 'San Bernardino', 'Modesto', 'Fontana', 'Oxnard'
      ],
      'FL': [
        'Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg',
        'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie',
        'Cape Coral', 'Pembroke Pines', 'Hollywood', 'Miramar', 'Gainesville',
        'Coral Springs', 'Miami Gardens', 'Clearwater', 'Palm Bay'
      ],
      'CT': [
        'Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury',
        'Norwalk', 'Danbury', 'New Britain', 'West Hartford', 'Greenwich'
      ],
      'AR': [
        'Little Rock', 'Fayetteville', 'Fort Smith', 'Springdale', 'Jonesboro',
        'North Little Rock', 'Conway', 'Rogers', 'Pine Bluff', 'Bentonville'
      ]
    };
    
    return stateCitiesMap[state.toUpperCase()] || [];
  }

  async extractZipCode() {
    try {
      const text = await this.page.textContent('body');
      const zipMatch = text.match(/\b\d{5}(-\d{4})?\b/);
      return zipMatch ? zipMatch[0] : null;
    } catch (e) {
      return null;
    }
  }

  async extractPhone() {
    // First try structured selectors including footer areas
    const selectors = [
      'a[href^="tel:"]',
      '[class*="phone"]',
      '[class*="contact"]',
      'footer',
      '.footer',
      '[class*="bottom"]'
    ];

    for (const selector of selectors) {
      try {
        const elements = await this.page.$$(selector);
        for (const element of elements) {
          const text = await element.textContent() || await element.getAttribute('href');
          if (text) {
            const phoneMatch = text.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
            if (phoneMatch) {
              return this.formatPhone(phoneMatch[0]);
            }
          }
        }
      } catch (e) {}
    }

    // Look specifically in contact page sections
    try {
      const pageUrl = this.page.url();
      if (pageUrl.includes('contact')) {
        const bodyText = await this.page.textContent('body');
        // More thorough phone search on contact pages
        const phoneMatches = bodyText.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
        if (phoneMatches) {
          // Return the first valid phone number found
          for (const phone of phoneMatches) {
            const formatted = this.formatPhone(phone);
            if (formatted.match(/^\(\d{3}\) \d{3}-\d{4}$/)) {
              return formatted;
            }
          }
        }
      }
    } catch (e) {}

    // Look in all text as last resort
    try {
      const bodyText = await this.page.textContent('body');
      const phoneMatch = bodyText.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) {
        return this.formatPhone(phoneMatch[0]);
      }
    } catch (e) {}
    
    return null;
  }

  formatPhone(phone) {
    // Extract just the digits
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX like CA data
    if (digits.length === 10) {
      return `(${digits.substr(0, 3)}) ${digits.substr(3, 3)}-${digits.substr(6, 4)}`;
    }
    
    return phone; // Return original if can't format
  }

  async extractEmail() {
    // First try structured selectors
    const selectors = [
      'a[href^="mailto:"]',
      '[class*="email"]',
      '[class*="contact"]',
      'footer',
      '.footer',
      '[class*="bottom"]'
    ];

    for (const selector of selectors) {
      try {
        const elements = await this.page.$$(selector);
        for (const element of elements) {
          const href = await element.getAttribute('href');
          if (href && href.startsWith('mailto:')) {
            const email = href.replace('mailto:', '').split('?')[0]; // Remove query params
            if (this.isValidEmail(email)) {
              return email;
            }
          }
          
          const text = await element.textContent();
          const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w{2,}/);
          if (emailMatch && this.isValidEmail(emailMatch[0])) {
            return emailMatch[0];
          }
        }
      } catch (e) {}
    }

    // Look specifically in contact page sections
    try {
      // Check if we're on a contact page and look more thoroughly
      const pageUrl = this.page.url();
      if (pageUrl.includes('contact')) {
        const bodyText = await this.page.textContent('body');
        // Look for email patterns in the entire page content
        const emailMatches = bodyText.match(/\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/g);
        if (emailMatches) {
          for (const email of emailMatches) {
            if (this.isValidEmail(email) && !email.includes('.png') && !email.includes('.jpg')) {
              return email;
            }
          }
        }
      }
    } catch (e) {}

    // Look in all text with better pattern - last resort
    try {
      const bodyText = await this.page.textContent('body');
      // Better email regex that avoids matching image names and URLs
      const emailMatches = bodyText.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g);
      if (emailMatches) {
        for (const email of emailMatches) {
          if (this.isValidEmail(email)) {
            return email;
          }
        }
      }
    } catch (e) {}
    
    return null;
  }

  isValidEmail(email) {
    // Basic validation to avoid false positives
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && 
           !email.includes('@example.') && 
           !email.includes('@placeholder.') &&
           !email.includes('.jpg') &&
           !email.includes('.png') &&
           email.length < 50;
  }

  async extractDescription() {
    const selectors = [
      'meta[name="description"]',
      '.description',
      '.about p',
      'main p:first-of-type',
      '.hero p',
      '.intro p'
    ];

    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          let text = await element.textContent() || await element.getAttribute('content');
          if (text && text.length > 20 && text.length < 500) {
            return text.trim();
          }
        }
      } catch (e) {}
    }
    
    return 'Custom van conversions and builds.';
  }

  async extractVanTypes() {
    try {
      const text = (await this.page.textContent('body')).toLowerCase();
      const vanTypes = [];
      
      if (text.includes('sprinter') || text.includes('mercedes')) vanTypes.push('Mercedes Sprinter');
      if (text.includes('transit') || text.includes('ford')) vanTypes.push('Ford Transit');
      if (text.includes('promaster') || text.includes('ram')) vanTypes.push('Ram ProMaster');
      if (text.includes('econoline')) vanTypes.push('Ford Econoline');
      if (text.includes('chevy') || text.includes('express')) vanTypes.push('Chevy Express');
      
      // Return as comma-separated string like CA data, not JSON array
      return vanTypes.length > 0 ? vanTypes.join(', ') : 'Custom Van';
    } catch (e) {
      return 'Custom Van';
    }
  }

  async extractAmenities() {
    try {
      const text = (await this.page.textContent('body')).toLowerCase();
      const amenities = [];
      
      if (text.includes('solar')) amenities.push('Solar');
      if (text.includes('battery')) amenities.push('Battery');
      if (text.includes('ac') || text.includes('air condition')) amenities.push('AC');
      if (text.includes('heating') || text.includes('heater')) amenities.push('Heating');
      if (text.includes('kitchen')) amenities.push('Kitchen');
      if (text.includes('bathroom') || text.includes('toilet')) amenities.push('Bathroom');
      if (text.includes('bed') || text.includes('sleep')) amenities.push('Bed');
      if (text.includes('storage')) amenities.push('Storage');
      
      // Return array directly - will be JSON.stringify'd in insertBuilderData
      return amenities.length > 0 ? amenities : ['Custom Build'];
    } catch (e) {
      return ['Custom Build'];
    }
  }

  async extractServices() {
    const services = ['Custom Builds', 'Van Conversions'];
    
    try {
      const text = (await this.page.textContent('body')).toLowerCase();
      
      if (text.includes('repair') || text.includes('service')) services.push('Repairs');
      if (text.includes('upgrade')) services.push('Upgrades');
      if (text.includes('rental') || text.includes('rent')) services.push('Rentals');
      if (text.includes('financing')) services.push('Financing');
      if (text.includes('consultation') || text.includes('consult')) services.push('Consultation');
      
    } catch (e) {}
    
    // Return array directly - will be JSON.stringify'd in insertBuilderData
    return services;
  }

  async extractSocialMedia() {
    const socialMedia = {};
    
    const platforms = {
      instagram: ['instagram.com', 'insta'],
      facebook: ['facebook.com', 'fb.com'],
      youtube: ['youtube.com'],
      twitter: ['twitter.com', 'x.com'],
      tiktok: ['tiktok.com']
    };

    for (const [platform, patterns] of Object.entries(platforms)) {
      try {
        for (const pattern of patterns) {
          const link = await this.page.$(`a[href*="${pattern}"]`);
          if (link) {
            const href = await link.getAttribute('href');
            if (href) {
              socialMedia[platform] = href;
              break;
            }
          }
        }
      } catch (e) {}
    }
    
    // Return object directly - will be JSON.stringify'd in insertBuilderData
    return socialMedia;
  }

  async extractPhotos() {
    const photos = [];
    
    try {
      console.log('📸 Extracting photo gallery with enhanced filtering...');
      
      // Enhanced selectors for better photo discovery
      const gallerySelectors = [
        '.gallery img', '.portfolio img', '.slider img', '.carousel img',
        '.lightbox img', '[class*="gallery"] img', '[class*="portfolio"] img',
        'img[src*="van"]', 'img[src*="build"]', 'img[src*="conversion"]',
        'img[src*="interior"]', 'img[src*="exterior"]', 'img[alt*="van"]',
        'img[alt*="conversion"]', 'img[alt*="build"]', 'img[alt*="custom"]'
      ];

      const allImages = await this.page.$$eval('img', (imgs) => {
        return imgs.map(img => ({
          src: img.src,
          alt: img.alt || '',
          title: img.title || '',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          className: img.className || '',
          id: img.id || ''
        }));
      });

      // Enhanced filtering to avoid logos and graphics
      const filteredImages = allImages.filter(img => {
        const url = img.src.toLowerCase();
        const alt = img.alt.toLowerCase();
        const title = img.title.toLowerCase();
        const className = img.className.toLowerCase();
        const id = img.id.toLowerCase();
        
        // Skip obvious non-van content
        const skipPatterns = [
          'logo', 'favicon', 'icon', 'badge', 'banner', 'header',
          'footer', 'background', 'pattern', 'texture', 'watermark',
          'placeholder', 'avatar', 'profile', 'team', 'staff', 'person',
          '.svg', 'brand', 'symbol', 'testimonial', 'review', 'quote',
          'social', 'facebook', 'instagram', 'twitter', 'linkedin',
          'nav', 'menu', 'button', 'arrow', 'thumb'
        ];
        
        const hasSkipPattern = skipPatterns.some(pattern => 
          url.includes(pattern) || alt.includes(pattern) || 
          title.includes(pattern) || className.includes(pattern) || 
          id.includes(pattern)
        );
        
        // Look for van-related content
        const vanKeywords = [
          'van', 'camper', 'conversion', 'build', 'interior', 'exterior',
          'kitchen', 'bed', 'solar', 'bathroom', 'custom', 'sprinter',
          'transit', 'promaster', 'project', 'gallery', 'portfolio',
          'work', 'completed', 'finished'
        ];
        
        const hasVanKeyword = vanKeywords.some(keyword => 
          url.includes(keyword) || alt.includes(keyword) || title.includes(keyword)
        );
        
        // Quality filters
        const hasValidUrl = img.src && img.src.startsWith('http');
        const hasGoodSize = img.width >= 300 && img.height >= 200;
        const notSvg = !url.includes('.svg');
        const goodAspectRatio = img.width / img.height > 0.5 && img.width / img.height < 3;
        
        return hasValidUrl && hasGoodSize && notSvg && !hasSkipPattern && 
               goodAspectRatio && (hasVanKeyword || img.width >= 500);
      });

      // Sort by relevance (van keywords first, then by size)
      filteredImages.sort((a, b) => {
        const aHasVanKeyword = ['van', 'conversion', 'build', 'interior'].some(kw => 
          a.alt.toLowerCase().includes(kw) || a.src.toLowerCase().includes(kw)
        );
        const bHasVanKeyword = ['van', 'conversion', 'build', 'interior'].some(kw => 
          b.alt.toLowerCase().includes(kw) || b.src.toLowerCase().includes(kw)
        );
        
        if (aHasVanKeyword && !bHasVanKeyword) return -1;
        if (!aHasVanKeyword && bHasVanKeyword) return 1;
        
        return (b.width * b.height) - (a.width * a.height); // Larger images first
      });

      // Take up to maxPhotos (8) best images
      const bestImages = filteredImages.slice(0, this.maxPhotos);
      
      for (const img of bestImages) {
        photos.push({
          url: img.src,
          alt: img.alt || 'Van conversion photo',
          caption: img.title || img.alt || 'Custom van build'
        });
      }
      
      console.log(`📸 Found ${photos.length} quality photos (filtered from ${allImages.length} total)`);
      
    } catch (error) {
      console.error('Error extracting photos:', error.message);
    }
    
    return photos; // Return array for CSP checking
  }

  async extractLeadTime() {
    try {
      const text = await this.page.textContent('body');
      const leadTimeMatch = text.match(/(\d+[-\s]?\d*)\s*(month|week|day)/i);
      if (leadTimeMatch) {
        return leadTimeMatch[0];
      }
    } catch (e) {}
    
    return '3-6 months';
  }

  async extractExperience() {
    try {
      const text = await this.page.textContent('body');
      const expMatch = text.match(/(\d+)\s*year/i);
      if (expMatch) {
        return expMatch[1];
      }
    } catch (e) {}
    
    return null;
  }

  async extractSportsmobileArizonaLocation() {
    console.log('🏢 Extracting Sportsmobile Arizona location...');
    
    try {
      // Look for Arizona-specific location page
      const arizonaLinks = await this.page.$$('a[href*="arizona"], a[href*="phoenix"], a:has-text("Arizona"), a:has-text("Phoenix")');
      
      if (arizonaLinks.length > 0) {
        const arizonaLink = arizonaLinks[0];
        const href = await arizonaLink.getAttribute('href');
        
        if (href) {
          const fullUrl = new URL(href, this.page.url()).toString();
          await this.page.goto(fullUrl, { waitUntil: 'networkidle' });
          
          // Extract Arizona-specific data
          return {
            address: await this.extractStreetAddress(),
            city: await this.extractCity(),
            phone: await this.extractPhone(),
            email: await this.extractEmail()
          };
        }
      }
      
      // Fallback: look for Arizona info on main page
      const pageText = await this.page.textContent('body');
      const arizonaSection = pageText.match(/Arizona[\s\S]*?(\d+.*?(Ave|St|Blvd|Lane|Road)[\s\S]*?\d{5})/i);
      
      if (arizonaSection) {
        return {
          address: this.extractAddressFromText(arizonaSection[0]),
          city: 'Phoenix',
          phone: this.extractPhoneFromText(arizonaSection[0]),
          email: this.extractEmailFromText(arizonaSection[0])
        };
      }
      
    } catch (e) {
      console.log('⚠️ Could not extract Arizona-specific Sportsmobile data');
    }
    
    return {};
  }

  extractAddressFromText(text) {
    const addressMatch = text.match(/(\d+.*?(Ave|St|Blvd|Lane|Road))/i);
    return addressMatch ? addressMatch[1].trim() : null;
  }

  extractPhoneFromText(text) {
    const phoneMatch = text.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
    return phoneMatch ? phoneMatch[1] : null;
  }

  extractEmailFromText(text) {
    const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    return emailMatch ? emailMatch[0] : null;
  }

  async geocodeAddress(address) {
    console.log(`📍 Geocoding: ${address}`);
    
    // Use the enhanced geocoding system
    const { EnhancedGeocodingSystem } = require('./enhanced_geocoding_system');
    const geocoder = new EnhancedGeocodingSystem();
    
    try {
      const result = await geocoder.geocodeAddress(address);
      
      if (result) {
        console.log(`   ✅ Geocoded successfully: ${result.lat}, ${result.lng} (accuracy: ${result.accuracy})`);
        return {
          lat: result.lat,
          lng: result.lng,
          accuracy: result.accuracy,
          service: result.service
        };
      }
    } catch (error) {
      console.log(`   ⚠️ Geocoding failed: ${error.message}`);
    }
    
    // If geocoding fails, return null instead of default coordinates
    console.log(`   ❌ No coordinates available for: ${address}`);
    return null;
  }

  async insertBuilderData(data) {
    try {
      // Insert into database using your existing schema
      const query = `
        INSERT INTO builders (
          name, website, address, city, state, zip, phone, email,
          lat, lng, description, van_types, amenities, services,
          social_media, photos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const stmt = this.db.db.prepare(query);
      stmt.run(
        data.name,
        data.website,
        data.address,
        data.city,
        data.state,
        data.zip,
        data.phone,
        data.email,
        data.lat,
        data.lng,
        data.description,
        data.van_types,
        // Properly stringify arrays and objects for database storage
        Array.isArray(data.amenities) ? JSON.stringify(data.amenities) : data.amenities,
        Array.isArray(data.services) ? JSON.stringify(data.services) : data.services,
        typeof data.social_media === 'object' && data.social_media !== null ? JSON.stringify(data.social_media) : data.social_media,
        Array.isArray(data.photos) ? JSON.stringify(data.photos) : data.photos
      );
      
      console.log(`💾 Inserted: ${data.name}`);
      
    } catch (error) {
      console.error(`❌ Database insertion failed for ${data.name}:`, error.message);
    }
  }

  async checkExistingBuilder(name) {
    try {
      const query = 'SELECT * FROM builders WHERE name = ?';
      const stmt = this.db.db.prepare(query);
      return stmt.get(name);
    } catch (error) {
      console.error('Error checking existing builder:', error.message);
      return null;
    }
  }

  async promptOverwrite(newData, existingData) {
    console.log('\n🚨 DUPLICATE BUILDER DETECTED');
    console.log('═'.repeat(50));
    console.log(`Builder: ${newData.name}`);
    console.log('\n📊 COMPARISON:');
    console.log(`Website: ${newData.website}`);
    console.log(`New Phone: ${newData.phone || 'N/A'} | Existing: ${existingData.phone || 'N/A'}`);
    console.log(`New Email: ${newData.email || 'N/A'} | Existing: ${existingData.email || 'N/A'}`);
    console.log(`New Address: ${newData.address || 'N/A'} | Existing: ${existingData.address || 'N/A'}`);
    console.log(`New Photos: ${newData.photos ? JSON.parse(newData.photos).length : 0} | Existing: ${existingData.photos ? JSON.parse(existingData.photos).length : 0}`);
    
    // For now, automatically allow overwrite (you can change this to prompt user)
    console.log('\n✅ AUTO-OVERWRITING (can be changed to manual prompt later)');
    return true;
  }

  generateFinalReport() {
    console.log('\n📋 UNIVERSAL STATE SCRAPER - FINAL REPORT');
    console.log('═'.repeat(60));
    
    const successful = this.processedBuilders.filter(b => b.status === 'success');
    const partial = this.processedBuilders.filter(b => b.status === 'partial');
    const failed = this.processedBuilders.filter(b => b.status === 'failed');
    const skipped = this.processedBuilders.filter(b => b.status === 'skipped');
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Successful: ${successful.length}`);
    console.log(`   ⚠️  Partial: ${partial.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    console.log(`   ⏭️  Skipped: ${skipped.length}`);
    console.log(`   📈 Total Processed: ${this.processedBuilders.length}`);
    
    if (successful.length > 0) {
      console.log(`\n✅ SUCCESSFUL BUILDS:`);
      successful.forEach(builder => {
        console.log(`   • ${builder.name} (${builder.photos} photos)`);
      });
    }
    
    if (partial.length > 0) {
      console.log(`\n⚠️  PARTIAL BUILDS (saved with missing data):`);
      partial.forEach(builder => {
        console.log(`   • ${builder.name} - ${builder.reason}`);
      });
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ FAILED BUILDS:`);
      failed.forEach(builder => {
        console.log(`   • ${builder.name} - ${builder.reason}`);
      });
    }
    
    if (skipped.length > 0) {
      console.log(`\n⏭️  SKIPPED BUILDS:`);
      skipped.forEach(builder => {
        console.log(`   • ${builder.name} - ${builder.reason}`);
      });
    }
    
    const totalPhotos = successful.reduce((sum, b) => sum + (b.photos || 0), 0);
    console.log(`\n📸 PHOTO STATISTICS:`);
    console.log(`   Total photos collected: ${totalPhotos}`);
    console.log(`   Average per successful builder: ${successful.length > 0 ? (totalPhotos / successful.length).toFixed(1) : 0}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    this.db.close();
  }

  // CSP Domain Validation Methods
  getCurrentCSPDomains() {
    // Read current CSP img-src domains from security-headers.js
    try {
      const securityHeadersPath = path.join(__dirname, '../public/security-headers.js');
      const content = fs.readFileSync(securityHeadersPath, 'utf-8');
      
      // Extract img-src array from the file
      const imgSrcMatch = content.match(/'img-src':\s*\[([\s\S]*?)\]/);
      if (imgSrcMatch) {
        const imgSrcContent = imgSrcMatch[1];
        // Extract quoted strings
        const domains = imgSrcContent.match(/"[^"]+"/g) || [];
        return domains.map(d => d.replace(/"/g, ''));
      }
    } catch (error) {
      console.warn('⚠️ Could not read current CSP domains from security-headers.js:', error.message);
    }
    
    // Fallback to hardcoded list (updated with recent additions)
    return [
      "'self'", "data:", "*.googleapis.com", "*.gstatic.com", 
      "https://static.wixstatic.com", "https://vanquestak.com", 
      "https://papagovans.com", "https://www.tommycampervans.com",
      "https://lirp.cdn-website.com", "https://ucarecdn.com", 
      "https://images.squarespace-cdn.com", "https://www.ozkcustoms.com", 
      "https://camplifecustoms.com", "https://www.outpostvans.com", 
      "https://outpostvans.files.wordpress.com", "https://vanworks.com", 
      "https://geotrekvans.com", "https://renegadevans.com", 
      "https://maps.google.com", "https://maps.gstatic.com", "https://maps.googleapis.com", 
      "https://*.google.com", "https://*.gstatic.com", "https://*.googleapis.com", 
      "https://*.freepik.com", "https://images.unsplash.com", 
      "https://advanced-rv.com", "https://*.advanced-rv.com", 
      "https://images.ctfassets.net", "https://*.cdninstagram.com", 
      "https://*.fbcdn.net", "https://www.exclusiveoutfitters.com", 
      "https://www.vanspeedshop.com", "https://canoconversions.com", 
      "https://www.titanvans.com", "https://vikingvancustoms.com", 
      "https://woodpeckercraftsandbuilds.com", "https://thesummitvans.com", 
      "https://scamperrv.com", "https://levityvans.com", 
      "https://thb.tildacdn.net", "https://thb.tildacdn.com", 
      "https://optim.tildacdn.net", "https://optim.tildacdn.com", 
      "https://static.tildacdn.com", "https://tilda.ws", 
      "https://roguevans.com", "https://sandyvans.com", 
      "https://cdn.shopify.com", "https://statworksoverland.com", 
      "https://www.vannon.com", "https://backcountryvans.com",
      "https://redpointconversions.com", "https://wylderoffroaddesign.com",
      "https://pendulumvans.com", "https://dmvans.com", "https://rossmonster.com",
      "https://wayfarervans.com", "https://venturhaus.com", "https://avcrig.com",
      "https://customcamperinc.com", "https://www.livealittlevans.com",
      "https://freedomvangorw.wpenginepowered.com", "https://www.freedomvango.com",
      "https://i0.wp.com", "https://customcoachcreations.com", "https://vanconversionshop.com",
      "https://www.groovevans.net", "https://www.moderntimesvanco.com", "https://www.ourvanquest.com"
    ];
  }

  extractDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return `https://${urlObj.hostname}`;
    } catch (e) {
      return null;
    }
  }

  isDomainAllowedByCSP(domain, cspDomains) {
    // Check exact match
    if (cspDomains.includes(domain)) return true;
    
    // Check wildcard patterns
    const hostname = domain.replace('https://', '');
    for (const cspDomain of cspDomains) {
      if (cspDomain.startsWith('https://*.')) {
        const wildcardDomain = cspDomain.replace('https://*.', '');
        if (hostname.endsWith(wildcardDomain)) return true;
      }
    }
    
    return false;
  }

  validatePhotosForCSP(photos, websiteUrl) {
    const cspDomains = this.getCurrentCSPDomains();
    const violations = [];
    const newDomains = new Set();
    
    photos.forEach(photo => {
      const domain = this.extractDomainFromUrl(photo.url);
      if (domain && !this.isDomainAllowedByCSP(domain, cspDomains)) {
        violations.push({
          url: photo.url,
          domain: domain,
          alt: photo.alt
        });
        newDomains.add(domain);
      }
    });

    // Also check the main website domain
    const websiteDomain = this.extractDomainFromUrl(websiteUrl);
    if (websiteDomain && !this.isDomainAllowedByCSP(websiteDomain, cspDomains)) {
      newDomains.add(websiteDomain);
    }

    return {
      violations,
      newDomains: Array.from(newDomains),
      hasViolations: violations.length > 0
    };
  }

  reportCSPIssues(builderName, cspCheck) {
    if (cspCheck.hasViolations) {
      console.log(`\n🚨 CSP VIOLATION ALERT for ${builderName}:`);
      console.log(`   ${cspCheck.violations.length} image(s) will be blocked by CSP`);
      
      cspCheck.violations.forEach((violation, index) => {
        console.log(`   ${index + 1}. ${violation.url}`);
        console.log(`      Domain: ${violation.domain}`);
      });
      
      console.log(`\n🔧 REQUIRED CSP UPDATES:`);
      console.log(`   Add these domains to public/security-headers.js img-src:`);
      cspCheck.newDomains.forEach(domain => {
        console.log(`   "${domain}",`);
      });
      console.log(`\n📝 Copy this to security-headers.js img-src array:`);
      console.log(`   ${cspCheck.newDomains.map(d => `"${d}"`).join(', ')}`);
      
      // Track violations globally
      this.cspViolations.set(builderName, {
        domains: cspCheck.newDomains,
        violationCount: cspCheck.violations.length,
        violations: cspCheck.violations
      });
      
      return true; // Has violations
    }
    
    return false; // No violations
  }

  async autoUpdateCSP(newDomains) {
    if (!newDomains || newDomains.length === 0) {
      return false;
    }

    try {
      const securityHeadersPath = path.join(__dirname, '../public/security-headers.js');
      let content = fs.readFileSync(securityHeadersPath, 'utf-8');
      
      // Find the img-src array
      const imgSrcMatch = content.match(/'img-src':\s*\[([\s\S]*?)\]/);
      if (!imgSrcMatch) {
        console.error('❌ Could not find img-src array in security-headers.js');
        return false;
      }
      
      const imgSrcContent = imgSrcMatch[1];
      const currentDomains = imgSrcContent.match(/"[^"]+"/g) || [];
      const currentDomainsSet = new Set(currentDomains.map(d => d.replace(/"/g, '')));
      
      // Filter out domains that are already present
      const domainsToAdd = newDomains.filter(domain => !currentDomainsSet.has(domain));
      
      if (domainsToAdd.length === 0) {
        console.log('✅ All domains already present in CSP policy');
        return true;
      }
      
      // Add new domains to the end of the array
      const newDomainsStr = domainsToAdd.map(d => `"${d}"`).join(', ');
      const updatedImgSrcContent = imgSrcContent.trim().replace(/,$/, '') + ', ' + newDomainsStr;
      
      // Replace the img-src array in the content
      const updatedContent = content.replace(
        /'img-src':\s*\[[\s\S]*?\]/,
        `'img-src': [${updatedImgSrcContent}]`
      );
      
      // Write back to file
      fs.writeFileSync(securityHeadersPath, updatedContent, 'utf-8');
      
      console.log(`\n🔧 AUTO-UPDATED CSP POLICY:`);
      console.log(`   Added ${domainsToAdd.length} new domains to security-headers.js`);
      domainsToAdd.forEach(domain => {
        console.log(`   ✅ ${domain}`);
      });
      console.log(`\n📝 CSP policy updated automatically! Refresh browser to apply changes.`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to auto-update CSP policy:', error.message);
      return false;
    }
  }

  generateCSPSummaryReport() {
    if (this.cspViolations.size === 0) {
      console.log('\n✅ CSP CHECK COMPLETE: No violations found!');
      return;
    }

    console.log('\n📋 CSP VIOLATION SUMMARY REPORT');
    console.log('═'.repeat(50));
    
    const allNewDomains = new Set();
    let totalViolations = 0;
    
    this.cspViolations.forEach((data, builderName) => {
      console.log(`\n🏢 ${builderName}:`);
      console.log(`   Violations: ${data.violationCount}`);
      console.log(`   New domains: ${data.domains.join(', ')}`);
      
      data.domains.forEach(domain => allNewDomains.add(domain));
      totalViolations += data.violationCount;
    });
    
    console.log('\n' + '═'.repeat(50));
    console.log(`📊 TOTALS:`);
    console.log(`   Builders with violations: ${this.cspViolations.size}`);
    console.log(`   Total image violations: ${totalViolations}`);
    console.log(`   Unique domains to add: ${allNewDomains.size}`);
    
    if (allNewDomains.size > 0) {
      console.log('\n🔧 ATTEMPTING AUTO-UPDATE OF CSP POLICY...');
      
      // Attempt to auto-update CSP policy
      this.autoUpdateCSP(Array.from(allNewDomains)).then(success => {
        if (!success) {
          console.log('\n🔧 MANUAL CSP FIX REQUIRED:');
          console.log('Add these domains to public/security-headers.js img-src array:');
          console.log('');
          console.log(Array.from(allNewDomains).map(d => `"${d}"`).join(',\n'));
          console.log('');
          console.log('🚨 IMPORTANT: Update CSP policy before deploying these builders!');
        }
      }).catch(error => {
        console.error('❌ Auto-update failed:', error.message);
        console.log('\n🔧 MANUAL CSP FIX REQUIRED:');
        console.log('Add these domains to public/security-headers.js img-src array:');
        console.log('');
        console.log(Array.from(allNewDomains).map(d => `"${d}"`).join(',\n'));
      });
    }
  }
}

// Main execution
async function main() {
  const csvFile = process.argv[2];
  const stateFilter = process.argv[3];
  
  if (!csvFile) {
    console.error('Usage: node universal_state_scraper.js <csv_file> [state_filter]');
    console.error('Example: node universal_state_scraper.js state_builders_template.csv');
    console.error('Example: node universal_state_scraper.js state_builders_template.csv AZ');
    process.exit(1);
  }

  const scraper = new UniversalStateScraper();
  
  try {
    await scraper.init();
    await scraper.importFromCSV(csvFile, stateFilter);
    
    // Generate final report
    scraper.generateFinalReport();
    
    // Generate CSP violation summary
    scraper.generateCSPSummaryReport();
    
    console.log('\n✅ Universal State Scraper completed successfully!');
    
  } catch (error) {
    console.error('❌ Scraper failed:', error);
  } finally {
    await scraper.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = { UniversalStateScraper }; 