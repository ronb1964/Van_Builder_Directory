#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Import existing scraper modules
const playwrightConfig = require('./scraper_modules/playwright_config');
const dataExtraction = require('./scraper_modules/data_extraction');
const photoProcessing = require('./scraper_modules/photo_processing');

// Database path
const DB_PATH = path.join(__dirname, '..', 'server', 'database', 'builders.db');

class CaliforniaBuilderProcessor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = [];
    }

    async initialize() {
        console.log('🚀 Initializing California builder processor...');
        const { browser, context, page } = await playwrightConfig.launchBrowserAndCreatePage({
            headless: true,
            fastMode: false
        });
        this.browser = browser;
        this.page = page;
        console.log('✅ Browser initialized');
    }

    async processBuilder(builderInfo) {
        const { state, city, address, website } = builderInfo;
        console.log(`\n🔍 Processing: ${website}`);
        console.log(`   Expected: ${city || 'Unknown'}, ${state}`);
        
        try {
            await this.page.goto(website, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await this.page.waitForTimeout(3000);

            // Extract all data
            const businessName = await dataExtraction.extractBusinessName(this.page) || 'Unknown Business';
            const contactInfo = await dataExtraction.extractContactInfo(this.page, state);
            const description = await dataExtraction.extractDescription(this.page) || '';
            const socialMedia = await dataExtraction.extractSocialMedia(this.page);
            const photos = await photoProcessing.extractPhotos(this.page);

            // Format photos for database (take top 8)
            const formattedPhotos = photoProcessing.formatPhotosForDatabase(photos.slice(0, 8));

            // Use provided address/city if extraction didn't find complete info
            let finalAddress = contactInfo.address;
            let finalCity = city;
            
            // If we have extracted address, prefer it, but supplement with provided city if missing
            if (contactInfo.address && !contactInfo.address.toLowerCase().includes(city?.toLowerCase() || '')) {
                if (city) {
                    finalAddress = `${contactInfo.address}, ${city}, CA`;
                }
            } else if (!contactInfo.address && address) {
                finalAddress = `${address}, ${city}, CA`;
            }

            // Extract city from final address if we don't have it
            if (!finalCity && finalAddress) {
                const cityMatch = finalAddress.match(/,\s*([^,]+),\s*CA/i);
                if (cityMatch) {
                    finalCity = cityMatch[1].trim();
                }
            }

            const builderData = {
                name: businessName,
                website: website,
                address: finalAddress || address || '',
                city: finalCity || city || '',
                state: 'CA',
                zip: '', // Will be filled later if needed
                phone: contactInfo.phone || '',
                email: contactInfo.email || '',
                description: description.substring(0, 500), // Limit description length
                van_types: this.extractVanTypes(description + ' ' + businessName),
                amenities: this.extractAmenities(description + ' ' + businessName),
                social_media: socialMedia,
                photos: formattedPhotos,
                latitude: 0, // Will be geocoded later if needed
                longitude: 0
            };

            console.log(`✅ Extracted data for: ${builderData.name}`);
            console.log(`   📞 Phone: ${builderData.phone || 'Not found'}`);
            console.log(`   📧 Email: ${builderData.email || 'Not found'}`);
            console.log(`   📍 Address: ${builderData.address || 'Not found'}`);
            console.log(`   🏙️ City: ${builderData.city || 'Not found'}`);
            console.log(`   📸 Photos: ${builderData.photos.length} found`);

            return builderData;

        } catch (error) {
            console.log(`❌ Error processing ${website}: ${error.message}`);
            return {
                name: 'Unknown Business',
                website: website,
                address: address || '',
                city: city || '',
                state: 'CA',
                zip: '',
                phone: '',
                email: '',
                description: '',
                van_types: '',
                amenities: '',
                social_media: {},
                photos: [],
                latitude: 0,
                longitude: 0,
                error: error.message
            };
        }
    }

    extractVanTypes(text) {
        const vanKeywords = ['sprinter', 'transit', 'promaster', 'class b', 'class c', 'conversion', 'mercedes', 'ford', 'ram'];
        const found = [];
        
        vanKeywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword)) {
                found.push(keyword);
            }
        });
        
        return found.join(',');
    }

    extractAmenities(text) {
        const amenityKeywords = ['solar', 'kitchen', 'bathroom', 'shower', 'heating', 'ac', 'air conditioning', 'electrical', 'plumbing', 'storage'];
        const found = [];
        
        amenityKeywords.forEach(amenity => {
            if (text.toLowerCase().includes(amenity)) {
                found.push(amenity);
            }
        });
        
        return found.join(',');
    }

    async saveToDatabase(builders) {
        console.log('\n💾 Saving results to SQLite database...');
        
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    reject(new Error(`Database connection failed: ${err.message}`));
                    return;
                }
                
                let savedCount = 0;
                let errorCount = 0;
                
                const saveNext = (index) => {
                    if (index >= builders.length) {
                        db.close();
                        resolve({ savedCount, errorCount });
                        return;
                    }
                    
                    const builder = builders[index];
                    
                                         db.run(`
                        INSERT INTO builders (
                            name, city, state, lat, lng, zip, phone, email, website, description
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        builder.name,
                        builder.city,
                        builder.state,
                        builder.latitude,
                        builder.longitude,
                        builder.zip,
                        builder.phone,
                        builder.email,
                        builder.website,
                        builder.description
                    ], function(err) {
                        if (err) {
                            console.error(`❌ Error saving ${builder.name}: ${err.message}`);
                            errorCount++;
                        } else {
                            console.log(`✅ Saved: ${builder.name} (ID: ${this.lastID})`);
                            savedCount++;
                            
                            // Save social media if we have any
                            if (Object.keys(builder.social_media).length > 0) {
                                db.run(`
                                    INSERT OR REPLACE INTO builder_social_media (
                                        builder_id, facebook, instagram, youtube
                                    ) VALUES (?, ?, ?, ?)
                                `, [
                                    this.lastID,
                                    builder.social_media.facebook || null,
                                    builder.social_media.instagram || null,
                                    builder.social_media.youtube || null
                                ]);
                            }
                            
                            // Save photos if we have any
                            if (builder.photos.length > 0) {
                                builder.photos.forEach((photo, index) => {
                                    db.run(`
                                        INSERT INTO builder_gallery (builder_id, url, caption, sort_order)
                                        VALUES (?, ?, ?, ?)
                                    `, [this.lastID, photo.url, photo.caption || '', index]);
                                });
                            }
                        }
                        
                        saveNext(index + 1);
                    });
                };
                
                saveNext(0);
            });
        });
    }

    async run() {
        try {
            // Read CSV file
            const csvContent = fs.readFileSync('ca_test_5.csv', 'utf-8');
            const lines = csvContent.split('\n').filter(line => line.trim());
            const records = [];
            
            // Parse CSV using the csv-parse library to properly handle commas
            const parsedRecords = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                quote: '"',
                escape: '"'
            });
            
            // Filter out incomplete records
            for (const record of parsedRecords) {
                if (record.website && record.website.trim() && record.website.startsWith('http')) {
                    records.push({
                        state: record.state,
                        city: record.city,
                        address: record.address,
                        website: record.website
                    });
                }
            }

            // Use all builders from the test file
            const testBuilders = records;
            console.log(`🧪 Processing ${testBuilders.length} California builders for database insertion\n`);

            await this.initialize();

            // Process each builder
            for (const builderInfo of testBuilders) {
                const result = await this.processBuilder(builderInfo);
                this.results.push(result);
            }

            // Save to database
            const dbResult = await this.saveToDatabase(this.results);
            
            console.log('\n📊 FINAL SUMMARY');
            console.log('='.repeat(50));
            console.log(`✅ Builders processed: ${this.results.length}`);
            console.log(`💾 Saved to database: ${dbResult.savedCount}`);
            console.log(`❌ Errors: ${dbResult.errorCount}`);
            
            const successful = this.results.filter(r => !r.error);
            console.log(`📞 Phone numbers found: ${successful.filter(r => r.phone).length}/${successful.length}`);
            console.log(`📧 Email addresses found: ${successful.filter(r => r.email).length}/${successful.length}`);
            console.log(`📍 Addresses found: ${successful.filter(r => r.address).length}/${successful.length}`);
            
            console.log('\n🎉 California builders successfully added to database!');
            console.log('   You can now check them on your website.');

        } catch (error) {
            console.error('❌ Process failed:', error.message);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the processor
const processor = new CaliforniaBuilderProcessor();
processor.run().catch(console.error); 