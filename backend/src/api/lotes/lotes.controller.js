import { query, pool } from '../../config/database.js';

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 1: Crear Lote de Curso
 * (Confirmada: Requiere columna 'cupos_actuales' en BD)
 * -----------------------------------------------------------------
 */
export const crearLoteDeCurso = async (req, res) => {
    const docenteId = req.usuario.id;
    const {
        plan_id, fecha_inicio, fecha_fin,
        cupos, precio, modalidad,
        horarios
    } = req.body;

    // Validación
    if (!plan_id || !fecha_inicio || !fecha_fin || !cupos || !precio || !modalidad || !Array.isArray(horarios) || horarios.length === 0) {
        return res.status(400).json({ mensaje: 'Todos los campos, incluyendo al menos un horario, son obligatorios.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificar plan
        const [plan] = await connection.query(
            'SELECT id FROM planes_estudio WHERE id = ? AND docente_id = ?',
            [plan_id, docenteId]
        );
        if (!plan || plan.length === 0) { // Aseguramos la verificación del array
            await connection.rollback();
            return res.status(403).json({ mensaje: 'No tienes permiso para usar este plan o no existe.' });
        }

        // 2. Insertar lote (Inicializa cupos_actuales = cupos)
        const sqlLote = `
          INSERT INTO cursos_lotes 
            (docente_id, plan_id, fecha_inicio, fecha_fin, cupos, precio, modalidad, estado, cupos_actuales)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'programado', ?)
        `;
        // Los parámetros son correctos, asumiendo que 'cupos_actuales' ya existe en la BD
        const [resultadoLote] = await connection.query(sqlLote, [ 
            docenteId, plan_id, fecha_inicio, fecha_fin, cupos, precio, modalidad, cupos // cupos_actuales = cupos
        ]);

        const nuevoLoteId = resultadoLote.insertId;

        // 3. Insertar horarios (Usa transacciones de forma correcta)
        const sqlHorario = `
            INSERT INTO lote_horarios (lote_id, dia_semana, hora_inicio, hora_fin)
            VALUES ?`;
        
        const valoresHorarios = horarios.map(h => [
            nuevoLoteId,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin
        ]);

        await connection.query(sqlHorario, [valoresHorarios]);
        
        await connection.commit();

        res.status(201).json({
            mensaje: 'Lote de curso publicado exitosamente con sus horarios.',
            loteId: nuevoLoteId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al crear el lote con horarios:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 2: Buscar Lotes Públicos
 * (Corregida para no buscar 'dias_horario')
 * -----------------------------------------------------------------
 */
export const buscarLotesPublicos = async (req, res) => {
    const { modalidad, precio_max, ciudad } = req.query;
    let sqlBase = `
      SELECT 
        l.id AS lote_id, l.fecha_inicio, l.cupos, l.cupos_actuales,
        l.precio, l.modalidad, p.titulo AS plan_titulo,
        p.descripcion AS plan_descripcion, u.id AS docente_id,
        u.nombre AS docente_nombre
      FROM cursos_lotes l
      JOIN planes_estudio p ON l.plan_id = p.id
      JOIN usuarios u ON l.docente_id = u.id
      WHERE l.estado = 'programado' 
        AND u.estado_verificacion = 'verificado'
        AND l.cupos_actuales > 0
    `;
    const valores = [];
    if (modalidad) { sqlBase += ' AND l.modalidad = ?'; valores.push(modalidad); }
    // --- VALIDACIÓN CORREGIDA ---
    // Comprobar que no sea nulo, permitiendo 0
    if (precio_max != null) {
        sqlBase += ' AND l.precio <= ?';
        valores.push(precio_max);
    }
    // ----------------------------
    if (ciudad) { sqlBase += ' AND u.ciudad = ?'; valores.push(ciudad); }
    try {
        const lotes = await query(sqlBase, valores);
        res.status(200).json(lotes);
    } catch (error) {
        console.error('Error al buscar lotes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 3: Obtener Detalle de Lote
 * (Corregida para obtener horarios de la tabla 'lote_horarios')
 * -----------------------------------------------------------------
 */
export const obtenerDetalleLote = async (req, res) => {
    const { loteId } = req.params;
    try {
        const [lote] = await query(
          `SELECT 
             l.id AS lote_id, 
             l.plan_id,  /* <-- ¡¡LA LÍNEA QUE FALTABA!! */
             l.fecha_inicio, l.fecha_fin, 
             l.cupos, l.cupos_actuales,
             l.precio, l.modalidad, l.estado,
             p.titulo AS plan_titulo, p.descripcion AS plan_descripcion, p.duracion_semanas, p.frecuencia_semanal, p.objetivos AS plan_objetivos,
             u.id AS docente_id, u.nombre AS docente_nombre, u.biografia AS docente_biografia, u.foto_url AS docente_foto, u.ciudad AS docente_ciudad,
             (SELECT AVG(calificacion) FROM resenas WHERE docente_id = u.id) AS docente_calificacion_promedio 
           FROM cursos_lotes l
           INNER JOIN planes_estudio p ON l.plan_id = p.id
           INNER JOIN usuarios u ON l.docente_id = u.id
           WHERE l.id = ? AND u.estado_verificacion = 'verificado' AND (l.estado = 'programado' OR l.estado = 'en_curso')`,
          [loteId]
        );
        if (!lote) {
            return res.status(404).json({ mensaje: 'Curso (Lote) no encontrado, no disponible o el docente no está verificado.' });
        }
        const horarios = await query(
            `SELECT dia_semana, hora_inicio, hora_fin 
             FROM lote_horarios 
             WHERE lote_id = ?`,
            [loteId]
        );
        const loteCompleto = { ...lote, horarios: horarios };
        res.status(200).json(loteCompleto);
    } catch (error) {
        console.error('Error al obtener detalle del lote:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 4: Actualizar Lote de Curso (VALIDACIÓN CORREGIDA Y ROBUSTA)
 * (Recalcula cupos_actuales y NO lo espera en el body)
 * -----------------------------------------------------------------
 */
export const actualizarLote = async (req, res) => {
    const { loteId } = req.params;
    const docenteId = req.usuario.id;
    const {
        plan_id, fecha_inicio, fecha_fin,
        cupos, // Cupos Totales (editables)
        precio, modalidad,
        horarios
    } = req.body;

    // --- --------------------------------- ---
    // --- INICIO DE LA CORRECCIÓN DE LÓGICA ---
    // --- --------------------------------- ---
    
    // VALIDACIÓN ROBUSTA
    if (
        !plan_id || plan_id <= 0 || // REVISA: que no sea null, 0 o undefined
        !fecha_inicio ||             // REVISA: que no sea null o ""
        !fecha_fin ||                // REVISA: que no sea null o ""
        cupos == null || cupos <= 0 || // REVISA: que no sea null, 0 o negativo
        precio == null ||            // PERMITE 0 (gratis), pero no null
        !modalidad ||                // REVISA: que no sea null o ""
        !Array.isArray(horarios) || horarios.length === 0
    ) {
        // Log para depuración (puedes quitarlo después)
        console.log('Validación fallida. Datos recibidos:', {
            plan_id, fecha_inicio, fecha_fin, cupos, precio, modalidad, horarios_length: horarios?.length
        });
        
        return res.status(400).json({ mensaje: 'Todos los campos (plan, fechas, cupos, precio, modalidad y horarios) son obligatorios.' });
    }
    // --- ------------------------------- ---
    // --- FIN DE LA CORRECCIÓN DE LÓGICA ---
    // --- ------------------------------- ---

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificar que el lote existe y le pertenece al docente
        const [loteExistente] = await connection.query(
            'SELECT id FROM cursos_lotes WHERE id = ? AND docente_id = ? FOR UPDATE',
            [loteId, docenteId]
        );
        if (!loteExistente) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Lote no encontrado o no te pertenece.' });
        }
        
        // 2. OBTENER INSCRITOS ACTUALES
        const [conteo] = await connection.query(
            "SELECT COUNT(*) AS inscritos FROM inscripciones WHERE lote_id = ? AND estado != 'cancelado'",
            [loteId]
        );
        const inscritosActuales = conteo[0].inscritos;

        // 3. Validar nuevos cupos
        const nuevosCuposTotales = Number(cupos);
        if (nuevosCuposTotales < inscritosActuales) {
            await connection.rollback();
            return res.status(409).json({ mensaje: `No puedes reducir los cupos totales (${nuevosCuposTotales}) a menos de los estudiantes ya inscritos (${inscritosActuales}).` });
        }

        // 4. CALCULAR NUEVOS CUPOS ACTUALES
        const nuevosCuposActuales = nuevosCuposTotales - inscritosActuales;

        // 5. Actualizar la tabla 'cursos_lotes'
        await connection.query(
          `UPDATE cursos_lotes SET
             plan_id = ?, fecha_inicio = ?, fecha_fin = ?,
             cupos = ?, cupos_actuales = ?, precio = ?, modalidad = ?
           WHERE id = ?`,
          [plan_id, fecha_inicio, fecha_fin, nuevosCuposTotales, nuevosCuposActuales, precio, modalidad, loteId]
        );

        // 6. Borrar TODOS los horarios antiguos
        await connection.query('DELETE FROM lote_horarios WHERE lote_id = ?', [loteId]);

        // 7. Insertar los NUEVOS horarios
        const sqlHorario = `
            INSERT INTO lote_horarios (lote_id, dia_semana, hora_inicio, hora_fin)
            VALUES ?`;
        const valoresHorarios = horarios.map(h => [
            loteId, h.dia_semana, h.hora_inicio, h.hora_fin
        ]);
        await connection.query(sqlHorario, [valoresHorarios]);
        
        // 8. Confirmar transacción
        await connection.commit();

        res.status(200).json({ mensaje: 'Lote actualizado exitosamente.' });

    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar el lote con horarios:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 5 (NUEVA): Eliminar un Lote de Curso
 * -----------------------------------------------------------------
 */
export const eliminarLote = async (req, res) => {
    const { loteId } = req.params;
    const docenteId = req.usuario.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificar que el lote existe y le pertenece al docente
        const [loteExistente] = await connection.query(
            'SELECT id FROM cursos_lotes WHERE id = ? AND docente_id = ? FOR UPDATE',
            [loteId, docenteId]
        );
        if (!loteExistente) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Lote no encontrado o no te pertenece.' });
        }
        
        // 2. REGLA DE NEGOCIO: Verificar si hay inscripciones activas
        const [conteo] = await connection.query(
            "SELECT COUNT(*) AS inscritos FROM inscripciones WHERE lote_id = ? AND (estado = 'pendiente_pago' OR estado = 'inscrito')",
            [loteId]
        );
        const inscritosActivos = conteo[0].inscritos;

        if (inscritosActivos > 0) {
            await connection.rollback();
            return res.status(409).json({ 
                mensaje: `No se puede eliminar: Este lote ya tiene ${inscritosActivos} estudiante(s) inscrito(s) o con pago pendiente.` 
            });
        }

        // 3. Si no hay inscritos activos, proceder a eliminar.
        // Gracias a 'ON DELETE CASCADE' en la BD, al eliminar el lote,
        // se eliminarán automáticamente los 'lote_horarios' asociados.
        // También eliminaremos inscripciones 'canceladas' si las hubiera.
        
        // (Opcional pero recomendado: borrar pagos asociados a inscripciones canceladas)
        await connection.query(
            `DELETE FROM pagos WHERE inscripcion_id IN (SELECT id FROM inscripciones WHERE lote_id = ?)`,
            [loteId]
        );
        // (Opcional pero recomendado: borrar inscripciones 'canceladas')
        await connection.query(`DELETE FROM inscripciones WHERE lote_id = ?`, [loteId]);
        
        // (Borrar horarios - se borra automáticamente por ON DELETE CASCADE si lo configuraste)
        // Si no, descomenta la siguiente línea:
        // await connection.query('DELETE FROM lote_horarios WHERE lote_id = ?', [loteId]);

        // (Borrar reseñas asociadas)
        await connection.query('DELETE FROM resenas WHERE lote_id = ?', [loteId]);

        // 4. Finalmente, eliminar el lote
        await connection.query('DELETE FROM cursos_lotes WHERE id = ?', [loteId]);
        
        await connection.commit();

        res.status(200).json({ mensaje: 'Lote eliminado exitosamente (junto con sus horarios, inscripciones canceladas y reseñas).' });

    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar el lote:', error);
        // Manejar otros errores de clave foránea si olvidamos algo
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el lote.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 6 (NUEVA): Obtener Todos los Lotes por ID de Plan
 * (Resuelve el 404 en CourseDetailPage)
 * -----------------------------------------------------------------
 */
export const obtenerLotesPorPlanId = async (req, res) => {
    const { planId } = req.params;

    try {
        // Consulta para obtener la información básica de todos los lotes de ese plan
        const sqlLotes = `
            SELECT 
                l.id AS lote_id, 
                l.precio, 
                l.modalidad, 
                l.fecha_inicio
            FROM cursos_lotes l
            WHERE l.plan_id = ? 
                AND (l.estado = 'programado' OR l.estado = 'en_curso')
            ORDER BY l.fecha_inicio ASC
        `;
        
        const lotes = await query(sqlLotes, [planId]);

        if (lotes.length === 0) {
            return res.status(200).json([]);
        }

        // Mapear promesas para obtener horarios para CADA lote
        const lotesConHorarios = await Promise.all(lotes.map(async (lote) => {
            const horarios = await query(
                `SELECT dia_semana, hora_inicio, hora_fin 
                 FROM lote_horarios 
                 WHERE lote_id = ?`,
                [lote.lote_id]
            );
            return {
                ...lote,
                horarios: horarios
            };
        }));

        res.status(200).json(lotesConHorarios);

    } catch (error) {
        console.error('Error al obtener lotes por Plan ID:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener las opciones de horario.' });
    }
};