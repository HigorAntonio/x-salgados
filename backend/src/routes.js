import express from 'express';
import knex from './db.js';

const router = express.Router();

// Health check endpoint
router.get('/status', async (req, res) => {
  try {
    // Simple knex raw query to ensure DB connection
    await knex.raw('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed' 
    });
  }
});

export default router;
