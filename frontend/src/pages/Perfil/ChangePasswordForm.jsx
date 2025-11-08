import React, { useState } from 'react';
import { cambiarContrasena } from '../../services/usuario.service';
import { FaSpinner, FaSave } from 'react-icons/fa';

/**
 * Formulario para que el usuario cambie su propia contraseña.
 */
const ChangePasswordForm = ({ token }) => {
  const [formData, setFormData] = useState({
    contrasena_actual: '',
    contrasena_nueva: '',
    confirmar_contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.contrasena_nueva !== formData.confirmar_contrasena) {
      setError('Las nuevas contraseñas no coinciden.');
      setLoading(false);
      return;
    }
    
    if (formData.contrasena_nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const data = await cambiarContrasena({
        contrasena_actual: formData.contrasena_actual,
        contrasena_nueva: formData.contrasena_nueva
      }, token);
      
      setLoading(false);
      setSuccess(data.message || '¡Contraseña actualizada con éxito!');
      // Limpia el formulario
      setFormData({ contrasena_actual: '', contrasena_nueva: '', confirmar_contrasena: '' });

    } catch (err) {
      setLoading(false);
      setError(err.message || 'Error al cambiar la contraseña. Verifica tu contraseña actual.');
    }
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="contrasena_actual">Contraseña Actual</label>
        <input type="password" id="contrasena_actual" name="contrasena_actual" value={formData.contrasena_actual} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="contrasena_nueva">Nueva Contraseña</label>
        <input type="password" id="contrasena_nueva" name="contrasena_nueva" value={formData.contrasena_nueva} onChange={handleChange} required minLength="6" />
      </div>
      <div className="form-group">
        <label htmlFor="confirmar_contrasena">Confirmar Nueva Contraseña</label>
        <input type="password" id="confirmar_contrasena" name="confirmar_contrasena" value={formData.confirmar_contrasena} onChange={handleChange} required minLength="6" />
      </div>

      {success && <div className="profile-message success">{success}</div>}
      {error && <div className="profile-message error">{error}</div>}

      <div className="profile-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><FaSpinner className="fa-spin" /> Actualizando...</> : <><FaSave /> Actualizar Contraseña</>}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;