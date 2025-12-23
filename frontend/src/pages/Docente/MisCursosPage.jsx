import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';

// --- IMPORTACIONES ---
import { obtenerMisPlanesConLotes } from '../../services/planes.service.js';
import { eliminarLotePorId } from '../../services/lote.service.js';
import { useAuth } from '../../context/AuthContext';
import './MisCursosPage.css'; 
import { 
    FaPlus, FaBook, FaListUl, FaSpinner, 
    FaEdit, FaTrashAlt, FaCalendarCheck, 
    FaTimesCircle, FaCheckCircle, FaExclamationTriangle,
    FaUsers, FaChalkboardTeacher, FaCalendarAlt, FaChevronDown,
    FaRegCalendarAlt, FaRegUser, FaLayerGroup, FaDollarSign 
} from 'react-icons/fa';


// --- FUNCIÓN AUXILIAR ---
const getEstadoLote = (lote) => {
    if (lote.estado === 'cancelado' || lote.estado === 'finalizado') {
        return lote.estado;
    }
    if (lote.fecha_fin && new Date(lote.fecha_fin) < new Date()) {
        return 'finalizado';
    }
    return lote.estado;
};

// --- Sub-componente: PlanHeaderCard ---
const PlanHeaderCard = ({ plan, isOpen, onToggle }) => {
    const kpis = useMemo(() => {
        const lotesReales = plan.lotes.map(l => ({ ...l, estado_real: getEstadoLote(l) }));
        const lotesActivos = lotesReales.filter(l => l.estado_real === 'programado' || l.estado_real === 'en_curso');
        
        const totalEstudiantes = lotesActivos.reduce((sum, lote) => {
            return sum + (lote.cupos - (lote.cupos_actuales ?? 0)); 
        }, 0);
        
        const ingresoPotencial = plan.lotes.reduce((sum, lote) => {
            return sum + (lote.cupos * (lote.precio || 0));
        }, 0);

        const proximoLote = lotesReales
            .filter(l => l.estado_real === 'programado' && new Date(l.fecha_inicio) > new Date())
            .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))[0];

        return {
            totalLotes: plan.lotes.length,
            totalEstudiantes,
            ingresoPotencial,
            proximoInicio: proximoLote ? new Date(proximoLote.fecha_inicio).toLocaleDateString('es-PE') : 'N/A'
        };
    }, [plan.lotes]);
    
    const formatCurrency = (amount) => {
        return amount.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    return (
        <div className={`plan-header-card ${isOpen ? 'active' : ''}`} onClick={onToggle}>
            <div className="plan-header-info">
                <FaBook className="plan-header-icon" />
                <div className="plan-header-texto">
                    <h3>{plan.titulo}</h3>
                    <p>{plan.descripcion || "Este plan no tiene descripción."}</p>
                </div>
            </div>

            <div className="plan-kpi-stats">
                <div className="kpi-stat-item lotes">
                    <span className="kpi-label"><FaLayerGroup /> Lotes Totales</span>
                    <span className="kpi-value">{kpis.totalLotes}</span>
                </div>
                <div className="kpi-stat-item students">
                    <span className="kpi-label"><FaRegUser /> Estudiantes Activos</span>
                    <span className="kpi-value">{kpis.totalEstudiantes}</span>
                </div>
                <div className="kpi-stat-item revenue">
                    <span className="kpi-label"><FaDollarSign /> Ingreso Potencial</span>
                    <span className="kpi-value">{formatCurrency(kpis.ingresoPotencial)}</span>
                </div>
                <div className="kpi-stat-item date">
                    <span className="kpi-label"><FaRegCalendarAlt /> Próximo Inicio</span>
                    <span className="kpi-value">{kpis.proximoInicio}</span>
                </div>
            </div>
            
            <FaChevronDown className="accordion-arrow" />
        </div>
    );
};

// --- Sub-componente: LoteCard ---
const LoteCard = ({ lote, onLoteEliminado }) => {
    const estadoReal = getEstadoLote(lote);
    const estadoClase = `lote-card status-${estadoReal}`;
    
    const cuposTotales = lote.cupos;
    const cuposOcupados = cuposTotales - (lote.cupos_actuales ?? 0);
    const porcentajeOcupado = cuposTotales > 0 ? (cuposOcupados / cuposTotales) * 100 : 0;
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const getProgressColorClass = () => {
        if (porcentajeOcupado > 80) return 'high';
        if (porcentajeOcupado >= 50) return 'medium';
        return 'low';
    };
    
    const isEditable = estadoReal === 'programado';

    const handleEliminar = async () => {
        if (!window.confirm(`¿Estás seguro de eliminar el lote "${lote.id}"? Esta acción es irreversible.`)) return;
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
                    <span className="lote-estado-label">{estadoReal?.replace('_', ' ').toUpperCase()}</span>
                    <span className="lote-fechas">
                        <FaCalendarCheck /> {new Date(lote.fecha_inicio).toLocaleDateString('es-PE')}
                        {lote.fecha_fin && ` - ${new Date(lote.fecha_fin) .toLocaleDateString('es-PE')}`}
                    </span>
                </div>
                <div className="lote-cupos-visual">
                    <div className="cupos-texto">
                        <span>Cupos Ocupados</span>
                        <span>{cuposOcupados} / {cuposTotales}</span>
                    </div>
                    <div className="cupos-barra">
                        <div 
                            className={`cupos-barra-progreso ${getProgressColorClass()}`} 
                            style={{ width: `${porcentajeOcupado}%` }}
                        ></div>
                    </div>
                </div>
                <div className="lote-acciones">
                    <Link 
                        to={`/docente/lotes/editar/${lote.id}`} 
                        className={`btn-accion edit ${!isEditable ? 'btn-secondary' : ''}`} 
                        title={isEditable ? "Editar Lote" : "No editable"}
                        style={{ pointerEvents: isEditable ? 'auto' : 'none', opacity: isEditable ? 1 : 0.5 }}
                    >
                        <FaEdit /> <span>Editar {isEditable ? '' : ' (Finalizado)'}</span>
                    </Link>
                    <button 
                        onClick={handleEliminar} 
                        className="btn-accion delete" 
                        disabled={deleting}
                        title="Eliminar Lote"
                    >
                        {deleting ? <FaSpinner className="spinner" /> : <><FaTrashAlt /> <span>Eliminar Lote</span></>}
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


// --- Componente Principal: MisCursosPage ---
const MisCursosPage = () => {
    
    // [MODIFICADO] Extraemos authLoading para sincronizar la validación de roles
    const { usuario, loading: authLoading } = useAuth(); 
    const [planesConLotes, setPlanesConLotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [openPlanId, setOpenPlanId] = useState(null); 

    const cargarDatos = useCallback(async (mantenerSeleccion = false) => {
        // [CORRECCIÓN CRÍTICA] Validación por arreglo de roles
        if (!usuario || !usuario.roles?.includes('docente')) return; 
        
        setLoading(true); setError(null);
        try {
            const data = await obtenerMisPlanesConLotes();
            setPlanesConLotes(data);
            
            setOpenPlanId(prevId => {
                const planExists = data.find(p => p.id === prevId);
                if (mantenerSeleccion && planExists) return prevId;
                else if (data.length > 0) return data[0].id;
                return null;
            });
        } catch (err) {
            setError(err.mensaje || "Error al cargar tus cursos y planes.");
        } finally {
            setLoading(false);
        }
    }, [usuario]); 

    // [MODIFICADO] Esperar a que la autenticación termine antes de cargar datos
    useEffect(() => { 
        if (!authLoading) {
            cargarDatos(); 
        }
    }, [cargarDatos, authLoading]); 
    
    const handleLoteEliminado = (mensajeExito) => {
        setSuccessMessage(mensajeExito);
        cargarDatos(true); 
        setTimeout(() => setSuccessMessage(null), 4000);
    };

    const handleTogglePlan = (planId) => {
        setOpenPlanId(prevId => (prevId === planId ? null : planId));
    };

    // --- [NUEVO] PROTECCIONES DE RENDERIZADO ---
    if (authLoading) {
        return <div className="page-loading"><FaSpinner className="spinner" /> Verificando Credenciales...</div>;
    }

    // Doble seguridad: Si no es docente, redirigir a inicio
    if (!usuario || !usuario.roles?.includes('docente')) {
        return <Navigate to="/" replace />;
    }

    // --- Renderizado Casos Especiales ---
    if (loading && planesConLotes.length === 0) {
        return <div className="page-loading"><FaSpinner className="spinner" /> Cargando Portafolio...</div>;
    }

    if (error) {
        return <div className="mis-cursos-page"><div className="message error"><FaTimesCircle /> {error}</div></div>;
    }

    if (planesConLotes.length === 0 && !loading) {
        return (
            <div className="mis-cursos-page">
                <div className="no-data-box frosted-glass">
                    <FaExclamationTriangle className="no-data-icon" />
                    <h3>Tu portafolio está vacío</h3>
                    <p>Para publicar un curso, primero necesitas crear un Plan de Estudio.</p>
                    <Link to="/docente/planes/crear" className="btn btn-primary">
                        <FaPlus /> Crear tu primer Plan
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mis-cursos-page">
            <div className="mis-cursos-header-panel">
                <div className="header-title-group">
                    <h1><FaListUl /> Mi Portafolio</h1>
                    <p className="header-subtitle">Gestión centralizada de planes de estudio y lotes activos.</p>
                </div>
                <Link to="/docente/planes/crear" className="btn btn-primary">
                    <FaPlus /> Crear Nuevo Plan
                </Link>
            </div>

            <div className="mis-cursos-content">
                {successMessage && <div className="message success"><FaCheckCircle /> {successMessage}</div>}
                {loading && planesConLotes.length > 0 && <div className="page-loading-inline"><FaSpinner className="spinner" /> Actualizando...</div>}

                <div className="plan-accordion">
                    {planesConLotes.map(plan => (
                        <div className="plan-accordion-item" key={plan.id}>
                            <PlanHeaderCard
                                plan={plan}
                                isOpen={openPlanId === plan.id}
                                onToggle={() => handleTogglePlan(plan.id)}
                            />
                            
                            <div className={`plan-content-wrapper ${openPlanId === plan.id ? 'open' : ''}`}>
                                <div className="plan-content-interior">
                                    <div className="lotes-grid-header">
                                        <Link to={`/docente/planes/editar/${plan.id}`} className="btn btn-secondary btn-sm">
                                            <FaEdit /> Editar Plan
                                        </Link>
                                        <Link to={`/docente/lotes/crear?planId=${plan.id}`} className="btn btn-primary btn-sm">
                                            <FaPlus /> Publicar Nuevo Lote
                                        </Link>
                                    </div>
                                    
                                    <div className="lotes-grid">
                                        {plan.lotes.length > 0 ? (
                                            plan.lotes.map(lote => (
                                                <LoteCard key={lote.id} lote={lote} onLoteEliminado={handleLoteEliminado} />
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
        </div>
    );
};

export default MisCursosPage;