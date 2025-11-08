import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente "guardia" para proteger rutas.
 * Si el usuario está autenticado, renderiza el contenido de la ruta anidada (Outlet).
 * Si no, redirige a la página de Login.
 */
const RutaProtegida = () => {
  const { usuario, loading } = useAuth(); // Obtiene el usuario y el estado de carga del contexto

  // Si aún estamos cargando la información del usuario (verificando el token inicial),
  // mostramos un mensaje temporal.
  if (loading) {
    return <div>Verificando autenticación...</div>;
  }

  // Si no estamos cargando y NO hay usuario, redirigimos a /login
// En RutaProtegida.jsx
  if (!usuario) {
    return <Navigate to="/auth/login" replace />; 
  }

  // Si no estamos cargando y SÍ hay usuario, mostramos el contenido de la ruta anidada
  return <Outlet />; 
  // Outlet renderiza el componente hijo definido en App.jsx para esta ruta
};

export default RutaProtegida;