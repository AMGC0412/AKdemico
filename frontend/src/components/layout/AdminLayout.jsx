import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { 
    FaTachometerAlt, FaUsers, FaCheckCircle, FaTags, 
    FaGavel, FaSignOutAlt, FaHome 
} from 'react-icons/fa';
import './AdminLayout.css'; // Crearemos este CSS

/**
 * Layout principal para el panel de administración.
 * Incluye un Sidebar (menú lateral) y un área de contenido (<Outlet />)
 * para las páginas anidadas.
 */
const AdminLayout = () => {
  return (
    <div className="admin-layout-container">
      
      {/* --- Sidebar (Menú Lateral) --- */}
      <nav className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h3>Panel de Control</h3>
        </div>
        
        <ul className="admin-nav-links">
          <li>
            <NavLink to="/admin/dashboard">
              <FaTachometerAlt /> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/usuarios">
              <FaUsers /> Usuarios
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/verificaciones">
              <FaCheckCircle /> Verificaciones
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/taxonomia">
              <FaTags /> Taxonomía
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/moderacion">
              <FaGavel /> Moderación
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/pruebas">
              <FaGavel /> Pruebas
            </NavLink>
          </li>
        </ul>
        
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-footer-link">
            <FaHome /> Volver al Sitio
          </Link>
        </div>
      </nav>
      
      {/* --- Área de Contenido Principal --- */}
      <main className="admin-content-area">
        {/* Aquí es donde React Router renderizará las páginas
            (AdminDashboardPage, AdminUserManagementPage, etc.) */}
        <Outlet />
      </main>
      
    </div>
  );
};

export default AdminLayout;