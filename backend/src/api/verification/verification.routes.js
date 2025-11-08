import { Router } from 'express';
import { postularParaVerificacion, 
  obtenerMiEstadoDeVerificacion,
  revisarPostulacion 
} from './verification.controller.js';
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esDocente } from '../../middleware/role.middleware.js';
import { upload } from '../../middleware/uploader.middleware.js';
import { esAdmin } from '../../middleware/role.middleware.js'; 

const router = Router();

// Definimos los campos que esperamos. 'cv' (1 archivo), 'dni' (1 archivo), etc.
const camposDeArchivos = upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'dni', maxCount: 1 },
  { name: 'titulo', maxCount: 1 }
]);

// --- RUTA DE POSTULACIÓN ---
// 1. Proteger ruta (logueado)
// 2. Es Docente (rol)
// 3. CamposDeArchivos (procesa los archivos)
// 4. Controlador (guarda en BD)
//
// URL: POST /api/v1/verification/apply
router.post('/apply', protegerRuta, esDocente, camposDeArchivos, postularParaVerificacion);

// Ruta GET para que el docente vea su estado
// URL: GET /api/v1/verification/my-status
router.get('/my-status', protegerRuta, esDocente, obtenerMiEstadoDeVerificacion);

// Ruta PUT para que el Admin revise
// URL: PUT /api/v1/verification/review/2 (donde 2 es el ID del docente)
router.put('/review/:docenteId', protegerRuta, esAdmin, revisarPostulacion);

export default router;