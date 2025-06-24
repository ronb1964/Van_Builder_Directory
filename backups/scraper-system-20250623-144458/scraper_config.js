// Centralized scraper configuration to ensure Google Maps geocoding is used
const { EnhancedGeocodingSystem } = require('./enhanced_geocoding_system');

class ScraperConfig {
    constructor() {
        this.geocoder = new EnhancedGeocodingSystem();
        this.isGoogleGeocodingEnabled = true; // Always use Google Maps
    }

    /**
     * Standard geocoding method for all scrapers
     * Uses Google Maps API for precise coordinates
     */
    async geocodeAddress(address, businessName = '') {
        console.log(`   🌍 [Google Maps] Geocoding address: ${address}`);
        
        try {
            const result = await this.geocoder.geocodeAddress(address, businessName);
            
            if (result) {
                console.log(`   ✅ Google Maps precision: ${result.lat}, ${result.lng} (accuracy: ${result.accuracy})`);
                return {
                    lat: result.lat,
                    lng: result.lng,
                    accuracy: result.accuracy >= 0.8 ? 'high' : 'medium',
                    service: result.service,
                    formatted_address: result.formatted_address || address
                };
            }
        } catch (error) {
            console.log(`   ⚠️ Google geocoding error: ${error.message}`);
        }

        // If Google fails, return null to indicate geocoding failure
        console.log(`   ❌ No coordinates available for: ${address}`);
        return null;
    }

    /**
     * Configuration for different states
     * Add new states here as needed
     */
    getStateConfig(stateName) {
        const configs = {
            'Alabama': {
                abbreviation: 'AL',
                majorCities: {
                    'birmingham': { lat: 33.5207, lng: -86.8025 },
                    'huntsville': { lat: 34.7304, lng: -86.5861 },
                    'mobile': { lat: 30.6954, lng: -88.0399 },
                    'montgomery': { lat: 32.3668, lng: -86.3000 },
                    'tuscaloosa': { lat: 33.2098, lng: -87.5692 },
                    'midfield': { lat: 33.4668, lng: -86.9036 }
                },
                defaultCity: 'birmingham'
            },
            'Arkansas': {
                abbreviation: 'AR',
                majorCities: {
                    'fayetteville': { lat: 36.0822, lng: -94.1719 },
                    'little rock': { lat: 34.7465, lng: -92.2896 },
                    'fort smith': { lat: 35.3859, lng: -94.3985 },
                    'springdale': { lat: 36.1867, lng: -94.1288 },
                    'bentonville': { lat: 36.3729, lng: -94.2088 }
                },
                defaultCity: 'fayetteville'
            },
            'California': {
                abbreviation: 'CA',
                majorCities: {
                    'los angeles': { lat: 34.0522, lng: -118.2437 },
                    'san francisco': { lat: 37.7749, lng: -122.4194 },
                    'san diego': { lat: 32.7157, lng: -117.1611 },
                    'sacramento': { lat: 38.5816, lng: -121.4944 },
                    'san jose': { lat: 37.3382, lng: -121.8863 }
                },
                defaultCity: 'los angeles'
            }
            // Add more states as needed
        };

        return configs[stateName] || {
            abbreviation: stateName.substring(0, 2).toUpperCase(),
            majorCities: {},
            defaultCity: null
        };
    }

    /**
     * Standard scraper settings
     */
    getScraperSettings() {
        return {
            // Browser settings
            headless: true,
            timeout: 30000,
            waitForNetworkIdle: true,
            
            // Scraping behavior
            respectfulDelay: 3000, // 3 seconds between requests
            maxRetries: 2,
            
            // Geocoding settings
            useGoogleMaps: true,
            fallbackToCity: true,
            coordinateValidation: true,
            
            // Photo settings
            maxPhotos: 8,
            minPhotoSize: 200, // pixels
            photoFormats: ['jpg', 'jpeg', 'png', 'webp'],
            
            // Data extraction
            extractSocialMedia: true,
            extractAmenities: true,
            extractVanTypes: true,
            extractPhones: true,
            extractEmails: true
        };
    }

    /**
     * Standard amenity keywords for detection
     */
    getAmenityKeywords() {
        return [
            'solar', 'plumbing', 'electrical', 'kitchen', 'bathroom', 'shower',
            'water tank', 'grey water', 'black water', 'inverter', 'battery',
            'refrigerator', 'fridge', 'sink', 'stove', 'cooktop', 'oven',
            'bed', 'seating', 'storage', 'cabinets', 'flooring', 'insulation',
            'ventilation', 'fan', 'heating', 'air conditioning', 'ac',
            'furnace', 'propane', 'diesel', 'composting toilet', 'cassette toilet',
            'awning', 'bike rack', 'roof rack', 'ladder', 'exterior shower',
            'generator', 'shore power', 'usb', 'outlets', '12v', '110v'
        ];
    }

    /**
     * Standard van type keywords for detection
     */
    getVanTypeKeywords() {
        return [
            'sprinter', 'transit', 'promaster', 'ram promaster', 'ford transit',
            'mercedes sprinter', 'chevrolet express', 'gmc savana', 'nissan nv200',
            'ford e-series', 'custom van', 'skoolie', 'school bus', 'box truck',
            'cargo van', 'passenger van', 'high roof', 'long wheelbase'
        ];
    }

    /**
     * Validate coordinates are within reasonable US bounds
     */
    validateCoordinates(lat, lng) {
        return lat >= 24 && lat <= 71 && lng >= -180 && lng <= -66;
    }

    /**
     * Format builder data for database insertion
     */
    formatBuilderData(builderData, state) {
        const stateConfig = this.getStateConfig(state);
        
        return {
            name: builderData.name || 'Unknown Builder',
            city: builderData.city || state,
            state: stateConfig.abbreviation,
            zip: builderData.zip || '',
            address: builderData.address || '',
            phone: builderData.phone || '',
            email: builderData.email || '',
            website: builderData.website || '',
            lat: builderData.coordinates?.lat || null,
            lng: builderData.coordinates?.lng || null,
            van_types: JSON.stringify(builderData.van_types || ['Custom Van']),
            amenities: JSON.stringify(builderData.amenities || ['Custom Build']),
            services: JSON.stringify(builderData.services || ['Custom Builds']),
            social_media: JSON.stringify(builderData.social_media || []),
            photos: JSON.stringify(builderData.photos || []),
            description: builderData.description || '',
            lead_time: builderData.lead_time || '',
            years_experience: builderData.years_experience || ''
        };
    }
}

// Export singleton instance
const scraperConfig = new ScraperConfig();

module.exports = {
    ScraperConfig,
    scraperConfig
}; 