import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    FaCalendarAlt, 
    FaClock, 
    FaChalkboardTeacher, 
    FaCheckCircle, 
    FaExclamationTriangle, 
    FaUpload, 
    FaRocket, 
    FaRedo,
    FaUsers,
    FaGlobeAmericas,
    FaMapMarkerAlt,
    FaPlayCircle,
    FaFileInvoiceDollar,
    FaHourglassHalf,
    FaTimesCircle,
    FaChevronDown,
    FaBook,
    FaChartLine
} from 'react-icons/fa';
// Importar estilos (asume que MisInscripcionesPage.css se importa globalmente o en el padre)

const InscripcionCard = ({ inscripcion }) => {
    const [expanded, setExpanded] = useState(false); 

    const {
        inscripcion_id,
        estado,
        lote_id,
        plan_titulo,
        docente_nombre,
        plan_imagen_url,
        fecha_inicio,
        horarios,
        pago_estado,
        pago_observacion,
        plan_descripcion,
        modalidad,
        cupos_disponibles,
        cupos_totales,
        progreso_curso,
        ultima_clase_fecha,
        plan_precio,
    } = inscripcion;

    // --- Lógica de Estado Visual (Mantenida) ---
    const getVisualState = () => {
        const states = {
            inscrito: {
                borderClass: 'status-active',
                badgeClass: 'badge-active',
                badgeIcon: <FaCheckCircle />,
                badgeText: 'EN CURSO',
                accentColor: 'var(--color-accent-green)',
                glowColor: '0 0 25px rgba(5, 255, 0, 0.6)',
                showProgress: true,
            },
            pendiente_pago: {
                borderClass: 'status-pending',
                badgeClass: 'badge-pending',
                badgeIcon: pago_estado === 'pendiente' ? <FaHourglassHalf /> : <FaExclamationTriangle />,
                badgeText: pago_estado === 'pendiente' ? 'VALIDANDO' : 'PENDIENTE',
                accentColor: 'var(--color-accent-yellow)',
                glowColor: '0 0 25px rgba(254, 234, 0, 0.6)',
                showProgress: false,
            },
            rechazado: {
                borderClass: 'status-rejected',
                badgeClass: 'badge-rejected',
                badgeIcon: <FaTimesCircle />,
                badgeText: 'RECHAZADO',
                accentColor: 'var(--color-highlight-red)', // Usar Highlight Red para borde/glow
                glowColor: '0 0 25px rgba(230, 57, 70, 0.6)',
                showProgress: false,
            },
            finalizado: {
                borderClass: 'status-finished',
                badgeClass: 'badge-finished',
                badgeIcon: <FaCheckCircle />,
                badgeText: 'FINALIZADO',
                accentColor: 'var(--color-status-neutral)', // Usar Gris Neutral
                glowColor: '0 0 20px rgba(136, 136, 136, 0.5)',
                showProgress: true,
            },
            default: {
                borderClass: 'status-neutral',
                badgeClass: 'badge-neutral',
                badgeIcon: <FaExclamationTriangle />,
                badgeText: 'DESCONOCIDO',
                accentColor: 'var(--color-text-tertiary)',
                glowColor: '0 0 20px rgba(136, 136, 170, 0.5)',
                showProgress: false,
            }
        };

        if (pago_estado === 'rechazado') return states.rechazado;
        if (estado === 'inscrito') return states.inscrito;
        if (estado === 'pendiente_pago') return states.pendiente_pago;
        if (estado === 'finalizado') return states.finalizado;
        return states.default;
    };

    const visualState = getVisualState();

    // --- Helpers (Mantenidos) ---
    const formatSchedule = () => {
        if (!horarios || horarios.length === 0) return "Horario por definir";
        if (horarios.length === 1) {
            const h = horarios[0];
            return `${h.dia_semana.charAt(0).toUpperCase() + h.dia_semana.slice(1)}: ${h.hora_inicio.slice(0,5)} - ${h.hora_fin.slice(0,5)}`;
        }
        return `${horarios.length} sesiones semanales`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { 
            day: 'numeric', 
            month: 'short',
            year: 'numeric'
        });
    };

    const formatShortDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { 
            day: 'numeric', 
            month: 'short'
        });
    };

    const getModalidadInfo = () => {
        switch(modalidad) {
            case 'virtual': 
                return { icon: <FaGlobeAmericas />, text: 'Virtual', color: 'var(--color-accent-cyan)' };
            case 'presencial': 
                return { icon: <FaMapMarkerAlt />, text: 'Presencial', color: 'var(--color-accent-blue)' };
            default: 
                return { icon: <FaBook />, text: modalidad, color: 'var(--color-text-tertiary)' };
        }
    };
    const modalidadInfo = getModalidadInfo();

    const calculateProgress = () => {
        if (progreso_curso) return Math.min(progreso_curso, 100);
        if (estado === 'finalizado') return 100;
        if (estado === 'inscrito') return 35; 
        return 0;
    };
    const progress = calculateProgress();

    const calculateAvailability = () => {
        if (!cupos_totales || cupos_totales === 0) {
            return { 
                text: 'Sin límite', 
                color: 'var(--color-accent-green)',
                icon: <FaUsers />,
                porcentaje: 100
            };
        }
        const porcentaje = Math.round((cupos_disponibles / cupos_totales) * 100);
        let estadoCupos;
        
        if (porcentaje > 50) {
            estadoCupos = { text: 'Disponible', color: 'var(--color-accent-green)' };
        } else if (porcentaje > 20) {
            estadoCupos = { text: 'Últimos cupos', color: 'var(--color-accent-yellow)' };
        } else {
            estadoCupos = { text: 'Agotado', color: 'var(--color-highlight-red)' };
        }
        
        return {
            ...estadoCupos,
            icon: <FaUsers />,
            porcentaje,
            disponibles: cupos_disponibles,
            totales: cupos_totales
        };
    };
    const availability = calculateAvailability();


    // --- Renderizado de Botones (CORREGIDO PARA USAR PALETA AZUL REAL/ROJO CARMESÍ) ---
    const renderActionButtons = () => {
        const buttons = {
            inscrito: (
                <div className="card-actions">
                    <Link 
                        to={`/aula/${lote_id}`} 
                        className="action-btn primary-action"
                        // Usar AZUL REAL para la acción principal (Ir al Aula)
                        style={{ 
                            background: `linear-gradient(135deg, var(--color-btn-primary), var(--color-accent-blue))`, 
                            color: 'var(--color-bg-dark)',
                            '--card-accent': 'var(--color-btn-primary)', 
                            '--card-glow': '0 0 25px rgba(75, 135, 255, 0.7)' 
                        }}
                    >
                        <FaRocket /> Ir al Aula
                    </Link>
                    <button 
                        className="action-btn secondary-action"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Ver menos' : 'Ver más'} 
                        <FaChevronDown style={{ 
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                        }} />
                    </button>
                </div>
            ),
            rechazado: (
                <div className="card-actions">
                    <Link 
                        to={`/pagos/reintentar/${inscripcion_id}`} 
                        className="action-btn danger-action"
                        // El estilo de peligro es manejado por la clase .danger-action en CSS,
                        // pero se mantiene la acción de link.
                    >
                        <FaRedo /> Corregir Pago
                    </Link>
                    <button 
                        className="action-btn secondary-action"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Ver menos' : 'Ver más'} 
                        <FaChevronDown style={{ 
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                        }} />
                    </button>
                </div>
            ),
            pendiente_pago: pago_estado !== 'pendiente' ? (
                <div className="card-actions">
                    <Link 
                        to={`/pagos/subir/${inscripcion_id}`} 
                        className="action-btn primary-action"
                        // Usar AZUL REAL para la acción principal (Subir Comprobante)
                        style={{ 
                            background: `linear-gradient(135deg, var(--color-btn-primary), var(--color-accent-blue))`, 
                            color: 'var(--color-bg-dark)',
                            '--card-accent': 'var(--color-btn-primary)', 
                            '--card-glow': '0 0 25px rgba(75, 135, 255, 0.7)'
                        }}
                    >
                        <FaUpload /> Subir Comprobante
                    </Link>
                    <button 
                        className="action-btn secondary-action"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Ver menos' : 'Ver más'} 
                        <FaChevronDown style={{ 
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                        }} />
                    </button>
                </div>
            ) : (
                <div className="card-actions">
                    <button className="action-btn disabled-action" disabled>
                        <FaHourglassHalf /> Validando pago
                    </button>
                    <button 
                        className="action-btn secondary-action"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Ver menos' : 'Ver más'} 
                        <FaChevronDown style={{ 
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                        }} />
                    </button>
                </div>
            ),
            finalizado: (
                <div className="card-actions">
                    <Link 
                        to={`/certificados/${inscripcion_id}`} 
                        className="action-btn primary-action"
                        // Usar AZUL REAL para acción principal (Ver Certificado)
                        style={{ 
                            background: `linear-gradient(135deg, var(--color-btn-primary), var(--color-accent-blue))`, 
                            color: 'var(--color-bg-dark)',
                            '--card-accent': 'var(--color-btn-primary)', 
                            '--card-glow': '0 0 25px rgba(75, 135, 255, 0.7)'
                        }}
                    >
                        <FaCheckCircle /> Ver Certificado
                    </Link>
                    <button 
                        className="action-btn secondary-action"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Ver menos' : 'Ver más'} 
                        <FaChevronDown style={{ 
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                        }} />
                    </button>
                </div>
            ),
            default: (
                <div className="card-actions">
                    <button className="action-btn disabled-action" disabled>
                        <FaClock /> Sin acciones
                    </button>
                    <button 
                        className="action-btn secondary-action"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Ver menos' : 'Ver más'} 
                        <FaChevronDown style={{ 
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                        }} />
                    </button>
                </div>
            )
        };

        if (estado === 'finalizado') return buttons.finalizado;
        if (pago_estado === 'rechazado') return buttons.rechazado;
        if (estado === 'inscrito') return buttons.inscrito; 
        if (estado === 'pendiente_pago') return buttons.pendiente_pago;
        return buttons.default;
    };


    return (
        <article 
            className={`inscripcion-card ${visualState.borderClass}`}
            style={{
                '--card-accent': visualState.accentColor,
                '--card-glow': visualState.glowColor
            }}
        >
            {/* Cabecera con imagen */}
            <div className="card-image-wrapper">
                <img 
                    src={plan_imagen_url || '/images/defaults/course_placeholder.png'} 
                    alt={plan_titulo} 
                    className="card-image"
                    onError={(e) => e.target.src = '/images/defaults/course_placeholder.png'}
                />
                <div className="image-overlay"></div>
                
                {/* Badge de estado */}
                <div 
                    className="card-badge" 
                    style={{ backgroundColor: visualState.accentColor, color: 'var(--color-bg-dark)' }}
                >
                    {visualState.badgeIcon}
                    <span>{visualState.badgeText}</span>
                </div>
            </div>

            {/* Título y docente fuera de card-content para un mejor layout */}
            <div className="card-title-section">
                <h3 className="card-title">{plan_titulo}</h3>
                <div className="card-instructor">
                    <FaChalkboardTeacher />
                    <span>{docente_nombre}</span>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="card-content">
                {/* Descripción corta */}
                <p className="card-description">
                    {plan_descripcion?.substring(0, 120) || 'Descripción del curso no disponible...'}
                </p>

                {/* Información de la inscripción */}
                <div className="card-info-grid">
                    <div className="detail-item">
                        <div className="info-label">
                            <FaCalendarAlt /> Inicia
                        </div>
                        <div className="info-value">{formatDate(fecha_inicio)}</div>
                    </div>
                    
                    <div className="detail-item">
                        <div className="info-label">
                            <FaClock /> Horario
                        </div>
                        <div className="info-value">{formatSchedule()}</div>
                    </div>
                    
                    <div className="detail-item">
                        <div className="info-label">
                            {modalidadInfo.icon} Modalidad
                        </div>
                        <div className="info-value" style={{ color: modalidadInfo.color }}>
                            {modalidadInfo.text}
                        </div>
                    </div>
                    
                    <div className="detail-item">
                        <div className="info-label">
                            <FaUsers /> Cupos
                        </div>
                        <div className="info-value" style={{ color: availability.color }}>
                            {availability.text}
                            {availability.porcentaje < 100 && ` (${availability.disponibles}/${availability.totales})`}
                        </div>
                    </div>
                </div>

                {/* Barra de progreso */}
                {visualState.showProgress && (
                    <div className="progress-container">
                        <div className="progress-header">
                            <span className="progress-label">Progreso del curso</span>
                            <span className="progress-percentage">{progress}%</span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ 
                                    width: `${progress}%`,
                                    backgroundColor: visualState.accentColor,
                                    boxShadow: `0 0 10px ${visualState.glowColor}`
                                }}
                            ></div>
                        </div>
                    </div>
                )}
                
                {/* Última clase (si está inscrito) */}
                {ultima_clase_fecha && estado === 'inscrito' && !expanded && (
                    <div className="last-class-info">
                        <FaPlayCircle />
                        <span>Última clase: {formatShortDate(ultima_clase_fecha)}</span>
                    </div>
                )}

                {/* Observación de pago rechazado */}
                {pago_estado === 'rechazado' && pago_observacion && !expanded && (
                    <div className="payment-alert">
                        <FaExclamationTriangle />
                        <div className="alert-content">
                            <strong>Pago rechazado:</strong>
                            <span>{pago_observacion.substring(0, 80)}...</span>
                        </div>
                    </div>
                )}


                {/* Contenido expandido */}
                {expanded && (
                    <div className="expanded-content">
                        {/* Horarios detallados */}
                        {horarios && horarios.length > 0 && (
                            <div className="expanded-section">
                                <h4>Horarios completos</h4>
                                <div className="schedule-list">
                                    {horarios.map((horario, index) => (
                                        <div key={index} className="schedule-item">
                                            <span className="schedule-day">{horario.dia_semana}</span>
                                            <span className="schedule-time">
                                                {horario.hora_inicio.slice(0,5)} - {horario.hora_fin.slice(0,5)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Información del pago */}
                        <div className="expanded-section">
                            <h4>Estado del pago</h4>
                            <div className="payment-info">
                                <div className="payment-status">
                                    <span className="status-label">Estado:</span>
                                    <span className={`status-value status-${pago_estado}`}>
                                        {pago_estado === 'validado' ? 'Validado ✅' : 
                                         pago_estado === 'pendiente' ? 'Pendiente ⏳' : 
                                         'Rechazado ❌'}
                                    </span>
                                </div>
                                {pago_observacion && (
                                    <div className="payment-observation">
                                        <span className="observation-label">Observación:</span>
                                        <span className="observation-text">{pago_observacion}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Acciones adicionales */}
                        <div className="expanded-section">
                            <h4>Acciones disponibles</h4>
                            <div className="action-buttons-mini">
                                <Link to={`/curso/${lote_id}`} className="action-mini-btn">
                                    <FaBook /> Ver detalles del curso
                                </Link>
                                <Link to={`/docente/${docente_nombre}`} className="action-mini-btn">
                                    <FaChalkboardTeacher /> Ver perfil del docente
                                </Link>
                                {estado === 'inscrito' && (
                                    <Link to={`/progreso/${lote_id}`} className="action-mini-btn">
                                        <FaChartLine /> Ver progreso detallado
                                    </Link>
                                )}
                                {(pago_estado === 'rechazado' || pago_estado === 'pendiente') && (
                                    <Link to={`/pagos/ayuda/${inscripcion_id}`} className="action-mini-btn">
                                        <FaFileInvoiceDollar /> Ayuda con el pago
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer con botones principales */}
            <div className="card-footer">
                {renderActionButtons()}
            </div>
        </article>
    );
};

export default InscripcionCard;