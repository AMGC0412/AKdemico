import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { crearPlanDeEstudio } from '../../services/planes.service.js';
import { obtenerListaCategorias, obtenerListaNiveles } from '../../services/catalogos.service.js';
import './DocenteForm.css'; 
import { FaBookMedical, FaSpinner, FaTimesCircle, FaLayerGroup, FaSignal, FaImage, FaEye, FaEyeSlash } from 'react-icons/fa';

const CrearPlanPage = () => {
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
    
    // Nuevos campos
    const [categoriaId, setCategoriaId] = useState('');
    const [nivelId, setNivelId] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');
    const [estadoPlan, setEstadoPlan] = useState('borrador'); // Por defecto nace como borrador

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true); // Para cargar los selects
    const [error, setError] = useState(null);

    // --- CARGAR CATÁLOGOS AL MONTAR ---
    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                const [cats, nivs] = await Promise.all([
                    obtenerListaCategorias(),
                    obtenerListaNiveles()
                ]);
                setListaCategorias(cats);
                setListaNiveles(nivs);
            } catch (err) {
                console.error("Error cargando catálogos:", err);
                setError("No se pudieron cargar las categorías o niveles. Revisa tu conexión.");
            } finally {
                setPageLoading(false);
            }
        };
        cargarCatalogos();
    }, []);

    // --- SUBMIT ---
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
            // Nuevos campos
            categoria_id: Number(categoriaId) || null,
            nivel_id: Number(nivelId) || null,
            imagen_url: imagenUrl,
            estado: estadoPlan
        };

        try {
            await crearPlanDeEstudio(planData);
            // Éxito: Navegar de vuelta a la lista
            navigate('/docente/cursos'); 
        } catch (err) {
            setError(err.mensaje || "Error al crear el plan. Revisa los campos obligatorios.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="page-loading"><FaSpinner className="spinner" /> Preparando formulario...</div>;

    return (
        <div className="docente-form-page">
            <div className="docente-form-container">
                <div className="docente-form-header">
                    <FaBookMedical className="icon-header" />
                    <h1>Crear Plan Maestro</h1>
                </div>
                <p className="form-description">
                    Establece la estructura base de tu curso. Los "Lotes" (fechas y precios) se crean después basados en este plan.
                </p>

                {error && <div className="message error"><FaTimesCircle /> {error}</div>}

                <form className="docente-form" onSubmit={handleSubmit}>
                    
                    {/* --- 1. VISIBILIDAD INICIAL --- */}
                    <div className="visibilidad-box">
                        <label className="visibilidad-label">
                            {estadoPlan === 'publicado' ? <FaEye /> : <FaEyeSlash />} Visibilidad Inicial
                        </label>
                        <select
                            value={estadoPlan}
                            onChange={(e) => setEstadoPlan(e.target.value)}
                            className={`select-estado ${estadoPlan}`}
                        >
                            <option value="borrador">BORRADOR (Oculto)</option>
                            <option value="publicado">PUBLICADO (Visible)</option>
                        </select>
                    </div>

                    {/* --- 2. INFORMACIÓN BÁSICA --- */}
                    <div className="form-group">
                        <label htmlFor="titulo">Título del Plan (Obligatorio)</label>
                        <input
                            type="text" id="titulo"
                            value={titulo} onChange={(e) => setTitulo(e.target.value)}
                            required placeholder="Ej: Curso Avanzado de Fotografía"
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
                            <label><FaSignal /> Nivel</label>
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
                        <label htmlFor="descripcion">Descripción</label>
                        <textarea
                            id="descripcion"
                            value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                            required placeholder="Resumen atractivo del contenido del curso..."
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="objetivos">Objetivos de Aprendizaje</label>
                        <textarea
                            id="objetivos"
                            value={objetivos} onChange={(e) => setObjetivos(e.target.value)}
                            required placeholder="Al finalizar este curso, el estudiante podrá..."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Duración (Semanas)</label>
                            <input
                                type="number"
                                value={duracionSemanas} onChange={(e) => setDuracionSemanas(e.target.value)}
                                min="1" placeholder="Ej: 8"
                            />
                        </div>
                        <div className="form-group">
                            <label>Frecuencia (Clases/Semana)</label>
                            <input
                                type="number"
                                value={frecuenciaSemanal} onChange={(e) => setFrecuenciaSemanal(e.target.value)}
                                min="1" placeholder="Ej: 2"
                            />
                        </div>
                    </div>

                    {/* --- 5. IMAGEN REFERENCIAL --- */}
                    <div className="form-group section-imagen">
                        <label><FaImage /> Imagen de Portada (URL)</label>
                        <input 
                            type="text" 
                            placeholder="https://..."
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
                            {loading ? <><FaSpinner className="spinner" /> Creando...</> : 'Crear Plan'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CrearPlanPage;