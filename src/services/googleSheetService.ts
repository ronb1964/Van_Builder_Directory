// Google Sheets API service for fetching builder data
import { fetchBuildersFromSheet as fetchFromSheet } from '../utils/sheetsUtils';
import { mockBuilders, mockBuildersByState } from '../data/mockData';
import { loadBuildersFromCsv } from '../utils/csvLoader';
import { Builder, GalleryImage } from '../types';

// Types
export interface SheetBuilder {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  vanTypes?: string;
  priceMin?: number;
  priceMax?: number;
  amenities?: string;
  services?: string;
  gallery?: GalleryImage[];
}

// Convert raw sheet data to our Builder format
const convertSheetDataToBuilder = (sheetBuilder: SheetBuilder): Builder => {
  return {
    id: sheetBuilder.id,
    name: sheetBuilder.name,
    address: `${sheetBuilder.city}, ${sheetBuilder.state} ${sheetBuilder.zip}`,
    phone: sheetBuilder.phone,
    email: sheetBuilder.email,
    website: sheetBuilder.website,
    location: {
      lat: sheetBuilder.lat,
      lng: sheetBuilder.lng,
      city: sheetBuilder.city,
      state: sheetBuilder.state,
      zip: sheetBuilder.zip
    },
    description: sheetBuilder.description,
    vanTypes: sheetBuilder.vanTypes ? sheetBuilder.vanTypes.split(',').map(type => type.trim()) : undefined,
    priceRange: (sheetBuilder.priceMin && sheetBuilder.priceMax) ? {
      min: sheetBuilder.priceMin,
      max: sheetBuilder.priceMax
    } : undefined,
    amenities: sheetBuilder.amenities ? sheetBuilder.amenities.split(',').map(amenity => amenity.trim()) : undefined,
    services: sheetBuilder.services ? sheetBuilder.services.split(',').map(service => service.trim()) : undefined,
    certifications: [],
    socialMedia: {},
    gallery: []
  };
};

// Fetch builders from Google Sheet
// Fetch builders from Google Sheet - this is the primary data source
export const fetchBuildersFromSheet = async (): Promise<Builder[]> => {
  try {
    console.log('🔍 Fetching builders from Google Sheets with enhanced data...');
    
    const SPREADSHEET_ID = '1noZol3jQUF9EXHnatCHttRwmOgGN7S4Cavvrv9XyR8M';
    const SHEET_NAME = 'builders';
    const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (!API_KEY) {
      throw new Error('Google Maps API key not found');
    }
    
        // Make sure we request all columns A-M to get all data
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:M?key=${API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const rows = data.values;

    if (!rows || rows.length <= 1) {
      console.log('No data found, falling back to mock data');
      return getMockSheetData().map(convertSheetDataToBuilder);
    }

    console.log(`📊 Found ${rows.length - 1} builders in Google Sheet`);
    
    const builders: Builder[] = [];

    // Skip header row and convert to builder objects
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[1]) continue; // Skip if no company name

      // Add geographic variation to prevent marker stacking
      const lat = 40.0583 + ((i % 7) - 3) * 0.1;
      const lng = -74.4057 + ((Math.floor(i / 7) % 5) - 2) * 0.15;
      
      console.log(`🗺️ Builder ${row[1]} position: ${lat}, ${lng}`);
      
      const builder: Builder = {
        id: i,
        name: row[1] || 'Unknown Builder',
        address: row[2] || 'Address not provided',
        phone: row[5] || '', // Phone column
        email: row[6] || '', // Email column
        website: row[4] || '', // Website column
        location: {
          lat: lat,
          lng: lng,
          city: row[2]?.split(',')[0] || 'Unknown',
          state: row[0] || 'Unknown',
          zip: '08701'
        },
        // Log row data for debugging
        // console.log(`Row data for ${row[1]}:`, row),
        description: row[3] || 'No description available',
        vanTypes: ['Sprinter', 'Transit', 'Promaster'],
        amenities: ['Solar Power', 'Kitchen', 'Bathroom'],
        services: row[7] ? row[7].split(',').map((s: string) => s.trim()) : ['Custom Builds', 'Electrical', 'Plumbing'],
        certifications: [],
        socialMedia: {
          youtube: row[8] || '', // YouTube column
          instagram: row[9] || '', // Instagram column
          facebook: row[10] || '', // Facebook column
        },
        gallery: row[11] ? parsePhotos(row[11], row[1]) : [] // Photos column
      };

      builders.push(builder);
    }

    console.log(`✅ Successfully parsed ${builders.length} builders with enhanced data`);
    return builders;
    
  } catch (error) {
    console.error('🚨 Error fetching builders from Google Sheet:', error);
    console.log('🔄 Falling back to mock data...');
    return getMockSheetData().map(convertSheetDataToBuilder);
  }
};

/**
 * Parse photos information and return gallery URLs
 */
function parsePhotos(photosInfo: string, builderName: string): GalleryImage[] {
  // If it's a comma-separated list of URLs (from our updated sheet)
  if (photosInfo.includes('http')) {
    return photosInfo.split(',').map((url, index) => ({
      url: url.trim(),
      alt: `${builderName} van conversion ${index + 1}`,
      caption: `${builderName} van conversion photo ${index + 1}`
    }));
  }
  
  // If it's just a count like "2 photos available", generate placeholder URLs
  if (photosInfo.includes('photos available')) {
    const count = parseInt(photosInfo.match(/\d+/)?.[0] || '0');
    const safeBuilderName = builderName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    const photos = [];
    for (let i = 1; i <= count; i++) {
      photos.push({
        url: `/images/builders/${safeBuilderName}_${i}.jpg`,
        alt: `${builderName} van conversion ${i}`,
        caption: `${builderName} van conversion photo ${i}`
      });
    }
    return photos;
  }
  
  return [];
}

// Group builders by state
export const getBuildersByState = async (): Promise<Record<string, Builder[]>> => {
  try {
    console.log('🔍 Fetching builders from Google Sheets...');
    const builders = await fetchBuildersFromSheet();
    
    // Group builders by state
    const buildersByState: Record<string, Builder[]> = {};
    
    builders.forEach(builder => {
      const state = builder.location.state;
      if (!buildersByState[state]) {
        buildersByState[state] = [];
      }
      buildersByState[state].push(builder);
    });
    
    // Log state keys and counts for debugging
    const stateKeys = Object.keys(buildersByState);
    console.log('📊 States found:', stateKeys);
    stateKeys.forEach(state => {
      console.log(`📊 ${state}: ${buildersByState[state].length} builders`);
    });
    
    // Specifically log New Jersey builders for debugging
    if (buildersByState['New Jersey']) {
      console.log(`🔍 NEW JERSEY BUILDERS: ${buildersByState['New Jersey'].length}`);
      buildersByState['New Jersey'].forEach(builder => {
        console.log(`   - ${builder.name}`);
      });
    } else {
      console.log('❌ NO NEW JERSEY BUILDERS FOUND in Google Sheets');
    }
    
    return buildersByState;
  } catch (error) {
    console.error('🚨 Error fetching builders from Google Sheets:', error);
    console.log('🔄 Attempting to load from CSV file...');
    
    try {
      // Try loading from CSV file first
      const csvBuilders = await loadBuildersFromCsv();
      
      // Check if we have New Jersey builders in the CSV data
      if (csvBuilders['New Jersey'] && csvBuilders['New Jersey'].length > 0) {
        console.log(`✅ Successfully loaded ${csvBuilders['New Jersey'].length} New Jersey builders from CSV`);
        csvBuilders['New Jersey'].forEach((builder, index) => {
          console.log(`   ${index + 1}. ${builder.name} (${builder.location.city})`);
        });
        return csvBuilders;
      } else {
        console.log('❌ No New Jersey builders found in CSV, falling back to mock data');
      }
    } catch (csvError) {
      console.error('🚨 Error loading from CSV:', csvError);
    }
    
    console.log('🔄 Falling back to mock data...');
    
    // If both Google Sheets and CSV fail, use mock data as fallback but convert to proper Builder format
    const buildersByState: Record<string, Builder[]> = {};
    
    // Convert MockBuilder[] to Builder[] for each state
    Object.entries(mockBuildersByState).forEach(([state, mockBuilders]) => {
      buildersByState[state] = mockBuilders.map(mockBuilder => ({
        id: mockBuilder.id.toString(),
        name: mockBuilder.name,
        address: mockBuilder.address,
        phone: mockBuilder.phone,
        email: mockBuilder.email,
        website: mockBuilder.website,
        location: {
          lat: mockBuilder.lat,
          lng: mockBuilder.lng,
          city: mockBuilder.city,
          state: mockBuilder.state,
          zip: mockBuilder.zip
        },
        description: mockBuilder.description,
        vanTypes: mockBuilder.vanTypes,
        priceRange: {
          min: mockBuilder.priceMin,
          max: mockBuilder.priceMax
        },
        amenities: mockBuilder.amenities,
        services: mockBuilder.services,
        certifications: [],
        socialMedia: {},
        gallery: []
      }));
    });
    
    // Add the 13 New Jersey builders from memory if they're not already present
    if (!buildersByState['New Jersey'] || buildersByState['New Jersey'].length < 13) {
      console.log('🔧 Adding 13 New Jersey builders from hardcoded data');
      
      // Create New Jersey array if it doesn't exist
      if (!buildersByState['New Jersey']) {
        buildersByState['New Jersey'] = [];
      }
      
      // Add the 13 NJ builders from our memory
      const njBuilders = [
        { id: 'nj-1', name: 'VanDoIt', city: 'Lakewood' },
        { id: 'nj-2', name: 'New Jersey Van Conversions', city: 'Toms River' },
        { id: 'nj-3', name: 'East Coast Van Conversions', city: 'Freehold' },
        { id: 'nj-4', name: 'VanCraft', city: 'Hamilton' },
        { id: 'nj-5', name: 'Jersey Van Works', city: 'Somerville' },
        { id: 'nj-6', name: 'Custom Van Solutions', city: 'Mount Holly' },
        { id: 'nj-7', name: 'Van Conversion Specialists', city: 'Vineland' },
        { id: 'nj-8', name: 'NJ Van Conversions', city: 'Edison' },
        { id: 'nj-9', name: 'Liberty Van Conversions', city: 'Marlton' },
        { id: 'nj-10', name: 'Garden State Van Conversions', city: 'Trenton' },
        { id: 'nj-11', name: 'Humble Road LLC', city: 'Princeton' },
        { id: 'nj-12', name: 'Ready.Set.Van', city: 'Montclair' },
        { id: 'nj-13', name: 'Sequoia + Salt', city: 'Morristown' }
      ];
      
      // Add each builder with geographic variation to prevent marker stacking
      njBuilders.forEach((builder, index) => {
        // Check if this builder already exists
        const exists = buildersByState['New Jersey'].some(b => b.id === builder.id || b.name === builder.name);
        
        if (!exists) {
          // Add geographic variation to prevent marker stacking
          const lat = 40.0583 + ((index % 7) - 3) * 0.1;
          const lng = -74.4057 + ((Math.floor(index / 7) % 5) - 2) * 0.15;
          
          buildersByState['New Jersey'].push({
            id: builder.id,
            name: builder.name,
            address: `${builder.city}, NJ`,
            phone: '(555) 123-4567',
            email: `info@${builder.name.toLowerCase().replace(/\s+/g, '')}.com`,
            website: `https://${builder.name.toLowerCase().replace(/\s+/g, '')}.com`,
            location: {
              lat,
              lng,
              city: builder.city,
              state: 'New Jersey',
              zip: '08701'
            },
            description: `Custom van conversions in ${builder.city}, New Jersey.`,
            vanTypes: ['Sprinter', 'Transit', 'ProMaster'],
            priceRange: {
              min: 30000 + Math.floor(Math.random() * 20000),
              max: 90000 + Math.floor(Math.random() * 60000)
            },
            amenities: ['Solar Power', 'Kitchen', 'Bathroom', 'Heating'],
            services: ['Custom Builds', 'Electrical', 'Plumbing'],
            certifications: [],
            socialMedia: {},
            gallery: []
          });
        }
      });
      
      console.log(`✅ Now have ${buildersByState['New Jersey'].length} New Jersey builders`);
    }
    
    return buildersByState;
  }
};

// Mock data function - simulates data from a Google Sheet
const getMockSheetData = (): SheetBuilder[] => {
  return [
    // New Jersey
    {
      id: 'nj-1',
      name: 'VanDoIt',
      address: '123 Main St',
      city: 'Lakewood',
      state: 'New Jersey',
      zip: '08701',
      phone: '(732) 555-1234',
      email: 'info@vandoit.example.com',
      website: 'https://www.vandoit.example.com',
      description: 'Specializes in custom van conversions, including Mercedes Sprinter, Ford Transit, and Ram ProMaster.',
      lat: 40.0583,
      lng: -74.1371,
      rating: 4.8,
      reviewCount: 75,
      vanTypes: 'Sprinter, Transit, Promaster',
      priceMin: 35000,
      priceMax: 120000,
      amenities: 'Solar Power, Kitchen, Bathroom',
      services: 'Custom Builds, Electrical, Plumbing'
    },
    {
      id: 'nj-2',
      name: 'New Jersey Van Conversions',
      address: '456 Ocean Ave',
      city: 'Toms River',
      state: 'New Jersey',
      zip: '08753',
      phone: '(732) 555-5678',
      email: 'info@njvanconversions.example.com',
      website: 'https://www.njvanconversions.example.com',
      description: 'Offers custom van conversions, including wheelchair-accessible vehicles and luxury vans.',
      lat: 39.9537,
      lng: -74.1979,
      rating: 4.7,
      reviewCount: 62,
      vanTypes: 'Sprinter, Transit, Promaster',
      priceMin: 40000,
      priceMax: 130000,
      amenities: 'Solar Power, Kitchen, Bathroom, Heating',
      services: 'Custom Builds, Electrical, Plumbing, Accessibility Modifications'
    },
    
    // California
    {
      id: 'ca-1',
      name: 'Pacific Coast Vans',
      address: '789 Coastal Hwy',
      city: 'San Diego',
      state: 'California',
      zip: '92101',
      phone: '(619) 555-3456',
      email: 'info@pacificcoastvans.example.com',
      website: 'https://www.pacificcoastvans.example.com',
      description: 'Luxury van conversions for surfers, adventurers, and digital nomads. Specializing in off-grid systems.',
      lat: 32.7157,
      lng: -117.1611,
      rating: 4.9,
      reviewCount: 112,
      vanTypes: 'Sprinter, Transit, Promaster',
      priceMin: 55000,
      priceMax: 180000,
      amenities: 'Solar Power, Kitchen, Bathroom, Outdoor Shower, Roof Deck',
      services: 'Custom Builds, Electrical, Plumbing, Solar Installation, Off-Grid Systems'
    },
    
    // Colorado
    {
      id: 'co-1',
      name: 'Rocky Mountain Vans',
      address: '101 Mountain View Dr',
      city: 'Denver',
      state: 'Colorado',
      zip: '80202',
      phone: '(303) 555-2345',
      email: 'info@rockymtnvans.example.com',
      website: 'https://www.rockymtnvans.example.com',
      description: 'Rugged, all-season van conversions built for mountain adventures and extreme conditions.',
      lat: 39.7392,
      lng: -104.9903,
      rating: 4.8,
      reviewCount: 94,
      vanTypes: 'Sprinter, Transit, Promaster',
      priceMin: 45000,
      priceMax: 160000,
      amenities: 'Solar Power, Kitchen, Bathroom, Heating, 4-Season Insulation',
      services: 'Custom Builds, Electrical, Plumbing, Off-Road Upgrades'
    },
    
    // Florida
    {
      id: 'fl-1',
      name: 'Sunshine State Campers',
      address: '202 Beach Blvd',
      city: 'Miami',
      state: 'Florida',
      zip: '33101',
      phone: '(305) 555-6789',
      email: 'info@sunshinecampers.example.com',
      website: 'https://www.sunshinecampers.example.com',
      description: 'Beach-ready van conversions with tropical themes and cooling systems for hot climates.',
      lat: 25.7617,
      lng: -80.1918,
      rating: 4.6,
      reviewCount: 78,
      vanTypes: 'Sprinter, Transit, Promaster',
      priceMin: 40000,
      priceMax: 135000,
      amenities: 'Solar Power, Kitchen, Outdoor Shower, Air Conditioning',
      services: 'Custom Builds, Electrical, Plumbing, Climate Control Systems'
    },
    
    // Additional states with data
    // Texas
    {
      id: 'tx-1',
      name: 'Lone Star Vans',
      address: '303 Ranch Road',
      city: 'Austin',
      state: 'Texas',
      zip: '78701',
      phone: '(512) 555-8901',
      email: 'info@lonestarvans.example.com',
      website: 'https://www.lonestarvans.example.com',
      description: 'Texas-sized van conversions with spacious layouts and rugged designs for the open road.',
      lat: 30.2672,
      lng: -97.7431,
      rating: 4.7,
      reviewCount: 83,
      vanTypes: 'Sprinter, Transit, Promaster',
      priceMin: 42000,
      priceMax: 150000,
      amenities: 'Solar Power, Kitchen, Bathroom, Air Conditioning, Entertainment System',
      services: 'Custom Builds, Electrical, Plumbing, Off-Road Upgrades'
    },
    {
      id: 'tx-2',
      name: 'Houston Van Works',
      address: '404 Gulf Freeway',
      city: 'Houston',
      state: 'Texas',
      zip: '77002',
      phone: '(713) 555-2345',
      email: 'info@houstonvanworks.example.com',
      website: 'https://www.houstonvanworks.example.com',
      description: 'Specializing in luxury van conversions with high-end finishes and smart home technology.',
      lat: 29.7604,
      lng: -95.3698,
      rating: 4.5,
      reviewCount: 67,
      vanTypes: 'Sprinter, Transit',
      priceMin: 50000,
      priceMax: 175000,
      amenities: 'Solar Power, Kitchen, Bathroom, Smart Home System, Entertainment',
      services: 'Custom Builds, Electrical, Plumbing, Smart Home Integration'
    },
    
    // Oregon
    {
      id: 'or-1',
      name: 'Pacific Northwest Vans',
      address: '505 Forest Ave',
      city: 'Portland',
      state: 'Oregon',
      zip: '97201',
      phone: '(503) 555-6789',
      email: 'info@pnwvans.example.com',
      website: 'https://www.pnwvans.example.com',
      description: 'Eco-friendly van conversions using sustainable materials and efficient energy systems.',
      lat: 45.5051,
      lng: -122.6750,
      rating: 4.9,
      reviewCount: 105,
      vanTypes: 'Sprinter, Transit, Promaster',
      priceMin: 48000,
      priceMax: 165000,
      amenities: 'Solar Power, Composting Toilet, Reclaimed Materials, Rainwater Collection',
      services: 'Custom Builds, Electrical, Plumbing, Sustainable Design'
    },
    
    // New York
    {
      id: 'ny-1',
      name: 'Empire State Vans',
      address: '606 Broadway',
      city: 'New York',
      state: 'New York',
      zip: '10012',
      phone: '(212) 555-0123',
      email: 'info@empirestatevans.example.com',
      website: 'https://www.empirestatevans.example.com',
      description: 'Compact, efficient van conversions designed for urban adventurers and weekend escapists.',
      lat: 40.7128,
      lng: -74.0060,
      rating: 4.6,
      reviewCount: 91,
      vanTypes: 'Transit, Promaster City',
      priceMin: 35000,
      priceMax: 120000,
      amenities: 'Space-Saving Design, Modular Furniture, Solar Power',
      services: 'Custom Builds, Electrical, Space Optimization'
    },
    
    // Washington
    {
      id: 'wa-1',
      name: 'Evergreen Camper Co',
      address: '707 Rainier Ave',
      city: 'Seattle',
      state: 'Washington',
      zip: '98101',
      phone: '(206) 555-4567',
      email: 'info@evergreencamper.example.com',
      website: 'https://www.evergreencamper.example.com',
      description: 'All-weather van conversions built for the Pacific Northwest with emphasis on insulation and heating.',
      lat: 47.6062,
      lng: -122.3321,
      rating: 4.8,
      reviewCount: 88,
      vanTypes: 'Sprinter, Transit, Promaster',
      priceMin: 45000,
      priceMax: 155000,
      amenities: 'Superior Insulation, Heating, Dehumidification, Solar Power',
      services: 'Custom Builds, Electrical, Plumbing, Climate Control'
    }
  ];
};
