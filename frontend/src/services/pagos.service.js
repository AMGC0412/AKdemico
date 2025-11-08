import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1/pagos';
const getToken = () => localStorage.getItem('authToken');

/**
 * Llama a la API para subir el comprobante de pago.
 * Envía los datos como FormData.
 * @param {string|number} inscripcionId - ID de la inscripción asociada.
 * @param {FormData} formData - Objeto FormData que contiene el archivo ('comprobante').
 * @returns {Promise<object>} - Promesa que resuelve con la respuesta del backend.
 */
export const subirComprobante = async (inscripcionId, formData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/upload/${inscripcionId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Importante: No establecer 'Content-Type', axios lo hace por nosotros con FormData
      }
    });
    return response.data; // Devuelve { mensaje: "Comprobante subido..." }
  } catch (error) {
    console.error(`Error al subir comprobante para inscripción ${inscripcionId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Error de red al subir el comprobante.');
  }
};

export const obtenerEstadoPagoPorInscripcion = async (inscripcionId) => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/estado/inscripcion/${inscripcionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error(`Error al obtener estado pago insc ${inscripcionId}:`, error.response?.data || error.message);
    // Devolvemos que no existe pago en caso de error
    return { existePago: false };
  }
};

/**
 * Llama a la API para obtener la lista de pagos pendientes del docente.
 * @returns {Promise<Array>}
 */
export const obtenerPagosPendientes = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/pendientes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener lista de pagos pendientes:", error.response?.data || error.message);
    throw error.response?.data || new Error('Error de red');
  }
};

// --- --- --- --- --- --- --- --- --- --- ---
// --- ¡FUNCIÓN AÑADIDA PARA CORREGIR EL ERROR! ---
// --- --- --- --- --- --- --- --- --- --- ---

/**
 * Llama a la API para que el docente valide o rechace un pago.
 * (Esta es la función que faltaba)
 * @param {string|number} pagoId - El ID del pago a procesar.
 * @param {object} data - Un objeto con { estado: 'validado' | 'rechazado', observacion: '...' }
 * @returns {Promise<object>}
 */
export const validarPago = async (pagoId, data) => {
  try {
    const token = getToken();
    // Asumiendo un endpoint PUT para validar (basado en el resumen del proyecto)
    // Ej: PUT /api/v1/pagos/validate/:pagoId
    const response = await axios.put(`${API_URL}/validate/${pagoId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data; // Devuelve { mensaje: "Pago validado..." }
  } catch (error) {
    console.error(`Error al validar el pago ${pagoId}:`, error.response?.data || error.message);
    // Re-lanzamos el error con el mensaje de la API
    throw error.response?.data || new Error('Error de red al validar el pago.');
  }
};

// Aquí podríamos añadir la función para que el DOCENTE valide (si la separamos de este archivo)