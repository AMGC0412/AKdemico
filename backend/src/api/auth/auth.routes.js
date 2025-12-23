import { Router } from 'express';
import { 
  register,      // Controlador unificado para Estudiantes/Docentes
  iniciarSesion, 
  registerAdmin 
} from './auth.controller.js';

const router = Router();

/**
 * [REGISTRO UNIFICADO]
 * URL: POST /api/v1/auth/register
 * Maneja registros de Estudiante, Docente o ambos a la vez.
 */
router.post('/register', register);

/**
 * [LOGIN MAESTRO]
 * URL: POST /api/v1/auth/login
 */
router.post('/login', iniciarSesion);

/**
 * [ADMIN SECRETO]
 * URL: POST /api/v1/auth/register-admin
 */
router.post('/register-admin', registerAdmin);

export default router;