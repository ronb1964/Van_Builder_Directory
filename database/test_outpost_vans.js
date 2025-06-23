#!/usr/bin/env node

const { chromium } = require('playwright');
const playwrightConfig = require('./scraper_modules/playwright_config');
const dataExtraction = require('./scraper_modules/data_extraction');

async function testOutpostVans() {
    console.log('🧪 Testing improved scraper on Outpost Vans');
    console.log('🎯 Target: https://www.outpostvans.com/');
    console.log('📍 Expected: 602 Airport Rd, Oceanside, CA');
    console.log('📞 Expected: (760) 643-7896');
    console.log('📧 Expected: info@outpostvans.com\n');

    let browser, page;
    
    try {
        // Initialize browser
        const { browser: br, context, page: pg } = await playwrightConfig.launchBrowserAndCreatePage({
            headless: true,
            fastMode: false
        });
        browser = br;
        page = pg;

        console.log('🔍 Loading Outpost Vans website...');
        await page.goto('https://www.outpostvans.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);

        console.log('📊 Extracting data from main page...');

        // Extract from main page first
        const businessName = await dataExtraction.extractBusinessName(page) || 'Name not found';
        const contactInfo = await dataExtraction.extractContactInfo(page, 'CA');
        
        console.log('\n' + '='.repeat(50));
        console.log('📋 MAIN PAGE EXTRACTION RESULTS');
        console.log('='.repeat(50));
        console.log(`🏢 Business Name: ${businessName}`);
        console.log(`📞 Phone: ${contactInfo.phone || 'Not found'}`);
        console.log(`📧 Email: ${contactInfo.email || 'Not found'}`);
        console.log(`📍 Address: ${contactInfo.address || 'Not found'}`);
        
        // Check if we found the city
        const hasOceanside = contactInfo.address && contactInfo.address.toLowerCase().includes('oceanside');
        console.log(`🎯 City Found: ${hasOceanside ? '✅ YES' : '❌ NO'}`);
        
        // If we didn't find complete info, try the contact page
        if (!hasOceanside || !contactInfo.phone || !contactInfo.email) {
            console.log('\n🔍 Checking contact page for missing information...');
            
            try {
                await page.goto('https://www.outpostvans.com/pages/contact', { waitUntil: 'domcontentloaded', timeout: 30000 });
                await page.waitForTimeout(3000);
                
                const contactPageInfo = await dataExtraction.extractContactInfo(page, 'CA');
                
                console.log('\n' + '='.repeat(50));
                console.log('📋 CONTACT PAGE EXTRACTION RESULTS');
                console.log('='.repeat(50));
                console.log(`📞 Phone: ${contactPageInfo.phone || 'Not found'}`);
                console.log(`📧 Email: ${contactPageInfo.email || 'Not found'}`);
                console.log(`📍 Address: ${contactPageInfo.address || 'Not found'}`);
                
                // Merge results - prefer contact page data if more complete
                const finalInfo = {
                    phone: contactPageInfo.phone || contactInfo.phone,
                    email: contactPageInfo.email || contactInfo.email,
                    address: contactPageInfo.address || contactInfo.address
                };
                
                console.log('\n' + '='.repeat(50));
                console.log('📋 FINAL MERGED RESULTS');
                console.log('='.repeat(50));
                console.log(`🏢 Business Name: ${businessName}`);
                console.log(`📞 Phone: ${finalInfo.phone || 'Not found'}`);
                console.log(`📧 Email: ${finalInfo.email || 'Not found'}`);
                console.log(`📍 Address: ${finalInfo.address || 'Not found'}`);
                
                // Final accuracy check
                console.log('\n' + '='.repeat(50));
                console.log('🎯 ACCURACY CHECK');
                console.log('='.repeat(50));
                
                const phoneMatch = finalInfo.phone && finalInfo.phone.includes('760') && finalInfo.phone.includes('643') && finalInfo.phone.includes('7896');
                console.log(`📞 Phone Match: ${phoneMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
                console.log(`   Expected: (760) 643-7896`);
                console.log(`   Found: ${finalInfo.phone || 'None'}`);
                
                const emailMatch = finalInfo.email && finalInfo.email.toLowerCase().includes('info@outpostvans.com');
                console.log(`📧 Email Match: ${emailMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
                console.log(`   Expected: info@outpostvans.com`);
                console.log(`   Found: ${finalInfo.email || 'None'}`);
                
                const addressMatch = finalInfo.address && 
                                   finalInfo.address.includes('602') && 
                                   finalInfo.address.toLowerCase().includes('airport') &&
                                   finalInfo.address.toLowerCase().includes('oceanside');
                console.log(`📍 Address Match: ${addressMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
                console.log(`   Expected: 602 Airport Rd, Oceanside, CA`);
                console.log(`   Found: ${finalInfo.address || 'None'}`);
                
                const overallSuccess = phoneMatch && emailMatch && addressMatch;
                console.log(`\n🎉 Overall Result: ${overallSuccess ? '✅ ALL GOOD!' : '❌ NEEDS MORE WORK'}`);
                
            } catch (error) {
                console.log(`❌ Could not load contact page: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testOutpostVans().catch(console.error); 