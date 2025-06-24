-- Van Builder Directory Database Schema
-- Designed to match existing JSON structure

-- Main builders table
CREATE TABLE IF NOT EXISTS builders (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  lat REAL,
  lng REAL,
  zip TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  price_min INTEGER,
  price_max INTEGER,
  lead_time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Van types table (normalized)
CREATE TABLE IF NOT EXISTS van_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Amenities table (normalized)
CREATE TABLE IF NOT EXISTS amenities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Services table (normalized)
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Certifications table (normalized)
CREATE TABLE IF NOT EXISTS certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Junction tables for many-to-many relationships
CREATE TABLE IF NOT EXISTS builder_van_types (
  builder_id INTEGER,
  van_type_id INTEGER,
  PRIMARY KEY (builder_id, van_type_id),
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
  FOREIGN KEY (van_type_id) REFERENCES van_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS builder_amenities (
  builder_id INTEGER,
  amenity_id INTEGER,
  PRIMARY KEY (builder_id, amenity_id),
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS builder_services (
  builder_id INTEGER,
  service_id INTEGER,
  PRIMARY KEY (builder_id, service_id),
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS builder_certifications (
  builder_id INTEGER,
  certification_id INTEGER,
  PRIMARY KEY (builder_id, certification_id),
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
  FOREIGN KEY (certification_id) REFERENCES certifications(id) ON DELETE CASCADE
);

-- Social media table
CREATE TABLE IF NOT EXISTS builder_social_media (
  builder_id INTEGER PRIMARY KEY,
  facebook TEXT,
  instagram TEXT,
  youtube TEXT,
  twitter TEXT,
  tiktok TEXT,
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE
);

-- Gallery/Photos table
CREATE TABLE IF NOT EXISTS builder_gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  builder_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_builders_state ON builders(state);
CREATE INDEX IF NOT EXISTS idx_builders_city ON builders(city);
CREATE INDEX IF NOT EXISTS idx_builders_location ON builders(lat, lng);
CREATE INDEX IF NOT EXISTS idx_gallery_builder ON builder_gallery(builder_id);

-- Enable foreign key constraints
PRAGMA foreign_keys = ON; 