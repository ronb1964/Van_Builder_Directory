const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class DirectWebsiteScraper {
    constructor() {
        this.browser = null;
        this.context = null;
        this.builders = [];
    }

    async initialize() {
        console.log('🚀 Initializing Direct Website Scraper...');
        this.browser = await chromium.launch({ 
            headless: false,
            timeout: 60000 
        });
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
    }

    async scrapeWebsite(url, expectedBuilderName) {
        console.log(`\n🔍 Scraping: ${url}`);
        const page = await this.context.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(3000); // Let page fully load
            
            const builderData = {
                name: expectedBuilderName,
                website: url,
                address: '',
                city: '',
                state: 'Arkansas',
                zip: '',
                phone: '',
                email: '',
                social_media: [],
                van_types: [],
                amenities: [],
                services: [],
                description: '',
                photos: [],
                lead_time: '',
                years_experience: ''
            };
            
            // Extract basic contact info
            console.log('   📋 Extracting contact information...');
            
            // Look for phone numbers
            const phoneElements = await page.$$eval('*', elements => {
                const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
                const phones = [];
                elements.forEach(el => {
                    const text = el.textContent || '';
                    const matches = text.match(phoneRegex);
                    if (matches) phones.push(...matches);
                });
                return [...new Set(phones)];
            });
            
            if (phoneElements.length > 0) {
                builderData.phone = this.cleanPhone(phoneElements[0]);
                console.log(`   📞 Phone: ${builderData.phone}`);
            }
            
            // Look for email addresses
            const emailElements = await page.$$eval('*', elements => {
                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                const emails = [];
                elements.forEach(el => {
                    const text = el.textContent || '';
                    const href = el.href || '';
                    const matches = (text + ' ' + href).match(emailRegex);
                    if (matches) emails.push(...matches);
                });
                return [...new Set(emails)];
            });
            
            if (emailElements.length > 0) {
                builderData.email = emailElements[0];
                console.log(`   ✉️ Email: ${builderData.email}`);
            }
            
            // Look for addresses
            console.log('   🏠 Extracting address information...');
            const addressElements = await page.$$eval('*', elements => {
                const addresses = [];
                elements.forEach(el => {
                    const text = el.textContent || '';
                    // Look for patterns like "City, State ZIP" or "State ZIP"
                    if (text.match(/Arkansas|AR\s+\d{5}/i)) {
                        addresses.push(text.trim());
                    }
                });
                return addresses;
            });
            
            if (addressElements.length > 0) {
                builderData.address = addressElements[0];
                // Extract city from address
                const cityMatch = builderData.address.match(/([^,]+),?\s*(Arkansas|AR)/i);
                if (cityMatch) {
                    builderData.city = cityMatch[1].trim();
                }
                console.log(`   🏠 Address: ${builderData.address}`);
                console.log(`   🏙️ City: ${builderData.city}`);
            }
            
            // Extract social media links
            console.log('   📱 Extracting social media...');
            const socialLinks = await page.$$eval('a[href*="instagram"], a[href*="facebook"], a[href*="twitter"], a[href*="youtube"], a[href*="tiktok"]', links => {
                return links.map(link => link.href).filter(href => 
                    href.includes('instagram.com') || 
                    href.includes('facebook.com') ||
                    href.includes('twitter.com') ||
                    href.includes('youtube.com') ||
                    href.includes('tiktok.com')
                );
            });
            
            builderData.social_media = [...new Set(socialLinks)];
            console.log(`   📱 Social Media: ${builderData.social_media.length} links found`);
            
            // Extract images (photos of their work)
            console.log('   📸 Extracting photos...');
            const images = await page.$$eval('img', imgs => {
                return imgs.map(img => ({
                    src: img.src,
                    alt: img.alt || '',
                    width: img.naturalWidth || 0,
                    height: img.naturalHeight || 0
                })).filter(img => 
                    img.src && 
                    !img.src.includes('logo') && 
                    !img.src.includes('icon') &&
                    img.width > 200 && 
                    img.height > 150
                );
            });
            
            // Take best quality images
            const sortedImages = images.sort((a, b) => (b.width * b.height) - (a.width * a.height));
            builderData.photos = sortedImages.slice(0, 8).map(img => img.src);
            console.log(`   📸 Photos: ${builderData.photos.length} high-quality images found`);
            
            // Extract business description
            console.log('   📝 Extracting description...');
            const descriptionElements = await page.$$eval('p, div', elements => {
                return elements.map(el => el.textContent || '').filter(text => 
                    text.length > 100 && 
                    text.length < 1000 &&
                    (text.toLowerCase().includes('van') || 
                     text.toLowerCase().includes('custom') ||
                     text.toLowerCase().includes('build'))
                );
            });
            
            if (descriptionElements.length > 0) {
                builderData.description = descriptionElements[0].trim();
                console.log(`   📝 Description: ${builderData.description.substring(0, 100)}...`);
            }
            
            // Look for van types and amenities in text content
            console.log('   🚐 Extracting van types and amenities...');
            const pageText = await page.evaluate(() => document.body.textContent.toLowerCase());
            
            // Common van types
            const vanTypes = ['sprinter', 'transit', 'promaster', 'ram promaster', 'ford transit', 'mercedes sprinter'];
            const foundVanTypes = vanTypes.filter(type => pageText.includes(type));
            builderData.van_types = foundVanTypes;
            
            // Common amenities
            const amenityKeywords = [
                'solar', 'plumbing', 'electrical', 'kitchen', 'bathroom', 'shower',
                'water tank', 'grey water', 'inverter', 'battery', 'refrigerator',
                'sink', 'stove', 'bed', 'seating', 'storage', 'cabinets', 'flooring',
                'insulation', 'ventilation', 'heating', 'air conditioning'
            ];
            
            const foundAmenities = amenityKeywords.filter(amenity => pageText.includes(amenity));
            builderData.amenities = foundAmenities;
            
            console.log(`   🚐 Van Types: ${builderData.van_types.join(', ')}`);
            console.log(`   ⚙️ Amenities: ${builderData.amenities.length} found`);
            
            return builderData;
            
        } catch (error) {
            console.error(`❌ Error scraping ${url}:`, error.message);
            return null;
        } finally {
            await page.close();
        }
    }
    
    cleanPhone(phone) {
        if (!phone) return phone;
        
        // Extract just digits
        const digits = phone.replace(/[^\d]/g, '');
        
        // Format as (XXX) XXX-XXXX if we have 10 digits
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        } else if (digits.length === 11 && digits[0] === '1') {
            // Remove country code
            return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
        }
        
        return phone;
    }

    async scrapeArkansasBuilders() {
        const arkansasBuilders = [
            { url: 'https://www.ozkcustoms.com/', name: 'OZK Customs' },
            { url: 'https://www.openroad.cool/', name: 'Open Road' }
        ];
        
        console.log(`🏗️ Scraping ${arkansasBuilders.length} Arkansas Van Builders\n`);
        
        for (const builder of arkansasBuilders) {
            console.log(`\n🎯 Scraping ${builder.name}...`);
            const builderData = await this.scrapeWebsite(builder.url, builder.name);
            
            if (builderData) {
                this.builders.push(builderData);
                console.log(`✅ Successfully scraped ${builder.name}`);
            } else {
                console.log(`❌ Failed to scrape ${builder.name}`);
            }
        }
        
        return this.builders;
    }
    
    async saveResults() {
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const filename = `van_builders_arkansas_${timestamp}.json`;
        
        try {
            await fs.promises.writeFile(filename, JSON.stringify(this.builders, null, 2));
            console.log(`\n💾 Results saved to: ${filename}`);
            return filename;
        } catch (error) {
            console.error('❌ Error saving results:', error);
            return null;
        }
    }
    
    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function main() {
    const scraper = new DirectWebsiteScraper();
    
    try {
        await scraper.initialize();
        
        const builders = await scraper.scrapeArkansasBuilders();
        
        console.log(`\n📊 Summary:`);
        console.log(`   Total builders scraped: ${builders.length}`);
        
        builders.forEach((builder, index) => {
            console.log(`\n   Builder ${index + 1}: ${builder.name}`);
            console.log(`   📞 Phone: ${builder.phone || 'Not found'}`);
            console.log(`   ✉️ Email: ${builder.email || 'Not found'}`);
            console.log(`   🏠 Address: ${builder.address || 'Not found'}`);
            console.log(`   📱 Social Media: ${builder.social_media.length} links`);
            console.log(`   📸 Photos: ${builder.photos.length} images`);
            console.log(`   🚐 Van Types: ${builder.van_types.join(', ') || 'Not specified'}`);
            console.log(`   ⚙️ Amenities: ${builder.amenities.length} found`);
        });
        
        await scraper.saveResults();
        
        console.log(`\n🎉 Arkansas scraping completed successfully!`);
        
    } catch (error) {
        console.error('❌ Scraping failed:', error);
        process.exit(1);
    } finally {
        await scraper.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { DirectWebsiteScraper }; 