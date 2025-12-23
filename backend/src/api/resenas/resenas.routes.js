import { Router } from 'express';
import { 
  crearReseña, 
  reportarReseña, 
  obtenerReseñasReportadas, 
  moderarReseña 
} from './resenas.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esEstudiante, esAdmin } from '../../middleware/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// --- RUTAS DE ESTUDIANTE ---
// Crear una reseña sobre un lote específico
router.post('/lote/:loteId', esEstudiante, crearReseña);

// --- RUTAS PÚBLICAS (USUARIOS LOGUEADOS) ---
// Reportar cualquier reseña que infrinja normas
router.put('/reportar/:reseñaId', reportarReseña);

// --- RUTAS DE ADMINISTRADOR ---
// Acceso exclusivo a moderación
router.get('/admin/reportadas', esAdmin, obtenerReseñasReportadas);
router.put('/admin/moderar/:reseñaId', esAdmin, moderarReseña);

export default router;