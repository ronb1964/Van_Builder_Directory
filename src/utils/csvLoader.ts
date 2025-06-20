import { Builder, PricingTier } from '../types';

// Function to parse CSV data and convert to Builder objects
export const parseCsvToBuilders = (csvText: string): Record<string, Builder[]> => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  const buildersByState: Record<string, Builder[]> = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV line with proper handling of quoted fields
    const values = parseCsvLine(line);
    
    if (values.length < headers.length) continue;
    
    const builder: Builder = {
      id: values[0] || `builder-${i}`,
      name: values[1] || 'Unknown Builder',
      address: `${values[2] || ''}, ${values[3] || ''}, ${values[4] || ''} ${values[5] || ''}`.trim(),
      phone: values[6] || '',
      email: values[7] || '',
      website: values[8] || '',
      location: {
        lat: parseFloat(values[9]) || 0,
        lng: parseFloat(values[10]) || 0,
        city: values[3] || '',
        state: values[4] === 'NJ' ? 'New Jersey' : values[4] || '',
        zip: values[5] || ''
      },
      description: values[11] || '',
      rating: parseFloat(values[12]) || 4.0,
      reviewCount: parseInt(values[13]) || 0,
      reviews: [],
      vanTypes: values[14] ? values[14].split(',').map(t => t.trim()) : [],
      priceRange: {
        min: parseInt(values[15]) || 30000,
        max: parseInt(values[16]) || 100000
      },
      pricingTiers: generatePricingTiers(parseInt(values[15]) || 30000, parseInt(values[16]) || 100000),
      amenities: values[17] ? values[17].split(',').map(a => a.trim()) : [],
      services: values[18] ? values[18].split(',').map(s => s.trim()) : [],
      certifications: values[19] ? values[19].split(',').map(c => c.trim()) : [],
      yearsInBusiness: parseInt(values[20]) || 5,
      socialMedia: {},
      gallery: []
    };
    
    const state = builder.location.state;
    if (!buildersByState[state]) {
      buildersByState[state] = [];
    }
    buildersByState[state].push(builder);
  }
  
  return buildersByState;
};

// Helper function to parse a CSV line with proper quote handling
const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// Generate pricing tiers based on min and max price
const generatePricingTiers = (minPrice: number, maxPrice: number): PricingTier[] => {
  const range = maxPrice - minPrice;
  const basicPrice = minPrice;
  const standardPrice = minPrice + (range * 0.4);
  const premiumPrice = minPrice + (range * 0.8);
  
  return [
    {
      name: 'Basic',
      price: basicPrice,
      description: 'Essential conversion with basic amenities',
      features: [
        'Basic electrical system',
        'Simple storage solutions',
        'Basic insulation',
        'Standard flooring'
      ]
    },
    {
      name: 'Standard',
      price: standardPrice,
      description: 'Comfortable conversion with enhanced features',
      features: [
        'Enhanced electrical system',
        'Kitchen setup',
        'Improved storage',
        'Better insulation',
        'Solar power ready'
      ]
    },
    {
      name: 'Premium',
      price: premiumPrice,
      description: 'Luxury conversion with premium amenities',
      features: [
        'Advanced electrical system',
        'Full kitchen with appliances',
        'Bathroom facilities',
        'Premium finishes',
        'Solar power system',
        'Custom storage solutions'
      ]
    }
  ];
};

// Load builders from CSV file
export const loadBuildersFromCsv = async (): Promise<Record<string, Builder[]>> => {
  try {
    const response = await fetch('/all_builders.csv');
    if (!response.ok) {
      throw new Error('Failed to load CSV file');
    }
    
    const csvText = await response.text();
    return parseCsvToBuilders(csvText);
  } catch (error) {
    console.error('Error loading builders from CSV:', error);
    return {};
  }
};
