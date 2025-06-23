// Data extraction utilities for van builder scraper

// Van type standardization mapping - consistent with our database standards
const VAN_TYPE_STANDARDIZATION = {
    // Ford Transit variations
    'transit': 'Ford Transit',
    'ford transit': 'Ford Transit',
    'Transit': 'Ford Transit',
    'TRANSIT': 'Ford Transit',
    
    // Mercedes Sprinter variations  
    'sprinter': 'Mercedes Sprinter',
    'Sprinter': 'Mercedes Sprinter',
    'SPRINTER': 'Mercedes Sprinter',
    'mercedes sprinter': 'Mercedes Sprinter',
    'Mercedes Sprinter': 'Mercedes Sprinter',
    'sprinter 144': 'Mercedes Sprinter 144',
    'sprinter 170': 'Mercedes Sprinter 170',
    'SPRINTER 144': 'Mercedes Sprinter 144',
    'SPRINTER 170': 'Mercedes Sprinter 170',
    
    // Ram ProMaster variations
    'promaster': 'Ram ProMaster',
    'ProMaster': 'Ram ProMaster', 
    'ram promaster': 'Ram ProMaster',
    'Ram ProMaster': 'Ram ProMaster',
    'PROMASTER': 'Ram ProMaster',
    
    // Other common van types
    'nv200': 'Nissan NV200',
    'nissan nv200': 'Nissan NV200',
    'express': 'Chevrolet Express',
    'chevy express': 'Chevrolet Express',
    'chevrolet express': 'Chevrolet Express',
    
    // Custom/Generic terms
    'custom van': 'Custom Van',
    'Custom Van': 'Custom Van',
    'custom build': 'Custom Build',
    'Custom Build': 'Custom Build',
    'camper van': 'Camper Van',
    'Camper Van': 'Camper Van'
};

function standardizeVanTypes(vanTypesArray) {
    if (!vanTypesArray || vanTypesArray.length === 0) {
        return [];
    }
    
    const standardizedTypes = vanTypesArray
        .map(type => {
            if (typeof type !== 'string') return null;
            
            // Remove parenthetical descriptions and extra whitespace
            let cleanType = type.replace(/\s*\([^)]*\)\s*/g, '').trim();
            
            // Remove non-van descriptors
            const descriptorsToRemove = [
                'Adventure Van', 'Adventure Vans', 'Overland', 'Off-Road', '4x4', 'Luxury',
                'Adventure Vehicles', 'Van Life Builds', 'Travel Trailers', 'Nomadic Builds',
                'Rental Fleet Builds', 'Adventure Trucks', '4x4 Conversions', 'MODE Vans',
                'GXV Trucks', 'Custom Overland', 'Luxury Van'
            ];
            
            // Remove descriptors
            for (const desc of descriptorsToRemove) {
                cleanType = cleanType.replace(new RegExp(`\\b${desc}\\b`, 'gi'), '').trim();
            }
            
            // Clean up spacing
            cleanType = cleanType.replace(/\s+/g, ' ').trim();
            
            // Skip if empty or too short
            if (!cleanType || cleanType.length < 3) return null;
            
            // Apply standardization
            const standardized = VAN_TYPE_STANDARDIZATION[cleanType] || VAN_TYPE_STANDARDIZATION[cleanType.toLowerCase()];
            
            if (standardized) {
                return standardized;
            }
            
            // Skip pure descriptors
            const lowerType = cleanType.toLowerCase();
            if (lowerType === 'builds' || lowerType === 'conversions' || lowerType.length < 3) {
                return null;
            }
            
            // Apply basic capitalization
            return cleanType
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        })
        .filter(type => type !== null && type.length > 0);
    
    // Remove duplicates
    return [...new Set(standardizedTypes)];
}

async function extractBusinessName(page) {
    console.log('🏢 Extracting business name...');
    
    return await page.evaluate(() => {
        // Try multiple selectors for business name
        const nameSelectors = [
            // Logo image alt text (good for Outpost Vans)
            'img[alt*="logo" i]',
            '[class*="logo"] img',
            'img[alt*="brand" i]',
            // Standard selectors
            'h1.company-name', 'h1.business-name', 'h1.brand-name',
            '.company-header h1', '.business-header h1', 
            'h1[itemprop="name"]', '[class*="company-name"] h1',
            '.hero h1', '.header-title h1', '.page-header h1',
            'h1.title', 'h1.site-title', '.navbar-brand h1',
            'meta[property="og:site_name"]', 'meta[property="og:title"]'
        ];
        
        for (const selector of nameSelectors) {
            let element;
            let text = '';
            
            if (selector.startsWith('meta')) {
                element = document.querySelector(selector);
                if (element?.content) {
                    text = element.content.trim();
                    // Apply specific fixes to meta content
                    if (text.toLowerCase() === 'socalcustomvans.') {
                        text = 'SoCal Custom Vans';
                    }
                    // Remove trailing periods from meta content
                    text = text.replace(/\.$/, '');
                }
            } else if (selector.includes('img')) {
                element = document.querySelector(selector);
                if (element?.alt) {
                    text = element.alt.trim();
                    // Extract company name from logo alt text
                    const logoMatch = text.match(/(?:logo for |logo of |a logo for )?([^,]+?)(?:\s+that says|\s+logo|\s+brand|$)/i);
                    if (logoMatch) {
                        text = logoMatch[1].trim();
                        // Capitalize properly (title case)
                        text = text.split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        ).join(' ');
                    }
                }
            } else {
                element = document.querySelector(selector);
                if (element?.textContent) {
                    text = element.textContent.trim();
                }
            }
            
            // Clean and validate the text
            if (text && text.length > 0 && text.length < 100) {
                // Skip generic words
                const genericWords = ['home', 'welcome', 'about', 'contact', 'menu', 'navigation'];
                if (!genericWords.some(word => text.toLowerCase() === word)) {
                    return text;
                }
            }
        }
        
        // Fallback to page title cleaning
        let title = document.title;
        
        // Remove common patterns from title
        const cleanupPatterns = [
            /\s*[\||\-|–|—]\s*custom.*/i,
            /\s*[\||\-|–|—]\s*camper.*/i,
            /\s*[\||\-|–|—]\s*van.*/i,
            /\s*[\||\-|–|—]\s*conversion.*/i,
            /\s*[\||\-|–|—]\s*home\s*$/i,
            /\s*[\||\-|–|—]\s*about.*/i,
            /\s*[\||\-|–|—]\s*contact.*/i,
            /\s*[\||\-|–|—]\s*welcome.*/i,
            /^home\s*[\||\-|–|—]\s*/i,
            /^about\s*[\||\-|–|—]\s*/i,
            /^welcome\s*to\s*/i
        ];
        
        cleanupPatterns.forEach(pattern => {
            title = title.replace(pattern, '');
        });
        
        // Remove state information
        const states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
        states.forEach(state => {
            const statePattern = new RegExp(`\\s*[\||\-|–|—]?\\s*${state}\\s*[\||\-|–|—]?\\s*`, 'gi');
            title = title.replace(statePattern, ' ');
        });
        
        // Clean up business suffixes
        title = title.replace(/\s*(LLC|Inc\.?|Corp\.?|Company|Co\.?)\s*$/i, '');
        
        // Fix specific known issues
        if (title.toLowerCase() === 'socalcustomvans.') {
            title = 'SoCal Custom Vans';
        }
        
        // Remove trailing periods
        title = title.replace(/\.$/, '');
        
        // Final cleanup
        title = title.replace(/\s+/g, ' ').trim();
        
        return title;
    });
}

async function extractContactInfo(page) {
    console.log('📞 Extracting contact information...');
    
    // First, try to find and navigate to contact page
    const contactPageUrl = await page.evaluate(() => {
        // Use proper selectors - can't use :contains in querySelectorAll
        const contactLinks = Array.from(document.querySelectorAll('a[href*="contact"], a[href*="about"]'));
        
        // Also check for links with text content
        const allLinks = Array.from(document.querySelectorAll('a'));
        const textLinks = allLinks.filter(link => {
            const text = link.textContent.toLowerCase();
            return (text.includes('contact') || text.includes('about')) && 
                   link.href && 
                   !link.href.includes('mailto:') && 
                   !link.href.includes('tel:');
        });
        
        const combinedLinks = [...new Set([...contactLinks, ...textLinks])];
        
        for (const link of combinedLinks) {
            if (link.href && !link.href.includes('mailto:') && !link.href.includes('tel:')) {
                return link.href;
            }
        }
        return null;
    });
    
    let contactData = { phone: '', email: '', address: '', city: '', zip: '' };
    
    // Extract from current page first
    const currentPageData = await extractContactFromPage(page);
    Object.assign(contactData, currentPageData);
    
    // If we found a contact page and don't have complete data, visit it
    if (contactPageUrl && (!contactData.phone || !contactData.email)) {
        try {
            await page.goto(contactPageUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
            await page.waitForTimeout(2000);
            
            const contactPageData = await extractContactFromPage(page);
            // Merge data, preferring non-empty values
            Object.keys(contactPageData).forEach(key => {
                if (contactPageData[key] && !contactData[key]) {
                    contactData[key] = contactPageData[key];
                }
            });
        } catch (error) {
            console.log('⚠️ Could not load contact page:', error.message);
        }
    }
    
    return contactData;
}

async function extractContactFromPage(page) {
    return await page.evaluate(() => {
        const data = { phone: '', email: '', address: '', city: '', zip: '' };
        
        // Helper function to format phone
        function formatPhone(phone) {
            const cleaned = phone.replace(/[^\d]/g, '');
            if (cleaned.length === 10) {
                return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
            }
            return phone;
        }
        
        // Phone extraction patterns
        const phonePatterns = [
            /(?:phone|tel|call|contact|p|t):?\s*:?\s*([\(\)\d\s\-\.]+)/gi,
            /\b(\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{4})\b/g,
            /\b(\(\d{3}\)\s*\d{3}[\s\-\.]?\d{4})\b/g
        ];
        
        // Email extraction pattern - more strict to avoid contamination
        const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
        
        // Search in various page sections - PRIORITIZE FOOTER
        const searchSections = [
            document.querySelector('footer'),  // Footer first - most likely to have clean contact info
            document.querySelector('header'),
            document.querySelector('.contact'),
            document.querySelector('#contact'),
            document.querySelector('[class*="contact"]'),
            document.querySelector('[id*="contact"]'),
            document.querySelector('.footer'),
            document.querySelector('#footer'),
            document.querySelector('[class*="footer"]'),
            document.body
        ].filter(Boolean);
        
        for (const section of searchSections) {
            const text = section.textContent;
            const html = section.innerHTML;
            
            // Extract phone - prioritize clean patterns
            if (!data.phone) {
                // First check for tel: links
                const telLink = section.querySelector('a[href^="tel:"]');
                if (telLink) {
                    const phone = telLink.href.replace('tel:', '').trim();
                    if (phone && phone.length >= 10) {
                        data.phone = formatPhone(phone);
                    }
                }
                
                // Then try to find clean phone numbers (prioritize common formats)
                if (!data.phone) {
                    // Look for clean phone patterns first - including concatenated formats
                    const cleanPhonePatterns = [
                        /CA(\d{3}\.\d{3}\.\d{4})Contact/g,  // CA619.812.1903Contact (Sandy Vans specific)
                        /\b(\d{3}\.\d{3}\.\d{4})\b/g,  // 619.812.1903
                        /\b(\(\d{3}\)\s*\d{3}[\s\-\.]?\d{4})\b/g,  // (619) 812-1903
                        /\b(\d{3}[\s\-]\d{3}[\s\-]\d{4})\b/g  // 619-812-1903 or 619 812 1903
                    ];
                    
                    for (const pattern of cleanPhonePatterns) {
                        pattern.lastIndex = 0; // Reset regex state
                        const match = pattern.exec(text);
                        if (match) {
                            // Get the captured group if it exists, otherwise use the full match
                            const phoneText = match[1] || match[0];
                            const phone = phoneText.replace(/[^\d]/g, '');
                            
                            if (phone.length === 10) {
                                data.phone = formatPhone(phone);
                                break;
                            }
                        }
                    }
                }
            }
            
            // Extract email - cleaner extraction
            if (!data.email) {
                // First check for mailto: links
                const mailtoLink = section.querySelector('a[href^="mailto:"]');
                if (mailtoLink) {
                    const email = mailtoLink.href.replace('mailto:', '').split('?')[0].trim();
                    if (email && email.includes('@')) {
                        data.email = email.toLowerCase();
                    }
                }
                
                // Then try pattern with better filtering and specific Sandy Vans handling
                if (!data.email) {
                    // First try to extract email from concatenated footer text (Sandy Vans specific)
                    // Look for pattern like "Contact@sandyvans.comShop" and extract just the email
                    const concatenatedEmailMatch = text.match(/([A-Za-z]+@[A-Za-z]+\.[A-Za-z]+)(?:Shop|Hours)/i);
                    if (concatenatedEmailMatch) {
                        data.email = concatenatedEmailMatch[1].toLowerCase();
                    } else {
                        const emailMatches = text.match(emailPattern);
                        if (emailMatches) {
                            // Filter out placeholder emails and find the cleanest one
                            const validEmails = emailMatches.filter(email => 
                                !email.includes('example.com') && 
                                !email.includes('user@') &&
                                !email.includes('test@') &&
                                !email.includes('demo@') &&
                                email.length < 50  // Avoid contaminated long strings
                            );
                            
                            if (validEmails.length > 0) {
                                // Prefer shorter, cleaner emails (likely to be less contaminated)
                                validEmails.sort((a, b) => a.length - b.length);
                                data.email = validEmails[0].toLowerCase();
                            }
                        }
                    }
                }
            }
            
            // Extract address - enhanced patterns for various formats
            if (!data.address) {
                // Try to find complete address with city and state first
                const completeAddressPatterns = [
                    // Full address with city, state: "123 Main St, City, ST"
                    /(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl|Plaza|Pkwy|Parkway|Circle|Cir|Trail|Tr)),\s*[A-Za-z\s]+,\s*[A-Z]{2}/gi,
                    // Address with ZIP: "123 Main St, City, CA 90210"
                    /(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl|Plaza|Pkwy|Parkway|Circle|Cir|Trail|Tr)),\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}/gi
                ];
                
                for (const pattern of completeAddressPatterns) {
                    const matches = text.match(pattern);
                    if (matches) {
                        // Extract ONLY the street address portion (first captured group)
                        data.address = matches[0].split(',')[0].trim();
                        break;
                    }
                }
                
                // If no complete address found, try to find just street address
                if (!data.address) {
                    const streetPatterns = [
                        /(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl|Plaza|Pkwy|Parkway|Circle|Cir|Trail|Tr))/gi
                    ];
                    
                    for (const pattern of streetPatterns) {
                        const matches = text.match(pattern);
                        if (matches) {
                            // Clean up the street address - remove extra whitespace and unwanted text
                            data.address = matches[0].trim().replace(/\s+/g, ' ');
                            break;
                        }
                    }
                }
            }
            
            if (data.phone && data.email) break;
        }
        
        // Parse city and zip from address if we have one
        if (data.address) {
            // Extract city and zip from address patterns like:
            // "123 Main St, City, CA 90210" or "123 Main St, City, CA"
            const addressParts = data.address.split(',').map(part => part.trim());
            
            if (addressParts.length >= 3) {
                // Format: street, city, state [zip]
                data.city = addressParts[1];
                
                // Check if state part contains zip code
                const stateZipPart = addressParts[2];
                const zipMatch = stateZipPart.match(/\b(\d{5})\b/);
                if (zipMatch) {
                    data.zip = zipMatch[1];
                }
            } else if (addressParts.length === 2) {
                // Might be "street, city CA" format
                const secondPart = addressParts[1];
                const cityStateMatch = secondPart.match(/^(.+?)\s+[A-Z]{2}$/);
                if (cityStateMatch) {
                    data.city = cityStateMatch[1];
                }
            }
        }
        
        // Clean up email - remove mailto: prefix if present
        if (data.email && data.email.startsWith('mailto:')) {
            data.email = data.email.replace('mailto:', '');
        }
        
        return data;
    });
}

async function extractDescription(page) {
    console.log('📝 Extracting description...');
    
    return await page.evaluate(() => {
        // Try meta description first
        const metaDesc = document.querySelector('meta[name="description"], meta[property="og:description"]');
        if (metaDesc?.content) {
            return metaDesc.content.trim();
        }
        
        // Try various content selectors
        const descSelectors = [
            '.about-content', '.about-text', '.about-us',
            '.company-description', '.business-description',
            '.hero-text', '.hero-description', '.hero-content',
            'section.about p', '#about p', '.about p',
            '.content p:first-of-type', 'main p:first-of-type'
        ];
        
        for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element?.textContent) {
                const text = element.textContent.trim();
                if (text.length > 50 && text.length < 500) {
                    return text;
                }
            }
        }
        
        // Fallback to first substantial paragraph
        const paragraphs = document.querySelectorAll('p');
        for (const p of paragraphs) {
            const text = p.textContent.trim();
            if (text.length > 50 && text.length < 500 && 
                !text.includes('cookie') && !text.includes('privacy') &&
                text.split(' ').length > 10) {
                return text;
            }
        }
        
        return '';
    });
}

async function extractSocialMedia(page) {
    console.log('🌐 Extracting social media links...');
    
    return await page.evaluate(() => {
        const socialMedia = {};
        
        // Common social media domains
        const socialPatterns = {
            facebook: /(?:facebook\.com|fb\.com)\/([^\/\?]+)/i,
            instagram: /instagram\.com\/([^\/\?]+)/i,
            youtube: /(?:youtube\.com\/(?:channel|c|user)\/|youtube\.com\/@)([^\/\?]+)/i,
            twitter: /twitter\.com\/([^\/\?]+)/i,
            linkedin: /linkedin\.com\/(?:company|in)\/([^\/\?]+)/i,
            tiktok: /tiktok\.com\/@([^\/\?]+)/i
        };
        
        // Search all links on the page
        const links = document.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const href = link.href;
            
            for (const [platform, pattern] of Object.entries(socialPatterns)) {
                if (pattern.test(href) && !socialMedia[platform]) {
                    // Clean up the URL
                    let cleanUrl = href.split('?')[0].split('#')[0];
                    cleanUrl = cleanUrl.replace(/\/$/, ''); // Remove trailing slash
                    
                    // Ensure HTTPS
                    cleanUrl = cleanUrl.replace(/^http:/, 'https:');
                    
                    socialMedia[platform] = cleanUrl;
                }
            }
        });
        
        // Also check for social icons in footer/header
        const iconSelectors = [
            '[class*="facebook"]', '[class*="instagram"]', '[class*="youtube"]',
            '[class*="twitter"]', '[class*="linkedin"]', '[class*="tiktok"]',
            '[aria-label*="Facebook"]', '[aria-label*="Instagram"]', 
            '[aria-label*="YouTube"]', '[aria-label*="Twitter"]'
        ];
        
        iconSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const parent = el.closest('a');
                if (parent?.href) {
                    for (const [platform, pattern] of Object.entries(socialPatterns)) {
                        if (pattern.test(parent.href) && !socialMedia[platform]) {
                            let cleanUrl = parent.href.split('?')[0].split('#')[0];
                            cleanUrl = cleanUrl.replace(/\/$/, '').replace(/^http:/, 'https:');
                            socialMedia[platform] = cleanUrl;
                        }
                    }
                }
            });
        });
        
        // ALWAYS RETURN OBJECT FORMAT (not array) for UI compatibility
        return socialMedia;
    });
}

async function extractVanTypes(page) {
    console.log('🚐 Extracting van types...');
    
    const vanTypes = await page.evaluate(() => {
        const vanKeywords = [
            'sprinter', 'transit', 'promaster', 'express', 'nv200', 'savana',
            'econoline', 'metris', 'crafter', 'daily', 'ducato',
            'custom van', 'camper van', 'conversion'
        ];
        
        const text = document.body.innerText.toLowerCase();
        const foundTypes = [];
        
        // Look for van type mentions in text
        vanKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                // Try to extract the full context around the keyword
                const regex = new RegExp(`\\b([\\w\\s]*${keyword}[\\w\\s]*)\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    matches.forEach(match => {
                        const cleaned = match.trim();
                        if (cleaned.length > 3 && cleaned.length < 50) {
                            foundTypes.push(cleaned);
                        }
                    });
                }
            }
        });
        
        // Also look for van types in structured data like lists
        const listItems = document.querySelectorAll('li, .van-type, .vehicle-type, [class*="van"], [class*="vehicle"]');
        listItems.forEach(item => {
            const text = item.textContent.toLowerCase().trim();
            vanKeywords.forEach(keyword => {
                if (text.includes(keyword) && text.length < 100) {
                    foundTypes.push(text);
                }
            });
        });
        
        return [...new Set(foundTypes)].slice(0, 8); // Limit to prevent spam
    });
    
    // Apply standardization before returning
    const standardizedVanTypes = standardizeVanTypes(vanTypes);
    
    console.log(`🚐 Found ${standardizedVanTypes.length} standardized van types: ${standardizedVanTypes.join(', ')}`);
    return standardizedVanTypes;
}

async function extractAmenities(page) {
    console.log('🔧 Extracting amenities and features...');
    
    return await page.evaluate(() => {
        const text = document.body.textContent.toLowerCase();
        const amenities = [];
        
        // Comprehensive amenity detection patterns
        const amenityPatterns = {
            // Power & Electrical
            'Solar Power': [/solar\s*power/gi, /solar\s*panel/gi, /solar\s*system/gi, /solar(?!\s*eclipse)/gi],
            'Lithium Batteries': [/lithium\s*batter/gi, /lithium\s*power/gi, /battle\s*born/gi],
            'Inverter': [/inverter/gi, /power\s*inverter/gi, /2000w\s*inverter/gi, /3000w\s*inverter/gi],
            'Shore Power': [/shore\s*power/gi, /external\s*power/gi, /30\s*amp/gi, /50\s*amp/gi],
            'Generator': [/generator/gi, /onan/gi, /honda\s*generator/gi],
            'LED Lighting': [/led\s*light/gi, /led\s*strip/gi, /ambient\s*light/gi],
            '12V System': [/12v\s*system/gi, /12\s*volt/gi, /dual\s*battery/gi],
            
            // Water Systems
            'Fresh Water Tank': [/fresh\s*water/gi, /water\s*tank/gi, /40\s*gallon/gi, /30\s*gallon/gi],
            'Gray Water Tank': [/gray\s*water/gi, /grey\s*water/gi, /waste\s*water/gi],
            'Water Heater': [/water\s*heater/gi, /hot\s*water/gi, /tankless\s*heater/gi, /truma/gi],
            'Water Pump': [/water\s*pump/gi, /pressure\s*pump/gi, /shurflo/gi],
            'Plumbing': [/plumbing/gi, /pex\s*plumbing/gi, /water\s*system/gi],
            
            // Kitchen & Appliances
            'Kitchen': [/kitchen/gi, /kitchenette/gi, /galley/gi, /cooking\s*area/gi],
            'Refrigerator': [/refrigerator/gi, /fridge/gi, /dometic/gi, /norcold/gi, /12v\s*fridge/gi],
            'Induction Cooktop': [/induction\s*cooktop/gi, /induction\s*stove/gi, /electric\s*cooktop/gi],
            'Propane Stove': [/propane\s*stove/gi, /gas\s*stove/gi, /2\s*burner/gi, /3\s*burner/gi],
            'Microwave': [/microwave/gi, /convection\s*microwave/gi],
            'Sink': [/sink/gi, /stainless\s*sink/gi, /undermount\s*sink/gi],
            'Custom Cabinetry': [/custom\s*cabinet/gi, /cabinetry/gi, /hardwood\s*cabinet/gi],
            'Countertops': [/countertop/gi, /quartz\s*counter/gi, /butcher\s*block/gi],
            
            // Bathroom & Sanitation
            'Bathroom': [/bathroom/gi, /wet\s*bath/gi, /full\s*bath/gi, /half\s*bath/gi],
            'Shower': [/shower/gi, /cassette\s*shower/gi, /tiled\s*shower/gi],
            'Toilet': [/toilet/gi, /cassette\s*toilet/gi, /composting\s*toilet/gi, /nature\'s\s*head/gi],
            'Ventilation Fan': [/vent\s*fan/gi, /exhaust\s*fan/gi, /bathroom\s*fan/gi, /maxxfan/gi],
            
            // Climate Control
            'Air Conditioning': [/air\s*conditioning/gi, /ac\s*unit/gi, /dometic\s*ac/gi, /roof\s*ac/gi],
            'Heating': [/heating/gi, /furnace/gi, /diesel\s*heater/gi, /webasto/gi, /espar/gi],
            'Insulation': [/insulation/gi, /spray\s*foam/gi, /thinsulate/gi, /polyiso/gi],
            'Roof Vent': [/roof\s*vent/gi, /fantastic\s*fan/gi, /maxxair/gi, /ventilation/gi],
            
            // Sleeping & Living
            'Bed': [/bed/gi, /queen\s*bed/gi, /full\s*bed/gi, /murphy\s*bed/gi, /convertible\s*bed/gi],
            'Dinette': [/dinette/gi, /dining\s*table/gi, /convertible\s*table/gi],
            'Seating': [/seating/gi, /bench\s*seat/gi, /swivel\s*seat/gi, /captain\'s\s*chair/gi],
            'Storage': [/storage/gi, /overhead\s*storage/gi, /under\s*bed\s*storage/gi, /garage/gi],
            'Flooring': [/flooring/gi, /luxury\s*vinyl/gi, /hardwood\s*floor/gi, /tile\s*floor/gi],
            
            // Exterior Features
            'Awning': [/awning/gi, /dometic\s*awning/gi, /fiamma\s*awning/gi, /retractable\s*awning/gi],
            'Roof Rack': [/roof\s*rack/gi, /thule\s*rack/gi, /yakima\s*rack/gi],
            'Bike Rack': [/bike\s*rack/gi, /bicycle\s*rack/gi, /rear\s*bike/gi],
            'Ladder': [/ladder/gi, /rear\s*ladder/gi, /access\s*ladder/gi],
            'Running Boards': [/running\s*board/gi, /side\s*step/gi, /step\s*bar/gi],
            'Backup Camera': [/backup\s*camera/gi, /rear\s*camera/gi, /reversing\s*camera/gi],
            
            // Technology & Entertainment
            'WiFi': [/wifi/gi, /wi-fi/gi, /internet/gi, /cellular\s*booster/gi],
            'TV': [/television/gi, /smart\s*tv/gi, /32\s*inch\s*tv/gi, /entertainment/gi],
            'Sound System': [/sound\s*system/gi, /stereo/gi, /bluetooth\s*speaker/gi, /jbl/gi],
            'USB Outlets': [/usb\s*outlet/gi, /usb\s*port/gi, /charging\s*port/gi],
            
            // Off-Grid & Adventure
            'Off-Grid Package': [/off[\s-]?grid/gi, /boondocking/gi, /dry\s*camping/gi],
            '4x4 Conversion': [/4x4/gi, /four\s*wheel\s*drive/gi, /awd/gi, /all\s*wheel/gi],
            'Lift Kit': [/lift\s*kit/gi, /suspension\s*lift/gi, /ground\s*clearance/gi],
            'Skid Plates': [/skid\s*plate/gi, /underbody\s*protection/gi, /armor/gi],
            'Recovery Gear': [/recovery\s*gear/gi, /winch/gi, /tow\s*strap/gi],
            
            // Custom Features
            'Custom Woodwork': [/custom\s*wood/gi, /hardwood/gi, /bamboo/gi, /teak/gi],
            'Custom Paint': [/custom\s*paint/gi, /paint\s*job/gi, /vinyl\s*wrap/gi],
            'Window Tinting': [/window\s*tint/gi, /tinted\s*window/gi, /privacy\s*glass/gi],
            'Blackout Curtains': [/blackout\s*curtain/gi, /privacy\s*curtain/gi, /window\s*cover/gi]
        };
        
        // Check each amenity pattern
        Object.keys(amenityPatterns).forEach(amenity => {
            const patterns = amenityPatterns[amenity];
            for (const pattern of patterns) {
                if (text.match(pattern)) {
                    if (!amenities.includes(amenity)) {
                        amenities.push(amenity);
                    }
                    break; // Found this amenity, move to next
                }
            }
        });
        
        // If no specific amenities found, add generic ones based on context
        if (amenities.length === 0) {
            if (text.includes('custom') || text.includes('conversion')) {
                amenities.push('Custom Build');
            }
            if (text.includes('van') || text.includes('camper')) {
                amenities.push('Van Conversion');
            }
        }
        
        // Sort amenities for consistency
        return amenities.sort();
    });
}

module.exports = {
    extractBusinessName,
    extractContactInfo,
    extractDescription,
    extractSocialMedia,
    extractVanTypes,
    extractAmenities
};
