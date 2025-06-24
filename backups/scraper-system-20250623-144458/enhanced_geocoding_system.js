const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

class EnhancedGeocodingSystem {
    constructor() {
        this.services = [
            // Google Maps Geocoding API - Most accurate geocoding service
            {
                name: 'Google Maps Geocoding',
                url: (address) => `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyBX1Yk0NkpcZY7Qy7SYt2NC80b57FSjaA8`,
                parseResponse: (data) => data.results?.[0] ? {
                    lat: data.results[0].geometry.location.lat,
                    lng: data.results[0].geometry.location.lng,
                    accuracy: data.results[0].geometry.location_type === 'ROOFTOP' ? 0.95 : 0.8,
                    formatted_address: data.results[0].formatted_address
                } : null
            }
        ];
    }

    async geocodeAddress(fullAddress, businessName = '') {
        console.log(`🔍 Geocoding: ${fullAddress}${businessName ? ` (${businessName})` : ''}`);
        
        const results = [];
        
        // Try each geocoding service
        for (const service of this.services) {
            try {
                console.log(`   📡 Trying ${service.name}...`);
                
                const response = await axios.get(service.url(fullAddress), {
                    headers: service.headers || {},
                    timeout: 10000
                });
                
                const result = service.parseResponse(response.data);
                
                if (result) {
                    result.service = service.name;
                    results.push(result);
                    console.log(`   ✅ ${service.name}: ${result.lat}, ${result.lng} (accuracy: ${result.accuracy})`);
                } else {
                    console.log(`   ❌ ${service.name}: No results`);
                }
                
                // Small delay between requests to be respectful
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.log(`   ❌ ${service.name}: Error - ${error.message}`);
            }
        }
        
        // If we have results, choose the best one
        if (results.length > 0) {
            // Sort by accuracy (highest first)
            results.sort((a, b) => b.accuracy - a.accuracy);
            
            const bestResult = results[0];
            console.log(`   🎯 Best result: ${bestResult.service} (accuracy: ${bestResult.accuracy})`);
            
            // Validate coordinates are reasonable
            if (this.validateCoordinates(bestResult.lat, bestResult.lng)) {
                return {
                    lat: bestResult.lat,
                    lng: bestResult.lng,
                    accuracy: bestResult.accuracy,
                    service: bestResult.service,
                    alternatives: results.slice(1)
                };
            } else {
                console.log(`   ⚠️  Coordinates failed validation`);
            }
        }
        
        // If no good results, try fallback strategies
        return await this.fallbackGeocode(fullAddress, businessName);
    }
    
    async fallbackGeocode(fullAddress, businessName) {
        console.log(`   🔄 Trying fallback strategies...`);
        
        // Try just city, state with Google Maps
        const addressParts = fullAddress.split(',');
        if (addressParts.length >= 2) {
            const cityState = addressParts.slice(-2).join(',').trim();
            console.log(`   📍 Trying city/state: ${cityState}`);
            
            try {
                const response = await axios.get(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityState)}&key=AIzaSyBX1Yk0NkpcZY7Qy7SYt2NC80b57FSjaA8`,
                    { timeout: 10000 }
                );
                
                if (response.data.results?.[0]) {
                    return {
                        lat: response.data.results[0].geometry.location.lat,
                        lng: response.data.results[0].geometry.location.lng,
                        accuracy: 0.4, // Lower accuracy for city-level
                        service: 'Google Maps Geocoding (City Fallback)',
                        isApproximate: true,
                        formatted_address: response.data.results[0].formatted_address
                    };
                }
            } catch (error) {
                console.log(`   ❌ City fallback failed: ${error.message}`);
            }
        }
        
        return null;
    }
    
    validateCoordinates(lat, lng) {
        // Basic validation for US coordinates
        return lat >= 24 && lat <= 71 && lng >= -180 && lng <= -66;
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 3958.8; // Radius of Earth in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    async validateExistingBuilder(builderId) {
        console.log(`🔍 Validating existing builder coordinates...`);
        
        const db = new sqlite3.Database('../server/database/builders.db');
        
        return new Promise((resolve, reject) => {
            db.get(
                "SELECT id, name, address, city, state, lat, lng FROM builders WHERE id = ?",
                [builderId],
                async (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!row) {
                        reject(new Error('Builder not found'));
                        return;
                    }
                    
                    const fullAddress = `${row.address}, ${row.city}, ${row.state}`;
                    const currentCoords = { lat: row.lat, lng: row.lng };
                    
                    console.log(`📍 Current coordinates: ${currentCoords.lat}, ${currentCoords.lng}`);
                    
                    // Get fresh geocoding
                    const freshCoords = await this.geocodeAddress(fullAddress, row.name);
                    
                    if (freshCoords) {
                        const distance = this.calculateDistance(
                            currentCoords.lat, currentCoords.lng,
                            freshCoords.lat, freshCoords.lng
                        );
                        
                        console.log(`📏 Distance difference: ${distance.toFixed(3)} miles`);
                        
                        const recommendation = {
                            builder: row.name,
                            currentCoords,
                            suggestedCoords: freshCoords,
                            distance: distance,
                            shouldUpdate: distance > 0.1, // More than 0.1 miles difference
                            accuracy: freshCoords.accuracy
                        };
                        
                        if (recommendation.shouldUpdate) {
                            console.log(`⚠️  Recommendation: UPDATE coordinates (${distance.toFixed(3)} miles off)`);
                        } else {
                            console.log(`✅ Current coordinates are accurate`);
                        }
                        
                        resolve(recommendation);
                    } else {
                        resolve({
                            builder: row.name,
                            currentCoords,
                            error: 'Could not geocode address',
                            shouldUpdate: false
                        });
                    }
                    
                    db.close();
                }
            );
        });
    }
}

// Manual coordinate verification system
class ManualCoordinateVerifier {
    constructor() {
        this.verificationLog = [];
    }
    
    async promptForManualVerification(builderName, address, suggestedCoords) {
        console.log('\n🔍 MANUAL VERIFICATION NEEDED');
        console.log('============================');
        console.log(`Builder: ${builderName}`);
        console.log(`Address: ${address}`);
        console.log(`Suggested coordinates: ${suggestedCoords.lat}, ${suggestedCoords.lng}`);
        console.log(`Accuracy: ${suggestedCoords.accuracy} (from ${suggestedCoords.service})`);
        console.log('');
        console.log('Please verify these coordinates by:');
        console.log('1. Searching the address on Google Maps');
        console.log('2. Right-clicking on the exact business location');
        console.log('3. Copying the coordinates from the context menu');
        console.log('4. Comparing with the suggested coordinates above');
        console.log('');
        console.log('If coordinates are significantly different (>0.1 miles), use Google Maps coordinates.');
        
        return {
            needsManualCheck: true,
            suggestedCoords,
            instructions: 'Verify with Google Maps and update if needed'
        };
    }
    
    logVerification(builderName, originalCoords, finalCoords, source) {
        this.verificationLog.push({
            timestamp: new Date().toISOString(),
            builder: builderName,
            originalCoords,
            finalCoords,
            source,
            accuracy: source === 'Google Maps' ? 0.95 : 0.7
        });
    }
}

// Usage example and testing
async function testEnhancedGeocoding() {
    const geocoder = new EnhancedGeocodingSystem();
    const verifier = new ManualCoordinateVerifier();
    
    // Test cases
    const testAddresses = [
        { name: 'Adventure Bumss', address: '11905 Dry Creek Road, Auburn, CA 95602' },
        { name: 'Test Builder', address: '123 Main Street, Sacramento, CA 95814' }
    ];
    
    for (const test of testAddresses) {
        console.log(`\n🧪 Testing: ${test.name}`);
        console.log('='.repeat(50));
        
        const result = await geocoder.geocodeAddress(test.address, test.name);
        
        if (result) {
            if (result.accuracy < 0.8) {
                await verifier.promptForManualVerification(test.name, test.address, result);
            }
        } else {
            console.log('❌ Geocoding failed completely');
        }
    }
}

module.exports = {
    EnhancedGeocodingSystem,
    ManualCoordinateVerifier,
    testEnhancedGeocoding
};

// Run test if called directly
if (require.main === module) {
    testEnhancedGeocoding().catch(console.error);
} 