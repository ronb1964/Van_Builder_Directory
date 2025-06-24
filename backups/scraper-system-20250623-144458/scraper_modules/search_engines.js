// Handle fetch for different Node.js versions
let fetch;
if (typeof global.fetch !== 'undefined') {
    // Node.js 18+ has global fetch
    fetch = global.fetch;
} else {
    // Older Node.js versions need node-fetch
    try {
        fetch = require('node-fetch');
    } catch (error) {
        console.error('❌ node-fetch is required for this Node.js version. Please install it with: npm install node-fetch');
        process.exit(1);
    }
}

async function searchBrave(query, braveApiKey) {
    if (!braveApiKey) {
        console.error('❌ BRAVE_SEARCH_API_KEY not provided to searchBrave function');
        return [];
    }
    console.log(`🔍 Searching Brave for: "${query}" (from search_engines.js)`);
    
    try {
        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
        const response = await fetch(url, {
            headers: {
                'X-Subscription-Token': braveApiKey,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        const searchResults = (data.web?.results || []).map(result => ({
            title: result.title,
            url: result.url,
            snippet: result.description
        }));
        
        console.log(`📋 Found ${searchResults.length} Brave search results (from search_engines.js)`);
        return searchResults;
        
    } catch (error) {
        console.error('❌ Error during Brave search (from search_engines.js):', error.message);
        return [];
    }
}

async function searchGooglePlaces(query, location, googleApiKey) {
    if (!googleApiKey) {
        console.log('⚠️ Skipping Google Places search - API key not provided to searchGooglePlaces function (from search_engines.js)');
        return [];
    }

    console.log(`🗺️ Searching Google Places for: "${query}" in ${location} (from search_engines.js)`);
    
    try {
        // First, get place_id candidates using Text Search
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&radius=50000&key=${googleApiKey}`;
        const textSearchResponse = await fetch(textSearchUrl);
        if (!textSearchResponse.ok) {
            throw new Error(`Google Places Text Search HTTP ${textSearchResponse.status}: ${textSearchResponse.statusText}`);
        }
        const textSearchData = await textSearchResponse.json();

        if (textSearchData.status !== 'OK' && textSearchData.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Places Text Search API Error: ${textSearchData.status} - ${textSearchData.error_message || ''}`);
        }

        const placeResults = [];
        if (textSearchData.results) {
            for (const result of textSearchData.results.slice(0, 5)) { // Limit to top 5 candidates
                if (!result.place_id) continue;

                // Then, get details for each place_id
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.place_id}&fields=name,formatted_address,website,geometry,types,business_status&key=${googleApiKey}`;
                const detailsResponse = await fetch(detailsUrl);
                if (!detailsResponse.ok) {
                    console.warn(`Google Places Details HTTP ${detailsResponse.status} for place_id ${result.place_id}`);
                    continue; // Skip this result if details fetch fails
                }
                const detailsData = await detailsResponse.json();

                if (detailsData.status !== 'OK') {
                    console.warn(`Google Places Details API Error for place_id ${result.place_id}: ${detailsData.status}`);
                    continue; // Skip this result
                }

                const place = detailsData.result;
                if (place) {
                    placeResults.push({
                        name: place.name,
                        address: place.formatted_address,
                        website: place.website,
                        location: place.geometry?.location, // { lat, lng }
                        types: place.types,
                        business_status: place.business_status
                    });
                }
            }
        }
        
        console.log(`📍 Found ${placeResults.length} Google Places results (from search_engines.js)`);
        return placeResults;

    } catch (error) {
        console.error('❌ Error during Google Places search (from search_engines.js):', error.message);
        return [];
    }
}

module.exports = {
    searchBrave,
    searchGooglePlaces
};
