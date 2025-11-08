import jwt from 'jsonwebtoken';
import 'dotenv/config'; // Para leer el JWT_SECRET

/**
 * Genera un JSON Web Token (JWT) para un usuario.
 * @param {object} usuario - El objeto del usuario de la base de datos (id, rol, nombre).
 * @returns {string} - El token firmado.
 */
export const generarToken = (usuario) => {
  // El 'payload' es la información que guardamos dentro del token.
  // NUNCA guardes contraseñas aquí.
  const payload = {
    id: usuario.id,
    rol: usuario.rol,
    nombre: usuario.nombre
  };

  const claveSecreta = process.env.JWT_SECRET;

  // El token expirará en 1 hora (NFR-02)
  return jwt.sign(payload, claveSecreta, { expiresIn: '1h' });
};