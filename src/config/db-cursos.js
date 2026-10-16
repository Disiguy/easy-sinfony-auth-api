// ---------------------------------------------------------------------
// Conexión a MySQL para el módulo de cursos (instrumentos y lecciones).
// Usa las mismas variables del archivo .env de la API.
// Si en tu .env los nombres son otros, cámbialos aquí.
// ---------------------------------------------------------------------
const mysql = require('mysql2/promise');

module.exports = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'easy_sinfony',
  waitForConnections: true,
  connectionLimit: 10
});
