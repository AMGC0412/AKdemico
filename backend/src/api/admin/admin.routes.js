import { Router } from 'express';
// [MODIFICADO] Importamos las nuevas funciones del controlador
import { 
  obtenerMetricasDashboard,
  obtenerTodasLasVerificaciones,
  aprobarVerificacion,
  rechazarVerificacion,
  obtenerTodosLosUsuarios,
  actualizarRolUsuario,
  obtenerResenasReportadas, // <-- [NUEVO]
  aprobarResena,             // <-- [NUEVO]
  ocultarResena              // <-- [NUEVO]
} from './admin.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esAdmin } from '../../middleware/role.middleware.js';

const router = Router();

// --- RUTA DE ADMIN ---
router.get('/dashboard', protegerRuta, esAdmin, obtenerMetricasDashboard);

// --- RUTAS DE GESTIÓN DE VERIFICACIONES ---
router.get('/verificaciones', protegerRuta, esAdmin, obtenerTodasLasVerificaciones);
router.put('/verificaciones/:id/aprobar', protegerRuta, esAdmin, aprobarVerificacion);
router.put('/verificaciones/:id/rechazar', protegerRuta, esAdmin, rechazarVerificacion);

// --- RUTAS DE GESTIÓN DE USUARIOS ---
router.get('/usuarios', protegerRuta, esAdmin, obtenerTodosLosUsuarios);
router.put('/usuarios/:id/rol', protegerRuta, esAdmin, actualizarRolUsuario);

// --- [NUEVO] RUTAS DE GESTIÓN DE MODERACIÓN (Reseñas US-24) ---

// GET /api/v1/admin/moderacion/resenas
// Obtiene la lista de todas las reseñas 'reportada'
router.get('/moderacion/resenas', protegerRuta, esAdmin, obtenerResenasReportadas);

// PUT /api/v1/admin/moderacion/resenas/:id/aprobar
// Cambia el estado de la reseña a 'publicada'
router.put('/moderacion/resenas/:id/aprobar', protegerRuta, esAdmin, aprobarResena);

// PUT /api/v1/admin/moderacion/resenas/:id/ocultar
// Cambia el estado de la reseña a 'oculta'
router.put('/moderacion/resenas/:id/ocultar', protegerRuta, esAdmin, ocultarResena);
// --------------------------------------------------

export default router;