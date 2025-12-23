/* Archivo: src/components/Estudiante/InscripcionesList.jsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FaSpinner, 
    FaExclamationCircle, 
    FaSearch,
    FaPlus
} from 'react-icons/fa';
import InscripcionCard from './InscripcionCard'; 

// Nota: MisInscripcionesPage.css debe estar importado globalmente o en el padre.

const InscripcionesList = ({
    filteredInscripciones,
    inscripcionesCount,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    loading,
    error,
    onRetry,
    recommendations
}) => {

    // --- Renderizado de Estados de Página ---
    const renderPageState = () => {
        if (loading) {
            return (
                <div className="page-state-feedback loading">
                    <FaSpinner className="fa-spin" />
                    <span>CARGANDO TUS INSCRIPCIONES</span>
                    <p>Obteniendo información actualizada de tus cursos...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="page-state-feedback error">
                    <FaExclamationCircle />
                    <span>ERROR DE CONEXIÓN</span>
                    <p>{error}</p>
                    <button 
                        className="btn-primary"
                        onClick={onRetry}
                    >
                        Reintentar conexión
                    </button>
                </div>
            );
        }
        
        if (inscripcionesCount === 0) {
            // Estado vacío total (No hay inscripciones)
            return (
                <div className="empty-state empty-state-pixeltech">
                    <h3>¡Bienvenido a tu Panel de Control!</h3>
                    <p>Actualmente no estás inscrito en ningún curso. Esta es tu oportunidad para comenzar tu viaje de aprendizaje.</p>
                    <div className="empty-actions">
                        <Link to="/buscar" className="btn-primary">
                            <FaPlus /> Explorar Cursos Disponibles
                        </Link>
                        {recommendations.length > 0 && (
                            <div className="recommendations-preview">
                                <h4>Basado en tus intereses, te recomendamos:</h4>
                                <div className="rec-list">
                                    {recommendations.slice(0, 3).map(rec => (
                                        <Link 
                                            key={rec.id} 
                                            to={`/curso/${rec.id}`}
                                            className="rec-item"
                                        >
                                            {rec.titulo}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        
        if (filteredInscripciones.length === 0) {
            // Estado vacío después de filtrar/buscar
            return (
                 <div className="page-state-feedback">
                    <FaSearch />
                    <span>SIN RESULTADOS</span>
                    <p>No se encontraron cursos que coincidan con los filtros o el término de búsqueda.</p>
                    <button 
                        className="btn-primary"
                        onClick={() => { setSearchTerm(''); setFilterTab('all'); }}
                    >
                        Limpiar Filtros
                    </button>
                </div>
            );
        }

        return (
            <div className="inscripciones-grid">
                {filteredInscripciones.map(insc => (
                    <InscripcionCard key={insc.inscripcion_id} inscripcion={insc} />
                ))}
            </div>
        );
    };

    return (
        <main className="inscripciones-content">
            {/* Header de la lista (Visible solo si hay contenido o se está buscando) */}
            {inscripcionesCount > 0 && (
                <div className="content-header">
                    <div className="content-header-left">
                        <h2>TUS INSCRIPCIONES</h2>
                        <p className="subtitle">
                            Mostrando {filteredInscripciones.length} de {inscripcionesCount} cursos
                        </p>
                    </div>
                    
                    <div className="header-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input 
                                type="text"
                                placeholder="Buscar curso o docente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <select 
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="recientes">Más recientes</option>
                            <option value="progreso">Mayor progreso</option>
                            <option value="nombre">Nombre A-Z</option>
                            <option value="fecha">Fecha de inicio</option>
                        </select>
                    </div>
                </div>
            )}
            
            {/* Grid de Inscripciones o Mensaje de Estado */}
            {renderPageState()}
        </main>
    );
};

export default InscripcionesList;