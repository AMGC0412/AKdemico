import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './HomePage.css'; // Importa el CSS de Art Pop
import { 
    FaSearch, FaGraduationCap, FaCalendarCheck, 
    FaComments, FaChalkboardTeacher, FaTimes,
    FaTag, FaUserGraduate, FaClock, FaEye, FaArrowRight, FaSpinner,
    FaRegSadTear, FaExclamationCircle,
    FaCreditCard // [NUEVO] Icono para pagos
} from 'react-icons/fa';

// Importar el servicio de lotes
import * as loteService from '../../services/lote.service'; 

// Banner de Imágenes (Sin cambios)
const bannerImages = [
    '/images/banner/banner_1.png',
    '/images/banner/banner_2.png',
    '/images/banner/banner_3.png',
    '/images/banner/banner_4.png',
    '/images/banner/banner_5.png',
    '/images/banner/banner_6.png',
    '/images/banner/banner_7.png',
    '/images/banner/banner_8.png',
    '/images/banner/banner_9.png',
    '/images/banner/banner_10.png',
    '/images/banner/banner_11.png',
    '/images/banner/banner_12.png',
];

// --- Componente Modal de Vista Rápida (Rediseñado por CSS) ---
const QuickViewModal = ({ curso, onClose }) => {
    const plan = curso.plan || {};
    const docente = curso.docente || {};
    
    const horarioResumen = curso.horario_resumen || 'Horario no definido'; 
    const imagenUrl = plan.imagen_url || `https://placehold.co/600x400/1A52B8/FFFFFF?text=${encodeURIComponent(plan.titulo || 'Curso')}`;

    return (
        <div className="quick-view-modal-overlay" onClick={onClose}>
            <div className="quick-view-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="quick-view-close" onClick={onClose}><FaTimes /></button>
                <div className="quick-view-body">
                    <div className="quick-view-image">
                        <img src={imagenUrl} alt={plan.titulo} />
                    </div>
                    <div className="quick-view-info">
                        <span className="quick-view-category"><FaTag /> {plan.categoria_nombre || 'Categoría'}</span>
                        <h2 className="quick-view-title">{plan.titulo}</h2>
                        <span className="quick-view-price">S/ {parseFloat(curso.precio || 0).toFixed(2)}</span>
                        <p className="quick-view-description">{plan.descripcion}</p>
                        <div className="quick-view-meta">
                            <span><FaUserGraduate /> {docente.nombre || 'Docente'}</span>
                            <span><FaClock /> {horarioResumen}</span>
                        </div>
                        <div className="quick-view-actions">
                            <Link to={`/cursos/${curso.id}`} className="btn btn-primary">Ver Detalles</Link>
                            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Componente de Tarjeta de Curso (Rediseñado por CSS) ---
const CourseCard = ({ curso, onQuickView }) => {
    const plan = curso.plan || {};
    const docente = curso.docente || {};
    const imagenUrl = plan.imagen_url || `https://placehold.co/600x400/1A52B8/FFFFFF?text=${encodeURIComponent(plan.titulo || 'Curso')}`;

    return (
        <div className="course-card">
            <div className="course-image-container">
                <img src={imagenUrl} alt={plan.titulo} className="course-image" />
                <div className="course-price">S/ {parseFloat(curso.precio || 0).toFixed(2)}</div>
            </div>
            <div className="course-info">
                <span className="course-category-tag"><FaTag /> {plan.categoria_nombre || 'Categoría'}</span>
                <h3 className="course-title">
                    <Link to={`/cursos/${curso.id}`}>{plan.titulo}</Link>
                </h3>
                <p className="course-description">{plan.descripcion}</p>
                <div className="course-meta">
                    <span className="course-author"><FaUserGraduate /> {docente.nombre || 'Docente'}</span>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => onQuickView(curso)} 
                        style={{padding: '5px 10px', fontSize: '0.9rem', textTransform: 'none'}}
                        title="Vista Rápida"
                    >
                        <FaEye />
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Componente Principal: HomePage ---
const HomePage = () => {
  const { usuario } = useAuth();
  const [currentBanner, setCurrentBanner] = useState(0);
  
  const [cursos, setCursos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [modalData, setModalData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // --- Banner Slider (Sin cambios) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Cargar Cursos Reales (Sin cambios) ---
  useEffect(() => {
    const fetchCursos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await loteService.getPublicLotes({ limit: 6, featured: true, random: true });
        setCursos(response.data || []); 
      } catch (err) {
        console.error("Error al cargar cursos:", err);
        setError("No se pudo establecer conexión con el catálogo de cursos. Por favor, inténtalo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCursos();
  }, []); 

  // --- Manejo de Vista Rápida (Sin cambios) ---
  const handleQuickView = (curso) => {
    setModalData(curso);
  };

  const handleCloseModal = () => {
    setModalData(null);
  };

  // --- Manejo de Búsqueda (Sin cambios) ---
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  // --- Helper para renderizar la grid de cursos (Rediseñado por CSS) ---
  const renderCoursesGrid = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-brand-blue)' }}>
          <FaSpinner className="fa-spin" size="3em" />
          <p style={{ fontSize: '1.2rem', marginTop: '1rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display-pixel)', textTransform: 'uppercase' }}>
            Cargando Catálogo...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-card-pixeltech">
          <FaExclamationCircle size="3em" />
          <h3>Error de Conexión</h3>
          <p>{error}</p>
        </div>
      );
    }
    
    if (!Array.isArray(cursos) || cursos.length === 0) { 
      return (
          <div className="empty-state-pixeltech">
            <FaRegSadTear size="3em" />
            <h3>Catálogo en Construcción</h3>
            <p>Actualmente no tenemos cursos destacados disponibles. ¡Regresa pronto!</p>
          </div>
      );
    }

    return (
      <div className="courses-grid">
        {cursos.map((curso) => (
          <CourseCard 
            key={curso.id} 
            curso={curso} 
            onQuickView={handleQuickView}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="home-page-akademic">
      
      {/* --- Modal de Vista Rápida --- */}
      {modalData && <QuickViewModal curso={modalData} onClose={handleCloseModal} />}

      {/* --- 1. Sección Hero --- */}
      <section className="hero-section-dynamic">
        <div className="hero-background-slider">
          {bannerImages.map((image, index) => (
            <div
              key={index}
              className="hero-banner-image"
              style={{
                backgroundImage: `url(${image})`,
                opacity: index === currentBanner ? 1 : 0
              }}
            />
          ))}
        </div>
        <div className="hero-overlay-pixeltech"></div>
        <div className="hero-content">
          <h1 className="animate-fade-in-down">
            {usuario 
              ? `BIENVENIDO, ${usuario.nombre.split(' ')[0].toUpperCase()}` 
              : "DOMINA TU FUTURO ACADÉMICO"
            }
          </h1>
          <p className="animate-fade-in-down delay-1">
            {usuario
              ? "Encuentra tu próximo desafío o administra tus cursos."
              : "CLASES, CURSOS Y ASESORÍA DE NIVEL SUPERIOR."
            }
          </p>
          
          <form onSubmit={handleSearch} className="hero-search-bar animate-fade-in-down delay-2">
            <input
              type="text"
              placeholder="Buscar por materia, docente o tema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn">
              <FaSearch />
            </button>
          </form>

          <div className="hero-buttons animate-fade-in-up delay-2">
            {usuario ? (
              <>
                {usuario.rol === 'docente' ? (
                  <Link to="/docente/dashboard" className="btn btn-primary">
                    MI PANEL <FaArrowRight />
                  </Link>
                ) : (
                  <Link to="/perfil" className="btn btn-primary">
                    MI PERFIL <FaArrowRight />
                  </Link>
                )}
                <Link to="/buscar" className="btn btn-secondary">
                  EXPLORAR
                </Link>
              </>
            ) : (
              <>
                <Link to="/buscar" className="btn btn-primary">
                  EXPLORAR CURSOS <FaArrowRight />
                </Link>
                <Link to="/auth/registro-estudiante" className="btn btn-secondary">
                  REGISTRARSE
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* --- 2. Sección Cursos Destacados --- */}
      <section className="featured-courses-section">
        <div className="section-header">
          <h2 className="animate-fade-in-up">CURSOS DESTACADOS</h2>
          <p className="animate-fade-in-up delay-1">
            Selección de los mejores cursos impartidos por docentes verificados.
          </p>
        </div>
        
        {renderCoursesGrid()}
        
        <div className="section-footer-action">
          <Link to="/buscar" className="btn btn-primary">
            VER CATÁLOGO COMPLETO <FaArrowRight />
          </Link>
        </div>
      </section>

      {/* --- 3. Sección "Tu Ruta" (Contexto del PDF) [MODIFICADO CON 6 PASOS] --- */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="animate-fade-in-up">TU RUTA HACIA EL ÉXITO</h2>
          <p className="animate-fade-in-up delay-1">
            Un proceso simple para conectar y aprender.
          </p>
        </div>
        
        <div className="steps-container-v2">
          {/* PASO 1 */}
          <div className="step-card-v2 animate-fade-in-up">
            <div className="step-number">1</div>
            <div className="step-icon-v2"><FaSearch /></div>
            <h3>ENCUENTRA Y FILTRA</h3>
            <p>Busca por materia, modalidad, precio o reputación del docente.</p>
          </div>
          
          {/* PASO 2 (NUEVO) */}
          <div className="step-card-v2 animate-fade-in-up delay-1">
            <div className="step-number">2</div>
            <div className="step-icon-v2"><FaComments /></div>
            <h3>COMUNICA Y COORDINA</h3>
            <p>Usa la mensajería previa para resolver tus dudas con el docente. </p>
          </div>
          
          {/* PASO 3 (Original 2) */}
          <div className="step-card-v2 animate-fade-in-up delay-2">
            <div className="step-number">3</div>
            <div className="step-icon-v2"><FaCalendarCheck /></div>
            <h3>RESERVA TU CLASE</h3>
            <p>Revisa la disponibilidad del docente y reserva tu espacio al instante.</p>
          </div>
          
          {/* PASO 4 (NUEVO) */}
          <div className="step-card-v2 animate-fade-in-up delay-3">
            <div className="step-number">4</div>
            <div className="step-icon-v2"><FaCreditCard /></div>
            <h3>VALIDA TU PAGO</h3>
            <p>Sube tu comprobante de pago para confirmar y asegurar tu cupo. </p>
          </div>

          {/* PASO 5 (Original 3) */}
          <div className="step-card-v2 animate-fade-in-up delay-4">
            <div className="step-number">5</div>
            <div className="step-icon-v2"><FaChalkboardTeacher /></div>
            <h3>APRENDE CON EXPERTOS</h3>
            <p>Conecta con docentes verificados y recibe educación de calidad.</p>
          </div>
          
          {/* PASO 6 (Original 4) */}
          <div className="step-card-v2 animate-fade-in-up delay-5">
            <div className="step-number">6</div>
            <div className="step-icon-v2"><FaGraduationCap /></div>
            <h3>CALIFICA Y CRECE</h3>
            <p>Deja tu reseña para construir una comunidad de confianza.</p>
          </div>
        </div>
      </section>

      {/* --- 4. Sección CTA (Rediseñada) --- */}
      <section className="cta-section">
        <div className="cta-content">
          <h2><FaComments /> ¿LISTO PARA TRANSFORMAR TU APRENDIZAJE?</h2>
          <p>Únete a la comunidad AKdémico y encuentra al docente perfecto para ti.</p>
        </div>
        <div className="cta-actions">
          <Link to="/auth/registro-estudiante" className="btn-secondary-cta">
            COMENZAR AHORA <FaArrowRight />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default HomePage;