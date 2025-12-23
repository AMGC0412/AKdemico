import { Router } from 'express';
import { 
    inscribirseALote, 
    obtenerMiEstadoInscripcion, 
    cancelarMiInscripcion,
    obtenerMisInscripciones,
    obtenerEventosCalendario
} from './inscripciones.controller.js'; // Ajusta la ruta si es necesario

import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esEstudiante } from '../../middleware/role.middleware.js';

const router = Router();

// 1. Rutas estáticas (sin parámetros) van PRIMERO
// GET /api/v1/inscripciones/mis-inscripciones
router.get('/mis-inscripciones', protegerRuta, esEstudiante, obtenerMisInscripciones);

// 2. Rutas dinámicas (con parámetros) van DESPUÉS
// POST /api/v1/inscripciones/lote/:loteId
router.post('/lote/:loteId', protegerRuta, esEstudiante, inscribirseALote);

// GET /api/v1/inscripciones/mi-estado/lote/:loteId
router.get('/mi-estado/lote/:loteId', protegerRuta, esEstudiante, obtenerMiEstadoInscripcion);

// DELETE /api/v1/inscripciones/:inscripcionId
router.delete('/:inscripcionId', protegerRuta, esEstudiante, cancelarMiInscripcion);

// [NUEVA RUTA DE CALENDARIO]
// GET /api/v1/inscripciones/calendario
router.get('/calendario', protegerRuta, esEstudiante, obtenerEventosCalendario); // <-- ¡NUEVO!

export default router;