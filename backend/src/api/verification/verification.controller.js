import { query } from '../../config/database.js';
import { esAdmin } from '../../middleware/role.middleware.js';
import path from 'path';

/**
 * Controlador para que un docente postule a verificación (US-06)
 */
export const postularParaVerificacion = async (req, res) => {
  const docenteId = req.usuario.id;

  // 1. Verificamos que se hayan subido los archivos
  // 'req.files' existe gracias a multer. Es un objeto.
  if (!req.files || !req.files.cv || !req.files.dni || !req.files.titulo) {
    return res.status(400).json({ mensaje: 'Faltan archivos. Se requiere CV, DNI y Título.' });
  }

  // 2. Obtenemos las rutas de los archivos guardados
  // Usamos path.relative para guardar solo la ruta relativa (ej: 'uploads/2/cv/archivo.pdf')
  // req.files.cv[0] porque es un array
  const url_cv = path.relative('uploads', req.files.cv[0].path);
  const url_dni = path.relative('uploads', req.files.dni[0].path);
  const url_titulo = path.relative('uploads', req.files.titulo[0].path);

  try {
    // 3. Verificamos si ya existe una postulación
    const [existente] = await query(
      'SELECT id FROM verificaciones_docente WHERE docente_id = ?', 
      [docenteId]
    );

    if (existente) {
      return res.status(409).json({ mensaje: 'Ya existe una postulación en revisión.' });
    }

    // 4. Insertamos la nueva postulación en la BD
    const sqlInsert = `
      INSERT INTO verificaciones_docente (docente_id, url_cv, url_dni, url_titulo, estado)
      VALUES (?, ?, ?, ?, 'en_revision')
    `;
    await query(sqlInsert, [docenteId, url_cv, url_dni, url_titulo]);

    // 5. Actualizamos el estado del docente en la tabla 'usuarios'
    const sqlUpdate = "UPDATE usuarios SET estado_verificacion = 'pendiente' WHERE id = ?";
    await query(sqlUpdate, [docenteId]);

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
    // Buscamos la postulación en la tabla 'verificaciones_docente'
    const [postulacion] = await query(
      'SELECT estado, observaciones_admin, fecha_revision FROM verificaciones_docente WHERE docente_id = ?',
      [docenteId]
    );

    // También obtenemos el estado general de la tabla 'usuarios'
    const [usuario] = await query(
      'SELECT estado_verificacion FROM usuarios WHERE id = ?',
      [docenteId]
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    // Si no hay postulación, significa que nunca ha aplicado
    if (!postulacion) {
      return res.status(200).json({
        estadoGeneral: usuario.estado_verificacion, // Será 'no_aplica'
        mensaje: 'Aún no has iniciado tu postulación.'
      });
    }

    // Si hay postulación, devolvemos los detalles
    res.status(200).json({
      estadoGeneral: usuario.estado_verificacion, // 'pendiente', 'verificado' o 'rechazado'
      estadoDetallado: postulacion.estado, // 'en_revision', 'aprobado' o 'rechazado'
      observaciones: postulacion.observaciones_admin,
      fechaRevision: postulacion.fecha_revision
    });

  } catch (error) {
    console.error('Error al obtener estado de verificación:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para que un Admin apruebe o rechace una postulación (US-05)
 */
export const revisarPostulacion = async (req, res) => {
  // El ID del docente a revisar viene en la URL
  const { docenteId } = req.params; 
  
  // Los datos de la revisión vienen en el body
  const { estado, observaciones } = req.body;

  if (!estado || (estado !== 'aprobado' && estado !== 'rechazado')) {
    return res.status(400).json({ mensaje: "El campo 'estado' es obligatorio y debe ser 'aprobado' o 'rechazado'." });
  }

  try {
    // 1. Actualizamos la tabla 'verificaciones_docente'
    const sqlVerificacion = `
      UPDATE verificaciones_docente
      SET estado = ?, observaciones_admin = ?, fecha_revision = CURRENT_TIMESTAMP
      WHERE docente_id = ? AND estado = 'en_revision'
    `;
    const resultadoVerif = await query(sqlVerificacion, [estado, observaciones, docenteId]);

    if (resultadoVerif.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'No se encontró una postulación pendiente para este docente.' });
    }

    // 2. Determinamos el nuevo estado para la tabla 'usuarios'
    const nuevoEstadoUsuario = (estado === 'aprobado') ? 'verificado' : 'rechazado';

    // 3. Actualizamos la tabla 'usuarios'
    const sqlUsuario = `
      UPDATE usuarios
      SET estado_verificacion = ?
      WHERE id = ?
    `;
    await query(sqlUsuario, [nuevoEstadoUsuario, docenteId]);

    res.status(200).json({ mensaje: `Postulación ${estado} exitosamente.` });

  } catch (error) {
    console.error('Error al revisar postulación:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};