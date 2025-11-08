-- SCRIPT DE CREACIÓN (COMPLETO)
USE classgestionsystem_db;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('estudiante', 'docente', 'administrador') NOT NULL,
    biografia TEXT NULL,
    foto_url VARCHAR(255) NULL,
    ciudad VARCHAR(100) NULL,
    estado_verificacion ENUM('no_aplica', 'pendiente', 'verificado', 'rechazado') DEFAULT 'no_aplica'
);

CREATE TABLE verificaciones_docente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    docente_id INT NOT NULL UNIQUE,
    url_cv VARCHAR(255) NULL,
    url_dni VARCHAR(255) NULL,
    url_titulo VARCHAR(255) NULL,
    estado ENUM('en_revision', 'aprobado', 'rechazado') DEFAULT 'en_revision',
    observaciones_admin TEXT NULL,
    fecha_postulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP NULL,
    FOREIGN KEY (docente_id) REFERENCES usuarios(id)
);

CREATE TABLE planes_estudio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    docente_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    duracion_semanas INT NULL,
    frecuencia_semanal INT NULL,
    objetivos TEXT NULL,
    estado ENUM('borrador', 'publicado') DEFAULT 'borrador',
    FOREIGN KEY (docente_id) REFERENCES usuarios(id)
);

CREATE TABLE cursos_lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    docente_id INT NOT NULL,
    plan_id INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    cupos INT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    modalidad ENUM('virtual', 'presencial') NOT NULL,
    estado ENUM('programado', 'en_curso', 'finalizado', 'cancelado') DEFAULT 'programado',
    FOREIGN KEY (docente_id) REFERENCES usuarios(id),
    FOREIGN KEY (plan_id) REFERENCES planes_estudio(id)
);

CREATE TABLE inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    lote_id INT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente_pago', 'inscrito', 'cancelado') DEFAULT 'pendiente_pago',
    FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
    FOREIGN KEY (lote_id) REFERENCES cursos_lotes(id),
    UNIQUE KEY inscripcion_unica (estudiante_id, lote_id)
);

CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT NOT NULL UNIQUE,
    monto DECIMAL(10, 2) NOT NULL,
    comprobante_url VARCHAR(255) NOT NULL,
    estado ENUM('pendiente', 'validado', 'rechazado') DEFAULT 'pendiente',
    observacion_admin TEXT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_validacion TIMESTAMP NULL,
    FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id)
);

CREATE TABLE disponibilidad_docente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    docente_id INT NOT NULL,
    dia_semana INT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    FOREIGN KEY (docente_id) REFERENCES usuarios(id),
    UNIQUE KEY horario_unico (docente_id, dia_semana, hora_inicio, hora_fin)
);

CREATE TABLE resenas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    docente_id INT NOT NULL,
    lote_id INT NOT NULL,
    calificacion INT NOT NULL,
    comentario TEXT NULL,
    estado ENUM('publicada', 'reportada', 'oculta') DEFAULT 'publicada',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
    FOREIGN KEY (docente_id) REFERENCES usuarios(id),
    FOREIGN KEY (lote_id) REFERENCES cursos_lotes(id)
);

CREATE TABLE taxonomias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('materia', 'nivel') NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    UNIQUE KEY tipo_nombre_unico (tipo, nombre)
);

CREATE TABLE lote_horarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lote_id INT NOT NULL,
    dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    FOREIGN KEY (lote_id) REFERENCES cursos_lotes(id) ON DELETE CASCADE
);