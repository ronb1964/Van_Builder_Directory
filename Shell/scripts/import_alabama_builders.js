const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'server', 'van_builders.db');

// Alabama builders data from CSV backup
const alabamaBuilders = [
  {
    id: 'al-1',
    name: 'Vulcan Coach',
    address: '614 Woodward Road',
    city: 'Midfield',
    state: 'Alabama',
    zip: '35228',
    phone: '(205) 491-0081',
    email: 'Vulcan.coach@yahoo.com',
    website: 'https://www.vulcancoach.com',
    lat: 33.4734,
    lng: -86.8025,
    description: 'Family-owned custom bus and RV conversion company operating since 1964. Specializes in luxury motor coach conversions, custom van builds, and RV renovations with over 50 years of experience.',
    rating: 4.8,
    review_count: 45,
    van_types: 'Custom Bus Conversions|Motor Homes|RV Conversions',
    price_range_min: 75000,
    price_range_max: 300000,
    amenities: 'Custom Interior Design|Luxury Finishes|Entertainment Systems|Sleeping Quarters',
    services: 'Custom Builds|RV Renovations|Maintenance|Consultation',
    certifications: '',
    years_in_business: '50+',
    lead_time: '6-12 months'
  },
  {
    id: 'al-2',
    name: 'Storyteller Overland',
    address: '428 Industrial Lane',
    city: 'Birmingham',
    state: 'Alabama',
    zip: '35211',
    phone: '(888) 999-7442',
    email: 'letsgo@storytelleroverland.com',
    website: 'https://www.storytelleroverland.com',
    lat: 33.5186,
    lng: -86.8104,
    description: 'Adventure van manufacturer building MODE camper vans on Mercedes-Benz Sprinter chassis and HILT Adventure Trucks. Specializes in off-road, off-grid vehicles for outdoor enthusiasts.',
    rating: 4.9,
    review_count: 120,
    van_types: 'Mercedes Sprinter|Adventure Trucks|4x4 Conversions',
    price_range_min: 200000,
    price_range_max: 500000,
    amenities: '4x4 Capability|Off-Grid Systems|Full Bathroom|Kitchen|Solar Power|Adventure Equipment',
    services: 'Custom Builds|Adventure Vehicle Design|Dealer Network|Customer Support',
    certifications: '',
    years_in_business: '10+',
    lead_time: '6-18 months'
  },
  {
    id: 'al-3',
    name: 'Gearbox Adventure Rentals',
    address: '2765 Cone Drive',
    city: 'Birmingham',
    state: 'Alabama',
    zip: '35217',
    phone: '(205) 379-0027',
    email: 'craig@gearboxrentals.com',
    website: 'https://www.gearboxrentals.com',
    lat: 33.5186,
    lng: -86.8104,
    description: 'Birmingham\'s first adventure travel company specializing in custom campervan rentals and builds. Offers both rental fleet and custom conversion services for adventure enthusiasts.',
    rating: 4.7,
    review_count: 85,
    van_types: 'Custom Campervan Conversions|Adventure Vans|Rental Fleet Builds',
    price_range_min: 50000,
    price_range_max: 120000,
    amenities: 'Adventure-Ready|Custom Storage|Rental Experience|Southeast Focused',
    services: 'Custom Builds|Van Rentals|Design Process|Adventure Planning',
    certifications: '',
    years_in_business: '8',
    lead_time: '4-8 months'
  }
];

async function importAlabamaBuilders() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    // First, delete existing Alabama builders
    db.run('DELETE FROM builders WHERE state = ?', ['Alabama'], function(err) {
      if (err) {
        console.error('Error deleting existing Alabama builders:', err);
        reject(err);
        return;
      }
      console.log(`🗑️  Deleted ${this.changes} existing Alabama builders`);

      // Insert new Alabama builders
      const insertSQL = `
        INSERT INTO builders (
          name, city, state, zip, phone, email, website, lat, lng,
          description, van_types, price_range_min, price_range_max,
          amenities, services, certifications, years_in_business, lead_time,
          pricing_tiers, photos, social_media, specialties
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      let insertedCount = 0;
      const totalBuilders = alabamaBuilders.length;

      alabamaBuilders.forEach((builder, index) => {
        db.run(insertSQL, [
          builder.name,
          builder.city,
          builder.state,
          builder.zip,
          builder.phone,
          builder.email,
          builder.website,
          builder.lat,
          builder.lng,
          builder.description,
          builder.van_types,
          builder.price_range_min,
          builder.price_range_max,
          builder.amenities,
          builder.services,
          builder.certifications,
          builder.years_in_business,
          builder.lead_time,
          '', // pricing_tiers
          '[]', // photos
          '{}', // social_media
          '' // specialties
        ], function(err) {
          if (err) {
            console.error(`Error inserting ${builder.name}:`, err);
            reject(err);
            return;
          }
          
          insertedCount++;
          console.log(`✅ Imported: ${builder.name} (${builder.city}, ${builder.state})`);
          
          if (insertedCount === totalBuilders) {
            console.log(`🎉 Successfully imported ${insertedCount} Alabama builders`);
            
            // Close database connection
            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err);
                reject(err);
              } else {
                console.log('📊 Database connection closed');
                resolve();
              }
            });
          }
        });
      });
    });
  });
}

// Run the import
importAlabamaBuilders()
  .then(() => {
    console.log('🚀 Alabama builders import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
