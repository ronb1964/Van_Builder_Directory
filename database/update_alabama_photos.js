const BrowserManager = require('./modules/BrowserManager.js');
const DataExtractor = require('./modules/DataExtractor.js');
const Database = require('../Shell/server/database.js');

async function updateAllAlabamaPhotos() {
  const browserManager = new BrowserManager();
  const dataExtractor = new DataExtractor();
  const db = new Database();
  
  try {
    console.log('🚀 Starting enhanced photo extraction for all Alabama builders...');
    
    // Wait for database to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const builders = await db.getBuildersByState('Alabama');
    console.log(`Found ${builders.length} Alabama builders to update`);
    
    const page = await browserManager.initialize();
    
    for (const builder of builders) {
      console.log(`\n📸 Processing: ${builder.name}`);
      console.log(`   Website: ${builder.website}`);
      
      try {
        await page.goto(builder.website, { waitUntil: 'networkidle', timeout: 30000 });
        
        const result = {
          url: builder.website,
          title: builder.name
        };
        
        // extractBuilderData returns { data, screenshot }
        const extractResult = await dataExtractor.extractBuilderData(page, result, 'Alabama');
        
        if (!extractResult || !extractResult.data) {
          console.log(`   ❌ No data extracted for ${builder.name}`);
          continue;
        }
        
        const data = extractResult.data;
        
        console.log(`   ✅ Found ${data.photos.length} photos`);
        console.log(`   📝 Van types: ${data.van_types.join(', ')}`);
        console.log(`   🏠 Amenities: ${data.amenities.join(', ')}`);
        
        // Show first few photo URLs
        if (data.photos.length > 0) {
          console.log(`   📷 Sample photos:`);
          data.photos.slice(0, 3).forEach((photo, i) => {
            console.log(`      ${i+1}. ${photo.url.substring(0, 60)}...`);
          });
        }
        
        // Update database with new photo data
        const updateData = {
          gallery: JSON.stringify(data.photos),
          van_types: data.van_types.join('|'),
          amenities: data.amenities.join('|')
        };
        
        await db.updateBuilder(builder.name, updateData);
        console.log(`   💾 Updated database for ${builder.name}`);
        
        // Brief pause between requests
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`   ❌ Error processing ${builder.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Photo extraction complete! Checking final results...');
    
    // Show final results
    const updatedBuilders = await db.getBuildersByState('Alabama');
    updatedBuilders.forEach(builder => {
      let photoCount = 0;
      if (builder.gallery) {
        try {
          const gallery = typeof builder.gallery === 'string' ? JSON.parse(builder.gallery) : builder.gallery;
          photoCount = Array.isArray(gallery) ? gallery.length : 0;
        } catch (e) {
          photoCount = 0;
        }
      }
      console.log(`📊 ${builder.name}: ${photoCount} photos`);
    });
    
    await browserManager.cleanup();
    db.close();
    
  } catch (error) {
    console.error('❌ Script error:', error);
    try {
      await browserManager.cleanup();
      db.close();
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError.message);
    }
  }
}

updateAllAlabamaPhotos();
