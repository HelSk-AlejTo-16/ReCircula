import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

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
  } catch (err) {
    console.warn('Advertencia al cargar archivo .env:', err.message);
  }
}

async function setup() {
  loadEnv();

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'password';
  const dbName = process.env.DB_NAME || 'ReCircula';

  const adminClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('🔌 Conectado a base de datos "postgres"...');

    console.log(`Terminando conexiones activas y eliminando base de datos "${dbName}" si existe...`);
    await adminClient.query(`
      REVOKE CONNECT ON DATABASE "${dbName}" FROM public;
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbName}' AND pid <> pg_backend_pid();
    `).catch(() => {});
    await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}";`);

    console.log(`Creando base de datos "${dbName}"...`);
    await adminClient.query(`CREATE DATABASE "${dbName}";`);
    console.log(`Base de datos "${dbName}" creada.`);
  } catch (error) {
    console.error('Error al conectar a postgres / crear base de datos:', error);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // 2. Conectar a la base de datos de ReCircula y ejecutar schema.sql
  const dbClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    await dbClient.connect();
    console.log(`🔌 Conectado a base de datos "${dbName}".`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`No se encontró el archivo schema.sql en: ${schemaPath}`);
    }

    console.log('📜 Leyendo y ejecutando schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Ejecutar todo el script SQL
    await dbClient.query(schemaSql);
    console.log('✅ Tablas, tipos, funciones y vistas creados exitosamente.');
  } catch (error) {
    console.error('❌ Error al ejecutar el schema:', error);
  } finally {
    await dbClient.end();
  }
}

setup();
