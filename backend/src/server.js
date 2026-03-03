import app from './app.js';
import knex from './db.js';

// Verify database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await knex.raw('SELECT 1');
    console.log('✓ Database connection established');

    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`✓ Server listening on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Closing server gracefully...`);
      server.close(() => {
        console.log('Server closed');
        knex.destroy(() => {
          console.log('Database connections closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    console.error('  Make sure your database is running and DATABASE_URL is correct');
    process.exit(1);
  }
}

// Start the server
startServer();
