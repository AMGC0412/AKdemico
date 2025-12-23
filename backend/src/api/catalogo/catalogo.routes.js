import { Router } from 'express';
import { obtenerCategorias, obtenerNiveles } from './catalogo.controller.js';

const router = Router();

// GET /api/v1/catalogo/categorias
router.get('/categorias', obtenerCategorias);

// GET /api/v1/catalogo/niveles
router.get('/niveles', obtenerNiveles);

export default router;