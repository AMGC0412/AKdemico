import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import './AuthPageLayout.css'; // Importa el NUEVO CSS Art Pop

/**
 * Layout para la página de autenticación unificada.
 * [MEJORA] Actualizado al estilo Art Pop de AKdémico.
 */
const AuthPageLayout = () => {
  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        
        {/* --- [NUEVO] Logo y Marca (Consistente con Header/Footer) --- */}
        <Link to="/" className="auth-logo-brand">
            <img src="/logo/logo1.png" alt="AKdémico Logo" />
            <span className="auth-logo-text">AKdémico</span>
        </Link>
        
        {/* --- Pestañas de Navegación --- */}
        <nav className="auth-nav-links">
          <NavLink to="/auth/login">
            Iniciar Sesión
          </NavLink>
          <NavLink to="/auth/registro-estudiante">
            Soy Estudiante
          </NavLink>
          <NavLink to="/auth/registro-docente">
            Soy Docente
          </NavLink>
        </nav>
        
        {/* --- Contenedor del Formulario --- */}
        <div className="auth-form-content">
          {/* Aquí React Router renderizará LoginPage o RegisterPage */}
          <Outlet />
        </div>
        
      </div>
    </div>
  );
};

export default AuthPageLayout;