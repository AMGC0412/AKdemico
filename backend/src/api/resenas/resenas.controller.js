import { query } from '../../config/database.js';

/**
 * Controlador para que un estudiante publique una reseña (US-23).
 */
export const crearReseña = async (req, res) => {
  const estudianteId = req.usuario.id;
  const { loteId } = req.params; // El ID del curso que está reseñando
  const { calificacion, comentario } = req.body;

  if (!calificacion || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ mensaje: 'La calificación es obligatoria y debe ser un número entre 1 y 5.' });
  }

  try {
    // 1. Verificar que el estudiante SÍ tomó este curso y que está 'inscrito'
    const [inscripcion] = await query(
      `SELECT * FROM inscripciones 
       WHERE estudiante_id = ? AND lote_id = ? AND estado = 'inscrito'`,
      [estudianteId, loteId]
    );

    if (!inscripcion) {
      return res.status(403).json({ mensaje: 'No puedes dejar una reseña de un curso al que no estás inscrito.' });
    }

    // 2. Obtener el ID del docente de ese lote
    const [lote] = await query(
      'SELECT docente_id FROM cursos_lotes WHERE id = ?',
      [loteId]
    );

    if (!lote) {
      return res.status(404).json({ mensaje: 'El lote del curso no fue encontrado.' });
    }

    // 3. Insertar la reseña
    const sqlInsert = `
      INSERT INTO resenas (estudiante_id, docente_id, lote_id, calificacion, comentario, estado)
      VALUES (?, ?, ?, ?, ?, 'publicada')
    `;
    
    await query(sqlInsert, [
      estudianteId,
      lote.docente_id, // El ID del docente al que se reseña
      loteId,
      calificacion,
      comentario
    ]);

    res.status(201).json({ mensaje: 'Reseña publicada exitosamente.' });

  } catch (error) {
     // Manejar error si el estudiante intenta reseñar el mismo curso dos veces
    if (error.code === 'ER_DUP_ENTRY') {
       // (Tendríamos que añadir una UNIQUE KEY a la tabla resenas en 'estudiante_id' y 'lote_id' para esto)
      return res.status(409).json({ mensaje: 'Ya has dejado una reseña para este curso.' });
    }
    console.error('Error al crear reseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para que un usuario reporte una reseña (US-24).
 */
export const reportarReseña = async (req, res) => {
  // El ID de la reseña a reportar viene de la URL
  const { reseñaId } = req.params;

  try {
    // 1. Buscamos la reseña
    const [reseña] = await query(
      'SELECT id, estado FROM resenas WHERE id = ?',
      [reseñaId]
    );

    if (!reseña) {
      return res.status(404).json({ mensaje: 'Reseña no encontrada.' });
    }

    // 2. Verificamos si ya está reportada o retirada
    if (reseña.estado === 'reportada') {
      return res.status(409).json({ mensaje: 'Esta reseña ya ha sido reportada.' });
    }
    if (reseña.estado === 'oculta') {
      return res.status(409).json({ mensaje: 'Esta reseña ya no está visible.' });
    }

    // 3. Actualizamos el estado de la reseña a 'reportada'
    await query(
      "UPDATE resenas SET estado = 'reportada' WHERE id = ?",
      [reseñaId]
    );

    res.status(200).json({ mensaje: 'Reseña reportada. Pasará a revisión por un administrador.' });

  } catch (error) {
    console.error('Error al reportar reseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para que un ADMIN vea todas las reseñas reportadas (US-24).
 */
export const obtenerReseñasReportadas = async (req, res) => {
  try {
    const reseñas = await query(
      "SELECT * FROM resenas WHERE estado = 'reportada'"
    );
    res.status(200).json(reseñas);
  } catch (error) {
    console.error('Error al obtener reseñas reportadas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};


/**
 * Controlador para que un ADMIN modere una reseña (US-24).
 */
export const moderarReseña = async (req, res) => {
  const { reseñaId } = req.params;
  const { accion } = req.body; // 'ocultar' o 'restaurar'

  if (!accion || (accion !== 'ocultar' && accion !== 'restaurar')) {
    return res.status(400).json({ mensaje: "La 'accion' es obligatoria y debe ser 'ocultar' o 'restaurar'." });
  }

  try {
    const [reseña] = await query(
      'SELECT id, estado FROM resenas WHERE id = ?',
      [reseñaId]
    );

    if (!reseña) {
      return res.status(404).json({ mensaje: 'Reseña no encontrada.' });
    }

    if (reseña.estado !== 'reportada') {
      return res.status(409).json({ mensaje: 'Esta reseña no está pendiente de moderación.' });
    }

    // El nuevo estado será 'oculta' o volverá a ser 'publicada'
    const nuevoEstado = accion === 'ocultar' ? 'oculta' : 'publicada';

    await query(
      "UPDATE resenas SET estado = ? WHERE id = ?",
      [nuevoEstado, reseñaId]
    );

    res.status(200).json({ mensaje: `La reseña ha sido ${nuevoEstado}.` });

  } catch (error) {
    console.error('Error al moderar reseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};