import React, { useState, useEffect, useMemo } from 'react';
import { buscarLotes } from '../../services/lote.service.js';
import { obtenerTodasTaxonomias } from '../../services/taxonomia.service.js';
import CourseCard from '../../components/shared/CourseCard.jsx';
import './CourseSearchPage.css'; // Importamos el CSS Art Pop
import { 
    FaFilter, FaSearch, FaTimesCircle, FaBookOpen,
    FaSpinner, FaRegSadTear, FaExclamationCircle // Iconos para estados
} from 'react-icons/fa';

const CourseSearchPage = () => {
    // --- Estados ---
    const [cursosOriginales, setCursosOriginales] = useState([]); // Cursos de la API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroModalidad, setFiltroModalidad] = useState('');
    const [filtroPrecioMax, setFiltroPrecioMax] = useState(500);
    const [filtroMateriaId, setFiltroMateriaId] = useState('');
    const [filtroNivelId, setFiltroNivelId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [materias, setMaterias] = useState([]);
    const [niveles, setNiveles] = useState([]);

  // 1. Cargar Taxonomías
  useEffect(() => {
    const cargarOpcionesFiltro = async () => {
      try {
        const data = await obtenerTodasTaxonomias();
        setMaterias(data.materias || []);
        setNiveles(data.niveles || []);
      } catch (err) {
        console.error("Error cargando opciones de filtro:", err);
      }
    };
    cargarOpcionesFiltro();
  }, []); 

  // 2. Cargar Cursos (depende de filtros API)
  useEffect(() => {
    const filtrosAPI = {};
    if (filtroModalidad) filtrosAPI.modalidad = filtroModalidad;
    if (filtroPrecioMax < 500) filtrosAPI.precio_max = filtroPrecioMax;
    // (Asumiendo que el backend puede filtrar por estos IDs)
    if (filtroMateriaId) filtrosAPI.materiaId = filtroMateriaId;
    if (filtroNivelId) filtrosAPI.nivelId = filtroNivelId;

    const cargarCursos = async () => {
      setLoading(true);
      setError(null);
      try {
        // Usamos la búsqueda general (que debería aceptar filtros)
        const data = await buscarLotes(filtrosAPI); 
        setCursosOriginales(data); 
      } catch (err) {
        setError('Error al cargar los cursos. No se pudo establecer conexión.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargarCursos();
  }, [filtroModalidad, filtroPrecioMax, filtroMateriaId, filtroNivelId]); 

  // 3. Filtrar por Búsqueda (Frontend)
  const cursosFiltrados = useMemo(() => {
    if (!searchTerm) {
      return cursosOriginales; 
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return cursosOriginales.filter(curso => 
      curso.plan_titulo?.toLowerCase().includes(lowerSearchTerm) ||
      curso.docente_nombre?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, cursosOriginales]); 


  // --- Handlers para cambios ---
  const handleModalidadChange = (e) => setFiltroModalidad(e.target.value);
  const handlePrecioChange = (e) => setFiltroPrecioMax(Number(e.target.value));
  const handleMateriaChange = (e) => setFiltroMateriaId(e.target.value);
  const handleNivelChange = (e) => setFiltroNivelId(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const limpiarFiltros = () => { 
    setFiltroModalidad('');
    setFiltroPrecioMax(500);
    setFiltroMateriaId('');
    setFiltroNivelId('');
    setSearchTerm('');
  };
  
  // --- [NUEVO] Helper de Renderizado para Resultados ---
  const renderResultados = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <FaSpinner className="fa-spin" size="3em" />
          <p>Cargando Catálogo...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-card-pixeltech">
          <FaExclamationCircle size="3em" />
          <h3>Error de Conexión</h3>
          <p>{error}</p>
        </div>
      );
    }
    
    if (cursosFiltrados.length === 0) { 
      return (
          <div className="empty-state-pixeltech">
            <FaRegSadTear size="3em" />
            <h3>Sin Resultados</h3>
            <p>No se encontraron cursos con los criterios seleccionados.</p>
            <button onClick={limpiarFiltros} className="btn btn-primary" style={{marginTop: '1rem'}}>
                Mostrar Todos
            </button>
          </div>
      );
    }

    return (
        <div className="course-grid-akademic">
            {cursosFiltrados.map(curso => (
                <CourseCard key={curso.lote_id} curso={curso} />
                // NOTA: CourseCard necesita un onQuickView si se va a usar
            ))}
        </div>
    );
  }

return (
        // [MODIFICADO] Nuevas clases principales
        <div className="search-page-akademic">
          <div className="search-container">

            {/* --- Filtros de Búsqueda (Art Pop) --- */}
            <section className="search-filters-section">
                <div className="search-section-header">
                    <FaFilter className="header-icon" />
                    <h2>Filtros de Búsqueda</h2>
                </div>
                <div className="filters-grid">
                     {/* Búsqueda por Texto */}
                     <div className="filter-item search-term">
                        <label htmlFor="search">Buscar</label>
                        <div className="input-with-icon">
                            <FaSearch className="input-icon"/>
                            <input
                                type="text" id="search" placeholder="Título, docente o tema..."
                                value={searchTerm} onChange={handleSearchChange}
                            />
                        </div>
                     </div>
                     {/* Rango de Precio */}
                     <div className="filter-item price-range">
                        <label htmlFor="precio_max">Precio Máximo (S/ {filtroPrecioMax})</label>
                        <input
                            type="range" id="precio_max" min="0" max="500" step="10"
                            value={filtroPrecioMax} onChange={handlePrecioChange}
                        />
                     </div>
                     {/* Categoría (Materia) */}
                     <div className="filter-item category-select">
                        <label htmlFor="materia">Categoría</label>
                        <select id="materia" value={filtroMateriaId} onChange={handleMateriaChange}>
                            <option value="">Todas las categorías</option>
                            {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                     </div>
                      {/* Nivel */}
                     <div className="filter-item level-select">
                        <label htmlFor="nivel">Nivel</label>
                        <select id="nivel" value={filtroNivelId} onChange={handleNivelChange}>
                            <option value="">Todos los niveles</option>
                            {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                        </select>
                     </div>
                     {/* Modalidad */}
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
                        {/* Este botón usará los estilos de .btn-secondary de index.css */}
                        <button onClick={limpiarFiltros} className="btn btn-secondary">
                           <FaTimesCircle style={{ marginRight: '5px' }} /> Limpiar
                        </button>
                     </div>
                </div>
            </section>

            {/* --- Resultados de la Búsqueda --- */}
            <section className="search-results-section">
                 <div className="search-section-header">
                    <FaBookOpen className="header-icon" />
                    <h2>Cursos Disponibles ({cursosFiltrados.length})</h2>
                </div>

                {renderResultados()}
                
            </section>
          </div>
        </div>
    );
};

export default CourseSearchPage;