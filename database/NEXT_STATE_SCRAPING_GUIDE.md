# Next State Scraping Guide

## Quick Start for Next State

### 1. Choose Your State
Pick the next state from `states_checklist.md` to scrape.

### 2. Configure the Scraper
Edit `scrape_any_state.js`:

```javascript
// CONFIGURATION: Edit this section for each new state
const STATE_CONFIG = {
    name: 'YourStateName',  // e.g., 'Texas', 'Florida', 'Colorado'
    websites: [
        { url: 'https://builder1.com', name: 'Builder Name 1' },
        { url: 'https://builder2.com', name: 'Builder Name 2' },
        // Add more builders here
    ]
};
```

### 3. Add State City Coordinates
Update the `STATE_CITY_COORDINATES` section with major cities for your state:

```javascript
const STATE_CITY_COORDINATES = {
    'major city 1': { lat: 40.7128, lng: -74.0060 },
    'major city 2': { lat: 34.0522, lng: -118.2437 },
    // Add 8-10 major cities for better geocoding
};
```

### 4. Run the Scraper
```bash
cd database
node scrape_any_state.js
```

### 5. Import Results
The scraper will:
- ✅ Extract all builder data with geocoding
- ✅ Generate SQL insert statements
- ✅ Save data to JSON file
- ✅ Provide database import commands

## Files You Need

### Core Scraper Files (Keep These):
- ✅ `scrape_any_state.js` - Main state scraper
- ✅ `enhanced_scraper_with_geocoding.js` - Core scraping engine
- ✅ `scraper_modules/` - Helper modules
- ✅ `state_builders_template.csv` - Template for builder lists

### Reference Files:
- ✅ `scrape_arkansas_enhanced.js` - Working example
- ✅ `SCRAPER_README.md` - Detailed documentation
- ✅ `StateSearch.md` - State research guide
- ✅ `states_checklist.md` - State progress tracker

## Quick Tips

1. **Research First**: Use Google to find 5-10 van builders in your target state
2. **Test URLs**: Make sure websites are accessible before adding to config
3. **Check Results**: Review the generated JSON file before importing to database
4. **Verify Data**: Use `validate_all_coordinates.js` after import to check quality

## Next Recommended States
Based on van life popularity:
1. **Texas** - Large state, many builders
2. **Florida** - Popular van life destination  
3. **Colorado** - Outdoor enthusiast hub
4. **Oregon** - Pacific Northwest van culture
5. **North Carolina** - East Coast builders

## Need Help?
- Check `SCRAPER_README.md` for detailed instructions
- Review `scrape_arkansas_enhanced.js` for working example
- All tools are ready to use - just update the configuration! 