import { query, pool } from '../../config/database.js';

/**
 * Controlador para que un docente defina o actualice su
 * disponibilidad semanal completa (US-09).
 * Mantenemos la transacción íntegra y el manejo de errores.
 */
export const actualizarDisponibilidadSemanal = async (req, res) => {
  const docenteId = req.usuario.id;
  const bloques = req.body.bloques;

  if (!Array.isArray(bloques)) {
    return res.status(400).json({ mensaje: 'Se requiere un array de "bloques" en el body.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verificación de Rol: Aseguramos que el usuario es un 'docente' en la nueva BD
    const [rolCheck] = await connection.query(
      `SELECT u.id FROM usuarios u
       INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
       INNER JOIN roles r ON ur.rol_id = r.id
       WHERE u.id = ? AND r.nombre = 'docente'`,
      [docenteId]
    );

    if (rolCheck.length === 0) {
      await connection.rollback();
      return res.status(403).json({ mensaje: 'No tienes permisos de docente para esta acción.' });
    }

    // 2. Borramos TODA la disponibilidad anterior de este docente
    await connection.query(
      'DELETE FROM disponibilidad_docente WHERE docente_id = ?', 
      [docenteId]
    );

    if (bloques.length === 0) {
      await connection.commit();
      return res.status(200).json({ mensaje: 'Disponibilidad eliminada exitosamente.' });
    }

    // 3. Insertamos los nuevos bloques (Inserción múltiple original)
    const sqlInsert = `
      INSERT INTO disponibilidad_docente (docente_id, dia_semana, hora_inicio, hora_fin)
      VALUES ?
    `;

    const valoresAInsertar = bloques.map(bloque => [
      docenteId,
      bloque.dia_semana, 
      bloque.hora_inicio, 
      bloque.hora_fin    
    ]);

    await connection.query(sqlInsert, [valoresAInsertar]);

    await connection.commit();
    res.status(200).json({ mensaje: 'Disponibilidad semanal actualizada exitosamente.' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al actualizar disponibilidad:', error);
    
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ mensaje: 'Formato de hora inválido. Use HH:MM:SS.' });
    }
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
        return res.status(400).json({ mensaje: 'Valor inválido para dia_semana (debe ser un número 0-6).' });
    }
    
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Controlador para obtener la disponibilidad semanal actual del docente.
 * Validando el rol de docente en la consulta.
 */
export const obtenerDisponibilidad = async (req, res) => {
    const docenteId = req.usuario.id;

    try {
        const sql = `
            SELECT dd.dia_semana, dd.hora_inicio, dd.hora_fin 
            FROM disponibilidad_docente dd
            INNER JOIN usuarios u ON dd.docente_id = u.id
            INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
            INNER JOIN roles r ON ur.rol_id = r.id
            WHERE dd.docente_id = ? AND r.nombre = 'docente'
            ORDER BY dd.dia_semana, dd.hora_inicio
        `;
        
        const disponibilidad = await query(sql, [docenteId]);
        
        // Devolvemos 200 con array vacío si no hay registros, tal como pediste
        res.status(200).json(disponibilidad || []);
        
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};