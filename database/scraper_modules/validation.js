// Validation utilities for van builder scraper

function validateVanConversion(builderData) {
    const { name = '', website = '', description = '' } = builderData;
    
    // Combine all text for analysis
    const text = `${name} ${description}`.toLowerCase();
    
    console.log(`🔍 Validating van conversion business: ${name}`);
    
    // Check for directory/listing sites to reject
    const rejectPatterns = [
        /\b(directory|guide|buyers?\s+guide|article|blog|list|top\s+\d+|best\s+\d+)\b/i,
        /\b(yelp|search\s+results|marketplace|portal|listings?)\b/i,
        /\b(paul\s+sherry|gmc\s+conversion\s+vans)\b/i
    ];
    
    for (const pattern of rejectPatterns) {
        if (pattern.test(name)) {
            console.log(`❌ REJECTED: ${name} - Matches rejection pattern: ${pattern}`);
            return { isValid: false, reason: 'Directory or listing site' };
        }
    }
    
    // Van-related keywords
    const vanKeywords = [
        'van', 'camper', 'rv', 'conversion', 'sprinter', 'transit', 'promaster',
        'campervan', 'motorhome', 'recreational vehicle', 'adventure vehicle',
        'overland', 'vanlife', 'custom van', 'van build', 'upfitter',
        'mobile home', 'tiny home on wheels', 'nomad', 'rv conversion'
    ];
    
    // Business type keywords
    const businessKeywords = [
        'llc', 'inc', 'company', 'corp', 'enterprises', 'solutions',
        'custom', 'builds', 'conversions', 'outfitters', 'fabrication'
    ];
    
    // Calculate score
    let score = 0;
    
    // Check for van conversion keywords
    vanKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
            score += keyword.includes('van') ? 2 : 1;
        }
    });
    
    // Check for business indicators
    businessKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
            score += 1;
        }
    });
    
    // Bonus for RV companies (many do van conversions)
    if (text.includes('rv') && !text.includes('food')) {
        score += 1;
    }
    
    // Bonus for having a business website domain
    if (website && !website.includes('yelp') && !website.includes('google') && 
        !website.includes('facebook') && !website.includes('expeditionportal') &&
        !website.includes('parkedinparadise') && !website.includes('vanlifedirectory')) {
        score += 1;
    }
    
    // Must have minimum score to be considered valid
    if (score < 1) {
        console.log(`❌ REJECTED: ${name} - Van conversion score too low: ${score}/1`);
        return { isValid: false, reason: `Insufficient van conversion indicators (score: ${score})` };
    }
    
    console.log(`✅ VALIDATED: ${builderData.name} - Van conversion score: ${score}/1`);
    return { isValid: true, reason: `Van conversion validated (score: ${score})` };
}

function verifyLocationMatch(locationData, targetState) {
    const { foundInContent, hasStateAddress, hasOtherStateAddress, otherStateAddresses } = locationData;
    
    let score = 0;
    
    // Found state mentioned in content
    if (foundInContent) {
        score += 3;
    }
    
    // Has specific state address
    if (hasStateAddress) {
        score += 3;
    }
    
    // Penalty for other state addresses
    if (hasOtherStateAddress) {
        score -= 5;
        console.log(`⚠️ Found other state addresses: ${otherStateAddresses.join(', ')}`);
    }
    
    console.log(`📍 Location verification score: ${score} (threshold: 4)`);
    
    return {
        isValid: score >= 4,
        score: score,
        reason: score >= 4 ? 'Location verified' : 'Location not verified'
    };
}

function cleanBuilderData(builderData) {
    // Clean up the builder data before saving
    const cleaned = { ...builderData };
    
    // Clean phone number
    if (cleaned.phone) {
        cleaned.phone = cleanPhone(cleaned.phone);
    }
    
    // Clean email
    if (cleaned.email) {
        cleaned.email = cleaned.email.toLowerCase().trim();
    }
    
    // Clean website URL
    if (cleaned.website) {
        cleaned.website = cleaned.website.trim();
        // Ensure it starts with http/https
        if (!cleaned.website.match(/^https?:\/\//)) {
            cleaned.website = 'https://' + cleaned.website;
        }
    }
    
    // Clean social media URLs
    if (cleaned.social_media) {
        Object.keys(cleaned.social_media).forEach(platform => {
            if (cleaned.social_media[platform]) {
                cleaned.social_media[platform] = cleaned.social_media[platform].trim();
            }
        });
    }
    
    // Ensure arrays exist
    cleaned.van_types = cleaned.van_types || [];
    cleaned.amenities = cleaned.amenities || [];
    cleaned.photos = cleaned.photos || [];
    
    return cleaned;
}

function cleanPhone(phone) {
    if (!phone) return phone;
    
    // Extract just digits
    const digits = phone.replace(/[^\d]/g, '');
    
    // Format as (XXX) XXX-XXXX if we have 10 digits
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    
    return phone;
}

module.exports = {
    validateVanConversion,
    verifyLocationMatch,
    cleanBuilderData,
    cleanPhone
};
