import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const RutaAdmin = () => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div>Verificando autenticación...</div>;
  }

  // [CORRECCIÓN] Cambiamos 'usuario.rol' por '.includes' sobre el array de roles
  if (!usuario || !usuario.roles || !usuario.roles.includes('administrador')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RutaAdmin;