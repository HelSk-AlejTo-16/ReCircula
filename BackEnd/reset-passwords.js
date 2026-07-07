const { Client } = require('pg');
const bcrypt = require('bcrypt');
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

async function reset() {
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
    console.log('🔌 Conectado a PostgreSQL para reestablecer contraseñas...');

    // Asegurar que la columna acepta_transferencias_terceros exista (RF-01 / RF-08)
    await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS acepta_transferencias_terceros BOOLEAN NOT NULL DEFAULT FALSE
    `).catch(err => console.log('Info/Error columna:', err.message));

    const hash = await bcrypt.hash('Password123', 12);

    const usuarios = [
      { id: '00000000-0000-0000-0000-000000000001', nombre: 'Juan Perez', email: 'user@recircula.mx', rol: 'USUARIO_GENERAL' },
      { id: '00000000-0000-0000-0000-000000000002', nombre: 'Carlos Reparador', email: 'reparador@recircula.mx', rol: 'REPARADOR_VERIFICADO' },
      { id: '00000000-0000-0000-0000-000000000003', nombre: 'Admin ReCircula', email: 'admin@recircula.mx', rol: 'ADMINISTRADOR' }
    ];

    for (const u of usuarios) {
      await client.query(
        `INSERT INTO usuarios (id, nombre, email, password_hash, rol, email_verificado, activo)
         VALUES ($1, $2, $3, $4, $5, true, true)
         ON CONFLICT (id) DO UPDATE SET 
           nombre = EXCLUDED.nombre,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           rol = EXCLUDED.rol,
           email_verificado = true,
           activo = true`,
        [u.id, u.nombre, u.email, hash, u.rol]
      );
      console.log(`✅ Contraseña de ${u.email} reestablecida a 'Password123'`);
    }

    console.log('🎉 Reestablecimiento completado exitosamente.');
  } catch (error) {
    console.error('❌ Error reestableciendo contraseñas:', error);
  } finally {
    await client.end();
  }
}

reset();
