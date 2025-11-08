import { Router } from 'express';
import { obtenerMiPerfil, actualizarMiPerfil, cambiarMiContrasena } from './users.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';

const router = Router();

// Aplicamos el middleware de autenticación a todas las rutas de usuario
router.use(protegerRuta);

// Ruta GET para ver el perfil
// GET /api/v1/users/me
router.get('/me', obtenerMiPerfil);

// Ruta PUT para actualizar el perfil
// PUT /api/v1/users/me
router.put('/me', actualizarMiPerfil);

// Ruta PUT para cambiar la contraseña
// PUT /api/v1/users/cambiar-contrasena
router.put('/cambiar-contrasena', cambiarMiContrasena);

export default router;