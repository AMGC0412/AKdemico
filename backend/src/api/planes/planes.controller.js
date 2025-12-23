import { query } from '../../config/database.js';

/**
 * Controlador para que un docente cree un nuevo Plan de Estudio (US-12)
 */
export const crearPlanDeEstudio = async (req, res) => {
  const docenteId = req.usuario.id; 
  const { titulo, descripcion, objetivos, categoria_id, nivel_id, imagen_url, estado } = req.body;

  const duracion_semanas = req.body.duracion_semanas || null;
  const frecuencia_semanal = req.body.frecuencia_semanal || null;

  if (!titulo || !descripcion || !objetivos) {
    return res.status(400).json({ mensaje: 'Título, descripción y objetivos son obligatorios.' });
  }

  try {
    const sql = `
      INSERT INTO planes_estudio 
        (docente_id, titulo, descripcion, duracion_semanas, frecuencia_semanal, objetivos, categoria_id, nivel_id, imagen_url, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const resultado = await query(sql, [
      docenteId,
      titulo,
      descripcion,
      duracion_semanas,
      frecuencia_semanal,
      objetivos,
      Number(categoria_id) || null,
      Number(nivel_id) || null,
      imagen_url || null,
      estado || 'borrador'
    ]);

    res.status(201).json({ 
      mensaje: 'Plan de estudio creado exitosamente.',
      planId: resultado.insertId 
    });

  } catch (error) {
    console.error('Error al crear plan de estudio:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para obtener TODOS los planes + Lotes + HORARIOS
 * (Crítico para que funcione el Calendario)
 */
export const obtenerMisPlanesConLotes = async (req, res) => {
    const docenteId = req.usuario.id;

    try {
        // 1. Obtener PLANES filtrando por el rol 'docente'
        const sqlPlanes = `
            SELECT p.* FROM planes_estudio p
            INNER JOIN usuarios u ON p.docente_id = u.id
            INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
            INNER JOIN roles r ON ur.rol_id = r.id
            WHERE p.docente_id = ? AND r.nombre = 'docente'
            ORDER BY p.id DESC
        `;
        const planes = await query(sqlPlanes, [docenteId]);

        // 2. Obtener LOTES filtrando por el rol 'docente'
        const sqlLotes = `
            SELECT 
                l.id, l.plan_id, l.fecha_inicio, l.fecha_fin, l.cupos, l.precio, l.modalidad, l.estado, l.cupos_actuales 
            FROM cursos_lotes l
            INNER JOIN usuarios u ON l.docente_id = u.id
            INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
            INNER JOIN roles r ON ur.rol_id = r.id
            WHERE l.docente_id = ? AND r.nombre = 'docente'
            ORDER BY l.fecha_inicio DESC
        `;
        const lotes = await query(sqlLotes, [docenteId]);

        // 3. Obtener HORARIOS (Mantenemos tu lógica de placeholders original)
        let horarios = [];
        if (lotes.length > 0) {
            const loteIds = lotes.map(l => l.id);
            const placeholders = loteIds.map(() => '?').join(',');
            horarios = await query(
                `SELECT * FROM lote_horarios WHERE lote_id IN (${placeholders})`,
                loteIds
            );
        }

        // 4. Anidar Horarios dentro de Lotes (Lógica original intacta)
        const lotesConHorarios = lotes.map(lote => ({
            ...lote,
            horarios: horarios.filter(h => h.lote_id === lote.id)
        }));

        // 5. Agrupar lotes por plan_id (Lógica original intacta)
        const lotesPorPlan = lotesConHorarios.reduce((acc, lote) => {
            const planId = lote.plan_id;
            if (!acc[planId]) acc[planId] = [];
            acc[planId].push(lote);
            return acc;
        }, {});

        // 6. Combinar (Lógica original intacta)
        const planesConLotes = planes.map(plan => ({
            ...plan,
            lotes: lotesPorPlan[plan.id] || []
        }));

        res.status(200).json(planesConLotes);

    } catch (error) {
        console.error('Error al obtener mis planes con lotes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

/**
 * Obtener un Plan de Estudio específico por ID
 */
export const obtenerPlanPorId = async (req, res) => {
    const { planId } = req.params;
    const docenteId = req.usuario.id;

    try {
        const sql = `
            SELECT p.* FROM planes_estudio p
            INNER JOIN usuarios u ON p.docente_id = u.id
            INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
            INNER JOIN roles r ON ur.rol_id = r.id
            WHERE p.id = ? AND p.docente_id = ? AND r.nombre = 'docente'
        `;
        const [plan] = await query(sql, [planId, docenteId]);

        if (!plan) {
            return res.status(404).json({ mensaje: 'Plan de estudio no encontrado o no autorizado.' });
        }
        
        res.status(200).json(plan);

    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

/**
 * Actualizar un Plan de Estudio (ROBUSTO)
 */
export const actualizarPlan = async (req, res) => {
    const { planId } = req.params;
    const docenteId = req.usuario.id;
    
    const { 
        titulo, descripcion, objetivos, 
        duracion_semanas, frecuencia_semanal, 
        estado, categoria_id, nivel_id, imagen_url 
    } = req.body;

    if (!titulo || !descripcion || !objetivos) {
        return res.status(400).json({ mensaje: 'Título, descripción y objetivos son obligatorios.' });
    }

    try {
        // En el UPDATE, el WHERE garantiza que solo el dueño (docente) pueda modificarlo
        const sql = `
            UPDATE planes_estudio SET
                titulo = ?, descripcion = ?, objetivos = ?,
                duracion_semanas = ?, frecuencia_semanal = ?,
                estado = ?, categoria_id = ?, nivel_id = ?, imagen_url = ?
             WHERE id = ? AND docente_id = ?
        `;

        const resultado = await query(sql, [
            titulo, descripcion, objetivos, 
            Number(duracion_semanas) || null, 
            Number(frecuencia_semanal) || null, 
            estado || 'borrador', 
            Number(categoria_id) || null, 
            Number(nivel_id) || null, 
            imagen_url || null,
            planId, docenteId
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Plan no encontrado o no autorizado.' });
        }

        res.status(200).json({ mensaje: 'Plan actualizado exitosamente.' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};