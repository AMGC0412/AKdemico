import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- Constantes ---
const MAX_FILE_SIZE_MB_VERIFICACION = 5;
const MAX_FILE_SIZE_BYTES_VERIFICACION = MAX_FILE_SIZE_MB_VERIFICACION * 1024 * 1024;
const MAX_FILE_SIZE_MB_PAGO = 2;
const MAX_FILE_SIZE_BYTES_PAGO = MAX_FILE_SIZE_MB_PAGO * 1024 * 1024;

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no válido. Solo PDF, JPG o PNG.'), false);
    }
};

// --- Configuración #1: Docentes (Sin cambios) ---
const storageVerificacion = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.usuario?.id?.toString() || 'unknown_user';
        const fieldName = file.fieldname || 'misc';
        const uploadPath = path.join('uploads', userId, fieldName);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const nombreArchivo = `${Date.now()}-${file.originalname}`;
        cb(null, nombreArchivo);
    }
});

export const upload = multer({
    storage: storageVerificacion,
    fileFilter: fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES_VERIFICACION }
});

// --- Configuración #2: Pagos (CORREGIDO) ---
const pagosUploadPath = 'uploads/pagos/';
fs.mkdirSync(pagosUploadPath, { recursive: true });

const storagePagos = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pagosUploadPath);
    },
    filename: (req, file, cb) => {
        // [CORRECCIÓN CLAVE]: Nombre ESTÁTICO basado en el ID.
        // Ejemplo: comprobante-14.jpg
        // Si suben otro .jpg, se sobrescribe automáticamente.
        const inscripcionId = req.params.inscripcionId;
        const fileExtension = path.extname(file.originalname); 
        
        // Sin Date.now() para evitar acumulación
        const nombreUnico = `comprobante-${inscripcionId}${fileExtension}`;
        cb(null, nombreUnico);
    }
});

export const uploadComprobante = multer({
    storage: storagePagos,
    fileFilter: fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES_PAGO }
}).single('comprobante');