// ---------------------------------------------------------------------
// Controlador de autenticacion: logica de registro e inicio de sesion.
// Trabaja sobre la tabla "usuario" del proyecto Easy Sinfony.
// ---------------------------------------------------------------------
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Cuantas "rondas" de cifrado usa bcrypt (mas alto = mas seguro pero mas lento)
const RONDAS_BCRYPT = 10;

// Hash falso con el que se compara cuando el correo no existe. Asi el login
// tarda lo mismo exista o no el usuario y no se filtra esa informacion.
const HASH_FALSO = bcrypt.hashSync('contrasena-falsa-para-igualar-tiempos', RONDAS_BCRYPT);

// ======================= POST /api/auth/registro =======================
async function registrar(req, res) {
  try {
    const { nombre, apellido, correo, contrasena, fecha_nacimiento } = req.body;
    const idRol = Number(process.env.DEFAULT_ROL_ID) || 1;
    const correoNormalizado = correo.trim().toLowerCase();

    // 1. Verificar que el correo no este registrado
    const [existentes] = await pool.execute(
      'SELECT id_usuario FROM usuario WHERE correo = ?',
      [correoNormalizado]
    );
    if (existentes.length > 0) {
      return res.status(409).json({
        exito: false,
        mensaje: 'Ya existe un usuario registrado con ese correo.',
      });
    }

    // 2. Cifrar la contrasena. NUNCA se guarda en texto plano.
    const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

    // 3. Insertar el usuario. Se usan parametros (?) para evitar inyeccion SQL.
    const [resultado] = await pool.execute(
      `INSERT INTO usuario
         (nombre, apellido, correo, contrasena_hash, fecha_nacimiento, id_rol)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        apellido.trim(),
        correoNormalizado,
        contrasenaHash,
        fecha_nacimiento || null,
        idRol,
      ]
    );

    // 4. Responder 201 (Created) sin devolver la contrasena
    return res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado correctamente.',
      usuario: {
        id_usuario: resultado.insertId,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        correo: correoNormalizado,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error.message);

    // Si la fecha tiene formato invalido o el rol por defecto no existe
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE' || error.code === 'ER_WRONG_VALUE') {
      return res.status(400).json({ exito: false, mensaje: 'La fecha_nacimiento debe tener formato AAAA-MM-DD.' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(500).json({ exito: false, mensaje: 'El rol por defecto (DEFAULT_ROL_ID) no existe en la tabla rol.' });
    }
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
}

// ========================= POST /api/auth/login =========================
async function iniciarSesion(req, res) {
  try {
    const { correo, contrasena } = req.body;
    const correoNormalizado = correo.trim().toLowerCase();

    // 1. Buscar al usuario por correo
    const [filas] = await pool.execute(
      `SELECT id_usuario, nombre, apellido, correo, contrasena_hash, estado, id_rol
         FROM usuario WHERE correo = ?`,
      [correoNormalizado]
    );
    const usuario = filas[0];

    // 2. Comparar la contrasena con el hash guardado (bcrypt.compare)
    const hashAComparar = usuario ? usuario.contrasena_hash : HASH_FALSO;
    const coincide = await bcrypt.compare(contrasena, hashAComparar);

    // 3. Credenciales invalidas: mismo mensaje si falla el correo o la contrasena
    if (!usuario || !coincide) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Error de autenticacion: correo o contrasena incorrectos.',
      });
    }

    // 4. Usuario inactivo: no puede ingresar
    if (usuario.estado !== 'activo') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Error de autenticacion: la cuenta esta inactiva.',
      });
    }

    // 5. Todo correcto
    return res.status(200).json({
      exito: true,
      mensaje: 'Autenticacion satisfactoria.',
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        id_rol: usuario.id_rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
}

module.exports = { registrar, iniciarSesion };
