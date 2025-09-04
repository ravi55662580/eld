const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

// Simple API endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'API is working'
  });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://0.0.0.0:${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/health`);
});
