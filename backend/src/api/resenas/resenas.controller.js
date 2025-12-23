import { query } from '../../config/database.js';

/**
 * US-23: Un estudiante publica una reseña sobre un curso/lote específico.
 */
export const crearReseña = async (req, res) => {
  const estudianteId = req.usuario.id;
  const { loteId } = req.params;
  const { calificacion, comentario } = req.body;

  // Validación de entrada
  if (!calificacion || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ mensaje: 'La calificación debe estar entre 1 y 5.' });
  }

  try {
    // 1. Verificar inscripción activa del estudiante
    const [inscripcion] = await query(
      `SELECT id FROM inscripciones 
       WHERE estudiante_id = ? AND lote_id = ? AND estado = 'inscrito'`,
      [estudianteId, loteId]
    );

    if (!inscripcion) {
      return res.status(403).json({ 
        mensaje: 'No puedes reseñar un curso en el que no estás inscrito formalmente.' 
      });
    }

    // 2. Obtener el ID del docente asociado al lote
    const [lote] = await query(
      'SELECT docente_id FROM cursos_lotes WHERE id = ?',
      [loteId]
    );

    if (!lote) {
      return res.status(404).json({ mensaje: 'El curso o lote no existe.' });
    }

    // 3. Insertar reseña (estado inicial 'publicada')
    const sqlInsert = `
      INSERT INTO resenas (estudiante_id, docente_id, lote_id, calificacion, comentario, estado)
      VALUES (?, ?, ?, ?, ?, 'publicada')
    `;
    
    await query(sqlInsert, [estudianteId, lote.docente_id, loteId, calificacion, comentario]);

    res.status(201).json({ mensaje: 'Reseña publicada con éxito.' });

  } catch (error) {
    // Manejo de duplicados (Un estudiante -> Una reseña por lote)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'Ya has calificado este curso anteriormente.' });
    }
    console.error('Error al crear reseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * US-24: Reportar una reseña existente para moderación.
 */
export const reportarReseña = async (req, res) => {
  const { reseñaId } = req.params;

  try {
    const [reseña] = await query('SELECT estado FROM resenas WHERE id = ?', [reseñaId]);

    if (!reseña) return res.status(404).json({ mensaje: 'Reseña no encontrada.' });
    
    if (reseña.estado === 'reportada') return res.status(409).json({ mensaje: 'Ya está en revisión.' });
    if (reseña.estado === 'oculta') return res.status(409).json({ mensaje: 'La reseña ya ha sido retirada.' });

    // Cambiar estado a reportada
    await query("UPDATE resenas SET estado = 'reportada' WHERE id = ?", [reseñaId]);

    res.status(200).json({ mensaje: 'Reseña reportada correctamente para revisión administrativa.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al procesar el reporte.' });
  }
};

/**
 * US-24 (ADMIN): Ver reseñas reportadas con nombres de usuarios.
 */
export const obtenerReseñasReportadas = async (req, res) => {
  try {
    // JOIN con la tabla usuarios para obtener nombres reales
    const sql = `
      SELECT 
        r.id, r.calificacion, r.comentario, r.fecha_creacion,
        est.nombre AS estudiante_nombre,
        doc.nombre AS docente_nombre
      FROM resenas r
      JOIN usuarios est ON r.estudiante_id = est.id
      JOIN usuarios doc ON r.docente_id = doc.id
      WHERE r.estado = 'reportada'
      ORDER BY r.fecha_creacion DESC
    `;
    const reseñas = await query(sql);
    res.status(200).json(reseñas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener lista de reportes.' });
  }
};

/**
 * US-24 (ADMIN): Moderar reseña (Aprobar/Restaurar u Ocultar).
 */
export const moderarReseña = async (req, res) => {
  const { reseñaId } = req.params;
  const { accion } = req.body; // 'ocultar' o 'restaurar'

  if (!['ocultar', 'restaurar'].includes(accion)) {
    return res.status(400).json({ mensaje: "Acción no válida. Use 'ocultar' o 'restaurar'." });
  }

  try {
    const nuevoEstado = (accion === 'ocultar') ? 'oculta' : 'publicada';
    
    const resultado = await query(
      "UPDATE resenas SET estado = ? WHERE id = ? AND estado = 'reportada'",
      [nuevoEstado, reseñaId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Reseña no encontrada o no está pendiente de moderación.' });
    }

    res.status(200).json({ mensaje: `Acción realizada: La reseña ahora está ${nuevoEstado}.` });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al moderar la reseña.' });
  }
};