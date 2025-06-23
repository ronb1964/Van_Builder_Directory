#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'builders.db');

/**
 * Map Bounds Validator
 * Validates new builders against existing map bounds to prevent visibility issues
 * Should be run after adding new builders to ensure map compatibility
 */
class MapBoundsValidator {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }

  async validateNewBuilders(newBuilderNames = []) {
    console.log('🔍 MAP BOUNDS VALIDATOR');
    console.log('=' .repeat(40));
    
    try {
      const allBuilders = await this.getAllBuilders();
      
      if (allBuilders.length === 0) {
        console.log('❌ No builders found in database');
        return { valid: false, issues: ['No builders in database'] };
      }

      // If specific builders provided, focus on them
      let targetBuilders = allBuilders;
      if (newBuilderNames.length > 0) {
        targetBuilders = allBuilders.filter(b => 
          newBuilderNames.some(name => 
            b.name.toLowerCase().includes(name.toLowerCase())
          )
        );
        console.log(`🎯 Validating ${targetBuilders.length} specified builders`);
      } else {
        console.log(`📊 Validating all ${allBuilders.length} builders`);
      }

      const validation = this.performValidation(allBuilders, targetBuilders);
      this.reportResults(validation);
      
      return validation;
      
    } catch (error) {
      console.error('❌ Validation error:', error);
      return { valid: false, issues: [error.message] };
    } finally {
      this.db.close();
    }
  }

  getAllBuilders() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT name, address, city, state, lat, lng
        FROM builders 
        WHERE lat IS NOT NULL AND lng IS NOT NULL
        ORDER BY state, city, name
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  performValidation(allBuilders, targetBuilders) {
    const issues = [];
    const warnings = [];
    const recommendations = [];

    // Group builders by state
    const stateGroups = {};
    allBuilders.forEach(builder => {
      const state = builder.state || 'Unknown';
      if (!stateGroups[state]) stateGroups[state] = [];
      stateGroups[state].push(builder);
    });

    // Check each state for map bounds issues
    Object.keys(stateGroups).forEach(state => {
      const stateBuilders = stateGroups[state];
      
      if (stateBuilders.length === 1) {
        // Single builder states are always fine
        return;
      }

      const stateValidation = this.validateStateBuilders(state, stateBuilders);
      
      if (stateValidation.hasOutliers) {
        warnings.push(`${state}: ${stateValidation.outliers.length} potential outliers detected`);
        
        stateValidation.outliers.forEach(outlier => {
          const isTargetBuilder = targetBuilders.some(t => t.name === outlier.name);
          if (isTargetBuilder) {
            issues.push(`NEW BUILDER ISSUE: ${outlier.name} in ${state} is a geographic outlier`);
          }
        });
      }

      if (stateValidation.extremeSpread) {
        issues.push(`${state}: Extreme geographic spread (${stateValidation.spread.toFixed(1)}°) may cause zoom issues`);
      }

      recommendations.push(...stateValidation.recommendations);
    });

    // Check for cross-state contamination
    const crossStateIssues = this.checkCrossStateContamination(stateGroups);
    issues.push(...crossStateIssues);

    // Overall validation
    const isValid = issues.length === 0;
    
    return {
      valid: isValid,
      issues,
      warnings,
      recommendations,
      stateGroups,
      totalBuilders: allBuilders.length,
      targetBuilders: targetBuilders.length
    };
  }

  validateStateBuilders(state, builders) {
    if (builders.length <= 1) {
      return { hasOutliers: false, outliers: [], extremeSpread: false, spread: 0, recommendations: [] };
    }

    const lats = builders.map(b => b.lat);
    const lngs = builders.map(b => b.lng);
    
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };

    const latSpread = bounds.north - bounds.south;
    const lngSpread = bounds.east - bounds.west;
    const maxSpread = Math.max(latSpread, lngSpread);

    // Detect outliers
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;

    const outliers = builders.filter(builder => {
      const distanceFromCenter = Math.sqrt(
        Math.pow(builder.lat - centerLat, 2) + 
        Math.pow(builder.lng - centerLng, 2)
      );
      return distanceFromCenter > maxSpread * 0.4; // Strict threshold for validation
    });

    const recommendations = [];
    
    if (maxSpread > 3.0) {
      recommendations.push(`${state}: Consider regional clustering for ${maxSpread.toFixed(1)}° spread`);
    }

    if (outliers.length > 0 && outliers.length < builders.length * 0.3) {
      recommendations.push(`${state}: ${outliers.length} outliers may need special handling`);
    }

    return {
      hasOutliers: outliers.length > 0,
      outliers,
      extremeSpread: maxSpread > 4.0,
      spread: maxSpread,
      recommendations
    };
  }

  checkCrossStateContamination(stateGroups) {
    const issues = [];
    
    // Check if any builders are in the wrong state based on coordinates
    Object.keys(stateGroups).forEach(declaredState => {
      const builders = stateGroups[declaredState];
      
      builders.forEach(builder => {
        const actualState = this.guessStateFromCoordinates(builder.lat, builder.lng);
        
        if (actualState && actualState !== declaredState) {
          issues.push(
            `COORDINATE MISMATCH: ${builder.name} declared as ${declaredState} ` +
            `but coordinates (${builder.lat}, ${builder.lng}) suggest ${actualState}`
          );
        }
      });
    });

    return issues;
  }

  guessStateFromCoordinates(lat, lng) {
    // Rough state boundary checks for major outliers
    // This is a simplified check - in production you'd use a proper geocoding service
    
    if (lat > 60) return 'AK'; // Alaska
    if (lat < 25) return 'FL'; // Florida (southern tip)
    if (lng < -140) return 'AK'; // Alaska (western)
    if (lng > -65) return 'ME'; // Maine (eastern)
    
    // California rough bounds
    if (lat >= 32.5 && lat <= 42 && lng >= -124.5 && lng <= -114) return 'CA';
    
    // Arizona rough bounds  
    if (lat >= 31.3 && lat <= 37 && lng >= -114.8 && lng <= -109) return 'AZ';
    
    // More states can be added as needed
    return null; // Unknown
  }

  reportResults(validation) {
    console.log(`\n📊 VALIDATION RESULTS`);
    console.log('-'.repeat(30));
    
    if (validation.valid) {
      console.log('✅ All builders pass map bounds validation');
    } else {
      console.log(`❌ Found ${validation.issues.length} issues that need attention`);
    }

    if (validation.issues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES:`);
      validation.issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS:`);
      validation.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }

    if (validation.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      validation.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total builders: ${validation.totalBuilders}`);
    console.log(`   States: ${Object.keys(validation.stateGroups).length}`);
    console.log(`   Issues: ${validation.issues.length}`);
    console.log(`   Warnings: ${validation.warnings.length}`);
    
    if (validation.valid) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('   • Map bounds should display correctly');
      console.log('   • All builders should be visible in their respective states');
      console.log('   • No outliers affecting zoom levels');
    } else {
      console.log('\n🔧 REQUIRED ACTIONS:');
      console.log('   • Fix coordinate issues before deploying');
      console.log('   • Consider enhanced map component for outlier handling');
      console.log('   • Test map display after fixes');
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const validator = new MapBoundsValidator();
  
  if (args.length > 0) {
    // Validate specific builders
    console.log(`🎯 Validating specific builders: ${args.join(', ')}`);
    validator.validateNewBuilders(args).catch(console.error);
  } else {
    // Validate all builders
    validator.validateNewBuilders().catch(console.error);
  }
}

module.exports = MapBoundsValidator; 