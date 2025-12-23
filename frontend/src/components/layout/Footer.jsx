/* Archivo: Footer.jsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importamos el contexto para saber el rol
import './Footer.css'; // Importa los estilos actualizados
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';

/**
 * Footer global de la aplicación.
 * [MEJORA] Ahora cambia su color de fondo dinámicamente según el rol del usuario,
 * igual que el Header.
 */
const Footer = () => {
  const { usuario } = useAuth();

  // Determinamos la clase base según el rol para el color de fondo
  let footerClass = 'footer-akademic footer-role-public'; // Por defecto
  
  if (usuario) {
    if (usuario.rol === 'administrador') {
        footerClass = 'footer-akademic footer-role-administrador';
    } else if (usuario.rol === 'docente') {
        footerClass = 'footer-akademic footer-role-docente';
    } else if (usuario.rol === 'estudiante') {
        footerClass = 'footer-akademic footer-role-estudiante';
    }
  }

  return (
    <footer className={footerClass}> 
      <div className="footer-content">
        
        {/* Columna de Marca */}
        <div className="footer-brand-column">
          <Link to="/" className="footer-logo-brand">
            <img src="/logo/logo1.png" alt="AKdémico Logo" />
            <span className="footer-logo-text">AKdémico</span>
          </Link>
          <p>
            Plataforma de conexión para clases particulares y grupales. 
            Encuentra docentes verificados y gestiona tus reservas en un solo lugar.
          </p>
          
          <div className="footer-social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <FaYoutube />
            </a>
          </div>
        </div>
        
        {/* Enlaces */}
        <div className="footer-links">
          <h4>Cursos</h4>
          <Link to="/buscar?categoria=matematicas">Matemáticas</Link>
          <Link to="/buscar?categoria=ciencia">Ciencias</Link>
          <Link to="/buscar?categoria=tecnologia">Tecnología</Link>
          <Link to="/buscar?categoria=ingenieria">Ingeniería</Link>
        </div>
        
        <div className="footer-links">
          <h4>Recursos</h4>
          <Link to="/blog">Blog Académico</Link>
          <Link to="/tutoriales">Tutoriales</Link>
          <Link to="/faq">Preguntas Frecuentes</Link>
        </div>
        
        <div className="footer-links">
          <h4>Empresa</h4>
          <Link to="/nosotros">Sobre Nosotros</Link>
          
          <Link to="/auth/registro-docente" className="footer-cta-link">
            Enseña con Nosotros
          </Link>
          
          <Link to="/privacidad">Privacidad</Link>
          <Link to="/terminos">Términos</Link>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} AKdémico. Todos los derechos reservados.</p>
        
        <div className="footer-admin-login">
          <Link to="/registro-admin-secreto">Administración</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;