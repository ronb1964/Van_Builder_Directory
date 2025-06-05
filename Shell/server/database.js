const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, 'van_builders.db');
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('✅ Connected to SQLite database');
        this.initializeDatabase();
      }
    });
  }

  initializeDatabase() {
    // Use the exact same schema as the original database
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS builders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        zip TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        description TEXT,
        specialties TEXT,
        van_types TEXT,
        price_range_min INTEGER,
        price_range_max INTEGER,
        pricing_tiers TEXT,
        amenities TEXT,
        services TEXT,
        certifications TEXT,
        years_in_business INTEGER,
        lead_time TEXT,
        photos TEXT,
        social_media TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createIndexSQL = `CREATE INDEX IF NOT EXISTS idx_builders_state ON builders(state)`;

    this.db.run(createTableSQL, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      } else {
        console.log('✅ Database table ready');
        this.db.run(createIndexSQL, (err) => {
          if (err) {
            console.error('Error creating index:', err);
          } else {
            this.importAlabamaData();
          }
        });
      }
    });
  }

  importAlabamaData() {
    // Check if we already have data
    this.db.get('SELECT COUNT(*) as count FROM builders', (err, row) => {
      if (err) {
        console.error('Error checking data:', err);
        return;
      }

      if (row.count === 0) {
        console.log('🌱 Importing Alabama builders data...');
        
        // Import the exact data from the original database
        const alabamaBuilders = [
          {
            id: 1,
            name: 'Alabama Van Conversions',
            city: 'Birmingham',
            state: 'Alabama',
            lat: 33.5186,
            lng: -86.8025,
            zip: '35203',
            phone: null,
            email: null,
            website: null,
            description: 'Specializes in custom van conversions, including Mercedes Sprinter, Ford Transit, and Ram ProMaster.',
            specialties: '["Custom Builds"]',
            van_types: '["Sprinter","Transit","Promaster"]',
            price_range_min: 50000,
            price_range_max: 150000,
            pricing_tiers: '[]',
            amenities: '["Solar Power","Kitchen"]',
            services: '["Custom Builds"]',
            certifications: '[]',
            years_in_business: 5,
            lead_time: '4-8 months',
            photos: '[]',
            social_media: '{}'
          },
          {
            id: 2,
            name: 'VanCraft Alabama',
            city: 'Huntsville',
            state: 'Alabama',
            lat: 34.7304,
            lng: -86.5861,
            zip: '35801',
            phone: null,
            email: null,
            website: null,
            description: 'Specializes in custom van conversions, including Mercedes Sprinter, Ford Transit, and Ram ProMaster, with a focus on luxury and adventure vans.',
            specialties: '["Custom Builds"]',
            van_types: '["Sprinter","Transit","Promaster"]',
            price_range_min: 50000,
            price_range_max: 150000,
            pricing_tiers: '[]',
            amenities: '["Solar Power","Kitchen"]',
            services: '["Custom Builds"]',
            certifications: '[]',
            years_in_business: 5,
            lead_time: '4-8 months',
            photos: '[]',
            social_media: '{}'
          },
          {
            id: 3,
            name: 'Alabama Van Works',
            city: 'Birmingham',
            state: 'Alabama',
            lat: 33.4734,
            lng: -86.8025,
            zip: '35228',
            phone: '(205) 555-0101',
            email: 'info@alabamavanworks.com',
            website: 'https://alabamavanworks.com',
            description: 'Custom van conversions specializing in outdoor adventure vehicles.',
            specialties: '["Custom Builds"]',
            van_types: '["Sprinter","Transit","Promaster"]',
            price_range_min: 50000,
            price_range_max: 150000,
            pricing_tiers: '[]',
            amenities: '["Solar Power","Kitchen"]',
            services: '["Custom Builds"]',
            certifications: '[]',
            years_in_business: 5,
            lead_time: '4-8 months',
            photos: '[]',
            social_media: '{}'
          }
        ];

        const insertSQL = `
          INSERT INTO builders (name, city, state, lat, lng, zip, phone, email, website, description, specialties, van_types, price_range_min, price_range_max, pricing_tiers, amenities, services, certifications, years_in_business, lead_time, photos, social_media)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        alabamaBuilders.forEach(builder => {
          this.db.run(insertSQL, [
            builder.name,
            builder.city,
            builder.state,
            builder.lat,
            builder.lng,
            builder.zip,
            builder.phone,
            builder.email,
            builder.website,
            builder.description,
            builder.specialties,
            builder.van_types,
            builder.price_range_min,
            builder.price_range_max,
            builder.pricing_tiers,
            builder.amenities,
            builder.services,
            builder.certifications,
            builder.years_in_business,
            builder.lead_time,
            builder.photos,
            builder.social_media
          ], (err) => {
            if (err) {
              console.error('Error inserting builder:', err);
            }
          });
        });

        console.log('✅ Alabama builders data imported');
      }
    });
  }

  async getAllBuilders() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM builders', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const builders = rows.map(row => this.formatBuilder(row));
          resolve(builders);
        }
      });
    });
  }

  async getBuildersByState(state) {
    return new Promise((resolve, reject) => {
      const searchState = state.toLowerCase();
      this.db.all(
        'SELECT * FROM builders WHERE LOWER(state) = ? OR LOWER(state) = ?',
        [searchState, searchState === 'alabama' ? 'al' : searchState === 'al' ? 'alabama' : searchState],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const builders = rows.map(row => this.formatBuilder(row));
            resolve(builders);
          }
        }
      );
    });
  }

  formatBuilder(row) {
    return {
      id: row.id,
      name: row.name,
      address: `${row.city}, ${row.state} ${row.zip || ''}`.trim(),
      city: row.city,
      state: row.state,
      zip: row.zip || '',
      phone: row.phone || '',
      email: row.email || '',
      website: row.website || '',
      latitude: row.lat,
      longitude: row.lng,
      description: row.description || 'Professional van builder specializing in custom conversions and adventure-ready vehicles.',
      vanTypes: JSON.parse(row.van_types || '["Custom Builds", "Sprinter Conversions"]'),
      amenities: JSON.parse(row.amenities || '["Solar Power", "Kitchen"]'),
      socialMedia: JSON.parse(row.social_media || '{}'),
      photos: JSON.parse(row.photos || '[]'),
      location: {
        city: row.city,
        state: row.state,
        lat: row.lat,
        lng: row.lng
      },
      distanceFromZip: { miles: Math.floor(Math.random() * 500) + 10 }
    };
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
}

module.exports = DatabaseService;
