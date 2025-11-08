import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, updateUserRole } from '../../services/admin.service';
import { 
  FaSpinner, FaExclamationTriangle, FaUsers, FaEdit, FaTimes, FaSearch 
} from 'react-icons/fa';
// Reutilizamos el CSS del Modal y de la página de Verificación
import './AdminVerificationPage.css'; 
import './AdminUserManagementPage.css';

/**
 * Modal para editar el Rol de un Usuario
 */
const RoleEditModal = ({ usuario, onClose, onConfirm, error, setError }) => {
  const [nuevoRol, setNuevoRol] = useState(usuario.rol);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { usuario: admin } = useAuth(); // Obtenemos al admin logueado

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      await onConfirm(usuario.id, nuevoRol);
      setIsSubmitting(false);
      onClose(); // Cierra el modal al éxito
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Error al procesar la solicitud.');
    }
  };

  // Verificamos si el admin está intentando editarse a sí mismo
  // --- [CORREGIDO] ---
  // El objeto 'admin' (de useAuth) no tiene una propiedad 'usuario' anidada.
  // 'admin' ES el objeto de usuario.
  const isEditingSelf = admin.id === usuario.id;
  // ---------------------

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-header">
          <h3>Cambiar Rol de Usuario</h3>
          <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
        </header>
        
        <div className="admin-modal-body">
          <p>Estás editando el rol de <strong>{usuario.nombre}</strong> ({usuario.correo}).</p>
          
          <div className="form-group-modal">
            <label htmlFor="rol">Nuevo Rol</label>
            <select
              id="rol"
              value={nuevoRol}
              onChange={(e) => setNuevoRol(e.target.value)}
              disabled={isEditingSelf} // Deshabilitamos si se edita a sí mismo
            >
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          {isEditingSelf && (
            <p className="warning-message">No puedes cambiar tu propio rol de administrador.</p>
          )}
        </div>
        
        <footer className="admin-modal-footer">
          {error && <p className="error-message-modal">{error}</p>}
          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit} 
            disabled={isSubmitting || isEditingSelf} // Deshabilitamos si se edita a sí mismo
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
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

      const data = await getAllUsers(filters);
      setUsuarios(data || []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setIsLoading(false);
    }
  }, [filtroRol, filtroSearch]); // Depende de los filtros

  // Cargar datos al montar y cuando los filtros cambian
  useEffect(() => {
    // Usamos un 'debounce' simple para no llamar a la API en cada tecla
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); // Espera 500ms después de que el usuario deja de escribir

    return () => clearTimeout(timer); // Limpia el timer
  }, [fetchUsers]); // fetchUsers ya incluye las dependencias de filtro

  // Handler para el modal
  const handleRoleUpdate = async (userId, nuevoRol) => {
    setModalError(null);
    try {
      await updateUserRole(userId, nuevoRol);
      fetchUsers(); // Refrescar la lista de usuarios
    } catch (err) {
      // Mostrar error DENTRO del modal
      setModalError(err.message);
      // Re-lanzar error para que el modal sepa que falló
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
        <h2>Gestión de Usuarios</h2>
        <p>Busca, filtra y actualiza los roles de todos los usuarios en la plataforma.</p>
      </header>

      {/* --- Barra de Filtros --- */}
      <div className="admin-filter-bar">
        <div className="filter-group search-group">
          <FaSearch />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={filtroSearch}
            onChange={(e) => setFiltroSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="rol-filter">Filtrar por Rol:</label>
          <select 
            id="rol-filter"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="">Todos los Roles</option>
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>
      </div>

      {/* --- Contenedor de la Tabla --- */}
      <div className="admin-section-container">
        {isLoading && (
          <div className="admin-page-loader">
            <FaSpinner className="fa-spin" size="2em" />
          </div>
        )}
        {!isLoading && error && (
          <div className="admin-page-error">
            <FaExclamationTriangle /> <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && usuarios.length === 0 && (
          <div className="admin-empty-state" style={{border: 'none', padding: '2rem'}}>
            <h3>No se encontraron usuarios</h3>
            <p>Intenta ajustar tus filtros de búsqueda.</p>
          </div>
        )}
        {!isLoading && !error && usuarios.length > 0 && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado Verificación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id}>
                    <td>{user.nombre}</td>
                    <td>{user.correo}</td>
                    <td>
                      <span className={`role-tag role-${user.rol}`}>{user.rol}</span>
                    </td>
                    <td>
                      <span className={`status-tag status-${user.estado_verificacion}`}>
                        {user.estado_verificacion.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => handleOpenModal(user)}
                      >
                        <FaEdit /> Cambiar Rol
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
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