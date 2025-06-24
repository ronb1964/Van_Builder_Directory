const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function launchBrowserAndCreatePage(options = {}) {
    const { headless = true, fastMode = false } = options;
    console.log('🚀 Initializing Playwright scraper (from playwright_config.js)...');

    const browser = await chromium.launch({
        headless: headless,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        locale: 'en-US',
        timezoneId: 'America/New_York'
    });

    if (fastMode) {
        await context.route('**/*', (route) => {
            const resourceType = route.request().resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                route.abort();
            } else {
                route.continue();
            }
        });
    }

    const page = await context.newPage();
    page.setDefaultTimeout(30000); // Set longer timeout for slow websites

    console.log('✅ Browser initialized successfully (from playwright_config.js)');
    return { browser, context, page };
}

async function closeBrowserAndCleanup(browser, screenshots = []) {
    console.log('\n🧹 Cleaning up (from playwright_config.js)...');
    
    if (browser) {
        try {
            await browser.close();
            console.log('✅ Browser closed');
        } catch (error) {
            console.error('❌ Error closing browser:', error);
        }
    } else {
        console.warn('⚠️ Browser instance not found, skipping close.');
    }

    // Clean up screenshots
    if (screenshots.length > 0) {
        console.log(`🖼️ Removing ${screenshots.length} screenshots...`);
        screenshots.forEach(screenshotPath => {
            try {
                if (fs.existsSync(screenshotPath)) {
                    fs.unlinkSync(screenshotPath);
                }
            } catch (error) {
                console.error(`❌ Error deleting screenshot ${screenshotPath}:`, error);
            }
        });
        console.log('✅ Screenshots removed');
    } else {
        console.log('📸 No screenshots to remove.');
    }
}

module.exports = {
    launchBrowserAndCreatePage,
    closeBrowserAndCleanup
};
