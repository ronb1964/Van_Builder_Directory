const sqlite3 = require('sqlite3').verbose();

function calculateDistance(lat1, lng1, lat2, lng2) {
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

// City center coordinates for validation
const cityCenters = {
    'CA': {
        'Los Angeles': { lat: 34.0522, lng: -118.2437 },
        'San Francisco': { lat: 37.7749, lng: -122.4194 },
        'San Diego': { lat: 32.7157, lng: -117.1611 },
        'Sacramento': { lat: 38.5816, lng: -121.4944 },
        'Auburn': { lat: 38.8966, lng: -121.0769 },
        'Fresno': { lat: 36.7378, lng: -119.7871 },
        'Oakland': { lat: 37.8044, lng: -122.2711 },
        'Santa Barbara': { lat: 34.4208, lng: -119.6982 },
        'Riverside': { lat: 33.9533, lng: -117.3961 },
        'Bakersfield': { lat: 35.3733, lng: -119.0187 }
    },
    'AL': {
        'Birmingham': { lat: 33.5186, lng: -86.8104 },
        'Montgomery': { lat: 32.3668, lng: -86.3000 },
        'Mobile': { lat: 30.6954, lng: -88.0399 },
        'Huntsville': { lat: 34.7304, lng: -86.5861 }
    },
    'AK': {
        'Anchorage': { lat: 61.2181, lng: -149.9003 },
        'Fairbanks': { lat: 64.8378, lng: -147.7164 },
        'Juneau': { lat: 58.3019, lng: -134.4197 }
    },
    'AZ': {
        'Phoenix': { lat: 33.4484, lng: -112.0740 },
        'Tucson': { lat: 32.2226, lng: -110.9747 },
        'Mesa': { lat: 33.4152, lng: -111.8315 },
        'Scottsdale': { lat: 33.4942, lng: -111.9261 }
    },
    'AR': {
        'Little Rock': { lat: 34.7465, lng: -92.2896 },
        'Fayetteville': { lat: 36.0625, lng: -94.1574 },
        'Fort Smith': { lat: 35.3859, lng: -94.3985 }
    }
};

async function validateAllCoordinates() {
    console.log('🔍 Validating All Builder Coordinates');
    console.log('=====================================');
    
    const db = new sqlite3.Database('./builders.db');
    
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT id, name, address, city, state, lat, lng FROM builders ORDER BY state, city, name",
            [],
            (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const issues = [];
                const summary = {};
                
                rows.forEach(builder => {
                    const state = builder.state;
                    const city = builder.city;
                    
                    if (!summary[state]) {
                        summary[state] = { total: 0, issues: 0, accurate: 0 };
                    }
                    summary[state].total++;
                    
                    let hasIssue = false;
                    const builderIssues = [];
                    
                    // Check 1: Coordinates exist
                    if (!builder.lat || !builder.lng) {
                        builderIssues.push('Missing coordinates');
                        hasIssue = true;
                    }
                    
                    // Check 2: Coordinates are in valid range
                    if (builder.lat < 24 || builder.lat > 71 || builder.lng < -180 || builder.lng > -66) {
                        builderIssues.push('Coordinates outside US bounds');
                        hasIssue = true;
                    }
                    
                    // Check 3: Distance from nearest major city
                    if (builder.lat && builder.lng && cityCenters[state]) {
                        let minDistance = Infinity;
                        let nearestCity = '';
                        
                        Object.entries(cityCenters[state]).forEach(([cityName, coords]) => {
                            const distance = calculateDistance(
                                builder.lat, builder.lng,
                                coords.lat, coords.lng
                            );
                            
                            if (distance < minDistance) {
                                minDistance = distance;
                                nearestCity = cityName;
                            }
                        });
                        
                        // Flag if more than 100 miles from any major city
                        if (minDistance > 100) {
                            builderIssues.push(`${minDistance.toFixed(1)} miles from nearest major city (${nearestCity})`);
                            hasIssue = true;
                        }
                        
                        // Flag if exact match to city center (likely placeholder)
                        if (minDistance < 0.1 && cityCenters[state][city]) {
                            const cityDistance = calculateDistance(
                                builder.lat, builder.lng,
                                cityCenters[state][city].lat, cityCenters[state][city].lng
                            );
                            
                            if (cityDistance < 0.01) {
                                builderIssues.push('Exact match to city center (likely placeholder)');
                                hasIssue = true;
                            }
                        }
                    }
                    
                    // Check 4: Duplicate coordinates
                    const duplicates = rows.filter(other => 
                        other.id !== builder.id && 
                        Math.abs(other.lat - builder.lat) < 0.0001 && 
                        Math.abs(other.lng - builder.lng) < 0.0001
                    );
                    
                    if (duplicates.length > 0) {
                        builderIssues.push(`Duplicate coordinates with: ${duplicates.map(d => d.name).join(', ')}`);
                        hasIssue = true;
                    }
                    
                    if (hasIssue) {
                        summary[state].issues++;
                        issues.push({
                            id: builder.id,
                            name: builder.name,
                            city: builder.city,
                            state: builder.state,
                            address: builder.address,
                            coordinates: `${builder.lat}, ${builder.lng}`,
                            issues: builderIssues
                        });
                    } else {
                        summary[state].accurate++;
                    }
                });
                
                // Print summary
                console.log('\n📊 Summary by State:');
                Object.entries(summary).forEach(([state, stats]) => {
                    const accuracyPercent = ((stats.accurate / stats.total) * 100).toFixed(1);
                    console.log(`   ${state}: ${stats.accurate}/${stats.total} accurate (${accuracyPercent}%) - ${stats.issues} issues`);
                });
                
                // Print issues
                if (issues.length > 0) {
                    console.log('\n⚠️  Builders with Coordinate Issues:');
                    console.log('=====================================');
                    
                    issues.forEach((issue, index) => {
                        console.log(`\n${index + 1}. ${issue.name} (${issue.city}, ${issue.state})`);
                        console.log(`   Address: ${issue.address}`);
                        console.log(`   Coordinates: ${issue.coordinates}`);
                        console.log(`   Issues:`);
                        issue.issues.forEach(problemDesc => {
                            console.log(`     - ${problemDesc}`);
                        });
                        console.log(`   🔧 Action: Search "${issue.name} ${issue.address}" on Google Maps for exact coordinates`);
                    });
                    
                    console.log('\n📋 Priority Fix List:');
                    console.log('====================');
                    
                    // Sort by severity
                    const highPriority = issues.filter(i => 
                        i.issues.some(issue => 
                            issue.includes('Missing coordinates') || 
                            issue.includes('outside US bounds') ||
                            issue.includes('miles from nearest major city')
                        )
                    );
                    
                    const mediumPriority = issues.filter(i => 
                        !highPriority.includes(i) && 
                        i.issues.some(issue => issue.includes('city center'))
                    );
                    
                    if (highPriority.length > 0) {
                        console.log('\n🚨 HIGH PRIORITY (Fix immediately):');
                        highPriority.forEach(issue => {
                            console.log(`   - ${issue.name} (${issue.city}, ${issue.state})`);
                        });
                    }
                    
                    if (mediumPriority.length > 0) {
                        console.log('\n⚠️  MEDIUM PRIORITY (Verify accuracy):');
                        mediumPriority.forEach(issue => {
                            console.log(`   - ${issue.name} (${issue.city}, ${issue.state})`);
                        });
                    }
                    
                } else {
                    console.log('\n✅ All coordinates look good!');
                }
                
                const totalBuilders = rows.length;
                const totalIssues = issues.length;
                const overallAccuracy = ((totalBuilders - totalIssues) / totalBuilders * 100).toFixed(1);
                
                console.log(`\n🎯 Overall Accuracy: ${totalBuilders - totalIssues}/${totalBuilders} (${overallAccuracy}%)`);
                
                if (totalIssues > 0) {
                    console.log('\n💡 Next Steps:');
                    console.log('1. Fix high-priority coordinate issues first');
                    console.log('2. Use Google Maps to get exact coordinates');
                    console.log('3. Update both databases (main + server)');
                    console.log('4. Re-run this validation script');
                    console.log('5. Target: 95%+ accuracy for production');
                }
                
                db.close();
                resolve({ issues, summary, overallAccuracy });
            }
        );
    });
}

// Run validation
if (require.main === module) {
    validateAllCoordinates().catch(console.error);
}

module.exports = { validateAllCoordinates }; 