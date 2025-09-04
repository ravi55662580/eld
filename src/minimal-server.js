require('dotenv').config();
const express = require('express');

const app = express();

// Basic middleware
app.use(express.json());

// Simple health endpoint
app.get('/health', (req, res) => {
  console.log('Health endpoint accessed');
  res.json({
    success: true,
    message: 'Minimal server working',
    timestamp: new Date().toISOString()
  });
});

// Simple API endpoint
app.get('/api/v1', (req, res) => {
  console.log('API endpoint accessed');
  res.json({
    success: true,
    message: 'Minimal API working'
  });
});

const PORT = process.env.PORT || 5000;

console.log('Starting server on port:', PORT);

app.listen(PORT, () => {
  console.log(`Minimal server running on http://localhost:${PORT}`);
  console.log('Test endpoints:');
  console.log(`  http://localhost:${PORT}/health`);
  console.log(`  http://localhost:${PORT}/api/v1`);
});
