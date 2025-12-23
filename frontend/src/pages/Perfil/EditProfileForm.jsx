import React, { useState, useEffect } from 'react';
import { actualizarPerfil } from '../../services/usuario.service';
import { FaSpinner, FaSave } from 'react-icons/fa';

/**
 * Formulario para editar los detalles básicos del perfil.
 */
const EditProfileForm = ({ usuario, token, onSaveSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    biografia: '',
    ciudad: '',
    foto_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Carga los datos del usuario en el estado local del formulario
  useEffect(() => {
    if(usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        biografia: usuario.biografia || '',
        ciudad: usuario.ciudad || '',
        foto_url: usuario.foto_url || ''
      });
    }
  }, [usuario]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const datosActualizados = await actualizarPerfil(formData, token);
      setLoading(false);
      setSuccess('¡Perfil actualizado con éxito!');
      // Llama a la función del padre para actualizar el contexto
      onSaveSuccess(datosActualizados.usuario); 
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Error al actualizar el perfil. Inténtalo de nuevo.');
    }
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="nombre">Nombre Completo</label>
        <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
      </div>
      <div className="form-group form-group-readonly">
        <label htmlFor="correo">Correo Electrónico (Solo Lectura)</label>
        <input type="email" id="correo" name="correo" value={usuario.correo} readOnly disabled />
      </div>
      <div className="form-group">
        <label htmlFor="ciudad">Ciudad</label>
        <input type="text" id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleChange} placeholder="Ej: Cusco, Perú" />
      </div>
      <div className="form-group">
        <label htmlFor="biografia">Biografía</label>
        <textarea id="biografia" name="biografia" value={formData.biografia} onChange={handleChange} placeholder="Cuéntanos un poco sobre ti..." rows="4" />
      </div>
      <div className="form-group">
        <label htmlFor="foto_url">URL de Avatar</label>
        <input type="text" id="foto_url" name="foto_url" value={formData.foto_url} onChange={handleChange} placeholder="https://..." />
      </div>
      
      {success && <div className="profile-message success">{success}</div>}
      {error && <div className="profile-message error">{error}</div>}

      <div className="profile-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><FaSpinner className="fa-spin" /> Procesando...</> : <><FaSave /> Guardar Cambios</>}
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;