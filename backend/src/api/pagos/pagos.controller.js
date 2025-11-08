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
    const estudianteId = req.usuario.id;
    const { inscripcionId } = req.params;

    if (!req.file) {
        return res.status(400).json({ mensaje: 'No se subió ningún archivo.' });
    }
    
    console.log(`\n--- INICIO SUBIR (Simple) (Inscripción ID: ${inscripcionId}) ---`);
    console.log(`Archivo recibido: ${req.file.filename}`);

    try {
        // 1. Verificar Inscripción (Válida y Pendiente/Rechazada)
        console.log("Verificando inscripción...");
        const [inscripcion] = await query(
          `SELECT id, lote_id, estado FROM inscripciones WHERE id = ? AND estudiante_id = ?`,
          [inscripcionId, estudianteId]
        );
        if (!inscripcion) {
            console.log("Error: Inscripción no encontrada.");
            await fs.unlink(req.file.path).catch(err => console.error("Error borrando archivo:", err.message));
            return res.status(404).json({ mensaje: 'Inscripción no encontrada o no te pertenece.' });
        }
        if (inscripcion.estado === 'inscrito' || inscripcion.estado === 'cancelado') {
             console.log("Error: Inscripción ya completada/cancelada.");
             await fs.unlink(req.file.path).catch(err => console.error("Error borrando archivo:", err.message));
             return res.status(409).json({ mensaje: 'Esta inscripción ya fue completada o cancelada.' });
        }
        console.log("Inscripción válida.");

        // 2. Buscar Pago Existente
        console.log("Buscando pago existente...");
        const [pagoExistente] = await query(
            `SELECT id, estado, comprobante_url FROM pagos WHERE inscripcion_id = ?`,
            [inscripcionId]
        );

        const nuevaUrlRelativa = path.join('pagos', req.file.filename).replace(/\\/g, '/');
        let mensajeExito = '';

        if (pagoExistente) {
            // --- ACTUALIZAR PAGO ---
            console.log(`Pago existente (ID: ${pagoExistente.id}). Actualizando...`);
            if (pagoExistente.estado === 'validado'){
                 console.log("Error: Pago ya validado.");
                 await fs.unlink(req.file.path).catch(err => console.error("Error borrando archivo nuevo:", err.message));
                 return res.status(409).json({ mensaje: 'Pago ya validado, no se puede cambiar.' });
            }
            
            // Guardamos la URL antigua para borrarla manualmente si queremos
            const archivoAntiguoUrl = pagoExistente.comprobante_url; 
            console.log(`Archivo antiguo (no se borrará automáticamente): ${archivoAntiguoUrl}`);

            await query(
                `UPDATE pagos SET comprobante_url = ?, estado = 'pendiente',
                   fecha_subida = CURRENT_TIMESTAMP, fecha_validacion = NULL, observacion_admin = NULL
                 WHERE id = ?`,
                [nuevaUrlRelativa, pagoExistente.id]
            );
            mensajeExito = 'Comprobante actualizado.';
            console.log("UPDATE de pago ejecutado.");

        } else {
            // --- INSERTAR PAGO NUEVO ---
            console.log("Pago no existente. Creando nuevo...");
            const [lote] = await query('SELECT precio FROM cursos_lotes WHERE id = ?', [inscripcion.lote_id]);
            if (!lote) {
                console.log("Error: Lote asociado no existe.");
                await fs.unlink(req.file.path).catch(err => console.error("Error borrando archivo:", err.message));
                return res.status(404).json({ mensaje: 'Error: El lote asociado ya no existe.' });
            }

            await query(
                `INSERT INTO pagos (inscripcion_id, monto, comprobante_url, estado)
                 VALUES (?, ?, ?, 'pendiente')`,
                [inscripcionId, lote.precio, nuevaUrlRelativa]
            );
            mensajeExito = 'Comprobante subido.';
            console.log("INSERT de pago ejecutado.");
        }

        // 3. Asegurar que inscripción esté 'pendiente_pago'
        if(inscripcion.estado !== 'pendiente_pago'){
             console.log("Actualizando estado de inscripción a 'pendiente_pago'");
             await query(`UPDATE inscripciones SET estado = 'pendiente_pago' WHERE id = ?`, [inscripcionId]);
        }
        
        console.log("¡Operación de BD completada!");
        res.status(201).json({ mensaje: mensajeExito });
        console.log("--- FIN SUBIR (Éxito) ---");

    } catch (error) {
        console.log("!!! ERROR DETECTADO DURANTE LA OPERACIÓN (SIMPLE) !!!");
        console.error('Error detallado:', error);
        
        // Si hay error, borrar el archivo nuevo que se subió
        if (req.file?.path) {
            console.log(`Intentando borrar archivo nuevo tras error: ${req.file.path}`);
            await fs.unlink(req.file.path).catch(err => console.error("Error borrando archivo tras error BD:", err.message));
        }
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
        console.log("--- FIN SUBIR (Error) ---");
    }
};

/**
 * -----------------------------------------------------------------
 * FUNCIÓN 2 (Docente): Validar o Rechazar el pago
 * (¡¡¡CORRECCIÓN DEFINITIVA USANDO 'Number()'!!!)
 * -----------------------------------------------------------------
 */
export const validarPago = async (req, res) => {
    // 1. Obtenemos el ID del docente que hace la solicitud (del token)
    const docenteIdDelToken = req.usuario.id; //
    
    const { pagoId } = req.params; //
    const { estado, observacion } = req.body; //

    if (!estado || (estado !== 'validado' && estado !== 'rechazado')) {
        return res.status(400).json({ mensaje: "El campo 'estado' es obligatorio y debe ser 'validado' o 'rechazado'." }); //
    }

    const connection = await pool.getConnection(); //
    try {
        await connection.beginTransaction(); //

        // 2. Buscamos el pago Y el ID del docente dueño del curso asociado
        const [pago] = await connection.query(
          `SELECT 
             p.estado AS estado_pago, 
             i.id AS inscripcion_id, 
             l.docente_id AS id_dueño_del_curso
           FROM pagos p
           INNER JOIN inscripciones i ON p.inscripcion_id = i.id
           INNER JOIN cursos_lotes l ON i.lote_id = l.id
           WHERE p.id = ?`,
          [pagoId]
        ); //

        if (!pago) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Error: Pago no encontrado.' }); //
        }

        // --- --- --- --- --- --- --- --- ---
        // --- INICIO DE LA CORRECCIÓN ---
        // --- --- --- --- --- --- --- --- ---
        
        // 3. Forzamos ambos IDs a ser NÚMEROS para una comparación estricta.
        const idDocenteDelCurso = Number(pago.id_dueño_del_curso);
        const idTokenNumerico = Number(docenteIdDelToken);

        // 4. Comparamos NÚMERO vs NÚMERO
        // Si uno es NaN (porque era null o undefined), la comparación fallará.
        if (idDocenteDelCurso !== idTokenNumerico) {
            await connection.rollback();
            // Devolvemos el 403 que estabas viendo
            return res.status(403).json({
                mensaje: 'No tienes permiso para validar este pago. No eres el dueño del curso.',
                id_dueño_curso_DB: idDocenteDelCurso,
                id_tu_token: idTokenNumerico
            });
        }
        
        // --- --- --- --- --- --- --- ---
        // --- FIN DE LA CORRECCIÓN ---
        // --- --- --- --- --- --- --- ---

        // 5. Continuamos con la lógica de negocio (que ya estaba bien)
        if (pago.estado_pago !== 'pendiente') {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'Este pago ya ha sido procesado (validado o rechazado) anteriormente.' }); //
        }

        // 6. Actualizar el pago
        await connection.query(
          `UPDATE pagos SET estado = ?, observacion_admin = ?, fecha_validacion = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [estado, observacion, pagoId]
        ); //

        // 7. Si se aprueba, actualizar la inscripción
        if (estado === 'validado') {
            await connection.query(
                "UPDATE inscripciones SET estado = 'inscrito' WHERE id = ?",
                [pago.inscripcion_id]
            ); //
        }
        
        // 8. Confirmar todo
        await connection.commit();
        res.status(200).json({ mensaje: `Pago ${estado} exitosamente.` }); //

    } catch (error) {
        await connection.rollback();
        console.error('Error al validar pago:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' }); //
    } finally {
        if (connection) connection.release(); //
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
        // Consulta compleja para obtener la lista de pagos pendientes
        // Se une pagos, inscripciones, lotes, y usuarios (estudiantes)
        const pagosPendientes = await query(
            `SELECT
               p.id AS pago_id, 
               p.monto,
               p.fecha_subida,
               p.comprobante_url,
               p.observacion_admin,
               i.id AS inscripcion_id,
               c.plan_id,
               c.fecha_inicio AS lote_fecha,
               u.nombre AS estudiante_nombre,
               u.correo AS estudiante_correo,
               pl.titulo AS curso_titulo
             FROM pagos p
             INNER JOIN inscripciones i ON p.inscripcion_id = i.id
             INNER JOIN cursos_lotes c ON i.lote_id = c.id
             INNER JOIN usuarios u ON i.estudiante_id = u.id
             INNER JOIN planes_estudio pl ON c.plan_id = pl.id
             WHERE c.docente_id = ? AND p.estado = 'pendiente'
             ORDER BY p.fecha_subida ASC`,
            [docenteId]
        );

        res.status(200).json(pagosPendientes);

    } catch (error) {
        console.error('Error al obtener pagos pendientes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};