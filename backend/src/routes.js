import express from 'express';
import knex from './db.js';

const router = express.Router();

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Verifica o status da API e a conexão com o banco de dados
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *             example:
 *               status: ok
 *               timestamp: '2026-03-03T10:00:00.000Z'
 *       500:
 *         description: Erro de conexão com o banco de dados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *             example:
 *               status: error
 *               message: 'Database connection failed'
 */
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
