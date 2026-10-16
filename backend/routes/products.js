const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { getRedis } = require('../config/redis');

const router = express.Router();

const LIST_KEY = 'products:all';
const CACHE_TTL = Number(process.env.CACHE_TTL) || 60;
const SLOW_QUERY_MS = Number(process.env.SLOW_QUERY_MS) || 0;

// Simulates a heavy database query so a cache MISS is visibly slow
const slowQuery = () => new Promise((resolve) => setTimeout(resolve, SLOW_QUERY_MS));

/* ------------------------------------------------------------------
 * GET /api/products  ->  CACHED (cache-aside pattern, done for you)
 * ------------------------------------------------------------------ */
router.get('/', async (req, res) => {
  try {
    const redis = getRedis();

    // 1. Try Redis first
    if (redis) {
      const cached = await redis.get(LIST_KEY);
      if (cached) {
        console.log(`⚡ HIT  ${LIST_KEY}`);
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    }

    // 2. MISS: go to MongoDB (slow)
    console.log(`🐢 MISS ${LIST_KEY} -> querying MongoDB`);
    await slowQuery();
    const products = await Product.find().sort({ createdAt: -1 }).lean();

    // 3. Save the result in Redis with an expiry (TTL)
    if (redis) {
      await redis.set(LIST_KEY, JSON.stringify(products), { EX: CACHE_TTL });
    }

    res.set('X-Cache', redis ? 'MISS' : 'BYPASS');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------------------------------------------
 * GET /api/products/:id  ->  NOT cached yet
 * TODO (Scenario 2): cache each product as "product:<id>" for 60 seconds.
 * ------------------------------------------------------------------ */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    await slowQuery();
    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.set('X-Cache', 'NONE');
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------------------------------------------
 * POST /api/products  ->  creates a product
 * TODO (Scenario 1): the new product does not show in the list. Why? Fix it.
 * ------------------------------------------------------------------ */
router.post('/', async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    const product = await Product.create({ name, price, category, description });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ------------------------------------------------------------------
 * DELETE /api/products/:id  ->  deletes a product
 * TODO (Scenario 1): same problem as POST.
 * ------------------------------------------------------------------ */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Deleted', id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
