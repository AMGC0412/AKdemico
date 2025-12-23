import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUnified } from '../../services/auth.service';
import { FaUser, FaEnvelope, FaLock, FaMapMarkerAlt, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { FaUserGraduate, FaChalkboardUser } from 'react-icons/fa6';
import './AuthForms.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    ciudad: '',
    roles: { estudiante: true, docente: false }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleRoleToggle = (role) => {
    setFormData(prev => ({
      ...prev,
      roles: { ...prev.roles, [role]: !prev.roles[role] }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (formData.contrasena !== formData.confirmarContrasena) {
      return setError('Las contraseñas no coinciden.');
    }

    if (formData.contrasena.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    const rolesSeleccionados = Object.keys(formData.roles).filter(r => formData.roles[r]);
    if (rolesSeleccionados.length === 0) {
      return setError('Debes seleccionar al menos un rol.');
    }

    setLoading(true);
    try {
      await registerUnified({
        nombre: formData.nombre,
        correo: formData.correo,
        contrasena: formData.contrasena,
        ciudad: formData.ciudad,
        roles: rolesSeleccionados
      });
      navigate('/auth/login');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form-unified">
      <div className="auth-form-header">
        <h2 className="auth-form-title">Únete a AKdémico</h2>
        <p className="auth-form-subtitle">Crea tu cuenta y comienza tu viaje educativo</p>
      </div>

      {/* --- SELECTOR DE ROLES --- */}
      <div className="auth-roles-section">
        <label className="auth-roles-label">¿Cuál es tu rol?</label>
        <div className="auth-roles-grid">
          <div
            className={`auth-role-card ${formData.roles.estudiante ? 'active' : ''}`}
            onClick={() => handleRoleToggle('estudiante')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleRoleToggle('estudiante')}
          >
            <FaUserGraduate className="auth-role-icon" />
            <span className="auth-role-name">Estudiante</span>
            <p className="auth-role-desc">Accede a cursos y aprende</p>
            {formData.roles.estudiante && <FaCheckCircle className="auth-role-check" />}
          </div>

          <div
            className={`auth-role-card ${formData.roles.docente ? 'active' : ''}`}
            onClick={() => handleRoleToggle('docente')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleRoleToggle('docente')}
          >
            <FaChalkboardUser className="auth-role-icon" />
            <span className="auth-role-name">Docente</span>
            <p className="auth-role-desc">Crea y enseña cursos</p>
            {formData.roles.docente && <FaCheckCircle className="auth-role-check" />}
          </div>
        </div>
      </div>

      {/* --- CAMPOS DEL FORMULARIO --- */}
      <div className="form-group-unified">
        <label htmlFor="nombre" className="form-label">Nombre Completo</label>
        <div className="form-input-wrapper">
          <FaUser className="form-input-icon" />
          <input
            type="text"
            id="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder="Juan Pérez"
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group-unified">
        <label htmlFor="correo" className="form-label">Correo Electrónico</label>
        <div className="form-input-wrapper">
          <FaEnvelope className="form-input-icon" />
          <input
            type="email"
            id="correo"
            value={formData.correo}
            onChange={handleChange}
            required
            placeholder="tu@correo.com"
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group-unified">
        <label htmlFor="ciudad" className="form-label">Ciudad (Opcional)</label>
        <div className="form-input-wrapper">
          <FaMapMarkerAlt className="form-input-icon" />
          <input
            type="text"
            id="ciudad"
            value={formData.ciudad}
            onChange={handleChange}
            placeholder="Cusco, Perú"
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row-unified">
        <div className="form-group-unified">
          <label htmlFor="contrasena" className="form-label">Contraseña</label>
          <div className="form-input-wrapper">
            <FaLock className="form-input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="contrasena"
              value={formData.contrasena}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="••••••••"
              className="form-input"
            />
            <button
              type="button"
              className="form-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Mostrar/ocultar contraseña"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div className="form-group-unified">
          <label htmlFor="confirmarContrasena" className="form-label">Confirmar</label>
          <div className="form-input-wrapper">
            <FaLock className="form-input-icon" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmarContrasena"
              value={formData.confirmarContrasena}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="••••••••"
              className="form-input"
            />
            <button
              type="button"
              className="form-password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label="Mostrar/ocultar contraseña"
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" className="btn-submit-unified" disabled={loading}>
        {loading ? 'Creando cuenta...' : (
          <>
            Crear Cuenta <FaArrowRight />
          </>
        )}
      </button>

      <div className="auth-form-footer">
        <p className="auth-terms">
          Al registrarte, aceptas nuestros términos y condiciones
        </p>
      </div>
    </form>
  );
};

export default RegisterPage;