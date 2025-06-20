import { Builder, Location, PricingTier } from '../types';

/**
 * Fetches builder data from a Google Sheets document
 * @param sheetId The ID of the Google Sheets document
 * @param apiKey Google API key with Sheets API enabled
 * @returns Promise that resolves to an array of Builder objects
 */
export const fetchBuildersFromSheet = async (
  sheetId: string,
  apiKey: string = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
): Promise<Record<string, Builder[]>> => {
  try {
    // Extract sheet ID from URL if full URL is provided
    const extractedSheetId = sheetId.includes('spreadsheets/d/') 
      ? sheetId.split('spreadsheets/d/')[1].split('/')[0]
      : sheetId;
    
    // Fetch the sheet data
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${extractedSheetId}/values/Builders?key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }
    
    const data = await response.json();
    const rows = data.values || [];
    
    if (rows.length < 2) {
      throw new Error('Sheet has insufficient data');
    }
    
    // First row should be headers
    const headers = rows[0];
    
    // Group builders by state
    const buildersByState: Record<string, Builder[]> = {};
    
    // Process each row (skip header row)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row.length) continue; // Skip empty rows
      
      const builder = parseBuilderFromRow(row, headers);
      
      // Group by state
      const state = builder.location.state;
      if (!buildersByState[state]) {
        buildersByState[state] = [];
      }
      buildersByState[state].push(builder);
    }
    
    return buildersByState;
  } catch (error) {
    console.error('Error fetching builders from Google Sheet:', error);
    throw error;
  }
};

/**
 * Parses a row from the Google Sheet into a Builder object
 * @param row The row data from the sheet
 * @param headers The header row from the sheet
 * @returns A Builder object
 */
const parseBuilderFromRow = (row: any[], headers: string[]): Builder => {
  // Create an object mapping headers to values
  const rowData: Record<string, any> = {};
  headers.forEach((header, index) => {
    if (index < row.length) {
      rowData[header] = row[index];
    } else {
      rowData[header] = ''; // Default for missing values
    }
  });
  
  // Parse location
  const location: Location = {
    lat: parseFloat(rowData['Latitude'] || '0'),
    lng: parseFloat(rowData['Longitude'] || '0'),
    city: rowData['City'] || '',
    state: rowData['State'] || '',
    zip: rowData['Zip'] || ''
  };
  
  // Parse price range
  const priceRange = {
    min: parseInt(rowData['PriceMin'] || '0', 10),
    max: parseInt(rowData['PriceMax'] || '0', 10)
  };
  
  // Parse arrays
  const vanTypes = rowData['VanTypes'] ? rowData['VanTypes'].split(',').map((t: string) => t.trim()) : [];
  const amenities = rowData['Amenities'] ? rowData['Amenities'].split(',').map((a: string) => a.trim()) : [];
  const services = rowData['Services'] ? rowData['Services'].split(',').map((s: string) => s.trim()) : [];
  const certifications = rowData['Certifications'] ? rowData['Certifications'].split(',').map((c: string) => c.trim()) : [];
  
  // Parse social media
  const socialMedia = {
    facebook: rowData['Facebook'] || '',
    instagram: rowData['Instagram'] || '',
    youtube: rowData['YouTube'] || '',
    pinterest: rowData['Pinterest'] || '',
    tiktok: rowData['TikTok'] || ''
  };
  
  // Parse gallery
  const gallery = rowData['Gallery'] ? rowData['Gallery'].split(',').map((url: string) => url.trim()) : [];
  
  // Create builder object
  const builder: Builder = {
    id: rowData['ID'] || `${rowData['State']}-${Date.now()}`,
    name: rowData['Name'] || '',
    address: rowData['Address'] || '',
    phone: rowData['Phone'] || '',
    email: rowData['Email'] || '',
    website: rowData['Website'] || '',
    location,
    description: rowData['Description'] || '',
    rating: parseFloat(rowData['Rating'] || '0'),
    reviewCount: parseInt(rowData['ReviewCount'] || '0', 10),
    reviews: [], // Reviews would need to be in a separate sheet or handled separately
    vanTypes,
    priceRange,
    amenities,
    services,
    certifications,
    yearsInBusiness: parseInt(rowData['YearsInBusiness'] || '0', 10),
    socialMedia,
    gallery,
  };
  
  return builder;
};

/**
 * Generates sample pricing tiers for a builder based on their price range
 * @param builder The builder to generate pricing tiers for
 * @returns An array of PricingTier objects
 */
export const generatePricingTiersForBuilder = (builder: Builder): PricingTier[] => {
  if (!builder.priceRange) return [];
  
  const basePrice = Math.floor((builder.priceRange.min + builder.priceRange.max) / 2);
  
  return [
    {
      name: 'Basic',
      price: Math.round(basePrice * 0.7),
      description: 'Essential features for your van conversion',
      features: [
        'Basic insulation',
        'Standard bed platform',
        'Basic electrical system',
        'Minimal storage',
      ],
    },
    {
      name: 'Standard',
      price: basePrice,
      description: 'Most popular choice for van life',
      features: [
        'Premium insulation',
        'Custom cabinetry',
        'Solar power system',
        'Kitchenette',
        'Water system',
      ],
    },
    {
      name: 'Premium',
      price: Math.round(basePrice * 1.3),
      description: 'Luxury conversion with all the amenities',
      features: [
        'High-end finishes',
        'Full kitchen with appliances',
        'Bathroom with shower',
        'Advanced electrical system',
        'Custom storage solutions',
      ],
    },
  ];
};
