/* Archivo: lotes.routes.js (CORREGIDO) */
import { Router } from 'express';
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

// --- RUTAS PÚBLICAS (Accesibles para todos) ---

// 1. Buscar lotes (Catálogo)
router.get('/search', buscarLotesPublicos);

// 2. [CORREGIDO] Ver detalle de un lote específico
// Eliminamos 'protegerRuta' para que invitados puedan ver el curso
router.get('/:loteId', obtenerDetalleLote); 

// 3. [CORREGIDO] Ver otros horarios del mismo plan (Carrusel)
// Eliminamos 'protegerRuta'
router.get('/by-plan/:planId', obtenerLotesPorPlanId);


// --- RUTAS PROTEGIDAS (Solo Docentes) ---

// Crear un nuevo lote
router.post('/', protegerRuta, esDocente, crearLoteDeCurso);

// Actualizar un lote existente
router.put('/:loteId', protegerRuta, esDocente, actualizarLote);

// Eliminar un lote
router.delete('/:loteId', protegerRuta, esDocente, eliminarLote);

export default router;