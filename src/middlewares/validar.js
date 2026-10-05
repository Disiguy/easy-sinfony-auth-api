// ---------------------------------------------------------------------
// Validaciones de los datos que llegan en el cuerpo (body) de la peticion.
// Si algo no cumple, se responde 400 (Bad Request) y la peticion no continua.
// ---------------------------------------------------------------------
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida los datos del registro
function validarRegistro(req, res, next) {
  const { nombre, apellido, correo, contrasena } = req.body || {};

  if (!nombre || !apellido || !correo || !contrasena) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Los campos nombre, apellido, correo y contrasena son obligatorios.',
    });
  }
  if (!REGEX_CORREO.test(correo)) {
    return res.status(400).json({ exito: false, mensaje: 'El correo no tiene un formato valido.' });
  }
  if (String(contrasena).length < 8) {
    return res.status(400).json({
      exito: false,
      mensaje: 'La contrasena debe tener al menos 8 caracteres.',
    });
  }
  next(); // todo bien: pasa al controlador
}

// Valida los datos del login
function validarLogin(req, res, next) {
  const { correo, contrasena } = req.body || {};

  if (!correo || !contrasena) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Debes enviar el correo y la contrasena.',
    });
  }
  next();
}

module.exports = { validarRegistro, validarLogin };
