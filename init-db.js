const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_WkutSaeA1i7K@ep-wispy-water-avdsdy02-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: connectionString,
});

async function init() {
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL database successfully!');
    
    // Create the users table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rank VARCHAR(20) DEFAULT 'normal' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.query(createTableQuery);
    console.log('Table "users" verified/created successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
  } finally {
    await client.end();
  }
}

init();
