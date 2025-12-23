/* Archivo: src/components/Estudiante/Sidebar.jsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FaLayerGroup, 
    FaBolt, 
    FaHourglassHalf, 
    FaExclamationCircle, 
    FaFilter,
    FaChartLine,
    FaCalendarAlt,
    FaGraduationCap,
    FaCog,
    FaPlus,
    FaArrowRight,
    FaCheckCircle,
    FaClock,
    FaDollarSign
} from 'react-icons/fa';

// Nota: MisInscripcionesPage.css debe estar importado globalmente o en el padre.

const Sidebar = ({ 
    stats, 
    filterTab, 
    setFilterTab, 
    upcomingClasses, 
    recommendations,
    loading
}) => {
    
    // Evita renderizar la barra lateral en el estado inicial de carga completa, 
    // o si no hay inscripciones para filtrar (el estado vacío se maneja en InscripcionesList)
    if (loading) return null;
    
    // Cálculos para el progreso circular
    const circumference = 2 * Math.PI * 45; // 282.74

    const renderUpcomingClasses = () => {
        if (!upcomingClasses || upcomingClasses.length === 0) return null;
        
        return (
            <div className="sidebar-section">
                <h3>
                    <FaCalendarAlt /> Próximas Clases
                </h3>
                <div className="upcoming-list">
                    {upcomingClasses.slice(0, 3).map((clase, index) => (
                        <div key={index} className="upcoming-item">
                            <div className="upcoming-time">
                                <span className="time">{clase.hora_inicio}</span>
                                <span className="course">{clase.curso_nombre}</span>
                            </div>
                            <Link 
                                to={`/aula/${clase.lote_id}`}
                                className="join-btn"
                            >
                                Unirse
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderRecommendations = () => {
        if (!recommendations || recommendations.length === 0) return null;
        
        return (
            <div className="sidebar-section">
                <h3>
                    <FaGraduationCap /> Te puede interesar
                </h3>
                <div className="recommendations-list">
                    {recommendations.slice(0, 2).map(rec => (
                        <div key={rec.id} className="recommendation-item">
                            <div className="rec-title">{rec.titulo}</div>
                            <div className="rec-meta">{rec.docente_nombre}</div>
                            <Link 
                                to={`/curso/${rec.id}`}
                                className="rec-link"
                            >
                                Ver detalles <FaArrowRight />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <aside className="inscripciones-sidebar">
            
            {/* 3.1. Filtros Rápidos */}
            <div className="sidebar-section">
                <h3>
                    <FaFilter /> Filtros Rápidos
                </h3>
                <div className="filter-tabs">
                    <button 
                        className={`filter-tab ${filterTab === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterTab('all')}
                    >
                        <FaLayerGroup /> Todos los cursos
                        <span className="filter-count">{stats.total}</span>
                    </button>
                    <button 
                        className={`filter-tab ${filterTab === 'active' ? 'active' : ''}`}
                        onClick={() => setFilterTab('active')}
                    >
                        <FaBolt /> En progreso
                        <span className="filter-count">{stats.activos}</span>
                    </button>
                    <button 
                        className={`filter-tab ${filterTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilterTab('pending')}
                    >
                        <FaHourglassHalf /> Pendientes
                        <span className="filter-count">{stats.pendientes}</span>
                    </button>
                    <button 
                        className={`filter-tab ${filterTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilterTab('completed')}
                    >
                        <FaCheckCircle /> Completados
                        <span className="filter-count">{stats.finalizados}</span>
                    </button>
                    {stats.rechazados > 0 && (
                        <button 
                            className={`filter-tab ${filterTab === 'rejected' ? 'active' : ''}`}
                            onClick={() => setFilterTab('rejected')}
                        >
                            <FaExclamationCircle /> Rechazados
                            <span className="filter-count">{stats.rechazados}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 3.2. Progreso general */}
            {stats.progresoPromedio > 0 && (
                <div className="sidebar-section progress-container">
                    <h3>
                        <FaChartLine /> Tu Progreso
                    </h3>
                    <div className="progress-circle-wrapper">
                        <svg viewBox="0 0 100 100">
                            <circle 
                                className="progress-circle-bg" 
                                cx="50" cy="50" r="45"
                            />
                            <circle 
                                className="progress-circle-fill" 
                                cx="50" cy="50" r="45"
                                strokeDasharray={`${stats.progresoPromedio * (circumference / 100)} ${circumference}`}
                                strokeDashoffset="0"
                            />
                        </svg>
                        <div className="progress-value">{stats.progresoPromedio}%</div>
                    </div>
                    <div className="progress-label">
                        Progreso promedio en tus cursos activos
                    </div>
                </div>
            )}

            {/* 3.3. Próximas clases */}
            {renderUpcomingClasses()}

            {/* 3.4. Recomendaciones */}
            {renderRecommendations()}

            {/* 3.5. Acciones rápidas */}
            <div className="sidebar-section">
                <h3>
                    <FaCog /> Acciones Rápidas
                </h3>
                <div className="quick-actions">
                    <Link to="/buscar" className="quick-action-btn explore">
                        <FaPlus /> Explorar nuevos cursos
                    </Link>
                    <Link to="/calendario" className="quick-action-btn">
                        <FaCalendarAlt /> Ver calendario
                    </Link>
                    <Link to="/certificados" className="quick-action-btn">
                        <FaGraduationCap /> Mis certificados
                    </Link>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;