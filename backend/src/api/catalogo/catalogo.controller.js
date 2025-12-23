import { query } from '../../config/database.js'; 

/**
 * Obtener la lista completa de CATEGORÍAS
 * Se usa para llenar el <select> en EditarPlanPage
 */
export const obtenerCategorias = async (req, res) => {
    try {
        // Seleccionamos id y nombre, ordenados alfabéticamente
        const categorias = await query('SELECT id, nombre FROM categorias ORDER BY nombre ASC');
        res.status(200).json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ mensaje: 'Error al cargar las categorías.' });
    }
};

/**
 * Obtener la lista completa de NIVELES
 * Se usa para llenar el <select> en EditarPlanPage
 */
export const obtenerNiveles = async (req, res) => {
    try {
        // Seleccionamos id y nombre. 
        // Ordenamos por ID asumiendo que el ID 1 es Básico, 2 Intermedio, etc.
        const niveles = await query('SELECT id, nombre FROM niveles ORDER BY id ASC');
        res.status(200).json(niveles);
    } catch (error) {
        console.error('Error al obtener niveles:', error);
        res.status(500).json({ mensaje: 'Error al cargar los niveles.' });
    }
};