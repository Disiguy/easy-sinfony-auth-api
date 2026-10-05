// ---------------------------------------------------------------------
// Rutas de autenticacion. Cada ruta pasa primero por su validacion
// y luego llega al controlador.
// ---------------------------------------------------------------------
const express = require('express');
const { registrar, iniciarSesion } = require('../controllers/auth.controller');
const { validarRegistro, validarLogin } = require('../middlewares/validar');

const router = express.Router();

router.post('/registro', validarRegistro, registrar);
router.post('/login', validarLogin, iniciarSesion);

module.exports = router;
