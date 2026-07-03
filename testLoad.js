const autocannon = require('autocannon');

const URL = 'http://localhost:3000'; // URL del Backend (NestJS)

async function runTests() {
  console.log('--- Iniciando Prueba de Carga RNF-01 (Rendimiento) ---');
  
  // Prueba 1: Lectura Intensiva (Catálogo de Publicaciones)
  console.log('\n1. Prueba de Lectura (GET /api/v1/publications)');
  const readResult = await autocannon({
    url: `${URL}/api/v1/publications`,
    connections: 100, // Usuarios concurrentes
    duration: 10,     // Duración en segundos
    title: 'Lectura de Publicaciones'
  });
  console.log(autocannon.printResult(readResult));

  // Prueba 2: CPU Intensivo (Inicio de sesión con encriptación)
  // Utilizamos una cuenta de prueba que sabemos que existe en BD
  console.log('\n2. Prueba de CPU Intensiva (POST /api/v1/identity/login)');
  const loginResult = await autocannon({
    url: `${URL}/api/v1/identity/login`,
    connections: 100,
    duration: 10,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'usuario@recircula.mx',
      password: 'Password123'
    }),
    title: 'Login de Usuarios'
  });
  console.log(autocannon.printResult(loginResult));

  console.log('\n--- Pruebas de Carga Finalizadas ---');
}

runTests().catch(console.error);
