-- =====================================================================
-- Easy Sinfony - Módulo de cursos (versión simplificada)
--   instrumento = curso (cada instrumento tiene sus lecciones)
--   leccion     = contenido, igual para todos; cada una tiene un CÓDIGO
--                 (ej. GUI-03) y pertenece a un MÓDULO (1, 2, ...)
--   progreso    = estado de cada lección POR usuario (completada/omitida);
--                 de ahí se saca en qué lección y módulo se quedó
--   usuario.id_instrumento = instrumento elegido (NULL = aún no elige)
-- Ejecutar en MySQL Workbench. No se necesita tabla de inscripción
-- porque la app es gratuita.
-- =====================================================================
USE easy_sinfony;

-- ---------------------------------------------------------------------
-- 0. Limpieza de la versión anterior del script (si ya la habías corrido).
--    Si no la corriste, estas líneas no hacen nada.
--    OJO: cuando la app ya tenga progreso real, comenta estas líneas
--    para no borrarlo al volver a ejecutar el script.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS progreso, inscripcion, leccion, curso;

-- ---------------------------------------------------------------------
-- 1. Instrumentos (cada uno es a la vez un curso)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instrumento (
  id_instrumento INT          NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(60)  NOT NULL,
  descripcion    VARCHAR(255) NULL,
  PRIMARY KEY (id_instrumento),
  UNIQUE KEY uq_instrumento_nombre (nombre)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Lecciones de cada instrumento (en orden)
-- ---------------------------------------------------------------------
CREATE TABLE leccion (
  id_leccion     INT          NOT NULL AUTO_INCREMENT,
  id_instrumento INT          NOT NULL,
  codigo         VARCHAR(20)  NOT NULL,
  modulo         INT          NOT NULL DEFAULT 1,
  titulo         VARCHAR(100) NOT NULL,
  contenido      TEXT         NULL,
  orden          INT          NOT NULL,
  PRIMARY KEY (id_leccion),
  UNIQUE KEY uq_leccion_codigo (codigo),
  UNIQUE KEY uq_leccion_orden (id_instrumento, orden),
  CONSTRAINT fk_leccion_instrumento
    FOREIGN KEY (id_instrumento) REFERENCES instrumento (id_instrumento)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Progreso: qué lecciones completó u omitió cada usuario
-- ---------------------------------------------------------------------
CREATE TABLE progreso (
  id_progreso INT      NOT NULL AUTO_INCREMENT,
  id_usuario  INT      NOT NULL,
  id_leccion  INT      NOT NULL,
  estado      ENUM('completada','omitida') NOT NULL,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_progreso),
  UNIQUE KEY uq_progreso (id_usuario, id_leccion),
  CONSTRAINT fk_progreso_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT fk_progreso_leccion
    FOREIGN KEY (id_leccion) REFERENCES leccion (id_leccion)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Instrumento elegido por el usuario (columna nueva en usuario).
--    Si es NULL, la app le muestra la pantalla para elegir.
--    Solo se agrega si todavía no existe.
-- ---------------------------------------------------------------------
SET @existe = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuario'
    AND COLUMN_NAME = 'id_instrumento'
);
SET @sql = IF(@existe = 0,
  'ALTER TABLE usuario
     ADD COLUMN id_instrumento INT NULL,
     ADD CONSTRAINT fk_usuario_instrumento
       FOREIGN KEY (id_instrumento) REFERENCES instrumento (id_instrumento)
       ON DELETE SET NULL',
  'SELECT ''La columna id_instrumento ya existe'' AS aviso');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================================
-- DATOS DE PRUEBA
-- =====================================================================
INSERT IGNORE INTO instrumento (id_instrumento, nombre, descripcion) VALUES
  (1, 'Guitarra', 'Aprende acordes, ritmos y tus primeras canciones.'),
  (2, 'Piano',    'Conoce el teclado, las escalas y tus primeras melodías.'),
  (3, 'Canto',    'Trabaja tu respiración, tu afinación y tu voz.');

INSERT IGNORE INTO leccion (id_instrumento, codigo, modulo, orden, titulo, contenido) VALUES
  (1, 'GUI-01', 1, 1, 'Partes de la guitarra',       'Conoce el cuerpo, el mástil, las cuerdas y las clavijas.'),
  (1, 'GUI-02', 1, 2, 'Afinación',                   'Aprende a afinar las seis cuerdas: Mi, La, Re, Sol, Si, Mi.'),
  (1, 'GUI-03', 2, 3, 'Postura y mano derecha',      'Cómo sentarte, sostener la guitarra y rasgar las cuerdas.'),
  (1, 'GUI-04', 2, 4, 'Tus primeros acordes',        'Acordes de Mi menor y La menor para empezar a tocar.'),

  (2, 'PIA-01', 1, 1, 'El teclado y las notas',      'Ubica las teclas blancas y negras y el nombre de cada nota.'),
  (2, 'PIA-02', 1, 2, 'Postura de manos y dedos',    'Posición correcta de las manos y numeración de los dedos.'),
  (2, 'PIA-03', 2, 3, 'Escala de Do mayor',          'Toca tu primera escala con la mano derecha.'),
  (2, 'PIA-04', 2, 4, 'Tu primera melodía',          'Una melodía sencilla para practicar lo aprendido.'),

  (3, 'CAN-01', 1, 1, 'Respiración diafragmática',   'Aprende a respirar con el diafragma para sostener la voz.'),
  (3, 'CAN-02', 1, 2, 'Postura y relajación',        'Cómo pararte y relajar cuello y hombros al cantar.'),
  (3, 'CAN-03', 2, 3, 'Calentamiento vocal',         'Ejercicios sencillos para preparar tu voz.'),
  (3, 'CAN-04', 2, 4, 'Afinación y primera canción', 'Entrena el oído y canta una canción corta.');

-- ---------------------------------------------------------------------
-- Comprobación: debe mostrar 3 instrumentos y 12 lecciones
-- ---------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM instrumento) AS instrumentos,
  (SELECT COUNT(*) FROM leccion)     AS lecciones;

-- ---------------------------------------------------------------------
-- Consulta de ejemplo: ¿en qué lección y módulo se quedó un usuario?
-- (la última lección que completó u omitió). Cambia el id_usuario.
-- ---------------------------------------------------------------------
-- SELECT l.codigo, l.modulo, l.titulo, p.estado, p.fecha
-- FROM progreso p
-- JOIN leccion l ON l.id_leccion = p.id_leccion
-- WHERE p.id_usuario = 1
-- ORDER BY p.fecha DESC, p.id_progreso DESC
-- LIMIT 1;
