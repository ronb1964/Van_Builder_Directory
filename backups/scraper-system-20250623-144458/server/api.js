const express = require('express');
const http = require('http'); // Added missing Express import
const cors = require('cors');
const DatabaseService = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = new DatabaseService();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Get all builders (with optional state filter)
app.get('/api/builders', (req, res) => {
  try {
    const { state } = req.query;
    
    let builders;
    if (state) {
      builders = db.getBuildersByState(state);
    } else {
      builders = db.getAllBuilders();
    }
    
    res.json({
      success: true,
      data: builders,
      count: builders.length,
      ...(state && { state: state })
    });
  } catch (error) {
    console.error('Error fetching builders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch builders'
    });
  }
});

// Get builders by state
app.get('/api/builders/state/:state', (req, res) => {
  try {
    const { state } = req.params;
    const builders = db.getBuildersByState(state);
    res.json({
      success: true,
      data: builders,
      count: builders.length,
      state: state
    });
  } catch (error) {
    console.error('Error fetching builders by state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch builders by state'
    });
  }
});

// Get builders near location (with zip code geocoding)
app.get('/api/builders/near', async (req, res) => {
  try {
    const { lat, lng, radius = 50, zipCode } = req.query;
    
    let latitude = parseFloat(lat);
    let longitude = parseFloat(lng);
    
    // If zip code provided, geocode it
    if (zipCode && (!latitude || !longitude)) {
      // You can integrate with Google Maps Geocoding API here
      // For now, we'll use some common zip codes
      const zipCoords = getZipCodeCoordinates(zipCode);
      if (zipCoords) {
        latitude = zipCoords.lat;
        longitude = zipCoords.lng;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid zip code or coordinates'
        });
      }
    }
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const builders = db.getBuildersNearLocation(latitude, longitude, parseFloat(radius));
    
    // Add distance information for frontend compatibility
    const buildersWithDistance = builders.map(builder => ({
      ...builder,
      distanceFromZip: {
        miles: builder.distanceFromLocation,
        zipCode: zipCode || 'coordinates'
      }
    }));
    
    res.json({
      success: true,
      data: buildersWithDistance,
      count: buildersWithDistance.length,
      location: { lat: latitude, lng: longitude },
      radius: parseFloat(radius)
    });
  } catch (error) {
    console.error('Error fetching nearby builders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nearby builders'
    });
  }
});

// Add new builder
app.post('/api/builders', (req, res) => {
  try {
    const builderData = req.body;
    
    // Validate required fields
    if (!builderData.name || !builderData.address || !builderData.location) {
      return res.status(400).json({
        success: false,
        error: 'Name, address, and location are required'
      });
    }
    
    const builderId = db.addBuilder(builderData);
    const newBuilder = db.getAllBuilders().find(b => b.id === builderId);
    
    res.status(201).json({
      success: true,
      data: newBuilder,
      message: 'Builder added successfully'
    });
  } catch (error) {
    console.error('Error adding builder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add builder'
    });
  }
});

// Get all states
app.get('/api/states', (req, res) => {
  try {
    const states = db.getAllStates();
    res.json({
      success: true,
      data: states
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch states'
    });
  }
});

// Get all van types
app.get('/api/van-types', (req, res) => {
  try {
    const vanTypes = db.getAllVanTypes();
    res.json({
      success: true,
      data: vanTypes
    });
  } catch (error) {
    console.error('Error fetching van types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch van types'
    });
  }
});

// Get all amenities
app.get('/api/amenities', (req, res) => {
  try {
    const amenities = db.getAllAmenities();
    res.json({
      success: true,
      data: amenities
    });
  } catch (error) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch amenities'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Helper function for common zip codes (can be expanded)
function getZipCodeCoordinates(zipCode) {
  const zipMap = {
    '08620': { lat: 40.2206, lng: -74.7563 }, // Trenton, NJ
    '10001': { lat: 40.7505, lng: -73.9934 }, // New York, NY
    '90210': { lat: 34.0901, lng: -118.4065 }, // Beverly Hills, CA
    '80202': { lat: 39.7392, lng: -104.9903 }, // Denver, CO
    '33101': { lat: 25.7617, lng: -80.1918 }, // Miami, FL
    // Add more as needed
  };
  
  return zipMap[zipCode] || null;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
const server = http.createServer(app); // Fix server setup
server.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Database initialized with ${db.getAllBuilders().length} builders`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down API server...');
  db.close();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
