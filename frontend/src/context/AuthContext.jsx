import React, { createContext, useState, useContext, useEffect } from 'react';
// [NUEVO] Importamos el servicio que SÍ sabe cómo llamar a la API
import { getMiPerfil } from '../services/usuario.service'; 

// 1. Crear el Contexto
const AuthContext = createContext(null);

// 2. Crear el Proveedor del Contexto (Componente que envuelve la App)
export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [usuario, setUsuario] = useState(null); 
  const [loading, setLoading] = useState(true); 

  // Efecto para cargar datos del usuario si hay un token al iniciar
  useEffect(() => {
    const cargarUsuarioDesdeToken = async () => {
      if (authToken) {
        try {
          // --- [CORRECCIÓN CRÍTICA] ---
          // Usamos nuestro servicio, que ya tiene la ruta correcta ('/api/users/me').
          const datosUsuario = await getMiPerfil(authToken);
          
          setUsuario(datosUsuario); // Guardamos los datos del usuario
          // -----------------------------

        } catch (error) {
          console.error("Error al cargar usuario desde token:", error);
          // Si el token es inválido o expiró, lo limpiamos
          localStorage.removeItem('authToken');
          setAuthToken(null);
          setUsuario(null);
        }
      }
      setLoading(false); // Terminamos la carga inicial
    };

    cargarUsuarioDesdeToken();
  }, [authToken]); // Se ejecuta cada vez que el token cambia

  // Función para Iniciar Sesión
  const iniciarSesion = (tokenRecibido) => {
    localStorage.setItem('authToken', tokenRecibido); // Guarda en localStorage
    setAuthToken(tokenRecibido); // Actualiza el estado
    // El useEffect se encargará de cargar los datos del usuario
  };

  // Función para Cerrar Sesión
  const cerrarSesion = () => {
    localStorage.removeItem('authToken'); // Limpia localStorage
    setAuthToken(null); // Limpia el estado del token
    setUsuario(null); // Limia el estado del usuario
  };
  
  // Función para actualizar el usuario en el contexto (después de editar perfil)
  const actualizarUsuarioEnContexto = (nuevosDatosUsuario) => {
    setUsuario(nuevosDatosUsuario);
  };

  // El valor que compartiremos con toda la aplicación
  const value = {
    authToken,
    usuario,
    loading, 
    iniciarSesion,
    cerrarSesion,
    actualizarUsuarioEnContexto
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Crear un Hook personalizado para usar el Contexto fácilmente
export const useAuth = () => {
  return useContext(AuthContext);
};