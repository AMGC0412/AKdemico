import { Router } from 'express';
// [MODIFICADO] Importamos las nuevas funciones
import { 
  crearTaxonomia, 
  obtenerTaxonomias,
  actualizarTaxonomia, // <-- [NUEVO]
  eliminarTaxonomia   // <-- [NUEVO]
} from './taxonomia.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esAdmin } from '../../middleware/role.middleware.js';

const router = Router();

// --- RUTA DE ADMIN ---
// POST /api/v1/taxonomia
router.post('/', protegerRuta, esAdmin, crearTaxonomia);

// --- RUTA PÚBLICA (para filtros) ---
// GET /api/v1/taxonomia
router.get('/', protegerRuta, obtenerTaxonomias);

// --- [NUEVAS RUTAS DE ADMIN AÑADIDAS] ---

// PUT /api/v1/taxonomia/:id
// Solo el Admin puede actualizar
router.put('/:id', protegerRuta, esAdmin, actualizarTaxonomia);

// DELETE /api/v1/taxonomia/:id
// Solo el Admin puede eliminar
router.delete('/:id', protegerRuta, esAdmin, eliminarTaxonomia);
// ------------------------------------------

export default router;