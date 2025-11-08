import axios from 'axios';

// URLs de las APIs
const API_URL = 'http://localhost:4000/api/v1/admin';
const TAXONOMIA_API_URL = 'http://localhost:4000/api/v1/taxonomia';

// Instancia de Axios con interceptor - CORREGIDA
const api = axios.create({
  baseURL: 'http://localhost:4000/api/v1/admin' // Añadir baseURL aquí
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); 
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Obtiene las métricas del dashboard (US-25).
 * Llama a: GET /api/v1/admin/dashboard
 */
export const getDashboardMetrics = async () => {
  try {
    const response = await api.get('/dashboard');
    return response.data;
  } catch (error) {
    console.error("Error en servicio getDashboardMetrics:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Obtiene TODAS las verificaciones (pendientes, aprobadas, etc.).
 * Llama a: GET /api/v1/admin/verificaciones
 */
export const getAllVerificaciones = async () => {
  try {
    const response = await api.get('/verificaciones');
    return response.data;
  } catch (error) {
    console.error("Error en servicio getAllVerificaciones:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Aprueba la verificación de un docente.
 * Llama a: PUT /api/v1/admin/verificaciones/:id/aprobar
 */
export const approveVerificacion = async (verificacionId, observaciones) => {
  try {
    const response = await api.put(`/verificaciones/${verificacionId}/aprobar`, { 
      observaciones: observaciones 
    });
    return response.data;
  } catch (error) {
    console.error("Error en servicio approveVerificacion:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Rechaza la verificación de un docente.
 * Llama a: PUT /api/v1/admin/verificaciones/:id/rechazar
 */
export const rejectVerificacion = async (verificacionId, observaciones) => {
  if (!observaciones) {
    throw new Error('El motivo (observaciones) es obligatorio para rechazar.');
  }
  try {
    const response = await api.put(`/verificaciones/${verificacionId}/rechazar`, { 
      observaciones: observaciones 
    });
    return response.data;
  } catch (error) {
    console.error("Error en servicio rejectVerificacion:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Obtiene las taxonomías (Materias y Niveles)
 * Llama a: GET /api/v1/taxonomia
 */
export const getTaxonomias = async () => {
  try {
    // Para taxonomía necesitamos una instancia separada o usar axios directamente
    const token = localStorage.getItem('authToken');
    const response = await axios.get(TAXONOMIA_API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error en servicio getTaxonomias:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Crea una nueva taxonomía (Materia o Nivel)
 * Llama a: POST /api/v1/taxonomia
 */
export const createTaxonomia = async (tipo, nombre) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(TAXONOMIA_API_URL, { tipo, nombre }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error en servicio createTaxonomia:", error.response?.data || error.message);
    throw new Error(error.response?.data?.mensaje || 'Error al crear la taxonomía.');
  }
};

/**
 * Actualiza el nombre de una taxonomía.
 * Llama a: PUT /api/v1/taxonomia/:id
 */
export const updateTaxonomia = async (id, nombre) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${TAXONOMIA_API_URL}/${id}`, { nombre }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error en servicio updateTaxonomia:", error.response?.data || error.message);
    throw new Error(error.response?.data?.mensaje || 'Error al actualizar la taxonomía.');
  }
};

/**
 * Elimina una taxonomía.
 * Llama a: DELETE /api/v1/taxonomia/:id
 */
export const deleteTaxonomia = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${TAXONOMIA_API_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error en servicio deleteTaxonomia:", error.response?.data || error.message);
    throw new Error(error.response?.data?.mensaje || 'Error al eliminar la taxonomía.');
  }
};

/**
 * Obtiene la lista de TODOS los usuarios, con filtros.
 * Llama a: GET /api/v1/admin/usuarios?search=...&rol=...
 */
export const getAllUsers = async (filters) => {
  try {
    const response = await api.get('/usuarios', { 
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error("Error en servicio getAllUsers:", error.response?.data || error.message);
    throw new Error(error.response?.data?.mensaje || 'Error al obtener usuarios.');
  }
};

/**
 * Actualiza el rol de un usuario específico.
 * Llama a: PUT /api/v1/admin/usuarios/:id/rol
 */
export const updateUserRole = async (userId, nuevoRol) => {
  try {
    const response = await api.put(`/usuarios/${userId}/rol`, { nuevoRol });
    return response.data;
  } catch (error) {
    console.error("Error en servicio updateUserRole:", error.response?.data || error.message);
    throw new Error(error.response?.data?.mensaje || 'Error al actualizar el rol.');
  }
};

// --- [NUEVAS FUNCIONES AÑADIDAS] ---

/**
 * Obtiene la lista de reseñas reportadas (US-24).
 * Llama a: GET /api/v1/admin/moderacion/resenas
 */
export const getReportedResenas = async () => {
  try {
    const response = await api.get(`${API_URL}/moderacion/resenas`);
    return response.data; // Devuelve un array de reseñas
  } catch (error) {
    console.error("Error en servicio getReportedResenas:", error.response?.data || error.message);
    throw new Error(error.response?.data?.mensaje || 'Error al obtener reseñas.');
  }
};

/**
 * Aprueba (restaura) una reseña reportada.
 * Llama a: PUT /api/v1/admin/moderacion/resenas/:id/aprobar
 */
export const approveResena = async (resenaId) => {
  try {
    const response = await api.put(`${API_URL}/moderacion/resenas/${resenaId}/aprobar`);
    return response.data;
  } catch (error) {
    console.error("Error en servicio approveResena:", error.response?.data || error.message);
    throw new Error(error.response?.data?.mensaje || 'Error al aprobar la reseña.');
  }
};

/**
 * Oculta (confirma reporte) una reseña.
 * Llama a: PUT /api/v1/admin/moderacion/resenas/:id/ocultar
 */
export const hideResena = async (resenaId) => {
  try {
    const response = await api.put(`${API_URL}/moderacion/resenas/${resenaId}/ocultar`);
    return response.data;
  } catch (error) {
    console.error("Error en servicio hideResena:", error.response?.data || error.message);
    throw new Error(error.response?.data?.mensaje || 'Error al ocultar la reseña.');
  }
};