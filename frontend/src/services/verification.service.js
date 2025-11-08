import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1/verification';
const getToken = () => localStorage.getItem('authToken');

/**
 * Llama a la API para obtener el estado actual de verificación del docente.
 * (Backend: obtenerMiEstadoDeVerificacion)
 * @returns {Promise<object>} - Promesa que resuelve al objeto de estado.
 */
export const obtenerMiEstadoDeVerificacion = async () => {
    try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/my-status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Devuelve algo como: { estadoGeneral: 'pendiente', estadoDetallado: 'en_revision', ... }
        return response.data;
    } catch (error) {
        console.error("Error al obtener estado de verificación:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};

/**
 * Llama a la API para postular subiendo los archivos.
 * (Backend: postularParaVerificacion)
 * @param {FormData} formData - Objeto FormData con los archivos (cv, dni, titulo).
 * @returns {Promise<object>} - Promesa que resuelve con la respuesta de éxito.
 */
export const postularParaVerificacion = async (formData) => {
    try {
        const token = getToken();
        const response = await axios.post(`${API_URL}/apply`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Content-Type' es 'multipart/form-data', axios lo pone automáticamente con FormData
            }
        });
        return response.data; // Devuelve { mensaje: "Postulación enviada..." }
    } catch (error) {
        console.error("Error al postular:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};