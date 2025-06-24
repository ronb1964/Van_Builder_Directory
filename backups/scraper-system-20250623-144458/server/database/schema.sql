-- Camper Van Builders Database Schema

-- Builders table
CREATE TABLE IF NOT EXISTS builders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  description TEXT,
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  lead_time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Van types table
CREATE TABLE IF NOT EXISTS van_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Builder van types junction table
CREATE TABLE IF NOT EXISTS builder_van_types (
  builder_id INTEGER,
  van_type_id INTEGER,
  PRIMARY KEY (builder_id, van_type_id),
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
  FOREIGN KEY (van_type_id) REFERENCES van_types(id) ON DELETE CASCADE
);

-- Amenities table
CREATE TABLE IF NOT EXISTS amenities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Builder amenities junction table
CREATE TABLE IF NOT EXISTS builder_amenities (
  builder_id INTEGER,
  amenity_id INTEGER,
  PRIMARY KEY (builder_id, amenity_id),
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Builder services junction table
CREATE TABLE IF NOT EXISTS builder_services (
  builder_id INTEGER,
  service_id INTEGER,
  PRIMARY KEY (builder_id, service_id),
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Builder certifications junction table
CREATE TABLE IF NOT EXISTS builder_certifications (
  builder_id INTEGER,
  certification_id INTEGER,
  PRIMARY KEY (builder_id, certification_id),
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
  FOREIGN KEY (certification_id) REFERENCES certifications(id) ON DELETE CASCADE
);

-- Social media table
CREATE TABLE IF NOT EXISTS social_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  builder_id INTEGER UNIQUE,
  facebook TEXT,
  instagram TEXT,
  youtube TEXT,
  pinterest TEXT,
  tiktok TEXT,
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  builder_id INTEGER,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  builder_id INTEGER,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_builders_location ON builders(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_builders_state ON builders(state);
CREATE INDEX IF NOT EXISTS idx_builders_rating ON builders(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_builder_id ON reviews(builder_id);
CREATE INDEX IF NOT EXISTS idx_photos_builder_id ON photos(builder_id);

-- Insert common van types
INSERT OR IGNORE INTO van_types (name) VALUES 
('Class B'),
('Class C'),
('Sprinter'),
('Transit'),
('ProMaster'),
('Custom Build'),
('Conversion Van'),
('School Bus'),
('Skoolie'),
('Tiny Home on Wheels');

-- Insert common amenities
INSERT OR IGNORE INTO amenities (name) VALUES 
('Solar Power'),
('Bathroom'),
('Kitchen'),
('Bed'),
('Storage'),
('Air Conditioning'),
('Heating'),
('Water Tank'),
('Electrical System'),
('Internet/WiFi'),
('Shower'),
('Refrigerator'),
('Inverter'),
('Awning'),
('Bike Rack');

-- Insert common services
INSERT OR IGNORE INTO services (name) VALUES 
('Custom Builds'),
('Conversions'),
('Repairs'),
('Maintenance'),
('Electrical Work'),
('Plumbing'),
('Solar Installation'),
('Interior Design'),
('Consultation'),
('Parts & Accessories');

-- Insert common certifications
INSERT OR IGNORE INTO certifications (name) VALUES 
('RVIA Certified'),
('Licensed Contractor'),
('Electrical License'),
('Plumbing License'),
('Automotive Technician'),
('Solar Installation Certified');
