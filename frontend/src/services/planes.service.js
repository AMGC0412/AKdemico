import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1/planes';
const getToken = () => localStorage.getItem('authToken');

/**
 * Obtiene todos los planes y sus lotes anidados para el docente logueado.
 */
export const obtenerMisPlanesConLotes = async () => {
    try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/mis-planes`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data; // Devuelve [ { ...plan, lotes: [...] }, ... ]
    } catch (error) {
        console.error("Error al obtener planes y lotes:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};

/**
 * Crea un nuevo plan de estudio.
 * (La crearemos aquí aunque el formulario se haga después)
 */
export const crearPlanDeEstudio = async (planData) => {
    try {
        const token = getToken();
        const response = await axios.post(API_URL, planData, {
             headers: { Authorization: `Bearer ${token}` }
        });
        return response.data; // Devuelve { mensaje: "...", planId: ... }
    } catch (error) {
        console.error("Error al crear plan:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};

/**
 * Obtiene los datos de un plan de estudio específico por su ID.
 * @param {string|number} planId
 * @returns {Promise<object>}
 */
export const obtenerPlanPorId = async (planId) => {
    try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/${planId}`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        return response.data; // Devuelve el objeto del plan
    } catch (error) {
        console.error("Error al obtener plan por ID:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};

/**
 * Actualiza un plan de estudio existente.
 * @param {string|number} planId
 * @param {object} planData - Datos del plan (titulo, descripcion, etc.)
 * @returns {Promise<object>}
 */
export const actualizarPlan = async (planId, planData) => {
    try {
        const token = getToken();
        const response = await axios.put(`${API_URL}/${planId}`, planData, {
             headers: { Authorization: `Bearer ${token}` }
        });
        return response.data; // Devuelve { mensaje: "..." }
    } catch (error) {
        console.error("Error al actualizar plan:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error de red');
    }
};