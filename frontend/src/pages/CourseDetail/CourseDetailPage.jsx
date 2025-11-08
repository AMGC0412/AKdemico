import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; 
import { obtenerDetalleLotePorId, obtenerLotesPorPlanId } from '../../services/lote.service.js';
import { inscribirseEnLote, obtenerMiEstadoInscripcionEnLote, cancelarInscripcion } from '../../services/inscripcion.service.js';
import { useAuth } from '../../context/AuthContext';
import './CourseDetailPage.css'; 
import { 
    FaCalendarAlt, FaClock, FaHourglassHalf, FaUsers, 
    FaCheckCircle, FaInfoCircle, FaUserGraduate, FaMoneyBillWave, FaArrowRight,
    FaChalkboardTeacher, FaStar, FaMapMarkerAlt, FaLaptopCode,
    FaCalendarCheck // <-- ¡CORRECCIÓN FINAL! Icono añadido.
} from 'react-icons/fa';

// --- Funciones de Formato (sin cambios) ---
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
// ------------------------------------------

// --- Sub-componente: StarRatingDisplay ---
const StarRatingDisplay = ({ rating }) => {
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating === 0) return <span className="rating-unavailable">Sin calificación</span>;
    const ratingValue = numericRating.toFixed(1);
    return (
        <div className="star-rating-display">
            <FaStar className="star-icon-rating" />
            <span className="rating-number">{ratingValue}</span>
        </div>
    );
};


// --- Componente Principal (Lógica de Carga y Hooks) ---
const CourseDetailPage = () => {
    const { cursoId } = useParams(); // ID del LOTE seleccionado
    const { usuario } = useAuth();
    
    // --- ESTADOS ---
    const [loteSeleccionado, setLoteSeleccionado] = useState(null);
    const [todosLosLotesDelPlan, setTodosLosLotesDelPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accionLoading, setAccionLoading] = useState(false);
    const [accionError, setAccionError] = useState(null);
    const [accionExito, setAccionExito] = useState(null);
    const [estadoInscripcion, setEstadoInscripcion] = useState({
        cargando: true,
        estaInscrito: false,
        estado: null, 
        inscripcionId: null 
    });

    // --- Función para cargar el ESTADO DE INSCRIPCIÓN (sin cambios) ---
    const cargarEstadoInscripcion = useCallback(async (loteId) => {
        if (usuario && usuario.rol === 'estudiante') {
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


    // --- FUNCIÓN DE CARGA PRINCIPAL (sin cambios en lógica) ---
    const cargarDatosCompletos = useCallback(async () => {
        setLoading(true); setError(null); setAccionExito(null); setAccionError(null);

        try {
            const dataLote = await obtenerDetalleLotePorId(cursoId);
            setLoteSeleccionado(dataLote);
            
            // Si el backend falla aquí, el log de la consola lo mostrará
            const todosLotes = await obtenerLotesPorPlanId(dataLote.plan_id); 
            setTodosLosLotesDelPlan(todosLotes);

            await cargarEstadoInscripcion(cursoId);

        } catch (err) {
            setError('Error al cargar la página del curso. Asegúrate que el backend está corriendo y la ruta /by-plan/ existe.');
            console.error(err);
            setLoteSeleccionado(null);
            setTodosLosLotesDelPlan([]);
        } finally {
            setLoading(false);
        }
    }, [cursoId, cargarEstadoInscripcion]);

    // Efecto 1: Carga inicial de datos y Efecto 2: Recarga el estado
    useEffect(() => {
        if(cursoId) {
            cargarDatosCompletos();
        } else {
            setError('ID de curso no válido.');
            setLoading(false);
        }
    }, [cursoId, cargarDatosCompletos]);


    // --- Funciones de Acciones (Inscribirse/Cancelar) ---
    const handleInscribirse = async (loteId) => {
        setAccionLoading(true); setAccionError(null); setAccionExito(null);
        try {
            const respuesta = await inscribirseEnLote(loteId);
            setAccionExito(respuesta.mensaje || '¡Inscripción exitosa! Procede a subir tu comprobante.');
            await cargarEstadoInscripcion(loteId);
        } catch (error) {
            setAccionError(error.mensaje || 'No se pudo completar la inscripción.');
        } finally {
            setAccionLoading(false);
        }
    };

    const handleCancelarInscripcion = async (inscripcionId) => {
        if (!window.confirm("¿Estás seguro de cancelar tu inscripción?")) return;
        setAccionLoading(true); setAccionError(null); setAccionExito(null);
        try {
            const respuesta = await cancelarInscripcion(inscripcionId);
            setAccionExito(respuesta.mensaje || 'Inscripción eliminada.');
            await cargarEstadoInscripcion(cursoId);
        } catch (error) {
            setAccionError(error.mensaje || 'No se pudo cancelar la inscripción.');
        } finally {
            setAccionLoading(false);
        }
    };
    
    // --- Renderizado ---

    if (loading) return <div className="page-loading">Cargando detalles del Plan...</div>;
    if (error) return <div className="page-error">{error}</div>;
    if (!loteSeleccionado) return <div className="page-error">Lote de Curso no encontrado.</div>;

    const plan = loteSeleccionado; 
    const otrosLotes = todosLosLotesDelPlan.filter(l => l.lote_id !== plan.lote_id);


    return (
        <div className="course-detail-page-final">
            
            {/* --- 1. CABECERA PRINCIPAL (PLAN) --- */}
            <header className="plan-header-content">
                <div className="plan-header-top">
                    <h1 className="plan-title-final">{plan.plan_titulo}</h1> 
                    <div className="plan-header-meta">
                        <div className="meta-item-tag">
                            {plan.modalidad === 'virtual' ? <FaLaptopCode /> : <FaMapMarkerAlt />}
                            <span>{capitalizar(plan.modalidad)}</span>
                        </div>
                        <div className="meta-item-tag">
                            <FaUserGraduate />
                            <span><Link to={`/docentes/${plan.docente_id}`}>{plan.docente_nombre}</Link></span>
                        </div>
                        <StarRatingDisplay rating={plan.docente_calificacion_promedio} />
                    </div>
                </div>
                <p className="plan-description-final">{plan.plan_descripcion}</p>
            </header>

            {/* Mensajes de feedback */}
            <div className="feedback-area">
                {accionError && <div className="message error">{accionError}</div>}
                {accionExito && <div className="message success">{accionExito}</div>}
            </div>

            {/* --- 2. LAYOUT PRINCIPAL (Contenido y Sidebar de Acción) --- */}
            <div className="detail-main-content-layout">
                
                {/* A. COLUMNA PRINCIPAL (Contenido del Plan) */}
                <div className="content-column-plan">
                    
                    {/* --- Horario de este Lote (Prioridad) --- */}
                    <section className="current-lote-details-section">
                        {/* Esta es la línea 195 del log de error */}
                        <h2><FaCalendarCheck /> Horario y Fechas del Lote</h2>
                        <div className="lote-schedule-box">
                            <div className="schedule-meta-chip">
                                <FaCalendarAlt /> <strong>Inicio:</strong> {formatDate(plan.fecha_inicio)}
                            </div>
                            <div className="schedule-meta-chip">
                                <FaCalendarAlt /> <strong>Fin:</strong> {formatDate(plan.fecha_fin)}
                            </div>
                             <div className="schedule-meta-chip">
                                <FaHourglassHalf /> <strong>Duración:</strong> {plan.duracion_semanas || 'N/A'} semanas
                            </div>

                        </div>
                        
                        <h3 className="horario-title">Sesiones Semanales</h3>
                        <ul className="current-horarios-list">
                            {plan.horarios && plan.horarios.length > 0 ? (
                                plan.horarios.map((h, index) => (
                                    <li key={index} className="horario-item-current">
                                        <FaClock /> <span>{capitalizar(h.dia_semana)}</span>: {formatTime(h.hora_inicio)} - {formatTime(h.hora_fin)}
                                    </li>
                                ))
                            ) : (
                                <li>Horario no definido.</li>
                            )}
                        </ul>
                    </section>
                    
                    {/* --- Objetivos de Aprendizaje --- */}
                    <section className="plan-objectives-section">
                        <h2><FaCheckCircle className="section-icon"/> Lo que Aprenderás (Objetivos del Plan)</h2>
                        <ul className="learning-objectives-grid">
                            {plan.plan_objetivos ? plan.plan_objetivos.split('\n').map((obj, index) => obj.trim() && <li key={index}>{obj.trim()}</li>) : <li>Objetivos no especificados para este Plan.</li>}
                        </ul>
                    </section>
                    
                     {/* --- Tarjeta Docente (Limpiada) --- */}
                    <section className="teacher-info-section">
                        <h2><FaUserGraduate className="section-icon"/> Conoce a {plan.docente_nombre}</h2>
                        <div className="teacher-card-large">
                            <div className="teacher-avatar-large">[Avatar Docente]</div>
                            <div className="teacher-details">
                                <h3>{plan.docente_nombre}</h3>
                                <StarRatingDisplay rating={plan.docente_calificacion_promedio} />
                                <p>{plan.docente_biografia?.substring(0, 300)}{plan.docente_biografia?.length > 300 ? '...' : ''}</p>
                                <Link to={`/docentes/${plan.docente_id}`} className="btn btn-secondary">
                                    Ver Perfil Completo
                                </Link>
                            </div>
                        </div>
                    </section>
                    
                </div> {/* Fin content-column-plan */}

                {/* B. SIDEBAR DE ACCIÓN (LOTE) */}
                <div className="sidebar-action-column">
                     <LoteOpcionCard 
                        lote={plan}
                        estadoInscripcion={estadoInscripcion}
                        handleInscribirse={() => handleInscribirse(plan.lote_id)}
                        handleCancelarInscripcion={() => handleCancelarInscripcion(estadoInscripcion.inscripcionId)}
                        accionLoading={accionLoading}
                        usuario={usuario}
                        loteIdActual={cursoId}
                    />
                    
                    {/* --- OTRAS OPCIONES DE HORARIO (Carrusel) --- */}
                    {otrosLotes.length > 0 && (
                        <div className="other-options-section">
                            <h2><FaArrowRight className="section-icon"/> Ver Otros Horarios</h2>
                            <div className="options-carousel">
                                {otrosLotes.map(otroLote => (
                                    <Link 
                                        key={otroLote.lote_id}
                                        to={`/cursos/${otroLote.lote_id}`}
                                        className="option-card-carousel"
                                        title="Ver detalle de este horario"
                                    >
                                        <div className="card-header-carousel">
                                            <span className="carousel-tag">{otroLote.modalidad === 'virtual' ? '💻 Virtual' : '📍 Presencial'}</span>
                                            <span className="carousel-price">S/ {Number(otroLote.precio).toFixed(2)}</span>
                                        </div>
                                        <div className="card-body-carousel">
                                            <div className="card-horario-info">
                                                <FaCalendarAlt />
                                                <span>Inicia: {formatDate(otroLote.fecha_inicio)}</span>
                                            </div>
                                            <div className="card-horario-info">
                                                <FaUsers />
                                                <span>{otroLote.cupos_actuales ?? otroLote.cupos} Plazas</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div> {/* Fin sidebar-action-column */}
            </div> {/* Fin detail-main-content-layout */}
        </div>
    );
};

export default CourseDetailPage;

// --- Sub-componente 2: Tarjeta de Opción de Lote (Ahora está en el sidebar) ---
const LoteOpcionCard = ({ lote, estadoInscripcion, handleInscribirse, handleCancelarInscripcion, accionLoading, usuario, loteIdActual }) => {

    const mostrarBotonInscribirse = usuario && usuario.rol === 'estudiante' && !estadoInscripcion.estaInscrito;

    const renderHorarios = () => (
        <ul className="horarios-list-detalle-opcion">
            {lote.horarios && lote.horarios.length > 0 ? (
                lote.horarios.map((h, index) => (
                    <li key={index}>
                        {capitalizar(h.dia_semana)} de {formatTime(h.hora_inicio)} a {formatTime(h.hora_fin)}
                    </li>
                ))
            ) : (
                <li>Horario no definido.</li>
            )}
        </ul>
    );
    
    const plazasDisponibles = lote.cupos_actuales ?? lote.cupos;
    const plazasClase = plazasDisponibles > 5 ? 'plazas-alta' : plazasDisponibles > 0 ? 'plazas-media' : 'plazas-baja';

    return (
        <div className="purchase-action-box-final">
            <div className="price-info-action-final">
                <span className="price-tag-large">S/ {Number(lote.precio).toFixed(2)}</span>
            </div>
            
            {/* Contenido principal del sidebar */}
            <div className="sidebar-lote-details">
                <p className="sidebar-horario-label">Fechas:</p>
                <p className="sidebar-fechas">{formatDate(lote.fecha_inicio)} al {formatDate(lote.fecha_fin)}</p>

                <p className="sidebar-horario-label">Disponibilidad:</p>
                <p className={`availability-info ${plazasClase}`}>
                    <FaUsers /> {plazasDisponibles > 0 ? `${plazasDisponibles} Plazas Disponibles` : '¡AGOTADO!'}
                </p>
            </div>
            
            {/* LÓGICA DE BOTONES */}
            {plazasDisponibles <= 0 && <button className="btn btn-disabled btn-full" disabled>Plazas Agotadas</button>}
            
            {plazasDisponibles > 0 && estadoInscripcion.estaInscrito && (
                 <div className="inscrito-actions">
                    <p className="status-inscrito">✅ Inscrito: {capitalizar(estadoInscripcion.estado).replace('_', ' ')}</p>
                    
                    {estadoInscripcion.estado === 'pendiente_pago' && (
                        <>
                            <Link
                                to={`/subir-pago/${estadoInscripcion.inscripcionId}`}
                                className="btn btn-secondary btn-full btn-margen-inf"
                            >
                                <FaMoneyBillWave /> Subir Comprobante
                            </Link>
                            <button
                                onClick={() => handleCancelarInscripcion(estadoInscripcion.inscripcionId)}
                                className="btn btn-danger btn-full"
                                disabled={accionLoading}
                            >
                                {accionLoading ? 'Cancelando...' : 'Cancelar Inscripción'}
                            </button>
                        </>
                    )}
                     {estadoInscripcion.estado === 'inscrito' && (
                         <p className="pago-confirmado">Pago validado y confirmado. ¡Listo para empezar!</p>
                     )}
                </div>
            )}
            
            {plazasDisponibles > 0 && mostrarBotonInscribirse && !estadoInscripcion.estaInscrito && (
                <button
                    onClick={() => handleInscribirse(loteIdActual)}
                    className="btn btn-primary btn-full"
                    disabled={accionLoading}
                >
                    {accionLoading ? 'Procesando...' : `Inscribirme Ahora`}
                </button>
            )}

            {!usuario && (
                 <Link to={`/login?redirect=/cursos/${lote.lote_id}`} className="btn btn-primary btn-full">
                    Inicia Sesión para Inscribirte
                 </Link>
            )}
        </div>
    );
}