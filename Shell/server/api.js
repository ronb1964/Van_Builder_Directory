const express = require('express');
const cors = require('cors');
const DatabaseService = require('./database');

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize database
const db = new DatabaseService();

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to get coordinates from zip code (simplified - in production use a geocoding service)
function getZipCoordinates(zipCode) {
  // Zip code coordinates for supported areas
  const zipCoords = {
    // Alabama zip codes
    '35203': { lat: 33.5186, lng: -86.8025 }, // Birmingham
    '35801': { lat: 34.7304, lng: -86.5861 }, // Huntsville  
    '35228': { lat: 33.4734, lng: -86.8025 }, // Birmingham area
    '36101': { lat: 32.3617, lng: -86.2792 }, // Montgomery
    '35004': { lat: 33.6398, lng: -86.7494 }, // Moody
    '35217': { lat: 33.5186, lng: -86.8025 }, // Birmingham (Gearbox)
    
    // New Jersey zip codes
    '08620': { lat: 40.2206, lng: -74.7563 }, // Yardville/Hamilton (user's zip)
    '08609': { lat: 40.2206, lng: -74.7563 }, // Hamilton Twp (Ready Set Van)
    '08736': { lat: 40.1179, lng: -74.0370 }, // Manasquan (Sequoia + Salt)
    '08701': { lat: 40.0834, lng: -74.2179 }, // Lakewood
    '08753': { lat: 39.9537, lng: -74.1979 }, // Toms River
    '08540': { lat: 40.3573, lng: -74.6672 }, // Princeton
    '08901': { lat: 40.4862, lng: -74.4518 }, // New Brunswick
    '07001': { lat: 40.7362, lng: -74.1724 }, // Avenel
    '07302': { lat: 40.7178, lng: -74.0431 }, // Jersey City
  };
  return zipCoords[zipCode] || null;
}

// Routes

// Get all builders
app.get('/api/builders', async (req, res) => {
  try {
    const builders = await db.getAllBuilders();
    res.json({
      success: true,
      data: builders,
      count: builders.length
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
app.get('/api/builders/state/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const builders = await db.getBuildersByState(state);
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

// Search builders by name
app.get('/api/builders/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const builders = await db.getAllBuilders();
    const filteredBuilders = builders.filter(builder =>
      builder.name.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json({
      success: true,
      data: filteredBuilders,
      count: filteredBuilders.length,
      query: query
    });
  } catch (error) {
    console.error('Error searching builders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search builders'
    });
  }
});

// Search builders by zip code
app.get('/api/builders/zip/:zip', async (req, res) => {
  try {
    const { zip } = req.params;
    const zipCoords = getZipCoordinates(zip);
    if (!zipCoords) {
      res.status(404).json({
        success: false,
        error: 'Zip code not found'
      });
      return;
    }
    const builders = await db.getAllBuilders();
    const filteredBuilders = builders.filter(builder => {
      const distance = calculateDistance(zipCoords.lat, zipCoords.lng, builder.location.lat, builder.location.lng);
      return distance <= 100;
    }).map(builder => {
      // Calculate actual distance and add it to the builder object
      const actualDistance = calculateDistance(zipCoords.lat, zipCoords.lng, builder.location.lat, builder.location.lng);
      return {
        ...builder,
        distanceFromZip: {
          miles: Math.round(actualDistance),
          zipCode: zip
        }
      };
    });
    
    res.json({
      success: true,
      data: filteredBuilders,
      count: filteredBuilders.length,
      zip: zip
    });
  } catch (error) {
    console.error('Error searching builders by zip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search builders by zip'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Van Builder Directory API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Database initialized`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down API server...');
  db.close();
  process.exit(0);
});

module.exports = app;
