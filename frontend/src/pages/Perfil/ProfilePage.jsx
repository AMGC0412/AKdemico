import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css'; 
import { FaEdit, FaTimes, FaUser, FaShieldAlt, FaSpinner } from 'react-icons/fa';

// Importa los sub-componentes
import RoleBadge from './RoleBadge';
import ViewProfileDetails from './ViewProfileDetails';
import EditProfileForm from './EditProfileForm';
import ChangePasswordForm from './ChangePasswordForm';

/**
 * Componente Principal de la Página de Perfil
 * [MEJORA] Actúa como controlador de pestañas y estado de edición.
 */
const ProfilePage = () => {
  // ⚠️ CORRECCIÓN CLAVE 1:
  // Se ha renombrado 'token' a 'authToken' para que coincida con lo que provee tu AuthContext.
  const { usuario, authToken, actualizarUsuarioEnContexto } = useAuth();
  
  const [activeTab, setActiveTab] = useState('perfil'); // 'perfil' o 'seguridad'
  const [isEditing, setIsEditing] = useState(false);
  
  if (!usuario) {
    return (
      <div className="profile-page-akademic">
        <div className="profile-card">
          <div className="profile-content" style={{textAlign: 'center'}}>
            <FaSpinner className="fa-spin" size="2em" />
            <p>Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  // Activa o desactiva el modo edición
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setActiveTab('perfil'); // Asegura que estemos en la pestaña de perfil
  };
  
  // Callback para cuando el formulario de edición guarda con éxito
  const handleSaveSuccess = (usuarioActualizado) => {
    if (actualizarUsuarioEnContexto) {
        actualizarUsuarioEnContexto(usuarioActualizado);
    }
    setIsEditing(false); // Salir del modo edición
  };

  // URL del avatar (placeholder si no hay foto)
  const avatarUrl = usuario.foto_url || `https://api.dicebear.com/8.x/bottts/svg?seed=${usuario.correo}`;

  return (
    <div className="profile-page-akademic">
      <div className="profile-card">
        
        {/* --- CABECERA (Muestra info del usuario) --- */}
        <header className="profile-header">
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="profile-avatar" 
          />
          <div className="profile-header-info">
            <h2>{usuario.nombre}</h2>
            <RoleBadge 
              rol={usuario.rol} 
              estadoVerificacion={usuario.estado_verificacion} 
            />
          </div>
          
          {/* Botón de Editar (solo visible si no estamos en 'seguridad') */}
          {activeTab === 'perfil' && (
            <button 
              className="btn btn-secondary profile-edit-button" 
              onClick={toggleEditMode}
              title={isEditing ? "Cancelar Edición" : "Editar Perfil"}
            >
              {isEditing ? <FaTimes /> : <FaEdit />}
            </button>
          )}
        </header>

        {/* --- NAVEGACIÓN DE PESTAÑAS --- */}
        <nav className="profile-tabs">
          <button 
            className={activeTab === 'perfil' ? 'active' : ''}
            onClick={() => setActiveTab('perfil')}
          >
            <FaUser /> Perfil
          </button>
          <button 
            className={activeTab === 'seguridad' ? 'active' : ''}
            onClick={() => {
              setActiveTab('seguridad');
              setIsEditing(false); // Desactiva edición si cambiamos a seguridad
            }}
          >
            <FaShieldAlt /> Seguridad
          </button>
        </nav>

        {/* --- CONTENIDO DE PESTAÑAS --- */}
        <div className="tab-content">
          
          {/* Contenido de la Pestaña "Perfil" */}
          {activeTab === 'perfil' && (
            <>
              {isEditing ? (
                // ⚠️ CORRECCIÓN CLAVE 2: Pasar 'authToken' al formulario
                <EditProfileForm 
                  usuario={usuario} 
                  token={authToken} 
                  onSaveSuccess={handleSaveSuccess}
                  onCancel={toggleEditMode} // Pasa la función de cancelar
                />
              ) : (
                <ViewProfileDetails usuario={usuario} />
              )}
            </>
          )}

          {/* Contenido de la Pestaña "Seguridad" */}
          {activeTab === 'seguridad' && (
            // ⚠️ CORRECCIÓN CLAVE 3: Pasar 'authToken' al formulario
            <ChangePasswordForm token={authToken} />
          )}
          
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;