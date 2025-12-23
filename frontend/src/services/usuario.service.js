/* Archivo: src/services/usuario.service.js */
import axios from 'axios';

// La URL base coincide con tu archivo original
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
 * Llama a la ruta /me
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
 * Llama a la ruta /me
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
 * Llama a la ruta /cambiar-contrasena
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

/**
 * -----------------------------------------------------------------
 * [NUEVA FUNCIÓN - LA QUE FALTABA]
 * -----------------------------------------------------------------
 * Obtiene el perfil PÚBLICO de un usuario por su ID.
 * Esta ruta es pública y no requiere token.
 */
export const obtenerPerfilPublicoPorId = async (userId) => {
  try {
    // Llama a GET /api/v1/users/:userId/publico
    // No usamos setAuthToken() porque es una ruta pública
    const response = await apiClient.get(`/${userId}/publico`); 
    return response.data;
  } catch (error) {
    console.error('Error al obtener el perfil público:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};