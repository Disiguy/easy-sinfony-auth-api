// ---------------------------------------------------------------------
// Pruebas unitarias - Módulo 1: Autenticación (registro e inicio de sesión)
// La base de datos se simula (mock), por eso NO necesitan MySQL encendido.
// Ejecutar con:  npm test
// ---------------------------------------------------------------------
jest.mock('../src/config/db', () => ({ execute: jest.fn() }));

const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');
const { registrar, iniciarSesion } = require('../src/controllers/auth.controller');

// Respuesta falsa de Express para poder revisar el estado y el JSON enviados
function crearRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  pool.execute.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

// ============================ REGISTRO ============================
describe('POST /api/auth/registro (registrar)', () => {
  const body = {
    nombre: ' Ana ',
    apellido: ' Pérez ',
    correo: '  ANA@Correo.com ',
    contrasena: 'Clave123',
  };

  test('registra un usuario nuevo y responde 201 sin devolver la contraseña', async () => {
    pool.execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 7 }]);
    const res = crearRes();

    await registrar({ body }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const respuesta = res.json.mock.calls[0][0];
    expect(respuesta.exito).toBe(true);
    expect(respuesta.usuario).toEqual({
      id_usuario: 7,
      nombre: 'Ana',
      apellido: 'Pérez',
      correo: 'ana@correo.com',
    });
    expect(JSON.stringify(respuesta)).not.toContain('Clave123');
  });

  test('guarda la contraseña cifrada con bcrypt y no en texto plano', async () => {
    pool.execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 1 }]);

    await registrar({ body }, crearRes());

    const parametros = pool.execute.mock.calls[1][1];
    expect(parametros[3]).not.toBe('Clave123');
    expect(parametros[3]).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare('Clave123', parametros[3])).toBe(true);
  });

  test('guarda la fecha de nacimiento como null cuando no se envía', async () => {
    pool.execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 1 }]);

    await registrar({ body }, crearRes());

    expect(pool.execute.mock.calls[1][1][4]).toBeNull();
  });

  test('responde 409 si el correo ya está registrado', async () => {
    pool.execute.mockResolvedValueOnce([[{ id_usuario: 3 }]]);
    const res = crearRes();

    await registrar({ body }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].exito).toBe(false);
    expect(pool.execute).toHaveBeenCalledTimes(1); // no intenta insertar
  });

  test('responde 400 si la fecha de nacimiento tiene un formato inválido', async () => {
    pool.execute
      .mockResolvedValueOnce([[]])
      .mockRejectedValueOnce(Object.assign(new Error('fecha'), { code: 'ER_TRUNCATED_WRONG_VALUE' }));
    const res = crearRes();

    await registrar({ body: { ...body, fecha_nacimiento: 'ayer' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('responde 500 si el rol por defecto no existe', async () => {
    pool.execute
      .mockResolvedValueOnce([[]])
      .mockRejectedValueOnce(Object.assign(new Error('rol'), { code: 'ER_NO_REFERENCED_ROW_2' }));
    const res = crearRes();

    await registrar({ body }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].mensaje).toMatch(/rol/i);
  });

  test('responde 500 ante un error inesperado de la base de datos', async () => {
    pool.execute.mockRejectedValueOnce(new Error('conexión caída'));
    const res = crearRes();

    await registrar({ body }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].exito).toBe(false);
  });
});

// ========================= INICIO DE SESIÓN =========================
describe('POST /api/auth/login (iniciarSesion)', () => {
  const hash = bcrypt.hashSync('Clave123', 4);
  const usuarioBD = {
    id_usuario: 1,
    nombre: 'Ana',
    apellido: 'Pérez',
    correo: 'ana@correo.com',
    contrasena_hash: hash,
    estado: 'activo',
    id_rol: 1,
  };

  test('inicia sesión con credenciales correctas y responde 200', async () => {
    pool.execute.mockResolvedValueOnce([[usuarioBD]]);
    const res = crearRes();

    await iniciarSesion({ body: { correo: 'ana@correo.com', contrasena: 'Clave123' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const respuesta = res.json.mock.calls[0][0];
    expect(respuesta.exito).toBe(true);
    expect(respuesta.usuario).toEqual({
      id_usuario: 1,
      nombre: 'Ana',
      apellido: 'Pérez',
      correo: 'ana@correo.com',
      id_rol: 1,
    });
    expect(JSON.stringify(respuesta)).not.toContain('contrasena_hash');
  });

  test('normaliza el correo (minúsculas y sin espacios) antes de consultar', async () => {
    pool.execute.mockResolvedValueOnce([[usuarioBD]]);

    await iniciarSesion({ body: { correo: '  ANA@Correo.com ', contrasena: 'Clave123' } }, crearRes());

    expect(pool.execute.mock.calls[0][1]).toEqual(['ana@correo.com']);
  });

  test('responde 401 si la contraseña es incorrecta', async () => {
    pool.execute.mockResolvedValueOnce([[usuarioBD]]);
    const res = crearRes();

    await iniciarSesion({ body: { correo: 'ana@correo.com', contrasena: 'otra' } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].exito).toBe(false);
  });

  test('responde 401 con el mismo mensaje si el correo no existe', async () => {
    pool.execute.mockResolvedValueOnce([[usuarioBD]]);
    const resContrasenaMala = crearRes();
    await iniciarSesion({ body: { correo: 'ana@correo.com', contrasena: 'otra' } }, resContrasenaMala);

    pool.execute.mockResolvedValueOnce([[]]);
    const resSinUsuario = crearRes();
    await iniciarSesion({ body: { correo: 'nadie@correo.com', contrasena: 'Clave123' } }, resSinUsuario);

    expect(resSinUsuario.status).toHaveBeenCalledWith(401);
    expect(resSinUsuario.json.mock.calls[0][0].mensaje)
      .toBe(resContrasenaMala.json.mock.calls[0][0].mensaje);
  });

  test('responde 403 si la cuenta está inactiva', async () => {
    pool.execute.mockResolvedValueOnce([[{ ...usuarioBD, estado: 'inactivo' }]]);
    const res = crearRes();

    await iniciarSesion({ body: { correo: 'ana@correo.com', contrasena: 'Clave123' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('responde 500 ante un error inesperado de la base de datos', async () => {
    pool.execute.mockRejectedValueOnce(new Error('conexión caída'));
    const res = crearRes();

    await iniciarSesion({ body: { correo: 'ana@correo.com', contrasena: 'Clave123' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
