#!/bin/bash

# New State Setup Script
# Usage: ./setup_new_state.sh "Texas" "TX"

if [ $# -ne 2 ]; then
    echo "❌ Usage: $0 \"StateName\" \"StateAbbrev\""
    echo "   Example: $0 \"Texas\" \"TX\""
    echo "   Example: $0 \"Florida\" \"FL\""
    exit 1
fi

STATE_NAME="$1"
STATE_ABBREV="$2"
STATE_LOWER=$(echo "$STATE_NAME" | tr '[:upper:]' '[:lower:]')

echo "🚀 Setting up $STATE_NAME ($STATE_ABBREV) scraping workflow"
echo "=================================================="

# Check if templates directory exists
if [ ! -d "templates" ]; then
    echo "❌ Templates directory not found. Make sure you're in the database directory."
    exit 1
fi

# 1. Copy and customize scraper template
echo "📋 Creating scraper script: scrape_${STATE_LOWER}.js"
cp "templates/scrape_STATE_template.js" "scrape_${STATE_LOWER}.js"
sed -i "s/STATE_NAME_HERE/$STATE_NAME/g" "scrape_${STATE_LOWER}.js"

# 2. Copy and customize data cleaning template
echo "🔧 Creating data cleaning script: fix_${STATE_LOWER}_data_issues.js"
cp "templates/fix_STATE_data_template.js" "fix_${STATE_LOWER}_data_issues.js"
sed -i "s/\\[STATE_NAME\\]/$STATE_NAME/g" "fix_${STATE_LOWER}_data_issues.js"
sed -i "s/\\[STATE_ABBREV\\]/$STATE_ABBREV/g" "fix_${STATE_LOWER}_data_issues.js"
sed -i "s/\\[state_name\\]/$STATE_LOWER/g" "fix_${STATE_LOWER}_data_issues.js"

# 3. Copy and customize social media template
echo "📱 Creating social media script: fix_${STATE_LOWER}_social_media.js"
cp "templates/fix_STATE_social_media_template.js" "fix_${STATE_LOWER}_social_media.js"
sed -i "s/STATE_ABBREV = 'XX'/STATE_ABBREV = '$STATE_ABBREV'/g" "fix_${STATE_LOWER}_social_media.js"
sed -i "s/STATE_NAME = 'STATE_NAME'/STATE_NAME = '$STATE_NAME'/g" "fix_${STATE_LOWER}_social_media.js"

# 4. Show next steps
echo ""
echo "✅ $STATE_NAME workflow files created successfully!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Edit scrape_${STATE_LOWER}.js:"
echo "   - Add 5-10 van builder websites for $STATE_NAME"
echo "   - Add major cities with coordinates for geocoding"
echo ""
echo "2. Run initial scraping:"
echo "   cd database"
echo "   node scrape_${STATE_LOWER}.js"
echo ""
echo "3. Clean the scraped data:"
echo "   - Edit fix_${STATE_LOWER}_data_issues.js with specific fixes needed"
echo "   - node fix_${STATE_LOWER}_data_issues.js"
echo ""
echo "4. Convert social media format:"
echo "   node fix_${STATE_LOWER}_social_media.js"
echo ""
echo "5. Handle any photo extraction failures:"
echo "   - Copy templates/get_BUILDER_photos_template.js → get_[builder_name]_photos.js"
echo "   - Customize and run for builders with 0 photos"
echo ""
echo "6. Update CSP policy in ../public/security-headers.js for new domains"
echo ""
echo "📊 Expected Timeline: ~2.5 hours for 5-10 builders"
echo ""
echo "🎯 Target Quality:"
echo "   - 90%+ builders with 2-8 photos"
echo "   - 100% proper contact info and social media"
echo "   - 100% accurate coordinates"
echo ""
echo "🎉 Following this workflow ensures consistent, high-quality results!" 