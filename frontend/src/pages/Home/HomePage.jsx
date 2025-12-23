import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CourseCard from '../../components/shared/CourseCard'; 
import './HomePage.css'; 
import { 
    FaSearch, FaGraduationCap, FaCalendarCheck, 
    FaComments, FaChalkboardTeacher, FaTimes,
    FaTag, FaUserGraduate, FaClock, FaEye, FaArrowRight, FaSpinner,
    FaRegSadTear, FaExclamationCircle, FaCreditCard, FaRocket, FaStar,
    FaLightbulb, FaLaptopCode, FaGlobeAmericas, FaAward, FaBolt, FaQuoteLeft
} from 'react-icons/fa';
import * as loteService from '../../services/lote.service'; 

// --- CONFIGURACIÓN ESTÁTICA ---
const ALL_BANNER_IMAGES = [
    '/images/banner/banner_1.png', '/images/banner/banner_2.png',
    '/images/banner/banner_3.png', '/images/banner/banner_4.png',
    '/images/banner/banner_5.png', '/images/banner/banner_6.png',
    '/images/banner/banner_7.png', '/images/banner/banner_8.png',
    '/images/banner/banner_9.png', '/images/banner/banner_10.png',
    '/images/banner/banner_11.png', '/images/banner/banner_12.png'
];

const CATEGORIES = [
    { id: 1, name: "Programación", icon: <FaLaptopCode /> },
    { id: 2, name: "Idiomas", icon: <FaGlobeAmericas /> },
    { id: 3, name: "Diseño", icon: <FaLightbulb /> },
    { id: 4, name: "Matemáticas", icon: <FaBolt /> },
    { id: 5, name: "Marketing", icon: <FaRocket /> },
    { id: 6, name: "Negocios", icon: <FaAward /> },
];

const TESTIMONIALS = [
    { id: 1, name: "Ana P.", role: "Estudiante de Derecho", text: "La plataforma cambió mi forma de estudiar. Los docentes son top." },
    { id: 2, name: "Carlos M.", role: "Ingeniero", text: "Encontré cursos de especialización que no existen en otro lado." },
    { id: 3, name: "Lucía R.", role: "Diseñadora", text: "La interfaz es increíble y el proceso de pago súper seguro." },
];

const FAQS = [
    { q: "¿Cómo me inscribo?", a: "Busca tu curso, reserva tu vacante y sube tu comprobante. ¡Así de fácil!" },
    { q: "¿Las clases son en vivo?", a: "Sí, la mayoría de nuestros docentes dictan clases síncronas para mejor feedback." },
    { q: "¿Puedo cancelar?", a: "Depende de la política de cada docente, pero generalmente hasta 48h antes." },
    { q: "¿Es seguro pagar?", a: "Totalmente. Validamos manualmente cada transacción para tu seguridad." },
];

// --- COMPONENTES INTERNOS DE ALTA INTERACCIÓN (SIN CAMBIOS) ---

const Feature3DCard = ({ icon, title, text }) => {
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10; 
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    };

    const handleMouseLeave = () => {
        cardRef.current.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
    };

    return (
        <div 
            className="feature-card-3d" 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div className="card-content-3d">
                <div className="icon-3d">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
            </div>
            <div className="card-glow"></div>
        </div>
    );
};

const AnimatedCounter = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(null); 

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                let start = 0;
                const increment = end / (duration / 16);
                const timer = setInterval(() => {
                    start += increment;
                    if (start >= end) {
                        setCount(end);
                        clearInterval(timer);
                    } else {
                        setCount(Math.ceil(start));
                    }
                }, 16);
                observer.disconnect();
            }
        });
        if (countRef.current) observer.observe(countRef.current);
        return () => observer.disconnect();
    }, [end, duration]);

    return <span ref={countRef}>{count}</span>;
};

const QuickViewModal = ({ curso, onClose }) => {
    const plan = curso.plan || {};
    const docente = curso.docente || {};
    const horarioResumen = curso.horario_resumen || 'Ver detalles para horarios'; 
    const imagenUrl = plan.imagen_url && plan.imagen_url.length > 5 
        ? plan.imagen_url 
        : `https://placehold.co/600x400/05050A/FFF?text=${encodeURIComponent(plan.titulo || 'Curso')}`;

    return (
        <div className="cyber-modal-overlay" onClick={onClose}>
            <div className="cyber-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="cyber-close-btn" onClick={onClose}><FaTimes /></button>
                <div className="modal-grid">
                    <div className="modal-image-col">
                        <img src={imagenUrl} alt={plan.titulo} />
                        <div className="image-overlay-gradient"></div>
                        <div className="modal-price-float">S/ {parseFloat(curso.precio || 0).toFixed(2)}</div>
                    </div>
                    <div className="modal-info-col">
                        <div className="modal-header">
                            <span className="category-pill"><FaTag /> {plan.categoria_nombre || 'General'}</span>
                            <h2>{plan.titulo}</h2>
                        </div>
                        <div className="modal-body-text">
                            <p>{plan.descripcion || "Sin descripción disponible."}</p>
                            <div className="meta-grid">
                                <div className="meta-item">
                                    <FaUserGraduate className="icon-neon" />
                                    <div><span>Docente</span><strong>{docente.nombre}</strong></div>
                                </div>
                                <div className="meta-item">
                                    <FaClock className="icon-neon" />
                                    <div><span>Disponibilidad</span><strong>{horarioResumen}</strong></div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <Link to={`/cursos/${curso.id}`} className="btn-cyber-primary full-width">
                                VER DETALLES E INSCRIBIRSE <FaArrowRight />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FaqItem = ({ faq, isOpen, toggle }) => {
    return (
        <div className={`faq-item ${isOpen ? 'open' : ''}`} onClick={toggle}>
            <div className="faq-question">
                <span>{faq.q}</span>
                <span className="faq-toggle">{isOpen ? '-' : '+'}</span>
            </div>
            <div className="faq-answer">
                <p>{faq.a}</p>
            </div>
        </div>
    );
};

// --- FUNCIÓN AUXILIAR PARA ALEATORIZAR (SHUFFLE) ---
const shuffleArray = (array) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

// --- COMPONENTE PRINCIPAL ---
const HomePage = () => {
  const { usuario } = useAuth();
  const [shuffledBannerImages, setShuffledBannerImages] = useState([]); // Estado para la lista barajada
  const [currentBanner, setCurrentBanner] = useState(0);
  const [cursos, setCursos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // 1. Aleatorizar banners al montar el componente
  useEffect(() => {
    setShuffledBannerImages(shuffleArray(ALL_BANNER_IMAGES));
  }, []);

  // 2. Slider automático usa la lista aleatoria
  useEffect(() => {
    if (shuffledBannerImages.length === 0) return;
    const interval = setInterval(() => setCurrentBanner(prev => (prev + 1) % shuffledBannerImages.length), 5000);
    return () => clearInterval(interval);
  }, [shuffledBannerImages]); // Dependencia del array barajado

  // Carga de cursos aleatorios (SIN CAMBIOS)
  useEffect(() => {
    const fetchCursos = async () => {
      setIsLoading(true);
      try {
        const response = await loteService.getPublicLotes({ limit: 6, featured: true, random: true });
        if (Array.isArray(response) && response.length > 0) {
             setCursos(response);
        } else if (response.data && Array.isArray(response.data)) {
             setCursos(response.data);
        } else {
             setCursos([]);
        }
      } catch (err) {
        console.error(err);
        setError("No pudimos conectar con el servidor de cursos.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCursos();
  }, []); 

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/buscar?query=${encodeURIComponent(searchQuery)}`);
  };

  const handleNewsletterSubmit = (e) => {
      e.preventDefault();
      alert(`¡Gracias! Te has suscrito con: ${email}`);
      setEmail('');
  };

  return (
    <div className="home-wrapper">
      {modalData && <QuickViewModal curso={modalData} onClose={() => setModalData(null)} />}

      {/* 1. HERO SECTION MASIVO */}
      <section className="hero-cyber">
        <div className="hero-bg-slider">
            {/* Mapea sobre la lista ALEATORIA */}
            {shuffledBannerImages.map((img, idx) => (
                <div 
                    key={idx} 
                    className="hero-slide" 
                    style={{ 
                        backgroundImage: `url(${img})`, 
                        opacity: idx === currentBanner ? 1 : 0 
                    }} 
                />
            ))}
        </div>
        <div className="hero-overlay-gradient"></div>
        <div className="tech-grid-overlay"></div> 
        <div className="floating-particles"></div> 

        <div className="hero-content">
            <div className="hero-badge animate-pop-in">
                <FaRocket /> PLATAFORMA EDUCATIVA 2.0
            </div>
            <h1 className="animate-slide-up">
                {usuario ? `HOLA, ${usuario.nombre.split(' ')[0].toUpperCase()}` : "DOMINA TU FUTURO"}
                <span className="text-gradient"> ACADÉMICO</span>
            </h1>
            <p className="animate-slide-up delay-1">
                Conecta con docentes de élite, gestiona tu aprendizaje con tecnología superior y valida tus conocimientos.
            </p>

            <form onSubmit={handleSearch} className="cyber-search-bar animate-slide-up delay-2">
                <FaSearch className="search-icon" />
                <input 
                    type="text" 
                    placeholder="¿Qué quieres aprender hoy? (Ej: React, Inglés...)" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit">BUSCAR</button>
            </form>

            <div className="hero-actions animate-slide-up delay-3">
                {usuario && usuario.rol === 'docente' ? (
                    <Link to="/docente/dashboard" className="btn-cyber-primary">PANEL DOCENTE</Link>
                ) : (
                    <Link to="/buscar" className="btn-cyber-primary">EXPLORAR CURSOS</Link>
                )}
                {!usuario && <Link to="/auth/registro-estudiante" className="btn-cyber-ghost">CREAR CUENTA</Link>}
            </div>
        </div>
      </section>

      {/* 2. CATEGORIES MARQUEE (Cinta infinita) (SIN CAMBIOS) */}
      <div className="marquee-container">
          <div className="marquee-track">
              {[...CATEGORIES, ...CATEGORIES, ...CATEGORIES].map((cat, idx) => ( // Triplicado para loop
                  <div key={idx} className="marquee-item">
                      <span className="cat-icon">{cat.icon}</span>
                      <span className="cat-name">{cat.name}</span>
                  </div>
              ))}
          </div>
      </div>

      {/* 3. CURSOS DESTACADOS (RANDOM) (SIN CAMBIOS en la lógica de mapeo) */}
      <section className="section-cyber">
        <div className="section-header">
            <h2>CURSOS <span className="highlight">DESTACADOS</span></h2>
            <div className="header-line"></div>
            <p className="header-subtitle">Una selección aleatoria de nuestra oferta académica actual.</p>
        </div>

        {isLoading ? (
            <div className="loader-container">
                <div className="hex-spinner"></div>
                <p>CALIBRANDO CATÁLOGO...</p>
            </div>
        ) : error ? (
            <div className="error-box"><FaExclamationCircle /> {error}</div>
        ) : cursos.length === 0 ? (
            <div className="empty-box"><FaRegSadTear /> Catálogo en actualización. Vuelve pronto.</div>
        ) : (
            <div className="cyber-grid">
                {cursos.map((curso, idx) => (
                    <CourseCard 
                        key={curso.plan_id || curso.lote_id || idx} 
                        plan={curso} 
                        style={{ animationDelay: `${0.1 * idx}s` }}
                    />
                ))}
            </div>
        )}

        <div className="center-action">
            <Link to="/buscar" className="btn-link-glow">VER TODOS LOS CURSOS <FaArrowRight /></Link>
        </div>
      </section>

      {/* 4. WHY US (3D CARDS) (SIN CAMBIOS) */}
      <section className="section-cyber dark-alt">
        <div className="section-header">
            <h2>POR QUÉ ELEGIR <span className="highlight">AKDÉMICO</span></h2>
        </div>
        <div className="features-container">
            <Feature3DCard 
                icon={<FaChalkboardTeacher />} 
                title="Expertos Verificados" 
                text="Cada docente pasa por un riguroso proceso de validación académica."
            />
            <Feature3DCard 
                icon={<FaCreditCard />} 
                title="Pagos Seguros" 
                text="Tu dinero está protegido. Valida tu inscripción con comprobantes directos."
            />
            <Feature3DCard 
                icon={<FaCalendarCheck />} 
                title="Gestión Inteligente" 
                text="Calendarios sincronizados y control total de tus clases en un solo lugar."
            />
        </div>
      </section>

      {/* 5. ROADMAP (TU RUTA) (SIN CAMBIOS) */}
      <section className="section-cyber">
        <div className="section-header">
            <h2>TU RUTA AL <span className="highlight">ÉXITO</span></h2>
            <p>El algoritmo del aprendizaje simplificado en 6 pasos.</p>
        </div>

        <div className="roadmap-container">
            {[
                { icon: <FaSearch />, title: "EXPLORA", desc: "Filtra por materia." },
                { icon: <FaComments />, title: "CONTACTA", desc: "Resuelve dudas." },
                { icon: <FaCalendarCheck />, title: "RESERVA", desc: "Asegura vacante." },
                { icon: <FaCreditCard />, title: "PAGA", desc: "Sube comprobante." },
                { icon: <FaChalkboardTeacher />, title: "APRENDE", desc: "Clases en vivo." },
                { icon: <FaStar />, title: "CALIFICA", desc: "Valora tu experiencia." }
            ].map((step, idx) => (
                <div key={idx} className="roadmap-step">
                    <div className="step-number">0{idx + 1}</div>
                    <div className="step-icon-box">{step.icon}</div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                    {idx < 5 && <div className="step-connector"></div>}
                </div>
            ))}
        </div>
      </section>

      {/* 6. ESTADÍSTICAS EN VIVO (SIN CAMBIOS) */}
      <section className="stats-section">
          <div className="stats-overlay"></div>
          <div className="stats-grid">
              <div className="stat-item">
                  <div className="stat-number"><AnimatedCounter end={1200} />+</div>
                  <div className="stat-label">ALUMNOS ACTIVOS</div>
              </div>
              <div className="stat-item">
                  <div className="stat-number"><AnimatedCounter end={85} /></div>
                  <div className="stat-label">DOCENTES EXPERTOS</div>
              </div>
              <div className="stat-item">
                  <div className="stat-number"><AnimatedCounter end={450} />+</div>
                  <div className="stat-label">CURSOS IMPARTIDOS</div>
              </div>
              <div className="stat-item">
                  <div className="stat-number">4.9</div>
                  <div className="stat-label">CALIFICACIÓN PROMEDIO</div>
              </div>
          </div>
      </section>

      {/* 7. TESTIMONIOS & FAQ (Split Section) (SIN CAMBIOS) */}
      <section className="section-cyber split-section">
          <div className="split-col testimonials-col">
              <h3>LO QUE DICEN NUESTROS ALUMNOS</h3>
              <div className="testimonials-slider">
                  {TESTIMONIALS.map(t => (
                      <div key={t.id} className="testimonial-card">
                          <FaQuoteLeft className="quote-icon"/>
                          <p>"{t.text}"</p>
                          <div className="author">
                              <strong>{t.name}</strong>
                              <span>{t.role}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
          <div className="split-col faq-col">
              <h3>PREGUNTAS FRECUENTES</h3>
              <div className="faq-list">
                  {FAQS.map((faq, idx) => (
                      <FaqItem 
                        key={idx} 
                        faq={faq} 
                        isOpen={openFaqIndex === idx} 
                        toggle={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)} 
                      />
                  ))}
              </div>
          </div>
      </section>

      {/* 8. NEWSLETTER & CTA FINAL (SIN CAMBIOS) */}
      <section className="cta-cyber">
        <div className="cta-bg-glow"></div>
        <div className="cta-content">
            <h2>¿LISTO PARA EL SIGUIENTE NIVEL?</h2>
            <p>Suscríbete para recibir ofertas exclusivas y novedades.</p>
            
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input 
                    type="email" 
                    placeholder="tu@correo.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit">SUSCRIBIRME</button>
            </form>

            <div className="final-links">
                <Link to="/auth/registro-estudiante" className="link-simple">Crear cuenta de estudiante</Link>
                <Link to="/auth/registro-docente" className="link-simple">Aplicar como docente</Link>
            </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;