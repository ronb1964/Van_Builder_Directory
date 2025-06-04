# StateSearch Process Document
## Standardized Van Builder Data Collection Protocol

### 📋 **Overview**
This document defines the exact process for collecting custom camper van builder data for each U.S. state. Every state search MUST follow these steps precisely to ensure consistency, quality, and adherence to our PRD requirements.

---

## 🎯 **Core Objectives (Per PRD)**
- Collect **authentic builder information** (no mock data)
- Ensure **all required fields** are captured
- Verify **location accuracy** within target state
- Maintain **data quality standards**
- Follow **respectful scraping practices**

---

## 🔍 **Step 1: Pre-Search Preparation**

### 1.1 Read PRD Requirements
- **ALWAYS** reference `/home/ron/Dev/Van_Builder_Directory/prd.md`
- Confirm required fields:
  - ✅ **Required**: Name, Address, City, State, Zip, Email
  - ✅ **Required**: At least 1 Van Type, 1 Amenity, 1 Photo
  - ⚠️ **Optional**: Phone, Website, Years Experience, Social Media

### 1.2 Initialize Tools
- Use **Playwright-based scraper**: `web_scraper_playwright.js`
- Set appropriate mode:
  - `--headed` for debugging/verification
  - `--fast` for production speed
  - Default headless for standard operation

### 1.3 Verify Environment
- Confirm Playwright browsers installed
- Check database directory exists: `/home/ron/Dev/Van_Builder_Directory/database/`
- Ensure sufficient disk space for screenshots

---

## 🔎 **Step 2: Execute Search Query**

### 2.1 Use EXACT Search Format
**MANDATORY QUERY**: `"custom camper van builders in {STATE}"`

**Examples**:
- ✅ `"custom camper van builders in Alabama"`
- ✅ `"custom camper van builders in California"`
- ✅ `"custom camper van builders in New York"`
- ❌ `"van builders {STATE}"` (too generic)
- ❌ `"camper van companies {STATE}"` (different focus)

### 2.2 Search Execution
```bash
cd /home/ron/Dev/Van_Builder_Directory/database
node web_scraper_playwright.js "{STATE}" [--headed] [--fast]
```

### 2.3 Google Search Process
1. Navigate to Google.com
2. Execute search with exact query format
3. Handle cookie consent automatically
4. Capture search results screenshot
5. Extract top 10 organic results
6. Wait 3 seconds (respectful crawling)

---

## ✅ **Step 3: Location Verification**

### 3.1 State Verification Criteria
For each search result, verify builder is located in target state:

**Primary Check**: Search result title/snippet contains:
- Full state name (e.g., "Alabama", "California")
- State abbreviation (e.g., "AL", "CA")

**Secondary Check**: Visit builder website and scan content for:
- State mentions in address/contact info
- State references in "About" or "Service Area" sections
- Geographic indicators (city names, landmarks)

### 3.2 Verification Process
1. Check search result metadata first
2. If unclear, visit builder website
3. Scan page content for state indicators
4. **ONLY PROCEED** if location is verified
5. **SKIP** builders not confirmed in target state

---

## 📊 **Step 4: Data Extraction**

### 4.1 Required Data Fields (Per PRD)
Extract the following data for each verified builder:

#### **Contact Information**
- ✅ **Name**: Business/builder name
- ✅ **Address**: Street address
- ✅ **City**: City name
- ✅ **State**: State abbreviation (e.g., "AL")
- ✅ **Zip**: 5-digit zip code
- ✅ **Email**: Valid email address
- ⚠️ **Phone**: US format (XXX) XXX-XXXX (optional)
- ⚠️ **Website**: Full URL (optional)

#### **Business Information**
- ⚠️ **Description**: Max 500 words from meta description or main content
- ⚠️ **Years Experience**: Extract from content (e.g., "15 years experience")

#### **Services & Capabilities**
- ✅ **Van Types**: At least 1 required
  - Keywords: class b, sprinter, transit, promaster, custom van, etc.
- ✅ **Amenities**: At least 1 required
  - Keywords: solar, bathroom, kitchen, storage, etc.

#### **Media & Social**
- ✅ **Photos**: **Strive for 8 photos** (minimum 1 required)
  - Exclude logos/icons
  - Include URL, alt text, caption
  - Prioritize van builds, interiors, exteriors
- ⚠️ **Social Media**: All available platforms
  - Instagram, Facebook, YouTube, Twitter/X, TikTok, LinkedIn, Pinterest

### 4.2 4-Layer Social Media Detection
1. **Layer 1**: Direct link scanning (`<a href>` elements)
2. **Layer 2**: Icon/class-based detection (social icons, CSS classes)
3. **Layer 3**: Meta tag scanning (OpenGraph, Twitter cards)
4. **Layer 4**: JSON-LD structured data parsing

### 4.3 Data Quality Standards
- **No Mock Data**: All information must be authentic
- **Verify Accuracy**: Cross-check contact info when possible
- **Complete Records**: Ensure all required fields populated
- **Fallback Values**: Use defaults only when necessary

---

## 📸 **Step 5: Documentation & Screenshots**

### 5.1 Screenshot Capture
- **Search Results**: Full page screenshot of Google results
- **Builder Pages**: Full page screenshot of each builder website
- **Naming Convention**: `search_results_{timestamp}.png`, `builder_{timestamp}.png`

### 5.2 Error Handling
- Log all errors with context
- Continue processing remaining builders
- Document failed extractions
- Retry logic for temporary failures

---

## 💾 **Step 6: Data Storage**

### 6.1 Output Format
Save results as JSON file with structure:
```json
{
  "state": "Alabama",
  "scraped_at": "2024-01-01T12:00:00Z",
  "total_builders": 5,
  "screenshots": ["search_results_123.png", "builder_456.png"],
  "builders": [
    {
      "name": "Builder Name",
      "website": "https://example.com",
      "address": "123 Main St",
      "city": "Birmingham",
      "state": "AL",
      "zip": "35203",
      "phone": "(205) 555-0123",
      "email": "info@example.com",
      "description": "Custom van builder...",
      "years_experience": 10,
      "social_media": {
        "instagram": "https://instagram.com/builder",
        "facebook": "https://facebook.com/builder"
      },
      "van_types": ["sprinter", "transit"],
      "amenities": ["solar", "kitchen", "bathroom"],
      "photos": [
        {
          "url": "https://example.com/photo1.jpg",
          "alt": "Custom van interior",
          "caption": ""
        },
        {
          "url": "https://example.com/photo2.jpg",
          "alt": "Van exterior build",
          "caption": ""
        }
      ]
    }
  ]
}
```

### 6.2 File Naming
`van_builders_{state_lowercase}_{timestamp}.json`

Example: `van_builders_alabama_2024-01-01T12-00-00Z.json`

---

## ⏱️ **Step 7: Respectful Crawling**

### 7.1 Timing Requirements
- **3 seconds** wait after Google search
- **2 seconds** wait between builder website visits
- **1 second** wait after modal close attempts
- **30 second** timeout for page loads

### 7.2 Resource Management
- Use `--fast` mode to block images/CSS when needed
- Implement proper browser cleanup
- Handle memory management for long runs

---

## 🔍 **Step 8: Quality Assurance**

### 8.1 Post-Collection Review
- Verify minimum data requirements met
- Check for duplicate builders
- Validate contact information format
- Confirm social media links work
- **Photo Quality Check**: Aim for 8 photos per builder

### 8.2 Success Criteria
- ✅ At least 1 verified builder found
- ✅ All required fields populated
- ✅ Screenshots captured
- ✅ JSON file saved successfully
- ✅ No errors in console output
- ✅ **Target: 8 photos per builder** (minimum 1)

---

## 📝 **Step 9: Reporting**

### 9.1 Console Output Format
```
🎯 Target State: Alabama
🖥️ Mode: Headless
⚡ Fast Mode: Disabled

🔍 Searching Google for: "custom camper van builders in Alabama"
📋 Found 8 search results
📸 Search results screenshot: search_results_1234567890.png

🔍 Processing: Alabama Van Conversions
✅ Location verified for: Alabama Van Conversions
📊 Extracting data for: Alabama Van Conversions
   📧 Email: info@alabamavan.com
   📞 Phone: (205) 555-0123
   📍 Address: 123 Main St, Birmingham, AL 35203
   📱 Social Media: 3 platforms found
   📷 Photos: 6 photos collected (target: 8)
✅ Added builder: Alabama Van Conversions

💾 Results saved to: van_builders_alabama_2024-01-01T12-00-00Z.json
📊 Total builders found: 5
📷 Average photos per builder: 6.2

🎉 Scraping completed successfully!
```

### 9.2 Summary Report
- State processed
- Total builders found
- Success/failure rate
- Screenshots captured
- File output location
- **Photo collection statistics**

---

## 🚨 **Critical Rules - NEVER DEVIATE**

1. **ALWAYS** use exact search query format: `"custom camper van builders in {STATE}"`
2. **NEVER** proceed without location verification
3. **NEVER** use mock or fake data
4. **ALWAYS** respect crawling delays
5. **ALWAYS** capture screenshots for auditing
6. **NEVER** skip required field validation
7. **ALWAYS** follow PRD data structure requirements
8. **NEVER** modify core extraction logic between states
9. **STRIVE** for 8 photos per builder (minimum 1 required)

---

## 🔄 **State Processing Checklist**

For each state, confirm:
- [ ] PRD requirements reviewed
- [ ] Exact search query used
- [ ] Location verification completed
- [ ] All required fields extracted
- [ ] Social media detection executed
- [ ] **Photo collection optimized (target: 8 per builder)**
- [ ] Screenshots captured
- [ ] JSON file saved
- [ ] Quality checks passed
- [ ] Console output reviewed

---

## 📞 **Support & Troubleshooting**

### Common Issues:
- **No results found**: Verify search query format
- **Location verification fails**: Check state name variations
- **Data extraction incomplete**: Review website structure
- **Screenshots missing**: Check file permissions
- **JSON save fails**: Verify directory exists
- **Low photo count**: Check image selectors and filtering logic

### Debug Mode:
Use `--headed` flag to visually inspect browser behavior and debug issues.

---

**This process ensures every state receives identical attention and data quality standards are maintained across the entire Van Builder Directory project.**
