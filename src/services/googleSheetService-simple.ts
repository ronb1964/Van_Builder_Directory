// Simplified Google Sheets service - mock data only
import { Builder } from '../types/builder';
import { mockBuilders } from '../data/mockData';

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
}

// Group builders by state - simplified version
export const getBuildersByState = async (): Promise<Record<string, Builder[]>> => {
  console.log('🔍 === SIMPLE GOOGLE SHEETS SERVICE CALLED ===');
  console.log('🔍 Function started, processing mock data...');
  
  console.log('📦 mockBuilders length:', mockBuilders.length);
  
  // Use our verified mock data
  const builders = mockBuilders.map(mockBuilder => ({
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
    rating: mockBuilder.rating,
    reviewCount: mockBuilder.reviewCount,
    vanTypes: mockBuilder.vanTypes,
    amenities: mockBuilder.amenities,
    services: mockBuilder.services,
    reviews: []
  }));
  
  console.log('🔄 Mapped builders, length:', builders.length);
  
  const buildersByState = builders.reduce((acc: Record<string, Builder[]>, builder: Builder) => {
    const state = builder.location.state;
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(builder);
    return acc;
  }, {});
  
  console.log(`✅ Loaded ${builders.length} verified builders from mock data`);
  console.log('🗺️ States available:', Object.keys(buildersByState));
  
  return buildersByState;
};
