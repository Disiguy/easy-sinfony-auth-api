// ---------------------------------------------------------------------
// Punto de entrada: levanta el servidor HTTP.
// Ejecutar con:  npm start
// ---------------------------------------------------------------------
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API de autenticacion Easy Sinfony escuchando en http://localhost:${PORT}`);
});
