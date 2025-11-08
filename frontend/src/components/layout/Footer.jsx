import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // Importa el CSS Art Pop mejorado
// [NUEVO] Importa los iconos sociales
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';

/**
 * Footer global de la aplicación con diseño "AKdémico Art Pop".
 * [MEJORA] Añadidos iconos sociales y efectos hover refinados.
 */
const Footer = () => {
  return (
    <footer className="footer-akademic"> 
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
          
          {/* [NUEVO] Iconos de Redes Sociales */}
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
        
        {/* Enlaces (sin cambios de estructura) */}
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