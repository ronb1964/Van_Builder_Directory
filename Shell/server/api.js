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
