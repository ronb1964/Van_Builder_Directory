const fs = require('fs');
const csv = require('csv-parse');
const { chromium } = require('playwright');
const path = require('path');
const Database = require('../server/database/database');

/**
 * MCP-Enhanced CSV Importer for Van Builders
 * Extracts ALL required database fields from websites
 */

class MCPCSVImporter {
  constructor() {
    this.db = new Database();
    this.browser = null;
    this.page = null;
    this.cspViolations = new Map(); // Track CSP violations across all builders
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
      await this.processBuilder(record.state, record.website_url);
    }
  }

  async processBuilder(state, websiteUrl) {
    console.log(`\n🔍 Processing: ${websiteUrl}`);
    
    try {
      await this.page.goto(websiteUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Extract ALL required database fields
      const builderData = await this.extractComprehensiveData(state, websiteUrl);
      
      // Handle special cases like Sportsmobile multiple locations
      if (websiteUrl.includes('sportsmobile.com')) {
        const locationData = await this.extractSportsmobileArizonaLocation();
        Object.assign(builderData, locationData);
      }
      
      // Manual fixes for specific builders
      if (websiteUrl.includes('papagovans.com')) {
        builderData.name = 'Papago Vans';
        builderData.email = 'info@papagovans.com';
      }
      
      // Insert into database
      await this.insertBuilderData(builderData);
      
      console.log(`✅ Successfully processed: ${builderData.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to process ${websiteUrl}:`, error.message);
    }
  }

  async extractComprehensiveData(state, websiteUrl) {
    console.log(`🔍 Extracting data from: ${websiteUrl}`);
    
    try {
      await this.page.goto(websiteUrl, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });

      // First attempt - extract from current page
      let data = await this.extractBasicData(state, websiteUrl);
      
      // If we're missing critical contact info and not on contact page, try contact page
      const pageUrl = this.page.url();
      if ((!data.email || !data.phone || !data.address) && !pageUrl.includes('contact')) {
        console.log(`📞 Missing contact info, trying contact page...`);
        const contactData = await this.tryContactPage(websiteUrl);
        if (contactData) {
          // Merge contact data with existing data
          data = { ...data, ...contactData };
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
          
          if (email || phone || address) {
            console.log(`✅ Found contact info on contact page`);
            return { email, phone, address };
          }
        }
      } catch (e) {
        console.log(`❌ Contact page not accessible: ${contactUrl}`);
      }
    }
    
    return null;
  }

  async extractBasicData(state, websiteUrl) {
    const name = await this.extractCompanyName() || 'Unknown Builder';
    const email = await this.extractEmail();
    const phone = await this.extractPhone();
    const address = await this.extractStreetAddress();
    const city = await this.extractCity();
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

    // Get coordinates based on available address information
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
    return streetIndicators.test(text) && !text.includes('Email') && !text.includes('Phone');
  }

  cleanAddress(address) {
    return address
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .split(',')[0] // Take only street address part
      .trim();
  }

  async extractCity() {
    // Look for standard address patterns first
    const selectors = [
      'address',
      '[class*="address"]',
      '[class*="location"]',
      '[class*="contact"]'
    ];

    for (const selector of selectors) {
      try {
        const elements = await this.page.$$(selector);
        for (const element of elements) {
          const text = await element.textContent();
          // Look for "City, State" or "City, ST zipcode" pattern
          const cityStateMatch = text.match(/([A-Za-z\s]{2,30}),\s*([A-Z]{2})\s*\d{0,5}/);
          if (cityStateMatch) {
            const city = cityStateMatch[1].trim();
            const state = cityStateMatch[2].trim();
            // Verify it's actually Arizona
            if (state === 'AZ' && city.length < 25 && !/[^\w\s]/.test(city)) {
              return city;
            }
          }
        }
      } catch (e) {}
    }

    // Look for common Arizona cities in the full page text
    try {
      const bodyText = await this.page.textContent('body');
      const arizonaCities = ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe', 'Peoria', 'Surprise', 'Yuma', 'Avondale', 'Flagstaff', 'Goodyear', 'Buckeye'];
      
      for (const city of arizonaCities) {
        // Look for "city, AZ" or "city, Arizona" patterns
        const cityPattern = new RegExp(`\\b${city},\\s*(AZ|Arizona)\\b`, 'i');
        if (cityPattern.test(bodyText)) {
          return city;
        }
      }
    } catch (e) {}
    
    return 'Phoenix'; // Default fallback
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
      
      return JSON.stringify(amenities.length > 0 ? amenities : ['Custom Build']);
    } catch (e) {
      return JSON.stringify(['Custom Build']);
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
    
    return JSON.stringify(services);
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
    
    return JSON.stringify(socialMedia);
  }

  async extractPhotos() {
    const photos = [];
    
    try {
      const gallerySelectors = [
        '.gallery img',
        '.portfolio img',
        'img[src*="van"]',
        'img[src*="build"]',
        'img[alt*="van"]'
      ];

      for (const selector of gallerySelectors) {
        const images = await this.page.$$(selector);
        for (const img of images.slice(0, 3)) { // Limit to 3 photos
          const src = await img.getAttribute('src');
          const alt = await img.getAttribute('alt');
          
          if (src && src.startsWith('http')) {
            photos.push({
              url: src,
              alt: alt || 'Van conversion photo',
              caption: `Custom van build`
            });
          }
        }
        
        if (photos.length >= 3) break;
      }
    } catch (e) {}
    
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
        data.amenities,
        data.services,
        data.social_media,
        data.photos
      );
      
      console.log(`💾 Inserted: ${data.name}`);
      
    } catch (error) {
      console.error(`❌ Database insertion failed for ${data.name}:`, error.message);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    this.db.close();
  }

  // CSP Domain Validation Methods
  getCurrentCSPDomains() {
    // Current CSP img-src domains from security-headers.js
    return [
      "'self'", "data:", "*.googleapis.com", "*.gstatic.com", 
      "https://static.wixstatic.com", "https://vanquestak.com", 
      "https://papagovans.com", "https://www.tommycampervans.com",
      "https://lirp.cdn-website.com", "https://ucarecdn.com", 
      "https://images.squarespace-cdn.com", "https://www.ozkcustoms.com", 
      "https://camplifecustoms.com", "https://www.outpostvans.com", 
      "https://outpostvans.files.wordpress.com", "https://maps.google.com", 
      "https://maps.gstatic.com", "https://maps.googleapis.com", 
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
      "https://www.vannon.com", "https://backcountryvans.com"
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
      console.log('\n🔧 COMPLETE CSP FIX:');
      console.log('Add these domains to public/security-headers.js img-src array:');
      console.log('');
      console.log(Array.from(allNewDomains).map(d => `"${d}"`).join(',\n'));
      console.log('');
      console.log('🚨 IMPORTANT: Update CSP policy before deploying these builders!');
    }
  }
}

// Main execution
async function main() {
  const importer = new MCPCSVImporter();
  
  try {
    await importer.init();
    await importer.importFromCSV(path.join(__dirname, 'test_phase1.csv'));
    
    // Generate CSP violation summary
    importer.generateCSPSummaryReport();
    
    console.log('\n✅ Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await importer.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = { MCPCSVImporter }; 