// Data extraction utilities for van builder scraper

async function extractBusinessName(page) {
    console.log('🏢 Extracting business name...');
    
    return await page.evaluate(() => {
        // Try multiple selectors for business name
        const nameSelectors = [
            'h1.company-name', 'h1.business-name', 'h1.brand-name',
            '.company-header h1', '.business-header h1', 
            'h1[itemprop="name"]', '[class*="company-name"] h1',
            '.hero h1', '.header-title h1', '.page-header h1',
            'h1.title', 'h1.site-title', '.navbar-brand h1',
            'meta[property="og:site_name"]', 'meta[property="og:title"]'
        ];
        
        for (const selector of nameSelectors) {
            let element;
            if (selector.startsWith('meta')) {
                element = document.querySelector(selector);
                if (element?.content) {
                    return element.content.trim();
                }
            } else {
                element = document.querySelector(selector);
                if (element?.textContent) {
                    return element.textContent.trim();
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
        
        // Search in various page sections
        const searchSections = [
            document.querySelector('header'),
            document.querySelector('footer'),
            document.querySelector('.contact'),
            document.querySelector('#contact'),
            document.querySelector('[class*="contact"]'),
            document.querySelector('[id*="contact"]'),
            document.body
        ].filter(Boolean);
        
        for (const section of searchSections) {
            const text = section.textContent;
            const html = section.innerHTML;
            
            // Extract phone
            if (!data.phone) {
                // First check for tel: links
                const telLink = section.querySelector('a[href^="tel:"]');
                if (telLink) {
                    const phone = telLink.href.replace('tel:', '').trim();
                    if (phone && phone.length >= 10) {
                        data.phone = formatPhone(phone);
                    }
                }
                
                // Then try patterns
                if (!data.phone) {
                    for (const pattern of phonePatterns) {
                        const matches = text.match(pattern);
                        if (matches) {
                            for (const match of matches) {
                                const phone = match.replace(/[^\d]/g, '');
                                if (phone.length >= 10 && phone.length <= 11) {
                                    // Make sure this isn't part of an email
                                    const surroundingText = text.substring(
                                        Math.max(0, text.indexOf(match) - 10),
                                        Math.min(text.length, text.indexOf(match) + match.length + 10)
                                    );
                                    if (!surroundingText.includes('@')) {
                                        data.phone = formatPhone(phone);
                                        break;
                                    }
                                }
                            }
                            if (data.phone) break;
                        }
                    }
                }
            }
            
            // Extract email
            if (!data.email) {
                // First check for mailto: links
                const mailtoLink = section.querySelector('a[href^="mailto:"]');
                if (mailtoLink) {
                    const email = mailtoLink.href.replace('mailto:', '').split('?')[0].trim();
                    if (email && email.includes('@')) {
                        data.email = email.toLowerCase();
                    }
                }
                
                // Then try pattern
                if (!data.email) {
                    const emailMatches = text.match(emailPattern);
                    if (emailMatches) {
                        // Filter out placeholder emails
                        const validEmail = emailMatches.find(email => 
                            !email.includes('example.com') && 
                            !email.includes('user@') &&
                            !email.includes('test@') &&
                            !email.includes('demo@')
                        );
                        if (validEmail) {
                            data.email = validEmail.toLowerCase();
                        }
                    }
                }
            }
            
            // Extract address
            if (!data.address) {
                // Common address patterns
                const addressPatterns = [
                    /(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl)[^\n]*)/gi,
                    /(\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5})/gi
                ];
                
                for (const pattern of addressPatterns) {
                    const match = text.match(pattern);
                    if (match) {
                        data.address = match[0].trim();
                        break;
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

module.exports = {
    extractBusinessName,
    extractContactInfo,
    extractDescription,
    extractSocialMedia
};
