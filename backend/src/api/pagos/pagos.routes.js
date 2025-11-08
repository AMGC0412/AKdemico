import { Router } from 'express';
// --- ASEGÚRATE DE IMPORTAR LAS TRES FUNCIONES ---
import { subirComprobante, validarPago, obtenerEstadoPagoInscripcion, obtenerPagosPendientesDocente } from './pagos.controller.js';
// -----------------------------------------------
import { protegerRuta } from '../../middleware/auth.middleware.js';
import { esEstudiante } from '../../middleware/role.middleware.js';
import { esDocente } from '../../middleware/role.middleware.js';
import { uploadComprobante } from '../../middleware/uploader.middleware.js'; // El uploader específico para pagos

const router = Router();

// --- RUTA ESTUDIANTE: Subir o actualizar comprobante ---
// URL: POST /api/v1/pagos/upload/:inscripcionId
// Protegida, solo Estudiantes, usa el middleware 'uploadComprobante'
router.post('/upload/:inscripcionId',
  protegerRuta,
  esEstudiante,
  uploadComprobante, // Procesa el archivo 'comprobante' ANTES del controlador
  subirComprobante
);

// --- RUTA DOCENTE: Validar o rechazar un pago ---
// URL: PUT /api/v1/pagos/validate/:pagoId
// Protegida, solo Docentes
router.put('/validate/:pagoId',
  protegerRuta,
  esDocente,
  validarPago
);

// --- RUTA ESTUDIANTE: Obtener estado del pago para una inscripción ---
// URL: GET /api/v1/pagos/estado/inscripcion/:inscripcionId
// Protegida, solo Estudiantes
router.get('/estado/inscripcion/:inscripcionId',
    protegerRuta,
    esEstudiante,
    obtenerEstadoPagoInscripcion
);

// --- AÑADIR ESTA RUTA ---
// GET /api/v1/pagos/pendientes (Lista de pagos para el docente)
router.get('/pendientes',
    protegerRuta,
    esDocente, // Solo los docentes pueden ver esto
    obtenerPagosPendientesDocente
);
export default router;