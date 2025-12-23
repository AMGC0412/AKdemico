import { query } from '../../config/database.js';

/**
 * Controlador para obtener el perfil público de un docente,
 * incluyendo su disponibilidad semanal.
 */
export const obtenerPerfilPublicoDocente = async (req, res) => {
  // Obtenemos el ID del docente de los parámetros de la URL
  const { id } = req.params;

  try {
    // 1. Buscamos la información pública del docente - AJUSTADO A NUEVA BD
    const [docente] = await query(
      `SELECT 
        u.id, u.nombre, u.biografia, u.foto_url, u.ciudad, u.estado_verificacion 
       FROM usuarios u
       INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
       INNER JOIN roles r ON ur.rol_id = r.id
       WHERE u.id = ? AND r.nombre = 'docente'`,
      [id]
    );

    if (!docente) {
      return res.status(404).json({ mensaje: 'Docente no encontrado o no es un docente.' });
    }

    // Por seguridad, no mostramos perfiles de docentes que no estén verificados
    if (docente.estado_verificacion !== 'verificado') {
      return res.status(403).json({ mensaje: 'Este docente aún no ha sido verificado.' });
    }

    // 2. Buscamos la disponibilidad semanal de ese docente
    const disponibilidad = await query(
      'SELECT dia_semana, hora_inicio, hora_fin FROM disponibilidad_docente WHERE docente_id = ?',
      [id]
    );

    // 3. Combinamos todo en una sola respuesta
    const perfilCompleto = {
      perfil: docente,
      horario: disponibilidad
    };

    res.status(200).json(perfilCompleto);

  } catch (error) {
    console.error('Error al obtener perfil público de docente:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};