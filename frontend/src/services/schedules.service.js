import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1/schedules'; 
const getToken = () => localStorage.getItem('authToken');

/**
 * Obtiene la disponibilidad semanal actual del docente.
 */
export const obtenerDisponibilidad = async () => {
    try {
        const token = getToken();
        // Llama a GET /availability
        const response = await axios.get(`${API_URL}/availability`, { 
             headers: { Authorization: `Bearer ${token}` }
        });
        // El backend devuelve [] si no hay horarios
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
             return [];
        }
        console.error("Error al obtener disponibilidad:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};

/**
 * Actualiza la disponibilidad semanal del docente (reemplazo completo).
 * @param {object} disponibilidadData - { bloques: [{ dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '11:00:00' }] }
 */
export const actualizarDisponibilidad = async (disponibilidadData) => {
    try {
        const token = getToken();
        // Usamos POST /availability
        const response = await axios.post(`${API_URL}/availability`, disponibilidadData, {
             headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Error al actualizar disponibilidad:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};