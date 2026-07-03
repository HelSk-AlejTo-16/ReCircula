import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
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
  } catch (err) {}
}

async function seed() {
  loadEnv();

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'password';
  const dbName = process.env.DB_NAME || 'ReCircula';

  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    await client.connect();
    console.log('🔌 Conectado a PostgreSQL para seeding...');

    // 1. Limpiar datos viejos de usuarios (evitar duplicados en reinicios)
    await client.query('DELETE FROM usuarios WHERE email IN ($1, $2, $3)', [
      'user@recircula.mx',
      'reparador@recircula.mx',
      'admin@recircula.mx',
    ]);

    const hash = await bcrypt.hash('Password123', 12);

    // 2. Insertar Usuario General
    const resUser = await client.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, email_verificado, activo)
       VALUES ('00000000-0000-0000-0000-000000000001', 'Juan Perez', 'user@recircula.mx', $1, 'USUARIO_GENERAL', true, true)
       RETURNING id`,
      [hash]
    );
    const userId = resUser.rows[0].id;
    await client.query(
      `INSERT INTO perfiles_usuario_general (usuario_id, categorias_favoritas)
       VALUES ($1, $2)
       ON CONFLICT (usuario_id) DO NOTHING`,
      [userId, ['Computadoras y Laptops', 'Smartphones y Tablets']]
    );
    console.log('👤 Usuario General creado con ID: 00000000-0000-0000-0000-000000000001');

    // 3. Insertar Reparador
    const resRep = await client.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, email_verificado, activo)
       VALUES ('00000000-0000-0000-0000-000000000002', 'Carlos Reparador', 'reparador@recircula.mx', $1, 'REPARADOR_VERIFICADO', true, true)
       RETURNING id`,
      [hash]
    );
    const repId = resRep.rows[0].id;
    await client.query(
      `INSERT INTO perfiles_reparador (usuario_id, nombre_taller, descripcion_taller, especialidades, puntuacion, reparaciones_documentadas, ubicacion, verificado)
       VALUES ($1, $2, $3, $4, 4.80, 15, ST_SetSRID(ST_MakePoint(-101.3562, 21.1561), 4326)::geography, true)
       ON CONFLICT (usuario_id) DO NOTHING`,
      [repId, 'Taller Fenix', 'Reparación express de laptops y celulares', ['Computadoras y Laptops', 'Smartphones y Tablets']]
    );
    console.log('🛠️ Reparador Verificado creado con ID: 00000000-0000-0000-0000-000000000002');

    // 4. Insertar Administrador
    await client.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, email_verificado, activo)
       VALUES ('00000000-0000-0000-0000-000000000003', 'Admin ReCircula', 'admin@recircula.mx', $1, 'ADMINISTRADOR', true, true)
       ON CONFLICT (id) DO NOTHING`,
      [hash]
    );
    console.log('👑 Administrador creado con ID: 00000000-0000-0000-0000-000000000003');

    console.log('🎉 Seeding completado exitosamente.');
  } catch (error) {
    console.error('❌ Error ejecutando el seeding:', error);
  } finally {
    await client.end();
  }
}

seed();
