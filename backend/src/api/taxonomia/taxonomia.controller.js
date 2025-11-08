import { query } from '../../config/database.js';

/**
 * Controlador para que un Admin cree una nueva taxonomía (US-26)
 */
export const crearTaxonomia = async (req, res) => {
  // ... (Tu código existente, sin cambios)
  const { tipo, nombre } = req.body;

  if (!tipo || !nombre) {
    return res.status(400).json({ mensaje: "Los campos 'tipo' y 'nombre' son obligatorios." });
  }
  if (tipo !== 'materia' && tipo !== 'nivel') {
    return res.status(400).json({ mensaje: "El 'tipo' debe ser 'materia' o 'nivel'." });
  }

  try {
    const sql = 'INSERT INTO taxonomias (tipo, nombre) VALUES (?, ?)';
    const resultado = await query(sql, [tipo, nombre]);
    res.status(201).json({ 
      mensaje: 'Taxonomía creada exitosamente.',
      id: resultado.insertId 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'Esta taxonomía ya existe.' });
    }
    console.error('Error al crear taxonomía:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

/**
 * Controlador para obtener TODAS las taxonomías agrupadas
 */
export const obtenerTaxonomias = async (req, res) => {
  try {
    const materias = await query("SELECT id, nombre FROM taxonomias WHERE tipo = 'materia'");
    const niveles = await query("SELECT id, nombre FROM taxonomias WHERE tipo = 'nivel'");
    
    res.status(200).json({
      materias: materias,
      niveles: niveles
    });

  } catch (error) {
    console.error('Error al obtener taxonomías:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

// --- [NUEVA FUNCIÓN AÑADIDA] ---
/**
 * Controlador para que un Admin actualice el nombre de una taxonomía.
 */
export const actualizarTaxonomia = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ mensaje: "El campo 'nombre' es obligatorio." });
  }

  try {
    const sql = 'UPDATE taxonomias SET nombre = ? WHERE id = ?';
    const resultado = await query(sql, [nombre, id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Taxonomía no encontrada.' });
    }

    res.status(200).json({ mensaje: 'Taxonomía actualizada exitosamente.' });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'Ya existe una taxonomía con ese nombre.' });
    }
    console.error('Error al actualizar taxonomía:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

// --- [NUEVA FUNCIÓN AÑADIDA] ---
/**
 * Controlador para que un Admin elimine una taxonomía.
 */
export const eliminarTaxonomia = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'DELETE FROM taxonomias WHERE id = ?';
    const resultado = await query(sql, [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Taxonomía no encontrada.' });
    }

    res.status(200).json({ mensaje: 'Taxonomía eliminada exitosamente.' });

  } catch (error) {
    // Error de Foreign Key (MySQL)
    // Esto ocurre si intentas borrar una "Materia" que un "Plan" ya está usando.
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ 
        mensaje: 'Error: No se puede eliminar esta taxonomía porque está siendo usada por uno o más cursos/planes.' 
      });
    }
    console.error('Error al eliminar taxonomía:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};