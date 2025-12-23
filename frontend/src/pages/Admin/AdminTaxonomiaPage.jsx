import React, { useState, useEffect, useCallback } from 'react';
import { 
  getTaxonomias, createTaxonomia, updateTaxonomia, deleteTaxonomia 
} from '../../services/admin.service';
import { 
  FaSpinner, FaExclamationTriangle, FaTags, FaPlus, FaEdit, FaTrash,
  FaTimes, FaLayerGroup, FaSignal, FaDatabase, FaClipboardList
} from 'react-icons/fa';
import './AdminTaxonomiaPage.css';

/**
 * Componente Modal para Editar/Confirmar
 */
const TaxonomiaModal = ({ modo, item, onClose, onConfirm, error }) => {
  const [nombre, setNombre] = useState(item?.nombre || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDeleting = modo === 'delete';
  const title = isDeleting ? 'CONFIRMAR ELIMINACIÓN DE REGISTRO' : 'MODIFICAR NOMBRE';

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    
    if (!isDeleting && !nombre.trim()) {
        alert('El nombre no puede estar vacío.');
        setIsSubmitting(false);
        return;
    }

    try {
      await onConfirm(item.id, isDeleting ? null : nombre); 
      setIsSubmitting(false);
      onClose(); 
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Error desconocido.');
    }
  };
  
  useEffect(() => {
    if (modo === 'edit') {
      setNombre(item?.nombre || '');
    }
  }, [item, modo]);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
        </header>
        <div className="admin-modal-body">
          <div className="modal-target-info">
              Tipo: <strong style={{ color: item.tipo === 'materia' ? 'var(--color-secondary)' : 'var(--color-data)' }}>{item.tipo.toUpperCase()}</strong>
          </div>
          
          {isDeleting ? (
            <p className="deletion-warning">ALERTA: ¿Estás seguro de eliminar el registro <strong>"{item.nombre}"</strong>? Esto podría afectar a planes de estudio asociados.</p>
          ) : (
            <div className="form-group-modal">
              <label htmlFor="nombre">NOMBRE ACTUAL</label>
              <p className="current-value">{item.nombre}</p>
              <label htmlFor="nombre">NUEVO NOMBRE</label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Introduzca el nuevo nombre de la taxonomía"
                className="input-modal-edit"
              />
            </div>
          )}
        </div>
        <footer className="admin-modal-footer">
          {error && <p className="error-message-modal">{error}</p>}
          <button className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
            CANCELAR
          </button>
          <button 
            className={`btn ${isDeleting ? 'btn-danger' : 'btn-primary'}`} 
            onClick={handleSubmit} 
            disabled={isSubmitting}>
            {isSubmitting ? <FaSpinner className="spin"/> : `CONFIRMAR ${title.split(' ')[0]}`}
          </button>
        </footer>
      </div>
    </div>
  );
};

/**
 * Formulario para crear una nueva taxonomía
 */
const CrearTaxonomiaForm = ({ onTaxonomiaCreada, setError, formError, setFormError }) => {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('materia');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setFormError('El nombre no puede estar vacío.');
      return;
    }
    
    setIsLoading(true);
    setFormError(null); 
    setError(null); 
    try {
      await createTaxonomia(tipo, nombre);
      setNombre(''); 
      onTaxonomiaCreada(); 
    } catch (err) {
      setFormError(err.message); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-container form-creation-card">
      <h3 className="admin-section-title"><FaPlus /> AÑADIR NUEVO REGISTRO</h3>
      <form onSubmit={handleSubmit} className="taxonomia-form">
        <div className="form-group">
          <label htmlFor="tipo"><FaDatabase/> TIPO DE REGISTRO</label>
          <select id="tipo" className="input-field" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="materia">MATERIA / CATEGORÍA</option>
            <option value="nivel">NIVEL EDUCATIVO</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="nombre"><FaTags/> NOMBRE DEL ÍTEM</label>
          <input
            id="nombre"
            className="input-field"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={tipo === 'materia' ? "Ej: Álgebra Lineal" : "Ej: Avanzado"}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-submit" disabled={isLoading}>
          {isLoading ? <FaSpinner className="spin"/> : 'CREAR REGISTRO'}
        </button>
        {formError && <p className="error-message-global" style={{marginTop: '1rem'}}><FaExclamationTriangle/> {formError}</p>}
      </form>
    </div>
  );
};


/**
 * Página principal para la Gestión de Taxonomía
 */
const AdminTaxonomiaPage = () => {
  const [materias, setMaterias] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null); 
  const [formError, setFormError] = useState(null); 

  // Estado para los modales
  const [modalInfo, setModalInfo] = useState({ modo: null, item: null }); 
  const [modalError, setModalError] = useState(null);

  // Cargar datos
  const fetchTaxonomias = async () => {
    try {
      setGlobalError(null);
      // Asumo que el servicio real devuelve un objeto { categorias: [...], niveles: [...] }
      const data = await getTaxonomias(); 
      setMaterias(data.categorias || data.materias || []); 
      setNiveles(data.niveles || []);
    } catch (err) {
      setGlobalError("No se pudieron cargar los registros base. Error de conexión.");
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchTaxonomias();
  }, []);

  // --- Handlers de Acciones (CRUD) ---

  const handleModalConfirm = async (id, nuevoNombre) => {
    setModalError(null); 
    const { modo, item } = modalInfo;

    try {
      if (modo === 'edit') {
        // Asumo que el servicio updateTaxonomia necesita ID, nuevo nombre y el tipo (para el endpoint)
        await updateTaxonomia(id, nuevoNombre, item.tipo); 
      } else if (modo === 'delete') {
        await deleteTaxonomia(id); 
      }
      fetchTaxonomias(); 
      setModalInfo({ modo: null, item: null }); 
    } catch (err) {
      setModalError(err.message);
      throw err;
    }
  };
  
  const handleOpenModal = (modo, item) => {
    // Definimos el tipo aquí para que el modal sepa qué etiqueta mostrar
    const itemWithTipo = item.tipo ? item : {...item, tipo: item.nombre.includes('Avanzado') ? 'nivel' : 'materia'};
    setModalInfo({ modo, item: itemWithTipo });
    setModalError(null); 
  };

  // 1. Estado de Carga
  if (isLoading) {
    return <div className="admin-page-state loading"><FaSpinner className="spin-icon" /><p>SINCRONIZANDO REGISTROS DE TAXONOMÍA...</p></div>;
  }

  // 2. Estado de Error (Solo para la carga inicial)
  if (globalError && !isLoading) {
    return <div className="admin-page-state error"><FaExclamationTriangle className="error-icon" /><h3>ERROR DE CONEXIÓN</h3><p>{globalError}</p></div>;
  }

  // 3. Estado de Éxito
  return (
    <div className="admin-taxonomia-page">
      <header className="admin-page-header">
        <h2>TERMINAL DE EDICIÓN DE TAXONOMÍA</h2>
        <p>Control de los registros base de Materias (Categorías) y Niveles disponibles en la plataforma.</p>
      </header>

      {/* --- Layout de 2 columnas --- */}
      <div className="taxonomia-layout">
        
        {/* Columna 1: Listas (Contenido Denso) */}
        <div className="taxonomia-listas">
          {/* Lista de Materias */}
          <div className="admin-section-container list-materia-card">
            <h3 className="admin-section-title"><FaLayerGroup /> REGISTROS DE MATERIAS</h3>
            <ul className="taxonomia-list">
              {materias.length === 0 && <li className="empty-list-item"><FaClipboardList/> No hay materias creadas.</li>}
              {materias.map(item => (
                <li key={item.id} className="taxonomia-item item-materia">
                  <span className="item-name">{item.nombre}</span>
                  <div className="item-actions">
                    <button onClick={() => handleOpenModal('edit', {...item, tipo: 'materia'})} className="btn-icon btn-edit" title="Editar"><FaEdit /></button>
                    <button onClick={() => handleOpenModal('delete', {...item, tipo: 'materia'})} className="btn-icon btn-delete" title="Eliminar"><FaTrash /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Lista de Niveles */}
          <div className="admin-section-container list-nivel-card">
            <h3 className="admin-section-title"><FaSignal /> REGISTROS DE NIVELES</h3>
            <ul className="taxonomia-list">
              {niveles.length === 0 && <li className="empty-list-item"><FaClipboardList/> No hay niveles creados.</li>}
              {niveles.map(item => (
                <li key={item.id} className="taxonomia-item item-nivel">
                  <span className="item-name">{item.nombre}</span>
                  <div className="item-actions">
                    <button onClick={() => handleOpenModal('edit', {...item, tipo: 'nivel'})} className="btn-icon btn-edit" title="Editar"><FaEdit /></button>
                    <button onClick={() => handleOpenModal('delete', {...item, tipo: 'nivel'})} className="btn-icon btn-delete" title="Eliminar"><FaTrash /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Columna 2: Formulario de Creación (Sticky Control Module) */}
        <div className="taxonomia-form-container">
          <CrearTaxonomiaForm 
            onTaxonomiaCreada={fetchTaxonomias} 
            setError={setGlobalError} 
            formError={formError}
            setFormError={setFormError}
          />
        </div>

      </div>

      {/* Modal de Edición/Borrado */}
      {modalInfo.modo && (
        <TaxonomiaModal
          modo={modalInfo.modo}
          item={modalInfo.item}
          onClose={() => setModalInfo({ modo: null, item: null })}
          onConfirm={handleModalConfirm}
          error={modalError}
        />
      )}
    </div>
  );
};

export default AdminTaxonomiaPage;