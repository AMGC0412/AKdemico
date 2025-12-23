/* Archivo: src/services/dashboard.service.js */
import axios from 'axios';

// Ajusta la URL base si es necesario (ej: /api/v1)
const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1') + '/dashboard';

const getToken = () => localStorage.getItem('authToken');

const getAuthHeaders = () => ({
    // Esta función lee el token del localStorage CADA VEZ que es llamada.
    headers: { Authorization: `Bearer ${getToken()}` } 
});

/**
 * Obtiene las estadísticas en tiempo real del docente.
 * Retorna: { alumnos_total, cursos_publicados, ingresos_mes, valoracion_promedio }
 */
export const obtenerEstadisticasDocente = async () => {
  try {
    // Aquí es donde se llama a getAuthHeaders, asegurando que se usa el token actual
    const response = await axios.get(`${API_URL}/docente-stats`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.warn("Error al obtener estadísticas del dashboard:", error.response?.data || error.message);
    // Retornamos estructura segura en caso de fallo (Offline mode)
    return {
        alumnos_total: 0,
        cursos_publicados: 0,
        ingresos_mes: 0,
        valoracion_promedio: 0
    };
  }
};