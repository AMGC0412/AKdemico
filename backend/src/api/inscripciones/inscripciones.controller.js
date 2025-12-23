import { query, pool } from '../../config/database.js';

/**
 * Controlador para que un estudiante se inscriba a un lote.
 */
export const inscribirseALote = async (req, res) => {
    const estudianteId = req.usuario.id;
    const { loteId } = req.params;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificamos que el lote exista y bloqueamos la fila
        const [lote] = await connection.query(
            'SELECT cupos FROM cursos_lotes WHERE id = ? AND estado = "programado" FOR UPDATE',
            [loteId]
        );

        if (!lote || lote.length === 0) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'El lote no existe o ya no está disponible.' });
        }

        const loteData = lote[0];

        // 2. Contamos inscritos actuales
        const [conteo] = await connection.query(
            "SELECT COUNT(*) AS inscritos FROM inscripciones WHERE lote_id = ? AND estado != 'cancelado'",
            [loteId]
        );

        // 3. Verificamos cupos
        if (conteo[0].inscritos >= loteData.cupos) {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'Lo sentimos, ya no hay cupos disponibles.' });
        }

        // 4. Inscribimos al estudiante
        const sqlInsert = `
          INSERT INTO inscripciones (estudiante_id, lote_id, estado)
          VALUES (?, ?, 'pendiente_pago')
        `;

        await connection.query(sqlInsert, [estudianteId, loteId]);

        await connection.commit();
        res.status(201).json({ mensaje: '¡Inscripción exitosa! Cupo reservado, pendiente de pago.' });

    } catch (error) {
        if (connection) await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Ya estás inscrito en este curso.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Verifica el estado de una inscripción específica.
 */
export const obtenerMiEstadoInscripcion = async (req, res) => {
    const estudianteId = req.usuario.id;
    const { loteId } = req.params;
    try {
        const [inscripcion] = await query(
            "SELECT id, estado FROM inscripciones WHERE estudiante_id = ? AND lote_id = ? AND estado != 'cancelado'",
            [estudianteId, loteId]
        );
        
        if (inscripcion) {
            res.status(200).json({ 
                estaInscrito: true, 
                estado: inscripcion.estado, 
                inscripcionId: inscripcion.id 
            });
        } else {
            // Enviamos un string vacío para que data.estado.toUpperCase() no falle
            res.status(200).json({ 
                estaInscrito: false, 
                estado: '', 
                inscripcionId: null 
            });
        }
    } catch (error) {
        console.error('Error al verificar estado de inscripción:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
     }
};

/**
 * [CORREGIDO] Cancela una inscripción y elimina sus dependencias (pagos/archivos).
 * Permite cancelar incluso si hay un pago en revisión (pendiente).
 */
export const cancelarMiInscripcion = async (req, res) => {
    const estudianteId = req.usuario.id;
    const { inscripcionId } = req.params;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [inscripcionRows] = await connection.query(
            "SELECT id, estado FROM inscripciones WHERE id = ? AND estudiante_id = ? FOR UPDATE",
            [inscripcionId, estudianteId]
        );

        if (inscripcionRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Inscripción no encontrada.' });
        }

        const inscripcion = inscripcionRows[0];

        if (inscripcion.estado === 'inscrito') {
            await connection.rollback();
            return res.status(403).json({ mensaje: 'No puedes cancelar una inscripción ya activa.' });
        }

        const [pagoRows] = await connection.query(
            "SELECT id, estado, comprobante_url FROM pagos WHERE inscripcion_id = ?",
            [inscripcionId]
        );

        if (pagoRows.length > 0) {
            const pago = pagoRows[0];
            if (pago.estado === 'validado') {
                await connection.rollback();
                return res.status(409).json({ mensaje: 'El pago ya fue validado.' });
            }

            if (pago.comprobante_url) {
                try {
                    // Mantenemos tu lógica de ruta original
                    const rutaArchivo = path.join(process.cwd(), 'uploads', pago.comprobante_url);
                    await fs.unlink(rutaArchivo);
                } catch (err) {
                    console.warn("No se pudo borrar el archivo físico:", err.message);
                }
            }
            await connection.query("DELETE FROM pagos WHERE id = ?", [pago.id]);
        }

        await connection.query("DELETE FROM inscripciones WHERE id = ?", [inscripcionId]);
        await connection.commit();
        res.status(200).json({ mensaje: 'Inscripción eliminada correctamente.' });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [ACTUALIZADO] Obtiene la lista completa de inscripciones del estudiante logueado.
 * Incluye datos de Pagos, Fechas completas y Descripción para la UI.
 */
export const obtenerMisInscripciones = async (req, res) => {
    const estudianteId = req.usuario.id;

    try {
        const sql = `
            SELECT 
                i.id AS inscripcion_id, i.estado, i.lote_id,
                p.titulo AS plan_titulo, p.descripcion AS plan_descripcion,
                u.nombre AS docente_nombre,
                l.fecha_inicio, l.fecha_fin, l.modalidad, l.cupos AS cupos_totales,
                (SELECT COUNT(*) FROM inscripciones WHERE lote_id = l.id AND estado != 'cancelado') as inscritos_actuales,
                pg.estado AS pago_estado, pg.observacion_admin AS pago_observacion
            FROM inscripciones i
            JOIN cursos_lotes l ON i.lote_id = l.id
            JOIN planes_estudio p ON l.plan_id = p.id
            JOIN usuarios u ON l.docente_id = u.id
            LEFT JOIN pagos pg ON i.id = pg.inscripcion_id
            WHERE i.estudiante_id = ? 
            ORDER BY i.fecha_inscripcion DESC
        `;

        const inscripciones = await query(sql, [estudianteId]);

        const listaCompleta = await Promise.all(inscripciones.map(async (insc) => {
            const horarios = await query(
                "SELECT dia_semana, hora_inicio, hora_fin FROM lote_horarios WHERE lote_id = ?",
                [insc.lote_id]
            );
            const cupos_disponibles = insc.cupos_totales - insc.inscritos_actuales;

            return {
                ...insc,
                horarios: horarios,
                cupos_disponibles: cupos_disponibles > 0 ? cupos_disponibles : 0
            };
        }));

        res.status(200).json(listaCompleta);

    } catch (error) {
        console.error('Error al obtener mis inscripciones:', error);
        res.status(500).json({ mensaje: 'Error al cargar tus cursos.' });
    }
};

// --------------------------------------------------------------------------------------
// [ACTUALIZADO] Obtiene los eventos del calendario para el estudiante logueado
// --------------------------------------------------------------------------------------

/**
 * Obtiene los eventos del calendario (clases, inicio/fin, pagos) para el estudiante.
 * @param {object} req
 * @param {object} res
 */
export const obtenerEventosCalendario = async (req, res) => {
    const estudianteId = req.usuario.id;

    try {
        // Consulta unificada para traer Lotes + Horarios + Hitos
        // Usamos LEFT JOIN para horarios porque un curso podría (raramente) no tenerlos definidos aún
        const sql = `
            SELECT
                i.id AS inscripcion_id,
                i.lote_id,
                i.fecha_inscripcion,
                p.titulo AS plan_titulo,
                l.fecha_inicio AS lote_inicio,
                l.fecha_fin AS lote_fin,
                pg.estado AS pago_estado,
                pg.fecha_subida AS pago_subida,
                pg.fecha_validacion AS pago_validacion,
                lh.dia_semana,
                lh.hora_inicio,
                lh.hora_fin
            FROM inscripciones i
            JOIN cursos_lotes l ON i.lote_id = l.id
            JOIN planes_estudio p ON l.plan_id = p.id
            LEFT JOIN pagos pg ON i.id = pg.inscripcion_id
            LEFT JOIN lote_horarios lh ON l.id = lh.lote_id
            WHERE i.estudiante_id = ? 
            AND i.estado IN ('inscrito', 'pendiente_pago', 'finalizado')
        `;
        
        const resultados = await query(sql, [estudianteId]);

        // Procesamos los resultados para agrupar horarios por lote
        // Esto facilita al frontend generar la recurrencia
        const cursosMap = new Map();
        const hitos = [];

        resultados.forEach(row => {
            // 1. Recopilar Hitos (Eventos únicos) - Solo una vez por inscripción
            const inscKey = `insc-${row.inscripcion_id}`;
            // Usamos un Set o lógica simple para no duplicar hitos si el join trae múltiples filas de horarios
            if (!cursosMap.has(row.lote_id)) {
                // Hito Inscripción
                hitos.push({
                    id: `hito-insc-${row.inscripcion_id}`,
                    title: `Inscripción: ${row.plan_titulo}`,
                    start: row.fecha_inscripcion,
                    type: 'inscripcion'
                });

                // Hito Pagos
                if (row.pago_subida) {
                    hitos.push({
                        id: `hito-pago-subida-${row.inscripcion_id}`,
                        title: `Comprobante Enviado: ${row.plan_titulo}`,
                        start: row.pago_subida,
                        type: 'pago_subido'
                    });
                }
                if (row.pago_validacion && row.pago_estado === 'validado') {
                    hitos.push({
                        id: `hito-pago-validado-${row.inscripcion_id}`,
                        title: `Pago Aprobado: ${row.plan_titulo}`,
                        start: row.pago_validacion,
                        type: 'pago_validado'
                    });
                }
            }

            // 2. Agrupar datos del curso y sus horarios
            if (!cursosMap.has(row.lote_id)) {
                cursosMap.set(row.lote_id, {
                    lote_id: row.lote_id,
                    titulo: row.plan_titulo,
                    fecha_inicio: row.lote_inicio,
                    fecha_fin: row.lote_fin,
                    horarios: []
                });
            }

            if (row.dia_semana && row.hora_inicio) {
                // Evitar duplicados de horarios si hay múltiples pagos (raro, pero seguro)
                const curso = cursosMap.get(row.lote_id);
                const existeHorario = curso.horarios.find(h => 
                    h.dia === row.dia_semana && h.inicio === row.hora_inicio
                );
                if (!existeHorario) {
                    curso.horarios.push({
                        dia: row.dia_semana, // 'lunes', 'martes'...
                        inicio: row.hora_inicio,
                        fin: row.hora_fin
                    });
                }
            }
        });

        // Convertimos el Map a Array
        const cursos = Array.from(cursosMap.values());

        res.status(200).json({
            hitos,
            cursos
        });

    } catch (error) {
        console.error('Error al obtener datos de calendario:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar calendario.' });
    }
};