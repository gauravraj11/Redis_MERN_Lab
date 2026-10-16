require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const { connectRedis, getRedis } = require('./config/redis');
const productRoutes = require('./routes/products');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// exposedHeaders lets the React app read the X-Cache header
app.use(cors({ exposedHeaders: ['X-Cache'] }));
app.use(express.json());

// Health check: shows whether Redis is connected
app.get('/api/health', (req, res) => {
  res.json({ server: 'ok', redis: getRedis() ? 'connected' : 'not connected' });
});

// Scenario 3: the rate limiter runs before the product routes
app.use('/api/products', rateLimiter, productRoutes);

const PORT = process.env.PORT || 5001;

(async () => {
  await connectDB();
  connectRedis();
  app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
})();
