import axios from 'axios';

// La URL base de tu API backend
const API_URL = 'http://localhost:4000/api/v1/auth'; 

/**
 * Llama al endpoint de Login del backend.
 * @returns {Promise<object>} Token y datos del usuario.
 */
export const login = async (correo, contrasena) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      correo,
      contrasena,
    });
    return response.data; 
  } catch (error) {
    console.error("Error en servicio de login:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * [NUEVA FUNCIÓN] Registro Unificado para AKdémico.
 * Reemplaza las funciones individuales para permitir la selección de múltiples roles
 * y el envío del campo ciudad según la nueva base de datos.
 * @param {Object} userData - Objeto con { nombre, correo, contrasena, ciudad, roles: [] }.
 */
export const registerUnified = async (userData) => {
    try {
        // Envía el objeto completo al endpoint /register
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data; 
    } catch (error) {
        console.error("Error en servicio de registro unificado:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Llama al endpoint de Registro (Admin) del backend.
 * Se mantiene independiente por el uso de la clave secreta de seguridad.
 */
export const registerAdmin = async (nombre, correo, contrasena, adminSecret) => {
    try {
        const response = await axios.post(`${API_URL}/register-admin`, {
            nombre,
            correo,
            contrasena,
            adminSecret
        });
        return response.data; 
    } catch (error) {
        console.error("Error en servicio de registro (admin):", error.response?.data || error.message);
        throw error;
    }
};

export const updateUserRoles = async (userId, nuevosRoles) => {
  // nuevosRoles debe ser un Array enviado como { nuevosRoles: [...] }
  const response = await api.put(`/usuarios/${userId}/roles`, { nuevosRoles }); 
  return response.data;
}