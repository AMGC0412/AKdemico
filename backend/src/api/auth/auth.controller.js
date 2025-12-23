import { query } from '../../config/database.js'; // Helper de conexión
import { hashearPassword, compararPassword } from '../../utils/password.utils.js';
import { generarToken } from '../../utils/jwt.utils.js';

/**
 * REGISTRO UNIFICADO: Procesa múltiples roles y el campo ciudad.
 */
export const register = async (req, res) => {
  const { nombre, correo, contrasena, ciudad, roles } = req.body; 

  // Validación de campos obligatorios
  if (!nombre || !correo || !contrasena || !roles || roles.length === 0) {
    return res.status(400).json({ mensaje: 'Nombre, correo, contraseña y roles son requeridos.' });
  }

  try {
    // Verificar si el usuario ya existe
    const [usuarioExistente] = await query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado.' });
    }

    // Encriptación de seguridad
    const contrasenaHasheada = await hashearPassword(contrasena);

    // 1. Insertar en la tabla 'usuarios' incluyendo el campo 'ciudad'
    const sqlUsuario = `
      INSERT INTO usuarios (nombre, correo, contrasena, ciudad, estado_verificacion)
      VALUES (?, ?, ?, ?, 'no_aplica')
    `;
    const resultado = await query(sqlUsuario, [nombre, correo, contrasenaHasheada, ciudad || null]);
    const usuarioId = resultado.insertId;

    // 2. Asignación dinámica de roles en la tabla intermedia 'usuario_roles'
    for (const rolNombre of roles) {
        await query(
            "INSERT INTO usuario_roles (usuario_id, rol_id) SELECT ?, id FROM roles WHERE nombre = ?",
            [usuarioId, rolNombre]
        );
    }

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente.', usuarioId });

  } catch (error) {
    console.error('Error en el registro unificado:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * INICIO DE SESIÓN: Extrae al usuario con todos sus roles asignados.
 */
export const iniciarSesion = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    // Consulta con JOIN para obtener roles concatenados por coma
    const sql = `
      SELECT u.*, GROUP_CONCAT(r.nombre) as roles 
      FROM usuarios u 
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id 
      LEFT JOIN roles r ON ur.rol_id = r.id 
      WHERE u.correo = ? 
      GROUP BY u.id
    `;
    const [usuario] = await query(sql, [correo]);

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    // Validación de password
    const contrasenaValida = await compararPassword(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    // Generar token incluyendo la cadena de roles
    const token = generarToken(usuario);

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso.',
      token: token,
      usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          roles: usuario.roles ? usuario.roles.split(',') : [] // Devuelve roles como array
      }
    });

  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * REGISTRO DE ADMINISTRADOR: Mantiene el uso de clave secreta.
 */
export const registerAdmin = async (req, res) => {
  const { nombre, correo, contrasena, adminSecret } = req.body;
  const CLAVE_SECRETA_REAL = process.env.ADMIN_SECRET_KEY;

  if (adminSecret !== CLAVE_SECRETA_REAL) {
    return res.status(403).json({ mensaje: 'Clave secreta incorrecta.' });
  }

  try {
    const contrasenaHasheada = await hashearPassword(contrasena);
    const sqlUsuario = `INSERT INTO usuarios (nombre, correo, contrasena, estado_verificacion) VALUES (?, ?, ?, 'verificado')`;
    const resultado = await query(sqlUsuario, [nombre, correo, contrasenaHasheada]);

    await query(
      "INSERT INTO usuario_roles (usuario_id, rol_id) SELECT ?, id FROM roles WHERE nombre = 'administrador'",
      [resultado.insertId]
    );

    res.status(201).json({ mensaje: 'Administrador registrado con éxito.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en registro de administrador.' });
  }
};