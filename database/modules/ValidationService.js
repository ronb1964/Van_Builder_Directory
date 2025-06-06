/**
 * Validation Service Module
 * Handles builder validation and location verification
 */

class ValidationService {
    constructor() {
        // State abbreviations mapping
        this.stateAbbreviations = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
            'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
            'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
            'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
            'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
            'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
            'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
            'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
    }

    getStateAbbreviation(state) {
        return this.stateAbbreviations[state];
    }

    async verifyBuilderLocation(page, result, targetState) {
        console.log(`🔍 Verifying location for: ${result.title}`);
        
        // Check if state is mentioned in title or snippet
        const stateVariations = [
            targetState.toLowerCase(),
            this.getStateAbbreviation(targetState)?.toLowerCase()
        ].filter(Boolean);
        
        const titleLower = result.title.toLowerCase();
        const snippetLower = result.snippet.toLowerCase();
        
        const mentionedInSearch = stateVariations.some(state => 
            titleLower.includes(state) || snippetLower.includes(state)
        );

        try {
            await page.goto(result.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(2000);

            const locationData = await page.evaluate((targetState) => {
                const bodyText = document.body.innerText.toLowerCase();
                const htmlContent = document.documentElement.innerHTML.toLowerCase();
                
                // Alabama-specific area codes for phone verification
                const alabamaAreaCodes = ['205', '251', '256', '334', '938'];
                const stateVariations = [targetState.toLowerCase(), 'al', 'alabama'];
                
                let score = 0;
                const reasons = [];
                
                // 1. Direct state mention in content (3 points)
                stateVariations.forEach(variation => {
                    if (bodyText.includes(variation)) {
                        score += 3;
                        reasons.push(`State "${variation}" found in content`);
                    }
                });
                
                // 2. Address patterns (2 points each)
                const addressPatterns = [
                    /\b\d{5}\b/g, // ZIP codes
                    new RegExp(`\\b${targetState.toLowerCase()}\\b`, 'gi'),
                    /located in|based in|serving/gi
                ];
                
                addressPatterns.forEach(pattern => {
                    if (pattern.test(bodyText)) {
                        score += 2;
                        reasons.push(`Address pattern found: ${pattern.source}`);
                    }
                });
                
                // 3. Phone number area code verification (2 points)
                const phoneRegex = /\((\d{3})\)|\b(\d{3})-\d{3}-\d{4}\b/g;
                let phoneMatch;
                while ((phoneMatch = phoneRegex.exec(bodyText)) !== null) {
                    const areaCode = phoneMatch[1] || phoneMatch[2];
                    if (targetState === 'Alabama' && alabamaAreaCodes.includes(areaCode)) {
                        score += 2;
                        reasons.push(`Alabama area code found: ${areaCode}`);
                        break;
                    }
                }
                
                return { score, reasons, bodyText: bodyText.substring(0, 500) };
            }, targetState);

            const isVerified = locationData.score >= 3 || mentionedInSearch;
            
            if (isVerified) {
                console.log(`✅ Location verified for ${result.title} (Score: ${locationData.score})`);
                return { verified: true, score: locationData.score, reasons: locationData.reasons };
            } else {
                console.log(`❌ Location not verified for ${result.title} (Score: ${locationData.score})`);
                return { verified: false, score: locationData.score, reasons: locationData.reasons };
            }
            
        } catch (error) {
            console.error(`❌ Error verifying location for ${result.title}:`, error.message);
            return { verified: false, score: 0, reasons: ['Error during verification'] };
        }
    }

    validateVanBuilder(builderData) {
        const content = `${builderData.name} ${builderData.description} ${builderData.van_types.join(' ')} ${builderData.amenities.join(' ')}`.toLowerCase();
        
        // EXCLUSION KEYWORDS - Immediate disqualification
        const excludeKeywords = [
            'food truck', 'food trailer', 'concession', 'catering', 'restaurant',
            'mobile kitchen', 'food service', 'food cart', 'coffee truck',
            'ice cream truck', 'taco truck', 'food vendor', 'commercial kitchen'
        ];
        
        const hasExcludedContent = excludeKeywords.some(keyword => content.includes(keyword));
        if (hasExcludedContent) {
            return { isValid: false, reason: 'Builds food trucks/commercial vehicles, not camper vans' };
        }
        
        // VAN CONVERSION KEYWORDS - Must have at least one
        const vanKeywords = [
            'camper van', 'van conversion', 'custom van', 'adventure van',
            'sprinter conversion', 'transit conversion', 'promaster conversion',
            'class b rv', 'class b+', 'motorhome', 'recreational vehicle',
            'van build', 'van life', 'overland', 'expedition vehicle'
        ];
        
        const hasVanKeywords = vanKeywords.some(keyword => content.includes(keyword));
        
        // GENERAL KEYWORDS - Secondary check
        const generalKeywords = ['rv', 'conversion', 'custom', 'build'];
        const hasGeneralKeywords = generalKeywords.some(keyword => content.includes(keyword));
        
        // VAN TYPES CHECK - Look for actual van models
        const vanModels = ['sprinter', 'transit', 'promaster', 'express', 'savana', 'nv200'];
        const hasVanModels = vanModels.some(model => content.includes(model));
        
        // SCORING SYSTEM - Need minimum score to qualify
        let score = 0;
        if (hasVanKeywords) score += 3;      // Strong van conversion indicators
        if (hasVanModels) score += 2;        // Specific van models mentioned
        if (hasGeneralKeywords) score += 1;  // General conversion keywords
        
        if (score < 2) {
            return { isValid: false, reason: `Insufficient van conversion indicators (score: ${score}/3 minimum)` };
        }
        
        console.log(`✅ VALIDATED: ${builderData.name} - Van conversion score: ${score}/3`);
        return { isValid: true, reason: `Van conversion validated (score: ${score})` };
    }
}

module.exports = ValidationService;
