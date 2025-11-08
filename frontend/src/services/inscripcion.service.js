import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1/inscripciones';
const getToken = () => localStorage.getItem('authToken'); // Asumiendo que guardas el token aquí

/**
 * Llama a la API para inscribir al estudiante actual en un lote.
 * @param {string|number} loteId - El ID del lote al que se inscribe.
 * @returns {Promise<object>} - Promesa que resuelve con la respuesta del backend.
 */
export const inscribirseEnLote = async (loteId) => {
  try {
    const token = getToken();
    // La URL incluye el loteId al final
    const response = await axios.post(`${API_URL}/lote/${loteId}`, 
      {}, // El cuerpo de la petición está vacío, el ID va en la URL
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data; // Devuelve { mensaje: "¡Inscripción exitosa!..." }
  } catch (error) {
    console.error(`Error al inscribirse en el lote ${loteId}:`, error.response?.data || error.message);
    // Relanzamos el error para que el componente lo maneje (ej. mostrar mensaje específico)
    throw error.response?.data || new Error('Error de red al intentar inscribirse.'); 
  }
};

/**
 * Llama a la API para verificar el estado de inscripción del usuario actual en un lote.
 * @param {string|number} loteId - El ID del lote a verificar.
 * @returns {Promise<object>} - Promesa que resuelve a { estaInscrito: boolean, estado: string|null }.
 */
export const obtenerMiEstadoInscripcionEnLote = async (loteId) => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/mi-estado/lote/${loteId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    // Si da 404 o 500, asumimos que no está inscrito o hay error
    console.error(`Error al verificar estado en lote ${loteId}:`, error.response?.data || error.message);
    // Devolvemos un estado 'no inscrito' en caso de error para no bloquear la UI
    return { estaInscrito: false, estado: null }; 
  }
};

/**
 * Llama a la API para cancelar la inscripción del estudiante actual.
 * @param {string|number} inscripcionId - El ID de la inscripción a cancelar.
 * @returns {Promise<object>} - Promesa que resuelve con la respuesta del backend.
 */
export const cancelarInscripcion = async (inscripcionId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_URL}/${inscripcionId}`, { // Usa el método DELETE
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data; // Devuelve { mensaje: "Inscripción cancelada..." }
  } catch (error) {
    console.error(`Error al cancelar inscripción ${inscripcionId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Error de red al intentar cancelar.');
  }
};

// Podríamos añadir funciones aquí para obtener "Mis Inscripciones", cancelar, etc.