# STANDARDIZED STATE WORKFLOW - Updated After Arizona Success

## Overview
This workflow has been refined based on the successful Arizona project (10 builders, 91% success rate).

## Phase 1: Initial Setup
1. Create `[STATE]_builders_template.csv` with columns: `state,name,website_url`
2. Research and populate with builder information
3. Verify all URLs are accessible

## Phase 2: Data Scraping
Run the universal scraper:
```bash
node universal_state_scraper.js [STATE]_builders_template.csv
```

### Key Scraper Improvements (Arizona Lessons):
- ✅ Enhanced address extraction for numbered streets (e.g., "57TH DR")
- ✅ JavaScript/code filtering to prevent garbage data
- ✅ Improved coordinate accuracy through proper street address geocoding
- ✅ Re-geocoding when city information is updated from contact pages
- ✅ Better validation patterns for address extraction

## Phase 3: Quality Control
1. **Check for duplicates**: Verify no duplicate city/state displays
2. **Validate coordinates**: Ensure markers show at street addresses, not city centers
3. **Review addresses**: Check for JavaScript code or incomplete addresses
4. **Photo verification**: Confirm photos are collected and accessible

## Phase 4: Database Integration
1. Import cleaned data to database
2. Verify display in frontend
3. Test map functionality
4. Confirm CSP headers updated for new photo domains

## Phase 5: Manual Corrections
- Check website footers for complete addresses when scraped data is incomplete
- Manually update any builders with coordinate issues
- Verify business information accuracy

## Success Metrics (Arizona Baseline):
- **Data Quality**: 91% success rate target
- **Coordinate Accuracy**: 100% proper street addresses
- **Photo Collection**: Average 4 photos per builder
- **Display Issues**: Zero duplicate city/state displays

## Files Updated During Process:
- `universal_state_scraper.js` - Core scraper with improvements
- `server/database/database.js` - Fixed duplicate city/state issue
- `public/security-headers.js` - Added new photo domains
- Database - Manual corrections for edge cases

## Ready for Next State! 🚀 