# Easy Sinfony - API de autenticación

Servicio web (API REST) de **registro** e **inicio de sesión** para Easy Sinfony, aplicación móvil de aprendizaje musical.
Evidencia **GA7-220501096-AA5-EV01** - SENA, Tecnología en Análisis y Desarrollo de Software (Ficha 3186624).

**Autor:** Juan Sebastian Jimenez Satizabal

## Tecnologías
Node.js, Express, MySQL (`mysql2`), bcryptjs (cifrado de contraseñas), dotenv.

## Requisitos previos
- Node.js 18 o superior
- MySQL 8 (o MariaDB) en ejecución

## Instalación
```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env
```
Edita `.env` con tu usuario y contraseña de MySQL.

Base de datos: si ya tienes `easy_sinfony` (tabla `usuario`), no hagas nada. Si no, ejecuta `database/schema.sql`.

## Ejecución
```bash
npm start
```
El servicio queda en `http://localhost:3000`.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/registro` | Registra un usuario |
| POST | `/api/auth/login` | Inicia sesión |

### POST /api/auth/registro
```json
{
  "nombre": "Juan Sebastian",
  "apellido": "Jimenez Satizabal",
  "correo": "juan@correo.com",
  "contrasena": "Clave12345",
  "fecha_nacimiento": "2000-05-20"
}
```
Respuestas: `201` registrado, `400` datos inválidos, `409` correo ya existe.

### POST /api/auth/login
```json
{ "correo": "juan@correo.com", "contrasena": "Clave12345" }
```
Respuestas: `200` "Autenticacion satisfactoria.", `401` credenciales incorrectas, `403` cuenta inactiva.

## Seguridad
- Las contraseñas se guardan con **hash bcrypt**, nunca en texto plano.
- Consultas con **parámetros** (`?`) para evitar inyección SQL.
- El mismo mensaje de error si falla el correo o la contraseña.
- Credenciales de la base de datos en `.env` (excluido de Git).

## Pruebas
Importa `pruebas/Easy_Sinfony_Auth.postman_collection.json` en Postman.
