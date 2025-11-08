import multer from 'multer';
import path from 'path'; // Módulo de Node.js para manejar rutas de archivos
import fs from 'fs'; // Módulo de Node.js para manejar el sistema de archivos

// --- Constantes ---
const MAX_FILE_SIZE_MB_VERIFICACION = 5;
const MAX_FILE_SIZE_BYTES_VERIFICACION = MAX_FILE_SIZE_MB_VERIFICACION * 1024 * 1024;
const MAX_FILE_SIZE_MB_PAGO = 2;
const MAX_FILE_SIZE_BYTES_PAGO = MAX_FILE_SIZE_MB_PAGO * 1024 * 1024;

// --- Filtro de Archivos (Genérico) ---
// Define qué tipos de archivos se aceptan (PDF e imágenes)
const fileFilter = (req, file, cb) => {
    // Aceptamos solo PDFs e imágenes comunes
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/gif') {
        cb(null, true); // Aceptar el archivo
    } else {
        // Rechazar el archivo con un error específico
        cb(new Error('Formato de archivo no válido. Solo se aceptan PDF, JPG, PNG o GIF.'), false);
    }
};

// --- Configuración #1: Almacenamiento para Verificación de Docentes ---
// Guarda archivos en carpetas separadas por docente e ID de campo (cv, dni, titulo)
const storageVerificacion = multer.diskStorage({
    destination: (req, file, cb) => {
        // Asegúrate de que 'req.usuario.id' esté disponible (viene del middleware 'protegerRuta')
        const userId = req.usuario?.id?.toString() || 'unknown_user';
        const fieldName = file.fieldname || 'misc'; // cv, dni, titulo
        const uploadPath = path.join('uploads', userId, fieldName);

        // Crear la carpeta si no existe (de forma asíncrona es más seguro, pero sync es más simple aquí)
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Nombre de archivo único con timestamp para evitar colisiones
        const nombreArchivo = `${Date.now()}-${file.originalname}`;
        cb(null, nombreArchivo);
    }
});

// Middleware Multer #1: Para Verificación de Docentes
// Espera múltiples campos definidos en las rutas (ej: upload.fields([...]))
export const upload = multer({
    storage: storageVerificacion,
    fileFilter: fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES_VERIFICACION } // Límite de 5MB
});

// --- Configuración #2: Almacenamiento para Comprobantes de Pago ---
// Guarda todos los comprobantes en una única carpeta 'uploads/pagos/'
const pagosUploadPath = 'uploads/pagos/';
// Asegurarse de que la carpeta exista al iniciar el servidor
fs.mkdirSync(pagosUploadPath, { recursive: true });

const storagePagos = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pagosUploadPath); // Todos los archivos a la misma carpeta
    },
    filename: (req, file, cb) => {
        // Nombre de archivo único que incluye el ID de inscripción (de la URL) y timestamp
        const inscripcionId = req.params.inscripcionId || 'id_desconocido';
        const fileExtension = path.extname(file.originalname); // Obtener la extensión original
        const nombreUnico = `comprobante-${inscripcionId}-${Date.now()}${fileExtension}`;
        cb(null, nombreUnico);
    }
});

// Middleware Multer #2: Para Comprobantes de Pago
// Espera un único archivo llamado 'comprobante'
export const uploadComprobante = multer({
    storage: storagePagos,
    fileFilter: fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES_PAGO } // Límite de 2MB
}).single('comprobante'); // Usa .single() para un solo archivo