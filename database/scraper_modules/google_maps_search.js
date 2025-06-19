const fs = require('fs');
const path = require('path');

/**
 * Enhanced search using Google Maps for accurate, verified van builders
 */
class GoogleMapsVanBuilderSearch {
    constructor() {
        this.searchQueries = [
            'van conversion',
            'custom van builders',
            'camper van conversion',
            'sprinter van conversion',
            'van life builders',
            'RV conversion'
        ];
    }

    /**
     * Search for van builders in a specific state using Google Maps
     */
    async searchStateBuilders(state, mcp) {
        console.log(`\n🗺️ Using Google Maps to find VERIFIED builders in ${state}...`);
        
        const allBuilders = [];
        const seenPlaceIds = new Set();
        
        // Get major cities in the state for targeted searches
        const cities = this.getMajorCities(state);
        
        for (const city of cities) {
            console.log(`\n📍 Searching ${city}, ${state}...`);
            
            for (const query of this.searchQueries) {
                try {
                    const searchQuery = `${query} near ${city}, ${state}`;
                    console.log(`   🔍 Query: "${searchQuery}"`);
                    
                    // Use MCP Google Maps search
                    const results = await mcp.maps_search_places({
                        query: searchQuery,
                        location: await this.getCityCoordinates(city, state, mcp),
                        radius: 50000 // 50km radius
                    });
                    
                    if (results && results.results) {
                        for (const place of results.results) {
                            // Skip if we've already seen this place
                            if (seenPlaceIds.has(place.place_id)) continue;
                            seenPlaceIds.add(place.place_id);
                            
                            // Get detailed information about the place
                            const details = await mcp.maps_place_details({
                                place_id: place.place_id
                            });
                            
                            if (details && details.result) {
                                const builder = await this.processGooglePlace(details.result, state);
                                if (builder) {
                                    allBuilders.push(builder);
                                    console.log(`      ✅ Found: ${builder.name} in ${builder.city}`);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`   ❌ Error searching: ${error.message}`);
                }
                
                // Small delay between searches
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log(`\n✅ Found ${allBuilders.length} verified builders in ${state}`);
        return allBuilders;
    }

    /**
     * Get coordinates for a city
     */
    async getCityCoordinates(city, state, mcp) {
        try {
            const result = await mcp.maps_geocode({
                address: `${city}, ${state}, USA`
            });
            
            if (result && result.results && result.results[0]) {
                return result.results[0].geometry.location;
            }
        } catch (error) {
            console.error(`Error geocoding ${city}, ${state}: ${error.message}`);
        }
        
        return null;
    }

    /**
     * Process a Google Place into our builder format
     */
    async processGooglePlace(place, targetState) {
        // Verify it's actually in the target state
        const addressComponents = place.address_components || [];
        const stateComponent = addressComponents.find(comp => 
            comp.types.includes('administrative_area_level_1')
        );
        
        if (!stateComponent || stateComponent.short_name !== this.getStateAbbreviation(targetState)) {
            return null; // Not in target state
        }
        
        // Check if it's actually a van conversion business
        if (!this.isVanConversionBusiness(place)) {
            return null;
        }
        
        // Extract city
        const cityComponent = addressComponents.find(comp => 
            comp.types.includes('locality') || comp.types.includes('sublocality')
        );
        const city = cityComponent ? cityComponent.long_name : targetState;
        
        // Build our data structure
        return {
            name: place.name,
            city: city,
            state: targetState,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            address: place.formatted_address,
            phone: place.formatted_phone_number || place.international_phone_number || '',
            website: place.website || '',
            rating: place.rating || null,
            reviews_count: place.user_ratings_total || 0,
            business_hours: this.formatBusinessHours(place.opening_hours),
            google_place_id: place.place_id,
            types: place.types || [],
            photos: this.extractPhotos(place.photos),
            verified: true // Google Maps data is verified
        };
    }

    /**
     * Check if a place is likely a van conversion business
     */
    isVanConversionBusiness(place) {
        const name = (place.name || '').toLowerCase();
        const types = place.types || [];
        
        // Check business types
        const relevantTypes = ['car_repair', 'rv_dealer', 'car_dealer', 'store'];
        if (!types.some(type => relevantTypes.includes(type))) {
            return false;
        }
        
        // Check name for van-related keywords
        const keywords = [
            'van', 'conversion', 'camper', 'rv', 'sprinter', 
            'transit', 'promaster', 'overland', 'adventure',
            'custom', 'build', 'upfit'
        ];
        
        return keywords.some(keyword => name.includes(keyword));
    }

    /**
     * Format business hours for database
     */
    formatBusinessHours(openingHours) {
        if (!openingHours || !openingHours.weekday_text) {
            return {};
        }
        
        const hours = {};
        openingHours.weekday_text.forEach(day => {
            const [dayName, ...timeParts] = day.split(': ');
            hours[dayName.toLowerCase()] = timeParts.join(': ');
        });
        
        return hours;
    }

    /**
     * Extract photo references
     */
    extractPhotos(photos) {
        if (!photos || photos.length === 0) return [];
        
        // Take up to 8 photos
        return photos.slice(0, 8).map(photo => ({
            reference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
            attributions: photo.html_attributions
        }));
    }

    /**
     * Get major cities for a state
     */
    getMajorCities(state) {
        const stateCities = {
            'Alabama': ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile'],
            'Alaska': ['Anchorage', 'Fairbanks', 'Juneau'],
            'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale', 'Flagstaff'],
            'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Newport'],
            'New Jersey': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton'],
            'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Oakland'],
            // Add more states as needed
        };
        
        return stateCities[state] || [state]; // Fallback to state name if cities not defined
    }

    /**
     * Get state abbreviation
     */
    getStateAbbreviation(state) {
        const abbreviations = {
            'Alabama': 'AL',
            'Alaska': 'AK',
            'Arizona': 'AZ',
            'Rhode Island': 'RI',
            'New Jersey': 'NJ',
            'California': 'CA',
            // Add more as needed
        };
        
        return abbreviations[state] || state;
    }

    /**
     * Save results to file
     */
    async saveResults(state, builders) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `google_maps_builders_${state.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.json`;
        const filepath = path.join(process.cwd(), filename);
        
        const data = {
            state,
            timestamp: new Date().toISOString(),
            source: 'Google Maps Places API',
            count: builders.length,
            builders
        };
        
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`\n💾 Results saved to: ${filename}`);
        
        return filepath;
    }
}

module.exports = GoogleMapsVanBuilderSearch;
