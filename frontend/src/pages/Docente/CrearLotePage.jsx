import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { crearLoteDeCurso } from '../../services/lote.service.js';
import { obtenerMisPlanesConLotes } from '../../services/planes.service.js';
import './DocenteForm.css'; 
import { FaCalendarPlus, FaSpinner, FaTimesCircle, FaPlus, FaTrashAlt, FaCalendarAlt, FaClock, FaCheck } from 'react-icons/fa';

const CrearLotePage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Estados de datos
    const [planes, setPlanes] = useState([]);
    
    // Estados del formulario
    const [planId, setPlanId] = useState(searchParams.get('planId') || '');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    
    // --- NUEVA LÓGICA DE HORARIOS ---
    // 'horarios' es lo que enviaremos al backend (Lista final)
    const [horarios, setHorarios] = useState([]);

    // Estados temporales para el "Constructor de Horarios"
    const [diasTemp, setDiasTemp] = useState([]); // Array de días seleccionados ['lunes', 'miercoles']
    const [horaInicioTemp, setHoraInicioTemp] = useState('');
    const [horaFinTemp, setHoraFinTemp] = useState('');
    // -------------------------------
    
    const [cupos, setCupos] = useState('');
    const [precio, setPrecio] = useState('');
    const [modalidad, setModalidad] = useState('virtual');

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);

    // Configuración de los días para la UI
    const diasSemana = [
        { label: 'L', value: 'lunes' },
        { label: 'M', value: 'martes' },
        { label: 'X', value: 'miercoles' },
        { label: 'J', value: 'jueves' },
        { label: 'V', value: 'viernes' },
        { label: 'S', value: 'sabado' },
        { label: 'D', value: 'domingo' },
    ];

    // Cargar planes
    useEffect(() => {
        const cargarPlanes = async () => {
            try {
                const data = await obtenerMisPlanesConLotes();
                setPlanes(data);
            } catch (err) {
                setError("Error al cargar tus planes de estudio.");
            } finally {
                setPageLoading(false);
            }
        };
        cargarPlanes();
    }, []);

    // --- MANEJADORES DEL SELECTOR MULTI-DÍA ---
    
    const toggleDia = (diaValue) => {
        if (diasTemp.includes(diaValue)) {
            setDiasTemp(diasTemp.filter(d => d !== diaValue));
        } else {
            setDiasTemp([...diasTemp, diaValue]);
        }
    };

    const agregarFranjaHoraria = () => {
        if (diasTemp.length === 0 || !horaInicioTemp || !horaFinTemp) return;

        // Generamos un objeto por cada día seleccionado
        const nuevosHorarios = diasTemp.map(dia => ({
            dia_semana: dia,
            hora_inicio: horaInicioTemp,
            hora_fin: horaFinTemp
        }));

        // Añadimos a la lista oficial y limpiamos el formulario temporal
        setHorarios([...horarios, ...nuevosHorarios]);
        setDiasTemp([]);
        setHoraInicioTemp('');
        setHoraFinTemp('');
    };

    const eliminarHorario = (index) => {
        setHorarios(horarios.filter((_, i) => i !== index));
    };

    // -------------------------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (new Date(fechaInicio) > new Date(fechaFin)) {
            setError("La fecha de fin no puede ser anterior a la de inicio.");
            setLoading(false);
            return;
        }

        if (horarios.length === 0) {
            setError("Debes agregar al menos un horario de clase.");
            setLoading(false);
            return;
        }

        const inicioFormatted = fechaInicio ? `${fechaInicio} 00:00:00` : null;
        const finFormatted = fechaFin ? `${fechaFin} 23:59:59` : null;

        const loteData = {
            plan_id: Number(planId),
            fecha_inicio: inicioFormatted,
            fecha_fin: finFormatted,
            horarios: horarios, 
            cupos: Number(cupos),
            precio: Number(precio),
            modalidad: modalidad,
        };

        try {
            await crearLoteDeCurso(loteData);
            navigate('/docente/cursos'); 
        } catch (err) {
            setError(err.mensaje || "Error al publicar. Revisa los campos.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="page-loading"><FaSpinner className="spinner" /> Cargando sistema...</div>;

    return (
        <div className="docente-form-page">
            <div className="docente-form-container">
                <div className="docente-form-header">
                    <FaCalendarPlus className="icon-header" />
                    <h1>Lanzar Nuevo Curso (Lote)</h1>
                </div>
                <p className="form-description">
                    Configura la disponibilidad de tu curso. Usa el selector múltiple para programar varios días rápidamente.
                </p>

                {error && <div className="message error"><FaTimesCircle /> {error}</div>}

                <form className="docente-form" onSubmit={handleSubmit}>
                    
                    {/* PLAN */}
                    <div className="form-group">
                        <label htmlFor="planId">Plan de Estudio Base</label>
                        <div className="input-wrapper">
                            <select 
                                id="planId" 
                                value={planId} 
                                onChange={(e) => setPlanId(e.target.value)} 
                                required
                            >
                                <option value="" disabled>-- Seleccionar Plan --</option>
                                {planes.length > 0 ? (
                                    planes.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.titulo}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No tienes planes disponibles</option>
                                )}
                            </select>
                        </div>
                    </div>
                    
                    {/* FECHAS */}
                    <div className="form-row">
                        <div className="form-group">
                            <label><FaCalendarAlt /> Fecha de Inicio</label>
                            <input
                                type="date" value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)} required
                            />
                        </div>
                        <div className="form-group">
                            <label><FaCalendarAlt /> Fecha de Fin</label>
                            <input
                                type="date" value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)} required min={fechaInicio}
                            />
                        </div>
                    </div>

                    {/* --- CONSTRUCTOR DE HORARIOS (NUEVO) --- */}
                    <div className="form-group section-horarios">
                        <label><FaClock /> Programación Semanal</label>
                        
                        {/* 1. Panel de Selección */}
                        <div className="schedule-builder">
                            <div className="days-selector">
                                {diasSemana.map((d) => (
                                    <button
                                        type="button"
                                        key={d.value}
                                        className={`day-btn ${diasTemp.includes(d.value) ? 'active' : ''}`}
                                        onClick={() => toggleDia(d.value)}
                                        title={d.value}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="time-inputs">
                                <input 
                                    type="time" 
                                    value={horaInicioTemp} 
                                    onChange={(e) => setHoraInicioTemp(e.target.value)}
                                />
                                <span className="separator">-</span>
                                <input 
                                    type="time" 
                                    value={horaFinTemp} 
                                    onChange={(e) => setHoraFinTemp(e.target.value)}
                                />
                                <button 
                                    type="button" 
                                    className="btn-add-schedule"
                                    onClick={agregarFranjaHoraria}
                                    disabled={diasTemp.length === 0 || !horaInicioTemp || !horaFinTemp}
                                >
                                    <FaPlus /> Agregar
                                </button>
                            </div>
                        </div>

                        {/* 2. Lista de Horarios Agregados */}
                        <div className="schedule-list-display">
                            {horarios.length === 0 ? (
                                <p className="empty-schedule">No hay horarios definidos. Selecciona días y horas arriba.</p>
                            ) : (
                                horarios.map((h, index) => (
                                    <div key={index} className="schedule-chip">
                                        <span className="chip-day">{h.dia_semana.toUpperCase()}</span>
                                        <span className="chip-time">{h.hora_inicio} - {h.hora_fin}</span>
                                        <button type="button" onClick={() => eliminarHorario(index)} className="chip-delete">
                                            <FaTimesCircle />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    {/* DETALLES */}
                    <div className="form-row three-cols">
                        <div className="form-group">
                            <label>Cupos</label>
                            <input
                                type="number" value={cupos}
                                onChange={(e) => setCupos(e.target.value)} required min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label>Precio (S/)</label>
                            <input
                                type="number" value={precio}
                                onChange={(e) => setPrecio(e.target.value)} required min="0" step="0.01"
                            />
                        </div>
                         <div className="form-group">
                            <label>Modalidad</label>
                            <select value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
                                <option value="virtual">Virtual</option>
                                <option value="presencial">Presencial</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Link to="/docente/cursos" className="btn btn-ghost">Cancelar</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading || !planId}>
                            {loading ? <><FaSpinner className="spinner" /> Publicando...</> : 'Publicar Curso'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CrearLotePage;