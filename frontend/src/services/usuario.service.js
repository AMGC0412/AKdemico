import axios from 'axios';

// [CORREGIDO] Añadimos /v1/ para que coincida con AuthContext.jsx
const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') + '/v1/users';

const apiClient = axios.create({
  baseURL: API_URL,
});

const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Obtiene el perfil del usuario actualmente autenticado.
 * [CORREGIDO] Llama a la ruta /me
 */
export const getMiPerfil = async (token) => {
  setAuthToken(token);
  try {
    const response = await apiClient.get('/me'); // Llama a GET /api/v1/users/me
    return response.data;
  } catch (error) {
    console.error('Error al obtener el perfil:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Actualiza el perfil del usuario autenticado (Implementa US-04).
 * [CORREGIDO] Llama a la ruta /me
 */
export const actualizarPerfil = async (profileData, token) => {
  setAuthToken(token);
  try {
    // Llama a PUT /api/v1/users/me
    const response = await apiClient.put('/me', profileData); 
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el perfil:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Cambia la contraseña del usuario autenticado.
 * [NUEVO] Llama a la ruta /cambiar-contrasena
 */
export const cambiarContrasena = async (passwords, token) => {
  setAuthToken(token);
  try {
    // Llama a PUT /api/v1/users/cambiar-contrasena
    const response = await apiClient.put('/cambiar-contrasena', passwords);
    return response.data;
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};