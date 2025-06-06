# Van Builder State Search Protocol v3.0

## Overview
This document outlines the enhanced standardized protocol for collecting comprehensive van builder data across different states using web scraping and API integration. The system prioritizes **strict location verification** to ensure only builders physically located within the target state are included.

## Core Objectives
1. **Strict Location Verification**: Only include builders with verified physical addresses in the target state
2. **Comprehensive Data Collection**: Extract detailed contact information, services, and visual content
3. **Quality Assurance**: Maintain high standards for data accuracy and completeness
4. **Respectful Crawling**: Follow ethical web scraping practices
5. **Complete Coverage**: Multiple search strategies to find all legitimate builders

## Enhanced Location Verification (v3.0)

### Strict Physical Location Requirements
The system now requires **actual business addresses** within the target state, not just service areas:

#### Primary Verification Factors (High Weight)
- **State Address Detection** (+6 points): Presence of state abbreviation (e.g., "NJ", "AL") in content
- **State-Specific Zip Codes** (+4 points): 
  - New Jersey: 08xxx
  - Alabama: 30xxx-36xxx  
  - California: 90xxx-96xxx
  - Texas: 70xxx-79xxx
  - Florida: 30xxx-34xxx
- **State Area Code Phone Numbers** (+4 points): Area codes specific to target state
- **Business Location Keywords** (+3 points): "located in", "based in", "headquarters", "office"

#### Secondary Verification Factors (Medium Weight)
- **Search Result Mentions** (+2 points): State mentioned in search title/snippet
- **Content Mentions** (+1 point): State name found in page content

#### Disqualifying Factors (Negative Weight)
- **Out-of-State Addresses** (-5 points): Clear addresses in other states (reduced from -10)
- **Other State Mentions** (-3 points): Business location indicators for other states
- **Service Area Only** (-3 points): Only mentions serving the state, not located in it
- **Directory Sites** (-2 points): Listing/directory sites rather than actual builders

#### Verification Threshold
- **Minimum Score**: 4 points required for verification (lowered from 6)
- **Enhanced Detection**: More nuanced address pattern detection to avoid false negatives

## Enhanced Van Conversion Validation (v3.0)

### Builder Legitimacy Requirements
All builders must pass van conversion validation to ensure they actually build camper vans:

#### Validation Scoring System
- **Strong Van Keywords** (+3 points): "camper van", "van conversion", "custom van", "adventure van", "sprinter conversion", "van build", "van life", "overland", "expedition vehicle"
- **Van Model Keywords** (+2 points): "sprinter", "transit", "promaster", "express", "savana", "nv200"
- **General Keywords** (+1 point): "rv", "conversion", "custom", "build", "camper", "nomad"
- **RV Company Bonus** (+1 point): Additional point for legitimate RV companies (contains "rv" but not "food")

#### Exclusion Criteria
Immediate disqualification for:
- Food trucks, food trailers, concession vehicles
- Mobile kitchens, catering trucks
- Commercial kitchen builds

#### Validation Threshold
- **Minimum Score**: 1 point required (lowered for inclusivity)
- **Focus**: Legitimate van/RV builders vs food truck builders

## Multiple Search Query Strategy (v3.0)

### Enhanced Search Coverage
The system now uses **4 different search queries** to ensure comprehensive builder discovery:

1. **"custom camper van builders in [STATE]"** - Primary van conversion focus
2. **"van conversion companies [STATE]"** - Service-focused search
3. **"custom van builds [STATE]"** - Build-focused search  
4. **"van conversions [STATE_ABBREV]"** - Abbreviated state search

### Search Result Processing
- **Deduplication**: URL-based duplicate removal across all queries
- **Aggregation**: Combines unique results from all 4 queries
- **Quality Focus**: 10 results per query, 40+ total potential builders
- **Verification**: Each result undergoes strict location and van conversion validation

### State-Specific Detection Patterns

#### New Jersey Specific
- **Area Codes**: 201, 551, 609, 732, 848, 856, 862, 908, 973
- **Zip Pattern**: 08xxx
- **Key Cities**: Hamilton Twp, Trenton, Jersey City, Newark, Princeton, Camden, Manasquan
- **Common Out-of-State Conflicts**: Pennsylvania (PA), New York (NY)

{{ ... }}

## Enhanced Data Extraction Methods

### Multi-Source Contact Information Extraction
The system now scans multiple page areas for comprehensive contact data:

#### Primary Extraction Areas
1. **Header/Navigation**: Company contact info, social media links
2. **Footer**: Complete contact details, social profiles
3. **Main Content**: Embedded contact information
4. **Dedicated Pages**: About Us, Contact Us pages (automatically discovered and scanned)

#### Contact Information Types
- **Phone Numbers**: All formats with area code validation
- **Email Addresses**: Primary business emails (with fallback extraction from contact pages)
- **Physical Addresses**: Complete street addresses with state verification
- **Social Media**: Facebook, Instagram, YouTube, TikTok, LinkedIn profiles

### Advanced Photo Selection System

#### Van-Relevance Scoring Algorithm
Photos are scored based on van-related keywords in filenames, alt text, and surrounding content:

**High Priority Keywords (+3 points)**:
- van, sprinter, transit, promaster, conversion, camper, motorhome, rv

**Medium Priority Keywords (+2 points)**:  
- interior, exterior, build, custom, adventure, overland, expedition

**Low Priority Keywords (+1 point)**:
- kitchen, bed, bathroom, solar, awning, gear

**Exclusion Penalties (-5 points)**:
- logos, team photos, buildings, food trucks, marketing materials

#### Quality Filters
- **Size Bonuses**: +2 points for 400x300+, +3 points for 800x600+
- **Small Image Penalty**: -2 points for likely icons/logos
- **Duplicate Detection**: Smart deduplication across main page and gallery sources
- **Target Collection**: 8 high-quality photos per builder

### Gallery Page Discovery
- **Automatic Detection**: Finds portfolio, gallery, and work showcase pages
- **Enhanced Navigation**: Explores additional pages for richer photo collections
- **Quality Priority**: Prioritizes actual van conversion photos over generic content

## Automatic File Cleanup (v3.0)

### Post-Scrape Cleanup Process
After each scraping session, the system automatically removes unnecessary files:

#### Files Automatically Removed
- **Screenshot Files**: All .png files generated during scraping
- **Temporary Files**: Browser cache and temporary data
- **Debug Files**: Intermediate processing files

#### Cleanup Logging
- **File Count**: Reports number of files removed
- **File Types**: Lists types of files cleaned up
- **Storage Saved**: Estimates disk space recovered

#### Cleanup Configuration
- **Automatic**: Runs after every successful scrape
- **Selective**: Preserves final JSON results and logs
- **Configurable**: Can be disabled for debugging purposes

## Missing Builder Recovery (v3.0)

### Enhanced Builder Discovery
The system now includes specific mechanisms to find previously missed legitimate builders:

#### Targeted Search Strategies
- **Company Name Searches**: Direct searches for known builder names
- **Multiple Query Variations**: Different keyword combinations
- **State Abbreviation Searches**: Both full state names and abbreviations

#### Verification Improvements
- **Reduced False Negatives**: More nuanced address detection
- **Inclusive Validation**: Lower thresholds for legitimate builders
- **Enhanced Debugging**: Detailed scoring breakdowns for transparency

#### Recovery Process
1. **Identify Missing**: Compare results against known legitimate builders
2. **Targeted Extraction**: Direct data extraction from known URLs
3. **Validation**: Ensure all builders pass location and van conversion checks
4. **Integration**: Merge with main dataset for complete coverage

## Data Quality Standards

### Required Data Fields
- **Name**: Business name and branding
- **Website**: Primary business website URL
- **Phone**: Contact phone with area code validation
- **Email**: Primary business email address
- **Address**: Physical business location (when available)
- **Van Types**: Specialization areas (Sprinter, Transit, Promaster, etc.)
- **Amenities**: Services and features offered
- **Photos**: 8 high-quality van-related images
- **Social Media**: All available platform links

### Data Validation Rules
- **Phone Format**: Standardized to (XXX) XXX-XXXX or 10-digit format
- **Email Validation**: Proper email format verification
- **URL Validation**: Working website links
- **Photo Quality**: Minimum resolution and van-relevance standards
- **Address Verification**: Must match target state requirements when available

## Error Handling & Debugging

### Comprehensive Logging
The system provides detailed verification logs including:
- Location verification scores and breakdown
- Van conversion validation scores
- Address detection results
- Out-of-state address findings
- Social media extraction counts
- Photo scoring details with van-relevance scores

### Common Issues & Solutions
- **Timeout Errors**: Automatic retry with exponential backoff
- **Rate Limiting**: Respectful delays between requests
- **Missing Data**: Fallback defaults and contact page scanning
- **Verification Failures**: Detailed logging for manual review
- **False Negatives**: Enhanced debugging to identify missed legitimate builders

## Technical Implementation

### Browser Automation
- **Playwright**: Chromium-based browser automation
- **Headless Mode**: Configurable for performance/debugging
- **Resource Blocking**: Images/CSS blocked for faster loading
- **Timeout Handling**: 20-second page load timeout
- **Error Recovery**: Graceful handling of page load failures

### API Integration
- **Brave Search**: Primary search result source
- **Rate Limiting**: Respectful API usage with delays
- **Error Handling**: Graceful degradation on API failures
- **Multiple Queries**: Batch processing of search variations

## Respectful Crawling Guidelines

### Rate Limiting
- **Page Delays**: 2-3 seconds between page visits
- **Request Spacing**: Avoid overwhelming target servers
- **Concurrent Limits**: Single-threaded processing
- **API Throttling**: Respectful search API usage

### User Agent & Headers
- **Realistic User Agent**: Standard browser identification
- **Accept Headers**: Proper content type requests
- **Referrer Policy**: Appropriate referrer headers

## Output Format

### JSON Structure
```json
{
  "state": "New Jersey",
  "scraped_at": "2025-06-06T03:14:05.995Z",
  "total_builders": 4,
  "total_photos": 32,
  "avg_photos_per_builder": 8,
  "screenshots": [],
  "builders": [
    {
      "name": "Builder Name",
      "website": "https://example.com",
      "phone": "(XXX) XXX-XXXX", 
      "email": "contact@example.com",
      "address": "123 Main St, City, ST 12345",
      "city": "City Name",
      "state": "New Jersey",
      "zip": "12345",
      "description": "Builder description",
      "van_types": ["sprinter", "transit", "promaster"],
      "amenities": ["solar", "bathroom", "kitchen"],
      "photos": [
        {
          "url": "https://example.com/photo.jpg",
          "alt": "Van conversion photo",
          "caption": "Interior view",
          "vanScore": 5,
          "source": "main"
        }
      ],
      "social_media": {
        "facebook": "url",
        "instagram": "url",
        "youtube": "url"
      }
    }
  ]
}
```

## Quality Assurance Checklist

### Pre-Scrape Validation
- [ ] Target state properly configured
- [ ] Multiple search queries optimized for state
- [ ] Browser settings configured
- [ ] API credentials validated
- [ ] Cleanup procedures enabled

### Post-Scrape Review
- [ ] All builders have verified state addresses or strong state indicators
- [ ] No out-of-state builders included
- [ ] Contact information completeness >80%
- [ ] Photo quality and van-relevance verified
- [ ] Social media links validated
- [ ] Duplicate builders removed
- [ ] Known legitimate builders included
- [ ] Automatic cleanup completed

### Manual Verification Steps
- [ ] Spot-check builder locations via Google Maps
- [ ] Verify phone area codes match target state
- [ ] Confirm van specialization via website review
- [ ] Validate social media profile authenticity
- [ ] Cross-reference with known builder directories

## Recent Updates (v3.0)

### Missing Builder Recovery
- Fixed location verification to find previously missed legitimate builders
- Enhanced van conversion validation for RV companies
- Added targeted search and extraction for known builders
- Implemented comprehensive builder discovery strategies

### Enhanced Location Verification
- Reduced out-of-state address penalty from -10 to -5 points
- Lowered verification threshold from 6 to 4 points
- Improved address pattern detection to avoid false negatives
- Added more nuanced business location detection

### Improved Van Conversion Validation
- Lowered minimum validation score from 2 to 1 point
- Added special bonus for legitimate RV companies
- Enhanced keyword detection for van conversion services
- More inclusive validation for legitimate builders

### Multiple Search Query Strategy
- Implemented 4 different search queries for comprehensive coverage
- Added deduplication across multiple query results
- Enhanced search result aggregation and processing
- Improved builder discovery rate significantly

### Automatic File Cleanup
- Added post-scrape cleanup to remove unnecessary files
- Automatic screenshot file removal
- Temporary file cleanup
- Storage optimization and cleanup logging

### Bug Fixes and Improvements
- Fixed verifyBuilderLocation return value format
- Enhanced error handling and timeout management
- Improved debugging output and verification transparency
- Added comprehensive logging for all verification steps

This protocol ensures high-quality, accurate van builder data collection with strict geographic verification, comprehensive information extraction, and complete builder discovery coverage.
