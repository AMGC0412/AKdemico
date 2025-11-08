import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Guardia de ruta anidado.
 * Se asume que este componente se usa DENTRO de <RutaProtegida>,
 * por lo que no es necesario chequear 'loading' o si 'usuario' es nulo,
 * solo se chequea el ROL.
 */
const RutaAdmin = () => {
  const { usuario } = useAuth();

  // Si el usuario NO es administrador, lo redirigimos a la página de inicio.
  if (usuario.rol !== 'administrador') {
    return <Navigate to="/" replace />;
  }

  // Si es administrador, le permitimos ver el contenido (el layout de admin)
  return <Outlet />;
};

export default RutaAdmin;