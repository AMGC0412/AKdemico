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
 * [CORRECCIÓN CRÍTICA] Obtiene el ID del token y lo FUERZA a ser un NÚMERO.
 */
const getUsuarioIdFromRequest = (req) => {
    const id = req.usuario?.id;
    // ⚠️ CORRECCIÓN CLAVE: Asegura la consistencia de tipos con la DB (INT).
    return id ? parseInt(id, 10) : null; 
}

// Función auxiliar para manejar la respuesta de la función query de la DB
const getRowsFromResult = (resultado) => {
    // Si el resultado es el array estándar [rows, fields] de mysql2/promise, devuelve solo rows.
    if (Array.isArray(resultado) && resultado.length === 2 && Array.isArray(resultado[0])) {
      return resultado[0];
    }
    // Si la función query ya devolvió solo rows, devuelve el resultado directamente.
    return resultado;
}


// --- LÓGICA DEL PERFIL (Lectura y Modificación) ---

/**
 * Obtiene el perfil del usuario actualmente autenticado.
 */
export const obtenerMiPerfil = async (req, res) => {
  const usuarioId = getUsuarioIdFromRequest(req); 

  if (!usuarioId) {
      return res.status(400).json({ mensaje: "Token inválido: ID de usuario no encontrado en la sesión." });
  }

  try {
    const sql = `
      SELECT id, nombre, correo, rol, biografia, foto_url, ciudad, estado_verificacion 
      FROM usuarios 
      WHERE id = ?
    `;
    
    let resultado = await query(sql, [usuarioId]);
    
    const rows = getRowsFromResult(resultado);
    const usuario = rows[0];


    if (!usuario) {
      // 404: La consulta no encontró la fila (problema de entorno/DB).
      return res.status(404).json({ mensaje: 'Usuario no encontrado. Por favor, vuelva a iniciar sesión.' }); 
    }

    res.status(200).json(usuario);
    
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Actualiza el perfil del usuario (PUT /me).
 */
export const actualizarMiPerfil = async (req, res) => {
  const usuarioId = getUsuarioIdFromRequest(req);
  
  if (!usuarioId) {
    return res.status(400).json({ mensaje: "Error de autenticación: Payload de token inválido." });
  }

  const { nombre, biografia, ciudad, foto_url } = req.body;

  if (!nombre || nombre.trim() === '') {
     return res.status(400).json({ message: "El nombre es obligatorio" });
  }

  try {
    // 1. Ejecutar el UPDATE
    await query(
      "UPDATE usuarios SET nombre = ?, biografia = ?, ciudad = ?, foto_url = ? WHERE id = ?",
      [nombre || null, biografia || null, ciudad || null, foto_url || null, usuarioId]
    );

    // 2. Ejecutar SELECT para obtener datos actualizados
    let resultado = await query("SELECT * FROM usuarios WHERE id = ?", [usuarioId]);
    
    // 3. Manejo de resultado consistente
    const rows = getRowsFromResult(resultado);
    const usuarioActualizado = rows[0];

    if (!usuarioActualizado) {
         return res.status(404).json({ message: "Perfil actualizado, pero el usuario ya no existe." });
    }

    res.json({
        message: "Perfil actualizado con éxito",
        usuario: filtrarDatosSeguros(usuarioActualizado)
    });

  } catch (error) {
    console.error('Error en actualizarMiPerfil:', error);
    res.status(500).json({ message: "Error interno al actualizar el perfil" });
  }
};

/**
 * Cambia la contraseña del usuario (PUT /cambiar-contrasena).
 */
export const cambiarMiContrasena = async (req, res) => {
  const usuarioId = getUsuarioIdFromRequest(req);

  if (!usuarioId) {
    return res.status(400).json({ mensaje: "Error de autenticación: Payload de token inválido." });
  }
  
  const { contrasena_actual, contrasena_nueva } = req.body;

  if (!contrasena_actual || !contrasena_nueva || contrasena_nueva.length < 6) {
    return res.status(400).json({ message: "Datos incompletos o la nueva contraseña es muy corta (mínimo 6 caracteres)." });
  }

  try {
    // 1. Obtener contraseña actual hasheada
    let resultado = await query("SELECT contrasena FROM usuarios WHERE id = ?", [usuarioId]);
    const rows = getRowsFromResult(resultado);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    const contrasenaHasheada = rows[0].contrasena;

    // 2. Comparar contraseñas
    const esCorrecta = await bcrypt.compare(contrasena_actual, contrasenaHasheada);

    if (!esCorrecta) {
      return res.status(400).json({ mensaje: "La contraseña actual es incorrecta" });
    }

    // 3. Hashear la nueva y actualizar
    const nuevoHash = await bcrypt.hash(contrasena_nueva, 10); 

    await query(
      "UPDATE usuarios SET contrasena = ? WHERE id = ?",
      [nuevoHash, usuarioId]
    );

    res.json({ message: "Contraseña actualizada con éxito" });

  } catch (error) {
    console.error('Error en cambiarMiContrasena:', error);
    res.status(500).json({ message: "Error interno al cambiar la contraseña" });
  }
};