import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function setup() {
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'marco',
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('🔌 Conectado a base de datos "postgres"...');

    // 1. Crear base de datos si no existe
    const res = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'ReCircula'"
    );

    if (res.rows.length === 0) {
      console.log('📦 Creando base de datos "ReCircula"...');
      await adminClient.query('CREATE DATABASE "ReCircula";');
      console.log('✅ Base de datos "ReCircula" creada.');
    } else {
      console.log('ℹ️ La base de datos "ReCircula" ya existe.');
    }
  } catch (error) {
    console.error('❌ Error al conectar a postgres / crear base de datos:', error);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // 2. Conectar a ReCircula y ejecutar schema.sql
  const dbClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'marco',
    database: 'ReCircula',
  });

  try {
    await dbClient.connect();
    console.log('🔌 Conectado a base de datos "ReCircula".');

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
