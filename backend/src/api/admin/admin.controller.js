import { query } from '../../config/database.js';

/**
 * Controlador para que un Admin obtenga las métricas clave (US-25)
 */
export const obtenerMetricasDashboard = async (req, res) => {
  try {
    // --- Consultas de Métricas Principales ---

    // 1. Conteo de Usuarios por Rol - CORREGIDO según la estructura de BD
    const conteoUsuarios = await query(`
      SELECT 
        rol, 
        COUNT(*) as total 
      FROM usuarios 
      WHERE rol IN ('estudiante', 'docente', 'administrador')
      GROUP BY rol
      ORDER BY 
        CASE rol 
          WHEN 'administrador' THEN 1
          WHEN 'docente' THEN 2
          WHEN 'estudiante' THEN 3
          ELSE 4
        END
    `);

    // 2. Total de Lotes Publicados - CORREGIDO
    const [totalLotes] = await query(`
      SELECT COUNT(*) as total 
      FROM cursos_lotes 
      WHERE estado IN ('programado', 'en_curso')
    `);

    // 3. Total de Inscripciones Pagadas - CORREGIDO
    const [totalInscripciones] = await query(`
      SELECT COUNT(*) as total 
      FROM inscripciones 
      WHERE estado = 'inscrito'
    `);

    // 4. Total de Ingresos (Pagos Validados) - CORREGIDO
    const [ingresos] = await query(`
      SELECT SUM(monto) as total 
      FROM pagos 
      WHERE estado = 'validado'
    `);

    // 5. Conteo de Verificaciones de Docentes Pendientes - CORREGIDO
    const [conteoVerificaciones] = await query(`
      SELECT COUNT(*) as total 
      FROM verificaciones_docente 
      WHERE estado = 'en_revision'
    `);

    // 6. Conteo de Reseñas Reportadas - CORREGIDO
    const [conteoResenas] = await query(`
      SELECT COUNT(*) as total 
      FROM resenas 
      WHERE estado = 'reportada'
    `);

    // --- Formateamos la respuesta ---
    const metricas = {
      // Métricas Principales
      usuarios: {
        total: conteoUsuarios.reduce((acc, item) => acc + item.total, 0),
        detalle: conteoUsuarios
      },
      lotesPublicados: totalLotes?.total || 0,
      inscripcionesCompletadas: totalInscripciones?.total || 0,
      ingresosTotales: ingresos?.total || 0,

      // Acciones Pendientes
      accionesPendientes: {
        verificaciones: conteoVerificaciones?.total || 0,
        resenas: conteoResenas?.total || 0
      }
    };

    console.log('Métricas obtenidas:', metricas); // Para debug

    res.status(200).json(metricas);

  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor.',
      error: error.message 
    });
  }
};

/**
 * Controlador para obtener TODAS las verificaciones
 */
export const obtenerTodasLasVerificaciones = async (req, res) => {
  try {
    const sql = `
      SELECT 
        v.id, 
        v.docente_id, 
        v.fecha_postulacion,
        v.fecha_revision,
        v.estado, 
        v.url_cv, 
        v.url_dni, 
        v.url_titulo,
        v.observaciones_admin,
        u.nombre AS docente_nombre,
        u.correo AS docente_correo
      FROM 
        verificaciones_docente v
      JOIN 
        usuarios u ON v.docente_id = u.id
      ORDER BY 
        v.fecha_postulacion DESC
    `;
    const verificaciones = await query(sql);
    res.status(200).json(verificaciones);

  } catch (error) {
    console.error('Error al obtener todas las verificaciones:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor.',
      error: error.message 
    });
  }
};

/**
 * Controlador para APROBAR una verificación de docente
 */
export const aprobarVerificacion = async (req, res) => {
  const { id } = req.params;
  const { observaciones } = req.body;
  
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
       SET estado = 'aprobado', observaciones_admin = ?, fecha_revision = NOW() 
       WHERE id = ?`,
      [observaciones || null, id]
    );
    
    // Actualizar estado del usuario
    await query(
      "UPDATE usuarios SET estado_verificacion = 'verificado' WHERE id = ?",
      [docente_id]
    );
    
    res.status(200).json({ mensaje: 'Docente aprobado y verificado exitosamente.' });
    
  } catch (error) {
    console.error('Error al aprobar la verificación:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor.',
      error: error.message 
    });
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
        id, 
        nombre, 
        correo, 
        rol, 
        estado_verificacion,
        ciudad,
        foto_url
      FROM usuarios
    `;
    const params = [];

    // --- Lógica de Filtros ---
    let whereAdded = false;

    // 1. Filtro de Búsqueda (nombre o correo)
    if (search) {
      sql += ' WHERE (nombre LIKE ? OR correo LIKE ?)';
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      whereAdded = true;
    }

    // 2. Filtro de Rol
    if (rol) {
      sql += whereAdded ? ' AND' : ' WHERE';
      sql += ' rol = ?';
      params.push(rol);
    }
    
    sql += ' ORDER BY nombre ASC';

    const usuarios = await query(sql, params);
    res.status(200).json(usuarios);

  } catch (error) {
    console.error('Error al obtener todos los usuarios:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor.',
      error: error.message 
    });
  }
};

/**
 * Controlador para que un Admin actualice el ROL de un usuario
 */
export const actualizarRolUsuario = async (req, res) => {
  const { id } = req.params;
  const { nuevoRol } = req.body;
  const adminId = req.usuario.id;

  // 1. Validar el nuevo rol
  if (!nuevoRol || !['estudiante', 'docente', 'administrador'].includes(nuevoRol)) {
    return res.status(400).json({ mensaje: 'El rol proporcionado no es válido.' });
  }

  // 2. Impedir que un admin se quite el rol a sí mismo
  if (Number(id) === Number(adminId) && nuevoRol !== 'administrador') {
    return res.status(403).json({ 
      mensaje: 'No puedes cambiar tu propio rol de administrador.' 
    });
  }

  try {
    // Verificamos si es una "degradación" de un docente
    if (nuevoRol !== 'docente') {
      const [usuarioActual] = await query(
        'SELECT rol FROM usuarios WHERE id = ?', 
        [id]
      );

      // Si el usuario es actualmente 'docente' y lo queremos cambiar
      if (usuarioActual && usuarioActual.rol === 'docente') {
        
        // Comprobamos si tiene cursos (lotes) asociados
        const [cursos] = await query(
          'SELECT COUNT(*) as total FROM cursos_lotes WHERE docente_id = ?', 
          [id]
        );
        
        // Comprobamos si tiene planes de estudio asociados
        const [planes] = await query(
          'SELECT COUNT(*) as total FROM planes_estudio WHERE docente_id = ?', 
          [id]
        );

        // Si tiene cursos O planes, bloqueamos la acción
        if (cursos.total > 0 || planes.total > 0) {
          return res.status(409).json({ 
            mensaje: 'Error: No se puede cambiar el rol. El docente tiene cursos o planes de estudio activos. Reasígnelos o elimínelos primero.' 
          });
        }
      }
    }

    // Si pasa todas las validaciones, actualizamos el rol
    const sql = 'UPDATE usuarios SET rol = ? WHERE id = ?';
    const resultado = await query(sql, [nuevoRol, id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    res.status(200).json({ mensaje: 'Rol del usuario actualizado exitosamente.' });

  } catch (error) {
    console.error('Error al actualizar rol de usuario:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor.',
      error: error.message 
    });
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