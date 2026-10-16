// ---------------------------------------------------------------------
// Pruebas unitarias - Módulo 2: Instrumentos y lecciones
// Se prueban las rutas con Supertest; la base de datos se simula (mock),
// por eso NO necesitan MySQL encendido.
// Ejecutar con:  npm test
// ---------------------------------------------------------------------
jest.mock('../src/config/db-cursos', () => ({ query: jest.fn() }));

const express = require('express');
const request = require('supertest');
const pool = require('../src/config/db-cursos');
const cursosRoutes = require('../src/routes/cursos.routes');

const app = express();
app.use(express.json());
app.use('/api', cursosRoutes);

beforeEach(() => {
  pool.query.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

// ======================= GET /api/instrumentos =======================
describe('GET /api/instrumentos', () => {
  test('devuelve la lista de instrumentos', async () => {
    const instrumentos = [
      { id_instrumento: 1, nombre: 'Guitarra', descripcion: 'Acordes y rasgueo' },
      { id_instrumento: 2, nombre: 'Ukelele', descripcion: 'Acordes sencillos' },
    ];
    pool.query.mockResolvedValueOnce([instrumentos]);

    const res = await request(app).get('/api/instrumentos');

    expect(res.status).toBe(200);
    expect(res.body.exito).toBe(true);
    expect(res.body.instrumentos).toEqual(instrumentos);
  });

  test('responde 500 si falla la base de datos', async () => {
    pool.query.mockRejectedValueOnce(new Error('conexión caída'));

    const res = await request(app).get('/api/instrumentos');

    expect(res.status).toBe(500);
    expect(res.body.exito).toBe(false);
  });
});

// ================= GET /api/instrumentos/:id/lecciones =================
describe('GET /api/instrumentos/:id/lecciones', () => {
  test('devuelve las lecciones del instrumento', async () => {
    const lecciones = [
      { id_leccion: 1, codigo: 'GUI-01', modulo: 1, titulo: 'Partes de la guitarra', contenido: '...', orden: 1 },
      { id_leccion: 2, codigo: 'GUI-02', modulo: 1, titulo: 'Afinación', contenido: '...', orden: 2 },
    ];
    pool.query
      .mockResolvedValueOnce([[{ id_instrumento: 1, nombre: 'Guitarra' }]])
      .mockResolvedValueOnce([lecciones]);

    const res = await request(app).get('/api/instrumentos/1/lecciones');

    expect(res.status).toBe(200);
    expect(res.body.instrumento).toBe('Guitarra');
    expect(res.body.lecciones).toHaveLength(2);
    expect(res.body.lecciones[0].codigo).toBe('GUI-01');
  });

  test('responde 400 si el id no es un número válido', async () => {
    const res = await request(app).get('/api/instrumentos/abc/lecciones');

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('responde 404 si el instrumento no existe', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/instrumentos/99/lecciones');

    expect(res.status).toBe(404);
    expect(res.body.exito).toBe(false);
  });
});

// ================== GET /api/usuarios/instrumento ==================
describe('GET /api/usuarios/instrumento', () => {
  test('devuelve el instrumento que eligió el usuario', async () => {
    pool.query.mockResolvedValueOnce([[{ id_instrumento: 2, instrumento: 'Ukelele' }]]);

    const res = await request(app).get('/api/usuarios/instrumento').query({ correo: 'ana@correo.com' });

    expect(res.status).toBe(200);
    expect(res.body.id_instrumento).toBe(2);
    expect(res.body.instrumento).toBe('Ukelele');
    expect(pool.query.mock.calls[0][1]).toEqual(['ana@correo.com']);
  });

  test('devuelve null si el usuario aún no eligió instrumento', async () => {
    pool.query.mockResolvedValueOnce([[{ id_instrumento: null, instrumento: null }]]);

    const res = await request(app).get('/api/usuarios/instrumento').query({ correo: 'ana@correo.com' });

    expect(res.status).toBe(200);
    expect(res.body.id_instrumento).toBeNull();
  });

  test('responde 400 si no se envía el correo', async () => {
    const res = await request(app).get('/api/usuarios/instrumento');

    expect(res.status).toBe(400);
  });

  test('responde 404 si el usuario no existe', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/usuarios/instrumento').query({ correo: 'nadie@correo.com' });

    expect(res.status).toBe(404);
  });
});

// ================== PUT /api/usuarios/instrumento ==================
describe('PUT /api/usuarios/instrumento', () => {
  test('guarda el instrumento elegido por el usuario', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_instrumento: 2 }]])  // el instrumento existe
      .mockResolvedValueOnce([[{ id_usuario: 5 }]])      // el usuario existe
      .mockResolvedValueOnce([{ affectedRows: 1 }]);     // UPDATE

    const res = await request(app)
      .put('/api/usuarios/instrumento')
      .send({ correo: 'ana@correo.com', id_instrumento: 2 });

    expect(res.status).toBe(200);
    expect(res.body.exito).toBe(true);
    expect(res.body.id_instrumento).toBe(2);
    expect(pool.query.mock.calls[2][1]).toEqual([2, 5]);
  });

  test('responde 400 si faltan datos', async () => {
    const res = await request(app).put('/api/usuarios/instrumento').send({ correo: 'ana@correo.com' });

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('responde 404 si el instrumento no existe', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .put('/api/usuarios/instrumento')
      .send({ correo: 'ana@correo.com', id_instrumento: 99 });

    expect(res.status).toBe(404);
  });

  test('responde 404 si el usuario no existe', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_instrumento: 1 }]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app)
      .put('/api/usuarios/instrumento')
      .send({ correo: 'nadie@correo.com', id_instrumento: 1 });

    expect(res.status).toBe(404);
    expect(pool.query).toHaveBeenCalledTimes(2); // no llega al UPDATE
  });

  test('responde 500 si falla la base de datos', async () => {
    pool.query.mockRejectedValueOnce(new Error('conexión caída'));

    const res = await request(app)
      .put('/api/usuarios/instrumento')
      .send({ correo: 'ana@correo.com', id_instrumento: 1 });

    expect(res.status).toBe(500);
  });
});
