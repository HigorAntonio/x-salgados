import 'dotenv/config';

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const commonConfig = {
  client: 'pg',
  migrations: {
    directory: './database/migrations',
  },
  seeds: {
    directory: './database/seeds',
  },
};

export default {
  development: {
    ...commonConfig,
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
    },
    debug: false,
  },

  test: {
    ...commonConfig,
    connection: process.env.DATABASE_URL,
    pool: {
      min: 1,
      max: 5,
    },
  },

  production: {
    ...commonConfig,
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 20,
    },
    acquireConnectionTimeout: 10000,
  },
};

