// ---------------------------------------------------------------------
// Conexion a MySQL mediante un "pool" de conexiones.
// Un pool reutiliza conexiones abiertas en lugar de crear una nueva por
// cada peticion, lo que es mas eficiente.
// Los datos de conexion se leen del archivo .env (nunca se escriben en el codigo).
// ---------------------------------------------------------------------
require('dotenv').config();
const mysql = require('mysql2/promise');

// Aiven exige conexion cifrada (SSL). En tu computador no hace falta:
// solo se activa si existe la variable DB_SSL=true (se pone en Render).
const usarSSL = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'easy_sinfony',
  waitForConnections: true,
  connectionLimit: 10,
  ssl: usarSSL ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;
