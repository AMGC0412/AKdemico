import { Router } from 'express';
// Importamos la nueva función
import { inscribirseALote, obtenerMiEstadoInscripcion, cancelarMiInscripcion } from './inscripciones.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esEstudiante } from '../../middleware/role.middleware.js';

const router = Router();

// Ruta para inscribirse (ya existe)
router.post('/lote/:loteId', protegerRuta, esEstudiante, inscribirseALote);

// Ruta para verificar estado (ya existe)
router.get('/mi-estado/lote/:loteId', protegerRuta, esEstudiante, obtenerMiEstadoInscripcion);

// --- AÑADIR ESTA RUTA ---
// Ruta para cancelar una inscripción
// Usamos DELETE porque es una acción destructiva (cambia estado a cancelado)
// URL: DELETE /api/v1/inscripciones/1 (donde 1 es el inscripcionId)
router.delete('/:inscripcionId', protegerRuta, esEstudiante, cancelarMiInscripcion);
// -------------------------

export default router;