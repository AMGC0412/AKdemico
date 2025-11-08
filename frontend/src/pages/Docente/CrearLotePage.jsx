import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { crearLoteDeCurso } from '../../services/lote.service.js';
import { obtenerMisPlanesConLotes } from '../../services/planes.service.js'; // Para obtener la lista de planes
import './DocenteForm.css'; // Reutilizamos el CSS del formulario
import { FaCalendarPlus, FaSpinner, FaTimesCircle, FaPlus, FaTrashAlt } from 'react-icons/fa';

const CrearLotePage = () => {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // Para leer el ID del plan de la URL

    // Estados de datos
    const [planes, setPlanes] = useState([]); // Lista de planes del docente
    
    // Estados del formulario
    const [planId, setPlanId] = useState(searchParams.get('planId') || ''); // ID del plan seleccionado
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    // --- MANEJO DE HORARIOS COMO ARRAY DE OBJETOS ---
    const [horarios, setHorarios] = useState([
        { dia_semana: '', hora_inicio: '', hora_fin: '' }
    ]);
    // ------------------------------------------------
    const [cupos, setCupos] = useState('');
    const [precio, setPrecio] = useState('');
    const [modalidad, setModalidad] = useState('virtual'); // Valor por defecto

    const [loading, setLoading] = useState(false); // Para el envío
    const [pageLoading, setPageLoading] = useState(true); // Para cargar planes
    const [error, setError] = useState(null);

    // Cargar los planes del docente para el selector
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

    // --- FUNCIONES PARA MANEJAR HORARIOS DINÁMICOS ---
    const handleHorarioChange = (index, event) => {
        const nuevosHorarios = [...horarios];
        nuevosHorarios[index][event.target.name] = event.target.value;
        setHorarios(nuevosHorarios);
    };

    const agregarHorario = () => {
        setHorarios([...horarios, { dia_semana: '', hora_inicio: '', hora_fin: '' }]);
    };

    const eliminarHorario = (index) => {
        // No permitir eliminar el último horario
        if (horarios.length <= 1) return; 
        const nuevosHorarios = horarios.filter((_, i) => i !== index);
        setHorarios(nuevosHorarios);
    };
    // -----------------------------------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Convertir fechas a formato ISO (YYYY-MM-DD HH:MM:SS)
        const formatFechaISO = (fecha) => fecha ? fecha.replace('T', ' ') + ':00' : null;

        const loteData = {
            plan_id: Number(planId),
            fecha_inicio: formatFechaISO(fechaInicio),
            fecha_fin: formatFechaISO(fechaFin),
            horarios: horarios, // Enviar el array de horarios
            cupos: Number(cupos),
            precio: Number(precio),
            modalidad: modalidad,
        };

        try {
            await crearLoteDeCurso(loteData);
            // Éxito: Navegar de vuelta a la lista de cursos
            navigate('/docente/cursos'); 
        } catch (err) {
            setError(err.mensaje || "Error al publicar el lote. Revisa todos los campos, incluyendo los horarios.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="page-loading">Cargando planes...</div>;

    return (
        <div className="docente-form-page">
            <div className="docente-form-container">
                <div className="docente-form-header">
                    <FaCalendarPlus className="icon" />
                    <h1>Publicar Nuevo Lote (Curso)</h1>
                </div>
                <p>Selecciona un plan y define las fechas, horarios y precio para publicarlo a los estudiantes.</p>

                <form className="docente-form" onSubmit={handleSubmit}>
                    
                    <div className="form-group">
                        <label htmlFor="planId">Plan de Estudio Base (Obligatorio)</label>
                        <select 
                            id="planId" 
                            value={planId} 
                            onChange={(e) => setPlanId(e.target.value)} 
                            required
                        >
                            <option value="" disabled>-- Selecciona un plan --</option>
                            {planes.length > 0 ? (
                                planes.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.titulo} (Duración: {plan.duracion_semanas || 'N/A'} sem.)
                                    </option>
                                ))
                            ) : (
                                <option disabled>No tienes planes creados. Crea un plan primero.</option>
                            )}
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

                    {/* --- SECCIÓN DE HORARIOS CORREGIDA --- */}
                    <div className="form-group">
                        <label>Días y Horas de Clase (al menos uno)</label>
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
                                    {horarios.length > 1 && ( // Solo mostrar botón de borrar si hay más de uno
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
                    {/* ---------------------------------- */}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="cupos">Cupos</label>
                            <input
                                type="number" id="cupos"
                                value={cupos}
                                onChange={(e) => setCupos(e.target.value)}
                                required placeholder="Ej: 20" min="1"
                            />
                        </div>
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

                    {error && (
                        <div className="message error">
                            <FaTimesCircle /> {error}
                        </div>
                    )}

                    <div className="form-actions">
                        <Link to="/docente/cursos" className="btn btn-cancel">
                            Cancelar
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={loading || !planId}>
                            {loading ? <><FaSpinner className="spinner" /> Publicando...</> : 'Publicar Lote'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CrearLotePage;