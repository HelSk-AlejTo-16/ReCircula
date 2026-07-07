import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

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

async function run() {
  loadEnv();

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbUser = process.env.DB_USERNAME || process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'password';
  const dbName = process.env.DB_DATABASE || process.env.DB_NAME || 'ReCircula';
  const connectionString = process.env.EXTERNAL_DATABASE_URL;

  console.log('--- DEPURACIÓN DE CONEXIÓN ---');
  if (connectionString) {
    console.log('Conectando usando EXTERNAL_DATABASE_URL de forma directa.');
  } else {
    console.log(`Host: "${dbHost}"`);
    console.log(`Port: ${dbPort}`);
    console.log(`User: "${dbUser}"`);
    console.log(`Database Name: "${dbName}"`);
    console.log(`Password (largo): ${dbPassword ? dbPassword.length : 0} caracteres`);
  }
  console.log('------------------------------');

  const client = connectionString
    ? new Client({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
      })
    : new Client({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        ssl: {
          rejectUnauthorized: false,
        },
      });

  try {
    await client.connect();
    console.log('✅ Conexión establecida con éxito.');

    // 1. Ejecutar schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`No se encontró el archivo schema.sql en: ${schemaPath}`);
    }
    console.log('📜 Leyendo y ejecutando schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('✅ Estructura de tablas, funciones y tipos creada.');

    // 2. Ejecutar seeding
    console.log('🌱 Insertando datos semilla (usuarios de prueba)...');
    await client.query('DELETE FROM usuarios WHERE email IN ($1, $2, $3)', [
      'user@recircula.mx',
      'reparador@recircula.mx',
      'admin@recircula.mx',
    ]);

    const hash = await bcrypt.hash('Password123', 12);

    // Usuario General
    const resUser = await client.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, email_verificado, activo)
       VALUES ('00000000-0000-0000-0000-000000000001', 'Juan Perez', 'user@recircula.mx', $1, 'USUARIO_GENERAL', true, true)
       RETURNING id`,
      [hash]
    );
    await client.query(
      `INSERT INTO perfiles_usuario_general (usuario_id, categorias_favoritas)
       VALUES ($1, $2)
       ON CONFLICT (usuario_id) DO NOTHING`,
      [resUser.rows[0].id, ['Computadoras y Laptops', 'Smartphones y Tablets']]
    );

    // Reparador
    const resRep = await client.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, email_verificado, activo)
       VALUES ('00000000-0000-0000-0000-000000000002', 'Carlos Reparador', 'reparador@recircula.mx', $1, 'REPARADOR_VERIFICADO', true, true)
       RETURNING id`,
      [hash]
    );
    await client.query(
      `INSERT INTO perfiles_reparador (usuario_id, nombre_taller, descripcion_taller, especialidades, puntuacion, reparaciones_documentadas, ubicacion, verificado)
       VALUES ($1, $2, $3, $4, 4.80, 15, ST_SetSRID(ST_MakePoint(-101.3562, 21.1561), 4326)::geography, true)
       ON CONFLICT (usuario_id) DO NOTHING`,
      [resRep.rows[0].id, 'Taller Fenix', 'Reparación express de laptops y celulares', ['Computadoras y Laptops', 'Smartphones y Tablets']]
    );

    // Administrador
    await client.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, email_verificado, activo)
       VALUES ('00000000-0000-0000-0000-000000000003', 'Admin ReCircula', 'admin@recircula.mx', $1, 'ADMINISTRADOR', true, true)
       ON CONFLICT (id) DO NOTHING`,
      [hash]
    );

    console.log('🎉 Inicialización y seeding completados con éxito.');
  } catch (err) {
    console.error('❌ Error en el proceso de inicialización de BD:', err);
  } finally {
    await client.end();
  }
}

run();
