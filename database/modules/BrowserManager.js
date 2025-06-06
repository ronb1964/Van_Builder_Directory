/**
 * Browser Manager Module
 * Handles Playwright browser initialization and management
 */

const { chromium } = require('playwright');

class BrowserManager {
    constructor(options = {}) {
        this.headless = !options.headed;
        this.fastMode = options.fast || false;
        this.browser = null;
        this.context = null;
        this.page = null;
        this.screenshots = [];
    }

    async initialize() {
        console.log('🚀 Initializing Playwright browser...');
        
        // Launch browser with realistic settings
        this.browser = await chromium.launch({
            headless: this.headless,
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

        // Create context with realistic user agent and viewport
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1366, height: 768 },
            locale: 'en-US',
            timezoneId: 'America/New_York'
        });

        // Block resources in fast mode for better performance
        if (this.fastMode) {
            await this.context.route('**/*', (route) => {
                const resourceType = route.request().resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    route.abort();
                } else {
                    route.continue();
                }
            });
        }

        this.page = await this.context.newPage();
        
        // Set longer timeout for slow websites
        this.page.setDefaultTimeout(30000);
        
        console.log('✅ Browser initialized successfully');
        return this.page;
    }

    addScreenshot(filename) {
        this.screenshots.push(filename);
    }

    async cleanup() {
        console.log('🧹 Cleaning up browser and screenshots...');
        
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }

        // Clean up screenshot files
        const fs = require('fs');
        let totalSize = 0;
        let deletedCount = 0;

        for (const screenshot of this.screenshots) {
            try {
                if (fs.existsSync(screenshot)) {
                    const stats = fs.statSync(screenshot);
                    totalSize += stats.size;
                    fs.unlinkSync(screenshot);
                    deletedCount++;
                    console.log(`🗑️ Deleted screenshot: ${screenshot}`);
                }
            } catch (error) {
                console.error(`❌ Error deleting ${screenshot}:`, error.message);
            }
        }

        if (deletedCount > 0) {
            const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            console.log(`🧹 Cleanup complete: ${deletedCount} screenshots deleted (${sizeMB} MB freed)`);
        }

        this.screenshots = [];
    }
}

module.exports = BrowserManager;
