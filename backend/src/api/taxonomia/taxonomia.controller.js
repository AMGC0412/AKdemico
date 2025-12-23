/* Archivo: taxonomia.controller.js */
import { query } from '../../config/database.js';

/**
 * [AUXILIAR] Maneja la respuesta de la DB.
 */
const getRowsFromResult = (resultado) => {
    if (Array.isArray(resultado) && resultado.length === 2 && Array.isArray(resultado[0])) {
      return resultado[0];
    }
    return resultado;
}

/**
 * Controlador para obtener TODAS las taxonomías para los filtros de búsqueda
 * [CORREGIDO] Ahora solo devuelve 'niveles' y 'categorias'.
 */
export const obtenerTaxonomias = async (req, res) => {
  try {
    // [MODIFICADO] Eliminada la consulta a 'materias'
    const nivelesResult = await query("SELECT id, nombre FROM niveles ORDER BY id ASC");
    const categoriasResult = await query("SELECT id, nombre FROM categorias ORDER BY nombre ASC");

    res.status(200).json({
      niveles: getRowsFromResult(nivelesResult),
      categorias: getRowsFromResult(categoriasResult)
    });

  } catch (error) {
    console.error('Error al obtener taxonomías:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};


/* --- RUTAS DE ADMIN (OBSOLETAS) --- */
export const crearTaxonomia = async (req, res) => {
  res.status(501).json({ mensaje: "Endpoint obsoleto. Usar /api/v1/categorias o /api/v1/niveles." });
};
export const actualizarTaxonomia = async (req, res) => {
   res.status(501).json({ mensaje: "Endpoint obsoleto. Usar /api/v1/categorias o /api/v1/niveles." });
};
export const eliminarTaxonomia = async (req, res) => {
   res.status(501).json({ mensaje: "Endpoint obsoleto. Usar /api/v1/categorias o /api/v1/niveles." });
};