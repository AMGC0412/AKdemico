import { query, pool } from '../../config/database.js'; // Importamos 'pool' para 'validarPago'
import path from 'path';
import fs from 'fs/promises'; // Solo para borrar archivos en caso de error

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 1 (Estudiante): Subir/Actualizar Comprobante (VERSIÓN SIMPLE)
 * Sin transacciones complicadas.
 * -----------------------------------------------------------------
 */
export const subirComprobante = async (req, res) => {
    const { inscripcionId } = req.params;

    if (!req.file) {
        return res.status(400).json({ mensaje: 'No se subió ningún archivo.' });
    }

    try {
        // La URL relativa que guardaremos en BD (ej: pagos/comprobante-14.jpg)
        // Nota: req.file.filename ya viene estandarizado por el middleware
        const nuevaUrlRelativa = path.join('pagos', req.file.filename).replace(/\\/g, '/');

        // 1. Verificar si ya existe un registro de pago
        const [pagoExistente] = await query(
            "SELECT id, estado, comprobante_url FROM pagos WHERE inscripcion_id = ?",
            [inscripcionId]
        );

        if (pagoExistente) {
            // Si ya está validado, no dejamos sobrescribir
            if (pagoExistente.estado === 'validado') {
                // Borramos el archivo recién subido porque fue un error
                await fs.unlink(req.file.path).catch(() => {});
                return res.status(409).json({ mensaje: 'El pago ya está validado.' });
            }

            // [LIMPIEZA DE EXTENSIÓN DIFERENTE]
            // Si el archivo nuevo se llama 'comprobante-14.jpg' y el viejo era 'comprobante-14.pdf',
            // el sistema operativo NO lo sobrescribió. Debemos borrar el pdf viejo manualmente.
            if (pagoExistente.comprobante_url !== nuevaUrlRelativa) {
                try {
                    const rutaVieja = path.join(__dirname, '../../uploads', pagoExistente.comprobante_url); // <--- AJUSTA RUTA BASE
                    await fs.unlink(rutaVieja);
                } catch (e) { /* Ignoramos si no existe */ }
            }

            // ACTUALIZAMOS el registro
            await query(
                `UPDATE pagos SET 
                    comprobante_url = ?, 
                    estado = 'pendiente', 
                    fecha_subida = CURRENT_TIMESTAMP, 
                    observacion_admin = NULL 
                 WHERE id = ?`,
                [nuevaUrlRelativa, pagoExistente.id]
            );

            return res.status(200).json({ mensaje: 'Comprobante actualizado exitosamente.' });

        } else {
            // CREAMOS nuevo registro
            
            // Necesitamos el monto del lote
            const [lote] = await query(
                `SELECT c.precio FROM inscripciones i 
                 JOIN cursos_lotes c ON i.lote_id = c.id 
                 WHERE i.id = ?`, 
                [inscripcionId]
            );

            if (!lote) {
                 await fs.unlink(req.file.path).catch(() => {});
                 return res.status(404).json({ mensaje: 'Error: Inscripción/Lote no encontrado.' });
            }

            await query(
                "INSERT INTO pagos (inscripcion_id, monto, comprobante_url, estado) VALUES (?, ?, ?, 'pendiente')",
                [inscripcionId, lote.precio, nuevaUrlRelativa]
            );

            // Aseguramos estado 'pendiente_pago' en la inscripción
            await query("UPDATE inscripciones SET estado = 'pendiente_pago' WHERE id = ?", [inscripcionId]);

            return res.status(201).json({ mensaje: 'Comprobante subido exitosamente.' });
        }

    } catch (error) {
        // Limpieza en caso de crash
        if (req.file) await fs.unlink(req.file.path).catch(() => {});
        console.error("Error subiendo comprobante:", error);
        res.status(500).json({ mensaje: 'Error interno al procesar el comprobante.' });
    }
};

/**
 * FUNCIÓN 2 (Docente): Validar o Rechazar el pago
 * [CORREGIDA]
 */
export const validarPago = async (req, res) => {
    const docenteIdDelToken = req.usuario.id;
    const { pagoId } = req.params;
    const { estado, observacion } = req.body;

    if (!estado || (estado !== 'validado' && estado !== 'rechazado')) {
        return res.status(400).json({ mensaje: "Estado inválido." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // [CORRECCIÓN CRÍTICA AQUÍ]
        // connection.query devuelve [rows, fields]. 
        // Usamos destructuring para obtener 'rows' y luego sacamos el primer elemento.
        const [rows] = await connection.query(
          `SELECT 
             p.estado AS estado_pago, 
             i.id AS inscripcion_id, 
             l.docente_id AS id_dueño_del_curso,
             l.id AS lote_id
           FROM pagos p
           INNER JOIN inscripciones i ON p.inscripcion_id = i.id
           INNER JOIN cursos_lotes l ON i.lote_id = l.id
           WHERE p.id = ?`,
          [pagoId]
        );

        const pago = rows[0]; // <-- Extraemos el objeto de la primera fila

        if (!pago) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Pago no encontrado.' });
        }

        // Validación de permisos estricta
        if (Number(pago.id_dueño_del_curso) !== Number(docenteIdDelToken)) {
            await connection.rollback();
            return res.status(403).json({ mensaje: 'No tienes permiso. No eres el dueño del curso.' });
        }

        if (pago.estado_pago !== 'pendiente') {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'El pago ya fue procesado anteriormente.' });
        }

        // Actualizar Pago
        await connection.query(
          "UPDATE pagos SET estado = ?, observacion_admin = ?, fecha_validacion = CURRENT_TIMESTAMP WHERE id = ?",
          [estado, observacion || null, pagoId]
        );

        // Lógica de negocio (Inscripción y Cupos)
        if (estado === 'validado') {
            await connection.query(
                "UPDATE inscripciones SET estado = 'inscrito' WHERE id = ?",
                [pago.inscripcion_id]
            );
            
            // Sumar 1 a cupos ocupados (Opcional pero recomendado)
            await connection.query(
                "UPDATE cursos_lotes SET cupos_actuales = cupos_actuales - 1 WHERE id = ?",
                [pago.lote_id]
            );

        } else if (estado === 'rechazado') {
            await connection.query(
                "UPDATE inscripciones SET estado = 'cancelado' WHERE id = ?",
                [pago.inscripcion_id]
            );
        }
        
        await connection.commit();
        res.status(200).json({ mensaje: `Pago ${estado} exitosamente.` });

    } catch (error) {
        await connection.rollback();
        console.error('Error al validar pago:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 3 (Estudiante): Obtener el estado del pago
 * (Esta función es correcta)
 * -----------------------------------------------------------------
 */
export const obtenerEstadoPagoInscripcion = async (req, res) => {
    const estudianteId = req.usuario.id;
    const { inscripcionId } = req.params;

    try {
        const [inscripcion] = await query(
            `SELECT id FROM inscripciones WHERE id = ? AND estudiante_id = ?`,
            [inscripcionId, estudianteId]
        );
        if (!inscripcion) {
            return res.status(404).json({ mensaje: 'Inscripción no encontrada o no te pertenece.' });
        }

        const [pago] = await query(
            `SELECT id, estado, comprobante_url, observacion_admin
             FROM pagos WHERE inscripcion_id = ?`,
            [inscripcionId]
        );

        if (pago) {
            res.status(200).json({
                existePago: true,
                pagoId: pago.id,
                estado: pago.estado,
                urlComprobante: pago.comprobante_url,
                observacionAdmin: pago.observacion_admin
            });
        } else {
            res.status(200).json({ existePago: false });
        }

    } catch (error) {
        console.error('Error al obtener estado del pago:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 4 (Docente): Obtener lista de pagos pendientes de validar
 * -----------------------------------------------------------------
 */
export const obtenerPagosPendientesDocente = async (req, res) => {
    const docenteId = req.usuario.id;

    try {
        const sql = `
            SELECT
               p.id AS pago_id, 
               p.monto,
               p.fecha_subida,
               p.comprobante_url,
               p.observacion_admin,
               i.id AS inscripcion_id,
               c.fecha_inicio AS lote_fecha,
               u.nombre AS estudiante_nombre,
               u.correo AS estudiante_correo,
               pl.titulo AS curso_titulo
             FROM pagos p
             INNER JOIN inscripciones i ON p.inscripcion_id = i.id
             INNER JOIN cursos_lotes c ON i.lote_id = c.id
             INNER JOIN planes_estudio pl ON c.plan_id = pl.id
             INNER JOIN usuarios u ON i.estudiante_id = u.id
             INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
             INNER JOIN roles r ON ur.rol_id = r.id
             WHERE c.docente_id = ? 
               AND p.estado = 'pendiente'
               AND r.nombre = 'estudiante'
             ORDER BY p.fecha_subida ASC`;

        const pagosPendientes = await query(sql, [docenteId]);
        res.status(200).json(pagosPendientes);

    } catch (error) {
        console.error('Error al obtener pagos pendientes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};