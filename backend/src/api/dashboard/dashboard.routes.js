/* Archivo: src/api/dashboard/dashboard.routes.js */
import { Router } from 'express';
import { getDocenteStats } from './dashboard.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esDocente } from '../../middleware/role.middleware.js';

const router = Router();

// GET /api/v1/dashboard/docente-stats
router.get('/docente-stats', protegerRuta, esDocente, getDocenteStats);

export default router;