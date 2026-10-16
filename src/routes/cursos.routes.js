// ---------------------------------------------------------------------
// Rutas del módulo de cursos. Se montan en /api (ver src/app.js).
// ---------------------------------------------------------------------
const express = require('express');
const {
  listarInstrumentos,
  listarLecciones,
  obtenerInstrumentoUsuario,
  elegirInstrumento
} = require('../controllers/cursos.controller');

const router = express.Router();

router.get('/instrumentos', listarInstrumentos);
router.get('/instrumentos/:id/lecciones', listarLecciones);
router.get('/usuarios/instrumento', obtenerInstrumentoUsuario);
router.put('/usuarios/instrumento', elegirInstrumento);

module.exports = router;
