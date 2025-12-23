/* Archivo: users.routes.js */
import { Router } from 'express';
// [MODIFICADO] Importar la nueva función del controlador
import { 
    obtenerMiPerfil, 
    actualizarMiPerfil, 
    cambiarMiContrasena, 
    obtenerPerfilPublicoPorId // <-- NUEVA FUNCIÓN
} from './users.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';

const router = Router();

// --- [NUEVA RUTA PÚBLICA] ---
// Esta ruta debe ir ANTES de 'router.use(protegerRuta)'
// GET /api/v1/users/:userId/publico
router.get('/:userId/publico', obtenerPerfilPublicoPorId);


// --- RUTAS PROTEGIDAS ---
// Aplicamos el middleware de autenticación a todas las rutas DEBAJO de esta línea
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