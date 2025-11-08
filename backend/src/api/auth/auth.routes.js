import { Router } from 'express';
// [MODIFICADO] Importa la nueva función del controlador
import { 
  registrarEstudiante, 
  iniciarSesion, 
  registrarDocente,
  registerAdmin // <-- [NUEVO] AÑADIR ESTA
} from './auth.controller.js';

const router = Router();

// Ruta de registro de estudiante
// URL final: POST /api/v1/auth/register
router.post('/register', registrarEstudiante);

// Ruta de inicio de sesión
// URL final: POST /api/v1/auth/login
router.post('/login', iniciarSesion);

// Ruta para registrar docentes
// URL final: POST /api/v1/auth/register-docente
router.post('/register-docente', registrarDocente);

// --- [NUEVA RUTA AÑADIDA] ---
// Ruta para registrar administradores (secreta)
// URL final: POST /api/v1/auth/register-admin
router.post('/register-admin', registerAdmin);
// -------------------------

export default router;