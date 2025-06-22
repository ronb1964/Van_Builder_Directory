// Data extraction utilities for van builder scraper

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
                    /(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl|Plaza|Pkwy|Parkway|Circle|Cir|Trail|Tr),\s*[A-Za-z\s]+,\s*[A-Z]{2})/gi,
                    // Address with ZIP: "123 Main St, City, CA 90210"
                    /(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl|Plaza|Pkwy|Parkway|Circle|Cir|Trail|Tr),\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5})/gi
                ];
                
                for (const pattern of completeAddressPatterns) {
                    const matches = text.match(pattern);
                    if (matches) {
                        data.address = matches[0].trim();
                        break;
                    }
                }
                
                // If no complete address found, try to build one from parts
                if (!data.address) {
                    let streetAddress = '';
                    let city = '';
                    let state = 'CA'; // Default for California builders
                    
                    // Find street address
                    const streetPatterns = [
                        /(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl|Plaza|Pkwy|Parkway|Circle|Cir|Trail|Tr))/gi
                    ];
                    
                    for (const pattern of streetPatterns) {
                        const matches = text.match(pattern);
                        if (matches) {
                            // Clean up the street address - remove extra whitespace and unwanted text
                            streetAddress = matches[0].trim().replace(/\s+/g, ' ');
                            break;
                        }
                    }
                    
                    // Find city - look for California cities specifically
                    const cityPatterns = [
                        /\b(Oceanside|San Diego|Los Angeles|San Francisco|Sacramento|Oakland|Fresno|Long Beach|Bakersfield|Anaheim|Santa Ana|Riverside|Stockton|Irvine|Fremont|San Bernardino|Modesto|Fontana|Oxnard|Moreno Valley|Huntington Beach|Glendale|Santa Clarita|Garden Grove|Oceanside|Rancho Cucamonga|Santa Rosa|Ontario|Lancaster|Elk Grove|Corona|Palmdale|Salinas|Pomona|Hayward|Escondido|Torrance|Sunnyvale|Orange|Fullerton|Pasadena|Thousand Oaks|Visalia|Simi Valley|Concord|Roseville|Rockville|Santa Clara|Vallejo|Victorville|Fairfield|Inglewood|Antioch|Temecula|Richmond|West Covina|Norwalk|Carlsbad|Daly City|Costa Mesa|Rialto|Chula Vista|Burbank|San Mateo|Mission Viejo|Compton|Santa Maria|El Monte|Downey|Redding|San Leandro|Livermore|Whittier|Lakewood|Merced|Milpitas|Union City|San Buenaventura|Carson|San Marcos|Redwood City|West Sacramento|Turlock|Napa|Hemet|Citrus Heights|Tracy|Alhambra|Tustin|San Rafael|Pleasanton|Bellflower|Redlands|Manteca|Lynwood|Woodland|Hawthorne|Perris|El Cajon|Clovis|Davis|Santa Monica|Pico Rivera|Vacaville|Palo Alto|Camarillo|Walnut Creek|Upland|Chico|Whittier|Newport Beach|San Clemente|Porterville|Indio|Menifee|Tulare|Cupertino|Delano|Chino|Buena Park|Campbell|San Luis Obispo|Petaluma|Mountain View|Los Alamitos|Westminster|Vista|Auburn|Carlsbad|Riverside)\b/gi
                    ];
                    
                    for (const pattern of cityPatterns) {
                        const match = text.match(pattern);
                        if (match) {
                            city = match[0];
                            break;
                        }
                    }
                    
                    // Construct address if we have parts
                    if (streetAddress) {
                        if (city) {
                            data.address = `${streetAddress}, ${city}, ${state}`;
                        } else {
                            data.address = streetAddress;
                        }
                    }
                }
            }
            
            if (data.phone && data.email) break;
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
        
        return socialMedia;
    });
}

async function extractVanTypes(page) {
    console.log('🚐 Extracting van types and specialties...');
    
    return await page.evaluate(() => {
        const text = document.body.textContent.toLowerCase();
        
        // Van manufacturers and models to look for
        const vanTypes = {
            'Mercedes Sprinter': [
                /mercedes[\s\-]?sprinter/gi,
                /sprinter[\s\-]?van/gi,
                /sprinter[\s\-]?2500/gi,
                /sprinter[\s\-]?3500/gi,
                /mb[\s\-]?sprinter/gi,
                /mercedes[\s\-]?benz[\s\-]?sprinter/gi
            ],
            'Ford Transit': [
                /ford[\s\-]?transit/gi,
                /transit[\s\-]?van/gi,
                /transit[\s\-]?150/gi,
                /transit[\s\-]?250/gi,
                /transit[\s\-]?350/gi
            ],
            'Ram ProMaster': [
                /ram[\s\-]?promaster/gi,
                /promaster[\s\-]?van/gi,
                /promaster[\s\-]?1500/gi,
                /promaster[\s\-]?2500/gi,
                /promaster[\s\-]?3500/gi,
                /dodge[\s\-]?promaster/gi
            ],
            'Nissan NV200': [
                /nissan[\s\-]?nv200/gi,
                /nv200[\s\-]?van/gi
            ],
            'Chevrolet Express': [
                /chevrolet[\s\-]?express/gi,
                /chevy[\s\-]?express/gi,
                /express[\s\-]?van/gi,
                /express[\s\-]?2500/gi,
                /express[\s\-]?3500/gi
            ],
            'GMC Savana': [
                /gmc[\s\-]?savana/gi,
                /savana[\s\-]?van/gi,
                /savana[\s\-]?2500/gi,
                /savana[\s\-]?3500/gi
            ]
        };
        
        // Find matching van types
        const foundVanTypes = [];
        Object.keys(vanTypes).forEach(vanType => {
            const patterns = vanTypes[vanType];
            for (const pattern of patterns) {
                if (text.match(pattern)) {
                    foundVanTypes.push(vanType);
                    break; // Don't add duplicates
                }
            }
        });
        
        // Also look for general specialties
        const specialties = {
            'Van Conversion': /van[\s\-]?conversion/gi,
            'Camper Van': /camper[\s\-]?van/gi,
            'Class B RV': /class[\s\-]?b[\s\-]?rv/gi,
            'Adventure Van': /adventure[\s\-]?van/gi,
            'Overland': /overland/gi,
            'Off-Road': /off[\s\-]?road/gi,
            '4x4': /4x4/gi,
            'AWD': /awd/gi,
            'Luxury': /luxury/gi,
            'Custom Build': /custom[\s\-]?build/gi
        };
        
        const foundSpecialties = [];
        Object.keys(specialties).forEach(specialty => {
            if (text.match(specialties[specialty])) {
                foundSpecialties.push(specialty);
            }
        });
        
        // Create a combined description
        let vanTypeDescription = '';
        
        if (foundVanTypes.length > 0) {
            vanTypeDescription = foundVanTypes.join(', ');
            
            // Add specialties if we have them
            if (foundSpecialties.length > 0) {
                // Filter out redundant terms
                const nonRedundantSpecialties = foundSpecialties.filter(s => 
                    !['Van Conversion', 'Camper Van', 'Custom Build'].includes(s)
                );
                
                if (nonRedundantSpecialties.length > 0) {
                    vanTypeDescription += ' (' + nonRedundantSpecialties.slice(0, 3).join(', ') + ')';
                }
            }
        } else if (foundSpecialties.length > 0) {
            // If no specific van types found, use specialties
            vanTypeDescription = foundSpecialties.slice(0, 3).join(', ');
        } else {
            // Default fallback
            vanTypeDescription = 'Custom Van';
        }
        
        return {
            vanTypes: foundVanTypes,
            specialties: foundSpecialties,
            description: vanTypeDescription
        };
    });
}

module.exports = {
    extractBusinessName,
    extractContactInfo,
    extractDescription,
    extractSocialMedia,
    extractVanTypes
};
