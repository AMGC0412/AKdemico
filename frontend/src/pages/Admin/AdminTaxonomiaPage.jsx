import React, { useState, useEffect } from 'react';
import { 
  getTaxonomias, createTaxonomia, updateTaxonomia, deleteTaxonomia 
} from '../../services/admin.service';
import { 
  FaSpinner, FaExclamationTriangle, FaTags, FaPlus, FaEdit, FaTrash,
  FaTimes // <-- [CORREGIDO] Añadimos el ícono que faltaba
} from 'react-icons/fa';
import './AdminTaxonomiaPage.css';
import '../Admin/AdminVerificationPage.css'; // Reutilizamos estilos del Modal

/**
 * Componente Modal para Editar/Confirmar
 * Es reutilizable para Edición y Borrado
 */
const TaxonomiaModal = ({ modo, item, onClose, onConfirm, error }) => {
  const [nombre, setNombre] = useState(item?.nombre || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDeleting = modo === 'delete';
  const title = isDeleting ? 'Confirmar Eliminación' : 'Editar Taxonomía';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Reiniciamos el error del modal padre
    onConfirm(isDeleting ? item.id : nombre, true); // true para 'resetear error'
    
    try {
      if (isDeleting) {
        await onConfirm(item.id);
      } else {
        await onConfirm(item.id, nombre);
      }
      setIsSubmitting(false);
      onClose(); // Cierra solo si tiene éxito
    } catch (err) {
      // El onConfirm (manejado por el padre) ya setea el error
      setIsSubmitting(false);
    }
  };
  
  // Limpiamos el 'nombre' si el item cambia (para editar)
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
          {/* Esta línea ahora funcionará */}
          <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
        </header>
        <div className="admin-modal-body">
          {isDeleting ? (
            <p>¿Estás seguro de que quieres eliminar <strong>"{item.nombre}"</strong>? Esta acción no se puede deshacer.</p>
          ) : (
            <div className="form-group-modal">
              <label htmlFor="nombre">Nuevo Nombre</label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Física Cuántica"
              />
            </div>
          )}
        </div>
        <footer className="admin-modal-footer">
          {error && <p className="error-message-modal">{error}</p>}
          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button 
            className={`btn ${isDeleting ? 'btn-danger' : 'btn-primary'}`} 
            onClick={handleSubmit} 
            disabled={isSubmitting}>
            {isSubmitting ? (isDeleting ? 'Eliminando...' : 'Guardando...') : (isDeleting ? 'Eliminar' : 'Guardar Cambios')}
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
    setFormError(null); // Limpiamos error de formulario
    setError(null); // Limpiamos error global
    try {
      await createTaxonomia(tipo, nombre);
      setNombre(''); // Limpiar formulario
      onTaxonomiaCreada(); // Refrescar la lista en el padre
    } catch (err) {
      setFormError(err.message); // Mostramos el error en el formulario
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-container">
      <h3 className="admin-section-title">Añadir Nuevo Ítem</h3>
      <form onSubmit={handleSubmit} className="taxonomia-form">
        <div className="form-group">
          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="materia">Materia</option>
            <option value="nivel">Nivel</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Cálculo II"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? <FaSpinner className="fa-spin" /> : <FaPlus />}
          Añadir
        </button>
        {formError && <p className="error-message-global" style={{marginTop: '1rem'}}>{formError}</p>}
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
  const [globalError, setGlobalError] = useState(null); // Para errores de carga
  const [formError, setFormError] = useState(null); // Para errores del formulario

  // Estado para los modales
  const [modalInfo, setModalInfo] = useState({ modo: null, item: null }); // modo: 'edit' o 'delete'
  const [modalError, setModalError] = useState(null);

  // Cargar datos
  const fetchTaxonomias = async () => {
    try {
      // No seteamos loading aquí para evitar parpadeo al crear/borrar
      setGlobalError(null);
      const data = await getTaxonomias();
      setMaterias(data.materias || []);
      setNiveles(data.niveles || []);
    } catch (err) {
      setGlobalError("No se pudieron cargar las taxonomías.");
    } finally {
      setIsLoading(false); // Solo seteamos loading en la carga inicial
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchTaxonomias();
  }, []);

  // --- Handlers de Acciones (CRUD) ---

  const handleModalConfirm = async (id, nuevoNombre) => {
    setModalError(null); // Limpiamos error previo del modal
    const { modo, item } = modalInfo;

    try {
      if (modo === 'edit') {
        await updateTaxonomia(id, nuevoNombre); // 'valor' es el nuevo nombre
      } else if (modo === 'delete') {
        await deleteTaxonomia(id); // 'valor' es el id
      }
      fetchTaxonomias(); // Refrescar toda la lista
      setModalInfo({ modo: null, item: null }); // Cerrar modal
    } catch (err) {
      // Mostrar error DENTRO del modal
      setModalError(err.message);
      // Lanzamos error para que el modal sepa que no debe cerrar
      throw err;
    }
  };
  
  const handleOpenModal = (modo, item) => {
    setModalInfo({ modo, item });
    setModalError(null); // Limpiamos errores al abrir
  };

  // 1. Estado de Carga
  if (isLoading) {
    return <div className="admin-page-loader"><FaSpinner className="fa-spin" size="3em" /><p>Cargando taxonomías...</p></div>;
  }

  // 2. Estado de Error (Solo para la carga inicial)
  if (globalError && !isLoading && materias.length === 0 && niveles.length === 0) {
    return <div className="admin-page-error"><FaExclamationTriangle size="3em" /><h3>Error al Cargar</h3><p>{globalError}</p></div>;
  }

  // 3. Estado de Éxito
  return (
    <div className="admin-taxonomia-page">
      <header className="admin-page-header">
        <h2>Gestión de Taxonomía</h2>
        <p>Añade, edita o elimina las Materias y Niveles disponibles en la plataforma.</p>
      </header>

      {/* --- Layout de 2 columnas --- */}
      <div className="taxonomia-layout">
        {/* Columna Izquierda: Listas */}
        <div className="taxonomia-listas">
          {/* Lista de Materias */}
          <div className="admin-section-container">
            <h3 className="admin-section-title"><FaTags /> Materias</h3>
            <ul className="taxonomia-list">
              {materias.length === 0 && <li>No hay materias creadas.</li>}
              {materias.map(item => (
                <li key={item.id}>
                  <span>{item.nombre}</span>
                  <div className="item-actions">
                    <button onClick={() => handleOpenModal('edit', item)} className="btn-icon btn-edit"><FaEdit /></button>
                    <button onClick={() => handleOpenModal('delete', item)} className="btn-icon btn-delete"><FaTrash /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Lista de Niveles */}
          <div className="admin-section-container">
            <h3 className="admin-section-title"><FaTags /> Niveles</h3>
            <ul className="taxonomia-list">
              {niveles.length === 0 && <li>No hay niveles creados.</li>}
              {niveles.map(item => (
                <li key={item.id}>
                  <span>{item.nombre}</span>
                  <div className="item-actions">
                    <button onClick={() => handleOpenModal('edit', item)} className="btn-icon btn-edit"><FaEdit /></button>
                    <button onClick={() => handleOpenModal('delete', item)} className="btn-icon btn-delete"><FaTrash /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Creación */}
        <div className="taxonomia-form-container">
          <CrearTaxonomiaForm 
            onTaxonomiaCreada={fetchTaxonomias} 
            setError={setGlobalError} // Pasamos el error global
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