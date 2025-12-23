import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaPlus, FaTrashAlt, FaSpinner, FaSave, FaTimesCircle, FaCheckCircle, FaClock } from 'react-icons/fa';
import './DocenteForm.css'; 
import { obtenerDisponibilidad, actualizarDisponibilidad } from '../../services/schedules.service.js';

const DocenteHorariosPage = () => {
    const [horarios, setHorarios] = useState([]); 
    
    // --- ESTADOS TEMPORALES (Constructor) ---
    const [diasTemp, setDiasTemp] = useState([]);
    const [horaInicioTemp, setHoraInicioTemp] = useState('');
    const [horaFinTemp, setHoraFinTemp] = useState('');

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const diasSemana = [
        { label: 'L', value: '1' }, // 1 = Lunes en tu DB
        { label: 'M', value: '2' },
        { label: 'X', value: '3' },
        { label: 'J', value: '4' },
        { label: 'V', value: '5' },
        { label: 'S', value: '6' },
        { label: 'D', value: '7' },
    ];

    const formatTime = (time) => time ? time.substring(0, 5) : '';
    const mapDiaNumeroALetra = (num) => {
        const map = { '1': 'Lunes', '2': 'Martes', '3': 'Miércoles', '4': 'Jueves', '5': 'Viernes', '6': 'Sábado', '7': 'Domingo' };
        return map[num] || num;
    };

    useEffect(() => {
        const cargar = async () => {
            try {
                const data = await obtenerDisponibilidad(); 
                setHorarios(data.map(h => ({
                    dia_semana: h.dia_semana.toString(),
                    hora_inicio: formatTime(h.hora_inicio),
                    hora_fin: formatTime(h.hora_fin)
                })));
            } catch (err) {
                setError("No se pudo cargar la agenda.");
            } finally {
                setPageLoading(false);
            }
        };
        cargar();
    }, []);

    // --- LOGICA DE CONSTRUCTOR (Igual a CrearLote) ---
    const toggleDia = (val) => {
        if (diasTemp.includes(val)) setDiasTemp(diasTemp.filter(d => d !== val));
        else setDiasTemp([...diasTemp, val]);
    };

    const agregarFranja = () => {
        if (diasTemp.length === 0 || !horaInicioTemp || !horaFinTemp) return;
        const nuevos = diasTemp.map(dia => ({ dia_semana: dia, hora_inicio: horaInicioTemp, hora_fin: horaFinTemp }));
        setHorarios([...horarios, ...nuevos]);
        setDiasTemp([]); setHoraInicioTemp(''); setHoraFinTemp('');
    };

    const eliminarHorario = (index) => setHorarios(horarios.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); setSuccess(null); setLoading(true);

        try {
            const payload = {
                bloques: horarios.map(h => ({
                    dia_semana: Number(h.dia_semana),
                    hora_inicio: h.hora_inicio + ':00',
                    hora_fin: h.hora_fin + ':00',
                }))
            };
            const res = await actualizarDisponibilidad(payload); 
            setSuccess(res.mensaje || 'Agenda base actualizada.');
        } catch (err) {
            setError(err.mensaje || "Error al guardar.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="page-loading"><FaSpinner className="spinner" /> Sincronizando agenda...</div>;

    return (
        <div className="docente-form-page">
            <div className="docente-form-container">
                <div className="docente-form-header">
                    <FaCalendarAlt className="icon-header" />
                    <h1>Disponibilidad General</h1>
                </div>
                <p className="form-description">
                    Define tus franjas libres para <strong>Mentorías Privadas</strong>. Esto no afecta los horarios de tus cursos grupales.
                </p>

                {error && <div className="message error"><FaTimesCircle /> {error}</div>}
                {success && <div className="message success"><FaCheckCircle /> {success}</div>}

                <form className="docente-form" onSubmit={handleSubmit}>
                    
                    <div className="form-group section-horarios">
                        <label><FaClock /> Constructor de Horarios</label>
                        
                        <div className="schedule-builder">
                            <div className="days-selector">
                                {diasSemana.map((d) => (
                                    <button type="button" key={d.value}
                                        className={`day-btn ${diasTemp.includes(d.value) ? 'active' : ''}`}
                                        onClick={() => toggleDia(d.value)}>{d.label}</button>
                                ))}
                            </div>
                            <div className="time-inputs">
                                <input type="time" value={horaInicioTemp} onChange={e => setHoraInicioTemp(e.target.value)} />
                                <span className="separator">-</span>
                                <input type="time" value={horaFinTemp} onChange={e => setHoraFinTemp(e.target.value)} />
                                <button type="button" className="btn-add-schedule" onClick={agregarFranja} disabled={!diasTemp.length || !horaInicioTemp}>
                                    <FaPlus /> Agregar
                                </button>
                            </div>
                        </div>

                        <div className="schedule-list-display">
                            {horarios.length === 0 ? <p className="empty-schedule">No has definido disponibilidad base.</p> : 
                                horarios.map((h, i) => (
                                    <div key={i} className="schedule-chip">
                                        <span className="chip-day">{mapDiaNumeroALetra(h.dia_semana)}</span>
                                        <span className="chip-time">{h.hora_inicio} - {h.hora_fin}</span>
                                        <button type="button" onClick={() => eliminarHorario(i)} className="chip-delete"><FaTrashAlt /></button>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><FaSpinner className="spinner" /> Guardando...</> : <><FaSave /> Guardar Configuración</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DocenteHorariosPage;