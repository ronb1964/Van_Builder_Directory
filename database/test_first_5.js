#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// Import existing scraper modules
const playwrightConfig = require('./scraper_modules/playwright_config');
const dataExtraction = require('./scraper_modules/data_extraction');
const photoProcessing = require('./scraper_modules/photo_processing');
const locationUtils = require('./scraper_modules/location_utils');

async function testFirstFive() {
    console.log('🧪 Testing scraper on first 5 California builders');
    console.log('📝 This is a TEST ONLY - no database changes will be made\n');

    let browser, page;
    
    try {
        // Read simple CSV with just state and website
        const csvContent = fs.readFileSync('ca_test_5.csv', 'utf-8');
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        console.log(`Found ${records.length} builders to test:\n`);
        records.forEach((b, i) => {
            console.log(`${i+1}. ${b.website}`);
        });
        console.log('\n' + '='.repeat(60) + '\n');

        // Initialize browser
        const { browser: br, context, page: pg } = await playwrightConfig.launchBrowserAndCreatePage({
            headless: true,
            fastMode: false
        });
        browser = br;
        page = pg;

        const results = [];

        // Test each builder
        for (let i = 0; i < records.length; i++) {
            const builder = records[i];
            console.log(`\n🔍 TESTING ${i+1}/5: ${builder.website}`);
            
            try {
                await page.goto(builder.website, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await page.waitForTimeout(3000);

                // Extract all data from the website
                const businessName = await dataExtraction.extractBusinessName(page) || 'Name not found';
                const contactInfo = await dataExtraction.extractContactInfo(page, 'CA');
                const description = await dataExtraction.extractDescription(page);
                const socialMedia = await dataExtraction.extractSocialMedia(page);
                const photos = await photoProcessing.extractPhotos(page);
                
                const result = {
                    url: builder.website,
                    name: businessName,
                    phone: contactInfo.phone || '',
                    email: contactInfo.email || '',
                    address: contactInfo.address || '',
                    city: contactInfo.city || '',
                    zip: contactInfo.zip || '',
                    description: description || '',
                    socialMedia: socialMedia,
                    photoCount: photos.length,
                    success: true
                };

                results.push(result);

                console.log(`✅ SUCCESS!`);
                console.log(`   Business Name: ${result.name}`);
                console.log(`   Phone: ${result.phone || 'Not found'}`);
                console.log(`   Email: ${result.email || 'Not found'}`);
                console.log(`   Address: ${result.address || 'Not found'}`);
                console.log(`   City: ${result.city || 'Not found'}`);
                console.log(`   Zip: ${result.zip || 'Not found'}`);
                console.log(`   Description: ${result.description ? result.description.substring(0, 100) + '...' : 'Not found'}`);
                
                // Show social media links
                const socialPlatforms = Object.keys(result.socialMedia);
                if (socialPlatforms.length > 0) {
                    console.log(`   Social Media (${socialPlatforms.length}):`);
                    Object.entries(result.socialMedia).forEach(([platform, url]) => {
                        console.log(`     ${platform}: ${url}`);
                    });
                } else {
                    console.log(`   Social Media: None found`);
                }
                
                console.log(`   Photos Found: ${result.photoCount}`);

            } catch (error) {
                console.log(`❌ ERROR: ${error.message}`);
                results.push({
                    url: builder.website,
                    error: error.message,
                    success: false
                });
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        
        const successful = results.filter(r => r.success);
        const withPhone = successful.filter(r => r.phone);
        const withEmail = successful.filter(r => r.email);
        const withAddress = successful.filter(r => r.address);
        const withCity = successful.filter(r => r.city);
        const withZip = successful.filter(r => r.zip);
        const withSocialMedia = successful.filter(r => Object.keys(r.socialMedia || {}).length > 0);
        
        console.log(`✅ Successful extractions: ${successful.length}/${results.length}`);
        console.log(`📞 Phone numbers: ${withPhone.length}/${successful.length}`);
        console.log(`📧 Email addresses: ${withEmail.length}/${successful.length}`);
        console.log(`📍 Full addresses: ${withAddress.length}/${successful.length}`);
        console.log(`🏙️ Cities: ${withCity.length}/${successful.length}`);
        console.log(`📮 Zip codes: ${withZip.length}/${successful.length}`);
        console.log(`🌐 Social media: ${withSocialMedia.length}/${successful.length}`);
        
        // Show detailed results for manual verification
        console.log('\n🔍 DETAILED RESULTS FOR VERIFICATION:');
        console.log('='.repeat(60));
        
        successful.forEach((result, i) => {
            console.log(`\n${i+1}. ${result.name}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   Phone: ${result.phone || 'N/A'}`);
            console.log(`   Email: ${result.email || 'N/A'}`);
            console.log(`   Address: ${result.address || 'N/A'}`);
            console.log(`   City: ${result.city || 'N/A'}`);
            console.log(`   Zip: ${result.zip || 'N/A'}`);
            
            const socialCount = Object.keys(result.socialMedia || {}).length;
            if (socialCount > 0) {
                console.log(`   Social Media (${socialCount}):`);
                Object.entries(result.socialMedia).forEach(([platform, url]) => {
                    console.log(`     ${platform}: ${url}`);
                });
            } else {
                console.log(`   Social Media: None`);
            }
        });

        console.log('\n✨ Test completed! No database changes were made.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testFirstFive().catch(console.error); 