-- =====================================================================
-- Easy Sinfony - Esquema minimo para el servicio de autenticacion
-- Evidencia GA7-220501096-AA5-EV01
--
-- Si ya tienes la base de datos easy_sinfony creada (GA6-220501096-AA2-EV02),
-- NO necesitas ejecutar este script: la API usa tu tabla "usuario" tal cual.
-- Este script solo sirve para montar el proyecto desde cero.
-- =====================================================================
CREATE DATABASE IF NOT EXISTS easy_sinfony
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE easy_sinfony;

-- Tabla de roles (la API solo necesita que exista el id_rol asignado)
CREATE TABLE IF NOT EXISTS rol (
  id_rol      INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol  VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO rol (id_rol, nombre_rol) VALUES (1, 'estudiante'), (2, 'instructor'), (3, 'administrador');

-- Tabla de usuarios (columnas segun el DESCRIBE confirmado en Workbench)
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario       INT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(60)  NOT NULL,
  apellido         VARCHAR(60)  NOT NULL,
  correo           VARCHAR(120) NOT NULL UNIQUE,
  contrasena_hash  VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE NULL,
  fecha_registro   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado           ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  id_rol           INT NOT NULL,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol (id_rol)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
