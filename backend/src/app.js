import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Carga las variables de .env

// --- [NUEVO] Importa los módulos 'path' y 'url' ---
import path from 'path';
import { fileURLToPath } from 'url';

// Importamos nuestras rutas
import rutasAuth from './api/auth/auth.routes.js';
import rutasUsuarios from './api/users/users.routes.js';
import rutasVerificacion from './api/verification/verification.routes.js';
import rutasHorarios from './api/schedules/schedules.routes.js';
import rutasDocentes from './api/docentes/docentes.routes.js';
import rutasPlanes from './api/planes/planes.routes.js';
import rutasLotes from './api/lotes/lotes.routes.js';
import rutasInscripciones from './api/inscripciones/inscripciones.routes.js';
import rutasPagos from './api/pagos/pagos.routes.js';
import rutasReseñas from './api/resenas/resenas.routes.js';
import rutasTaxonomia from './api/taxonomia/taxonomia.routes.js';
import rutasAdmin from './api/admin/admin.routes.js';
import rutasDashboard from './api/dashboard/dashboard.routes.js'; // <-- ¡IMPORTACIÓN AÑADIDA!
import catalogoRoutes from './api/catalogo/catalogo.routes.js'; // Ajusta la ruta según donde esté tu app.js

const app = express();

// --- Middlewares Esenciales ---
app.use(cors());
app.use(express.json());

// --- Definición de Rutas API ---
app.use('/api/v1/auth', rutasAuth);
app.use('/api/v1/users', rutasUsuarios);
app.use('/api/v1/verification', rutasVerificacion);
app.use('/api/v1/schedules', rutasHorarios);
app.use('/api/v1/docentes', rutasDocentes);
app.use('/api/v1/planes', rutasPlanes);
app.use('/api/v1/lotes', rutasLotes);
app.use('/api/v1/inscripciones', rutasInscripciones);
app.use('/api/v1/pagos', rutasPagos);
app.use('/api/v1/resenas', rutasReseñas);
app.use('/api/v1/taxonomia', rutasTaxonomia);
app.use('/api/v1/admin', rutasAdmin);
app.use('/api/v1/dashboard', rutasDashboard); // <-- ¡REGISTRO AÑADIDO!
app.use('/api/v1/catalogos', catalogoRoutes);

// --- [CORREGIDO] Servir archivos estáticos ---

// 1. Esto es necesario para que __dirname funcione con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Le decimos a Express que sirva estáticamente la carpeta 'uploads'
// que está en el directorio raíz del backend (un nivel "arriba" de 'src')
// usando una RUTA ABSOLUTA.
// path.join(__dirname, '..', 'uploads') se traduce en: .../backend/uploads
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/files', express.static(uploadsPath));

// ---------------------------------------------

app.get('/', (req, res) => {
  res.send('El servidor backend está funcionando correctamente 🚀');
});

export default app;