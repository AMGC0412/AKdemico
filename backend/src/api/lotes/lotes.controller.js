import { query, pool } from '../../config/database.js';

/**
 * -----------------------------------------------------------------
 * [CORRECCIÓN] FUNCIÓN AUXILIAR AÑADIDA
 * -----------------------------------------------------------------
 * Esta función faltaba y causaba el ReferenceError.
 * Maneja la respuesta de la DB.
 */
const getRowsFromResult = (resultado) => {
    if (Array.isArray(resultado) && resultado.length === 2 && Array.isArray(resultado[0])) {
      return resultado[0];
    }
    return resultado;
}


/**
 * -----------------------------------------------------------------
 * FUNCIÓN 1: Crear Lote de Curso
 * -----------------------------------------------------------------
 */
export const crearLoteDeCurso = async (req, res) => {
    const docenteId = req.usuario.id;
    const {
        plan_id, fecha_inicio, fecha_fin,
        cupos, precio, modalidad,
        horarios
    } = req.body;

    if (!plan_id || !fecha_inicio || !fecha_fin || !cupos || !precio || !modalidad || !Array.isArray(horarios) || horarios.length === 0) {
        return res.status(400).json({ mensaje: 'Todos los campos y horarios son obligatorios.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificar que el plan existe y pertenece al docente
        const [plan] = await connection.query(
            'SELECT id FROM planes_estudio WHERE id = ? AND docente_id = ?',
            [plan_id, docenteId]
        );

        if (!plan || plan.length === 0) {
            await connection.rollback();
            return res.status(403).json({ mensaje: 'No tienes permiso para usar este plan o no existe.' });
        }

        // 2. Insertar el Lote
        const sqlLote = `
          INSERT INTO cursos_lotes 
            (docente_id, plan_id, fecha_inicio, fecha_fin, cupos, precio, modalidad, estado, cupos_actuales)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'programado', ?)
        `;
        const [resultadoLote] = await connection.query(sqlLote, [ 
            docenteId, plan_id, fecha_inicio, fecha_fin, cupos, precio, modalidad, cupos
        ]);

        const nuevoLoteId = resultadoLote.insertId;

        // 3. Insertar Horarios
        const sqlHorario = `INSERT INTO lote_horarios (lote_id, dia_semana, hora_inicio, hora_fin) VALUES ?`;
        const valoresHorarios = horarios.map(h => [ nuevoLoteId, h.dia_semana, h.hora_inicio, h.hora_fin ]);
        
        await connection.query(sqlHorario, [valoresHorarios]);

        // --- [NUEVO] 4. CAMBIAR ESTADO DEL PLAN A 'PUBLICADO' ---
        // Esto hace que el plan sea visible en búsquedas públicas automáticamente
        await connection.query(
            "UPDATE planes_estudio SET estado = 'publicado' WHERE id = ?", 
            [plan_id]
        );
        // --------------------------------------------------------
        
        await connection.commit();

        res.status(201).json({
            mensaje: 'Lote publicado exitosamente. El Plan de Estudio ahora es visible al público.',
            loteId: nuevoLoteId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al crear el lote:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * FUNCIÓN 2: Buscar Lotes Públicos
 * [CAMBIO] Se añaden JOINs a 'usuario_roles' y 'roles' para filtrar por rol 'docente'
 */
export const buscarLotesPublicos = async (req, res) => {
    const { modalidad, precio_max, ciudad, categoriaId, nivelId, random, limit } = req.query;
    
    let sqlBase = `
      SELECT 
        p.id AS plan_id,
        p.titulo AS plan_titulo,
        p.descripcion AS plan_descripcion,
        p.imagen_url AS plan_imagen_url, 
        n.id AS plan_nivel_id,
        n.nombre AS plan_nivel_nombre,
        c.id AS plan_categoria_id,
        c.nombre AS plan_categoria_nombre,
        c.banner_default_url AS plan_banner_default,
        u.id AS docente_id,
        u.nombre AS docente_nombre,
        COUNT(l.id) AS lotes_disponibles,
        MIN(l.precio) AS precio_minimo,
        MIN(l.id) AS primer_lote_id 
      FROM planes_estudio p
      JOIN cursos_lotes l ON p.id = l.plan_id
      JOIN usuarios u ON p.docente_id = u.id
      -- --- NUEVOS JOINS PARA FILTRAR POR ROL ---
      INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
      INNER JOIN roles r ON ur.rol_id = r.id
      -- ---------------------------------------
      LEFT JOIN niveles n ON p.nivel_id = n.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 
        l.estado = 'programado' 
        AND r.nombre = 'docente' -- <--- Filtro explícito de rol
        AND u.estado_verificacion = 'verificado'
        AND l.cupos_actuales > 0
        AND p.estado = 'publicado'
    `;
    
    const valores = [];
    if (modalidad) { sqlBase += ' AND l.modalidad = ?'; valores.push(modalidad); }
    if (precio_max != null) { sqlBase += ' AND l.precio <= ?'; valores.push(Number(precio_max)); }
    if (ciudad) { sqlBase += ' AND u.ciudad = ?'; valores.push(ciudad); } 
    if (categoriaId) { sqlBase += ' AND p.categoria_id = ?'; valores.push(categoriaId); }
    if (nivelId) { sqlBase += ' AND p.nivel_id = ?'; valores.push(nivelId); }
    
    sqlBase += " GROUP BY p.id, u.id, n.id, c.id";

    if (random === 'true' || random === true) {
        sqlBase += " ORDER BY RAND()"; 
    } else {
        sqlBase += " ORDER BY p.id DESC"; 
    }

    const limitValue = parseInt(limit, 10);
    sqlBase += ` LIMIT ${!isNaN(limitValue) && limitValue > 0 ? limitValue : 12}`; 

    try {
        const result = await query(sqlBase, valores);
        const listaFinal = getRowsFromResult(result);

        const cursosFormateados = listaFinal.map(row => ({
            plan_id: row.plan_id,
            plan_titulo: row.plan_titulo,
            plan_descripcion: row.plan_descripcion,
            plan_imagen_url: row.plan_imagen_url,
            plan_nivel_nombre: row.plan_nivel_nombre,
            plan_categoria_nombre: row.plan_categoria_nombre,
            plan_banner_default: row.plan_banner_default,
            docente_nombre: row.docente_nombre,
            precio_minimo: row.precio_minimo,
            lotes_disponibles: row.lotes_disponibles,
            primer_lote_id: row.primer_lote_id
        }));

        res.status(200).json(cursosFormateados);
    } catch (error) {
        console.error('Error al buscar planes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

/**
 * FUNCIÓN 3: Obtener Detalle de Lote
 * [CAMBIO] Se valida que el usuario sea docente mediante JOIN en la subconsulta o principal
 */
export const obtenerDetalleLote = async (req, res) => {
    const { loteId } = req.params;
    try {
        const sql = `
            SELECT 
                l.id AS lote_id, l.plan_id, l.fecha_inicio, l.fecha_fin, 
                l.cupos, l.cupos_actuales, l.precio, l.modalidad, l.estado,
                p.titulo AS plan_titulo, p.descripcion AS plan_descripcion, 
                p.duracion_semanas, p.frecuencia_semanal, p.objetivos AS plan_objetivos,
                u.id AS docente_id, u.nombre AS docente_nombre, u.biografia AS docente_biografia, 
                u.foto_url AS docente_foto, u.ciudad AS docente_ciudad,
                (SELECT AVG(calificacion) FROM resenas WHERE docente_id = u.id) AS docente_calificacion_promedio 
            FROM cursos_lotes l
            INNER JOIN planes_estudio p ON l.plan_id = p.id
            INNER JOIN usuarios u ON l.docente_id = u.id
            -- VALIDACIÓN DE ROL
            INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
            INNER JOIN roles r ON ur.rol_id = r.id
            WHERE l.id = ? 
              AND r.nombre = 'docente' 
              AND u.estado_verificacion = 'verificado' 
              AND (l.estado = 'programado' OR l.estado = 'en_curso')`;

        const loteResult = await query(sql, [loteId]);
        const lote = getRowsFromResult(loteResult)[0];

        if (!lote) {
            return res.status(404).json({ mensaje: 'Curso no encontrado o docente no válido.' });
        }
        
        const horariosResult = await query(
            `SELECT dia_semana, hora_inicio, hora_fin FROM lote_horarios WHERE lote_id = ?`,
            [loteId]
        );
        
        res.status(200).json({ ...lote, horarios: getRowsFromResult(horariosResult) });
    } catch (error) {
        console.error('Error al obtener detalle:', error);
        res.status(500).json({ mensaje: 'Error interno.' });
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 4: Actualizar Lote de Curso
 * -----------------------------------------------------------------
 */
export const actualizarLote = async (req, res) => {
    // (Tu lógica de actualizarLote se mantiene igual que en tu archivo)
    const { loteId } = req.params;
    const docenteId = req.usuario.id;
    const {
        plan_id, fecha_inicio, fecha_fin,
        cupos,
        precio, modalidad,
        horarios
    } = req.body;
    
    if (
        !plan_id || plan_id <= 0 || 
        !fecha_inicio ||             
        !fecha_fin ||                
        cupos == null || cupos <= 0 || 
        precio == null ||            
        !modalidad ||                
        !Array.isArray(horarios) || horarios.length === 0
    ) {
        console.log('Validación fallida. Datos recibidos:', {
            plan_id, fecha_inicio, fecha_fin, cupos, precio, modalidad, horarios_length: horarios?.length
        });
        return res.status(400).json({ mensaje: 'Todos los campos (plan, fechas, cupos, precio, modalidad y horarios) son obligatorios.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [loteExistente] = await connection.query(
            'SELECT id FROM cursos_lotes WHERE id = ? AND docente_id = ? FOR UPDATE',
            [loteId, docenteId]
        );
        if (!loteExistente.length) { // Corregido: chequear length
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Lote no encontrado o no te pertenece.' });
        }
        
        const [conteo] = await connection.query(
            "SELECT COUNT(*) AS inscritos FROM inscripciones WHERE lote_id = ? AND estado != 'cancelado'",
            [loteId]
        );
        const inscritosActuales = conteo[0].inscritos;

        const nuevosCuposTotales = Number(cupos);
        if (nuevosCuposTotales < inscritosActuales) {
            await connection.rollback();
            return res.status(409).json({ mensaje: `No puedes reducir los cupos totales (${nuevosCuposTotales}) a menos de los estudiantes ya inscritos (${inscritosActuales}).` });
        }

        const nuevosCuposActuales = nuevosCuposTotales - inscritosActuales;

        await connection.query(
          `UPDATE cursos_lotes SET
             plan_id = ?, fecha_inicio = ?, fecha_fin = ?,
             cupos = ?, cupos_actuales = ?, precio = ?, modalidad = ?
           WHERE id = ?`,
          [plan_id, fecha_inicio, fecha_fin, nuevosCuposTotales, nuevosCuposActuales, precio, modalidad, loteId]
        );

        await connection.query('DELETE FROM lote_horarios WHERE lote_id = ?', [loteId]);

        const sqlHorario = `
            INSERT INTO lote_horarios (lote_id, dia_semana, hora_inicio, hora_fin)
            VALUES ?`;
        const valoresHorarios = horarios.map(h => [
            loteId, h.dia_semana, h.hora_inicio, h.hora_fin
        ]);
        await connection.query(sqlHorario, [valoresHorarios]);
        
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
    // (Tu lógica de eliminarLote se mantiene igual que en tu archivo)
    const { loteId } = req.params;
    const docenteId = req.usuario.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [loteExistente] = await connection.query(
            'SELECT id FROM cursos_lotes WHERE id = ? AND docente_id = ? FOR UPDATE',
            [loteId, docenteId]
        );
        if (!loteExistente.length) { // Corregido: chequear length
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Lote no encontrado o no te pertenece.' });
        }
        
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
        
        await connection.query(
            `DELETE FROM pagos WHERE inscripcion_id IN (SELECT id FROM inscripciones WHERE lote_id = ?)`,
            [loteId]
        );
        await connection.query(`DELETE FROM inscripciones WHERE lote_id = ?`, [loteId]);
        
        // (Asumimos ON DELETE CASCADE para lote_horarios)
        
        await connection.query('DELETE FROM resenas WHERE lote_id = ?', [loteId]);

        await connection.query('DELETE FROM cursos_lotes WHERE id = ?', [loteId]);
        
        await connection.commit();

        res.status(200).json({ mensaje: 'Lote eliminado exitosamente (junto con sus horarios, inscripciones canceladas y reseñas).' });

    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar el lote:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el lote.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 6: Obtener Todos los Lotes por ID de Plan
 * [MEJORADO] Ahora también devuelve la 'fecha_fin' para la lógica de estado
 * -----------------------------------------------------------------
 */
export const obtenerLotesPorPlanId = async (req, res) => {
    const { planId } = req.params;

    try {
        // [MEJORA] Añadimos 'l.fecha_fin' a la consulta
        const sqlLotes = `
            SELECT 
                l.id AS lote_id, 
                l.precio, 
                l.modalidad, 
                l.fecha_inicio,
                l.fecha_fin  -- <-- ¡LA LÍNEA QUE FALTABA!
            FROM cursos_lotes l
            WHERE l.plan_id = ? 
                -- [MEJORA] Permitimos ver lotes finalizados en la lista
                AND (l.estado = 'programado' OR l.estado = 'en_curso' OR l.estado = 'finalizado')
            ORDER BY l.fecha_inicio ASC
        `;
        
        const lotesResult = await query(sqlLotes, [planId]);
        const lotes = getRowsFromResult(lotesResult);

        if (lotes.length === 0) {
            return res.status(200).json([]);
        }

        const lotesConHorarios = await Promise.all(lotes.map(async (lote) => {
            const horariosResult = await query(
                `SELECT dia_semana, hora_inicio, hora_fin 
                 FROM lote_horarios 
                 WHERE lote_id = ?`,
                [lote.lote_id]
            );
            return {
                ...lote,
                horarios: getRowsFromResult(horariosResult)
            };
        }));

        res.status(200).json(lotesConHorarios);

    } catch (error) {
        console.error('Error al obtener lotes por Plan ID:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener las opciones de horario.' });
    }
};