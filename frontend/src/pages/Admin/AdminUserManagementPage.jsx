import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, updateUserRole } from '../../services/admin.service';
import { 
  FaSpinner, FaExclamationTriangle, FaEdit, FaTimes, FaSearch, FaMapMarkerAlt,
  FaIdCard
} from 'react-icons/fa';
// Importamos el CSS unificado del sistema
import './AdminUserManagementPage.css';

/**
 * Modal para editar el Rol de un Usuario
 */
const RoleEditModal = ({ usuario, onClose, onConfirm, error, setError }) => {
  const [nuevoRol, setNuevoRol] = useState(usuario.rol);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { usuario: admin } = useAuth();

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      await onConfirm(usuario.id, nuevoRol);
      setIsSubmitting(false);
      onClose(); // Cierra el modal al éxito
    } catch (err) {
      setIsSubmitting(false);
      // El error ya viene de la función handleRoleUpdate
      // Solo aseguramos que se muestre en el modal
    }
  };

  const isEditingSelf = admin.id === usuario.id;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-header">
          <h3>CAMBIAR ROL DE IDENTIDAD</h3>
          <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
        </header>
        
        <div className="admin-modal-body">
          <p className="modal-target-info">
            Aplicando cambios a: <strong style={{color: 'var(--color-data)'}}>{usuario.nombre}</strong>
          </p>
          
          <div className="form-group-modal">
            <label htmlFor="rol">NUEVA ASIGNACIÓN DE ROL</label>
            <select
              id="rol"
              value={nuevoRol}
              onChange={(e) => setNuevoRol(e.target.value)}
              disabled={isSubmitting || isEditingSelf}
            >
              <option value="estudiante">ESTUDIANTE</option>
              <option value="docente">DOCENTE</option>
              <option value="administrador">ADMINISTRADOR</option>
            </select>
          </div>
          {isEditingSelf && (
            <p className="warning-message">ALERTA: Un administrador no puede auto-modificarse el rol.</p>
          )}
          {error && <p className="error-message-modal">{error}</p>}

        </div>
        
        <footer className="admin-modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
            CANCELAR
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit} 
            disabled={isSubmitting || isEditingSelf}
          >
            {isSubmitting ? <FaSpinner className="spin"/> : 'GUARDAR CAMBIOS'}
          </button>
        </footer>
      </div>
    </div>
  );
};


/**
 * Página principal para la Gestión de Usuarios
 */
const AdminUserManagementPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para los filtros
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroSearch, setFiltroSearch] = useState('');
  
  // Estado para el modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalError, setModalError] = useState(null);

  // Función para cargar los datos con los filtros aplicados
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters = {};
      if (filtroSearch) filters.search = filtroSearch;
      if (filtroRol) filters.rol = filtroRol;

      // Aquí se hace la llamada al servicio real
      const data = await getAllUsers(filters);
      setUsuarios(data || []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("Error al cargar los registros de identidad. Verifique el servidor.");
    } finally {
      setIsLoading(false);
    }
  }, [filtroRol, filtroSearch]);

  // Cargar datos al montar y cuando los filtros cambian
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); 

    return () => clearTimeout(timer); 
  }, [fetchUsers]); 

  // Handler para el modal
  const handleRoleUpdate = async (userId, nuevoRol) => {
    setModalError(null);
    try {
      await updateUserRole(userId, nuevoRol);
      fetchUsers(); 
    } catch (err) {
      setModalError(err.message);
      throw err;
    }
  };

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setModalError(null);
  };

  return (
    <div className="admin-user-management-page">
      <header className="admin-page-header">
        <h2>TERMINAL DE GESTIÓN DE IDENTIDADES (TGI)</h2>
        <p>Busca, filtra y actualiza los roles y el estado de verificación de todos los usuarios.</p>
      </header>

      {/* --- Barra de Filtros --- */}
      <div className="admin-filter-bar admin-section-container">
        <div className="filter-group search-group">
          <FaSearch className="search-icon"/>
          <input
            type="text"
            placeholder="Buscar por ID, nombre o correo..."
            value={filtroSearch}
            onChange={(e) => setFiltroSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="rol-filter">ROL:</label>
          <select 
            id="rol-filter"
            className="filter-select"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="">TODOS</option>
            <option value="estudiante">ESTUDIANTE</option>
            <option value="docente">DOCENTE</option>
            <option value="administrador">ADMINISTRADOR</option>
          </select>
        </div>
      </div>

      {/* --- Contenedor de la Tabla/Lista --- */}
      <div className="admin-section-container main-list-container">
        {isLoading && (
          <div className="admin-page-loader">
            <FaSpinner className="spin-icon" />
          </div>
        )}
        {!isLoading && error && (
          <div className="admin-page-error">
            <FaExclamationTriangle /> <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && usuarios.length === 0 && (
          <div className="admin-empty-state">
            <h3>NO HAY REGISTROS DE IDENTIDAD</h3>
            <p>Ajusta los filtros o espera nuevos usuarios.</p>
          </div>
        )}
        {!isLoading && !error && usuarios.length > 0 && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID / CORREO</th>
                  <th>NOMBRE / CIUDAD</th>
                  <th>ROL ASIGNADO</th>
                  <th>ESTADO VERIFICACIÓN</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id} className="user-row">
                    {/* Columna ID/Correo */}
                    <td className="col-id-email">
                      <div className="user-id-data">
                          <span className="user-id-number"><FaIdCard/> ID:{user.id.toString().padStart(4, '0')}</span>
                          <span className="user-email-address">{user.correo}</span>
                      </div>
                    </td>
                    
                    {/* Columna Nombre/Ciudad */}
                    <td className="col-identity">
                      <div className="user-identity">
                          <strong>{user.nombre}</strong>
                          <span className="user-city">
                              <FaMapMarkerAlt /> {user.ciudad || 'N/A'}
                          </span>
                      </div>
                    </td>
                    
                    {/* Columna Rol */}
                    <td className="col-role">
                      <span className={`role-tag role-${user.rol}`}>{user.rol}</span>
                    </td>
                    
                    {/* Columna Estado */}
                    <td className="col-status">
                      <span className={`status-tag status-${user.estado_verificacion}`}>
                        {user.estado_verificacion.replace('_', ' ')}
                      </span>
                    </td>
                    
                    {/* Columna Acciones */}
                    <td className="col-actions">
                      <button 
                        className="btn-action btn-edit-role"
                        title="Modificar Rol"
                        onClick={() => handleOpenModal(user)}
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                  <tr>
                      <td colSpan="5">
                          REGISTROS TOTALES: <span className="total-count">{usuarios.length}</span>
                      </td>
                  </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* --- Modal de Edición de Rol --- */}
      {selectedUser && (
        <RoleEditModal
          usuario={selectedUser}
          onClose={() => setSelectedUser(null)}
          onConfirm={handleRoleUpdate}
          error={modalError}
          setError={setModalError}
        />
      )}
    </div>
  );
};

export default AdminUserManagementPage;