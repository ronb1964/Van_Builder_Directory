const Database = require('better-sqlite3');
const { chromium } = require('playwright');
const path = require('path');

class CaliforniaCoordinateFixer {
    constructor() {
        this.db = null;
        this.browser = null;
        this.context = null;
        this.updatedBuilders = [];
    }

    async initialize() {
        console.log('🚀 Initializing California Coordinate Fixer...');
        
        // Connect to database
        const dbPath = path.join(__dirname, 'builders.db');
        this.db = new Database(dbPath);
        console.log('✅ Database connected');
        
        // Initialize browser for geocoding
        this.browser = await chromium.launch({ 
            headless: true,
            timeout: 60000 
        });
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        console.log('✅ Browser initialized');
    }

    // Enhanced geocoding using OpenStreetMap Nominatim
    async geocodeAddress(address) {
        console.log(`   🌍 Geocoding: ${address}`);
        
        try {
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', California, USA')}&limit=1`;
            
            const page = await this.context.newPage();
            const response = await page.goto(nominatimUrl);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                
                console.log(`   ✅ Geocoded: ${lat}, ${lng}`);
                await page.close();
                
                return {
                    lat: lat,
                    lng: lng,
                    accuracy: 'high',
                    source: 'nominatim'
                };
            }
            
            await page.close();
        } catch (error) {
            console.log(`   ⚠️ Geocoding failed: ${error.message}`);
        }

        return this.estimateCaliforniaCoordinates(address);
    }

    // California city coordinate fallbacks
    estimateCaliforniaCoordinates(address) {
        console.log(`   📍 Estimating California coordinates for: ${address}`);
        
        const californiaCities = {
            'los angeles': { lat: 34.0522, lng: -118.2437 },
            'san diego': { lat: 32.7157, lng: -117.1611 },
            'san francisco': { lat: 37.7749, lng: -122.4194 },
            'san jose': { lat: 37.3382, lng: -121.8863 },
            'fresno': { lat: 36.7378, lng: -119.7871 },
            'sacramento': { lat: 38.5816, lng: -121.4944 },
            'long beach': { lat: 33.7701, lng: -118.1937 },
            'oakland': { lat: 37.8044, lng: -122.2712 },
            'bakersfield': { lat: 35.3733, lng: -119.0187 },
            'anaheim': { lat: 33.8366, lng: -117.9143 },
            'santa ana': { lat: 33.7455, lng: -117.8677 },
            'riverside': { lat: 33.9533, lng: -117.3962 },
            'stockton': { lat: 37.9577, lng: -121.2908 },
            'irvine': { lat: 33.6846, lng: -117.8265 },
            'chula vista': { lat: 32.6401, lng: -117.0842 },
            'fremont': { lat: 37.5485, lng: -121.9886 },
            'san bernardino': { lat: 34.1083, lng: -117.2898 },
            'modesto': { lat: 37.6391, lng: -120.9969 },
            'fontana': { lat: 34.0922, lng: -117.435 },
            'oxnard': { lat: 34.1975, lng: -119.1771 },
            'moreno valley': { lat: 33.9425, lng: -117.2297 },
            'huntington beach': { lat: 33.6603, lng: -117.9992 },
            'glendale': { lat: 34.1425, lng: -118.2551 },
            'santa clarita': { lat: 34.3917, lng: -118.5426 },
            'garden grove': { lat: 33.7739, lng: -117.9415 },
            'oceanside': { lat: 33.1959, lng: -117.3795 },
            'rancho cucamonga': { lat: 34.1064, lng: -117.5931 },
            'santa rosa': { lat: 38.4404, lng: -122.7144 },
            'ontario': { lat: 34.0633, lng: -117.6509 },
            'lancaster': { lat: 34.6868, lng: -118.1542 },
            'elk grove': { lat: 38.4088, lng: -121.3716 },
            'corona': { lat: 33.8753, lng: -117.5664 },
            'palmdale': { lat: 34.5794, lng: -118.1165 },
            'salinas': { lat: 36.6777, lng: -121.6555 },
            'pomona': { lat: 34.055, lng: -117.7499 },
            'hayward': { lat: 37.6688, lng: -122.0808 },
            'escondido': { lat: 33.1192, lng: -117.0864 },
            'torrance': { lat: 33.8358, lng: -118.3406 },
            'sunnyvale': { lat: 37.3688, lng: -122.0363 },
            'orange': { lat: 33.7879, lng: -117.8531 },
            'fullerton': { lat: 33.8704, lng: -117.9242 },
            'pasadena': { lat: 34.1478, lng: -118.1445 },
            'thousand oaks': { lat: 34.1706, lng: -118.8376 },
            'visalia': { lat: 36.3302, lng: -119.2921 },
            'simi valley': { lat: 34.2694, lng: -118.7815 },
            'concord': { lat: 37.978, lng: -122.0311 },
            'roseville': { lat: 38.7521, lng: -121.2880 },
            'santa clara': { lat: 37.3541, lng: -121.9552 },
            'vallejo': { lat: 38.1041, lng: -122.2566 },
            'berkeley': { lat: 37.8715, lng: -122.2730 },
            'el monte': { lat: 34.0686, lng: -118.0275 },
            'downey': { lat: 33.9401, lng: -118.1326 },
            'costa mesa': { lat: 33.6411, lng: -117.9187 },
            'inglewood': { lat: 33.9617, lng: -118.3531 },
            'carlsbad': { lat: 33.1581, lng: -117.3506 },
            'san buenaventura': { lat: 34.2746, lng: -119.2290 },
            'fairfield': { lat: 38.2494, lng: -122.0399 },
            'west covina': { lat: 34.0686, lng: -117.9390 },
            'murrieta': { lat: 33.5539, lng: -117.2139 },
            'richmond': { lat: 37.9358, lng: -122.3477 },
            'norwalk': { lat: 33.9022, lng: -118.0817 },
            'antioch': { lat: 37.9785, lng: -121.8058 },
            'temecula': { lat: 33.4936, lng: -117.1484 },
            'daly city': { lat: 37.7059, lng: -122.4622 },
            'santa maria': { lat: 34.9530, lng: -120.4357 },
            'el cajon': { lat: 32.7948, lng: -116.9625 },
            'san mateo': { lat: 37.5630, lng: -122.3255 },
            'rialto': { lat: 34.1064, lng: -117.3703 },
            'clovis': { lat: 36.8252, lng: -119.7029 },
            'compton': { lat: 33.8958, lng: -118.2201 },
            'south gate': { lat: 33.9548, lng: -118.2120 },
            'mission viejo': { lat: 33.6000, lng: -117.6720 },
            'carson': { lat: 33.8317, lng: -118.2820 },
            'santa monica': { lat: 34.0195, lng: -118.4912 },
            'redding': { lat: 40.5865, lng: -122.3917 },
            'santa barbara': { lat: 34.4208, lng: -119.6982 },
            'chico': { lat: 39.7285, lng: -121.8375 },
            'newport beach': { lat: 33.6189, lng: -117.9298 },
            'san leandro': { lat: 37.7249, lng: -122.1561 },
            'whittier': { lat: 33.9792, lng: -118.0328 },
            'hawthorne': { lat: 33.9164, lng: -118.3526 },
            'citrus heights': { lat: 38.7071, lng: -121.2810 },
            'alhambra': { lat: 34.0953, lng: -118.1270 },
            'tracy': { lat: 37.7397, lng: -121.4252 },
            'livermore': { lat: 37.6819, lng: -121.7680 },
            'buena park': { lat: 33.8675, lng: -117.9981 },
            'lakewood': { lat: 33.8536, lng: -118.1339 },
            'merced': { lat: 37.3022, lng: -120.4829 },
            'hemet': { lat: 33.7475, lng: -116.9720 },
            'chino': { lat: 34.0122, lng: -117.6889 },
            'menifee': { lat: 33.6972, lng: -117.1859 },
            'redwood city': { lat: 37.4852, lng: -122.2364 },
            'perris': { lat: 33.7825, lng: -117.2286 },
            'nampa': { lat: 43.5407, lng: -116.5635 },
            'bellflower': { lat: 33.8817, lng: -118.1170 },
            'westminster': { lat: 33.7591, lng: -117.9939 },
            'indio': { lat: 33.7206, lng: -116.2156 },
            'turlock': { lat: 37.4947, lng: -120.8466 },
            'yorba linda': { lat: 33.8886, lng: -117.8131 },
            'folsom': { lat: 38.6780, lng: -121.1760 },
            'pleasant hill': { lat: 37.9480, lng: -122.0608 },
            'san ramon': { lat: 37.7799, lng: -121.9780 },
            'placentia': { lat: 33.8722, lng: -117.8703 },
            'hanford': { lat: 36.3274, lng: -119.6457 },
            'yuba city': { lat: 39.1404, lng: -121.6169 },
            'glendora': { lat: 34.1361, lng: -117.8653 },
            'union city': { lat: 37.5934, lng: -122.0439 },
            'woodland': { lat: 38.6785, lng: -121.7733 },
            'los alamitos': { lat: 33.8031, lng: -118.0714 },
            'gardena': { lat: 33.8883, lng: -118.309 },
            'santa cruz': { lat: 36.9741, lng: -122.0308 },
            'san luis obispo': { lat: 35.2828, lng: -120.6596 },
            'vista': { lat: 33.2, lng: -117.2425 },
            'watsonville': { lat: 36.9107, lng: -121.7649 },
            'big bear city': { lat: 34.2606, lng: -116.8453 }
        };

        const addressLower = address.toLowerCase();
        
        for (const [city, coords] of Object.entries(californiaCities)) {
            if (addressLower.includes(city)) {
                console.log(`   📍 Found ${city} coordinates: ${coords.lat}, ${coords.lng}`);
                return {
                    lat: coords.lat,
                    lng: coords.lng,
                    accuracy: 'city-level',
                    source: 'california-specific'
                };
            }
        }

        // Default to Los Angeles if no city match
        console.log(`   📍 Using Los Angeles default coordinates`);
        return {
            lat: 34.0522,
            lng: -118.2437,
            accuracy: 'default',
            source: 'california-fallback'
        };
    }

    async getCaliforniaBuilders() {
        const query = `SELECT id, name, address, city, state, lat, lng FROM builders WHERE state = 'CA'`;
        return this.db.prepare(query).all();
    }

    async updateBuilderCoordinates(builderId, coordinates) {
        const updateQuery = `UPDATE builders SET lat = ?, lng = ? WHERE id = ?`;
        this.db.prepare(updateQuery).run(coordinates.lat, coordinates.lng, builderId);
    }

    // Clean and improve address format
    cleanAddress(address, city) {
        if (!address || address.includes('0 0 For Sale') || address.includes('2025 My Cust') || address.includes('2021 by revampcust')) {
            return `${city}, CA`;
        }
        
        // If address already includes city and state, use as is
        if (address.includes(city) && address.includes('CA')) {
            return address;
        }
        
        // Add city and state if missing
        if (!address.includes('CA')) {
            return `${address}, ${city}, CA`;
        }
        
        return address;
    }

    async fixCaliforniaCoordinates() {
        console.log('🏗️ Starting California coordinate fix...');
        
        const builders = await this.getCaliforniaBuilders();
        console.log(`📊 Found ${builders.length} California builders to process`);
        
        for (let i = 0; i < builders.length; i++) {
            const builder = builders[i];
            console.log(`\n🔄 Processing ${i + 1}/${builders.length}: ${builder.name}`);
            
            // Clean the address
            const cleanedAddress = this.cleanAddress(builder.address, builder.city);
            console.log(`   🏠 Address: ${cleanedAddress}`);
            console.log(`   📍 Current: ${builder.lat}, ${builder.lng}`);
            
            // Geocode the address
            const newCoordinates = await this.geocodeAddress(cleanedAddress);
            
            // Update if we got new coordinates
            if (newCoordinates && (newCoordinates.lat !== builder.lat || newCoordinates.lng !== builder.lng)) {
                await this.updateBuilderCoordinates(builder.id, newCoordinates);
                
                this.updatedBuilders.push({
                    name: builder.name,
                    oldCoords: { lat: builder.lat, lng: builder.lng },
                    newCoords: { lat: newCoordinates.lat, lng: newCoordinates.lng },
                    accuracy: newCoordinates.accuracy,
                    address: cleanedAddress
                });
                
                console.log(`   ✅ Updated: ${newCoordinates.lat}, ${newCoordinates.lng} (${newCoordinates.accuracy})`);
            } else {
                console.log(`   ⚪ No change needed`);
            }
            
            // Be respectful to geocoding service
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async generateReport() {
        console.log(`\n📊 CALIFORNIA COORDINATE UPDATE REPORT`);
        console.log(`======================================`);
        console.log(`🎯 Total builders updated: ${this.updatedBuilders.length}`);
        
        const highAccuracy = this.updatedBuilders.filter(b => b.accuracy === 'high');
        const cityLevel = this.updatedBuilders.filter(b => b.accuracy === 'city-level');
        
        console.log(`🔥 High accuracy (street-level): ${highAccuracy.length}`);
        console.log(`🏙️ City-level accuracy: ${cityLevel.length}`);
        
        console.log(`\n📋 UPDATED BUILDERS:`);
        this.updatedBuilders.forEach((builder, i) => {
            console.log(`${i + 1}. ${builder.name}`);
            console.log(`   Address: ${builder.address}`);
            console.log(`   Old: ${builder.oldCoords.lat}, ${builder.oldCoords.lng}`);
            console.log(`   New: ${builder.newCoords.lat}, ${builder.newCoords.lng} (${builder.accuracy})`);
            console.log('');
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Browser closed');
        }
        if (this.db) {
            this.db.close();
            console.log('🔒 Database closed');
        }
    }
}

async function main() {
    console.log('🚀 Starting California Coordinate Fixer');
    console.log('📋 This will geocode all CA builders for precise map coordinates');
    
    const fixer = new CaliforniaCoordinateFixer();
    
    try {
        await fixer.initialize();
        await fixer.fixCaliforniaCoordinates();
        await fixer.generateReport();
        
        console.log('\n🎉 California coordinate fixing completed!');
        
    } catch (error) {
        console.error('❌ Coordinate fixing failed:', error);
    } finally {
        await fixer.close();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CaliforniaCoordinateFixer }; 