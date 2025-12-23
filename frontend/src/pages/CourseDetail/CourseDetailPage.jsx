/* Archivo: CourseDetailPage.jsx - CORREGIDO */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; 
import { obtenerDetalleLotePorId, obtenerLotesPorPlanId } from '../../services/lote.service.js';
import { inscribirseEnLote, obtenerMiEstadoInscripcionEnLote, cancelarInscripcion } from '../../services/inscripcion.service.js';
import { useAuth } from '../../context/AuthContext';
import './CourseDetailPage.css'; 
import { 
    FaCalendarAlt, FaUsers, FaCheckCircle, FaUserGraduate, FaMoneyBillWave, FaArrowRight,
    FaChalkboardTeacher, FaStar, FaCalendarCheck, FaRegTimesCircle, FaRegClock, FaBookmark,
    FaSyncAlt, FaWifi, FaBuilding, FaExclamationCircle, FaSignInAlt, FaHourglassHalf
} from 'react-icons/fa';

// --- Funciones de Formato ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return dateString; }
};
const formatTime = (timeString) => {
    if (!timeString) return '';
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
};
const capitalizar = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Sub-componente: StarRatingDisplay ---
const StarRatingDisplay = ({ rating }) => {
    const numericRating = Number(rating);
    if (!numericRating || numericRating === 0) return null;
    const ratingValue = numericRating.toFixed(1);
    
    return (
        <div className="cdp-star-rating">
            <FaStar className="cdp-star-icon" />
            <span className="cdp-rating-number">{ratingValue}</span>
        </div>
    );
};

// --- Componente Principal ---
const CourseDetailPage = () => {
    const { cursoId } = useParams();
    const { usuario } = useAuth();
    
    const [loteSeleccionado, setLoteSeleccionado] = useState(null);
    const [todosLosLotesDelPlan, setTodosLosLotesDelPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [accionLoading, setAccionLoading] = useState(false);
    const [accionError, setAccionError] = useState(null);
    const [accionExito, setAccionExito] = useState(null);
    const [estadoInscripcion, setEstadoInscripcion] = useState({
        cargando: true, estaInscrito: false, estado: null, inscripcionId: null 
    });

    // --- Lógica de Carga ---
    const cargarEstadoInscripcion = useCallback(async (loteId) => {
        // CORRECCIÓN: Usar la nueva estructura de roles
        const roles = usuario?.roles || [];
        if (usuario && roles.includes('estudiante')) {
            setEstadoInscripcion(prev => ({ ...prev, cargando: true }));
            try {
                const dataEstado = await obtenerMiEstadoInscripcionEnLote(loteId);
                setEstadoInscripcion({
                    cargando: false,
                    estaInscrito: dataEstado.estaInscrito,
                    estado: dataEstado.estado,
                    inscripcionId: dataEstado.inscripcionId || null
                });
            } catch (e) {
                setEstadoInscripcion({ cargando: false, estaInscrito: false, estado: null, inscripcionId: null });
            }
        } else {
            setEstadoInscripcion({ cargando: false, estaInscrito: false, estado: null, inscripcionId: null });
        }
    }, [usuario]);

    const cargarDatosCompletos = useCallback(async () => {
        setLoading(true); setError(null); setAccionExito(null); setAccionError(null);
        try {
            const dataLote = await obtenerDetalleLotePorId(cursoId);
            setLoteSeleccionado(dataLote);
            const todosLotes = await obtenerLotesPorPlanId(dataLote.plan_id); 
            setTodosLosLotesDelPlan(todosLotes);
            await cargarEstadoInscripcion(cursoId);
        } catch (err) {
            setError('No se pudo cargar la información del curso. Verifica la URL.');
        } finally {
            setLoading(false);
        }
    }, [cursoId, cargarEstadoInscripcion]);

    useEffect(() => {
        if(cursoId) {
            cargarDatosCompletos();
        } else {
            setError('ID de curso no válido.');
            setLoading(false);
        }
    }, [cursoId, cargarDatosCompletos]);

    // --- Manejadores de Acción ---
    const handleInscribirse = async (loteId) => {
        if (!usuario) return; 
        setAccionLoading(true); setAccionError(null); setAccionExito(null);
        try {
            const respuesta = await inscribirseEnLote(loteId);
            setAccionExito(respuesta.mensaje || '¡Inscripción exitosa! Procede al pago.');
            await cargarEstadoInscripcion(loteId);
        } catch (error) {
            setAccionError(error.mensaje || 'Error al inscribirse.');
        } finally {
            setAccionLoading(false);
        }
    };

    const handleCancelarInscripcion = async (inscripcionId) => {
        if (!window.confirm("¿Cancelar inscripción?")) return;
        setAccionLoading(true); setAccionError(null); setAccionExito(null);
        try {
            const respuesta = await cancelarInscripcion(inscripcionId);
            setAccionExito(respuesta.mensaje || 'Inscripción eliminada.');
            await cargarEstadoInscripcion(cursoId);
        } catch (error) {
            setAccionError(error.mensaje || 'Error al cancelar.');
        } finally {
            setAccionLoading(false);
        }
    };
    
    // --- Renderizado ---
    if (loading) return <div className="cdp-loading-state"><FaSyncAlt className="cdp-spin" /> CARGANDO DATOS...</div>;
    if (error) return <div className="cdp-error-state">{error}</div>;
    if (!loteSeleccionado) return <div className="cdp-error-state">CURSO NO ENCONTRADO</div>;

    const plan = loteSeleccionado;
    const imagenUrl = plan.plan_imagen_url || plan.plan_banner_default || '/images/defaults/course_placeholder.png';

    return (
        <div 
            className="cdp-main-wrapper" 
            style={{ '--cdp-bg-image-url': 'url(' + imagenUrl + ')' }}
        >
            <div className="cdp-tech-grid-overlay"></div>

            <header className="cdp-header-section cdp-panel-base">
                <div className="cdp-header-decoration-line"></div>
                <div className="cdp-header-top">
                    <h1 className="cdp-title-main">{plan.plan_titulo}</h1> 
                    <div className="cdp-header-meta">
                        <div className="cdp-meta-tag">
                            <FaBookmark />
                            <span>{plan.plan_categoria_nombre || 'GENERAL'}</span>
                        </div>
                         <div className="cdp-meta-tag">
                            <FaUserGraduate />
                            <span>DOCENTE: <Link to={`/perfil/${plan.docente_id}`}>{plan.docente_nombre}</Link></span>
                         </div>
                        <StarRatingDisplay rating={plan.docente_calificacion_promedio} />
                    </div>
                </div>
                <p className="cdp-description-text">{plan.plan_descripcion}</p>
            </header>

            <div className="cdp-feedback-container">
                {accionError && <div className="cdp-msg cdp-msg-error cdp-panel-base"><FaRegTimesCircle/>{accionError}</div>}
                {accionExito && <div className="cdp-msg cdp-msg-success cdp-panel-base"><FaCheckCircle/>{accionExito}</div>}
            </div>

            <div className="cdp-content-grid">
                <div className="cdp-col-left">
                    <LoteSelectorSection
                        todosLosLotesDelPlan={todosLosLotesDelPlan}
                        loteIdActual={plan.lote_id}
                    />
                    <PlanObjectivesSection plan={plan} />
                    <TeacherInfoSection plan={plan} />
                </div> 

                <div className="cdp-col-right">
                     <LoteOpcionCard 
                        lote={plan}
                        estadoInscripcion={estadoInscripcion}
                        handleInscribirse={() => handleInscribirse(plan.lote_id)}
                        handleCancelarInscripcion={() => handleCancelarInscripcion(estadoInscripcion.inscripcionId)}
                        accionLoading={accionLoading}
                        usuario={usuario}
                        loteIdActual={cursoId}
                    />
                </div> 
            </div> 
        </div>
    );
};

// --- Sub-componentes Visuales ---

const LoteSelectorSection = ({ todosLosLotesDelPlan, loteIdActual }) => {
    if (todosLosLotesDelPlan.length <= 1) return null; 
    return (
        <section className="cdp-section-wrapper cdp-panel-base">
            <h2 className="cdp-section-title"><FaCalendarAlt className="cdp-section-icon"/> OTRAS OPCIONES DE HORARIO</h2>
            <div className="cdp-carousel-container">
                {todosLosLotesDelPlan.map(lote => {
                    if (lote.lote_id === loteIdActual) return null;
                    const ModalidadIcon = lote.modalidad === 'virtual' ? FaWifi : FaBuilding;
                    const plazasClase = (lote.cupos_actuales ?? lote.cupos) > 10 ? 'cdp-plazas-high' : (lote.cupos_actuales ?? lote.cupos) > 0 ? 'cdp-plazas-mid' : 'cdp-plazas-low';
                    
                    return (
                        <Link 
                            key={lote.lote_id}
                            to={`/cursos/${lote.lote_id}`}
                            className="cdp-carousel-card"
                            title="Ver este horario"
                        >
                            <div className="cdp-carousel-header">
                                <span className="cdp-tag"><ModalidadIcon /> {capitalizar(lote.modalidad)}</span>
                                <span className="cdp-carousel-price">S/ {Number(lote.precio).toFixed(2)}</span>
                            </div>
                            <div className="cdp-carousel-body">
                                <div className="cdp-info-row">
                                    <FaCalendarCheck /> <span>Inicia: {formatDate(lote.fecha_inicio)}</span>
                                </div>
                                <div className="cdp-info-row">
                                    <FaUsers className={`cdp-plazas-icon ${plazasClase}`}/> 
                                    <span className={`cdp-plazas-text ${plazasClase}`}>
                                        {lote.cupos_actuales ?? lote.cupos} PLAZAS
                                    </span>
                                </div>
                                {(lote.horarios && lote.horarios.length > 0) && (
                                    <div className="cdp-info-row cdp-schedules-list">
                                        <FaRegClock /> <span>Horarios:</span>
                                        <ul className="cdp-inline-tags">
                                            {lote.horarios.map((h, idx) => (
                                                <li key={idx}>{capitalizar(h.dia_semana).substring(0, 3)} {formatTime(h.hora_inicio)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

const PlanObjectivesSection = ({ plan }) => (
    <section className="cdp-section-wrapper cdp-panel-base">
        <h2 className="cdp-section-title"><FaCheckCircle className="cdp-section-icon"/> OBJETIVOS DEL CURSO</h2>
        <ul className="cdp-objectives-list">
            {(plan.plan_objetivos && typeof plan.plan_objetivos === 'string')
                ? plan.plan_objetivos.split('\n').map((obj, index) => obj.trim() && <li key={index}>{obj.trim()}</li>)
                : <li className="cdp-empty-state">Objetivos no especificados por el docente.</li>
            }
        </ul>
    </section>
);

const TeacherInfoSection = ({ plan }) => (
    <section className="cdp-section-wrapper cdp-panel-base">
        <h2 className="cdp-section-title"><FaUserGraduate className="cdp-section-icon"/> DOCENTE A CARGO</h2>
        <div className="cdp-teacher-card">
            <div className="cdp-teacher-avatar">
                <img src={plan.docente_foto_url || '/images/defaults/user_placeholder.png'} alt={`Foto de ${plan.docente_nombre}`} />
            </div>
            <div className="cdp-teacher-info">
                <h3>{plan.docente_nombre}</h3>
                <StarRatingDisplay rating={plan.docente_calificacion_promedio} />
                <p>{plan.docente_biografia?.substring(0, 300)}{plan.docente_biografia?.length > 300 ? '...' : ''}</p>
                <Link to={`/perfil/${plan.docente_id}`} className="cdp-btn cdp-btn-secondary">
                    VER PERFIL PROFESIONAL
                </Link>
            </div>
        </div>
    </section>
);

// --- Panel de Acción (Sidebar) ---
const LoteOpcionCard = ({ lote, estadoInscripcion, handleInscribirse, handleCancelarInscripcion, accionLoading, usuario, loteIdActual }) => {

    const plazasDisponibles = lote.cupos_actuales ?? lote.cupos;
    
    // CORRECCIÓN: Nueva lógica de roles
    const roles = usuario?.roles || [];
    const esEstudiante = roles.includes('estudiante');    
    
    const loteEsProgramado = lote.estado === 'programado';
    const plazasClase = plazasDisponibles > 10 ? 'cdp-plazas-high' : plazasDisponibles > 0 ? 'cdp-plazas-mid' : 'cdp-plazas-low';
    const ModalidadIcon = lote.modalidad === 'virtual' ? FaWifi : FaBuilding;

    const renderActionArea = () => {
        
        if (!loteEsProgramado) {
            return (
                <div className="cdp-status-display cdp-status-closed">
                    <FaExclamationCircle />
                    <span>Inscripciones Cerradas ({capitalizar(lote.estado)})</span>
                </div>
            );
        }

        if (plazasDisponibles <= 0) {
            return <button className="cdp-btn cdp-btn-disabled" disabled>AGOTADO</button>;
        }

        if (!usuario) {
            return (
                <div className="cdp-guest-box">
                    <p className="cdp-guest-text">¿Te interesa este curso?</p>
                    <Link 
                        to={`/auth/login?redirect=/cursos/${loteIdActual}`} 
                        className="cdp-btn cdp-btn-primary"
                    >
                        <FaSignInAlt /> INICIAR SESIÓN
                    </Link>
                </div>
            );
        }

        if (esEstudiante) {
            if (estadoInscripcion.estaInscrito) {
                return (
                    <div className="cdp-enrolled-area">
                        <p className={`cdp-status-box cdp-status-${estadoInscripcion.estado}`}>
                            {estadoInscripcion.estado === 'pendiente_pago' ? <FaHourglassHalf/> : <FaCheckCircle/> }
                            {/* CORRECCIÓN: Validar que 'estado' no sea null antes de toUpperCase */}
                            ESTADO: {(estadoInscripcion.estado || 'pendiente').replace('_', ' ').toUpperCase()}
                        </p>
                        
                        {estadoInscripcion.estado === 'pendiente_pago' && (
                            <>
                                <Link to={`/subir-pago/${estadoInscripcion.inscripcionId}`} className="cdp-btn cdp-btn-primary cdp-mb-1">
                                    <FaMoneyBillWave /> SUBIR COMPROBANTE
                                </Link>
                                <button onClick={() => handleCancelarInscripcion(estadoInscripcion.inscripcionId)} className="cdp-btn cdp-btn-danger" disabled={accionLoading}>
                                    {accionLoading ? 'CANCELANDO...' : 'CANCELAR INSCRIPCIÓN'}
                                </button>
                            </>
                        )}
                         {estadoInscripcion.estado === 'inscrito' && (
                             <p className="cdp-payment-confirmed">¡ACCESO HABILITADO!</p>
                         )}
                    </div>
                );
            } else {
                return (
                    <button onClick={() => handleInscribirse(loteIdActual)} className="cdp-btn cdp-btn-primary" disabled={accionLoading}>
                        {accionLoading ? 'PROCESANDO...' : `INSCRIBIRME AHORA`}
                    </button>
                );
            }
        }

        // CORRECCIÓN: Evitar crash si no es estudiante y mostrar el primer rol disponible
        return (
            <div className="cdp-status-display cdp-status-info">
                <span>VISTA {(roles[0] || 'USUARIO').toUpperCase()} (SOLO LECTURA)</span>
            </div>
        );
    };

    return (
        <div className="cdp-sidebar-card">
            <div className="cdp-sidebar-corner cdp-corner-tl"></div>
            <div className="cdp-sidebar-corner cdp-corner-br"></div>

            <div className="cdp-price-header">
                <FaMoneyBillWave className="cdp-price-icon" />
                <span className="cdp-price-display">S/ {Number(lote.precio).toFixed(2)}</span>
            </div>
            
            <div className="cdp-sidebar-details">
                <div className="cdp-sidebar-grid">
                    <div className="cdp-detail-item">
                        <p className="cdp-label">MODALIDAD</p>
                        <p className="cdp-value"><ModalidadIcon /> {capitalizar(lote.modalidad)}</p>
                    </div>
                    <div className="cdp-detail-item">
                        <p className="cdp-label">PLAZAS</p>
                        <p className={`cdp-availability ${plazasClase}`}>
                            <FaUsers /> {plazasDisponibles > 0 ? `${plazasDisponibles} LIBRES` : 'AGOTADO'}
                        </p>
                    </div>
                    <div className="cdp-detail-item">
                        <p className="cdp-label">DURACIÓN</p>
                        <p className="cdp-value">
                            <FaHourglassHalf /> {lote.duracion_semanas || 'N/A'} Sem.
                        </p>
                    </div>
                    <div className="cdp-detail-item">
                        <p className="cdp-label">FRECUENCIA</p>
                        <p className="cdp-value">
                            <FaSyncAlt /> {lote.frecuencia_semanal || 'N/A'} /Sem.
                        </p>
                    </div>
                </div>

                <div className="cdp-detail-block">
                    <p className="cdp-label">FECHAS PROGRAMADAS</p>
                    <p className="cdp-value cdp-date-range">
                        {formatDate(lote.fecha_inicio)} 
                        <FaArrowRight className="cdp-arrow-icon" />
                    </p>
                </div>

                <div className="cdp-detail-block">
                    <p className="cdp-label">SESIONES SEMANALES</p>
                    <ul className="cdp-sidebar-list">
                        {(lote.horarios && lote.horarios.length > 0) ? (
                            lote.horarios.map((h, index) => (
                                <li key={index} className="cdp-list-item">
                                    <FaRegClock /> <span className="cdp-day-highlight">{capitalizar(h.dia_semana)}:</span> {formatTime(h.hora_inicio)} - {formatTime(h.hora_fin)}
                                </li>
                            ))
                        ) : (
                            <li className="cdp-list-item cdp-empty">Horario no definido.</li>
                        )}
                    </ul>
                </div>
            </div>
            
            <div className="cdp-action-footer">
                {renderActionArea()}
            </div>
        </div>
    );
}

export default CourseDetailPage;