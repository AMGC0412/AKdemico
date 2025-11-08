// Archivo: /backend/src/api/inscripciones/inscripciones.controller.js (Versión anterior)

import { query, pool } from '../../config/database.js';

/**
 * Controlador para que un estudiante se inscriba a un lote (US-16).
 * (Versión SIN manejo explícito de cupos_actuales)
 */
export const inscribirseALote = async (req, res) => {
    const estudianteId = req.usuario.id;
    const { loteId } = req.params; // Obtenemos el ID del lote de la URL

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificamos que el lote exista y traemos sus cupos TOTALES
        //    Usamos 'FOR UPDATE' para bloquear la fila
        const [lote] = await connection.query(
            'SELECT cupos FROM cursos_lotes WHERE id = ? AND estado = "programado" FOR UPDATE',
            [loteId]
        );

        if (!lote) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'El lote no existe o ya no está disponible.' });
        }

        // 2. Contamos cuántos estudiantes ya están inscritos (activos)
        const [conteo] = await connection.query(
            "SELECT COUNT(*) AS inscritos FROM inscripciones WHERE lote_id = ? AND estado != 'cancelado'",
            [loteId]
        );

        // 3. Verificamos si hay cupos disponibles comparando con el TOTAL
        if (conteo.inscritos >= lote.cupos) {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'Lo sentimos, ya no hay cupos disponibles para este curso.' });
        }

        // 4. Inscribimos al estudiante
        const sqlInsert = `
          INSERT INTO inscripciones (estudiante_id, lote_id, estado)
          VALUES (?, ?, 'pendiente_pago')
        `;

        await connection.query(sqlInsert, [estudianteId, loteId]);

        await connection.commit();

        res.status(201).json({ mensaje: '¡Inscripción exitosa! Tu cupo está reservado, pendiente de pago.' });

    } catch (error) {
        await connection.rollback();

        // Verificamos si el error es por 'inscripcion_unica' (llave duplicada)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Ya estás inscrito en este curso.' });
        }

        console.error('Error al inscribirse al lote:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        connection.release();
    }
};

/**
 * Controlador para verificar si el usuario actual está inscrito en un lote específico.
 * (Versión ANTERIOR - Devuelve ID de inscripción)
 */
export const obtenerMiEstadoInscripcion = async (req, res) => {
    const estudianteId = req.usuario.id;
    const { loteId } = req.params;
    try {
        const [inscripcion] = await query(
            // --- Seleccionamos también el ID ---
            "SELECT id, estado FROM inscripciones WHERE estudiante_id = ? AND lote_id = ? AND estado != 'cancelado'",
            [estudianteId, loteId]
        );
        if (inscripcion) {
            // --- Devolvemos el ID ---
            res.status(200).json({ estaInscrito: true, estado: inscripcion.estado, inscripcionId: inscripcion.id });
        } else {
            res.status(200).json({ estaInscrito: false, estado: null, inscripcionId: null });
        }
    } catch (error) {
        console.error('Error al verificar estado de inscripción:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
     }
};


export const cancelarMiInscripcion = async (req, res) => {
    const estudianteId = req.usuario.id;
    const { inscripcionId } = req.params;

    console.log(`\n--- INTENTO CANCELAR INSCRIPCIÓN ID: ${inscripcionId} ---`);

    try {
        // 1. Buscar la inscripción y su estado
        const [inscripcion] = await query(
            "SELECT id, estado FROM inscripciones WHERE id = ? AND estudiante_id = ?",
            [inscripcionId, estudianteId]
        );

        // 2. Si no se encuentra
        if (!inscripcion) {
            console.log("Resultado: Inscripción no encontrada o no pertenece al usuario.");
            return res.status(404).json({ mensaje: 'Inscripción no encontrada o no te pertenece.' });
        }

        // Imprimimos el estado encontrado
        console.log("Estado encontrado:", `'${inscripcion.estado}'`);

        // 3. Verificar estado (Comparación estricta ahora que sabemos que es string)
        if (inscripcion.estado !== 'pendiente_pago') {
            console.log("Resultado: Estado NO es 'pendiente_pago'. Bloqueando cancelación.");
            return res.status(403).json({
                mensaje: 'No puedes eliminar una inscripción que ya está pagada o ya fue cancelada.',
                estado_actual: inscripcion.estado
            });
        }

        // --- Si llega aquí, el estado SÍ ES 'pendiente_pago' ---
        console.log("Resultado: Estado es 'pendiente_pago'. Procediendo a eliminar...");

        // 4. Eliminar la inscripción (SIN TRANSACCIÓN)
        const resultadoDelete = await query(
            "DELETE FROM inscripciones WHERE id = ?",
            [inscripcionId]
        );

        if (resultadoDelete.affectedRows > 0) {
            console.log("Resultado: Eliminación exitosa.");
            res.status(200).json({ mensaje: 'Inscripción eliminada exitosamente.' });
        } else {
             console.log("Resultado: Error inesperado, no se eliminó ninguna fila.");
             // Esto es muy raro si la encontró antes
             res.status(404).json({ mensaje: 'Error: No se encontró la inscripción para eliminarla (post-verificación).' });
        }

    } catch (error) {
        console.error('Error al eliminar inscripción:', error);
         if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             console.log("Resultado: Error - Pago asociado existente.");
             return res.status(409).json({ mensaje: 'No se puede eliminar la inscripción porque ya tiene un pago asociado.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};