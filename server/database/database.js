const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class DatabaseService {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    try {
      // Connect to existing database file
      const dbPath = path.join(__dirname, 'builders.db');
      this.db = new Database(dbPath);
      
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  // Get all builders with related data
  getAllBuilders() {
    const query = `
      SELECT * FROM builders ORDER BY name
    `;
    
    const builders = this.db.prepare(query).all();
    
    return builders.map(builder => {
      // Get photos for this builder
      const photos = this.getBuilderPhotos(builder.id);
      const gallery = photos.map(photo => ({
        url: photo.url,
        alt: photo.alt_text || `${builder.name} van conversion`,
        caption: photo.caption
      }));

      return {
        id: builder.id,
        name: builder.name,
        address: builder.address || `${builder.city}, ${builder.state}`,
        phone: builder.phone,
        email: builder.email,
        website: builder.website,
        location: {
          lat: builder.lat,
          lng: builder.lng,
          city: builder.city,
          state: builder.state,
          zip: builder.zip
        },
        city: builder.city,
        state: builder.state,
        zipCode: builder.zip,
        description: builder.description,
        rating: 4.5, // Default rating
        reviewCount: 10, // Default review count
        leadTime: '3-6 months',
        vanTypes: builder.van_types ? 
          (typeof builder.van_types === 'string' ? [builder.van_types] : builder.van_types) : 
          ['Custom Van'],
        amenities: builder.amenities ? JSON.parse(builder.amenities) : ['Custom Build'],
        services: builder.services ? JSON.parse(builder.services) : ['Custom Builds'],
        certifications: [],
        socialMedia: builder.social_media ? JSON.parse(builder.social_media) : {},
        reviews: [],
        photos: gallery,
        gallery: gallery
      };
    });
  }

  // State name to abbreviation mapping
  getStateAbbreviation(stateName) {
    const stateMap = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
      'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
      'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
      'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
      'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
      'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
      'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
      'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
    };
    
    const lowerState = stateName.toLowerCase();
    return stateMap[lowerState] || stateName.toUpperCase();
  }

  // Get builders by state (handles both full names and abbreviations)
  getBuildersByState(state) {
    const builders = this.getAllBuilders();
    const stateAbbrev = this.getStateAbbreviation(state);
    
    return builders.filter(builder => {
      if (!builder.state) return false;
      
      // Check if it matches the abbreviation (what's stored in DB)
      if (builder.state.toUpperCase() === stateAbbrev.toUpperCase()) return true;
      
      // Also check direct match for backward compatibility
      if (builder.state.toLowerCase() === state.toLowerCase()) return true;
      
      return false;
    });
  }

  // Get builders within radius of coordinates
  getBuildersNearLocation(lat, lng, radiusMiles = 50) {
    const builders = this.getAllBuilders();
    
    return builders.filter(builder => {
      const distance = this.calculateDistance(lat, lng, builder.location.lat, builder.location.lng);
      return distance <= radiusMiles;
    }).map(builder => ({
      ...builder,
      distanceFromLocation: this.calculateDistance(lat, lng, builder.location.lat, builder.location.lng)
    }));
  }

  // Calculate distance using Haversine formula
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  }

  // Get reviews for a builder
  getBuilderReviews(builderId) {
    const query = `
      SELECT * FROM reviews 
      WHERE builder_id = ? 
      ORDER BY created_at DESC
    `;
    return this.db.prepare(query).all(builderId);
  }

  // Get photos for a builder
  getBuilderPhotos(builderId) {
    const query = `
      SELECT * FROM builder_gallery 
      WHERE builder_id = ? 
      ORDER BY sort_order ASC
    `;
    return this.db.prepare(query).all(builderId);
  }

  // Add a new builder
  addBuilder(builderData) {
    const insertBuilder = this.db.prepare(`
      INSERT INTO builders (
        name, address, phone, email, website, 
        latitude, longitude, city, state, zip_code, 
        description, rating, review_count, lead_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertBuilder.run(
      builderData.name,
      builderData.address,
      builderData.phone,
      builderData.email,
      builderData.website,
      builderData.location.lat,
      builderData.location.lng,
      builderData.city,
      builderData.state,
      builderData.zipCode,
      builderData.description,
      builderData.rating || 0,
      builderData.reviewCount || 0,
      builderData.leadTime
    );

    const builderId = result.lastInsertRowid;

    // Add related data
    if (builderData.vanTypes) {
      this.addBuilderVanTypes(builderId, builderData.vanTypes);
    }
    if (builderData.amenities) {
      this.addBuilderAmenities(builderId, builderData.amenities);
    }
    if (builderData.services) {
      this.addBuilderServices(builderId, builderData.services);
    }
    if (builderData.socialMedia) {
      this.addBuilderSocialMedia(builderId, builderData.socialMedia);
    }

    return builderId;
  }

  // Helper methods for adding related data
  addBuilderVanTypes(builderId, vanTypes) {
    const getVanTypeId = this.db.prepare('SELECT id FROM van_types WHERE name = ?');
    const insertVanType = this.db.prepare('INSERT OR IGNORE INTO van_types (name) VALUES (?)');
    const linkVanType = this.db.prepare('INSERT OR IGNORE INTO builder_van_types (builder_id, van_type_id) VALUES (?, ?)');

    vanTypes.forEach(vanType => {
      insertVanType.run(vanType);
      const vanTypeRow = getVanTypeId.get(vanType);
      if (vanTypeRow) {
        linkVanType.run(builderId, vanTypeRow.id);
      }
    });
  }

  addBuilderAmenities(builderId, amenities) {
    const getAmenityId = this.db.prepare('SELECT id FROM amenities WHERE name = ?');
    const insertAmenity = this.db.prepare('INSERT OR IGNORE INTO amenities (name) VALUES (?)');
    const linkAmenity = this.db.prepare('INSERT OR IGNORE INTO builder_amenities (builder_id, amenity_id) VALUES (?, ?)');

    amenities.forEach(amenity => {
      insertAmenity.run(amenity);
      const amenityRow = getAmenityId.get(amenity);
      if (amenityRow) {
        linkAmenity.run(builderId, amenityRow.id);
      }
    });
  }

  addBuilderServices(builderId, services) {
    const getServiceId = this.db.prepare('SELECT id FROM services WHERE name = ?');
    const insertService = this.db.prepare('INSERT OR IGNORE INTO services (name) VALUES (?)');
    const linkService = this.db.prepare('INSERT OR IGNORE INTO builder_services (builder_id, service_id) VALUES (?, ?)');

    services.forEach(service => {
      insertService.run(service);
      const serviceRow = getServiceId.get(service);
      if (serviceRow) {
        linkService.run(builderId, serviceRow.id);
      }
    });
  }

  addBuilderSocialMedia(builderId, socialMedia) {
    const insertSocialMedia = this.db.prepare(`
      INSERT OR REPLACE INTO builder_social_media (
        builder_id, platform, url
      ) VALUES (?, ?, ?)
    `);

    Object.entries(socialMedia).forEach(([platform, url]) => {
      if (url) {
        insertSocialMedia.run(builderId, platform, url);
      }
    });
  }

  getAllStates() {
    const query = `
      SELECT DISTINCT state FROM builders 
      WHERE state IS NOT NULL 
      ORDER BY state
    `;
    return this.db.prepare(query).all().map(row => row.state);
  }

  getAllVanTypes() {
    const query = `
      SELECT DISTINCT vt.name 
      FROM van_types vt 
      JOIN builder_van_types bvt ON vt.id = bvt.van_type_id 
      ORDER BY vt.name
    `;
    return this.db.prepare(query).all().map(row => row.name);
  }

  getAllAmenities() {
    const query = `
      SELECT DISTINCT a.name 
      FROM amenities a 
      JOIN builder_amenities ba ON a.id = ba.amenity_id 
      ORDER BY a.name
    `;
    return this.db.prepare(query).all().map(row => row.name);
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('🔐 Database connection closed');
    }
  }
}

module.exports = DatabaseService;
