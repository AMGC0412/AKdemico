/* Archivo: src/api/dashboard/dashboard.controller.js */
import { pool } from '../../config/database.js';

/**
 * 1. Estadísticas para el DASHBOARD del DOCENTE
 * Se asegura de contar "estudiantes" reales mediante la nueva tabla de roles.
 */
export const getDocenteStats = async (req, res) => {
    const docenteId = req.usuario.id;

    try {
        const [
            alumnosResult,
            planesResult,
            ingresosResult,
            valoracionResult
        ] = await Promise.all([
            // 1. Total de Alumnos: Estudiantes únicos con rol 'estudiante' e inscripción validada
            pool.query(`
                SELECT COUNT(DISTINCT i.estudiante_id) as total
                FROM inscripciones i
                JOIN cursos_lotes cl ON i.lote_id = cl.id
                -- JOIN con roles para validar que el usuario es efectivamente un estudiante
                INNER JOIN usuario_roles ur ON i.estudiante_id = ur.usuario_id
                INNER JOIN roles r ON ur.rol_id = r.id
                WHERE cl.docente_id = ? 
                  AND i.estado = 'inscrito'
                  AND r.nombre = 'estudiante'
            `, [docenteId]),

            // 2. Planes Publicados: El docente_id en planes_estudio es directo
            pool.query(`
                SELECT COUNT(*) as total
                FROM planes_estudio
                WHERE docente_id = ? AND estado = 'publicado'
            `, [docenteId]),

            // 3. Ingresos del Mes Actual
            pool.query(`
                SELECT COALESCE(SUM(p.monto), 0) as total
                FROM pagos p
                JOIN inscripciones i ON p.inscripcion_id = i.id
                JOIN cursos_lotes cl ON i.lote_id = cl.id
                WHERE cl.docente_id = ? 
                  AND p.estado = 'validado'
                  AND MONTH(p.fecha_validacion) = MONTH(CURRENT_DATE())
                  AND YEAR(p.fecha_validacion) = YEAR(CURRENT_DATE())
            `, [docenteId]),
            
            // 4. Valoración Promedio
            pool.query(`
                SELECT COALESCE(AVG(calificacion), 0) as promedio
                FROM resenas
                WHERE docente_id = ? AND estado = 'publicada'
            `, [docenteId])
        ]);

        const stats = {
            alumnos_total: alumnosResult[0][0].total,
            cursos_publicados: planesResult[0][0].total,
            ingresos_mes: ingresosResult[0][0].total,
            valoracion_promedio: parseFloat(valoracionResult[0][0].promedio).toFixed(1)
        };

        res.status(200).json(stats);

    } catch (error) {
        console.error('Error obteniendo stats docente:', error);
        res.status(500).json({ mensaje: 'Error interno al calcular estadísticas.' });
    }
};