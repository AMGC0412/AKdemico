import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { obtenerPlanPorId, actualizarPlan } from '../../services/planes.service.js';
import { obtenerListaCategorias, obtenerListaNiveles } from '../../services/catalogos.service.js';
import './DocenteForm.css'; 
import { FaEdit, FaSpinner, FaTimesCircle, FaEye, FaEyeSlash, FaImage, FaLayerGroup, FaSignal } from 'react-icons/fa';

const EditarPlanPage = () => {
    const { planId } = useParams();
    const navigate = useNavigate();
    
    // --- ESTADOS DE DATOS (Catálogos) ---
    const [listaCategorias, setListaCategorias] = useState([]);
    const [listaNiveles, setListaNiveles] = useState([]);

    // --- ESTADOS DEL FORMULARIO ---
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [objetivos, setObjetivos] = useState('');
    const [duracionSemanas, setDuracionSemanas] = useState('');
    const [frecuenciaSemanal, setFrecuenciaSemanal] = useState('');
    const [estadoPlan, setEstadoPlan] = useState('borrador');
    
    // Nuevos estados
    const [categoriaId, setCategoriaId] = useState('');
    const [nivelId, setNivelId] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- CARGA INICIAL (Paralela) ---
    useEffect(() => {
        const cargarTodo = async () => {
            try {
                // Ejecutamos las 3 peticiones al mismo tiempo para ser más rápidos
                const [planData, categoriasData, nivelesData] = await Promise.all([
                    obtenerPlanPorId(planId),
                    obtenerListaCategorias(),
                    obtenerListaNiveles()
                ]);

                // 1. Rellenar formulario
                setTitulo(planData.titulo);
                setDescripcion(planData.descripcion || '');
                setObjetivos(planData.objetivos || '');
                setDuracionSemanas(planData.duracion_semanas || '');
                setFrecuenciaSemanal(planData.frecuencia_semanal || '');
                setEstadoPlan(planData.estado);
                setCategoriaId(planData.categoria_id || '');
                setNivelId(planData.nivel_id || '');
                setImagenUrl(planData.imagen_url || '');

                // 2. Rellenar catálogos
                setListaCategorias(categoriasData);
                setListaNiveles(nivelesData);

            } catch (err) {
                console.error(err);
                setError("Error al cargar los datos. Verifica tu conexión.");
            } finally {
                setPageLoading(false);
            }
        };
        cargarTodo();
    }, [planId]);

    // --- MANEJO DE ENVÍO ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const planData = {
            titulo,
            descripcion,
            objetivos,
            duracion_semanas: duracionSemanas,
            frecuencia_semanal: frecuenciaSemanal,
            estado: estadoPlan,
            categoria_id: categoriaId,
            nivel_id: nivelId,
            imagen_url: imagenUrl
        };

        try {
            await actualizarPlan(planId, planData);
            navigate('/docente/cursos');
        } catch (err) {
            setError(err.mensaje || "Error al actualizar el plan.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="page-loading"><FaSpinner className="spinner" /> Cargando Editor de Plan...</div>;

    return (
        <div className="docente-form-page">
            <div className="docente-form-container">
                <div className="docente-form-header">
                    <FaEdit className="icon-header" />
                    <h1>Editar Plan Maestro</h1>
                </div>
                <p className="form-description">
                    Define la estructura académica y visual de tu curso. Esta información se usará para crear nuevos lotes.
                </p>

                {error && <div className="message error"><FaTimesCircle /> {error}</div>}

                <form className="docente-form" onSubmit={handleSubmit}>
                    
                    {/* --- 1. VISIBILIDAD (Estado) --- */}
                    <div className="visibilidad-box">
                        <label className="visibilidad-label">
                            {estadoPlan === 'publicado' ? <FaEye /> : <FaEyeSlash />} Visibilidad
                        </label>
                        <select
                            value={estadoPlan}
                            onChange={(e) => setEstadoPlan(e.target.value)}
                            className={`select-estado ${estadoPlan}`}
                        >
                            <option value="publicado">PUBLICADO (Visible)</option>
                            <option value="borrador">BORRADOR (Oculto)</option>
                        </select>
                    </div>

                    {/* --- 2. INFORMACIÓN BÁSICA --- */}
                    <div className="form-group">
                        <label htmlFor="titulo">Título del Curso</label>
                        <input
                            type="text" id="titulo"
                            value={titulo} onChange={(e) => setTitulo(e.target.value)}
                            required placeholder="Ej: Introducción al Marketing Digital"
                        />
                    </div>

                    {/* --- 3. CLASIFICACIÓN (CATEGORÍA Y NIVEL) --- */}
                    <div className="form-row">
                        <div className="form-group">
                            <label><FaLayerGroup /> Categoría</label>
                            <select 
                                value={categoriaId} 
                                onChange={(e) => setCategoriaId(e.target.value)}
                                required
                            >
                                <option value="">-- Seleccionar --</option>
                                {listaCategorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label><FaSignal /> Nivel de Dificultad</label>
                            <select 
                                value={nivelId} 
                                onChange={(e) => setNivelId(e.target.value)}
                                required
                            >
                                <option value="">-- Seleccionar --</option>
                                {listaNiveles.map(niv => (
                                    <option key={niv.id} value={niv.id}>{niv.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* --- 4. DETALLES ACADÉMICOS --- */}
                    <div className="form-group">
                        <label htmlFor="descripcion">Descripción Detallada</label>
                        <textarea
                            id="descripcion"
                            value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                            required rows="4"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="objetivos">Objetivos de Aprendizaje</label>
                        <textarea
                            id="objetivos"
                            value={objetivos} onChange={(e) => setObjetivos(e.target.value)}
                            required rows="4" placeholder="¿Qué logrará el estudiante al finalizar?"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Duración (Semanas)</label>
                            <input
                                type="number"
                                value={duracionSemanas} onChange={(e) => setDuracionSemanas(e.target.value)}
                                min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label>Frecuencia (Clases/Semana)</label>
                            <input
                                type="number"
                                value={frecuenciaSemanal} onChange={(e) => setFrecuenciaSemanal(e.target.value)}
                                min="1"
                            />
                        </div>
                    </div>

                    {/* --- 5. IMAGEN REFERENCIAL --- */}
                    <div className="form-group section-imagen">
                        <label><FaImage /> Imagen de Portada (URL)</label>
                        <input 
                            type="text" 
                            placeholder="https://ejemplo.com/imagen.jpg"
                            value={imagenUrl}
                            onChange={(e) => setImagenUrl(e.target.value)}
                        />
                        {imagenUrl && (
                            <div className="imagen-preview-container">
                                <img 
                                    src={imagenUrl} 
                                    alt="Vista previa" 
                                    onError={(e) => e.target.style.display = 'none'} 
                                />
                                <span>Vista Previa</span>
                            </div>
                        )}
                    </div>

                    {/* --- ACCIONES --- */}
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

export default EditarPlanPage;