import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
    FaTachometerAlt, FaUsers, FaShieldAlt, FaTags, 
    FaGavel, FaArrowLeft, FaSignOutAlt, FaCircle
} from 'react-icons/fa';
import './AdminLayout.css';

// Estructura de navegación para el menú
const adminNav = [
    { to: 'dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { to: 'usuarios', icon: <FaUsers />, label: 'Gestión de Usuarios' },
    { to: 'verificaciones', icon: <FaShieldAlt />, label: 'Verificación Docentes' },
    { to: 'taxonomia', icon: <FaTags />, label: 'Taxonomía (Catálogos)' },
    { to: 'moderacion', icon: <FaGavel />, label: 'Moderación' },
];

const AdminLayout = () => {
    const location = useLocation();

    return (
        // Contenedor principal con fondo técnico
        <div className="admin-layout-wrapper">
            
            {/* Sidebar de Navegación */}
            <div className="admin-sidebar">
                
                <header className="admin-sidebar-header">
                    <h3>CENTRO DE MANDO</h3>
                    <p className="system-status"><FaCircle className="status-indicator"/> SISTEMA ACTIVO</p>
                </header>

                <nav className="admin-nav-links">
                    {adminNav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                
                <footer className="admin-sidebar-footer">
                    <a href="/" className="admin-footer-link back-to-site">
                        <FaArrowLeft /> VOLVER AL SITIO PÚBLICO
                    </a>
                    {/* Placeholder para LogOut o Información de Sesión */}
                    <a href="/logout" className="admin-footer-link logout-btn">
                        <FaSignOutAlt /> TERMINAR SESIÓN
                    </a>
                </footer>
            </div>
            
            {/* Área de Contenido Principal (Renderiza Dashboard, TGI, etc.) */}
            <div className="admin-content-area">
                {/* Router Outlet para renderizar la página actual */}
                <div className="admin-content-overlay"></div> {/* Capa de Glassmorphism sutil */}
                <Outlet />
            </div>
            
        </div>
    );
};

export default AdminLayout;