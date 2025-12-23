import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';
import './AuthForms.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { iniciarSesion } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(formData.correo, formData.contrasena);
      iniciarSesion(data.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Credenciales incorrectas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form-unified">
      <div className="auth-form-header">
        <h2 className="auth-form-title">Bienvenido de Vuelta</h2>
        <p className="auth-form-subtitle">Inicia sesión en tu cuenta AKdémico</p>
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
        <label htmlFor="contrasena" className="form-label">Contraseña</label>
        <div className="form-input-wrapper">
          <FaLock className="form-input-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            id="contrasena"
            value={formData.contrasena}
            onChange={handleChange}
            required
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

      {error && <div className="form-error">{error}</div>}

      <button type="submit" className="btn-submit-unified" disabled={loading}>
        {loading ? 'Ingresando...' : (
          <>
            Ingresar <FaArrowRight />
          </>
        )}
      </button>

      <div className="auth-form-footer">
        <a href="#reset" className="auth-link">¿Olvidaste tu contraseña?</a>
      </div>
    </form>
  );
};

export default LoginPage;