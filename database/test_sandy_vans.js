#!/usr/bin/env node

const { chromium } = require('playwright');
const playwrightConfig = require('./scraper_modules/playwright_config');
const dataExtraction = require('./scraper_modules/data_extraction');

async function testSandyVans() {
    console.log('🧪 Testing improved scraper on Sandy Vans');
    console.log('🎯 Target: https://sandyvans.com/');
    console.log('📍 Expected: 9393 Trade Pl, San Diego, CA');
    console.log('📞 Expected: 619.812.1903');
    console.log('📧 Expected: Contact@sandyvans.com\n');

    let browser, page;
    
    try {
        // Initialize browser
        const { browser: br, context, page: pg } = await playwrightConfig.launchBrowserAndCreatePage({
            headless: true,
            fastMode: false
        });
        browser = br;
        page = pg;

        console.log('🔍 Loading Sandy Vans website...');
        await page.goto('https://sandyvans.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);

        console.log('📊 Extracting data...');

        // Extract business name
        const businessName = await dataExtraction.extractBusinessName(page) || 'Name not found';
        
        // Extract contact info
        const contactInfo = await dataExtraction.extractContactInfo(page, 'CA');
        
        console.log('\n' + '='.repeat(50));
        console.log('📋 EXTRACTION RESULTS');
        console.log('='.repeat(50));
        console.log(`🏢 Business Name: ${businessName}`);
        console.log(`📞 Phone: ${contactInfo.phone || 'Not found'}`);
        console.log(`📧 Email: ${contactInfo.email || 'Not found'}`);
        console.log(`📍 Address: ${contactInfo.address || 'Not found'}`);
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 ACCURACY CHECK');
        console.log('='.repeat(50));
        
        // Check phone
        const expectedPhone = '619.812.1903';
        const phoneMatch = contactInfo.phone && contactInfo.phone.includes('619') && contactInfo.phone.includes('812') && contactInfo.phone.includes('1903');
        console.log(`📞 Phone Match: ${phoneMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`   Expected: ${expectedPhone}`);
        console.log(`   Found: ${contactInfo.phone || 'None'}`);
        
        // Check email
        const expectedEmail = 'contact@sandyvans.com';
        const emailMatch = contactInfo.email && contactInfo.email.toLowerCase().includes('contact@sandyvans.com');
        console.log(`📧 Email Match: ${emailMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`   Expected: ${expectedEmail}`);
        console.log(`   Found: ${contactInfo.email || 'None'}`);
        
        // Check address
        const expectedAddress = '9393 Trade Pl, San Diego, CA';
        const addressMatch = contactInfo.address && 
                           contactInfo.address.includes('9393') && 
                           contactInfo.address.toLowerCase().includes('trade') &&
                           contactInfo.address.toLowerCase().includes('san diego');
        console.log(`📍 Address Match: ${addressMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`   Expected: ${expectedAddress}`);
        console.log(`   Found: ${contactInfo.address || 'None'}`);
        
        const overallSuccess = phoneMatch && emailMatch && addressMatch;
        console.log(`\n🎉 Overall Result: ${overallSuccess ? '✅ ALL GOOD!' : '❌ NEEDS MORE WORK'}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testSandyVans().catch(console.error); 