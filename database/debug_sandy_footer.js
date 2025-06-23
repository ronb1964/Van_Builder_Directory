#!/usr/bin/env node

const { chromium } = require('playwright');
const playwrightConfig = require('./scraper_modules/playwright_config');

async function debugSandyFooter() {
    console.log('🔍 Debugging Sandy Vans footer content');
    
    let browser, page;
    
    try {
        const { browser: br, context, page: pg } = await playwrightConfig.launchBrowserAndCreatePage({
            headless: true,
            fastMode: false
        });
        browser = br;
        page = pg;

        await page.goto('https://sandyvans.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Debug footer content
        const footerInfo = await page.evaluate(() => {
            const result = {
                footerFound: false,
                footerText: '',
                allPhoneNumbers: [],
                allEmails: [],
                footerSelectors: []
            };
            
            // Try different footer selectors
            const footerSelectors = ['footer', '.footer', '#footer', '[class*="footer"]'];
            
            for (const selector of footerSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    result.footerFound = true;
                    result.footerText = element.textContent;
                    result.footerSelectors.push(selector);
                    break;
                }
            }
            
            // Get all phone numbers and emails from the entire page
            const bodyText = document.body.textContent;
            result.allPhoneNumbers = bodyText.match(/\b\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{4}\b/g) || [];
            result.allEmails = bodyText.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g) || [];
            
            return result;
        });

        console.log(`\n🔍 Footer Found: ${footerInfo.footerFound}`);
        if (footerInfo.footerFound) {
            console.log('📋 FOOTER CONTENT:');
            console.log('='.repeat(60));
            console.log(footerInfo.footerText);
        } else {
            console.log('❌ No footer element found with standard selectors');
        }
        
        console.log('\n📞 ALL PHONE NUMBERS FOUND ON PAGE:');
        console.log('='.repeat(60));
        if (footerInfo.allPhoneNumbers.length > 0) {
            footerInfo.allPhoneNumbers.forEach((phone, i) => {
                console.log(`${i+1}. ${phone}`);
            });
        } else {
            console.log('❌ No phone numbers found');
        }
        
        console.log('\n📧 ALL EMAILS FOUND ON PAGE:');
        console.log('='.repeat(60));
        if (footerInfo.allEmails.length > 0) {
            footerInfo.allEmails.forEach((email, i) => {
                console.log(`${i+1}. ${email}`);
            });
        } else {
            console.log('❌ No emails found');
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

debugSandyFooter().catch(console.error); 