/**
 * Middleware para verificar si el usuario tiene el rol de 'docente'.
 * Debe usarse SIEMPRE DESPUÉS de 'protegerRuta'.
 */
export const esDocente = (req, res, next) => {
  // 'protegerRuta' ya puso 'req.usuario'
  if (req.usuario.rol !== 'docente') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol de docente.' });
  }
  // Si es docente, ¡pase!
  next();
};

/**
 * Middleware para verificar si el usuario tiene el rol de 'administrador'.
 * (Lo usaremos más adelante)
 */
export const esAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

/**
 * Middleware para verificar si el usuario tiene el rol de 'estudiante'.
 * Debe usarse SIEMPRE DESPUÉS de 'protegerRuta'.
 */
export const esEstudiante = (req, res, next) => {
  // 'protegerRuta' ya puso 'req.usuario'
  if (req.usuario.rol !== 'estudiante') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol de estudiante.' });
  }
  // Si es estudiante, ¡pase!
  next();
};