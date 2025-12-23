import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
// 1. [MODIFICADO] Asegúrate de importar 'useAuth'
import { useAuth } from '../../context/AuthContext'; 

/**
 * Componente "guardia" para proteger rutas.
 * [CORREGIDO] Ahora revisa el 'authToken' (que es inmediato) 
 * en lugar del 'usuario' (que tarda en cargar).
 */
const RutaProtegida = () => {
  // 2. [MODIFICADO] Obtenemos 'authToken' en lugar de 'usuario'
  const { authToken, loading } = useAuth(); 
  const location = useLocation();

  // Si aún estamos cargando la información del token inicial,
  // mostramos un mensaje temporal.
  if (loading) {
    return <div>Verificando autenticación...</div>;
  }

  // 3. [MODIFICADO] La comprobación ahora es sobre 'authToken'
  // Si no estamos cargando y NO hay token, redirigimos a /login
  if (!authToken) {
    // 4. [CORREGIDO] Pasamos el 'state' para recordar la ubicación
    return <Navigate to="/auth/login" state={{ from: location }} replace />; 
  }

  // Si no estamos cargando y SÍ hay token, mostramos el contenido
  return <Outlet />; 
};

export default RutaProtegida;