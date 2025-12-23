import axios from 'axios';

// Definimos las URL base. 
// Usamos VITE_API_BASE_URL si existe, si no, localhost.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
const API_URL_INSCRIPCIONES = `${BASE_URL}/inscripciones`;
const API_URL_ESTUDIANTES = `${BASE_URL}/estudiantes`; 

// Helper para obtener el token
const getToken = () => localStorage.getItem('authToken');

// Configuración de headers con token
const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` }
});

/* =================================================================
   FUNCIONALIDADES DE INSCRIPCIÓN (Lógica existente)
   ================================================================= */

export const inscribirseEnLote = async (loteId) => {
  try {
    // POST /api/v1/inscripciones/lote/:loteId
    const response = await axios.post(
        `${API_URL_INSCRIPCIONES}/lote/${loteId}`, 
        {}, 
        getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error al inscribirse en lote ${loteId}:`, error);
    throw error.response?.data || new Error('Error al inscribirse.');
  }
};

export const obtenerMiEstadoInscripcionEnLote = async (loteId) => {
  try {
    // GET /api/v1/inscripciones/mi-estado/lote/:loteId
    const response = await axios.get(
        `${API_URL_INSCRIPCIONES}/mi-estado/lote/${loteId}`, 
        getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    return { estaInscrito: false, estado: null };
  }
};

export const cancelarInscripcion = async (inscripcionId) => {
  try {
    // DELETE /api/v1/inscripciones/:inscripcionId
    const response = await axios.delete(
        `${API_URL_INSCRIPCIONES}/${inscripcionId}`, 
        getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error al cancelar inscripción ${inscripcionId}:`, error);
    throw error.response?.data || new Error('Error al cancelar.');
  }
};

export const getMisInscripciones = async () => {
  try {
    // GET /api/v1/inscripciones/mis-inscripciones
    const response = await axios.get(
        `${API_URL_INSCRIPCIONES}/mis-inscripciones`, 
        getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error al obtener mis inscripciones:', error);
    throw error.response?.data || new Error('Error al obtener cursos.');
  }
};

/* =================================================================
   NUEVAS FUNCIONES (Para el Dashboard de Mis Inscripciones)
   Estas funciones resuelven el error de "export not found".
   Nota: Requieren que crees los endpoints en el backend o usarán mocks.
   ================================================================= */

// Obtener estadísticas de progreso
export const getProgressStats = async () => {
  try {
    // GET /api/v1/estudiantes/dashboard/stats
    // Si no tienes el endpoint aún, puedes descomentar el return mock de abajo
    // const response = await axios.get(`${API_URL_ESTUDIANTES}/dashboard/stats`, getAuthHeaders());
    // return response.data;
    
    // MOCK TEMPORAL (Para que no falle la pantalla mientras haces el backend)
    return {
        promedio_general: 0,
        cursos_completados: 0,
        total_horas: 0
    };
  } catch (error) {
    console.warn('Error fetching progress stats (usando default):', error);
    return null;
  }
};

// Obtener próximas clases
export const getUpcomingClasses = async () => {
  try {
    // GET /api/v1/estudiantes/dashboard/clases-proximas
    // const response = await axios.get(`${API_URL_ESTUDIANTES}/dashboard/clases-proximas`, getAuthHeaders());
    // return response.data;

    // MOCK TEMPORAL
    return [];
  } catch (error) {
    console.warn('Error fetching upcoming classes:', error);
    return [];
  }
};

// Obtener recomendaciones
export const getCourseRecommendations = async () => {
  try {
    // GET /api/v1/estudiantes/dashboard/recomendaciones
    // const response = await axios.get(`${API_URL_ESTUDIANTES}/dashboard/recomendaciones`, getAuthHeaders());
    // return response.data;

    // MOCK TEMPORAL
    return [];
  } catch (error) {
    console.warn('Error fetching recommendations:', error);
    return [];
  }
};

/* =================================================================
   NUEVA FUNCIÓN: CALENDARIO
   ================================================================= */

/**
 * Obtiene los eventos del calendario del estudiante.
 * Llama al endpoint GET /api/v1/inscripciones/calendario
 */
export const getStudentCalendarData = async () => {
  const token = getToken();
  if (!token) return { hitos: [], cursos: [] };
  
  try {
    const response = await axios.get(
        `${API_URL_INSCRIPCIONES}/calendario`, 
        getAuthHeaders()
    );
    return response.data; // { hitos: [], cursos: [] }
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return { hitos: [], cursos: [] };
  }
};