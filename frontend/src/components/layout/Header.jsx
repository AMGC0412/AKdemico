import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import './Header.css'; // Asegúrate de que esta ruta sea correcta para el CSS
import { 
    FaChalkboardTeacher, FaUser, FaSignInAlt, FaSignOutAlt, 
    FaPlus, FaBars, FaTimes, FaGraduationCap, FaTools, FaHome, FaChartLine 
} from 'react-icons/fa';

/**
 * Header principal de la aplicación con diseño "Art Pop" inspirado en la mascota AKdémico.
 * Estructurado para manejar la navegación basada en el rol del usuario.
 */
const Header = () => {
  const { usuario, cerrarSesion, loading } = useAuth();
  const navigate = useNavigate(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // --- Efecto para manejar el scroll del Header (Header-scrolled) ---
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLinkClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  /**
   * Cierra la sesión y redirige al homepage.
   */
  const handleLogout = () => {
    handleLinkClick(); 
    cerrarSesion();
    navigate('/'); 
  };

  if (loading) {
    // Usamos el nuevo placeholder
    return <header className="header-akademic-placeholder"></header>;
  }

  /**
   * Renderiza los enlaces principales de navegación según el rol del usuario.
   */
  const renderNavLinksByRole = (isMobile = false) => {
    const navClassName = isMobile ? "header-nav-links-mobile" : "header-nav-links-desktop";
    
    const baseLinks = [
      <NavLink key="inicio" to="/" end onClick={handleLinkClick}>
        <FaHome /> Inicio
      </NavLink>,
      <NavLink key="buscar" to="/buscar" onClick={handleLinkClick}>
        Buscar Cursos
      </NavLink>,
    ];

    if (!usuario) {
      return <nav className={`${navClassName} role-public`}>{baseLinks}</nav>;
    }

    let roleLinks = [];
    let roleClass = '';

    switch (usuario.rol) {
      case 'administrador':
        roleClass = 'role-admin';
        roleLinks = [
          <NavLink key="admin-dash" to="/admin/dashboard" onClick={handleLinkClick}>
            <FaChartLine /> Dashboard
          </NavLink>,
          <NavLink key="admin-tools" to="/admin/tools" onClick={handleLinkClick}>
            <FaTools /> Herramientas
          </NavLink>,
        ];
        break;
        
      case 'docente':
        roleClass = 'role-docente';
        roleLinks = [
          <NavLink key="doc-dash" to="/docente/dashboard" onClick={handleLinkClick}>
            <FaChalkboardTeacher /> Mi Panel
          </NavLink>,
          <NavLink key="mis-cursos" to="/docente/mis-cursos" onClick={handleLinkClick}>
            <FaPlus /> Mis Lotes
          </NavLink>,
        ];
        break;
        
      case 'estudiante':
      default:
        roleClass = 'role-estudiante';
        roleLinks = [
          <NavLink key="mis-inscripciones" to="/estudiante/cursos" onClick={handleLinkClick}>
            <FaGraduationCap /> Mis Cursos
          </NavLink>,
          <NavLink key="perfil" to="/perfil" onClick={handleLinkClick}>
            <FaUser /> Perfil
          </NavLink>,
        ];
        break;
    }
    
    return (
      <nav className={`${navClassName} ${roleClass}`}>
        {baseLinks}
        {roleLinks}
      </nav>
    );
  };

  /**
   * Renderiza los botones de autenticación (Login/Logout)
   */
  const renderAuthLinks = (isMobile = false) => {
    const className = isMobile ? "header-auth-links-mobile" : "header-auth-links-desktop";
    
    if (usuario) {
      return (
        <div className={className}>
          <span className="header-user-welcome">
            Hola, {usuario.nombre.split(' ')[0]}
          </span>
          <button 
            onClick={handleLogout} 
            className="btn-akademic btn-secondary" // Nueva clase Art Pop para botones
          >
            <FaSignOutAlt /> Salir
          </button>
        </div>
      );
    } else {
      return (
        <div className={className}>
          <Link to="/auth/login" onClick={handleLinkClick} className="btn-akademic btn-secondary">
            <FaSignInAlt /> Iniciar Sesión
          </Link>
          <Link to="/auth/registro-estudiante" onClick={handleLinkClick} className="btn-akademic btn-primary">
            <FaPlus /> Registrarse
          </Link>
        </div>
      );
    }
  };

  return (
    <>
      {/* CLASE PRINCIPAL DEL HEADER: "header-akademic" para el nuevo estilo Art Pop */}
      <header className={`header-akademic ${isScrolled ? 'header-scrolled' : ''} ${usuario ? `header-role-${usuario.rol}` : 'header-role-public'}`}>
        <div className="header-nav-container">
          <Link to="/" className="header-logo-brand" onClick={handleLinkClick}>
            {/* Logo de la lechuza */}
            <img src="/logo/logo1.png" alt="AKdémico Logo" /> 
            {/* Texto "AKdémico" con la fuente personalizada */}
            <span className="header-logo-text">AKdemico</span>
          </Link>
          
          <div className="header-desktop-content">
            {renderNavLinksByRole(false)}
            {renderAuthLinks(false)}
          </div>

          <button 
            className="header-mobile-toggle" 
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="header-mobile-menu">
            {renderNavLinksByRole(true)}
            {renderAuthLinks(true)}
          </div>
        )}
      </header>
      
      <div className="header-akademic-placeholder"></div>
    </>
  );
};

export default Header;