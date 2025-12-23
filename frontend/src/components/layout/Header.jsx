import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';
import {
  FaChalkboardTeacher, FaUser, FaSignInAlt, FaSignOutAlt,
  FaPlus, FaBars, FaTimes, FaGraduationCap, FaChartLine,
  FaHome, FaChevronDown, FaBook
} from 'react-icons/fa';

/**
 * Header principal rediseñado con navegación dinámica basada en rol del usuario.
 * Estructura: Logo | Botón Inicio | Dropdown dinámico | Perfil | Salir/Registrarse
 */
const Header = () => {
  const { usuario, cerrarSesion, loading } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // DEBUG: Ver qué datos tiene el usuario
  console.log('Usuario actual:', usuario);

  /**
   * Parsea los roles del usuario desde el string retornado por la API
   */
  const parseUserRoles = () => {
    if (!usuario) return { esEstudiante: false, esDocente: false, esAdmin: false };
    
    const rolesString = usuario.roles || '';
    return {
      esEstudiante: rolesString.includes('estudiante'),
      esDocente: rolesString.includes('docente'),
      esAdmin: rolesString.includes('administrador')
    };
  };

  const userRoles = parseUserRoles();

  // Efecto para el scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Efecto para cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    handleLinkClick();
    cerrarSesion();
    navigate('/');
  };

  if (loading) {
    return <header className="header-akademic-placeholder"></header>;
  }

  /**
   * Determina la clase CSS del header según el rol del usuario
   */
  const getHeaderClass = () => {
    if (!usuario) return 'header-public';
    if (userRoles.esAdmin) return 'header-admin';

    if (userRoles.esEstudiante && userRoles.esDocente) return 'header-ambos';
    if (userRoles.esDocente) return 'header-docente';
    if (userRoles.esEstudiante) return 'header-estudiante';

    return 'header-public';
  };

  /**
   * Determina si el usuario debe ver el dropdown de roles
   */
  const shouldShowDropdown = () => {
    if (!usuario) {
      // TESTING: Mostrar dropdown incluso sin usuario para ver el diseño
      return true;
    }
    if (usuario.rol === 'administrador') return false;
    return usuario.esEstudiante || usuario.esDocente;
  };

  /**
   * Renderiza el contenido del dropdown según el rol del usuario
   */
  const renderDropdownContent = () => {
    // TESTING: Si no hay usuario, mostrar ambos roles como ejemplo
    if (!usuario) {
      return (
        <>
          <div className="header-dropdown-section">
            <div className="header-dropdown-section-title">
              <FaGraduationCap style={{ marginRight: '0.5rem' }} /> Como Estudiante
            </div>
            <NavLink
              to="/estudiante/cursos"
              className="header-dropdown-item"
              onClick={handleLinkClick}
            >
              <FaBook /> Mis Cursos
            </NavLink>
            <NavLink
              to="/estudiante/progreso"
              className="header-dropdown-item"
              onClick={handleLinkClick}
            >
              <FaChartLine /> Mi Progreso
            </NavLink>
          </div>

          <div className="header-dropdown-section">
            <div className="header-dropdown-section-title">
              <FaChalkboardTeacher style={{ marginRight: '0.5rem' }} /> Como Docente
            </div>
            <NavLink
              to="/docente/dashboard"
              className="header-dropdown-item"
              onClick={handleLinkClick}
            >
              <FaChalkboardTeacher /> Mi Panel
            </NavLink>
            <NavLink
              to="/docente/mis-cursos"
              className="header-dropdown-item"
              onClick={handleLinkClick}
            >
              <FaBook /> Mis Lotes
            </NavLink>
          </div>
        </>
      );
    }

    // Cuando el usuario SÍ existe
    const tieneAmbosRoles = userRoles.esEstudiante && userRoles.esDocente;

    if (tieneAmbosRoles) {
      return (
        <>
          <div className="header-dropdown-section">
            <div className="header-dropdown-section-title">
              <FaGraduationCap style={{ marginRight: '0.5rem' }} /> Como Estudiante
            </div>
            <NavLink
              to="/estudiante/cursos"
              className="header-dropdown-item"
              onClick={handleLinkClick}
            >
              <FaBook /> Mis Cursos
            </NavLink>
            <NavLink
              to="/estudiante/progreso"
              className="header-dropdown-item"
              onClick={handleLinkClick}
            >
              <FaChartLine /> Mi Progreso
            </NavLink>
          </div>

          <div className="header-dropdown-section">
            <div className="header-dropdown-section-title">
              <FaChalkboardTeacher style={{ marginRight: '0.5rem' }} /> Como Docente
            </div>
            <NavLink
              to="/docente/dashboard"
              className="header-dropdown-item"
              onClick={handleLinkClick}
            >
              <FaChalkboardTeacher /> Mi Panel
            </NavLink>
            <NavLink
              to="/docente/mis-cursos"
              className="header-dropdown-item"
              onClick={handleLinkClick}
            >
              <FaBook /> Mis Lotes
            </NavLink>
          </div>
        </>
      );
    } else if (userRoles.esEstudiante) {
      return (
        <div className="header-dropdown-section">
          <div className="header-dropdown-section-title">
            <FaGraduationCap style={{ marginRight: '0.5rem' }} /> Estudiante
          </div>
          <NavLink
            to="/estudiante/cursos"
            className="header-dropdown-item"
            onClick={handleLinkClick}
          >
            <FaBook /> Mis Cursos
          </NavLink>
          <NavLink
            to="/estudiante/progreso"
            className="header-dropdown-item"
            onClick={handleLinkClick}
          >
            <FaChartLine /> Mi Progreso
          </NavLink>
        </div>
      );
    } else if (userRoles.esDocente) {
      return (
        <div className="header-dropdown-section">
          <div className="header-dropdown-section-title">
            <FaChalkboardTeacher style={{ marginRight: '0.5rem' }} /> Docente
          </div>
          <NavLink
            to="/docente/dashboard"
            className="header-dropdown-item"
            onClick={handleLinkClick}
          >
            <FaChalkboardTeacher /> Mi Panel
          </NavLink>
          <NavLink
            to="/docente/mis-cursos"
            className="header-dropdown-item"
            onClick={handleLinkClick}
          >
            <FaBook /> Mis Lotes
          </NavLink>
        </div>
      );
    }

    // Si no tiene ningún rol, mostrar mensaje
    return (
      <div className="header-dropdown-section">
        <div className="header-dropdown-section-title">Sin roles asignados</div>
      </div>
    );
  };

  /**
   * Renderiza la navegación desktop
   */
  const renderDesktopNav = () => {
    if (usuario && userRoles.esAdmin) {
      return (
        <nav className="header-nav-desktop">
          <NavLink to="/" className="header-nav-item" onClick={handleLinkClick}>
            <FaHome /> Inicio
          </NavLink>
          <NavLink
            to="/admin/dashboard"
            className="header-nav-item"
            onClick={handleLinkClick}
          >
            <FaChartLine /> Dashboard
          </NavLink>
        </nav>
      );
    }

    return (
      <nav className="header-nav-desktop">
        <NavLink to="/" className="header-nav-item" end onClick={handleLinkClick}>
          <FaHome /> Inicio
        </NavLink>

        <div className={`header-dropdown ${isDropdownOpen ? 'open' : ''}`} ref={dropdownRef}>
          <button className={`header-dropdown-toggle ${isDropdownOpen ? 'active' : ''}`} onClick={toggleDropdown}>
            Mi Espacio <FaChevronDown />
          </button>
          <div className="header-dropdown-menu">{renderDropdownContent()}</div>
        </div>

        {usuario && (
          <NavLink to="/perfil" className="header-nav-item" onClick={handleLinkClick}>
            <FaUser /> Perfil
          </NavLink>
        )}
      </nav>
    );
  };

  /**
   * Renderiza la autenticación desktop
   */
  const renderDesktopAuth = () => {
    if (usuario) {
      return (
        <div className="header-auth-desktop">
          <span className="header-user-welcome">Hola, {usuario.nombre.split(' ')[0]}</span>
          <button onClick={handleLogout} className="btn-akademic btn-secondary">
            <FaSignOutAlt /> Salir
          </button>
        </div>
      );
    }

    return (
      <div className="header-auth-desktop">
        <Link to="/auth/login" onClick={handleLinkClick} className="btn-akademic btn-secondary">
          <FaSignInAlt /> Iniciar Sesión
        </Link>
        <Link
          to="/auth/registro-estudiante"
          onClick={handleLinkClick}
          className="btn-akademic btn-primary"
        >
          <FaPlus /> Registrarse
        </Link>
      </div>
    );
  };

  /**
   * Renderiza la navegación móvil
   */
  const renderMobileNav = () => {
    if (usuario && usuario.rol === 'administrador') {
      return (
        <nav className="header-nav-mobile">
          <NavLink to="/" className="header-nav-item-mobile" onClick={handleLinkClick}>
            <FaHome /> Inicio
          </NavLink>
          <NavLink
            to="/admin/dashboard"
            className="header-nav-item-mobile"
            onClick={handleLinkClick}
          >
            <FaChartLine /> Dashboard
          </NavLink>
        </nav>
      );
    }

    return (
      <nav className="header-nav-mobile">
        <NavLink to="/" className="header-nav-item-mobile" end onClick={handleLinkClick}>
          <FaHome /> Inicio
        </NavLink>

        <div className={`header-dropdown-mobile ${isDropdownOpen ? 'open' : ''}`}>
          <button className="header-nav-item-mobile" onClick={toggleDropdown}>
            Mi Espacio <FaChevronDown style={{ marginLeft: 'auto' }} />
          </button>
          <div className="header-dropdown-menu-mobile">{renderDropdownContent()}</div>
        </div>

        {usuario && (
          <NavLink to="/perfil" className="header-nav-item-mobile" onClick={handleLinkClick}>
            <FaUser /> Perfil
          </NavLink>
        )}
      </nav>
    );
  };

  /**
   * Renderiza la autenticación móvil
   */
  const renderMobileAuth = () => {
    if (usuario) {
      return (
        <div className="header-auth-mobile">
          <span className="header-user-welcome">Hola, {usuario.nombre.split(' ')[0]}</span>
          <button onClick={handleLogout} className="btn-akademic btn-secondary">
            <FaSignOutAlt /> Salir
          </button>
        </div>
      );
    }

    return (
      <div className="header-auth-mobile">
        <Link to="/auth/login" onClick={handleLinkClick} className="btn-akademic btn-secondary">
          <FaSignInAlt /> Iniciar Sesión
        </Link>
        <Link
          to="/auth/registro-estudiante"
          onClick={handleLinkClick}
          className="btn-akademic btn-primary"
        >
          <FaPlus /> Registrarse
        </Link>
      </div>
    );
  };

  return (
    <>
      <header
        className={`header-akademic ${getHeaderClass()} ${
          isScrolled ? 'header-scrolled' : ''
        }`}
      >
        <div className="header-nav-container">
          <Link to="/" className="header-logo-brand" onClick={handleLinkClick}>
            <img src="/logo/logo1.png" alt="AKdémico Logo" />
            <span className="header-logo-text">AKdemico</span>
          </Link>

          <div className="header-desktop-content">
            {renderDesktopNav()}
            {renderDesktopAuth()}
          </div>

          <button
            className="header-mobile-toggle"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="header-mobile-menu">
            {renderMobileNav()}
            {renderMobileAuth()}
          </div>
        )}
      </header>

      <div className="header-akademic-placeholder"></div>
    </>
  );
};

export default Header;