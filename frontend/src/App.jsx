import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; 

// --- Layouts Principales ---
import Header from './components/layout/Header.jsx'; 
import Footer from './components/layout/Footer.jsx';
import AuthPageLayout from './pages/Auth/AuthPageLayout.jsx'; 
import AdminLayout from './components/layout/AdminLayout.jsx'; 

// --- Admin Pages ---
import AdminDashboardPage from './pages/Admin/AdminDashboardPage.jsx';
import AdminVerificationPage from './pages/Admin/AdminVerificationPage.jsx';
import AdminTaxonomiaPage from './pages/Admin/AdminTaxonomiaPage.jsx';
import AdminUserManagementPage from './pages/Admin/AdminUserManagementPage.jsx';
import AdminModeracionPage from './pages/Admin/AdminModeracionPage.jsx';
import AdminTestCenterPage from './components/admin/testcenter/AdminTestCenterPage.jsx';

// --- Guardias de Ruta (Seguridad) ---
import RutaProtegida from './components/common/RutaProtegida.jsx';
import RutaDocente from './components/common/RutaDocente.jsx';
import RutaAdmin from './components/common/RutaAdmin.jsx'; 

// --- Páginas de Autenticación ---
import LoginPage from './pages/Auth/LoginPage.jsx';
import RegisterPage from './pages/Auth/RegisterPage.jsx';
import AdminRegisterPage from './pages/Auth/AdminRegisterPage.jsx';

// --- Páginas Públicas y Genéricas ---
import HomePage from './pages/Home/HomePage.jsx';
import CourseSearchPage from './pages/Search/CourseSearchPage.jsx'; 
import CourseDetailPage from './pages/CourseDetail/CourseDetailPage.jsx';
import PaymentUploadPage from './pages/Payment/PaymentUploadPage.jsx';

// --- Páginas de Docente ---
import DocenteDashboardPage from './pages/Docente/DocenteDashboardPage.jsx';
import DocenteVerificacionPage from './pages/Docente/DocenteVerificacionPage.jsx';
import MisCursosPage from './pages/Docente/MisCursosPage.jsx';
import CrearPlanPage from './pages/Docente/CrearPlanPage.jsx';
import CrearLotePage from './pages/Docente/CrearLotePage.jsx';
import EditarPlanPage from './pages/Docente/EditarPlanPage.jsx';
import EditarLotePage from './pages/Docente/EditarLotePage.jsx';
import DocentePagosPage from './pages/Docente/DocentePagosPage.jsx';
import DocenteHorariosPage from './pages/Docente/DocenteCalendarPage.jsx';

// --- Perfil y Estudiante ---
import ProfilePage from './pages/Perfil/ProfilePage.jsx';
import MisInscripcionesPage from './pages/Estudiante/MisInscripcionesPage.jsx';
import CalendarioPage from './pages/Estudiante/CalendarioPage.jsx';

/**
 * Componente de Redirección de Perfil
 * Redirige /perfil (sin ID) a /perfil/:userId (con el ID del usuario logueado)
 */
const MyProfileRedirect = () => {
  const { usuario } = useAuth();
  
  if (!usuario || !usuario.id) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Redirige al perfil del usuario logueado
  return <Navigate to={`/perfil/${usuario.id}`} replace />;
};

/**
 * Componente para Estudiante progreso/seguimiento
 * Puedes crear esta página o usar la que ya exista
 */
const EstudianteProgresoPage = () => {
  // TODO: Implementar página de progreso del estudiante
  return <div style={{ padding: '2rem', textAlign: 'center' }}>Página de Progreso en construcción</div>;
};

function App() {
  return (
    <Router>
      <Header />
      
      <div className="app-container">
        <Routes>
          
          {/* =========================================
              1. RUTAS PÚBLICAS
             ========================================= */}
          <Route path="/" element={<HomePage />} />
          <Route path="/buscar" element={<CourseSearchPage />} />
          <Route path="/cursos/:cursoId" element={<CourseDetailPage />} />

          
          {/* =========================================
              2. FLUJO DE AUTENTICACIÓN (PÚBLICO)
             ========================================= */}
          <Route path="/auth" element={<AuthPageLayout />}>
            <Route path="login" element={<LoginPage />} />
            {/* Registro Unificado - permite elegir rol (estudiante, docente o ambos) */}
            <Route path="registro" element={<RegisterPage />} />
          </Route>
          
          {/* Ruta de Creación de Admin (Secreta) */}
          <Route path="/registro-admin-secreto" element={<AdminRegisterPage />} />
          
          
          {/* =========================================
              3. RUTAS PROTEGIDAS (REQUIEREN LOGIN)
             ========================================= */}
          <Route element={<RutaProtegida />}>
            
            {/* --- a) Rutas Comunes (Todos los roles) --- */}
            
            {/* Subida de pagos */}
            <Route path="/subir-pago/:inscripcionId" element={<PaymentUploadPage />} />
            
            {/* Perfil de Usuario (Unificado) */}
            <Route path="/perfil" element={<MyProfileRedirect />} />
            <Route path="/perfil/:userId" element={<ProfilePage />} />
            
            {/* --- b) Rutas de ESTUDIANTE --- */}
            <Route path="/estudiante/cursos" element={<MisInscripcionesPage />} />
            <Route path="/estudiante/progreso" element={<EstudianteProgresoPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />

            {/* --- c) Rutas exclusivas para DOCENTES --- */}
            <Route element={<RutaDocente />}>
              <Route path="/docente/dashboard" element={<DocenteDashboardPage />} />
              <Route path="/docente/verificacion" element={<DocenteVerificacionPage />} />
              
              {/* Gestión de Cursos y Planes */}
              <Route path="/docente/mis-cursos" element={<MisCursosPage />} />
              <Route path="/docente/cursos" element={<CrearPlanPage />} />
              <Route path="/docente/planes/crear" element={<MisCursosPage />} />
              <Route path="/docente/lotes/crear" element={<CrearLotePage />} />  
              <Route path="/docente/planes/editar/:planId" element={<EditarPlanPage />} />          
              <Route path="/docente/lotes/editar/:loteId" element={<EditarLotePage />} />
              
              {/* Gestión Administrativa Docente */}
              <Route path="/docente/pagos" element={<DocentePagosPage />} />
              <Route path="/docente/horarios" element={<DocenteHorariosPage />} />
            </Route>


            {/* --- d) Rutas exclusivas para ADMINISTRADORES --- */}
            <Route element={<RutaAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                
                {/* Herramientas de Administración */}
                <Route path="usuarios" element={<AdminUserManagementPage />} />
                <Route path="verificaciones" element={<AdminVerificationPage />} />
                <Route path="taxonomia" element={<AdminTaxonomiaPage />} />
                <Route path="moderacion" element={<AdminModeracionPage />} />
                <Route path="pruebas" element={<AdminTestCenterPage />} /> 
              </Route>
            </Route>
            
          </Route> {/* Fin de RutaProtegida */}

          {/* =========================================
              4. RUTAS DE FALLBACK (404)
             ========================================= */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </div>
      
      <Footer /> 
    </Router>
  );
}

export default App;