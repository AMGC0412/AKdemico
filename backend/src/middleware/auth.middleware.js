import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { query } from '../config/database.js'; // Asegúrate de importar tu función de query

export const protegerRuta = async (req, res, next) => {
  const encabezadoAuth = req.headers.authorization;

  if (!encabezadoAuth || !encabezadoAuth.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó token.' });
  }

  const token = encabezadoAuth.split(' ')[1];

  try {
    const claveSecreta = process.env.JWT_SECRET;
    const payload = jwt.verify(token, claveSecreta);

    // --- CORRECCIÓN CRÍTICA ---
    // Si el token es antiguo y no tiene el array 'roles', los buscamos en la DB
    if (!payload.roles) {
      const rolesRows = await query(
        `SELECT r.nombre FROM roles r 
         JOIN usuario_roles ur ON r.id = ur.rol_id 
         WHERE ur.usuario_id = ?`, 
        [payload.id]
      );
      payload.roles = rolesRows.map(row => row.nombre);
    }

    req.usuario = payload; 
    next();

  } catch (error) {
    console.error('Error de token:', error.message);
    return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
};