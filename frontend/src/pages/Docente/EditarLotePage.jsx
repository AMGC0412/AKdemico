import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// Importar servicios de Lotes y Planes
import { obtenerDetalleLotePorId, actualizarLote } from '../../services/lote.service.js';
import { obtenerMisPlanesConLotes } from '../../services/planes.service.js';
import './DocenteForm.css'; // Reutilizamos el CSS de formulario
import { FaEdit, FaSpinner, FaTimesCircle, FaPlus, FaTrashAlt } from 'react-icons/fa';

const EditarLotePage = () => {
    const { loteId } = useParams(); // ID del Lote desde la URL
    const navigate = useNavigate();
    
    // Estados de datos
    const [planes, setPlanes] = useState([]); // Lista de planes para el selector
    
    // Estados del formulario
    const [planId, setPlanId] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [horarios, setHorarios] = useState([]); // Array de horarios
    const [cupos, setCupos] = useState('');
    // const [cuposActuales, setCuposActuales] = useState(''); // <-- ELIMINADO
    const [precio, setPrecio] = useState('');
    const [modalidad, setModalidad] = useState('virtual');

    const [loading, setLoading] = useState(false); // Para el envío
    const [pageLoading, setPageLoading] = useState(true); // Para cargar datos
    const [error, setError] = useState(null);

    // --- Funciones de Formato ---
    const formatFechaParaInput = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            const offset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - offset);
            return localDate.toISOString().substring(0, 16); // Corta a YYYY-MM-DDTHH:MM
        } catch (e) {
            console.error("Error formateando fecha:", e);
            return '';
        }
    };
    const formatTimeParaInput = (timeString) => {
         if (!timeString) return '';
         return timeString.substring(0, 5); // Corta a HH:MM
    }

    // --- Cargar datos del Lote y los Planes al montar ---
    useEffect(() => {
        const cargarDatos = async () => {
            if (!loteId) {
                setError("No se especificó un ID de lote.");
                setPageLoading(false);
                return;
            }
            try {
                const [dataLote, dataPlanes] = await Promise.all([
                    obtenerDetalleLotePorId(loteId),
                    obtenerMisPlanesConLotes()
                ]);

                // Rellenar formulario con datos del lote
                setPlanId(dataLote.plan_id);
                setFechaInicio(formatFechaParaInput(dataLote.fecha_inicio));
                setFechaFin(formatFechaParaInput(dataLote.fecha_fin));
                setCupos(dataLote.cupos); // Total de cupos
                // setCuposActuales(dataLote.cupos_actuales ?? dataLote.cupos); // <-- ELIMINADO
                setPrecio(dataLote.precio);
                setModalidad(dataLote.modalidad);
                setHorarios(dataLote.horarios && dataLote.horarios.length > 0 ? dataLote.horarios.map(h => ({
                    dia_semana: h.dia_semana,
                    hora_inicio: formatTimeParaInput(h.hora_inicio),
                    hora_fin: formatTimeParaInput(h.hora_fin)
                })) : [{ dia_semana: '', hora_inicio: '', hora_fin: '' }]);

                setPlanes(dataPlanes);
            } catch (err) {
                setError("Error al cargar datos del lote o planes.");
                console.error(err);
            } finally {
                setPageLoading(false);
            }
        };
        cargarDatos();
    }, [loteId]);

    // --- Handlers de Horarios ---
    const handleHorarioChange = (index, event) => {
        const nuevosHorarios = [...horarios];
        nuevosHorarios[index][event.target.name] = event.target.value;
        setHorarios(nuevosHorarios);
    };
    const agregarHorario = () => {
        setHorarios([...horarios, { dia_semana: '', hora_inicio: '', hora_fin: '' }]);
    };
    const eliminarHorario = (index) => {
        if (horarios.length <= 1) return;
        const nuevosHorarios = horarios.filter((_, i) => i !== index);
        setHorarios(nuevosHorarios);
    };

    // --- Enviar Actualización ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formatFechaISO = (fecha) => fecha ? fecha.replace('T', ' ') + ':00' : null;

        // Ya NO enviamos cupos_actuales
        const loteData = {
            plan_id: Number(planId),
            fecha_inicio: formatFechaISO(fechaInicio),
            fecha_fin: formatFechaISO(fechaFin),
            horarios: horarios,
            cupos: Number(cupos),
            precio: Number(precio),
            modalidad: modalidad,
        };

        try {
            await actualizarLote(loteId, loteData);
            navigate('/docente/cursos');
        } catch (err) {
            setError(err.mensaje || "Error al actualizar el lote.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="page-loading">Cargando datos del lote...</div>;

    return (
        <div className="docente-form-page">
            <div className="docente-form-container">
                <div className="docente-form-header">
                    <FaEdit className="icon" />
                    <h1>Editar Lote (Curso)</h1>
                </div>
                <p>Modifica los detalles de tu curso publicado. Los cupos disponibles se recalcularán automáticamente.</p>

                {error && !loading && (
                    <div className="message error">
                        <FaTimesCircle /> {error}
                    </div>
                )}

                <form className="docente-form" onSubmit={handleSubmit}>
                    
                    <div className="form-group">
                        <label htmlFor="planId">Plan de Estudio Base</label>
                        <select id="planId" value={planId} onChange={(e) => setPlanId(e.target.value)} required>
                            <option value="" disabled>-- Selecciona un plan --</option>
                            {planes.map(plan => (
                                <option key={plan.id} value={plan.id}>{plan.titulo}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="fechaInicio">Fecha de Inicio</label>
                            <input
                                type="datetime-local" id="fechaInicio"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fechaFin">Fecha de Fin</label>
                            <input
                                type="datetime-local" id="fechaFin"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Días y Horas de Clase</label>
                        <div className="horarios-list">
                            {horarios.map((horario, index) => (
                                <div key={index} className="horario-item">
                                    <select name="dia_semana" value={horario.dia_semana} onChange={e => handleHorarioChange(index, e)} required>
                                        <option value="" disabled>Día</option>
                                        <option value="lunes">Lunes</option>
                                        <option value="martes">Martes</option>
                                        <option value="miercoles">Miércoles</option>
                                        <option value="jueves">Jueves</option>
                                        <option value="viernes">Viernes</option>
                                        <option value="sabado">Sábado</option>
                                        <option value="domingo">Domingo</option>
                                    </select>
                                    <input type="time" name="hora_inicio" value={horario.hora_inicio} onChange={e => handleHorarioChange(index, e)} required />
                                    <span className="time-separator">-</span>
                                    <input type="time" name="hora_fin" value={horario.hora_fin} onChange={e => handleHorarioChange(index, e)} required />
                                    {horarios.length > 1 && (
                                        <button type="button" onClick={() => eliminarHorario(index)} className="btn-delete-horario">
                                            <FaTrashAlt />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={agregarHorario} className="btn btn-secondary btn-add-horario">
                            <FaPlus /> Agregar otro día/hora
                        </button>
                    </div>
                    
                    {/* --- SECCIÓN DE CUPOS/PRECIO CORREGIDA --- */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="cupos">Cupos Totales</label>
                            <input
                                type="number" id="cupos"
                                value={cupos}
                                onChange={(e) => setCupos(e.target.value)}
                                required placeholder="Ej: 20" min="1"
                            />
                        </div>
                        
                        {/* CAMPO 'CUPOS DISPONIBLES' ELIMINADO */}

                        <div className="form-group">
                            <label htmlFor="precio">Precio (S/)</label>
                            <input
                                type="number" id="precio"
                                value={precio}
                                onChange={(e) => setPrecio(e.target.value)}
                                required placeholder="Ej: 150.00" min="0" step="0.01"
                            />
                        </div>
                         <div className="form-group">
                            <label htmlFor="modalidad">Modalidad</label>
                            <select 
                                id="modalidad" 
                                value={modalidad} 
                                onChange={(e) => setModalidad(e.target.value)} 
                                required
                            >
                                <option value="virtual">Virtual</option>
                                <option value="presencial">Presencial</option>
                            </select>
                        </div>
                    </div>
                    {/* ------------------------------------------- */}


                    {/* Mostrar error de envío si existe */}
                    {error && loading && (
                        <div className="message error">
                            <FaTimesCircle /> {error}
                        </div>
                    )}

                    <div className="form-actions">
                        <Link to="/docente/cursos" className="btn btn-cancel">
                            Cancelar
                        </Link>
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