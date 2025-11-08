import React from 'react';
// [ARREGLADO] Importamos 'Navigate' para la redirección del admin
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Layouts Principales ---
import Header from './components/layout/Header.jsx'; 
import Footer from './components/layout/Footer.jsx';
import AuthPageLayout from './pages/Auth/AuthPageLayout.jsx'; 
import AdminLayout from './components/layout/AdminLayout.jsx'; // <-- El layout del Admin

// --- Admin ---
import AdminDashboardPage from './pages/Admin/AdminDashboardPage.jsx';
import AdminVerificationPage from './pages/Admin/AdminVerificationPage.jsx';
import AdminTaxonomiaPage from './pages/Admin/AdminTaxonomiaPage.jsx';
import AdminUserManagementPage from './pages/Admin/AdminUserManagementPage.jsx';
import AdminModeracionPage from './pages/Admin/AdminModeracionPage.jsx';

import AdminTestCenterPage from './components/admin/testcenter/AdminTestCenterPage.jsx';

// --- Guardias de Ruta (Seguridad) ---
import RutaProtegida from './components/common/RutaProtegida.jsx';
import RutaDocente from './components/common/RutaDocente.jsx';
import RutaAdmin from './components/common/RutaAdmin.jsx'; // <-- El guardia del Admin

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
import DocenteHorariosPage from './pages/Docente/DocenteHorariosPage.jsx';
import ProfilePage from './pages/Perfil/ProfilePage.jsx';

const PaginaMisInscripciones = () => {
    return (
        <div style={{ padding: '3rem', color: 'white' }}>
            <h2>Mis Inscripciones (Pendiente)</h2>
            <p>Aquí se mostrará una lista de los cursos a los que el estudiante se ha inscrito.</p>
        </div>
    );
};

// --- Placeholders del Panel de Admin (para probar) ---
const AdminDashboardPlaceholder = () => <h1 style={{color: 'white'}}>Dashboard Admin (Página Pendiente)</h1>;
const AdminUsuariosPlaceholder = () => <h1 style={{color: 'white'}}>Gestión de Usuarios (Página Pendiente)</h1>;
const AdminVerifPlaceholder = () => <h1 style={{color: 'white'}}>Cola de Verificación (Página Pendiente)</h1>;
const AdminTaxonomiaPlaceholder = () => <h1 style={{color: 'white'}}>Gestión de Taxonomía (Página Pendiente)</h1>;
const AdminModeracionPlaceholder = () => <h1 style={{color: 'white'}}>Panel de Moderación (Página Pendiente)</h1>;


function App() {

  return (
    <Router>
      <Header />
      
      <div className="app-container">
        <Routes>
          
          {/* --- 1. Rutas Públicas --- */}
          <Route path="/" element={<HomePage />} />
          
          {/* [RUTA MOVIDA] Búsqueda y Detalle ahora son públicos */}
          <Route path="/buscar" element={<CourseSearchPage />} />
          <Route path="/cursos/:cursoId" element={<CourseDetailPage />} />


          {/* --- 2. Flujo de Autenticación (Público) --- */}
          <Route path="/auth" element={<AuthPageLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="registro-estudiante" element={<RegisterPage mode="estudiante" />} />
            <Route path="registro-docente" element={<RegisterPage mode="docente" />} />
          </Route>
          
          {/* --- 3. Ruta de Creación de Admin (Pública pero Secreta) --- */}
          <Route path="/registro-admin-secreto" element={<AdminRegisterPage />} />
          
          
          {/* --- 4. Rutas Protegidas (Requieren Login) --- */}
          <Route element={<RutaProtegida />}>
            
            {/* a) Rutas para TODOS los usuarios logueados */}
            {/* 'buscar' y 'cursos/:cursoId' se movieron a públicas */}
            <Route path="/subir-pago/:inscripcionId" element={<PaymentUploadPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/mis-inscripciones" element={<PaginaMisInscripciones />} />

            {/* b) Rutas anidadas solo para DOCENTES */}
            <Route element={<RutaDocente />}>
              <Route path="/docente/dashboard" element={<DocenteDashboardPage />} />
              <Route path="/docente/verificacion" element={<DocenteVerificacionPage />} />
              <Route path="/docente/cursos" element={<MisCursosPage />} />
              <Route path="/docente/planes/crear" element={<CrearPlanPage />} />
              <Route path="/docente/lotes/crear" element={<CrearLotePage />} />  
              <Route path="/docente/planes/editar/:planId" element={<EditarPlanPage />} />          
              <Route path="/docente/lotes/editar/:loteId" element={<EditarLotePage />} />
              <Route path="/docente/pagos" element={<DocentePagosPage />} />
              <Route path="/docente/horarios" element={<DocenteHorariosPage />} />
            </Route>

            {/* c) Rutas anidadas solo para ADMINISTRADORES */}
            <Route element={<RutaAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                {/* La ruta 'index' redirige /admin a /admin/dashboard */}
                <Route index element={<Navigate to="dashboard" replace />} />
                
                {/* Usamos los placeholders para probar */}
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="usuarios" element={<AdminUserManagementPage />} />
                <Route path="verificaciones" element={<AdminVerificationPage />} />
                <Route path="taxonomia" element={<AdminTaxonomiaPage />} />
                <Route path="moderacion" element={<AdminModeracionPage />} />
                <Route path="pruebas" element={<AdminTestCenterPage />} /> 
              </Route>
            </Route>
            
          </Route> {/* Fin de RutaProtegida */}

        </Routes>
      </div>
      
      <Footer /> 
    </Router>
  );
}

export default App;