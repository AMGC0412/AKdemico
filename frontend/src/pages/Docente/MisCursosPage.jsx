import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// --- IMPORTACIONES (Corregidas y listas) ---
import { obtenerMisPlanesConLotes } from '../../services/planes.service.js';
import { eliminarLotePorId } from '../../services/lote.service.js';
// ---------------------------------------------------

import { useAuth } from '../../context/AuthContext';
import './MisCursosPage.css'; 
import { 
    FaPlus, FaBook, FaListUl, FaSpinner, 
    FaEdit, FaTrashAlt, FaCalendarCheck, 
    FaTimesCircle, FaCheckCircle, FaExclamationTriangle,
    FaUsers, FaChalkboardTeacher, FaCalendarAlt, FaChevronDown
} from 'react-icons/fa';

// --- Sub-componente: PlanNavItem (Panel Izquierdo) ---
const PlanNavItem = ({ plan, isActive, onClick }) => {
    
    const stats = useMemo(() => {
        const total = plan.lotes.length;
        if (total === 0) return { programado: 0, en_curso: 0, finalizado: 0, total };
        
        const programado = plan.lotes.filter(l => l.estado === 'programado').length;
        const en_curso = plan.lotes.filter(l => l.estado === 'en_curso').length;
        const finalizado = plan.lotes.filter(l => l.estado === 'finalizado').length;
        
        return {
            programado: (programado / total) * 100,
            en_curso: (en_curso / total) * 100,
            finalizado: (finalizado / total) * 100,
            total
        };
    }, [plan.lotes]);

    const gradient = `conic-gradient(
        var(--color-status-programado) 0% ${stats.programado}%,
        var(--color-status-en_curso) ${stats.programado}% ${stats.programado + stats.en_curso}%,
        var(--color-status-finalizado) ${stats.programado + stats.en_curso}% ${stats.programado + stats.en_curso + stats.finalizado}%,
        #e0e0e0 ${stats.programado + stats.en_curso + stats.finalizado}% 100%
    )`;

    return (
        <button
            className={`plan-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClick}
        >
            <div className="plan-nav-chart">
                <div className="donut-chart" style={{ background: gradient }}>
                    <span>{stats.total}</span>
                </div>
            </div>
            <div className="plan-nav-info">
                <span className="plan-nav-title">{plan.titulo}</span>
                <span className="plan-nav-desc">{plan.descripcion || "Sin descripción"}</span>
            </div>
        </button>
    );
};

// --- Sub-componente: PlanHeaderCard (La nueva cabecera clickeable) ---
const PlanHeaderCard = ({ plan, isOpen, onToggle }) => {
    // Calculamos los KPIs para el dashboard
    const kpis = useMemo(() => {
        const lotesActivos = plan.lotes.filter(l => l.estado === 'programado' || l.estado === 'en_curso');
        
        const totalEstudiantes = lotesActivos.reduce((sum, lote) => {
            return sum + (lote.cupos - (lote.cupos_actuales ?? lote.cupos));
        }, 0);

        const proximoLote = plan.lotes
            .filter(l => l.estado === 'programado' && new Date(l.fecha_inicio) > new Date())
            .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))[0];

        return {
            totalLotes: plan.lotes.length,
            totalEstudiantes,
            proximoInicio: proximoLote ? new Date(proximoLote.fecha_inicio).toLocaleDateString('es-PE') : 'N/A'
        };
    }, [plan]);

    return (
        <div className={`plan-header-card ${isOpen ? 'active' : ''}`} onClick={onToggle}>
            {/* Info principal del Plan */}
            <div className="plan-header-info">
                <FaBook className="plan-header-icon" />
                <div className="plan-header-texto">
                    <h3>{plan.titulo}</h3>
                    <p>{plan.descripcion || "Este plan no tiene descripción."}</p>
                </div>
            </div>

            {/* KPIs (Estadísticas clave) */}
            <div className="plan-kpi-stats">
                <div className="kpi-stat-item">
                    <FaChalkboardTeacher />
                    <span>{kpis.totalLotes} {kpis.totalLotes === 1 ? 'Lote' : 'Lotes'}</span>
                </div>
                <div className="kpi-stat-item">
                    <FaUsers />
                    <span>{kpis.totalEstudiantes} {kpis.totalEstudiantes === 1 ? 'Est.' : 'Ests.'}</span>
                </div>
                <div className="kpi-stat-item">
                    <FaCalendarAlt />
                    <span>Inicia: {kpis.proximoInicio}</span>
                </div>
            </div>
            
            {/* Flecha del Acordeón */}
            <FaChevronDown className="accordion-arrow" />
        </div>
    );
};

// --- Sub-componente: LoteCard (Diseño atractivo) ---
const LoteCard = ({ lote, onLoteEliminado }) => {
    const estadoClase = `lote-card status-${lote.estado || 'programado'}`;
    const cuposTotales = lote.cupos;
    const cuposOcupados = cuposTotales - (lote.cupos_actuales ?? 0);
    const porcentajeOcupado = cuposTotales > 0 ? (cuposOcupados / cuposTotales) * 100 : 0;
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const handleEliminar = async () => {
        if (!window.confirm(`¿Estás seguro de eliminar el lote "${lote.id}"?`)) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const respuesta = await eliminarLotePorId(lote.id);
            onLoteEliminado(respuesta.mensaje || "Lote eliminado.");
        } catch (error) {
            setDeleteError(error.mensaje || "Error al eliminar.");
            setDeleting(false);
        }
    };
    
    return (
        <div className={estadoClase}>
            <div className="lote-card-contenido">
                <div className="lote-info-principal">
                    <span className="lote-estado-label">{lote.estado?.replace('_', ' ').toUpperCase()}</span>
                    <span className="lote-fechas">
                        <FaCalendarCheck /> {new Date(lote.fecha_inicio).toLocaleDateString('es-PE')}
                    </span>
                </div>
                <div className="lote-cupos-visual">
                    <div className="cupos-texto">
                        <span>Cupos</span>
                        <span>{cuposOcupados} / {cuposTotales}</span>
                    </div>
                    <div className="cupos-barra">
                        <div className="cupos-barra-progreso" style={{ width: `${porcentajeOcupado}%` }}></div>
                    </div>
                </div>
                <div className="lote-acciones">
                    <Link to={`/docente/lotes/editar/${lote.id}`} className="btn-accion edit" title="Editar Lote">
                        <FaEdit /> <span>Editar</span>
                    </Link>
                    <button 
                        onClick={handleEliminar} 
                        className="btn-accion delete" 
                        disabled={deleting}
                        title="Eliminar Lote"
                    >
                        {deleting ? <FaSpinner className="spinner" /> : <><FaTrashAlt /> <span>Eliminar</span></>}
                    </button>
                </div>
            </div>
            {deleteError && (
                <span className="error-delete-lote">
                    <FaTimesCircle /> {deleteError}
                </span>
            )}
        </div>
    );
};


// --- Componente Principal: MisCursosPage (El Portafolio) ---
const MisCursosPage = () => {
    
    // 1. Llamamos a useAuth() y declaramos todos los estados PRIMERO
    const { usuario } = useAuth(); 
    const [planesConLotes, setPlanesConLotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    // Estado clave del acordeón
    const [openPlanId, setOpenPlanId] = useState(null); 

    // 2. Definimos cargarDatos con useCallback
    const cargarDatos = useCallback(async (mantenerSeleccion = false) => {
        
        if (!usuario) { 
            return; 
        }
        
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerMisPlanesConLotes();
            setPlanesConLotes(data);
            
            // Lógica para establecer el estado de 'openPlanId' de forma segura
            setOpenPlanId(prevId => {
                const planExists = data.find(p => p.id === prevId);

                if (mantenerSeleccion && planExists) {
                    // Mantener el plan abierto si el flag está activo y existe
                    return prevId;
                } else if (data.length > 0) {
                    // Abrir el primer plan si no hay selección válida
                    return data[0].id;
                }
                // Si no hay planes, cerrar todo
                return null;
            });

        } catch (err) {
            setError(err.mensaje || "Error al cargar tus cursos y planes.");
        } finally {
            setLoading(false);
        }
    // Añadimos 'usuario' y quitamos 'selectedPlanId' de dependencias, ya que lo gestionamos con setOpenPlanId(prevId => ...)
    }, [usuario]); 

    // 3. useEffect ahora depende de 'cargarDatos'
    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]); 
    
    // Handler para cuando un lote se elimina (sin cambios)
    const handleLoteEliminado = (mensajeExito) => {
        setSuccessMessage(mensajeExito);
        // Recarga, manteniendo el plan abierto (flag true)
        cargarDatos(true); 
        setTimeout(() => setSuccessMessage(null), 4000);
    };

    // --- NUEVO HANDLER PARA EL ACORDEÓN ---
    const handleTogglePlan = (planId) => {
        // Si hago clic en el que ya está abierto, lo cierro (null)
        // Si hago clic en uno nuevo, lo abro (planId)
        setOpenPlanId(prevId => (prevId === planId ? null : planId));
    };
    // --------------------------------------

    // --- Renderizado de Casos Especiales (Carga, Error, Vacío) ---
    if (loading && planesConLotes.length === 0) {
        return <div className="page-loading"><FaSpinner className="spinner" /> Cargando tu Portafolio...</div>;
    }

    if (error) {
        return <div className="page-container"><div className="message error"><FaTimesCircle /> {error}</div></div>;
    }

    if (planesConLotes.length === 0 && !loading) {
        return (
            <div className="page-container">
                <div className="no-data-box frosted-glass">
                    <FaExclamationTriangle className="no-data-icon" />
                    <h3>Tu portafolio está vacío</h3>
                    <p>Para publicar un curso (Lote), primero necesitas crear un Plan de Estudio.</p>
                    <Link to="/docente/planes/crear" className="btn btn-primary">
                        <FaPlus /> Crear tu primer Plan
                    </Link>
                </div>
            </div>
        );
    }

    // --- RENDERIZADO PRINCIPAL (El Portafolio en Acordeón) ---
    return (
        <div className="page-container mis-cursos-page accordion-layout">
            
            <div className="page-header-actions">
                <h1><FaListUl /> Mi Portafolio de Cursos</h1>
                <Link to="/docente/planes/crear" className="btn btn-primary">
                    <FaPlus /> Crear Nuevo Plan
                </Link>
            </div>

            {/* Mensajes de éxito/recarga */}
            {successMessage && <div className="message success"><FaCheckCircle /> {successMessage}</div>}
            {loading && planesConLotes.length > 0 && <div className="page-loading-inline"><FaSpinner className="spinner" /> Actualizando...</div>}

            {/* --- El Acordeón de Planes --- */}
            <div className="plan-accordion">
                {planesConLotes.map(plan => (
                    <div className="plan-accordion-item" key={plan.id}>
                        {/* 1. La Cabecera Clickeable con KPIs */}
                        <PlanHeaderCard
                            plan={plan}
                            isOpen={openPlanId === plan.id}
                            onToggle={() => handleTogglePlan(plan.id)}
                        />
                        
                        {/* 2. El Contenido Colapsable (Grid de Lotes) */}
                        <div className={`plan-content-wrapper ${openPlanId === plan.id ? 'open' : ''}`}>
                            <div className="plan-content-interior">
                                <div className="lotes-grid-header">
                                    <Link 
                                        to={`/docente/planes/editar/${plan.id}`} 
                                        className="btn btn-secondary btn-sm"
                                    >
                                        <FaEdit /> Editar Plan
                                    </Link>
                                    <Link 
                                        to={`/docente/lotes/crear?planId=${plan.id}`} 
                                        className="btn btn-primary btn-sm"
                                    >
                                        <FaPlus /> Publicar Nuevo Lote
                                    </Link>
                                </div>
                                
                                <div className="lotes-grid">
                                    {plan.lotes.length > 0 ? (
                                        plan.lotes.map(lote => (
                                            <LoteCard 
                                                key={lote.id} 
                                                lote={lote} 
                                                onLoteEliminado={handleLoteEliminado} 
                                            />
                                        ))
                                    ) : (
                                        <p className="no-lotes-msg">Aún no has programado lotes para este plan.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
        </div>
    );
};

export default MisCursosPage;