import { Router } from 'express';
// --- Importar la nueva función ---
import { 
    crearLoteDeCurso, 
    buscarLotesPublicos, 
    obtenerDetalleLote,
    actualizarLote,
    eliminarLote, 
    obtenerLotesPorPlanId 
    
} from './lotes.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esDocente } from '../../middleware/role.middleware.js';

const router = Router();

// POST /api/v1/lotes (Crear lote) - Requiere ser Docente
router.post('/', protegerRuta, esDocente, crearLoteDeCurso);

// --- [CORREGIDO] Ruta de búsqueda pública ---
// GET /api/v1/lotes/search (Buscar lotes)
// Eliminamos 'protegerRuta' para que sea accesible sin iniciar sesión.
router.get('/search', buscarLotesPublicos); // <-- ¡AQUÍ ESTÁ EL CAMBIO!
// ------------------------------------------

// GET /api/v1/lotes/:loteId (Obtener detalle)
router.get('/:loteId', protegerRuta, obtenerDetalleLote);

// PUT /api/v1/lotes/:loteId (Actualizar lote)
router.put('/:loteId', protegerRuta, esDocente, actualizarLote);

// Ruta para eliminar un lote
router.delete('/:loteId', protegerRuta, esDocente, eliminarLote);

// GET /api/v1/lotes/by-plan/:planId (Obtener lotes por el ID del plan)
router.get('/by-plan/:planId', protegerRuta, obtenerLotesPorPlanId);

export default router;