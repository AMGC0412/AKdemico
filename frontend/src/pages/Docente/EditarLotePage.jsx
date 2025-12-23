import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { obtenerDetalleLotePorId, actualizarLote } from '../../services/lote.service.js';
import { obtenerMisPlanesConLotes } from '../../services/planes.service.js';
import './DocenteForm.css'; // Usa el mismo CSS actualizado de CrearLotePage
import { FaEdit, FaSpinner, FaTimesCircle, FaPlus, FaTrashAlt, FaCalendarAlt, FaClock } from 'react-icons/fa';

const EditarLotePage = () => {
    const { loteId } = useParams();
    const navigate = useNavigate();
    
    // --- ESTADOS DE DATOS ---
    const [planes, setPlanes] = useState([]); 
    
    // --- ESTADOS DEL FORMULARIO ---
    const [planId, setPlanId] = useState('');
    
    // Usamos string 'YYYY-MM-DD' para los inputs tipo date
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    
    // Lista oficial de horarios (se envía al backend)
    const [horarios, setHorarios] = useState([]);

    // --- ESTADOS TEMPORALES (Constructor de Horarios) ---
    const [diasTemp, setDiasTemp] = useState([]);
    const [horaInicioTemp, setHoraInicioTemp] = useState('');
    const [horaFinTemp, setHoraFinTemp] = useState('');
    // ----------------------------------------------------

    const [cupos, setCupos] = useState('');
    const [precio, setPrecio] = useState('');
    const [modalidad, setModalidad] = useState('virtual');

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);

    // Configuración UI
    const diasSemana = [
        { label: 'L', value: 'lunes' },
        { label: 'M', value: 'martes' },
        { label: 'X', value: 'miercoles' },
        { label: 'J', value: 'jueves' },
        { label: 'V', value: 'viernes' },
        { label: 'S', value: 'sabado' },
        { label: 'D', value: 'domingo' },
    ];

    // --- HELPERS DE FECHA ---
    const formatDateForInput = (isoString) => {
        if (!isoString) return '';
        // Cortamos la parte de la hora: "2025-11-20T00:00:00.000Z" -> "2025-11-20"
        return isoString.split('T')[0];
    };

    const formatTimeForInput = (timeString) => {
         if (!timeString) return '';
         return timeString.substring(0, 5); // "14:00:00" -> "14:00"
    };

    // --- CARGAR DATOS ---
    useEffect(() => {
        const cargarDatos = async () => {
            if (!loteId) return;
            try {
                const [dataLote, dataPlanes] = await Promise.all([
                    obtenerDetalleLotePorId(loteId),
                    obtenerMisPlanesConLotes()
                ]);

                setPlanId(dataLote.plan_id);
                setFechaInicio(formatDateForInput(dataLote.fecha_inicio));
                setFechaFin(formatDateForInput(dataLote.fecha_fin));
                setCupos(dataLote.cupos);
                setPrecio(dataLote.precio);
                setModalidad(dataLote.modalidad);

                if (dataLote.horarios && dataLote.horarios.length > 0) {
                    setHorarios(dataLote.horarios.map(h => ({
                        dia_semana: h.dia_semana,
                        hora_inicio: formatTimeForInput(h.hora_inicio),
                        hora_fin: formatTimeForInput(h.hora_fin)
                    })));
                }

                setPlanes(dataPlanes);
            } catch (err) {
                setError("Error al cargar datos. Verifica tu conexión.");
                console.error(err);
            } finally {
                setPageLoading(false);
            }
        };
        cargarDatos();
    }, [loteId]);

    // --- LÓGICA DEL CONSTRUCTOR DE HORARIOS ---
    const toggleDia = (diaValue) => {
        if (diasTemp.includes(diaValue)) {
            setDiasTemp(diasTemp.filter(d => d !== diaValue));
        } else {
            setDiasTemp([...diasTemp, diaValue]);
        }
    };

    const agregarFranjaHoraria = () => {
        if (diasTemp.length === 0 || !horaInicioTemp || !horaFinTemp) return;

        const nuevosHorarios = diasTemp.map(dia => ({
            dia_semana: dia,
            hora_inicio: horaInicioTemp,
            hora_fin: horaFinTemp
        }));

        setHorarios([...horarios, ...nuevosHorarios]);
        // Limpiar inputs temporales
        setDiasTemp([]);
        setHoraInicioTemp('');
        setHoraFinTemp('');
    };

    const eliminarHorario = (index) => {
        setHorarios(horarios.filter((_, i) => i !== index));
    };

    // --- SUBMIT ---
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
            setError("El curso debe tener al menos un horario definido.");
            setLoading(false);
            return;
        }

        // Reconstruir formato timestamp para DB
        const inicioFormatted = fechaInicio ? `${fechaInicio} 00:00:00` : null;
        const finFormatted = fechaFin ? `${fechaFin} 23:59:59` : null;

        const payload = {
            plan_id: Number(planId),
            fecha_inicio: inicioFormatted,
            fecha_fin: finFormatted,
            horarios,
            cupos: Number(cupos),
            precio: Number(precio),
            modalidad,
        };

        try {
            await actualizarLote(loteId, payload);
            navigate('/docente/cursos');
        } catch (err) {
            setError(err.mensaje || "Error al actualizar el lote.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="page-loading"><FaSpinner className="spinner" /> Cargando editor...</div>;

    return (
        <div className="docente-form-page">
            <div className="docente-form-container">
                <div className="docente-form-header">
                    <FaEdit className="icon-header" />
                    <h1>Editar Lote (Curso)</h1>
                </div>
                <p className="form-description">
                    Modifica la vigencia, precios o reprograma los horarios de clase.
                </p>

                {error && <div className="message error"><FaTimesCircle /> {error}</div>}

                <form className="docente-form" onSubmit={handleSubmit}>
                    
                    {/* PLAN */}
                    <div className="form-group">
                        <label htmlFor="planId">Plan de Estudio Base</label>
                        <div className="input-wrapper">
                            <select id="planId" value={planId} onChange={(e) => setPlanId(e.target.value)} required>
                                {planes.map(p => (
                                    <option key={p.id} value={p.id}>{p.titulo}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* FECHAS (Input Date) */}
                    <div className="form-row">
                        <div className="form-group">
                            <label><FaCalendarAlt /> Fecha de Inicio</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label><FaCalendarAlt /> Fecha de Fin</label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                required
                                min={fechaInicio}
                            />
                        </div>
                    </div>

                    {/* --- CONSTRUCTOR DE HORARIOS --- */}
                    <div className="form-group section-horarios">
                        <label><FaClock /> Programación Semanal</label>
                        
                        {/* Selector (Builder) */}
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

                        {/* Lista de Chips (Display) */}
                        <div className="schedule-list-display">
                            {horarios.length === 0 ? (
                                <p className="empty-schedule">Sin horarios definidos.</p>
                            ) : (
                                horarios.map((h, index) => (
                                    <div key={index} className="schedule-chip">
                                        <span className="chip-day">{h.dia_semana.substring(0,3).toUpperCase()}</span>
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
                            <label>Cupos Totales</label>
                            <input
                                type="number"
                                value={cupos}
                                onChange={(e) => setCupos(e.target.value)}
                                required min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label>Precio (S/)</label>
                            <input
                                type="number"
                                value={precio}
                                onChange={(e) => setPrecio(e.target.value)}
                                required min="0" step="0.01"
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

                    {/* ACCIONES */}
                    <div className="form-actions">
                        <Link to="/docente/cursos" className="btn btn-ghost">Cancelar</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><FaSpinner className="spinner" /> Guardando...</> : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditarLotePage;