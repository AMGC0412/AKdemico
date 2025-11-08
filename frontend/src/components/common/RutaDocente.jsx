import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente "guardia" que protege rutas
 * SOLO para usuarios con rol 'docente'.
 */
const RutaDocente = () => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div>Verificando autenticación...</div>;
  }

  // 1. Si no hay usuario, redirige a login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si hay usuario PERO NO es docente, redirige a inicio
  if (usuario.rol !== 'docente') {
    return <Navigate to="/" replace />; 
  }

  // 3. Si es docente, permite el acceso
  return <Outlet />;
};

export default RutaDocente;