import { query } from '../../config/database.js';

/**
 * Controlador para que un docente cree un nuevo Plan de Estudio (US-12)
 */
export const crearPlanDeEstudio = async (req, res) => {
  const docenteId = req.usuario.id; // Obtenido del token

  // Campos del plan (US-12)
  const { titulo, descripcion, objetivos } = req.body;

  // --- INICIO DE LA CORRECCIÓN ---
  // Obtenemos los campos opcionales. Si no vienen, los convertimos en 'null'.
  const duracion_semanas = req.body.duracion_semanas || null;
  const frecuencia_semanal = req.body.frecuencia_semanal || null;
  // --- FIN DE LA CORRECCIÓN ---

  if (!titulo || !descripcion || !objetivos) {
    return res.status(400).json({ mensaje: 'Título, descripción y objetivos son obligatorios.' });
  }

  try {
    const sql = `
      INSERT INTO planes_estudio 
        (docente_id, titulo, descripcion, duracion_semanas, frecuencia_semanal, objetivos, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'borrador')
    `;
    
    // Ahora, 'duracion_semanas' y 'frecuencia_semanal' serán 'null' en lugar de 'undefined'
    const resultado = await query(sql, [
      docenteId,
      titulo,
      descripcion,
      duracion_semanas,
      frecuencia_semanal,
      objetivos
    ]);

    res.status(201).json({ 
      mensaje: 'Plan de estudio creado como borrador.',
      planId: resultado.insertId 
    });

  } catch (error) {
    console.error('Error al crear plan de estudio:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para que un docente obtenga TODOS sus planes de estudio
 * Y los lotes (cursos) asociados a cada plan.
 */
export const obtenerMisPlanesConLotes = async (req, res) => {
    const docenteId = req.usuario.id;

    try {
        // 1. Obtener todos los planes del docente
        const planes = await query(
            'SELECT * FROM planes_estudio WHERE docente_id = ? ORDER BY id DESC', 
            [docenteId]
        );

        // 2. Obtener todos los lotes del docente
        // (Asegúrate de seleccionar 'cupos_actuales' si ya lo implementaste)
        const lotes = await query(
            'SELECT * FROM cursos_lotes WHERE docente_id = ? ORDER BY fecha_inicio DESC', 
            [docenteId]
        );

        // 3. Agrupar lotes por plan_id (para anidarlos)
        const lotesPorPlan = lotes.reduce((acc, lote) => {
            const planId = lote.plan_id;
            if (!acc[planId]) {
                acc[planId] = [];
            }
            acc[planId].push(lote);
            return acc;
        }, {});

        // 4. Combinar planes con sus lotes
        const planesConLotes = planes.map(plan => ({
            ...plan,
            lotes: lotesPorPlan[plan.id] || [] // Asignar array de lotes (o vacío)
        }));

        res.status(200).json(planesConLotes);

    } catch (error) {
        console.error('Error al obtener mis planes con lotes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN NUEVA: Obtener un Plan de Estudio específico por ID
 * -----------------------------------------------------------------
 */
export const obtenerPlanPorId = async (req, res) => {
    const { planId } = req.params;
    const docenteId = req.usuario.id;

    try {
        // Buscamos el plan Y nos aseguramos de que le pertenezca al docente
        const [plan] = await query(
            'SELECT * FROM planes_estudio WHERE id = ? AND docente_id = ?',
            [planId, docenteId]
        );

        if (!plan) {
            return res.status(404).json({ mensaje: 'Plan de estudio no encontrado o no te pertenece.' });
        }
        
        res.status(200).json(plan); // Devuelve el objeto del plan

    } catch (error) {
        console.error('Error al obtener plan por ID:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN NUEVA: Actualizar un Plan de Estudio
 * -----------------------------------------------------------------
 */
export const actualizarPlan = async (req, res) => {
    const { planId } = req.params;
    const docenteId = req.usuario.id;
    const { titulo, descripcion, objetivos, duracion_semanas, frecuencia_semanal } = req.body;

    if (!titulo || !descripcion || !objetivos) {
        return res.status(400).json({ mensaje: 'Título, descripción y objetivos son obligatorios.' });
    }

    try {
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // Se quitaron los corchetes [ ] alrededor de 'resultado'
        const resultado = await query(
            `UPDATE planes_estudio SET
                titulo = ?,
                descripcion = ?,
                objetivos = ?,
                duracion_semanas = ?,
                frecuencia_semanal = ?
             WHERE id = ? AND docente_id = ?`,
            [titulo, descripcion, objetivos, Number(duracion_semanas) || null, Number(frecuencia_semanal) || null, planId, docenteId]
        );
        // ---------------------------------

        // Ahora 'resultado' es el objeto OkPacket (ej. { affectedRows: 1 })
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Plan no encontrado, no te pertenece, o no se realizaron cambios.' });
        }

        res.status(200).json({ mensaje: 'Plan actualizado exitosamente.' });

    } catch (error) {
        // El error 'TypeError: (intermediate value) is not iterable'
        // debería desaparecer, pero dejamos el catch para otros errores.
        console.error('Error al actualizar plan:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};