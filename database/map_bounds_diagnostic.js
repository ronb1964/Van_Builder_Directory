#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'builders.db');

/**
 * Map Bounds Diagnostic Tool
 * Analyzes all builders to identify potential map visibility issues
 * and provides recommendations for optimal map bounds
 */
class MapBoundsDiagnostic {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }

  async analyzeAllBuilders() {
    console.log('🗺️ MAP BOUNDS DIAGNOSTIC TOOL');
    console.log('=' .repeat(50));
    
    try {
      const builders = await this.getAllBuilders();
      
      if (builders.length === 0) {
        console.log('❌ No builders found in database');
        return;
      }

      console.log(`📊 Analyzing ${builders.length} builders across all states\n`);
      
      // Overall bounds analysis
      this.analyzeOverallBounds(builders);
      
      // State-by-state analysis
      this.analyzeByState(builders);
      
      // Identify potential issues
      this.identifyPotentialIssues(builders);
      
      // Provide recommendations
      this.provideRecommendations(builders);
      
    } catch (error) {
      console.error('❌ Error during analysis:', error);
    } finally {
      this.db.close();
    }
  }

  getAllBuilders() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          name, 
          address, 
          city, 
          state, 
          lat, 
          lng,
          CASE 
            WHEN lat IS NULL OR lng IS NULL THEN 'Missing Coordinates'
            WHEN lat = 0 AND lng = 0 THEN 'Zero Coordinates'
            ELSE 'Valid Coordinates'
          END as coord_status
        FROM builders 
        ORDER BY state, city, name
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  analyzeOverallBounds(builders) {
    console.log('🌍 OVERALL BOUNDS ANALYSIS');
    console.log('-'.repeat(30));
    
    const validBuilders = builders.filter(b => 
      b.lat && b.lng && 
      b.lat !== 0 && b.lng !== 0
    );
    
    if (validBuilders.length === 0) {
      console.log('❌ No builders with valid coordinates found');
      return;
    }

    const lats = validBuilders.map(b => b.lat);
    const lngs = validBuilders.map(b => b.lng);
    
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };
    
    const latSpread = bounds.north - bounds.south;
    const lngSpread = bounds.east - bounds.west;
    
    console.log(`📍 Total builders with coordinates: ${validBuilders.length}`);
    console.log(`📍 Builders missing coordinates: ${builders.length - validBuilders.length}`);
    console.log(`\n🗺️ Geographic Bounds:`);
    console.log(`   North: ${bounds.north.toFixed(6)}° (${this.findBuilderAtCoordinate(validBuilders, bounds.north, 'lat')})`);
    console.log(`   South: ${bounds.south.toFixed(6)}° (${this.findBuilderAtCoordinate(validBuilders, bounds.south, 'lat')})`);
    console.log(`   East:  ${bounds.east.toFixed(6)}° (${this.findBuilderAtCoordinate(validBuilders, bounds.east, 'lng')})`);
    console.log(`   West:  ${bounds.west.toFixed(6)}° (${this.findBuilderAtCoordinate(validBuilders, bounds.west, 'lng')})`);
    console.log(`\n📏 Geographic Spread:`);
    console.log(`   Latitude:  ${latSpread.toFixed(2)}° (${this.degreesToMiles(latSpread)} miles)`);
    console.log(`   Longitude: ${lngSpread.toFixed(2)}° (${this.degreesToMiles(lngSpread)} miles)`);
    
    // Recommended zoom levels
    const maxSpread = Math.max(latSpread, lngSpread);
    let recommendedZoom = 'Unknown';
    
    if (maxSpread > 15) recommendedZoom = '3-4 (Continental)';
    else if (maxSpread > 8) recommendedZoom = '4-5 (Multi-State)';
    else if (maxSpread > 4) recommendedZoom = '5-6 (Regional)';
    else if (maxSpread > 2) recommendedZoom = '6-7 (State-wide)';
    else if (maxSpread > 1) recommendedZoom = '7-8 (Multi-City)';
    else if (maxSpread > 0.5) recommendedZoom = '8-10 (City Region)';
    else recommendedZoom = '10+ (Local)';
    
    console.log(`\n🎯 Recommended Zoom Level: ${recommendedZoom}`);
    console.log(`\n`);
  }

  analyzeByState(builders) {
    console.log('🏛️ STATE-BY-STATE ANALYSIS');
    console.log('-'.repeat(30));
    
    const stateGroups = {};
    
    builders.forEach(builder => {
      const state = builder.state || 'Unknown';
      if (!stateGroups[state]) {
        stateGroups[state] = [];
      }
      stateGroups[state].push(builder);
    });
    
    Object.keys(stateGroups).sort().forEach(state => {
      const stateBuilders = stateGroups[state];
      const validBuilders = stateBuilders.filter(b => 
        b.lat && b.lng && 
        b.lat !== 0 && b.lng !== 0
      );
      
      console.log(`\n📍 ${state}: ${stateBuilders.length} builders (${validBuilders.length} with coordinates)`);
      
      if (validBuilders.length === 0) {
        console.log('   ❌ No valid coordinates - map will not display properly');
        return;
      }
      
      if (validBuilders.length === 1) {
        const builder = validBuilders[0];
        console.log(`   🎯 Single builder: ${builder.name} at ${builder.lat.toFixed(6)}, ${builder.lng.toFixed(6)}`);
        console.log(`   📍 Location: ${builder.city}, ${builder.state}`);
        return;
      }
      
      // Multiple builders - analyze spread
      const lats = validBuilders.map(b => b.lat);
      const lngs = validBuilders.map(b => b.lng);
      
      const bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs)
      };
      
      const latSpread = bounds.north - bounds.south;
      const lngSpread = bounds.east - bounds.west;
      const maxSpread = Math.max(latSpread, lngSpread);
      
      console.log(`   📏 Geographic spread: ${maxSpread.toFixed(2)}° (${this.degreesToMiles(maxSpread)} miles)`);
      console.log(`   🗺️ Bounds: ${bounds.south.toFixed(3)}° to ${bounds.north.toFixed(3)}° lat, ${bounds.west.toFixed(3)}° to ${bounds.east.toFixed(3)}° lng`);
      
      // Find outliers
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      
      validBuilders.forEach(builder => {
        const distanceFromCenter = Math.sqrt(
          Math.pow(builder.lat - centerLat, 2) + 
          Math.pow(builder.lng - centerLng, 2)
        );
        
        if (distanceFromCenter > maxSpread * 0.4) {
          console.log(`   ⚠️  Outlier: ${builder.name} (${builder.city}) - ${distanceFromCenter.toFixed(3)}° from center`);
        }
      });
    });
    
    console.log('\n');
  }

  identifyPotentialIssues(builders) {
    console.log('⚠️ POTENTIAL MAP ISSUES');
    console.log('-'.repeat(30));
    
    const issues = [];
    
    // Check for missing coordinates
    const missingCoords = builders.filter(b => !b.lat || !b.lng || b.lat === 0 || b.lng === 0);
    if (missingCoords.length > 0) {
      issues.push(`${missingCoords.length} builders missing coordinates`);
      console.log(`❌ Missing Coordinates (${missingCoords.length} builders):`);
      missingCoords.forEach(builder => {
        console.log(`   • ${builder.name} (${builder.city}, ${builder.state}) - Status: ${builder.coord_status}`);
      });
    }
    
    // Check for extreme outliers
    const validBuilders = builders.filter(b => b.lat && b.lng && b.lat !== 0 && b.lng !== 0);
    if (validBuilders.length > 1) {
      const lats = validBuilders.map(b => b.lat);
      const lngs = validBuilders.map(b => b.lng);
      
      const bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs)
      };
      
      const latSpread = bounds.north - bounds.south;
      const lngSpread = bounds.east - bounds.west;
      
      // Check for extreme spreads that might cause zoom issues
      if (latSpread > 10 || lngSpread > 15) {
        issues.push('Extreme geographic spread may cause zoom issues');
        console.log(`⚠️ Extreme Geographic Spread:`);
        console.log(`   Latitude spread: ${latSpread.toFixed(2)}° (${this.degreesToMiles(latSpread)} miles)`);
        console.log(`   Longitude spread: ${lngSpread.toFixed(2)}° (${this.degreesToMiles(lngSpread)} miles)`);
        console.log(`   This may cause fitBounds() to zoom out too far`);
      }
      
      // Check for builders that might be outside typical bounds
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      const maxSpread = Math.max(latSpread, lngSpread);
      
      const outliers = validBuilders.filter(builder => {
        const distanceFromCenter = Math.sqrt(
          Math.pow(builder.lat - centerLat, 2) + 
          Math.pow(builder.lng - centerLng, 2)
        );
        return distanceFromCenter > maxSpread * 0.6;
      });
      
      if (outliers.length > 0) {
        issues.push(`${outliers.length} potential outliers detected`);
        console.log(`\n🎯 Potential Outliers (${outliers.length} builders):`);
        outliers.forEach(builder => {
          const distanceFromCenter = Math.sqrt(
            Math.pow(builder.lat - centerLat, 2) + 
            Math.pow(builder.lng - centerLng, 2)
          );
          console.log(`   • ${builder.name} (${builder.city}, ${builder.state})`);
          console.log(`     Coordinates: ${builder.lat.toFixed(6)}, ${builder.lng.toFixed(6)}`);
          console.log(`     Distance from center: ${distanceFromCenter.toFixed(3)}°`);
        });
      }
    }
    
    if (issues.length === 0) {
      console.log('✅ No major issues detected');
    }
    
    console.log('\n');
  }

  provideRecommendations(builders) {
    console.log('💡 RECOMMENDATIONS');
    console.log('-'.repeat(30));
    
    const validBuilders = builders.filter(b => b.lat && b.lng && b.lat !== 0 && b.lng !== 0);
    
    console.log('1. 🗺️ Map Bounds Strategy:');
    console.log('   • Always use fitBounds() for multiple builders');
    console.log('   • Add consistent padding: { top: 80, right: 80, bottom: 80, left: 80 }');
    console.log('   • Set appropriate zoom limits based on geographic spread');
    
    console.log('\n2. 🎯 Coordinate Quality:');
    const missingCoords = builders.filter(b => !b.lat || !b.lng || b.lat === 0 || b.lng === 0);
    if (missingCoords.length > 0) {
      console.log(`   ❌ Fix ${missingCoords.length} builders with missing coordinates`);
      console.log('   • Run geocoding script to get precise coordinates');
      console.log('   • Verify addresses are complete and accurate');
    } else {
      console.log('   ✅ All builders have coordinates');
    }
    
    console.log('\n3. 📏 Geographic Spread Management:');
    if (validBuilders.length > 1) {
      const lats = validBuilders.map(b => b.lat);
      const lngs = validBuilders.map(b => b.lng);
      const latSpread = Math.max(...lats) - Math.min(...lats);
      const lngSpread = Math.max(...lngs) - Math.min(...lngs);
      const maxSpread = Math.max(latSpread, lngSpread);
      
      if (maxSpread > 10) {
        console.log('   ⚠️ Consider separate regional maps for extreme spreads');
        console.log('   • Implement clustering for distant builders');
        console.log('   • Use different zoom strategies per region');
      } else {
        console.log('   ✅ Geographic spread is manageable');
      }
    }
    
    console.log('\n4. 🔍 Testing Strategy:');
    console.log('   • Test map bounds after adding each new state');
    console.log('   • Verify all builders are visible in map view');
    console.log('   • Check both single-state and multi-state views');
    console.log('   • Test on different screen sizes');
    
    console.log('\n5. 🚀 Future-Proofing:');
    console.log('   • Run this diagnostic after each batch of new builders');
    console.log('   • Monitor for geographic outliers');
    console.log('   • Consider dynamic zoom limits based on data');
    console.log('   • Implement bounds validation in scraper pipeline');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Diagnostic complete! Use these insights to optimize map display.');
  }

  findBuilderAtCoordinate(builders, coordinate, type) {
    const builder = builders.find(b => 
      type === 'lat' ? Math.abs(b.lat - coordinate) < 0.000001 : 
      Math.abs(b.lng - coordinate) < 0.000001
    );
    return builder ? `${builder.name}, ${builder.city}, ${builder.state}` : 'Unknown';
  }

  degreesToMiles(degrees) {
    // Rough conversion: 1 degree ≈ 69 miles
    return Math.round(degrees * 69);
  }
}

// Run the diagnostic
if (require.main === module) {
  const diagnostic = new MapBoundsDiagnostic();
  diagnostic.analyzeAllBuilders().catch(console.error);
}

module.exports = MapBoundsDiagnostic; 