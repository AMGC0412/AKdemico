import { Router } from 'express';
import { actualizarDisponibilidadSemanal, obtenerDisponibilidad } from './schedules.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esDocente } from '../../middleware/role.middleware.js';


const router = Router();

// --- RUTA PARA QUE EL DOCENTE GESTIONE SU HORARIO ---
// 1. Proteger ruta (logueado)
// 2. Es Docente (rol)
// 3. Controlador
//
// URL: POST /api/v1/schedules/availability
router.post('/availability', protegerRuta, esDocente, actualizarDisponibilidadSemanal);

// --- RUTA GET FALTANTE ---
router.get('/availability', protegerRuta, esDocente, obtenerDisponibilidad); 
// --------------------------
export default router;