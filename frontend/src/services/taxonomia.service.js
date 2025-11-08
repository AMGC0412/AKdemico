import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1/taxonomia'; 
const getToken = () => localStorage.getItem('authToken'); // Asumiendo que guardas el token aquí

/**
 * Obtiene todas las taxonomías (materias y niveles).
 * @returns {Promise<object>} - Promesa que resuelve a { materias: [...], niveles: [...] }
 */
export const obtenerTodasTaxonomias = async () => {
  try {
    const token = getToken();
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener taxonomías:", error.response?.data || error.message);
    throw error;
  }
};