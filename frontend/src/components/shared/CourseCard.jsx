/* Archivo: CourseCard.jsx */
/* [CORREGIDO] Los enlaces principales ahora usan 'primer_lote_id' en lugar de 'plan_id' */
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import './CourseCard.css'; 
import { 
    FaLaptop, 
    FaMapMarkerAlt, 
    FaChalkboardTeacher, 
    FaLayerGroup,
    FaGraduationCap,
    FaRegClock,
    FaChevronDown,
    FaChevronUp,
    FaSpinner,
    FaArrowRight,
    FaCalendarAlt,
    FaExclamationCircle,
    FaCheckCircle,
    FaPlayCircle
} from 'react-icons/fa';
import { obtenerLotesPorPlanId } from '../../services/lote.service';

// --- Funciones Auxiliares (sin cambios) ---
const renderLevelBar = (nivelNombre) => {
    // ... (código sin cambios) ...
    let activeSegments = 0;
    const lowerNivel = nivelNombre.toLowerCase();
    if (lowerNivel.includes('básico')) activeSegments = 1;
    else if (lowerNivel.includes('intermedio')) activeSegments = 2;
    else if (lowerNivel.includes('avanzado')) activeSegments = 3;
    else return null; 
    return (
        <div className="course-level-bar">
            <span className="level-bar-label">
                <FaGraduationCap className="meta-icon"/> Nivel: {nivelNombre}
            </span>
            <div className="level-bar-container">
                {[...Array(3)].map((_, index) => (
                    <div 
                        key={index}
                        className={`level-segment ${index < activeSegments ? 'active' : ''}`}
                    ></div>
                ))}
            </div>
        </div>
    );
};
const formatHorarios = (horarios = []) => {
    // ... (código sin cambios) ...
    if (!horarios || horarios.length === 0) {
        return { dias: "Horario no definido", horaRango: "" };
    }
    const dias = horarios.map(h => 
        h.dia_semana.charAt(0).toUpperCase() + h.dia_semana.slice(1)
    );
    let diasString;
    if (dias.length === 1) diasString = dias[0];
    else if (dias.length === 2) diasString = dias.join(' y ');
    else diasString = dias.slice(0, -1).join(', ') + ' y ' + dias.slice(-1);
    
    const horaInicio = horarios[0].hora_inicio.substring(0, 5);
    const horaFin = horarios[0].hora_fin.substring(0, 5);
    const horaRango = `${horaInicio} - ${horaFin}`;
    return { dias: diasString, horaRango };
};
const getLoteStatus = (fechaInicioStr, fechaFinStr) => {
    // ... (código sin cambios) ...
    const now = new Date();
    const inicio = new Date(fechaInicioStr);
    const fin = new Date(fechaFinStr);
    now.setHours(0, 0, 0, 0);
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);

    if (now > fin) {
        return { text: 'Concluido', className: 'status-finalizado', Icon: FaCheckCircle };
    } else if (now >= inicio && now <= fin) {
        return { text: 'En Curso', className: 'status-en-curso', Icon: FaPlayCircle };
    } else if (now < inicio) {
        return { text: 'Pronto', className: 'status-pronto', Icon: FaCalendarAlt };
    }
    return { text: 'Error', className: 'status-error', Icon: FaExclamationCircle }; 
};
// ------------------------------------------


const CourseCard = ({ plan, style }) => { // [AÑADIDO] style para animación delay
    // --- Estados y Hooks (sin cambios) ---
    const [isExpanded, setIsExpanded] = useState(false);
    const [lotes, setLotes] = useState([]);
    const [lotesLoading, setLotesLoading] = useState(false);
    const [lotesError, setLotesError] = useState(null);
    const { authToken } = useAuth(); 
    const navigate = useNavigate();
    const location = useLocation(); 

    // --- Preparación de Datos (sin cambios) ---
    const precioMinimo = Number(plan.precio_minimo);
    const lotesDisponibles = Number(plan.lotes_disponibles) || 0;
    const esGratis = precioMinimo === 0;
    const imagenUrl = plan.plan_imagen_url || plan.plan_banner_default || '/images/defaults/course_placeholder.png';
    const titulo = plan.plan_titulo || 'Título no disponible';
    const docente = plan.docente_nombre || 'Docente no asignado';
    const categoria = plan.plan_categoria_nombre || 'General';
    const nivel = plan.plan_nivel_nombre || 'Todos';

    // --- [NUEVA LÓGICA] ---
    // Si la API no envía 'primer_lote_id' (por si acaso), usamos 'plan_id' como fallback,
    // aunque sabemos que estará mal. El 'primer_lote_id' es la corrección.
    // [CORRECCIÓN FINAL] Detecta el ID más probable
    const idCurso = plan.id || plan.primer_lote_id || plan.lote_id || plan.plan_id;

    // Si se encuentra un ID, crea el enlace; si no, usa un hash (#) para evitar el undefined en la URL.
    const enlaceDestino = idCurso ? `/cursos/${idCurso}` : '#';
    // ----------------------


    // --- Lógica de Clic (sin cambios) ---
    const handleToggleHorariosClick = async (e) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        if (!authToken) {
            navigate('/auth/login', { state: { from: location } });
            return; 
        }
        if (isExpanded) {
            setIsExpanded(false); 
            return;
        }
        setIsExpanded(true);
        if (lotes.length > 0) return; 
        setLotesLoading(true);
        setLotesError(null);
        try {
            const data = await obtenerLotesPorPlanId(plan.plan_id); 
            setLotes(data);
        } catch (err) {
            if (err.response?.status === 401) {
                setLotesError('Tu sesión expiró. Refresca la página.');
            } else {
                setLotesError('No se pudieron cargar los horarios.');
            }
        } finally {
            setLotesLoading(false);
        }
    };
    
    const handleRowClick = (loteId) => {
        navigate(`/cursos/${loteId}`);
    };

    return (
        <div className="course-card" style={style}> {/* [AÑADIDO] style para animación delay */}
            
            {/* 1. Contenedor de Imagen (Ahora es un Link) */}
            <div className="course-image-container">
                {/* 🚨 [CORREGIDO] Link al primer lote 🚨 */}
                <Link 
                    to={enlaceDestino} 
                    className="course-image-link" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <img 
                        src={imagenUrl} 
                        alt={`Portada de ${titulo}`} 
                        className="course-image"
                        onError={(e) => { e.currentTarget.src = '/images/defaults/course_placeholder.png'; }}
                    />
                </Link>
                {lotesDisponibles > 0 ? (
                    <div className="course-price">
                        {esGratis ? 'GRATIS' : `Desde S/ ${precioMinimo.toFixed(2)}`}
                    </div>
                ) : (
                    <div className="course-price sold-out">
                        Agotado
                    </div>
                )}
            </div>

            {/* 2. Contenido de la Tarjeta */}
            <div className="course-info">
                
                <span className="course-category-tag">
                    <FaLayerGroup /> {categoria}
                </span>

                {/* Título (Ahora es un Link) */}
                <h3 className="course-title">
                    {/* 🚨 [CORREGIDO] Link al primer lote 🚨 */}
                    <Link to={enlaceDestino} onClick={(e) => e.stopPropagation()}>
                        {titulo}
                    </Link>
                </h3>

                {/* Docente */}
                <div className="course-teacher">
                   <FaChalkboardTeacher className="meta-icon icon-docente" />
                   <span>{docente}</span>
                </div>
                
                {/* Descripción (Presente, como pediste) */}
                <p className="course-description">
                    {plan.plan_descripcion || `Un curso de ${categoria.toLowerCase()} nivel ${nivel.toLowerCase()}.`}
                </p>

                {/* Barra de Nivel */}
                {renderLevelBar(nivel)}

                {/* CTA de Horarios (Botón) */}
                <button 
                    className="course-horarios-cta" 
                    onClick={handleToggleHorariosClick}
                    disabled={lotesDisponibles === 0}
                >
                   <span className="horarios-cta-text">
                       <FaRegClock className="meta-icon"/> 
                       {lotesDisponibles} {lotesDisponibles === 1 ? 'Horario' : 'Horarios'}
                   </span>
                   <span className="horarios-cta-link">
                       {!authToken ? 'Iniciar Sesión' : (isExpanded ? 'Ocultar' : 'Ver Más')} 
                       {!authToken ? <FaArrowRight /> : (isExpanded ? <FaChevronUp /> : <FaChevronDown />)}
                   </span>
                </button>

            </div>

            {/* --- Panel Expandible con Tabla --- */}
            {isExpanded && (
                <div className="course-horarios-expanded">
                    {lotesLoading && (
                        <div className="horarios-loader">
                            <FaSpinner className="fa-spin" /> CARGANDO HORARIOS...
                        </div>
                    )}
                    {lotesError && (
                        <div className="horarios-error">
                            <FaExclamationCircle /> {lotesError}
                        </div>
                    )}
                    {!lotesLoading && !lotesError && (
                        <div className="horario-sublist-container">
                            {lotes.length > 0 ? (
                                <table className="horario-table">
                                    <thead>
                                        {/* 4 Columnas: Horario, Inicia, Precio, Estado */}
                                        <tr>
                                            <th>Horario</th>
                                            <th>Inicia</th>
                                            <th>Precio</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lotes.map(lote => {
                                            const { dias, horaRango } = formatHorarios(lote.horarios);
                                            const fechaInicio = new Date(lote.fecha_inicio).toLocaleDateString('es-ES', {
                                                month: 'short', day: 'numeric'
                                            });
                                            // [IMPORTANTE] Tu 'lote.service.js' debe devolver 'fecha_fin' 
                                            // para que getLoteStatus funcione correctamente.
                                            const status = getLoteStatus(lote.fecha_inicio, lote.fecha_fin);
                                            
                                            return (
                                                <tr 
                                                    key={lote.lote_id} 
                                                    className="horario-row"
                                                    onClick={() => handleRowClick(lote.lote_id)}
                                                    title="Clic para ver detalles e inscribirte"
                                                >
                                                    {/* Col 1: Horario */}
                                                    <td className="cell-horario">
                                                        <span className="cell-pixel-main">{dias}</span>
                                                        <span className="cell-neon">{horaRango}</span>
                                                    </td>
                                                    {/* Col 2: Inicia */}
                                                    <td className="cell-subtle">{fechaInicio}</td>
                                                    {/* Col 3: Precio */}
                                                    <td className="cell-price">{Number(lote.precio) === 0 ? 'Gratis' : `S/ ${Number(lote.precio).toFixed(2)}`}</td>
                                                    {/* Col 4: Estado */}
                                                    <td className={`cell-status ${status.className}`}>
                                                        <span>
                                                            <status.Icon />
                                                            {status.text}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="horario-item-none">
                                    No hay horarios programados por ahora.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CourseCard;