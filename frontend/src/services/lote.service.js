import axios from 'axios';

// La URL base de tu API backend
// (Debería estar en un archivo .env en un proyecto real)
const API_URL = 'http://localhost:4000/api/v1/lotes'; 

// Necesitaríamos obtener el token del AuthContext o localStorage
const getToken = () => localStorage.getItem('authToken'); // Ejemplo simple

/**
 * Llama a la API para buscar lotes con filtros.
 * @param {object} params - Objeto con los parámetros de búsqueda (ej. { modalidad: 'virtual', precio_max: 150 })
 * @returns {Promise<Array>} - Una promesa que resuelve a un array de lotes.
 */
export const buscarLotes = async (params = {}) => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/search`, {
      headers: {
        // En búsqueda pública, el token es opcional, pero lo mantenemos si el usuario está logueado
        ...(token && { Authorization: `Bearer ${token}` }) 
      },
      params: params // Axios convierte { modalidad: 'virtual' } en ?modalidad=virtual
    });
    return response.data; // Devuelve el array de lotes
  } catch (error) {
    console.error("Error al buscar lotes:", error.response?.data || error.message);
    throw error; // Relanzamos el error para que el componente lo maneje
  }
};

// --- [FUNCIÓN AÑADIDA Y CORREGIDA] ---

/**
 * [CORRECCIÓN] Llama a la API para obtener lotes públicos destacados para la HomePage.
 * Es un alias de buscarLotes, permitiendo la sintaxis que usa HomePage.jsx.
 * @param {object} params - Incluye limit, featured, random, etc.
 */
export const getPublicLotes = async (params = {}) => {
    // Reutilizamos la lógica principal de búsqueda, ya que maneja los filtros
    return buscarLotes(params);
};

// ------------------------------------------------

/**
 * Llama a la API para obtener los detalles de un lote específico.
 * @param {string|number} loteId - El ID del lote a buscar.
 * @returns {Promise<object>} - Una promesa que resuelve al objeto del lote.
 */
export const obtenerDetalleLotePorId = async (loteId) => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/${loteId}`, { // Llama a la nueva ruta GET con ID
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalle del lote ${loteId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Llama al endpoint de Creación de Lote (curso programado) del backend.
 * @param {object} loteData - Datos del lote (plan_id, fecha_inicio, cupos, precio, etc.)
 * @returns {Promise<object>}
 */
export const crearLoteDeCurso = async (loteData) => {
    try {
        const token = getToken();
        const response = await axios.post(API_URL, loteData, {
             headers: { Authorization: `Bearer ${token}` }
        });
        return response.data; // Devuelve { mensaje: "...", loteId: ... }
    } catch (error) {
        console.error("Error al crear el lote:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};

/**
 * Llama al endpoint de Actualización de Lote del backend.
 * @param {string|number} loteId - El ID del lote a actualizar.
 * @param {object} loteData - Datos del lote (plan_id, fecha_inicio, cupos, precio, etc.)
 * @returns {Promise<object>}
 */
export const actualizarLote = async (loteId, loteData) => {
    try {
        const token = getToken();
        const response = await axios.put(`${API_URL}/${loteId}`, loteData, {
             headers: { Authorization: `Bearer ${token}` }
        });
        return response.data; // Devuelve { mensaje: "..." }
    } catch (error) {
        console.error(`Error al actualizar el lote ${loteId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};

/**
 * FUNCIÓN NUEVA: Eliminar un Lote de Curso
 */
export const eliminarLotePorId = async (loteId) => {
    try {
        const token = getToken();
        const response = await axios.delete(`${API_URL}/${loteId}`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        return response.data; // Devuelve { mensaje: "Lote eliminado..." }
    } catch (error) {
        console.error(`Error al eliminar el lote ${loteId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};


/**
 * Llama a la API para obtener todos los Lotes (instancias de curso)
 * que están asociados a un Plan de Estudio específico.
 */
export const obtenerLotesPorPlanId = async (planId) => {
    try {
        const token = getToken();
        // Asumimos un endpoint GET /api/v1/lotes/by-plan/:planId
        const response = await axios.get(`${API_URL}/by-plan/${planId}`, { 
             headers: { Authorization: `Bearer ${token}` }
        });
        return response.data; // Devuelve la lista de lotes
    } catch (error) {
        console.error(`Error al obtener lotes por plan ${planId}:`, error.response?.data || error.message);
        throw error;
    }
};