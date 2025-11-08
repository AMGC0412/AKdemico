import axios from 'axios';

// La URL base de tu API backend
const API_URL = 'http://localhost:4000/api/v1/auth'; 

/**
 * Llama al endpoint de Login del backend.
 */
export const login = async (correo, contrasena) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      correo: correo,
      contrasena: contrasena,
    });
    // Asumimos que el login devuelve { token, rol, nombre }
    // para la redirección inteligente en LoginPage
    return response.data; 
  } catch (error) {
    console.error("Error en servicio de login:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Llama al endpoint de Registro (Estudiante) del backend.
 */
export const registerEstudiante = async (nombre, correo, contrasena) => {
    try {
        // Esta función llama a la ruta /register
        const response = await axios.post(`${API_URL}/register`, {
            nombre,
            correo,
            contrasena
        });
        return response.data; 
    } catch (error) {
        console.error("Error en servicio de registro (estudiante):", error.response?.data || error.message);
        throw error;
    }
};

// --- [FUNCIÓN CORREGIDA] ---

/**
 * Llama al endpoint de Registro (Docente) del backend.
 */
export const registerDocente = async (nombre, correo, contrasena) => {
    try {
        // [CORREGIDO] Esta función ahora llama a la ruta /register-docente
        const response = await axios.post(`${API_URL}/register-docente`, {
            nombre,
            correo,
            contrasena
            // Ya no necesitamos enviar 'rol: docente' en el body,
            // porque la ruta del backend ya se encarga de eso.
        });
        return response.data; 
    } catch (error) {
        console.error("Error en servicio de registro (docente):", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Llama al endpoint de Registro (Admin) del backend.
 * Envía la clave secreta para autorización.
 */
export const registerAdmin = async (nombre, correo, contrasena, adminSecret) => {
    try {
        // Llamará a una nueva ruta que crearemos en el backend
        const response = await axios.post(`${API_URL}/register-admin`, {
            nombre,
            correo,
            contrasena,
            adminSecret // <-- Enviamos la clave secreta
        });
        return response.data; 
    } catch (error) {
        console.error("Error en servicio de registro (admin):", error.response?.data || error.message);
        throw error;
    }
};