import { query } from '../../config/database.js';
import { hashearPassword } from '../../utils/password.utils.js';
import { compararPassword } from '../../utils/password.utils.js';
import { generarToken } from '../../utils/jwt.utils.js';

/**
 * Controlador para registrar un nuevo usuario (estudiante).
 */
export const registrarEstudiante = async (req, res) => {
  // 1. Obtenemos los datos del cuerpo de la petición
  const { nombre, correo, contrasena } = req.body;

  // 2. Validación básica (en un proyecto real, esto sería más robusto)
  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  try {
    // 3. Verificamos si el correo ya existe
    const [usuarioExistente] = await query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado.' });
    }

    // 4. Hasheamos la contraseña (US-01 / NFR-01)
    const contrasenaHasheada = await hashearPassword(contrasena);

    // 5. Creamos el nuevo usuario en la BD con rol 'estudiante'
    const sql = `
      INSERT INTO usuarios (nombre, correo, contrasena, rol, estado_verificacion)
      VALUES (?, ?, ?, 'estudiante', 'no_aplica')
    `;
    
    const resultado = await query(sql, [nombre, correo, contrasenaHasheada]);

    // 6. Respondemos con éxito
    res.status(201).json({ 
      mensaje: 'Usuario registrado exitosamente.',
      usuarioId: resultado.insertId 
    });

  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para iniciar sesión (Login).
 */
export const iniciarSesion = async (req, res) => {
  const { correo, contrasena } = req.body;

  // 1. Validación básica
  if (!correo || !contrasena) {
    return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios.' });
  }

  try {
    // 2. Buscar al usuario por correo en la BD
    const sql = 'SELECT * FROM usuarios WHERE correo = ?';
    const [usuario] = await query(sql, [correo]);

    // 3. Si el usuario no existe, enviar error
    if (!usuario) {
      // Usamos un mensaje genérico por seguridad
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    // 4. Comparar la contraseña ingresada con la hasheada de la BD
    const contrasenaValida = await compararPassword(contrasena, usuario.contrasena);

    // 5. Si la contraseña no coincide, enviar error
    if (!contrasenaValida) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    // 6. ¡Éxito! Generar el token (JWT)
    console.log('ID de usuario obtenido de la DB:', usuario.id);
    const token = generarToken(usuario);

    // 7. Enviar el token al cliente
    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso.',
      token: token
    });

  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para registrar un nuevo DOCENTE.
 */
export const registrarDocente = async (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  try {
    const [usuarioExistente] = await query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado.' });
    }

    const contrasenaHasheada = await hashearPassword(contrasena);

    // --- LA ÚNICA DIFERENCIA ESTÁ AQUÍ ---
    // Rol: 'docente'
    // Estado Verificación: 'no_aplica' (aún no ha postulado)
    const sql = `
      INSERT INTO usuarios (nombre, correo, contrasena, rol, estado_verificacion)
      VALUES (?, ?, ?, 'docente', 'no_aplica')
    `;
    // ------------------------------------
    
    const resultado = await query(sql, [nombre, correo, contrasenaHasheada]);

    res.status(201).json({ 
      mensaje: 'Docente registrado exitosamente.',
      usuarioId: resultado.insertId 
    });

  } catch (error) {
    console.error('Error en el registro de docente:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para registrar un nuevo ADMINISTRADOR.
 * Requiere una clave secreta.
 */
export const registerAdmin = async (req, res) => {
  // 1. Obtenemos los datos, incluida la clave secreta
  const { nombre, correo, contrasena, adminSecret } = req.body;

  // 2. Verificamos la clave secreta del .env
  // (Debes crear esta variable en tu archivo .env)
  const CLAVE_SECRETA_REAL = process.env.ADMIN_SECRET_KEY;

  if (!CLAVE_SECRETA_REAL) {
      console.error('ADMIN_SECRET_KEY no está definida en el archivo .env');
      return res.status(500).json({ mensaje: 'Error de configuración del servidor.' });
  }
  
  // 3. Si la clave es incorrecta, denegamos el acceso
  if (adminSecret !== CLAVE_SECRETA_REAL) {
      return res.status(403).json({ mensaje: 'Clave secreta de administrador incorrecta.' });
  }

  // 4. Validación de campos
  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios.' });
  }

  try {
    // 5. Verificamos si el correo ya existe
    const [usuarioExistente] = await query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado.' });
    }

    // 6. Hasheamos la contraseña
    const contrasenaHasheada = await hashearPassword(contrasena);

    // 7. Creamos el nuevo usuario con rol 'administrador'
    const sql = `
      INSERT INTO usuarios (nombre, correo, contrasena, rol, estado_verificacion)
      VALUES (?, ?, ?, 'administrador', 'verificado')
    `;
    
    const resultado = await query(sql, [nombre, correo, contrasenaHasheada]);

    // 8. Respondemos con éxito
    res.status(201).json({ 
      mensaje: 'Administrador registrado exitosamente.',
      usuarioId: resultado.insertId 
    });

  } catch (error) {
    console.error('Error en el registro de admin:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};
// Aquí añadiremos 'login' y otras funciones después...