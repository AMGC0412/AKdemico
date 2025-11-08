import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaCalendarAlt, FaPlus, FaTrashAlt, FaSpinner, FaSave, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';
import './DocenteForm.css'; // Reutilizamos el CSS del formulario
import { obtenerDisponibilidad, actualizarDisponibilidad } from '../../services/schedules.service.js';

const DIAS_SEMANA = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' }, // Usamos 1-7 por simplicidad
];

const DocenteHorariosPage = () => {
    const navigate = useNavigate();
    
    // Estado para la lista de horarios (bloques)
    const [horarios, setHorarios] = useState([]); 

    const [loading, setLoading] = useState(false); // Para el envío
    const [pageLoading, setPageLoading] = useState(true); // Para cargar datos iniciales
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Formatear hora de BD (16:00:00) a input (16:00)
    const formatTimeParaInput = (timeString) => {
         if (!timeString) return '';
         return timeString.substring(0, 5); // Corta a HH:MM
    }

    // Cargar la disponibilidad actual del docente
    useEffect(() => {
        const cargarDisponibilidad = async () => {
            try {
                const data = await obtenerDisponibilidad(); 
                // Mapear los datos de la BD al formato del estado local
                setHorarios(data.map(h => ({
                    ...h,
                    // Convertir el número del día a texto si fuera necesario (aunque en este caso es texto en DB)
                    // Nota: Si la DB usa números (1-7), el value en el select ya lo maneja
                    hora_inicio: formatTimeParaInput(h.hora_inicio),
                    hora_fin: formatTimeParaInput(h.hora_fin),
                    dia_semana: h.dia_semana.toString() // Asegurar que sea string para el <select>
                })));

                // Si la lista está vacía, añadimos una fila vacía para empezar
                if (data.length === 0) {
                     setHorarios([{ dia_semana: '', hora_inicio: '', hora_fin: '' }]);
                }

            } catch (err) {
                setError("Error al cargar tu disponibilidad actual.");
            } finally {
                setPageLoading(false);
            }
        };
        cargarDisponibilidad();
    }, []);


    // --- Handlers de Horarios Dinámicos ---
    const handleHorarioChange = (index, event) => {
        const nuevosHorarios = [...horarios];
        nuevosHorarios[index][event.target.name] = event.target.value;
        setHorarios(nuevosHorarios);
    };

    const agregarHorario = () => {
        setHorarios([...horarios, { dia_semana: '', hora_inicio: '', hora_fin: '' }]);
    };

    const eliminarHorario = (index) => {
        const nuevosHorarios = horarios.filter((_, i) => i !== index);
        // Si borramos el último, añadimos uno vacío si la lista queda en cero
        if (nuevosHorarios.length === 0) {
            setHorarios([{ dia_semana: '', hora_inicio: '', hora_fin: '' }]);
        } else {
            setHorarios(nuevosHorarios);
        }
    };
    // -----------------------------------------------------


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        // Limpieza y validación final de datos antes de enviar
        const horariosValidos = horarios.filter(h => h.dia_semana && h.hora_inicio && h.hora_fin);

        if (horariosValidos.length === 0) {
            // Si el docente quiere borrar todo, enviamos un array vacío
            const data = await actualizarDisponibilidad({ bloques: [] }); 
            setSuccess(data.mensaje || 'Disponibilidad eliminada exitosamente.');
            setHorarios([{ dia_semana: '', hora_inicio: '', hora_fin: '' }]); // Resetear el form local
            setLoading(false);
            return;
        }

        const disponibilidadData = {
            bloques: horariosValidos.map(h => ({
                dia_semana: Number(h.dia_semana), // Asegurar que sea el número del día (1, 2, 3...)
                hora_inicio: h.hora_inicio + ':00', // Añadir segundos
                hora_fin: h.hora_fin + ':00',
            }))
        };

        try {
            const data = await actualizarDisponibilidad(disponibilidadData); 
            setSuccess(data.mensaje || 'Disponibilidad actualizada.');
        } catch (err) {
            setError(err.mensaje || "Error al guardar tu disponibilidad.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="page-loading"><FaSpinner className="spinner" /> Cargando disponibilidad...</div>;

    return (
        <div className="docente-form-page">
            <div className="docente-form-container">
                <div className="docente-form-header">
                    <FaCalendarAlt className="icon" />
                    <h1>Definir Disponibilidad Semanal</h1>
                </div>
                <p>Aquí defines las franjas horarias recurrentes en las que estás disponible para dictar clases. Tu horario se actualizará inmediatamente en tu perfil público.</p>

                <form className="docente-form" onSubmit={handleSubmit}>
                    
                    {/* Sección de Horarios */}
                    <div className="form-group">
                        <label>Bloques de Disponibilidad</label>
                        <div className="horarios-list">
                            {horarios.map((horario, index) => (
                                <div key={index} className="horario-item">
                                    <select name="dia_semana" value={horario.dia_semana} onChange={e => handleHorarioChange(index, e)} required>
                                        <option value="" disabled>Día</option>
                                        {/* Usamos el índice del array (1-7) como valor para la DB */}
                                        {DIAS_SEMANA.map(d => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </select>
                                    <input type="time" name="hora_inicio" value={horario.hora_inicio} onChange={e => handleHorarioChange(index, e)} required />
                                    <span className="time-separator">-</span>
                                    <input type="time" name="hora_fin" value={horario.hora_fin} onChange={e => handleHorarioChange(index, e)} required />
                                    
                                    <button type="button" onClick={() => eliminarHorario(index)} className="btn-delete-horario">
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={agregarHorario} className="btn btn-secondary btn-add-horario">
                            <FaPlus /> Agregar Franja
                        </button>
                    </div>

                    {error && (<div className="message error"><FaTimesCircle /> {error}</div>)}
                    {success && (<div className="message success"><FaCheckCircle /> {success}</div>)}


                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><FaSpinner className="spinner" /> Guardando...</> : <><FaSave /> Guardar Disponibilidad</>}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default DocenteHorariosPage;