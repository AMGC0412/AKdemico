import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// Importar las nuevas funciones
import { obtenerPlanPorId, actualizarPlan } from '../../services/planes.service.js';
import './DocenteForm.css'; // Reutilizamos el mismo CSS
import { FaEdit, FaSpinner, FaTimesCircle } from 'react-icons/fa';

const EditarPlanPage = () => {
    const { planId } = useParams(); // Obtener el ID del plan de la URL
    const navigate = useNavigate();
    
    // Estados del formulario
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [objetivos, setObjetivos] = useState('');
    const [duracionSemanas, setDuracionSemanas] = useState('');
    const [frecuenciaSemanal, setFrecuenciaSemanal] = useState('');

    const [loading, setLoading] = useState(false); // Para el envío
    const [pageLoading, setPageLoading] = useState(true); // Para cargar datos iniciales
    const [error, setError] = useState(null);

    // --- Cargar datos del plan al montar ---
    useEffect(() => {
        const cargarDatosPlan = async () => {
            try {
                const data = await obtenerPlanPorId(planId);
                // Rellenar el formulario con los datos cargados
                setTitulo(data.titulo);
                setDescripcion(data.descripcion);
                setObjetivos(data.objetivos);
                setDuracionSemanas(data.duracion_semanas || ''); // Manejar nulos
                setFrecuenciaSemanal(data.frecuencia_semanal || ''); // Manejar nulos
            } catch (err) {
                setError("Error al cargar los datos del plan. No se encontró o no te pertenece.");
            } finally {
                setPageLoading(false);
            }
        };
        cargarDatosPlan();
    }, [planId]); // Se ejecuta si el planId cambia

    // --- Enviar actualización ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const planData = {
            titulo,
            descripcion,
            objetivos,
            duracion_semanas: Number(duracionSemanas) || null,
            frecuencia_semanal: Number(frecuenciaSemanal) || null,
        };

        try {
            await actualizarPlan(planId, planData); // Llamar a la función de ACTUALIZAR
            navigate('/docente/cursos'); // Volver a la lista
        } catch (err) {
            setError(err.mensaje || "Error al actualizar el plan.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="page-loading">Cargando datos del plan...</div>;

    return (
        <div className="docente-form-page">
            <div className="docente-form-container">
                <div className="docente-form-header">
                    <FaEdit className="icon" />
                    <h1>Editar Plan de Estudio</h1>
                </div>
                <p>Modifica los detalles de tu plantilla de curso. Los cambios no afectarán a los lotes ya publicados.</p>

                <form className="docente-form" onSubmit={handleSubmit}>
                    
                    <div className="form-group">
                        <label htmlFor="titulo">Título del Plan (Obligatorio)</label>
                        <input
                            type="text" id="titulo"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="descripcion">Descripción (Obligatorio)</label>
                        <textarea
                            id="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="objetivos">Objetivos (Obligatorio)</label>
                        <textarea
                            id="objetivos"
                            value={objetivos}
                            onChange={(e) => setObjetivos(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="duracion">Duración (semanas)</label>
                            <input
                                type="number" id="duracion"
                                value={duracionSemanas}
                                onChange={(e) => setDuracionSemanas(e.target.value)}
                                min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="frecuencia">Frecuencia (veces/semana)</label>
                            <input
                                type="number" id="frecuencia"
                                value={frecuenciaSemanal}
                                onChange={(e) => setFrecuenciaSemanal(e.target.value)}
                                min="1"
                            />
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
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><FaSpinner className="spinner" /> Guardando...</> : 'Guardar Cambios'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EditarPlanPage;