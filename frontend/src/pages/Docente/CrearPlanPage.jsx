import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { crearPlanDeEstudio } from '../../services/planes.service.js';
import './DocenteForm.css'; // Reutilizamos el CSS del formulario
import { FaBookMedical, FaSpinner, FaTimesCircle } from 'react-icons/fa';

const CrearPlanPage = () => {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    
    // Estados del formulario
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [objetivos, setObjetivos] = useState('');
    const [duracionSemanas, setDuracionSemanas] = useState('');
    const [frecuenciaSemanal, setFrecuenciaSemanal] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
            const data = await crearPlanDeEstudio(planData);
            // Éxito: Navegar de vuelta a la lista de cursos
            navigate('/docente/cursos'); 
        } catch (err) {
            setError(err.mensaje || "Error al crear el plan. Asegúrate de que todos los campos obligatorios estén llenos.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="docente-form-page">
            <div className="docente-form-container">
                <div className="docente-form-header">
                    <FaBookMedical className="icon" />
                    <h1>Crear Nuevo Plan de Estudio</h1>
                </div>
                <p>Un "Plan" es tu plantilla base. (Ej. "Curso de Cálculo Básico"). Más tarde, podrás crear "Lotes" (cursos con fechas) a partir de este plan.</p>

                <form className="docente-form" onSubmit={handleSubmit}>
                    
                    <div className="form-group">
                        <label htmlFor="titulo">Título del Plan (Obligatorio)</label>
                        <input
                            type="text" id="titulo"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            required
                            placeholder="Ej: Curso de Cálculo Integral desde Cero"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="descripcion">Descripción (Obligatorio)</label>
                        <textarea
                            id="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            required
                            placeholder="Describe brevemente de qué trata este plan de estudio."
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="objetivos">Objetivos (Obligatorio)</label>
                        <textarea
                            id="objetivos"
                            value={objetivos}
                            onChange={(e) => setObjetivos(e.target.value)}
                            required
                            placeholder="¿Qué aprenderá el estudiante? (puedes separar con saltos de línea)"
                        />
                    </div>

                    {/* Campos Opcionales (divididos) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="duracion">Duración (semanas)</label>
                            <input
                                type="number" id="duracion"
                                value={duracionSemanas}
                                onChange={(e) => setDuracionSemanas(e.target.value)}
                                placeholder="Ej: 8" min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="frecuencia">Frecuencia (veces/semana)</label>
                            <input
                                type="number" id="frecuencia"
                                value={frecuenciaSemanal}
                                onChange={(e) => setFrecuenciaSemanal(e.target.value)}
                                placeholder="Ej: 2" min="1"
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
                            {loading ? <><FaSpinner className="spinner" /> Creando...</> : 'Crear Plan'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CrearPlanPage;