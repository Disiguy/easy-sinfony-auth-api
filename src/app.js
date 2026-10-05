// ---------------------------------------------------------------------
// Configuracion de la aplicacion Express (middlewares y rutas).
// ---------------------------------------------------------------------
const express = require('express');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Permite leer el cuerpo de las peticiones en formato JSON
app.use(express.json());

// Captura JSON mal formado enviado por el cliente
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ exito: false, mensaje: 'El cuerpo de la peticion no es un JSON valido.' });
  }
  next(err);
});

// Ruta de prueba para saber si el servicio esta activo
app.get('/', (req, res) => {
  res.json({ servicio: 'Easy Sinfony - API de autenticacion', estado: 'activo' });
});

// Todas las rutas de autenticacion quedan bajo /api/auth
app.use('/api/auth', authRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada.' });
});

module.exports = app;
