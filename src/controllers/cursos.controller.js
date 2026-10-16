// ---------------------------------------------------------------------
// Módulo 2: catálogo de instrumentos y lecciones.
//   GET /api/instrumentos                 → lista de instrumentos
//   GET /api/instrumentos/:id/lecciones   → lecciones de un instrumento
//   GET /api/usuarios/instrumento?correo= → instrumento elegido por el usuario
//   PUT /api/usuarios/instrumento         → guarda el instrumento elegido
// ---------------------------------------------------------------------
const pool = require('../config/db-cursos');

function errorServidor(res, error, mensaje) {
  console.error(error);
  return res.status(500).json({ exito: false, mensaje });
}

// Lista de instrumentos disponibles
async function listarInstrumentos(req, res) {
  try {
    const [instrumentos] = await pool.query(
      'SELECT id_instrumento, nombre, descripcion FROM instrumento ORDER BY id_instrumento'
    );
    res.json({ exito: true, instrumentos });
  } catch (error) {
    errorServidor(res, error, 'No se pudieron consultar los instrumentos.');
  }
}

// Lecciones de un instrumento, en orden
async function listarLecciones(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ exito: false, mensaje: 'El id del instrumento no es valido.' });
  }

  try {
    const [instrumento] = await pool.query(
      'SELECT id_instrumento, nombre FROM instrumento WHERE id_instrumento = ?', [id]
    );
    if (instrumento.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'El instrumento no existe.' });
    }

    const [lecciones] = await pool.query(
      `SELECT id_leccion, codigo, modulo, titulo, contenido, orden
       FROM leccion WHERE id_instrumento = ? ORDER BY orden`, [id]
    );
    res.json({ exito: true, instrumento: instrumento[0].nombre, lecciones });
  } catch (error) {
    errorServidor(res, error, 'No se pudieron consultar las lecciones.');
  }
}

// Instrumento que ya eligió el usuario (null si aun no elige)
async function obtenerInstrumentoUsuario(req, res) {
  const correo = String(req.query.correo || '').trim();
  if (!correo) {
    return res.status(400).json({ exito: false, mensaje: 'Falta el correo del usuario.' });
  }

  try {
    const [filas] = await pool.query(
      `SELECT u.id_instrumento, i.nombre AS instrumento
       FROM usuario u
       LEFT JOIN instrumento i ON i.id_instrumento = u.id_instrumento
       WHERE u.correo = ?`, [correo]
    );
    if (filas.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }
    res.json({
      exito: true,
      id_instrumento: filas[0].id_instrumento,
      instrumento: filas[0].instrumento
    });
  } catch (error) {
    errorServidor(res, error, 'No se pudo consultar el instrumento del usuario.');
  }
}

// Guarda el instrumento elegido por el usuario
async function elegirInstrumento(req, res) {
  const correo = String((req.body || {}).correo || '').trim();
  const idInstrumento = Number((req.body || {}).id_instrumento);

  if (!correo || !Number.isInteger(idInstrumento) || idInstrumento <= 0) {
    return res.status(400).json({ exito: false, mensaje: 'Debes enviar el correo y el id_instrumento.' });
  }

  try {
    const [instrumento] = await pool.query(
      'SELECT id_instrumento FROM instrumento WHERE id_instrumento = ?', [idInstrumento]
    );
    if (instrumento.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'El instrumento no existe.' });
    }

    const [usuario] = await pool.query('SELECT id_usuario FROM usuario WHERE correo = ?', [correo]);
    if (usuario.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    await pool.query(
      'UPDATE usuario SET id_instrumento = ? WHERE id_usuario = ?',
      [idInstrumento, usuario[0].id_usuario]
    );
    res.json({ exito: true, mensaje: 'Instrumento guardado.', id_instrumento: idInstrumento });
  } catch (error) {
    errorServidor(res, error, 'No se pudo guardar el instrumento.');
  }
}

module.exports = {
  listarInstrumentos,
  listarLecciones,
  obtenerInstrumentoUsuario,
  elegirInstrumento
};
