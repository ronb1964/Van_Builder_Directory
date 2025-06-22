import { Builder } from '../types/builder';

// Use environment-specific API URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api'; // Direct connection to API server in development

export class DatabaseService {
  private fallbackBuilders: Builder[] = [
    {
      id: 1,
      name: "Humble Road",
      address: "123 Van Builder Lane, Trenton, NJ 08620",
      phone: "(609) 555-0123",
      email: "info@humbleroad.com",
      website: "https://humbleroad.com",
      location: { 
        lat: 40.2206, 
        lng: -74.7563,
        city: "Trenton",
        state: "New Jersey",
        zip: "08620"
      },
      city: "Trenton",
      state: "New Jersey",
      zipCode: "08620",
      description: "Premium van conversions with attention to detail",
      rating: 4.8,
      reviewCount: 25,
      leadTime: "3-6 months",
      vanTypes: ["Sprinter", "Transit"],
      amenities: ["Solar Power", "Bathroom", "Kitchen"],
      services: ["Custom Builds", "Conversions"],
      certifications: [],
      socialMedia: {
        instagram: "https://instagram.com/humbleroad"
      },
      photos: [],
      reviews: []
    },
    {
      id: 2,
      name: "Adventure Van Co",
      address: "456 Explorer Ave, Denver, CO 80202",
      phone: "(303) 555-0456",
      email: "hello@adventurevan.co",
      website: "https://adventurevan.co",
      location: { 
        lat: 39.7392, 
        lng: -104.9903,
        city: "Denver",
        state: "Colorado",
        zip: "80202"
      },
      city: "Denver",
      state: "Colorado",
      zipCode: "80202",
      description: "Off-grid adventure vans for the modern explorer",
      rating: 4.6,
      reviewCount: 18,
      leadTime: "4-8 months",
      vanTypes: ["ProMaster", "Sprinter"],
      amenities: ["Solar Power", "Kitchen", "Storage"],
      services: ["Custom Builds", "Solar Installation"],
      certifications: [],
      socialMedia: {
        facebook: "https://facebook.com/adventurevan",
        instagram: "https://instagram.com/adventurevan"
      },
      photos: [],
      reviews: []
    }
  ];

  private async fetchAPI(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`🔗 Making API request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log(`📡 API Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      console.log(`✅ API request successful:`, data);
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      console.error('🔗 Failed URL:', url);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to API server at ${API_BASE_URL}. Make sure the server is running.`);
      }
      
      throw error;
    }
  }

  async getBuilders(): Promise<Builder[]> {
    console.log('🔄 Fetching builders from database...');
    
    try {
      const response = await this.fetchAPI('/builders');
      const builders = response.data;
      
      console.log(`✅ Fetched ${builders.length} builders from database`);
      return builders;
    } catch (error) {
      console.error('❌ Failed to fetch builders from database:', error);
      return this.fallbackBuilders;
    }
  }

  async getBuildersByState(state: string): Promise<Builder[]> {
    console.log(`🔄 Fetching builders for state: ${state}`);
    
    try {
      const response = await this.fetchAPI(`/builders/state/${encodeURIComponent(state)}`);
      const builders = response.data;
      
      console.log(`✅ Fetched ${builders.length} builders for ${state}`);
      return builders;
    } catch (error) {
      console.error(`❌ Failed to fetch builders for state ${state}:`, error);
      return this.fallbackBuilders;
    }
  }

  async getBuildersNearZip(zipCode: string, radius: number = 50): Promise<Builder[]> {
    console.log(`🔄 Fetching builders near zip code: ${zipCode} (${radius} miles)`);
    
    try {
      const response = await this.fetchAPI(`/builders/near?zipCode=${zipCode}&radius=${radius}`);
      const builders = response.data;
      
      console.log(`✅ Fetched ${builders.length} builders near ${zipCode}`);
      return builders;
    } catch (error) {
      console.error(`❌ Failed to fetch builders near ${zipCode}:`, error);
      return this.fallbackBuilders;
    }
  }

  async getBuildersNearLocation(lat: number, lng: number, radius: number = 50): Promise<Builder[]> {
    console.log(`🔄 Fetching builders near coordinates: ${lat}, ${lng} (${radius} miles)`);
    
    try {
      const response = await this.fetchAPI(`/builders/near?lat=${lat}&lng=${lng}&radius=${radius}`);
      const builders = response.data;
      
      console.log(`✅ Fetched ${builders.length} builders near coordinates`);
      return builders;
    } catch (error) {
      console.error(`❌ Failed to fetch builders near coordinates:`, error);
      return this.fallbackBuilders;
    }
  }

  async addBuilder(builderData: Partial<Builder>): Promise<Builder> {
    console.log('🔄 Adding new builder to database...');
    
    try {
      const response = await this.fetchAPI('/builders', {
        method: 'POST',
        body: JSON.stringify(builderData),
      });
      
      const newBuilder = response.data;
      console.log(`✅ Added new builder: ${newBuilder.name} (ID: ${newBuilder.id})`);
      return newBuilder;
    } catch (error) {
      console.error('❌ Failed to add builder:', error);
      throw error;
    }
  }

  async getAllStates(): Promise<string[]> {
    console.log('🔄 Fetching all states...');
    
    try {
      const response = await this.fetchAPI('/states');
      const states = response.data;
      
      console.log(`✅ Fetched ${states.length} states`);
      return states;
    } catch (error) {
      console.error('❌ Failed to fetch states:', error);
      return ['New Jersey', 'Colorado', 'California', 'Texas', 'Florida'];
    }
  }

  async getAllVanTypes(): Promise<string[]> {
    console.log('🔄 Fetching all van types...');
    
    try {
      const response = await this.fetchAPI('/van-types');
      const vanTypes = response.data;
      
      console.log(`✅ Fetched ${vanTypes.length} van types`);
      return vanTypes;
    } catch (error) {
      console.error('❌ Failed to fetch van types:', error);
      return ['Sprinter', 'Transit', 'ProMaster', 'Express'];
    }
  }

  async getAllAmenities(): Promise<string[]> {
    console.log('🔄 Fetching all amenities...');
    
    try {
      const response = await this.fetchAPI('/amenities');
      const amenities = response.data;
      
      console.log(`✅ Fetched ${amenities.length} amenities`);
      return amenities;
    } catch (error) {
      console.error('❌ Failed to fetch amenities:', error);
      return ['Solar Power', 'Bathroom', 'Kitchen', 'Storage', 'Bed', 'Shower'];
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.fetchAPI('/health');
      return true;
    } catch (error) {
      console.error('❌ Database service health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
