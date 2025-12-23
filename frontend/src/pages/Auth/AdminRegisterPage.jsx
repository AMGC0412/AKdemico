import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAdmin } from '../../services/auth.service';
import { FaUser, FaEnvelope, FaLock, FaShieldAlt, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import './AuthForms.css';
import './AdminRegisterPage.css';

/**
 * Página para el registro de nuevos administradores.
 * Requiere una clave secreta para completarse.
 * Ruta: /registro-admin-secreto
 */
const AdminRegisterPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    adminSecret: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    // Validaciones
    if (formData.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (!formData.adminSecret.trim()) {
      setError('La clave secreta es requerida.');
      setLoading(false);
      return;
    }

    try {
      const data = await registerAdmin(
        formData.nombre,
        formData.correo,
        formData.contrasena,
        formData.adminSecret
      );
      console.log('Registro de admin exitoso:', data);
      
      // Redirigir al login con mensaje
      navigate('/auth/login', { state: { message: 'Administrador creado exitosamente. Por favor inicia sesión.' } });
    } catch (err) {
      // Errores específicos
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 403) {
          setError('❌ Clave secreta de administrador incorrecta.');
        } else if (err.response.status === 409) {
          setError('❌ El correo electrónico ya está registrado.');
        } else if (err.response.status === 400) {
          setError('❌ ' + (err.response.data?.mensaje || 'Datos incompletos o inválidos.'));
        } else {
          setError('❌ Error: ' + (err.response.data?.mensaje || 'Ocurrió un error inesperado.'));
        }
      } else {
        setError('❌ No se pudo conectar con el servidor.');
      }
      console.error("Error en registro de admin:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-register-container">
      <div className="admin-register-card">
        
        {/* --- ENCABEZADO --- */}
        <div className="admin-register-header">
          <div className="admin-register-icon">🔐</div>
          <h2 className="admin-register-title">Crear Administrador</h2>
          <p className="admin-register-subtitle">Ruta de aprovisionamiento de superusuario</p>
        </div>

        {/* --- ADVERTENCIA DE SEGURIDAD --- */}
        <div className="admin-security-warning">
          <FaShieldAlt className="warning-icon" />
          <span className="warning-text">Esta es una ruta protegida. Se requiere clave secreta.</span>
        </div>

        {/* --- FORMULARIO --- */}
        <form onSubmit={handleSubmit} className="auth-form-unified">
          
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
                placeholder="Carlos Administrador"
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
                placeholder="admin@akdemico.com"
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

          <div className="form-group-unified admin-secret-group">
            <label htmlFor="adminSecret" className="form-label admin-secret-label">
              🔑 Clave Secreta de Administrador
            </label>
            <div className="form-input-wrapper">
              <FaShieldAlt className="form-input-icon admin-shield-icon" />
              <input
                type={showSecret ? 'text' : 'password'}
                id="adminSecret"
                value={formData.adminSecret}
                onChange={handleChange}
                required
                placeholder="••••••••••••••••"
                className="form-input admin-secret-input"
              />
              <button
                type="button"
                className="form-password-toggle"
                onClick={() => setShowSecret(!showSecret)}
                aria-label="Mostrar/ocultar clave secreta"
              >
                {showSecret ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small className="admin-secret-help">
              Se requiere clave secreta para crear un administrador
            </small>
          </div>

          {error && <div className="form-error admin-error">{error}</div>}

          <button type="submit" className="btn-submit-unified admin-submit-btn" disabled={loading}>
            {loading ? 'Creando Administrador...' : (
              <>
                Crear Administrador <FaArrowRight />
              </>
            )}
          </button>
        </form>

        {/* --- PIE DE PÁGINA --- */}
        <div className="admin-register-footer">
          <Link to="/auth/login" className="admin-back-link">
            <FaArrowLeft /> Volver a Iniciar Sesión
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AdminRegisterPage;