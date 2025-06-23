const { EnhancedWebsiteScraper } = require('../enhanced_scraper_with_geocoding');
const { scraperConfig } = require('../scraper_config');

// CONFIGURATION: Edit this section for each new state
const STATE_CONFIG = {
    name: 'STATE_NAME_HERE',  // e.g., 'Texas', 'Florida', 'Colorado'
    websites: [
        { url: 'https://builder1.com/', name: 'Builder Name 1' },
        { url: 'https://builder2.com/', name: 'Builder Name 2' },
        { url: 'https://builder3.com/', name: 'Builder Name 3' },
        // Add 5-10 van builders for this state
    ]
};

// Major cities for geocoding fallbacks - ADD 8-10 MAJOR CITIES
const STATE_CITY_COORDINATES = {
    'major_city_1': { lat: 40.7128, lng: -74.0060 },  // Replace with actual coordinates
    'major_city_2': { lat: 34.0522, lng: -118.2437 },  // Replace with actual coordinates
    'major_city_3': { lat: 41.8781, lng: -87.6298 },  // Replace with actual coordinates
    // Add more major cities for better geocoding coverage
};

class StateSpecificScraper extends EnhancedWebsiteScraper {
    constructor(stateName, cityCoordinates) {
        super(stateName, cityCoordinates);
        this.stateAbbrev = this.getStateAbbreviation(stateName);
    }

    getStateAbbreviation(stateName) {
        const abbreviations = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
            'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
            'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
            'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
            'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
            'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
            'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
            'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
            'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
            'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
            'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
        return abbreviations[stateName] || stateName.substring(0, 2).toUpperCase();
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
                social_media: {},  // Object format for UI compatibility
                van_types: [],
                amenities: [],
                services: [],
                description: '',
                photos: [],
                lead_time: '',
                years_experience: '',
                coordinates: null
            };
            
            // Extract contact info using enhanced modules
            console.log('   📋 Extracting contact information...');
            const contactInfo = await this.extractContactInfo(page);
            Object.assign(builderData, contactInfo);
            
            // Extract business description
            console.log('   📝 Extracting description...');
            builderData.description = await this.extractDescription(page);
            
            // Extract social media (returns object format)
            console.log('   📱 Extracting social media...');
            builderData.social_media = await this.extractSocialMedia(page);
            console.log(`   📱 Social Media: ${Object.keys(builderData.social_media).length} platforms found`);
            
            // Extract van types and amenities
            console.log('   🚐 Extracting van types and amenities...');
            builderData.van_types = await this.extractVanTypes(page);
            builderData.amenities = await this.extractAmenities(page);
            
            // Extract photos with enhanced filtering
            console.log('   📸 Extracting photos...');
            builderData.photos = await this.extractPhotos(page);
            console.log(`   📸 Photos: ${builderData.photos.length} high-quality images found`);
            
            // Geocode the address if we found one
            if (builderData.address) {
                console.log('   🌍 Geocoding address...');
                builderData.coordinates = await scraperConfig.geocodeAddress(builderData.address, builderData.name);
            }
            
            console.log(`   📍 Coordinates: ${builderData.coordinates ? 'Found' : 'Using city fallback'}`);
            
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

if (require.main === module) {
    main().catch(console.error);
} 