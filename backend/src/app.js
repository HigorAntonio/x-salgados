import express from 'express';
import routes from './routes.js';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use(routes);

// 404 handler - Must be after all routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

// Global error handler - Must be last middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
