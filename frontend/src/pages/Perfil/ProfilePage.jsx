/* Archivo: ProfilePage.jsx */
/* [REESTRUCTURADO] Ahora maneja perfiles públicos y privados */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // <-- [NUEVO] Para leer la URL
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css'; 
import { FaEdit, FaTimes, FaUser, FaShieldAlt, FaSpinner } from 'react-icons/fa';

// [NUEVO] Debes crear esta función en tu 'usuario.service.js'
import { obtenerPerfilPublicoPorId } from '../../services/usuario.service'; 

// Importa los sub-componentes (sin cambios)
import RoleBadge from './RoleBadge';
import ViewProfileDetails from './ViewProfileDetails';
import EditProfileForm from './EditProfileForm';
import ChangePasswordForm from './ChangePasswordForm';

const ProfilePage = () => {
  // --- [NUEVA LÓGICA] ---
  // 'usuarioLogueado' es QUIÉN ESTÁ VIENDO la página
  const { usuario: usuarioLogueado, authToken, actualizarUsuarioEnContexto } = useAuth();
  // 'userId' es el ID del perfil que QUEREMOS VER (de la URL)
  const { userId } = useParams(); 
  
  // 'usuarioDelPerfil' es el estado para guardar los datos del perfil que estamos viendo
  const [usuarioDelPerfil, setUsuarioDelPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 'esPropietario' es la clave de tu solicitud
  const [esPropietario, setEsPropietario] = useState(false);
  // -------------------------

  const [activeTab, setActiveTab] = useState('perfil');
  const [isEditing, setIsEditing] = useState(false);
  
  // --- [NUEVA LÓGICA] Cargar datos del perfil según la URL ---
  useEffect(() => {
    const cargarPerfil = async () => {
      setLoading(true);
      setError(null);
      setIsEditing(false); // Resetea el modo edición al cambiar de perfil
      setActiveTab('perfil'); // Resetea a la pestaña principal

      // 1. Determinar si somos propietarios
      // Comparamos el ID del logueado con el ID de la URL
      const idNumerico = Number(userId);
      const propietario = usuarioLogueado && usuarioLogueado.id === idNumerico;
      setEsPropietario(propietario);

      // 2. Obtener los datos del perfil
      try {
        let perfilData;
        if (propietario) {
          // Si soy yo, uso los datos seguros de mi contexto
          perfilData = usuarioLogueado;
        } else {
          // Si es otro, llamo a la API pública
          // ⚠️ NECESITAS CREAR ESTA RUTA Y CONTROLADOR EN EL BACKEND
          // (ej: GET /api/v1/usuarios/:id/publico)
          perfilData = await obtenerPerfilPublicoPorId(userId);
        }
        setUsuarioDelPerfil(perfilData);
      } catch (err) {
        setError("No se pudo cargar el perfil. Es posible que el usuario no exista.");
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
    
    // Se ejecuta cada vez que el ID de la URL cambia o el usuario logueado cambia
  }, [userId, usuarioLogueado]); 
  // ----------------------------------------------------

  // Activa o desactiva el modo edición (sin cambios)
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setActiveTab('perfil'); 
  };
  
  // Callback de guardado (sin cambios)
  const handleSaveSuccess = (usuarioActualizado) => {
    if (actualizarUsuarioEnContexto) {
        actualizarUsuarioEnContexto(usuarioActualizado);
    }
    setUsuarioDelPerfil(usuarioActualizado); // [AÑADIDO] Actualiza también el perfil local
    setIsEditing(false); 
  };

  // --- Renderizado de Carga y Error ---
  if (loading) {
    return (
      <div className="profile-page-akademic">
        <div className="profile-card">
          <div style={{padding: '4rem', textAlign: 'center', color: 'var(--local-cyan)'}}>
            <FaSpinner className="fa-spin" size="3em" />
            <p style={{marginTop: '1rem', fontFamily: 'var(--font-tech)'}}>ACCEDIENDO A LA BASE DE DATOS...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !usuarioDelPerfil) {
     return (
      <div className="profile-page-akademic">
        <div className="profile-card">
          <div style={{padding: '4rem', textAlign: 'center'}}>
            <h3 style={{color: 'var(--local-red)', fontSize: '2rem', fontFamily: 'var(--font-tech)'}}>ERROR DE ACCESO</h3>
            <p style={{color: 'var(--local-text-dim)'}}>{error || "Identidad no encontrada en el sistema."}</p>
          </div>
        </div>
      </div>
    );
  }
  // ------------------------------------

  const avatarUrl = usuarioDelPerfil.foto_url || `https://api.dicebear.com/8.x/bottts/svg?seed=${usuarioDelPerfil.correo}`;

  return (
    <div className="profile-page-akademic">
      <div className="profile-card">
        
        <header className="profile-header">
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="profile-avatar" 
          />
          <div className="profile-header-info">
            {/* [MODIFICADO] Usa los datos del perfil cargado */}
            <h2>{usuarioDelPerfil.nombre}</h2>
            <RoleBadge 
              rol={usuarioDelPerfil.rol} 
              estadoVerificacion={usuarioDelPerfil.estado_verificacion} 
            />
          </div>
          
          {/* --- [LÓGICA DE PERMISOS] ---
              Solo muestra el botón de editar si:
              1. El usuario es propietario
              2. La pestaña activa es 'perfil'
          */}
          {esPropietario && activeTab === 'perfil' && (
            <button 
              className="profile-edit-button" 
              onClick={toggleEditMode}
              title={isEditing ? "Cancelar Edición" : "Editar Perfil"}
            >
              {isEditing ? <FaTimes size="1.2em"/> : <FaEdit size="1.2em"/>}
            </button>
          )}
        </header>

        <nav className="profile-tabs">
          <button 
            className={activeTab === 'perfil' ? 'active' : ''}
            onClick={() => setActiveTab('perfil')}
          >
            <FaUser /> Datos de Identidad
          </button>

          {/* --- [LÓGICA DE PERMISOS] ---
              Solo muestra la pestaña "Seguridad" si eres el propietario
          */}
          {esPropietario && (
            <button 
              className={activeTab === 'seguridad' ? 'active' : ''}
              onClick={() => {
                setActiveTab('seguridad');
                setIsEditing(false); 
              }}
            >
              <FaShieldAlt /> Credenciales
            </button>
          )}
        </nav>

        <div className="tab-content">
          
          {activeTab === 'perfil' && (
            <>
              {/* --- [LÓGICA DE PERMISOS] ---
                  Muestra el formulario de edición SOLO si 'isEditing' es true
                  Y 'esPropietario' es true.
                  De lo contrario, SIEMPRE muestra los detalles.
              */}
              {(isEditing && esPropietario) ? (
                <EditProfileForm 
                  usuario={usuarioDelPerfil} 
                  token={authToken} 
                  onSaveSuccess={handleSaveSuccess}
                  onCancel={toggleEditMode}
                />
              ) : (
                <ViewProfileDetails 
                  usuario={usuarioDelPerfil} 
                  esPropietario={esPropietario} // Pasa el permiso al componente hijo
                />
              )}
            </>
          )}

          {/* --- [LÓGICA DE PERMISOS] ---
              El contenido de seguridad solo se renderiza si la pestaña
              está activa Y eres el propietario.
          */}
          {activeTab === 'seguridad' && esPropietario && (
            <ChangePasswordForm token={authToken} />
          )}
          
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;