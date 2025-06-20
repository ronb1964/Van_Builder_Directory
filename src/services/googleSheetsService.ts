import { Builder, Location } from '../types/builder';

export class GoogleSheetsService {
  private apiKey: string;
  private spreadsheetId: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || '';
    this.spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_ID || '';
    
    if (!this.apiKey || !this.spreadsheetId) {
      console.error('Missing Google Sheets configuration');
    }
  }

  /**
   * Fetch all builders from Google Sheets
   * New column structure: Company Name, Address, City, State, Zip, Description, Website, Phone, Email, Services, YouTube, Instagram, Facebook, Photos
   */
  async getBuilders(): Promise<Builder[]> {
    try {
      console.log('🔗 Fetching builders from Google Sheets...');
      console.log('📋 API Key exists:', !!process.env.REACT_APP_GOOGLE_SHEETS_API_KEY);
      console.log('📋 Sheet ID exists:', !!process.env.REACT_APP_GOOGLE_SHEETS_ID);
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${process.env.REACT_APP_GOOGLE_SHEETS_ID}/values/builders!A:N?key=${process.env.REACT_APP_GOOGLE_SHEETS_API_KEY}`
      );

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Raw API data received:', {
        hasValues: !!data.values,
        rowCount: data.values?.length || 0,
        firstRow: data.values?.[0],
        secondRow: data.values?.[1]
      });

      const rows = data.values || [];
      
      if (rows.length === 0) {
        console.warn('⚠️ No data found in sheet');
        return [];
      }

      console.log('📋 Sheet structure check:', {
        headerRow: rows[0],
        totalRows: rows.length,
        sampleDataRow: rows[1]
      });

      // Reset city builder counter for consistent positioning
      (window as any).cityBuilderCounts = {};
      
      const builders: Builder[] = [];

      // Skip header row and convert to builder objects
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue; // Skip if no company name

        const builder: Builder = {
          id: i,
          name: row[0] || 'Unknown Builder', // Column A: Company Name
          address: row[1] || `${row[2] || 'Unknown City'}, ${row[3] || 'Unknown State'}`, // Column B: Address (fallback to city, state if empty)
          phone: row[7] || '', // Column H: Phone
          email: row[8] || '', // Column I: Email
          website: row[6] || '', // Column G: Website
          location: this.getBuilderCoordinatesFromCityState(row[2], row[3], i), // Column C: City, Column D: State
          description: row[5] || 'No description available', // Column F: Description
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
          reviewCount: Math.floor(Math.random() * 200) + 10,
          reviews: [],
          vanTypes: ['Sprinter', 'Transit', 'Promaster'],
          amenities: ['Solar Power', 'Kitchen', 'Bathroom'],
          services: row[9] ? row[9].split(',').map((s: string) => s.trim()) : ['Custom Builds', 'Electrical', 'Plumbing'], // Column J: Services
          certifications: [],
          socialMedia: {
            youtube: row[10] || '', // Column K: YouTube
            instagram: row[11] || '', // Column L: Instagram
            facebook: row[12] || '', // Column M: Facebook
          },
          photos: row[13] ? row[13].split(',').map((url: string) => url.trim()) : [], // Column N: Photos
        };

        console.log(`🗺️ Builder ${i + 1} (${builder.name}) coordinates:`, {
          city: row[2],
          state: row[3],
          lat: builder.location.lat,
          lng: builder.location.lng
        });

        // Debug logging for first builder to understand data structure
        if (i === 1) {
          console.log('🔍 Debug: First builder raw data:', {
            companyName: row[0],
            address: row[1],
            city: row[2],
            state: row[3],
            zip: row[4],
            description: row[5],
            website: row[6],
            phone: row[7],
            email: row[8],
            services: row[9],
            youtube: row[10],
            instagram: row[11],
            facebook: row[12],
            photos: row[13],
            allColumns: row // Show all columns to understand structure
          });
          console.log('🔍 Debug: Processed builder object:', {
            name: builder.name,
            phone: builder.phone,
            email: builder.email,
            socialMedia: builder.socialMedia,
            photos: builder.photos
          });
        }

        // Debug specific builders for gallery testing
        if (row[0] && (row[0].includes('VanDoIt') || row[0].includes('Humble Road') || row[0].includes('Ready.Set.Van'))) {
          console.log(`🖼️ Gallery Debug for ${row[0]}:`, {
            rawPhotosData: row[13],
            parsedGallery: builder.photos,
            galleryLength: builder.photos?.length || 0
          });
        }

        // Debug photos for all builders
        if (row[13]) {
          console.log(`📸 Photos Debug for ${builder.name}:`, {
            rawPhotosData: row[13],
            parsedPhotos: builder.photos,
            photosLength: builder.photos?.length || 0
          });
        } else {
          console.log(`📸 No photos found for ${builder.name} - Column N is empty:`, row[13]);
        }

        builders.push(builder);
      }

      console.log(`✅ Successfully processed ${builders.length} builders`);
      return builders;
    } catch (error) {
      console.error('Error fetching builders:', error);
      return [];
    }
  }

  /**
   * Fetch builders filtered by state
   * New column structure: Company Name, Address, City, State, Zip, Description, Website, Phone, Email, Services, YouTube, Instagram, Facebook, Photos
   */
  async getBuildersByState(state: string): Promise<Builder[]> {
    try {
      console.log(`🔄 Fetching builders for state: ${state}`);
      
      // Reset city builder counter for consistent positioning
      (window as any).cityBuilderCounts = {};
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/builders!A:N?key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.values || data.values.length === 0) {
        return [];
      }

      const rows = data.values;
      const builders: Builder[] = [];

      // Skip header row and convert to builder objects
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue; // Skip if no company name

        if (row[3] && row[3].toLowerCase() !== state.toLowerCase()) continue; // Skip if not the desired state (Column D)

        const builder: Builder = {
          id: i,
          name: row[0] || 'Unknown Builder', // Column A: Company Name
          address: row[1] || `${row[2] || 'Unknown City'}, ${row[3] || 'Unknown State'}`, // Column B: Address (fallback to city, state if empty)
          phone: row[7] || '', // Column H: Phone
          email: row[8] || '', // Column I: Email
          website: row[6] || '', // Column G: Website
          location: this.getBuilderCoordinatesFromCityState(row[2], row[3], i), // Column C: City, Column D: State
          description: row[5] || 'No description available', // Column F: Description
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
          reviewCount: Math.floor(Math.random() * 200) + 10,
          reviews: [],
          vanTypes: ['Sprinter', 'Transit', 'Promaster'],
          amenities: ['Solar Power', 'Kitchen', 'Bathroom'],
          services: row[9] ? row[9].split(',').map((s: string) => s.trim()) : ['Custom Builds', 'Electrical', 'Plumbing'], // Column J: Services
          certifications: [],
          socialMedia: {
            youtube: row[10] || '', // Column K: YouTube
            instagram: row[11] || '', // Column L: Instagram
            facebook: row[12] || '', // Column M: Facebook
          },
          photos: row[13] ? row[13].split(',').map((url: string) => url.trim()) : [], // Column N: Photos
        };

        console.log(`🗺️ Builder ${i + 1} (${builder.name}) coordinates:`, {
          city: row[2],
          state: row[3],
          lat: builder.location.lat,
          lng: builder.location.lng
        });

        // Debug logging for first builder to understand data structure
        if (i === 1) {
          console.log('🔍 Debug: First builder raw data:', {
            companyName: row[0],
            address: row[1],
            city: row[2],
            state: row[3],
            zip: row[4],
            description: row[5],
            website: row[6],
            phone: row[7],
            email: row[8],
            services: row[9],
            youtube: row[10],
            instagram: row[11],
            facebook: row[12],
            photos: row[13],
            allColumns: row // Show all columns to understand structure
          });
          console.log('🔍 Debug: Processed builder object:', {
            name: builder.name,
            phone: builder.phone,
            email: builder.email,
            socialMedia: builder.socialMedia,
            photos: builder.photos
          });
        }

        // Debug specific builders for gallery testing
        if (row[0] && (row[0].includes('VanDoIt') || row[0].includes('Humble Road') || row[0].includes('Ready.Set.Van'))) {
          console.log(`🖼️ Gallery Debug for ${row[0]}:`, {
            rawPhotosData: row[13],
            parsedGallery: builder.photos,
            galleryLength: builder.photos?.length || 0
          });
        }

        // Debug photos for all builders
        if (row[13]) {
          console.log(`📸 Photos Debug for ${builder.name}:`, {
            rawPhotosData: row[13],
            parsedPhotos: builder.photos,
            photosLength: builder.photos?.length || 0
          });
        } else {
          console.log(`📸 No photos found for ${builder.name} - Column N is empty:`, row[13]);
        }

        builders.push(builder);
      }

      console.log(`✅ Found ${builders.length} builders in ${state}`);
      return builders;
    } catch (error) {
      console.error(`Error fetching builders for ${state}:`, error);
      return [];
    }
  }

  // Comprehensive city coordinates database covering major US cities
  private getCityCoordinates(city: string, state: string): { lat: number; lng: number } | null {
    if (!city || !state) return null;
    
    const cityKey = `${city.toLowerCase()}, ${state.toLowerCase()}`;
    
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      // New Jersey cities (comprehensive coverage)
      'brick, new jersey': { lat: 40.0583, lng: -74.1057 },
      'manasquan, new jersey': { lat: 40.1148, lng: -74.0465 },
      'toms river, new jersey': { lat: 39.9537, lng: -74.1979 },
      'edison, new jersey': { lat: 40.5187, lng: -74.4121 },
      'newark, new jersey': { lat: 40.7357, lng: -74.1724 },
      'jersey city, new jersey': { lat: 40.7178, lng: -74.0431 },
      'paterson, new jersey': { lat: 40.9168, lng: -74.1718 },
      'elizabeth, new jersey': { lat: 40.6640, lng: -74.2107 },
      'trenton, new jersey': { lat: 40.2206, lng: -74.7565 },
      'camden, new jersey': { lat: 39.9259, lng: -75.1196 },
      'bayonne, new jersey': { lat: 40.6687, lng: -74.1143 },
      'east orange, new jersey': { lat: 40.7673, lng: -74.2049 },
      'vineland, new jersey': { lat: 39.4864, lng: -75.0260 },
      'union city, new jersey': { lat: 40.7662, lng: -74.0632 },
      'passaic, new jersey': { lat: 40.8568, lng: -74.1284 },
      'clifton, new jersey': { lat: 40.8584, lng: -74.1638 },
      'hoboken, new jersey': { lat: 40.7439, lng: -74.0324 },
      'west new york, new jersey': { lat: 40.7879, lng: -74.0143 },
      'plainfield, new jersey': { lat: 40.6337, lng: -74.4071 },
      'hackensack, new jersey': { lat: 40.8859, lng: -74.0435 },
      'sayreville, new jersey': { lat: 40.4595, lng: -74.3610 },
      
      // Major US cities by state
      'los angeles, california': { lat: 34.0522, lng: -118.2437 },
      'san francisco, california': { lat: 37.7749, lng: -122.4194 },
      'san diego, california': { lat: 32.7157, lng: -117.1611 },
      'sacramento, california': { lat: 38.5816, lng: -121.4944 },
      'fresno, california': { lat: 36.7378, lng: -119.7871 },
      'oakland, california': { lat: 37.8044, lng: -122.2711 },
      'san jose, california': { lat: 37.3382, lng: -121.8863 },
      
      'houston, texas': { lat: 29.7604, lng: -95.3698 },
      'dallas, texas': { lat: 32.7767, lng: -96.7970 },
      'austin, texas': { lat: 30.2672, lng: -97.7431 },
      'san antonio, texas': { lat: 29.4241, lng: -98.4936 },
      'fort worth, texas': { lat: 32.7555, lng: -97.3308 },
      'el paso, texas': { lat: 31.7619, lng: -106.4850 },
      
      'miami, florida': { lat: 25.7617, lng: -80.1918 },
      'tampa, florida': { lat: 27.9506, lng: -82.4572 },
      'orlando, florida': { lat: 28.5383, lng: -81.3792 },
      'jacksonville, florida': { lat: 30.3322, lng: -81.6557 },
      'tallahassee, florida': { lat: 30.4518, lng: -84.2807 },
      'fort lauderdale, florida': { lat: 26.1224, lng: -80.1373 },
      
      'new york, new york': { lat: 40.7128, lng: -74.0060 },
      'buffalo, new york': { lat: 42.8864, lng: -78.8784 },
      'rochester, new york': { lat: 43.1566, lng: -77.6088 },
      'albany, new york': { lat: 42.6526, lng: -73.7562 },
      'syracuse, new york': { lat: 43.0481, lng: -76.1474 },
      
      'chicago, illinois': { lat: 41.8781, lng: -87.6298 },
      'springfield, illinois': { lat: 39.7817, lng: -89.6501 },
      'rockford, illinois': { lat: 42.2711, lng: -89.0940 },
      
      // Add more major cities as needed...
      'phoenix, arizona': { lat: 33.4484, lng: -112.0740 },
      'denver, colorado': { lat: 39.7392, lng: -104.9903 },
      'atlanta, georgia': { lat: 33.7490, lng: -84.3880 },
      'seattle, washington': { lat: 47.6062, lng: -122.3321 },
      'portland, oregon': { lat: 45.5152, lng: -122.6784 },
      'las vegas, nevada': { lat: 36.1699, lng: -115.1398 },
      'boston, massachusetts': { lat: 42.3601, lng: -71.0589 },
      'detroit, michigan': { lat: 42.3314, lng: -83.0458 },
      'minneapolis, minnesota': { lat: 44.9778, lng: -93.2650 },
      'philadelphia, pennsylvania': { lat: 39.9526, lng: -75.1652 },
      'pittsburgh, pennsylvania': { lat: 40.4406, lng: -79.9959 },
      'baltimore, maryland': { lat: 39.2904, lng: -76.6122 },
      'washington, district of columbia': { lat: 38.9072, lng: -77.0369 },
      'charlotte, north carolina': { lat: 35.2271, lng: -80.8431 },
      'raleigh, north carolina': { lat: 35.7796, lng: -78.6382 },
      'nashville, tennessee': { lat: 36.1627, lng: -86.7816 },
      'memphis, tennessee': { lat: 35.1495, lng: -90.0490 },
      'new orleans, louisiana': { lat: 29.9511, lng: -90.0715 },
      'oklahoma city, oklahoma': { lat: 35.4676, lng: -97.5164 },
      'kansas city, missouri': { lat: 39.0997, lng: -94.5786 },
      'st. louis, missouri': { lat: 38.6270, lng: -90.1994 },
      'milwaukee, wisconsin': { lat: 43.0389, lng: -87.9065 },
      'indianapolis, indiana': { lat: 39.7684, lng: -86.1581 },
      'columbus, ohio': { lat: 39.9612, lng: -82.9988 },
      'cleveland, ohio': { lat: 41.4993, lng: -81.6944 },
      'cincinnati, ohio': { lat: 39.1031, lng: -84.5120 },
      'richmond, virginia': { lat: 37.5407, lng: -77.4360 },
      'virginia beach, virginia': { lat: 36.8529, lng: -75.9780 },
      'charleston, south carolina': { lat: 32.7765, lng: -79.9311 },
      'columbia, south carolina': { lat: 34.0007, lng: -81.0348 },
      'birmingham, alabama': { lat: 33.5186, lng: -86.8104 },
      'montgomery, alabama': { lat: 32.3668, lng: -86.3000 },
      'little rock, arkansas': { lat: 34.7465, lng: -92.2896 },
      'jackson, mississippi': { lat: 32.2988, lng: -90.1848 },
      'baton rouge, louisiana': { lat: 30.4515, lng: -91.1871 },
      'shreveport, louisiana': { lat: 32.5252, lng: -93.7502 },
      'salt lake city, utah': { lat: 40.7608, lng: -111.8910 },
      'boise, idaho': { lat: 43.6150, lng: -116.2023 },
      'billings, montana': { lat: 45.7833, lng: -108.5007 },
      'cheyenne, wyoming': { lat: 41.1400, lng: -104.8197 },
      'fargo, north dakota': { lat: 46.8772, lng: -96.7898 },
      'sioux falls, south dakota': { lat: 43.5446, lng: -96.7311 },
      'omaha, nebraska': { lat: 41.2565, lng: -95.9345 },
      'wichita, kansas': { lat: 37.6872, lng: -97.3301 },
      'des moines, iowa': { lat: 41.5868, lng: -93.6250 },
      'cedar rapids, iowa': { lat: 41.9778, lng: -91.6656 },
      'anchorage, alaska': { lat: 61.2181, lng: -149.9003 },
      'honolulu, hawaii': { lat: 21.3099, lng: -157.8581 },
      'burlington, vermont': { lat: 44.4759, lng: -73.2121 },
      'manchester, new hampshire': { lat: 42.9956, lng: -71.4548 },
      'portland, maine': { lat: 43.6591, lng: -70.2568 },
      'providence, rhode island': { lat: 41.8240, lng: -71.4128 },
      'hartford, connecticut': { lat: 41.7658, lng: -72.6734 },
      'wilmington, delaware': { lat: 39.7391, lng: -75.5398 },
    };
    
    return cityCoordinates[cityKey] || null;
  }

  // Get accurate coordinates for a builder using separate city and state columns
  private getBuilderCoordinatesFromCityState(city: string, state: string, builderIndex: number): { lat: number; lng: number; city: string; state: string; zip: string } {
    console.log(`🎯 Getting coordinates for builder ${builderIndex}:`, {
      city: city || 'Unknown',
      state: state || 'Unknown'
    });
    
    // Try to get exact city coordinates first
    const cityCoords = this.getCityCoordinates(city, state);
    if (cityCoords) {
      // Create a unique key for this city to track how many builders are there
      const cityKey = `${city.toLowerCase()}, ${state.toLowerCase()}`;
      
      // Initialize city counter if not exists
      if (!(window as any).cityBuilderCounts) {
        (window as any).cityBuilderCounts = {};
      }
      
      // Increment counter for this city
      if (!(window as any).cityBuilderCounts[cityKey]) {
        (window as any).cityBuilderCounts[cityKey] = 0;
      }
      const cityBuilderIndex = (window as any).cityBuilderCounts[cityKey]++;
      
      // Create offset pattern for multiple builders in same city
      // Use a circular pattern to spread them around the city center
      const offsetDistance = 0.008; // ~0.5 miles
      const angle = (cityBuilderIndex * 60) * (Math.PI / 180); // 60 degrees apart
      const offsetX = Math.cos(angle) * offsetDistance;
      const offsetY = Math.sin(angle) * offsetDistance;
      
      const result = {
        lat: cityCoords.lat + offsetY,
        lng: cityCoords.lng + offsetX,
        city: city || 'Unknown',
        state: state || 'Unknown',
        zip: '08701'
      };
      
      console.log(`✅ Found city coordinates for ${city}, ${state} (builder #${cityBuilderIndex + 1} in city):`, result);
      return result;
    }
    
    // Fallback to state center with small spread if city not found
    console.log(`⚠️ City "${city}" not found in ${state}, using state center fallback`);
    const stateCenter = this.getStateCenter(state);
    const fallbackOffset = 0.05; // ~3 miles spread around state center
    const seedX = Math.sin(builderIndex * 1.3) * fallbackOffset;
    const seedY = Math.cos(builderIndex * 2.1) * fallbackOffset;
    
    const fallbackResult = {
      lat: stateCenter.lat + seedX,
      lng: stateCenter.lng + seedY,
      city: city || 'Unknown',
      state: state || 'Unknown',
      zip: '08701'
    };
    
    console.log(`🔄 Using state center fallback for ${state}:`, fallbackResult);
    return fallbackResult;
  }

  // Get state center coordinates for fallback
  private getStateCenter(state: string): { lat: number; lng: number } {
    const stateCenters: { [key: string]: { lat: number; lng: number } } = {
      'alabama': { lat: 32.806671, lng: -86.791130 },
      'alaska': { lat: 61.370716, lng: -152.404419 },
      'arizona': { lat: 33.729759, lng: -111.431221 },
      'arkansas': { lat: 34.969704, lng: -92.373123 },
      'california': { lat: 36.116203, lng: -119.681564 },
      'colorado': { lat: 39.059811, lng: -105.311104 },
      'connecticut': { lat: 41.597782, lng: -72.755371 },
      'delaware': { lat: 39.318523, lng: -75.507141 },
      'florida': { lat: 27.766279, lng: -81.686783 },
      'georgia': { lat: 33.040619, lng: -83.643074 },
      'hawaii': { lat: 21.094318, lng: -157.498337 },
      'idaho': { lat: 44.240459, lng: -114.478828 },
      'illinois': { lat: 40.349457, lng: -88.986137 },
      'indiana': { lat: 39.849426, lng: -86.258278 },
      'iowa': { lat: 42.011539, lng: -93.210526 },
      'kansas': { lat: 38.526600, lng: -96.726486 },
      'kentucky': { lat: 37.668140, lng: -84.670067 },
      'louisiana': { lat: 31.169546, lng: -91.867805 },
      'maine': { lat: 44.693947, lng: -69.381927 },
      'maryland': { lat: 39.063946, lng: -76.802101 },
      'massachusetts': { lat: 42.230171, lng: -71.530106 },
      'michigan': { lat: 43.326618, lng: -84.536095 },
      'minnesota': { lat: 45.694454, lng: -93.900192 },
      'mississippi': { lat: 32.741646, lng: -89.678696 },
      'missouri': { lat: 38.456085, lng: -92.288368 },
      'montana': { lat: 47.052952, lng: -110.454353 },
      'nebraska': { lat: 41.125370, lng: -98.268082 },
      'nevada': { lat: 38.313515, lng: -117.055374 },
      'new hampshire': { lat: 43.452492, lng: -71.563896 },
      'new jersey': { lat: 40.298904, lng: -74.521011 },
      'new mexico': { lat: 34.840515, lng: -106.248482 },
      'new york': { lat: 42.165726, lng: -74.948051 },
      'north carolina': { lat: 35.630066, lng: -79.806419 },
      'north dakota': { lat: 47.528912, lng: -99.784012 },
      'ohio': { lat: 40.388783, lng: -82.764915 },
      'oklahoma': { lat: 35.565342, lng: -96.928917 },
      'oregon': { lat: 44.572021, lng: -122.070938 },
      'pennsylvania': { lat: 40.590752, lng: -77.209755 },
      'rhode island': { lat: 41.680893, lng: -71.51178 },
      'south carolina': { lat: 33.856892, lng: -80.945007 },
      'south dakota': { lat: 44.299782, lng: -99.438828 },
      'tennessee': { lat: 35.747845, lng: -86.692345 },
      'texas': { lat: 31.054487, lng: -97.563461 },
      'utah': { lat: 40.150032, lng: -111.862434 },
      'vermont': { lat: 44.045876, lng: -72.710686 },
      'virginia': { lat: 37.769337, lng: -78.169968 },
      'washington': { lat: 47.400902, lng: -121.490494 },
      'west virginia': { lat: 38.491226, lng: -80.954453 },
      'wisconsin': { lat: 44.268543, lng: -89.616508 },
      'wyoming': { lat: 42.755966, lng: -107.302490 }
    };

    return stateCenters[state.toLowerCase()] || { lat: 39.8283, lng: -98.5795 }; // Center of US as fallback
  }

  // Get builders by ZIP code (existing functionality)
  async getBuildersByZip(zipCode: string): Promise<Builder[]> {
    // This would typically involve geocoding the ZIP and finding nearby builders
    // For now, return empty array as this feature may need separate implementation
    return [];
  }
}

// Create and export service instance
const googleSheetsService = new GoogleSheetsService();

// Export the Builder type from types
export type { Builder } from '../types/builder';

// Export service methods
export const getBuilders = () => googleSheetsService.getBuilders();
export const getBuildersByState = (state: string) => googleSheetsService.getBuildersByState(state);
export const getBuildersByZip = (zipCode: string) => googleSheetsService.getBuildersByZip(zipCode);

// Export service instance
export default googleSheetsService;
