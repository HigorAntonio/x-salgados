import knexLib from 'knex';
import knexConfig from '../knexfile.js';

// Use NODE_ENV to determine which config to use (defaults to 'development')
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);

export default knex;
