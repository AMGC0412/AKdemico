import { query, pool } from '../../config/database.js'; // Importamos 'pool' para transacciones

/**
 * Controlador para que un docente defina o actualice su
 * disponibilidad semanal completa (US-09).
 */
export const actualizarDisponibilidadSemanal = async (req, res) => {
  const docenteId = req.usuario.id;
  
  // Esperamos un array de bloques de horario en el body.
  // Ej: [ { dia_semana: 1, hora_inicio: '09:00', hora_fin: '11:00' }, ... ]
  const bloques = req.body.bloques;

  if (!Array.isArray(bloques)) {
    return res.status(400).json({ mensaje: 'Se requiere un array de "bloques" en el body.' });
  }

  // Iniciamos una transacción para asegurar que todo o nada se ejecute
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Borramos TODA la disponibilidad anterior de este docente
    await connection.query(
      'DELETE FROM disponibilidad_docente WHERE docente_id = ?', 
      [docenteId]
    );

    // 2. Si el array está vacío, solo queríamos borrar (limpiar horario)
    if (bloques.length === 0) {
      await connection.commit();
      return res.status(200).json({ mensaje: 'Disponibilidad eliminada exitosamente.' });
    }

    // 3. Insertamos los nuevos bloques de disponibilidad
    const sqlInsert = `
      INSERT INTO disponibilidad_docente (docente_id, dia_semana, hora_inicio, hora_fin)
      VALUES ?
    `;

    // Mapeamos el array de objetos a un array de arrays para la inserción múltiple
    const valoresAInsertar = bloques.map(bloque => [
      docenteId,
      bloque.dia_semana, // Ej: 1 (Lunes)
      bloque.hora_inicio, // Ej: '09:00:00'
      bloque.hora_fin    // Ej: '11:00:00'
    ]);

    await connection.query(sqlInsert, [valoresAInsertar]);

    // 4. Confirmamos la transacción
    await connection.commit();

    res.status(200).json({ mensaje: 'Disponibilidad semanal actualizada exitosamente.' });

  } catch (error) {
    // Si algo falla, revertimos todos los cambios
    await connection.rollback();
    console.error('Error al actualizar disponibilidad:', error);
    
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ mensaje: 'Formato de hora inválido. Use HH:MM:SS.' });
    }
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
        return res.status(400).json({ mensaje: 'Valor inválido para dia_semana (debe ser un número 0-6).' });
    }
    
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  } finally {
    // Siempre liberamos la conexión al pool
    connection.release();
  }
};

/**
 * Controlador para obtener la disponibilidad semanal actual del docente.
 * (Función FALTANTE)
 */
export const obtenerDisponibilidad = async (req, res) => {
    const docenteId = req.usuario.id;

    try {
        const disponibilidad = await query(
            // Seleccionamos los campos necesarios
            `SELECT dia_semana, hora_inicio, hora_fin FROM disponibilidad_docente 
             WHERE docente_id = ? 
             ORDER BY dia_semana, hora_inicio`,
            [docenteId]
        );
        
        if (disponibilidad.length === 0) {
            // Si no hay nada, devolvemos 200 con array vacío, o 404 (usaremos 200 con array vacío)
            return res.status(200).json([]);
        }

        res.status(200).json(disponibilidad);
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};