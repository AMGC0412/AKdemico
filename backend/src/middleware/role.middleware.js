/**
 * Archivo: role.middleware.js (Versión Multi-rol)
 */

/**
 * Middleware para verificar si el usuario TIENE el rol de 'docente'.
 */
export const esDocente = (req, res, next) => {
    // Asumiendo que al loguear guardas los roles en req.usuario.roles (ej: ['estudiante', 'docente'])
    const roles = req.usuario.roles || []; 
    if (roles.includes('docente')) {
        next();
    } else {
        res.status(403).json({ mensaje: "Requiere rol de Docente." });
    }
};

/**
 * Middleware para verificar si el usuario TIENE el rol de 'administrador'.
 */
export const esAdmin = (req, res, next) => {
  if (!req.usuario.roles || !req.usuario.roles.includes('administrador')) {
    return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere capacidad de administrador.' });
  }
  next();
};

/**
 * Middleware para verificar si el usuario TIENE el rol de 'estudiante'.
 */
export const esEstudiante = (req, res, next) => {
  // Verificamos que req.usuario exista y que roles sea un array antes de usar .includes
  const roles = req.usuario?.roles || [];
  
  if (!roles.includes('estudiante')) {
    return res.status(403).json({ 
        mensaje: 'Acceso denegado. Se requiere rol de estudiante.' 
    });
  }
  next();
};