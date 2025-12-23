import React, { useState, useEffect } from 'react';
import { obtenerMisPlanesConLotes } from '../../services/planes.service.js';
import { FaCalendarAlt, FaClock, FaVideo, FaMapMarkerAlt, FaSpinner, FaLayerGroup } from 'react-icons/fa';
import './DocenteCalendar.css'; 

const DocenteCalendarPage = () => {
    const [agenda, setAgenda] = useState({
        lunes: [], martes: [], miercoles: [], jueves: [], viernes: [], sabado: [], domingo: []
    });
    const [loading, setLoading] = useState(true);

    // Mapeo para normalizar nombres de días (DB -> Clave Objeto)
    const normalizarDia = (diaDb) => {
        const map = {
            'lunes': 'lunes', 'martes': 'martes', 'miercoles': 'miercoles', 'miércoles': 'miercoles',
            'jueves': 'jueves', 'viernes': 'viernes', 'sabado': 'sabado', 'sábado': 'sabado', 'domingo': 'domingo'
        };
        return map[diaDb.toLowerCase()] || null;
    };

    const getDiaActual = () => {
        const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        return dias[new Date().getDay()];
    };

    useEffect(() => {
        const procesarAgenda = async () => {
            try {
                const planes = await obtenerMisPlanesConLotes();
                
                // Estructura base vacía
                const nuevaAgenda = {
                    lunes: [], martes: [], miercoles: [], jueves: [], viernes: [], sabado: [], domingo: []
                };

                // Recorremos Planes -> Lotes -> Horarios
                planes.forEach(plan => {
                    if (!plan.lotes) return;

                    plan.lotes.forEach(lote => {
                        // Solo mostramos cursos activos (Programados o En Curso)
                        if (lote.estado === 'programado' || lote.estado === 'en_curso') {
                            
                            // Si el lote tiene horarios
                            if (lote.horarios && Array.isArray(lote.horarios)) {
                                lote.horarios.forEach(h => {
                                    const diaKey = normalizarDia(h.dia_semana);
                                    if (diaKey && nuevaAgenda[diaKey]) {
                                        // Creamos la "Tarjeta de Clase"
                                        nuevaAgenda[diaKey].push({
                                            titulo: plan.titulo,
                                            hora_inicio: h.hora_inicio.substring(0, 5), // Cortar segundos
                                            hora_fin: h.hora_fin.substring(0, 5),
                                            modalidad: lote.modalidad,
                                            lote_id: lote.id,
                                            cupos_ocupados: lote.cupos - (lote.cupos_actuales || 0),
                                            cupos_total: lote.cupos
                                        });
                                    }
                                });
                            }
                        }
                    });
                });

                // Ordenar cada día por hora de inicio
                Object.keys(nuevaAgenda).forEach(dia => {
                    nuevaAgenda[dia].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
                });

                setAgenda(nuevaAgenda);
            } catch (error) {
                console.error("Error armando la agenda:", error);
            } finally {
                setLoading(false);
            }
        };

        procesarAgenda();
    }, []);

    if (loading) return <div style={{padding:'2rem', color:'#FFF', textAlign:'center'}}><FaSpinner className="fa-spin"/> Cargando Cronograma...</div>;

    const diasOrdenados = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diaHoy = getDiaActual();

    return (
        <div className="calendar-page">
            <div className="calendar-header">
                <div className="calendar-title">
                    <h1><FaCalendarAlt className="calendar-icon" /> Mi Cronograma de Clases</h1>
                    <p>Vista semanal de todas tus sesiones activas.</p>
                </div>
                <div className="week-controls">
                    <span className="current-week-label">SEMANA ACTUAL</span>
                </div>
            </div>

            <div className="week-grid">
                {diasOrdenados.map((dia) => (
                    <div key={dia} className={`day-column ${dia === diaHoy ? 'today' : ''}`}>
                        <div className="day-header">
                            <span className="day-name">{dia}</span>
                        </div>
                        <div className="events-container">
                            {agenda[dia].length > 0 ? (
                                agenda[dia].map((clase, idx) => (
                                    <div key={idx} className={`class-card ${clase.modalidad}`}>
                                        <div className="class-time">
                                            <FaClock /> {clase.hora_inicio} - {clase.hora_fin}
                                        </div>
                                        <div className="class-title">{clase.titulo}</div>
                                        
                                        <div className="class-badges">
                                            <span className={`badge-mini ${clase.modalidad}`}>
                                                {clase.modalidad === 'virtual' ? <FaVideo/> : <FaMapMarkerAlt/>} {clase.modalidad}
                                            </span>
                                            <span className="badge-mini" style={{background:'rgba(255,255,255,0.1)'}}>
                                                <FaLayerGroup/> {clase.cupos_ocupados}/{clase.cupos_total}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{textAlign:'center', color:'#555', fontSize:'0.8rem', marginTop:'1rem'}}>
                                    - Libre -
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocenteCalendarPage;