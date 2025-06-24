// Location utilities for van builder scraper

function extractCityFromAddress(address) {
    if (!address) return '';
    
    // Common city patterns for various states
    const cityPatterns = [
        // Standard format: City, State ZIP
        /,\s*([A-Za-z\s]+),\s*[A-Z]{2}\s*\d{5}/,
        // City State ZIP (no comma)
        /\b([A-Za-z\s]+)\s+[A-Z]{2}\s+\d{5}/,
        // Just City, State
        /,\s*([A-Za-z\s]+),\s*[A-Z]{2}\b/
    ];
    
    for (const pattern of cityPatterns) {
        const match = address.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    // State-specific city extraction
    if (address.includes('NJ') || address.includes('New Jersey')) {
        return extractNewJerseyCity(address);
    } else if (address.includes('AL') || address.includes('Alabama')) {
        return extractAlabamaCity(address);
    } else if (address.includes('AZ') || address.includes('Arizona')) {
        return extractArizonaCity(address);
    }
    
    return '';
}

function extractNewJerseyCity(address) {
    // Common New Jersey cities
    const njCities = [
        'Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison',
        'Woodbridge', 'Lakewood', 'Toms River', 'Hamilton', 'Trenton',
        'Clifton', 'Camden', 'Brick', 'Cherry Hill', 'Passaic',
        'Union City', 'Old Bridge', 'Middletown', 'East Orange', 'Marlboro',
        'West Orange', 'Vineland', 'Union', 'Piscataway', 'New Brunswick',
        'Hoboken', 'Perth Amboy', 'West New York', 'East Brunswick', 'Bloomfield',
        'South Brunswick', 'Evesham', 'Bridgewater', 'North Bergen', 'Monroe',
        'Egg Harbor', 'Hamilton Township', 'Marlboro Township', 'Manalapan',
        'Hillsborough', 'Montclair', 'Galloway', 'Freehold', 'Monroe Township',
        'Belleville', 'Pennsylvania', 'Ewing', 'Fort Lee', 'Lawrence', 'Fair Lawn',
        'Willingboro', 'Long Branch', 'Deptford', 'Garfield', 'Westfield',
        'Livingston', 'Voorhees', 'Howell', 'Nutley', 'Linden', 'Atlantic City'
    ];
    
    for (const city of njCities) {
        if (address.includes(city)) {
            return city;
        }
    }
    
    return '';
}

function extractAlabamaCity(address) {
    // Common Alabama cities
    const alCities = [
        'Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa',
        'Hoover', 'Dothan', 'Auburn', 'Decatur', 'Madison',
        'Florence', 'Gadsden', 'Vestavia Hills', 'Prattville', 'Phenix City',
        'Alabaster', 'Bessemer', 'Enterprise', 'Opelika', 'Homewood',
        'Northport', 'Anniston', 'Prichard', 'Athens', 'Daphne',
        'Pelham', 'Fairhope', 'Mountain Brook', 'Trussville', 'Helena',
        'Hueytown', 'Talladega', 'Fairfield', 'Ozark', 'Alexander City',
        'Cullman', 'Scottsboro', 'Millbrook', 'Foley', 'Troy',
        'Center Point', 'Selma', 'Muscle Shoals', 'Gardendale', 'Saraland',
        'Hartselle', 'Chelsea', 'Jasper', 'Fort Payne', 'Eufaula',
        'Midfield', 'Gulf Shores', 'Leeds', 'Moody', 'Pleasant Grove'
    ];
    
    for (const city of alCities) {
        if (address.includes(city)) {
            return city;
        }
    }
    
    return '';
}

function extractArizonaCity(address) {
    // Common Arizona cities
    const azCities = [
        'Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale',
        'Glendale', 'Gilbert', 'Tempe', 'Peoria', 'Surprise',
        'Yuma', 'San Tan Valley', 'Avondale', 'Goodyear', 'Flagstaff',
        'Buckeye', 'Lake Havasu City', 'Casa Grande', 'Maricopa', 'Oro Valley',
        'Prescott', 'Queen Creek', 'Prescott Valley', 'Apache Junction', 'Bullhead City',
        'El Mirage', 'Rio Rico', 'Sahuarita', 'Fountain Hills', 'Anthem',
        'Cave Creek', 'Sun City', 'Nogales', 'Douglas', 'Eloy',
        'Payson', 'Sierra Vista', 'Sun City West', 'New River', 'Paradise Valley',
        'Kingman', 'Fortuna Foothills', 'Florence', 'San Luis', 'Chino Valley',
        'Show Low', 'Sedona', 'Winslow', 'Safford', 'Cottonwood'
    ];
    
    for (const city of azCities) {
        if (address.includes(city)) {
            return city;
        }
    }
    
    return '';
}

function getStateAbbreviation(state) {
    const stateAbbreviations = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
        'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
        'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
        'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
        'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
        'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
        'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
        'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
        'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
        'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
        'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    
    return stateAbbreviations[state] || '';
}

function getFullStateName(abbreviation) {
    const stateNames = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
        'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
        'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
        'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
        'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
        'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
        'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
        'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
        'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
        'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
        'WI': 'Wisconsin', 'WY': 'Wyoming'
    };
    
    return stateNames[abbreviation.toUpperCase()] || '';
}

function parseAddress(addressString) {
    // Parse a full address into components
    const parsed = {
        street: '',
        city: '',
        state: '',
        zip: ''
    };
    
    if (!addressString) return parsed;
    
    // Try to match full address pattern
    const fullAddressPattern = /^(.+?),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/;
    const match = addressString.match(fullAddressPattern);
    
    if (match) {
        parsed.street = match[1].trim();
        parsed.city = match[2].trim();
        parsed.state = match[3].trim();
        parsed.zip = match[4].trim();
    } else {
        // Try other patterns
        const zipPattern = /\b(\d{5}(?:-\d{4})?)\b/;
        const zipMatch = addressString.match(zipPattern);
        if (zipMatch) {
            parsed.zip = zipMatch[1];
        }
        
        const statePattern = /\b([A-Z]{2})\b/;
        const stateMatch = addressString.match(statePattern);
        if (stateMatch) {
            parsed.state = stateMatch[1];
        }
        
        // Extract city based on state
        if (parsed.state) {
            const stateName = getFullStateName(parsed.state);
            if (stateName) {
                parsed.city = extractCityFromAddress(addressString);
            }
        }
    }
    
    return parsed;
}

module.exports = {
    extractCityFromAddress,
    getStateAbbreviation,
    getFullStateName,
    parseAddress
};
