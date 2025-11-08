import { Router } from 'express';
// --- Importar las nuevas funciones ---
import { 
    crearPlanDeEstudio, 
    obtenerMisPlanesConLotes,
    obtenerPlanPorId,  // <-- NUEVO
    actualizarPlan     // <-- NUEVO
} from './planes.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esDocente } from '../../middleware/role.middleware.js';

const router = Router();

// POST /api/v1/planes (Crear un plan)
router.post('/', protegerRuta, esDocente, crearPlanDeEstudio);

// GET /api/v1/planes/mis-planes (Obtener lista)
router.get('/mis-planes', protegerRuta, esDocente, obtenerMisPlanesConLotes);

// --- AÑADIR ESTAS DOS RUTAS ---

// GET /api/v1/planes/:planId (Obtener un plan específico)
router.get('/:planId', protegerRuta, esDocente, obtenerPlanPorId);

// PUT /api/v1/planes/:planId (Actualizar un plan específico)
router.put('/:planId', protegerRuta, esDocente, actualizarPlan);

// -------------------------------

export default router;