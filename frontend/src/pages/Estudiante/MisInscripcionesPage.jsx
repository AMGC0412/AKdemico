import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    getMisInscripciones, 
    getProgressStats, 
    getUpcomingClasses,
    getCourseRecommendations 
} from '../../services/inscripcion.service'; // Asume que este path es correcto

// Componentes Presentacionales
import DashboardHeader from '../../components/Estudiante/DashboardHeader'; // NUEVO
import Sidebar from '../../components/Estudiante/Sidebar';               // NUEVO
import InscripcionesList from '../../components/Estudiante/InscripcionesList'; // NUEVO

import './MisInscripcionesPage.css';

const MisInscripcionesPage = () => {
    // --- ESTADO Y DATA FETCHING ---
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progressStats, setProgressStats] = useState(null);
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    
    // --- ESTADO DE INTERACCIÓN (Filtros y Ordenamiento) ---
    const [filterTab, setFilterTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('recientes');
    
    const { authToken, user } = useAuth();
    const navigate = useNavigate();

    const cargarData = useCallback(async () => {
        if (!authToken) {
            navigate('/login');
            return;
        }
        
        try {
            setLoading(true);
            
            const [inscData, statsData, upcomingData, recData] = await Promise.all([
                getMisInscripciones(authToken),
                getProgressStats(authToken),
                getUpcomingClasses(authToken),
                getCourseRecommendations(authToken)
            ]);
            
            setInscripciones(inscData);
            setProgressStats(statsData);
            setUpcomingClasses(upcomingData);
            setRecommendations(recData);
            setError(null);
            
        } catch (err) {
            console.error('Error cargando datos:', err);
            setError("Error de conexión con el servidor. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    }, [authToken, navigate]);
    
    useEffect(() => {
        cargarData();
    }, [cargarData]);

    // --- CÁLCULOS DE ESTADÍSTICAS (Memoizados) ---
    const stats = useMemo(() => {
        const total = inscripciones.length;
        const activos = inscripciones.filter(i => i.estado === 'inscrito').length;
        const pendientes = inscripciones.filter(i => i.estado === 'pendiente_pago' && i.pago_estado !== 'rechazado').length;
        const finalizados = inscripciones.filter(i => i.estado === 'finalizado').length;
        const rechazados = inscripciones.filter(i => i.pago_estado === 'rechazado').length;
        
        const cursosActivos = inscripciones.filter(i => i.estado === 'inscrito');
        const progresoPromedio = cursosActivos.length > 0 
            ? cursosActivos.reduce((acc, curr) => acc + (curr.progreso_curso || 0), 0) / cursosActivos.length
            : 0;
            
        return { 
            total, 
            activos, 
            pendientes, 
            finalizados,
            rechazados,
            progresoPromedio: Math.round(progresoPromedio)
        };
    }, [inscripciones]);

    // --- FILTRADO Y ORDENAMIENTO (Memoizados) ---
    const filteredInscripciones = useMemo(() => {
        let filtered = [...inscripciones];
        
        // 1. Filtrar por pestaña
        if (filterTab !== 'all') {
            switch(filterTab) {
                case 'active': filtered = filtered.filter(i => i.estado === 'inscrito'); break;
                case 'pending': filtered = filtered.filter(i => i.estado === 'pendiente_pago' && i.pago_estado !== 'rechazado'); break;
                case 'completed': filtered = filtered.filter(i => i.estado === 'finalizado'); break;
                case 'rejected': filtered = filtered.filter(i => i.pago_estado === 'rechazado'); break;
                default: break;
            }
        }
        
        // 2. Buscar por término
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(i => 
                i.plan_titulo.toLowerCase().includes(term) ||
                i.docente_nombre.toLowerCase().includes(term) ||
                (i.plan_descripcion && i.plan_descripcion.toLowerCase().includes(term))
            );
        }
        
        // 3. Ordenar
        filtered.sort((a, b) => {
            switch(sortBy) {
                case 'recientes':
                    return new Date(b.fecha_inscripcion) - new Date(a.fecha_inscripcion);
                case 'progreso':
                    return (b.progreso_curso || 0) - (a.progreso_curso || 0);
                case 'nombre':
                    return a.plan_titulo.localeCompare(b.plan_titulo);
                case 'fecha':
                    return new Date(a.fecha_inicio) - new Date(b.fecha_inicio);
                default:
                    return 0;
            }
        });
        
        return filtered;
    }, [inscripciones, filterTab, searchTerm, sortBy]);
    
    // Función para manejar el reintento de conexión
    const handleRetry = () => {
        setError(null);
        cargarData();
    }


    return (
        <div className="mis-inscripciones-page">
            <div className="inscripciones-container">
                
                {/* 1. Dashboard Header y Stats */}
                <DashboardHeader 
                    user={user} 
                    stats={stats} 
                    loading={loading}
                    error={error}
                    inscripcionesCount={inscripciones.length}
                />

                {/* 2. Layout Principal (Sidebar + Contenido) */}
                {(loading || error || inscripciones.length > 0) && (
                    <div className="inscripciones-main-layout">
                        
                        {/* Sidebar (Filtros, Progreso, Próximas Clases, Recomendaciones) */}
                        <Sidebar 
                            stats={stats}
                            progressStats={progressStats}
                            filterTab={filterTab}
                            setFilterTab={setFilterTab}
                            upcomingClasses={upcomingClasses}
                            recommendations={recommendations}
                            loading={loading}
                        />

                        {/* Contenido Principal (Búsqueda, Ordenamiento, Grid) */}
                        <InscripcionesList 
                            filteredInscripciones={filteredInscripciones}
                            inscripcionesCount={inscripciones.length}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            loading={loading}
                            error={error}
                            onRetry={handleRetry}
                            recommendations={recommendations}
                        />
                    </div>
                )}
                
                {/* Caso de carga o error sin elementos, se renderiza solo el listado */}
                {inscripciones.length === 0 && !loading && !error && (
                    <InscripcionesList 
                        filteredInscripciones={[]} // Lista vacía para el estado 'empty'
                        inscripcionesCount={0}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        loading={loading}
                        error={error}
                        onRetry={handleRetry}
                        recommendations={recommendations}
                    />
                )}
            </div>
        </div>
    );
};

export default MisInscripcionesPage;