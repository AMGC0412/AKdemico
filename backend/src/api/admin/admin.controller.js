import { query } from '../../config/database.js';

/**
 * Controlador para que un Admin obtenga las métricas clave (US-25)
 */
export const obtenerMetricasDashboard = async (req, res) => {
  try {
    // 1. Conteo de Usuarios por Rol
    const conteoUsuarios = await query(`
      SELECT r.nombre as rol, COUNT(ur.usuario_id) as total 
      FROM roles r
      LEFT JOIN usuario_roles ur ON r.id = ur.rol_id
      GROUP BY r.nombre
    `);

    // 2. Lotes activos (programados o en curso)
    const [totalLotes] = await query(`
      SELECT COUNT(*) as total FROM cursos_lotes 
      WHERE estado IN ('programado', 'en_curso')
    `);

    // 3. Inscripciones pagadas
    const [totalInscripciones] = await query(`
      SELECT COUNT(*) as total FROM inscripciones 
      WHERE estado = 'inscrito'
    `);

    // 4. Ingresos totales (Pagos validados)
    const [ingresos] = await query(`
      SELECT COALESCE(SUM(monto), 0) as total FROM pagos 
      WHERE estado = 'validado'
    `);

    // 5. Verificaciones y Reseñas pendientes
    const [conteoVerificaciones] = await query("SELECT COUNT(*) as total FROM verificaciones_docente WHERE estado = 'en_revision'");
    const [conteoResenas] = await query("SELECT COUNT(*) as total FROM resenas WHERE estado = 'reportada'");

    res.status(200).json({
      usuarios: {
        total: conteoUsuarios.reduce((acc, item) => acc + item.total, 0),
        detalle: conteoUsuarios
      },
      lotesPublicados: totalLotes?.total || 0,
      inscripcionesCompletadas: totalInscripciones?.total || 0,
      ingresosTotales: ingresos?.total || 0,
      accionesPendientes: {
        verificaciones: conteoVerificaciones?.total || 0,
        resenas: conteoResenas?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener métricas.', error: error.message });
  }
};

/**
 * Controlador para obtener TODAS las verificaciones
 */
export const obtenerTodasLasVerificaciones = async (req, res) => {
  try {
    const sql = `
      SELECT v.*, u.nombre AS docente_nombre, u.correo AS docente_correo
      FROM verificaciones_docente v
      JOIN usuarios u ON v.docente_id = u.id
      ORDER BY v.fecha_postulacion DESC
    `;
    const verificaciones = await query(sql);
    res.status(200).json(verificaciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener verificaciones.' });
  }
};

/**
 * Controlador para APROBAR una verificación de docente
 */
export const aprobarVerificacion = async (req, res) => {
  const { id } = req.params;
  const { observaciones } = req.body;
  try {
    const [verificacion] = await query("SELECT docente_id FROM verificaciones_docente WHERE id = ?", [id]);
    if (!verificacion) return res.status(404).json({ mensaje: 'No encontrada.' });

    await query("UPDATE verificaciones_docente SET estado = 'aprobado', observaciones_admin = ?, fecha_revision = NOW() WHERE id = ?", [observaciones, id]);
    await query("UPDATE usuarios SET estado_verificacion = 'verificado' WHERE id = ?", [verificacion.docente_id]);
    
    res.status(200).json({ mensaje: 'Docente aprobado.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en aprobación.' });
  }
};

/**
 * Controlador para RECHAZAR una verificación de docente
 */
export const rechazarVerificacion = async (req, res) => {
  const { id } = req.params;
  const { observaciones } = req.body;
  
  if (!observaciones) {
    return res.status(400).json({ 
      mensaje: 'Las observaciones son obligatorias para rechazar.' 
    });
  }
  
  try {
    const [verificacion] = await query(
      "SELECT docente_id FROM verificaciones_docente WHERE id = ?", 
      [id]
    );
    
    if (!verificacion) {
      return res.status(404).json({ mensaje: 'Verificación no encontrada.' });
    }
    
    const { docente_id } = verificacion;
    
    // Actualizar verificación
    await query(
      `UPDATE verificaciones_docente 
       SET estado = 'rechazado', observaciones_admin = ?, fecha_revision = NOW() 
       WHERE id = ?`,
      [observaciones, id]
    );
    
    // Actualizar estado del usuario
    await query(
      "UPDATE usuarios SET estado_verificacion = 'rechazado' WHERE id = ?",
      [docente_id]
    );
    
    res.status(200).json({ mensaje: 'Docente rechazado exitosamente.' });
    
  } catch (error) {
    console.error('Error al rechazar la verificación:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor.',
      error: error.message 
    });
  }
};

/**
 * Controlador para obtener la lista de TODOS los usuarios, con filtros
 */
export const obtenerTodosLosUsuarios = async (req, res) => {
  try {
    const { search, rol } = req.query;

    let sql = `
      SELECT 
        u.id, u.nombre, u.correo, u.estado_verificacion, u.ciudad, u.foto_url,
        GROUP_CONCAT(r.nombre) as roles_string
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
    `;
    const params = [];

    if (search) {
      sql += ' WHERE (u.nombre LIKE ? OR u.correo LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY u.id';

    if (rol) {
      sql += ' HAVING roles_string LIKE ?';
      params.push(`%${rol}%`);
    }
    
    sql += ' ORDER BY u.nombre ASC';

    const resultados = await query(sql, params);

    // Formatear la respuesta: Convertir "docente,estudiante" en ["docente", "estudiante"]
    const usuariosFormateados = resultados.map(u => ({
      ...u,
      roles: u.roles_string ? u.roles_string.split(',') : []
    }));

    res.status(200).json(usuariosFormateados);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar identidades.' });
  }
};

/**
 * Controlador para que un Admin actualice el ROL de un usuario
 */
export const actualizarRolesUsuario = async (req, res) => {
  const { id } = req.params; // ID del usuario a modificar
  const { nuevosRoles } = req.body; // Se espera un array: ['estudiante', 'docente']
  const adminId = req.usuario.id;

  // Seguridad: Evitar que un admin se quite a sí mismo el acceso total
  if (Number(id) === Number(adminId) && !nuevosRoles.includes('administrador')) {
    return res.status(403).json({ mensaje: 'No puedes revocar tu propio acceso de administrador.' });
  }

  try {
    // 1. Iniciar Transacción (Suponiendo que tu config de database soporta transacciones)
    await query("START TRANSACTION");

    // 2. Limpiar roles actuales del usuario
    await query("DELETE FROM usuario_roles WHERE usuario_id = ?", [id]);

    // 3. Insertar la nueva selección de roles
    if (nuevosRoles && nuevosRoles.length > 0) {
      const sqlInsert = `
        INSERT INTO usuario_roles (usuario_id, rol_id) 
        SELECT ?, id FROM roles WHERE nombre IN (?)
      `;
      // Pasamos el array de nombres para el IN (?)
      await query(sqlInsert, [id, nuevosRoles]);
    }

    await query("COMMIT");
    res.status(200).json({ mensaje: 'Roles sincronizados exitosamente.' });
  } catch (error) {
    await query("ROLLBACK");
    console.error("Error en actualizarRolesUsuario:", error);
    res.status(500).json({ mensaje: 'Error al sincronizar permisos.' });
  }
};

// --- [NUEVA FUNCIÓN AÑADIDA] ---
/**
 * Controlador para obtener la lista de reseñas reportadas (US-24).
 * Hacemos JOIN con usuarios para saber quién escribió y para quién fue.
 */
export const obtenerResenasReportadas = async (req, res) => {
  try {
    const sql = `
      SELECT 
        r.id, 
        r.calificacion, 
        r.comentario,
        r.fecha_creacion,
        autor.nombre AS autor_nombre,
        docente.nombre AS docente_nombre
      FROM 
        resenas r
      JOIN 
        usuarios autor ON r.estudiante_id = autor.id
      JOIN 
        usuarios docente ON r.docente_id = docente.id
      WHERE 
        r.estado = 'reportada'
      ORDER BY 
        r.fecha_creacion ASC
    `;
    const resenas = await query(sql);
    res.status(200).json(resenas);

  } catch (error) {
    console.error('Error al obtener reseñas reportadas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

// --- [NUEVA FUNCIÓN AÑADIDA] ---
/**
 * Controlador para APROBAR (restaurar) una reseña reportada.
 * Cambia el estado de 'reportada' a 'publicada'.
 */
export const aprobarResena = async (req, res) => {
  const { id } = req.params; // id de la reseña

  try {
    const sql = "UPDATE resenas SET estado = 'publicada' WHERE id = ? AND estado = 'reportada'";
    const resultado = await query(sql, [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Reseña reportada no encontrada.' });
    }

    res.status(200).json({ mensaje: 'Reseña restaurada a pública.' });

  } catch (error) {
    console.error('Error al aprobar la reseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

// --- [NUEVA FUNCIÓN AÑADIDA] ---
/**
 * Controlador para OCULTAR (confirmar reporte) una reseña.
 * Cambia el estado de 'reportada' a 'oculta'.
 */
export const ocultarResena = async (req, res) => {
  const { id } = req.params; // id de la reseña

  try {
    const sql = "UPDATE resenas SET estado = 'oculta' WHERE id = ? AND estado = 'reportada'";
    const resultado = await query(sql, [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Reseña reportada no encontrada.' });
    }

    res.status(200).json({ mensaje: 'Reseña ocultada exitosamente.' });

  } catch (error) {
    console.error('Error al ocultar la reseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};