import bcrypt from 'bcryptjs';

/**
 * Hashea una contraseña en texto plano.
 * @param {string} passwordPlana - La contraseña del usuario.
 * @returns {Promise<string>} - La contraseña hasheada.
 */
export const hashearPassword = async (passwordPlana) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(passwordPlana, salt);
};

/**
 * Compara una contraseña plana con una hasheada.
 * @param {string} passwordPlana - La contraseña ingresada por el usuario.
 * @param {string} passwordHasheada - La contraseña guardada en la BD.
 * @returns {Promise<boolean>} - True si coinciden, false si no.
 */
export const compararPassword = async (passwordPlana, passwordHasheada) => {
  return bcrypt.compare(passwordPlana, passwordHasheada);
};