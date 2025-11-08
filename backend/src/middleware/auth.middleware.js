import jwt from 'jsonwebtoken';
import 'dotenv/config';

/**
 * Middleware para verificar el Token (JWT) y proteger rutas.
 */
export const protegerRuta = (req, res, next) => {
  // 1. Obtener el token del encabezado 'Authorization'
  const encabezadoAuth = req.headers.authorization;

  // 2. Verificar si el token existe
  if (!encabezadoAuth) {
    return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó token.' });
  }

  // El token viene en formato "Bearer [token]"
  // Lo separamos para quedarnos solo con el token
  const token = encabezadoAuth.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado. Formato de token inválido.' });
  }

  try {
    // 3. Verificar si el token es válido
    const claveSecreta = process.env.JWT_SECRET;
    const payload = jwt.verify(token, claveSecreta);

    // 4. Si es válido, adjuntamos los datos del usuario (el payload)
    // a la petición (req) para que las futuras funciones lo puedan usar.
    req.usuario = payload; // ej: req.usuario.id, req.usuario.rol

    // 5. ¡Pase! Le damos permiso para continuar a la siguiente función
    next();

  } catch (error) {
    // Si jwt.verify falla (token expirado, firma inválida)
    console.error('Error de token:', error.message);
    return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
};