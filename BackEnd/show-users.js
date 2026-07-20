const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          process.env[key] = value;
        }
      }
    }
  } catch (err) {}
}

async function run() {
  loadEnv();
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ReCircula',
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, nombre, email, rol, activo, email_verificado FROM usuarios');
    console.log(' USUARIOS REGISTRADOS EN LA BASE DE DATOS:');
    console.table(res.rows);
  } catch (error) {
    console.error(' Error consultando usuarios:', error);
  } finally {
    await client.end();
  }
}

run();
