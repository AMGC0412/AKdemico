import { Router } from 'express';
import { crearReseña, reportarReseña, obtenerReseñasReportadas, moderarReseña } from './resenas.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esEstudiante } from '../../middleware/role.middleware.js';
import { esAdmin } from '../../middleware/role.middleware.js'; // <-- Importamos 'esAdmin'

const router = Router();

// URL: POST /api/v1/resenas/lote/1 (donde 1 es el ID del lote)
router.post('/lote/:loteId', protegerRuta, esEstudiante, crearReseña);

// RUTA PARA QUE CUALQUIER USUARIO LOGUEADO REPORTE UNA RESEÑA
// URL: PUT /api/v1/resenas/reportar/1 (donde 1 es el ID de la reseña)
router.put('/reportar/:reseñaId', protegerRuta, reportarReseña);

// --- RUTAS DE ADMINISTRADOR ---
// Ver todas las reseñas reportadas
router.get('/reportadas', protegerRuta, esAdmin, obtenerReseñasReportadas);

// Tomar acción sobre una reseña reportada
router.put('/moderar/:reseñaId', protegerRuta, esAdmin, moderarReseña);
// ----------------------------

export default router;