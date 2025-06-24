const { chromium } = require('playwright');
const Database = require('better-sqlite3');
const path = require('path');

class ArizonaPhotoScraper {
  constructor() {
    this.db = new Database(path.join(__dirname, '../server/database/builders.db'));
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({ headless: true });
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    this.page = await context.newPage();
  }

  // Filter out logos, graphics, and non-van photos
  isValidVanPhoto(url, alt = '', context = '') {
    const lowUrl = url.toLowerCase();
    const lowAlt = alt.toLowerCase();
    const lowContext = context.toLowerCase();
    
    // Skip logos and graphics
    const skipPatterns = [
      'logo', 'favicon', 'icon', 'badge', 'banner', 'header',
      'footer', 'background', 'pattern', 'texture', 'watermark',
      'placeholder', 'avatar', 'profile', 'team', 'staff',
      '.svg', '-logo-', '_logo_', 'brand', 'symbol'
    ];
    
    for (const pattern of skipPatterns) {
      if (lowUrl.includes(pattern) || lowAlt.includes(pattern) || lowContext.includes(pattern)) {
        return false;
      }
    }
    
    // Look for van-related content
    const vanKeywords = [
      'van', 'camper', 'conversion', 'build', 'interior', 'exterior',
      'kitchen', 'bed', 'solar', 'bathroom', 'build-out', 'custom',
      'sprinter', 'transit', 'promaster', 'project', 'finished'
    ];
    
    const hasVanKeyword = vanKeywords.some(keyword => 
      lowUrl.includes(keyword) || lowAlt.includes(keyword) || lowContext.includes(keyword)
    );
    
    return hasVanKeyword;
  }

  async scrapePhotosFromPage(url, builderName) {
    console.log(`🔍 Scraping photos for ${builderName} from: ${url}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Look for various photo selectors
      const photoSelectors = [
        'img[src*="gallery"]',
        'img[src*="portfolio"]', 
        'img[src*="project"]',
        'img[src*="build"]',
        'img[src*="van"]',
        'img[src*="conversion"]',
        'img[src*="interior"]',
        'img[src*="exterior"]',
        '.gallery img',
        '.portfolio img',
        '.slider img',
        '.carousel img',
        '.lightbox img',
        '[class*="gallery"] img',
        '[class*="portfolio"] img',
        '[id*="gallery"] img'
      ];
      
      const allPhotos = [];
      
      for (const selector of photoSelectors) {
        try {
          const images = await this.page.$$eval(selector, (imgs) => 
            imgs.map(img => ({
              url: img.src,
              alt: img.alt || '',
              title: img.title || '',
              width: img.naturalWidth || 0,
              height: img.naturalHeight || 0
            }))
          );
          allPhotos.push(...images);
        } catch (e) {
          // Selector not found, continue
        }
      }
      
      // Also try common gallery pages
      const galleryUrls = [
        '/gallery', '/portfolio', '/builds', '/projects', 
        '/van-builds', '/conversions', '/work'
      ];
      
      for (const galleryPath of galleryUrls) {
        try {
          const galleryUrl = new URL(galleryPath, url).href;
          console.log(`🖼️ Checking gallery page: ${galleryUrl}`);
          
          await this.page.goto(galleryUrl, { waitUntil: 'networkidle', timeout: 15000 });
          
          const galleryImages = await this.page.$$eval('img', (imgs) => 
            imgs.map(img => ({
              url: img.src,
              alt: img.alt || '',
              title: img.title || '',
              width: img.naturalWidth || 0,
              height: img.naturalHeight || 0
            }))
          );
          
          allPhotos.push(...galleryImages);
        } catch (e) {
          // Gallery page not found or error, continue
        }
      }
      
      // Filter and deduplicate photos
      const validPhotos = [];
      const seenUrls = new Set();
      
      for (const photo of allPhotos) {
        if (seenUrls.has(photo.url)) continue;
        seenUrls.add(photo.url);
        
        // Skip very small images (likely icons/thumbnails)
        if (photo.width < 200 || photo.height < 150) continue;
        
        // Check if it's a valid van photo
        if (this.isValidVanPhoto(photo.url, photo.alt, photo.title)) {
          validPhotos.push({
            url: photo.url,
            alt: `${builderName} van conversion`,
            caption: photo.title || photo.alt || 'Custom van build'
          });
        }
      }
      
      console.log(`✅ Found ${validPhotos.length} valid van photos for ${builderName}`);
      return validPhotos.slice(0, 8); // Limit to 8 photos max
      
    } catch (error) {
      console.error(`❌ Error scraping photos for ${builderName}:`, error.message);
      return [];
    }
  }

  async updateBuilderPhotos(builderName, photos) {
    try {
      const photosJson = JSON.stringify(photos);
      const stmt = this.db.prepare(`
        UPDATE builders 
        SET photos = ? 
        WHERE name = ?
      `);
      
      stmt.run(photosJson, builderName);
      console.log(`💾 Updated ${photos.length} photos for ${builderName}`);
    } catch (error) {
      console.error(`❌ Database error for ${builderName}:`, error.message);
    }
  }

  async scrapeAll() {
    const builders = [
      { name: 'Papago Vans', url: 'https://papagovans.com' },
      { name: 'Tommy Camper Vans', url: 'https://www.tommycampervans.com' }
    ];

    await this.init();

    for (const builder of builders) {
      const photos = await this.scrapePhotosFromPage(builder.url, builder.name);
      if (photos.length > 0) {
        await this.updateBuilderPhotos(builder.name, photos);
      }
    }

    await this.browser.close();
    this.db.close();
  }
}

// Run the scraper
(async () => {
  console.log('🚐 Starting Arizona Van Builder Photo Scraper...');
  const scraper = new ArizonaPhotoScraper();
  await scraper.scrapeAll();
  console.log('✅ Photo scraping complete!');
})(); 