/* Archivo: CalendarioPage.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';       // Vista Agenda (Lista)
import dayGridPlugin from '@fullcalendar/daygrid'; // Vista Mes (Cuadrícula)
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from '@fullcalendar/core/locales/es';
import { 
    FaCalendarAlt, FaSpinner, FaExclamationCircle, 
    FaCheckCircle, FaFileUpload, FaLayerGroup, FaArrowRight, FaList
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { getStudentCalendarData } from '../../services/inscripcion.service'; 
import './CalendarioPage.css'; 

// --- PALETA CYBERPUNK (Tonos Estudiante) ---
const COURSE_PALETTE = [
    { main: '#00F3FF', bg: 'rgba(0, 243, 255, 0.1)' }, // Cyan
    { main: '#BD00FF', bg: 'rgba(189, 0, 255, 0.1)' }, // Purple
    { main: '#FF3EFF', bg: 'rgba(255, 62, 255, 0.1)'  }, // Pink
    { main: '#05FF00', bg: 'rgba(5, 255, 0, 0.1)' },   // Green
    { main: '#FEEA00', bg: 'rgba(254, 234, 0, 0.1)' }, // Yellow
    { main: '#4B87FF', bg: 'rgba(75, 135, 255, 0.1)' } // Blue
];

const DAY_MAP = {
    'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3, 
    'jueves': 4, 'viernes': 5, 'sabado': 6
};

const CalendarioPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { authToken } = useAuth();
    const navigate = useNavigate();

    // --- Generación de Eventos ---
    const generateClassEvents = (curso, colorSet) => {
        const generatedEvents = [];
        if (!curso.fecha_inicio || !curso.fecha_fin) return [];

        const start = new Date(curso.fecha_inicio);
        const end = new Date(curso.fecha_fin);
        end.setHours(23, 59, 59, 999);

        // 1. Periodo del curso (Fondo visible en Grid)
        generatedEvents.push({
            id: `bg-${curso.lote_id}`,
            start: curso.fecha_inicio.split('T')[0],
            end: curso.fecha_fin.split('T')[0],
            display: 'background',
            backgroundColor: colorSet.bg, 
            classNames: ['course-period-bg'] 
        });

        // 2. Clases individuales (Items de Lista y Bloques de Grid)
        let current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay();
            curso.horarios.forEach(horario => {
                const diaDb = DAY_MAP[horario.dia.toLowerCase()];
                if (diaDb === dayOfWeek) {
                    const dateStr = current.toISOString().split('T')[0];
                    generatedEvents.push({
                        id: `clase-${curso.lote_id}-${dateStr}-${horario.inicio}`,
                        title: curso.titulo,
                        start: `${dateStr}T${horario.inicio}`,
                        end: `${dateStr}T${horario.fin}`,
                        backgroundColor: colorSet.main, // Color del punto/bloque
                        borderColor: 'transparent',
                        extendedProps: { type: 'clase' }
                    });
                }
            });
            current.setDate(current.getDate() + 1);
        }
        return generatedEvents;
    };

    const cargarDatos = useCallback(async () => {
        if (!authToken) { navigate('/auth/login'); return; }
        
        try {
            setLoading(true);
            const { hitos, cursos } = await getStudentCalendarData();
            let allEvents = [];

            // Hitos
            if (hitos) {
                hitos.forEach(hito => {
                    let color = '#888';
                    if (hito.type === 'inscripcion') color = '#4B87FF'; // Blue
                    if (hito.type === 'pago_subido') color = '#FEEA00'; // Yellow
                    if (hito.type === 'pago_validado') color = '#05FF00'; // Green

                    allEvents.push({
                        id: hito.id,
                        title: hito.title,
                        start: hito.start, 
                        allDay: true,
                        backgroundColor: color,
                        borderColor: color,
                        extendedProps: { type: hito.type }
                    });
                });
            }

            // Cursos
            if (cursos) {
                cursos.forEach((curso, index) => {
                    const palette = COURSE_PALETTE[index % COURSE_PALETTE.length];
                    const classEvents = generateClassEvents(curso, palette);
                    allEvents = [...allEvents, ...classEvents];
                });
            }
            
            setEvents(allEvents);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Error al sincronizar agenda.");
        } finally {
            setLoading(false);
        }
    }, [authToken, navigate]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);
    
    // Custom Render para VISTA DE CUADRÍCULA (DayGrid)
    // En vista Lista, FullCalendar usa su render estándar.
    const renderEventContent = (eventInfo) => {
        // Si es vista de lista, retornamos null para usar el default
        if (eventInfo.view.type.startsWith('list')) return null;

        const { type } = eventInfo.event.extendedProps;
        
        // Render para clases en Grid (Bloque compacto con texto negro)
        if (type === 'clase') {
            return (
                <div className="grid-event-tech" style={{ backgroundColor: eventInfo.backgroundColor }}>
                    <span className="grid-event-time">{eventInfo.timeText}</span>
                    <span className="grid-event-title" style={{color: '#000'}}>{eventInfo.event.title}</span>
                </div>
            );
        }
        // Render para hitos en Grid (Transparente con borde)
        return (
            <div className="grid-event-tech" style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderLeft: `3px solid ${eventInfo.borderColor}` }}>
                <span className="grid-event-title">{eventInfo.event.title}</span>
            </div>
        );
    };

    return (
        <div className="calendario-page-container">
            {/* Wrapper Principal que limita el ancho */}
            <div className="calendar-content-wrapper">
                
                {/* 1. Header Estructurado y Contenido */}
                <div className="calendar-header-panel">
                    <div className="header-text">
                        <h1>AGENDA ACADÉMICA</h1>
                        <p>CRONOGRAMA DE CLASES Y ESTADOS ADMINISTRATIVOS</p>
                    </div>
                    <div className="cal-header-badge">
                        <FaCalendarAlt /> PERIODO ACTIVO
                    </div>
                </div>
                
                {loading ? (
                    <div className="cal-loader">
                        <FaSpinner className="fa-spin" />
                        <span>CARGANDO DATOS...</span>
                    </div>
                ) : error ? (
                    <div className="cal-loader" style={{color: '#FF003C'}}>
                        <FaExclamationCircle />
                        <span>{error}</span>
                    </div>
                ) : (
                    <div className="calendar-grid-layout">
                        
                        {/* 2. Calendario (Izquierda) */}
                        <div className="calendar-view-panel">
                            <FullCalendar
                                plugins={[listPlugin, dayGridPlugin, interactionPlugin]}
                                initialView="listMonth" // VISTA POR DEFECTO: AGENDA VERTICAL
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'listMonth,dayGridMonth' // Switch: Lista vs Grid
                                }}
                                buttonText={{
                                    today: 'HOY',
                                    listMonth: 'AGENDA',
                                    dayGridMonth: 'MES'
                                }}
                                locale={esLocale}
                                events={events}
                                eventContent={renderEventContent}
                                height="auto"
                                aspectRatio={1.5}
                                noEventsContent="SIN ACTIVIDADES"
                                dayMaxEvents={true} // Agrupa eventos en vista de mes
                            />
                        </div>

                        {/* 3. Sidebar Fija (Derecha) */}
                        <aside className="calendar-sidebar">
                            
                            <div className="sidebar-section">
                                <h3 className="sidebar-title">LEYENDA DE HITOS</h3>
                                <div className="leyenda-list">
                                    <div className="leyenda-item">
                                        <span className="leyenda-icon" style={{color: '#4B87FF'}}><FaLayerGroup/></span>
                                        <span>INSCRIPCIÓN</span>
                                    </div>
                                    <div className="leyenda-item">
                                        <span className="leyenda-icon" style={{color: '#FEEA00'}}><FaFileUpload/></span>
                                        <span>EN REVISIÓN</span>
                                    </div>
                                    <div className="leyenda-item">
                                        <span className="leyenda-icon" style={{color: '#05FF00'}}><FaCheckCircle/></span>
                                        <span>VALIDADO</span>
                                    </div>
                                    <div className="leyenda-item">
                                        <span className="leyenda-icon" style={{color: '#00F3FF'}}><FaList/></span>
                                        <span>CLASE VIRTUAL</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer de Botones Alineados */}
                            <div className="sidebar-footer">
                                 <Link to="/estudiante/cursos" className="cal-btn cal-btn-primary">
                                    <FaLayerGroup /> GESTIONAR CURSOS
                                </Link>
                                <Link to="/estudiante/perfil" className="cal-btn cal-btn-secondary">
                                    <FaArrowRight /> PERFIL DE USUARIO
                                </Link>
                            </div>
                        </aside>

                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarioPage;