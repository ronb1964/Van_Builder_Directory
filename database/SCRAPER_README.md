# Enhanced Van Builder Scraper with Automatic Geocoding

This system provides advanced web scraping capabilities for van builders with automatic geocoding to get precise coordinates for map display.

## 🚀 Features

- **Automatic Geocoding**: Uses OpenStreetMap Nominatim API for precise coordinates
- **Smart Fallbacks**: City-level and state-level coordinate estimation
- **Enhanced Data Extraction**: Comprehensive extraction of builder information
- **Standardized Photo Format**: Consistent photo structure across all states
- **State-Specific Configuration**: Easy customization for different states
- **Respectful Scraping**: Built-in delays and error handling

## 📋 What Gets Extracted

- **Contact Info**: Name, phone, email, website, full address
- **Location Data**: City, state, ZIP, precise coordinates (lat/lng)
- **Social Media**: Instagram, Facebook, Twitter, YouTube, TikTok, LinkedIn
- **Van Types**: Sprinter, Transit, ProMaster, etc.
- **Amenities**: Solar, plumbing, electrical, kitchen, bathroom, etc.
- **Photos**: Up to 8 high-quality images in standardized format
- **Description**: Business description and services

## 🏗️ Files Overview

### `enhanced_scraper_with_geocoding.js`
Core scraper class with geocoding functionality. Can be used as a base class or standalone.

### `scrape_any_state.js`
Template for scraping any state. Copy and customize this file for new states.

## 🎯 How to Use for a New State

### Step 1: Copy the Template
```bash
cp scrape_any_state.js scrape_[state_name].js
```

### Step 2: Configure for Your State
Edit the new file and update:

```javascript
const STATE_CONFIG = {
    name: 'Your State Name',  // e.g., 'Texas', 'Florida', 'Colorado'
    websites: [
        { url: 'https://builder1.com', name: 'Builder Name 1' },
        { url: 'https://builder2.com', name: 'Builder Name 2' },
        // Add more builders...
    ]
};

const STATE_CITY_COORDINATES = {
    'major city 1': { lat: 40.7128, lng: -74.0060 },
    'major city 2': { lat: 34.0522, lng: -118.2437 },
    // Add major cities in your state for better geocoding fallbacks
};
```

### Step 3: Run the Scraper
```bash
cd database
node scrape_[state_name].js
```

## 📊 Output Files

The scraper generates several files:

1. **JSON Data**: `van_builders_[state]_enhanced_[timestamp].json`
   - Complete scraped data in JSON format
   - Includes coordinates and accuracy information

2. **SQL Inserts**: `[state]_builders_with_coordinates.sql`
   - Ready-to-run SQL INSERT statements
   - Includes precise coordinates for map display

## 🌍 Geocoding System

### Primary Method: OpenStreetMap Nominatim
- Free, reliable geocoding service
- Provides precise street-level coordinates
- Marked as "high" accuracy

### Fallback 1: City-Level Coordinates
- Uses predefined city coordinates
- Marked as "city-level" accuracy
- Good for general area mapping

### Fallback 2: State Default
- Uses first city in the state list
- Marked as "default" accuracy

### Final Fallback: US Center
- Geographic center of United States
- Marked as "country-level" accuracy
- Last resort only

## 🔧 Coordinate Accuracy Levels

- **`high`**: Street-level precision from geocoding API
- **`city-level`**: City center coordinates
- **`default`**: State's primary city coordinates
- **`country-level`**: US center (fallback only)

## 📸 Photo Format

All photos are standardized to this format:
```javascript
[
  {
    "url": "https://example.com/photo1.jpg",
    "alt": "Builder Name van conversion",
    "caption": ""
  }
]
```

## 🏃‍♂️ Quick Start Example

```javascript
// Example for Texas
const STATE_CONFIG = {
    name: 'Texas',
    websites: [
        { url: 'https://texasvanbuilder.com', name: 'Texas Van Builder' },
        { url: 'https://lonestarconversions.com', name: 'Lone Star Conversions' }
    ]
};

const STATE_CITY_COORDINATES = {
    'austin': { lat: 30.2672, lng: -97.7431 },
    'houston': { lat: 29.7604, lng: -95.3698 },
    'dallas': { lat: 32.7767, lng: -96.7970 },
    'san antonio': { lat: 29.4241, lng: -98.4936 }
};
```

## ⚙️ Advanced Configuration

### Custom Van Types
Add state-specific van types to the detection list:
```javascript
const vanTypes = [
    'sprinter', 'transit', 'promaster',
    'custom van type', 'local specialty'
];
```

### Custom Amenities
Extend the amenity detection:
```javascript
const amenityKeywords = [
    'solar', 'plumbing', 'electrical',
    'state-specific feature', 'regional amenity'
];
```

## 🚨 Important Notes

1. **Be Respectful**: The scraper includes 3-second delays between requests
2. **Check robots.txt**: Ensure you're allowed to scrape target websites
3. **Verify Data**: Always verify scraped data before database insertion
4. **Coordinate Accuracy**: Check the accuracy level for map display quality
5. **Photo Rights**: Ensure you have permission to use scraped photos

## 🐛 Troubleshooting

### Common Issues

1. **Geocoding Fails**: Check internet connection and API limits
2. **No Photos Found**: Adjust image size filters in the scraper
3. **Address Not Detected**: Check state name patterns in extraction
4. **Coordinates Wrong**: Verify city coordinates in fallback list

### Debug Mode
Set `headless: false` in the browser launch options to see scraping in action.

## 📈 Database Integration

After scraping, use the generated SQL file:

```bash
# Import to SQLite database
sqlite3 builders.db < texas_builders_with_coordinates.sql

# Or use the database operations script
node import_scraped_data.js texas_builders_with_coordinates.sql
```

## 🎯 Success Metrics

The scraper tracks:
- Total builders processed
- Builders with coordinates
- High accuracy geocoding success rate
- City-level fallback usage

This ensures you know the quality of your location data for map display!

---

**Happy Scraping!** 🚐✨ 