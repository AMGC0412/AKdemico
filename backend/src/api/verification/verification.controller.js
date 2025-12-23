import { query } from '../../config/database.js';
import path from 'path';

/**
 * Controlador para que un docente postule a verificación (US-06)
 * Mantenemos la lógica de archivos y rutas relativas original.
 */
export const postularParaVerificacion = async (req, res) => {
  const docenteId = req.usuario.id;

  // 1. Verificación de archivos (Lógica original intacta)
  if (!req.files || !req.files.cv || !req.files.dni || !req.files.titulo) {
    return res.status(400).json({ mensaje: 'Faltan archivos. Se requiere CV, DNI y Título.' });
  }

  // 2. Rutas relativas para BD (Lógica original intacta)
  const url_cv = path.relative('uploads', req.files.cv[0].path);
  const url_dni = path.relative('uploads', req.files.dni[0].path);
  const url_titulo = path.relative('uploads', req.files.titulo[0].path);

  try {
    // 3. Validar que el usuario posea el ROL de 'docente' en la nueva estructura
    const [rolCheck] = await query(
      `SELECT u.id FROM usuarios u
       INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
       INNER JOIN roles r ON ur.rol_id = r.id
       WHERE u.id = ? AND r.nombre = 'docente'`,
      [docenteId]
    );

    if (!rolCheck) {
      return res.status(403).json({ mensaje: 'Solo los usuarios con rol docente pueden postular.' });
    }

    // 4. Verificar si ya existe una postulación (Original)
    const [existente] = await query(
      'SELECT id FROM verificaciones_docente WHERE docente_id = ?', 
      [docenteId]
    );

    if (existente) {
      return res.status(409).json({ mensaje: 'Ya existe una postulación en revisión.' });
    }

    // 5. Insertar postulación
    const sqlInsert = `
      INSERT INTO verificaciones_docente (docente_id, url_cv, url_dni, url_titulo, estado)
      VALUES (?, ?, ?, ?, 'en_revision')
    `;
    await query(sqlInsert, [docenteId, url_cv, url_dni, url_titulo]);

    // 6. Actualizar estado en tabla usuarios (Original)
    await query("UPDATE usuarios SET estado_verificacion = 'pendiente' WHERE id = ?", [docenteId]);

    res.status(201).json({ mensaje: 'Postulación enviada exitosamente. Estado: en revisión.' });

  } catch (error) {
    console.error('Error al postular:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para que un docente vea el estado de su postulación (US-07)
 */
export const obtenerMiEstadoDeVerificacion = async (req, res) => {
  const docenteId = req.usuario.id;

  try {
    // 1. Obtener estado general y validar rol docente mediante JOIN
    const [usuario] = await query(
      `SELECT u.estado_verificacion 
       FROM usuarios u
       INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
       INNER JOIN roles r ON ur.rol_id = r.id
       WHERE u.id = ? AND r.nombre = 'docente'`,
      [docenteId]
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado o no tiene rol de docente.' });
    }

    // 2. Buscar detalles en la tabla de verificaciones
    const [postulacion] = await query(
      'SELECT estado, observaciones_admin, fecha_revision FROM verificaciones_docente WHERE docente_id = ?',
      [docenteId]
    );

    if (!postulacion) {
      return res.status(200).json({
        estadoGeneral: usuario.estado_verificacion,
        mensaje: 'Aún no has iniciado tu postulación.'
      });
    }

    res.status(200).json({
      estadoGeneral: usuario.estado_verificacion,
      estadoDetallado: postulacion.estado,
      observaciones: postulacion.observaciones_admin,
      fechaRevision: postulacion.fecha_revision
    });

  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para que un Admin apruebe o rechace (US-05)
 */
export const revisarPostulacion = async (req, res) => {
  const { docenteId } = req.params; 
  const { estado, observaciones } = req.body;

  if (!estado || (estado !== 'aprobado' && estado !== 'rechazado')) {
    return res.status(400).json({ mensaje: "Estado inválido." });
  }

  try {
    // 1. Actualizar tabla de verificaciones (Lógica original)
    const sqlVerificacion = `
      UPDATE verificaciones_docente
      SET estado = ?, observaciones_admin = ?, fecha_revision = CURRENT_TIMESTAMP
      WHERE docente_id = ? AND estado = 'en_revision'
    `;
    const resultadoVerif = await query(sqlVerificacion, [estado, observaciones, docenteId]);

    if (resultadoVerif.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'No hay postulación pendiente.' });
    }

    // 2. Actualizar estado en tabla usuarios
    const nuevoEstadoUsuario = (estado === 'aprobado') ? 'verificado' : 'rechazado';
    await query("UPDATE usuarios SET estado_verificacion = ? WHERE id = ?", [nuevoEstadoUsuario, docenteId]);

    res.status(200).json({ mensaje: `Postulación ${estado} exitosamente.` });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};