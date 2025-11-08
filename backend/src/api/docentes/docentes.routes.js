import { Router } from 'express';
import { obtenerPerfilPublicoDocente } from './docentes.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';

const router = Router();

// --- RUTA PÚBLICA (para estudiantes) ---
// Cualquiera que esté logueado (sea estudiante o docente) puede ver
// el perfil de un docente verificado.
//
// URL: GET /api/v1/docentes/2 (donde 2 es el ID del docente)
router.get('/:id', protegerRuta, obtenerPerfilPublicoDocente);

export default router;