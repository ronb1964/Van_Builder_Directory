# Standardized State Scraping Workflow
## Proven Process for Adding Any New State

Based on successful California and Alaska implementations, this is the **cookie-cutter process** for adding any new state.

## 📋 Pre-Scraping Setup

### 1. Research Phase
- Find 5-10 van builders in target state using Google
- Verify websites are accessible
- Note any obviously complex sites (React, heavy JS) for manual attention

### 2. State Configuration
Copy `scrape_any_state.js` → `scrape_[state_name].js` and update:

```javascript
const STATE_CONFIG = {
    name: 'YourStateName',  // e.g., 'Texas', 'Florida'
    websites: [
        { url: 'https://builder1.com', name: 'Builder Name 1' },
        { url: 'https://builder2.com', name: 'Builder Name 2' },
        // Add 5-10 builders
    ]
};

const STATE_CITY_COORDINATES = {
    'major_city_1': { lat: 40.7128, lng: -74.0060 },
    'major_city_2': { lat: 34.0522, lng: -118.2437 },
    // Add 8-10 major cities for geocoding fallbacks
};
```

## 🤖 Automated Scraping Phase

### 3. Run Initial Scrape
```bash
cd database
node scrape_[state_name].js
```

**Expected Results:**
- 60-80% success rate (some timeouts expected)
- Raw data with navigation menus, footers, wrong phone numbers
- Photos extracted for most builders
- Social media in array format (needs conversion)

## 🔧 Data Cleaning Phase (Critical!)

### 4. Create State Cleanup Script
Copy `fix_alaska_data_issues.js` → `fix_[state_name]_data_issues.js`

**Standard Issues to Fix:**
- ✅ **Addresses**: Remove copyright footers, navigation text, JSON schema
- ✅ **Cities**: Clean "ALL RIGHTS RESERVED | CITY" → "City"  
- ✅ **Phone Numbers**: Fix wrong area codes, format properly
- ✅ **Emails**: Replace error tracking emails with business emails
- ✅ **Descriptions**: Replace navigation menus with business descriptions
- ✅ **Social Media**: Convert array format to object format
- ✅ **Van Types**: Automatically standardized during scraping (no manual fixes needed)

### 5. Import and Clean Data
```bash
# Import raw scraped data
sqlite3 builders.db < [state_name]_builders_with_coordinates.sql
sqlite3 ../server/database/builders.db < [state_name]_builders_with_coordinates.sql

# Apply data cleaning
node fix_[state_name]_data_issues.js
```

## 📱 Social Media Format Fix

### 6. Convert Social Media Format
```bash
node fix_[state_name]_social_media.js
```

**Required Conversion:**
- From: `["https://facebook.com/...", "https://instagram.com/..."]`
- To: `{"facebook":"https://facebook.com/...", "instagram":"https://instagram.com/..."}`

## 🖼️ Manual Photo Recovery

### 7. Handle Failed Scrapers
For builders that timed out or have 0 photos:
```bash
node get_[builder_name]_photos.js
```

**Common Timeout Causes:**
- Slow loading websites (extend timeout to 60s)
- Heavy JavaScript sites
- Geographic restrictions

## 🔒 Security Policy Update

### 8. Update CSP for New Domains
Add new builder domains to `public/security-headers.js`:
```javascript
'img-src': [...existing domains..., "https://newbuilder.com"]
```

## ✅ Verification Phase

### 9. Quality Check
- **Photos**: All builders should have 2-8 photos
- **Social Media**: Object format, real business accounts
- **Contact Info**: Local area codes, clean addresses
- **Descriptions**: Business descriptions, not navigation text

## 📚 Template Files

### Standard Templates to Copy:
1. **`scrape_any_state.js`** → `scrape_[state].js` (main scraper)
2. **`fix_alaska_data_issues.js`** → `fix_[state]_data_issues.js` (data cleaning)
3. **`fix_alaska_social_media.js`** → `fix_[state]_social_media.js` (format conversion)
4. **`get_backcountry_photos.js`** → `get_[builder]_photos.js` (manual photo recovery)

## 🎯 Success Metrics

**Target Quality Standards:**
- ✅ 90%+ builders with photos (2-8 each)
- ✅ 100% proper contact info (phone, email, address)
- ✅ 100% social media in object format
- ✅ 100% clean business descriptions
- ✅ 100% accurate coordinates
- ✅ 100% standardized van types ("Ford Transit", "Mercedes Sprinter", "Ram ProMaster")
- ✅ No CSP violations for images

## ⚙️ Improved Scraper Standards

### 10. Enhanced Scraper Configuration
Update `scraper_modules/data_extraction.js` with lessons learned:

```javascript
// STANDARD SOCIAL MEDIA FORMAT (Object, not Array)
async function extractSocialMedia(page) {
    // Always return object format
    return {
        facebook: 'https://facebook.com/business',
        instagram: 'https://instagram.com/business'
        // Never return arrays
    };
}

// STANDARD ADDRESS EXTRACTION (Street only, no city/state)
async function extractAddress(page) {
    // Extract only street address
    // Let database store city/state separately
    return '123 Main Street'; // Not "123 Main St, City, State"
}

// STANDARD VAN TYPE EXTRACTION (Automatic standardization)
async function extractVanTypes(page) {
    // Automatically standardizes van types to proper format
    // "transit" → "Ford Transit"
    // "sprinter" → "Mercedes Sprinter" 
    // "promaster" → "Ram ProMaster"
    // Returns clean, consistent van type names
}
```

## 🚀 One-Command State Setup

### 11. Master Script (Future Enhancement)
Create `add_new_state.sh`:
```bash
#!/bin/bash
STATE_NAME=$1
# Copy templates
# Update configurations  
# Run scraping pipeline
# Apply all fixes
# Generate summary report
```

## 📊 Expected Timeline

**Per State (5-10 builders):**
- Research & Setup: 30 minutes
- Initial Scraping: 15 minutes  
- Data Cleaning: 45 minutes
- Manual Photo Recovery: 30 minutes
- Verification: 15 minutes
- **Total: ~2.5 hours per state**

## 🎉 Proven Results

**California**: 22 builders, pristine data quality
**Alabama**: 3 builders, full addresses, photos, social media
**Alaska**: 3 builders, complete gallery, proper format

**This workflow scales to ANY state with consistent, high-quality results!** 