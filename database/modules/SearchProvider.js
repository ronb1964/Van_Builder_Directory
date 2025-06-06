/**
 * Search Provider Module
 * Handles external search API interactions (Brave Search)
 */

class SearchProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        
        if (!this.apiKey) {
            throw new Error('❌ Search API key is required');
        }
    }

    async searchBrave(query) {
        console.log(`🔍 Searching Brave for: "${query}"`);
        
        try {
            const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
            const response = await fetch(url, {
                headers: {
                    'X-Subscription-Token': this.apiKey,
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
            
            console.log(`📋 Found ${searchResults.length} search results`);
            
            return searchResults;
            
        } catch (error) {
            console.error('❌ Error during Brave search:', error.message);
            return [];
        }
    }
}

module.exports = SearchProvider;
