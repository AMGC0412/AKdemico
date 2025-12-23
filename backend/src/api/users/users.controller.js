/* Archivo: users.controller.js */
import { query } from '../../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * [FILTRO] Evita que la contraseña hasheada se envíe al frontend.
 */
const filtrarDatosSeguros = (usuario) => {
  if (!usuario) return undefined;
  const { contrasena, ...datosSeguros } = usuario;
  return datosSeguros;
};

/**
 * Obtiene el ID del token y lo FUERZA a ser un NÚMERO.
 */
const getUsuarioIdFromRequest = (req) => {
    const id = req.usuario?.id;
    return id ? parseInt(id, 10) : null; 
}

// Auxiliar para manejar resultados de query
const getRowsFromResult = (resultado) => {
    if (Array.isArray(resultado) && resultado.length === 2 && Array.isArray(resultado[0])) {
      return resultado[0];
    }
    return resultado;
}

/**
 * [ACTUALIZADO] Obtiene el perfil con sus ROLES desde la tabla intermedia.
 */
export const obtenerMiPerfil = async (req, res) => {
  const usuarioId = getUsuarioIdFromRequest(req); 

  if (!usuarioId) {
      return res.status(400).json({ mensaje: "Token inválido." });
  }

  try {
    const sql = `
      SELECT 
        u.id, u.nombre, u.correo, u.biografia, u.foto_url, u.ciudad, u.estado_verificacion,
        GROUP_CONCAT(r.nombre) as roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    
    let resultado = await query(sql, [usuarioId]);
    const rows = getRowsFromResult(resultado);
    const usuario = rows[0];

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' }); 
    }

    res.status(200).json(usuario);
    
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Actualiza el perfil del usuario.
 * No modifica roles, ya que eso es potestad del Admin.
 */
export const actualizarMiPerfil = async (req, res) => {
  const usuarioId = getUsuarioIdFromRequest(req);
  const { nombre, biografia, ciudad, foto_url } = req.body;

  if (!nombre || nombre.trim() === '') {
     return res.status(400).json({ message: "El nombre es obligatorio" });
  }

  try {
    await query(
      "UPDATE usuarios SET nombre = ?, biografia = ?, ciudad = ?, foto_url = ? WHERE id = ?",
      [nombre || null, biografia || null, ciudad || null, foto_url || null, usuarioId]
    );

    // Volvemos a consultar para devolver el usuario actualizado con sus roles
    const sqlSelect = `
      SELECT u.*, GROUP_CONCAT(r.nombre) as roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    let resultado = await query(sqlSelect, [usuarioId]);
    const rows = getRowsFromResult(resultado);
    const usuarioActualizado = rows[0];

    res.json({
        message: "Perfil actualizado con éxito",
        usuario: filtrarDatosSeguros(usuarioActualizado)
    });

  } catch (error) {
    res.status(500).json({ message: "Error interno al actualizar el perfil" });
  }
};

/**
 * Cambia la contraseña del usuario.
 */
export const cambiarMiContrasena = async (req, res) => {
  const usuarioId = getUsuarioIdFromRequest(req);
  const { contrasena_actual, contrasena_nueva } = req.body;

  if (!contrasena_actual || !contrasena_nueva || contrasena_nueva.length < 6) {
    return res.status(400).json({ message: "Datos incompletos o contraseña muy corta." });
  }

  try {
    let resultado = await query("SELECT contrasena FROM usuarios WHERE id = ?", [usuarioId]);
    const rows = getRowsFromResult(resultado);

    if (rows.length === 0) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const esCorrecta = await bcrypt.compare(contrasena_actual, rows[0].contrasena);
    if (!esCorrecta) return res.status(400).json({ mensaje: "La contraseña actual es incorrecta" });

    const nuevoHash = await bcrypt.hash(contrasena_nueva, 10); 
    await query("UPDATE usuarios SET contrasena = ? WHERE id = ?", [nuevoHash, usuarioId]);

    res.json({ message: "Contraseña actualizada con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error interno al cambiar la contraseña" });
  }
};

/**
 * [ACTUALIZADO] Obtiene el perfil PÚBLICO validando roles permitidos.
 */
export const obtenerPerfilPublicoPorId = async (req, res) => {
  const usuarioId = parseInt(req.params.userId, 10);

  if (isNaN(usuarioId)) return res.status(400).json({ mensaje: "ID inválido." });

  try {
    const sql = `
      SELECT 
        u.id, u.nombre, u.biografia, u.foto_url, u.ciudad, u.estado_verificacion,
        GROUP_CONCAT(r.nombre) as roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
      HAVING roles LIKE '%docente%' OR roles LIKE '%estudiante%'
    `;
    
    let resultado = await query(sql, [usuarioId]);
    const rows = getRowsFromResult(resultado);
    const usuario = rows[0];

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado o perfil privado.' }); 
    }

    // Mejora: Calificación promedio si es docente
    if (usuario.roles && usuario.roles.includes('docente')) {
        const calResult = await query(
            `SELECT AVG(calificacion) AS promedio FROM resenas WHERE docente_id = ?`,
            [usuario.id]
        );
        const calRows = getRowsFromResult(calResult);
        usuario.calificacion_promedio = calRows[0]?.promedio || 0;
    }

    res.status(200).json(usuario);
    
  } catch (error) {
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};