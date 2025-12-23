import React, { useState, useEffect, useMemo } from 'react';
// [MODIFICADO] importamos los servicios (no cambia)
import { buscarLotes } from '../../services/lote.service.js';
import { obtenerTodasTaxonomias } from '../../services/taxonomia.service.js';
// [MODIFICADO] importamos CourseCard (no cambia)
import CourseCard from '../../components/shared/CourseCard.jsx';
import './CourseSearchPage.css'; 
import { 
    FaFilter, FaSearch, FaTimesCircle, FaBookOpen,
    FaSpinner, FaLayerGroup 
} from 'react-icons/fa';

const MASCOT_PATH = '/images/pet/pet_04.png'; 

const CourseSearchPage = () => {
    // [MEJORADO] Renombramos 'cursosOriginales' a 'planes'
    const [planes, setPlanes] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados de Filtro
    const [filtroModalidad, setFiltroModalidad] = useState('');
    const [filtroPrecioMax, setFiltroPrecioMax] = useState(500);
    // [ELIMINADO] filtroMateriaId
    const [filtroNivelId, setFiltroNivelId] = useState('');
    const [filtroCategoriaId, setFiltroCategoriaId] = useState(''); 
    const [searchTerm, setSearchTerm] = useState('');
    
    // Opciones para los <select>
    // [ELIMINADO] 'materias'
    const [niveles, setNiveles] = useState([]);
    const [categorias, setCategorias] = useState([]); 

  // 1. Cargar Taxonomías (Opciones de Filtro)
  useEffect(() => {
    const cargarOpcionesFiltro = async () => {
      try {
        const data = await obtenerTodasTaxonomias();
        // [MODIFICADO] Ya no cargamos 'materias'
        setNiveles(data.niveles || []);
        setCategorias(data.categorias || []); 
      } catch (err) {
        console.error("Error cargando opciones de filtro:", err);
        setError("No se pudieron cargar los filtros. " + err.message);
      }
    };
    cargarOpcionesFiltro();
  }, []); 

  // 2. [MEJORADO] Cargar Planes (Ahora depende de los filtros de la API)
  useEffect(() => {
    // Creamos el objeto de parámetros para la API
    const filtrosAPI = {};
    if (filtroModalidad) filtrosAPI.modalidad = filtroModalidad;
    if (filtroPrecioMax < 500) filtrosAPI.precio_max = filtroPrecioMax; 
    // [MODIFICADO] 'materiaId' se reemplaza por 'categoriaId'
    if (filtroCategoriaId) filtrosAPI.categoriaId = filtroCategoriaId;
    if (filtroNivelId) filtrosAPI.nivelId = filtroNivelId;

    const cargarPlanes = async () => {
      setLoading(true);
      setError(null); 
      try {
        // [MEJORADO] Pasamos los filtros de la API a buscarLotes
        const data = await buscarLotes(filtrosAPI); 
        // [MEJORADO] Guardamos los planes agrupados que devuelve la API
        setPlanes(data); 
      } catch (err) {
        setError('Error al cargar los cursos. ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // [NUEVO] Usamos un temporizador (debounce) para no llamar a la API
    // en cada click del slider de precio, solo cuando el usuario para.
    const timerId = setTimeout(() => {
        cargarPlanes();
    }, 500); // Espera 500ms después del último cambio

    return () => clearTimeout(timerId); // Limpia el temporizador si hay un nuevo cambio

  // [MEJORADO] Actualizadas las dependencias
  }, [filtroModalidad, filtroPrecioMax, filtroCategoriaId, filtroNivelId]); 

  // 3. [MEJORADO] Filtrado por Búsqueda (Frontend - INSTANTÁNEO)
  // useMemo ahora solo se preocupa por el texto de búsqueda.
  const planesFiltrados = useMemo(() => {
    if (!searchTerm) {
      return planes; 
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return planes.filter(plan => 
      plan.plan_titulo?.toLowerCase().includes(lowerSearchTerm) ||
      plan.docente_nombre?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, planes]); 


  // --- Handlers ---
  const handleModalidadChange = (e) => setFiltroModalidad(e.target.value);
  const handlePrecioChange = (e) => setFiltroPrecioMax(Number(e.target.value));
  // [ELIMINADO] handleMateriaChange
  const handleNivelChange = (e) => setFiltroNivelId(e.target.value);
  const handleCategoriaChange = (e) => setFiltroCategoriaId(e.target.value); 
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  
  const limpiarFiltros = () => { 
    setFiltroModalidad('');
    setFiltroPrecioMax(500); 
    // [ELIMINADO] setFiltroMateriaId
    setFiltroNivelId('');
    setFiltroCategoriaId(''); 
    setSearchTerm('');
  };
  
  // --- RenderResultados (Con animación de delay) ---
  const renderResultados = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <FaSpinner className="fa-spin" size="3em" />
          <p>Buscando Cursos...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="error-card-pixeltech">
          <img src={MASCOT_PATH} alt="Error" className="mascot-state-image" />
          <h3>¡Oh no! Hubo un Error</h3>
          <p>{error}</p>
          <p>Parece que nuestros circuitos están cruzados. Intenta recargar la página.</p>
        </div>
      );
    }
    if (planesFiltrados.length === 0) { 
      return (
          <div className="empty-state-pixeltech">
            <img src={MASCOT_PATH} alt="Sin resultados" className="mascot-state-image" />
            <h3>¡Nada por aquí!</h3>
            <p>El búho no encontró cursos con esos criterios. ¿Probamos con otros filtros?</p>
            <button onClick={limpiarFiltros} className="btn btn-primary" style={{marginTop: '1rem'}}>
                Limpiar Filtros
            </button>
          </div>
      );
    }

    return (
        <div className="course-grid-akademic">
            {planesFiltrados.map((plan, index) => (
                <CourseCard 
                    key={plan.plan_id} 
                    plan={plan} 
                    // [NUEVO] Aplica retraso incremental a cada tarjeta
                    style={{ animationDelay: `${index * 0.1}s` }}
                />
            ))}
        </div>
    );
  }

return (
        <div className="search-page-akademic">
          <div className="search-container">
            <aside className="search-filters-sidebar">
                <div className="search-section-header">
                    <FaFilter className="header-icon" />
                    <h2>Panel de Filtros</h2>
                </div>
                <div className="filters-grid">
                     <div className="filter-item search-term">
                        <label htmlFor="search">Buscar Curso</label>
                        <div className="input-with-icon">
                            <FaSearch className="input-icon"/>
                            <input
                                type="text" id="search" placeholder="Título, docente..."
                                value={searchTerm} onChange={handleSearchChange}
                            />
                        </div>
                     </div>
                     <div className="filter-item price-range">
                        <label htmlFor="precio_max">
                            Precio Máximo: {filtroPrecioMax === 500 ? 'S/ 500+ (Sin Límite)' : `S/ ${filtroPrecioMax}`}
                        </label>
                        <input
                            type="range" id="precio_max" min="0" max="500" step="10"
                            value={filtroPrecioMax} onChange={handlePrecioChange}
                            className="price-slider-akademic"
                        />
                     </div>
                     {/* Select de Categoría */}
                     <div className="filter-item category-select">
                        <label htmlFor="categoria">Categoría Principal</label>
                        <select id="categoria" value={filtroCategoriaId} onChange={handleCategoriaChange}>
                            <option value="">Todas las categorías</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                     </div>
                     
                     {/* [ELIMINADO] El select de 'Materia (Subtema)' se ha ido */}

                     {/* Select de Nivel */}
                     <div className="filter-item level-select">
                        <label htmlFor="nivel">Nivel</label>
                        <select id="nivel" value={filtroNivelId} onChange={handleNivelChange}>
                            <option value="">Todos los niveles</option>
                            {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                        </select>
                     </div>
                     {/* Select de Modalidad */}
                     <div className="filter-item modality-select">
                        <label htmlFor="modalidad">Modalidad</label>
                        <select id="modalidad" value={filtroModalidad} onChange={handleModalidadChange}>
                            <option value="">Ambas</option>
                            <option value="virtual">Virtual</option>
                            <option value="presencial">Presencial</option>
                        </select>
                     </div>
                     {/* Botón Limpiar */}
                     <div className="filter-item clear-button">
                        <button onClick={limpiarFiltros} className="btn btn-secondary">
                           <FaTimesCircle style={{ marginRight: '8px' }} /> Limpiar Filtros
                        </button>
                     </div>
                </div>
            </aside>
            <main className="search-results-section">
                 <div className="search-section-header">
                    <FaBookOpen className="header-icon" />
                    <h2>Cursos Disponibles ({planesFiltrados.length})</h2>
                </div>
                {renderResultados()}
            </main>
          </div>
        </div>
    );
};

export default CourseSearchPage;