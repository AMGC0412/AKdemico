import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// RutaDocente.jsx (Versión Corregida)
const RutaDocente = () => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div>Verificando autenticación...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // [CAMBIO APLICADO] Verificación multi-rol para docentes
  if (!usuario.roles || !usuario.roles.includes('docente')) {
      return <Navigate to="/" replace />; 
  }

  return <Outlet />;
};

export default RutaDocente;