/* Archivo: taxonomia.routes.js */
import { Router } from 'express';
import { 
  crearTaxonomia, 
  obtenerTaxonomias, // <-- [NUEVO] Renombrada para claridad
  actualizarTaxonomia, 
  eliminarTaxonomia   
} from './taxonomia.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esAdmin } from '../../middleware/role.middleware.js';

const router = Router();

// --- RUTA PÚBLICA (para filtros de búsqueda) ---
// GET /api/v1/taxonomia
// [CORREGIDO] Quitamos 'protegerRuta'. Los filtros deben ser públicos.
router.get('/', obtenerTaxonomias);

// --- RUTAS DE ADMIN ---
// POST /api/v1/taxonomia
router.post('/', protegerRuta, esAdmin, crearTaxonomia);

// PUT /api/v1/taxonomia/:id
router.put('/:id', protegerRuta, esAdmin, actualizarTaxonomia);

// DELETE /api/v1/taxonomia/:id
router.delete('/:id', protegerRuta, esAdmin, eliminarTaxonomia);

export default router;