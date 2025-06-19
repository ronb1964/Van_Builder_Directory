const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Import existing scraper modules
const dataExtraction = require('./scraper_modules/data_extraction');
const { extractPhotos } = require('./scraper_modules/photo_processing');
const locationUtils = require('./scraper_modules/location_utils');

// Helper function to format phone numbers
function formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid 10-digit US phone number
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
        // Remove country code if present
        return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    // Return original if can't format
    return phone;
}

class ManualBuilderScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = [];
    }

    async initialize() {
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        this.page.setDefaultTimeout(30000);
    }

    async scrapeWebsite(url, builderName = null) {
        console.log(`\n🔍 Scraping: ${url}`);
        
        try {
            // Navigate to website
            await this.page.goto(url, { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(2000);
            
            // Extract all data using existing modules
            const contactInfo = await dataExtraction.extractContactInfo(this.page);
            const socialMedia = await dataExtraction.extractSocialMedia(this.page);
            const description = await dataExtraction.extractDescription(this.page);
            const businessName = await dataExtraction.extractBusinessName(this.page);
            
            // Extract name if not provided
            if (!builderName) {
                builderName = businessName || await this.page.evaluate(() => {
                    // Try various selectors for business name
                    const selectors = ['h1', '.logo', '.company-name', '.business-name', '[itemprop="name"]'];
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element && element.textContent.trim()) {
                            return element.textContent.trim();
                        }
                    }
                    return null;
                });
            }
            
            // Extract and process photos
            const photos = await extractPhotos(this.page, 8);
            
            // Extract van types and amenities from page content
            const pageText = await this.page.evaluate(() => document.body.innerText);
            const vanTypes = this.extractVanTypes(pageText);
            const amenities = this.extractAmenities(pageText);
            
            // Build result object
            const result = {
                name: builderName || 'Unknown Builder',
                website: url,
                street_address: contactInfo.address || null,
                city: contactInfo.city || null,
                state: contactInfo.state || null,
                zip: contactInfo.zip || null,
                phone: formatPhoneNumber(contactInfo.phone) || null,
                email: contactInfo.email || null,
                facebook: socialMedia.facebook || null,
                instagram: socialMedia.instagram || null,
                youtube: socialMedia.youtube || null,
                van_types: vanTypes.join(', ') || null,
                amenities: amenities.join(', ') || null,
                description: description || null,
                photos: photos.map(p => p.url).join(','),
                scraped_at: new Date().toISOString()
            };
            
            console.log(`✅ Successfully scraped: ${result.name}`);
            console.log(`   📍 Location: ${result.city}, ${result.state}`);
            console.log(`   📞 Phone: ${result.phone || 'Not found'}`);
            console.log(`   📧 Email: ${result.email || 'Not found'}`);
            console.log(`   📷 Photos: ${photos.length} found`);
            console.log(`   🚐 Van Types: ${result.van_types || 'Not specified'}`);
            
            return result;
            
        } catch (error) {
            console.error(`❌ Error scraping ${url}:`, error.message);
            return {
                name: builderName || 'Unknown',
                website: url,
                error: error.message,
                scraped_at: new Date().toISOString()
            };
        }
    }

    async scrapeMultiple(urls) {
        await this.initialize();
        
        for (const urlData of urls) {
            // Handle both string URLs and {url, name} objects
            const url = typeof urlData === 'string' ? urlData : urlData.url;
            const name = typeof urlData === 'string' ? null : urlData.name;
            
            const result = await this.scrapeWebsite(url, name);
            this.results.push(result);
            
            // Small delay between sites
            await this.page.waitForTimeout(1000);
        }
        
        await this.close();
        return this.results;
    }

    async saveResults(outputFile = null) {
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const filename = outputFile || `manual_scrape_${timestamp}.json`;
        
        const output = {
            scrape_date: new Date().toISOString(),
            total_scraped: this.results.length,
            successful: this.results.filter(r => !r.error).length,
            builders: this.results
        };
        
        fs.writeFileSync(filename, JSON.stringify(output, null, 2));
        console.log(`\n💾 Results saved to: ${filename}`);
        
        return filename;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
    
    extractVanTypes(pageText) {
        const vanTypes = [];
        const vanPatterns = [
            /Mercedes[\s-]?Sprinter\s*(144|170)?/gi,
            /Sprinter\s*(144|170)?/gi,
            /Ford\s*Transit/gi,
            /RAM\s*ProMaster/gi,
            /Chevy\s*Express/gi,
            /GMC\s*Savana/gi,
            /Nissan\s*NV/gi,
            /Custom\s*Van/gi,
            /Cargo\s*Van/gi
        ];
        
        const textLower = pageText.toLowerCase();
        vanPatterns.forEach(pattern => {
            const matches = pageText.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const cleanMatch = match.trim();
                    if (!vanTypes.some(v => v.toLowerCase() === cleanMatch.toLowerCase())) {
                        vanTypes.push(cleanMatch);
                    }
                });
            }
        });
        
        return vanTypes;
    }
    
    extractAmenities(pageText) {
        const amenities = [];
        const amenityKeywords = [
            'Solar Power', 'Solar Panel', 'Solar',
            'Shower', 'Bathroom', 'Toilet', 'Composting Toilet',
            'Kitchen', 'Kitchenette', 'Refrigerator', 'Fridge',
            'Heating', 'Air Conditioning', 'AC', 'Climate Control',
            'Water System', 'Fresh Water', 'Gray Water',
            'Inverter', 'Shore Power', 'Electrical',
            'Insulation', 'Ventilation', 'Fan',
            'Custom Cabinetry', 'Storage', 'Cabinets',
            'Bed', 'Sleeping Area', 'Convertible Bed',
            'Awning', 'Roof Rack', 'Bike Rack',
            'Off-Grid', 'Lithium Batteries', 'Battery System'
        ];
        
        const textLower = pageText.toLowerCase();
        amenityKeywords.forEach(keyword => {
            if (textLower.includes(keyword.toLowerCase())) {
                // Normalize the amenity name
                const normalizedKeyword = keyword
                    .split(/\s+/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                    
                if (!amenities.includes(normalizedKeyword)) {
                    amenities.push(normalizedKeyword);
                }
            }
        });
        
        return amenities;
    }
}

// Parse command line arguments
async function parseArguments() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Manual Van Builder Scraper
==========================

Usage:
  node manual_scraper.js <urls...>                    # Scrape URLs from command line
  node manual_scraper.js -f <file>                    # Scrape URLs from file
  node manual_scraper.js --file <file>                # Scrape URLs from file

Examples:
  node manual_scraper.js https://humbleroad.com https://builtvans.com
  node manual_scraper.js -f urls.txt
  node manual_scraper.js --name "Humble Road" https://humbleroad.com

File format (urls.txt):
  https://humbleroad.com
  https://builtvans.com
  # Comments are ignored
  # You can also specify names:
  Humble Road|https://humbleroad.com
        `);
        process.exit(0);
    }
    
    const urls = [];
    let i = 0;
    
    while (i < args.length) {
        if (args[i] === '-f' || args[i] === '--file') {
            // Read URLs from file
            i++;
            if (i >= args.length) {
                console.error('Error: File path required after -f/--file');
                process.exit(1);
            }
            
            const filePath = args[i];
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    // Skip empty lines and comments
                    if (!trimmed || trimmed.startsWith('#')) continue;
                    
                    // Check for name|url format
                    if (trimmed.includes('|')) {
                        const [name, url] = trimmed.split('|').map(s => s.trim());
                        urls.push({ name, url });
                    } else {
                        urls.push(trimmed);
                    }
                }
            } catch (error) {
                console.error(`Error reading file ${filePath}:`, error.message);
                process.exit(1);
            }
            
        } else if (args[i] === '--name') {
            // Next URL should use this name
            i++;
            if (i + 1 >= args.length) {
                console.error('Error: --name requires a name and URL');
                process.exit(1);
            }
            const name = args[i];
            i++;
            const url = args[i];
            urls.push({ name, url });
            
        } else if (args[i].startsWith('http')) {
            // Direct URL
            urls.push(args[i]);
            
        } else {
            console.error(`Unknown argument: ${args[i]}`);
            process.exit(1);
        }
        
        i++;
    }
    
    return urls;
}

// Main execution
async function main() {
    const urls = await parseArguments();
    
    if (urls.length === 0) {
        console.error('No URLs provided');
        process.exit(1);
    }
    
    console.log(`\n🚀 Manual Van Builder Scraper`);
    console.log(`📊 Scraping ${urls.length} website(s)...\n`);
    
    const scraper = new ManualBuilderScraper();
    
    try {
        await scraper.scrapeMultiple(urls);
        await scraper.saveResults();
        
        // Summary
        const successful = scraper.results.filter(r => !r.error).length;
        console.log(`\n✅ Scraping complete!`);
        console.log(`   Total sites: ${urls.length}`);
        console.log(`   Successful: ${successful}`);
        console.log(`   Failed: ${urls.length - successful}`);
        
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = ManualBuilderScraper;
