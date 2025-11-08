import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAdmin } from '../../services/auth.service'; // <-- Importaremos esta NUEVA función
import '../Auth/AuthPageLayout.css'; // Reutilizamos el layout general
import '../Auth/AuthPages.css'; // Reutilizamos los estilos del formulario

/**
 * Página (oculta) para el registro de nuevos administradores.
 * Requiere una clave secreta para completarse.
 */
const AdminRegisterPage = () => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [adminSecret, setAdminSecret] = useState(''); // <-- NUEVO ESTADO
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Llamamos a la nueva función del servicio
      const data = await registerAdmin(nombre, correo, contrasena, adminSecret);
      console.log('Registro de admin exitoso:', data);

      setLoading(false);
      // Redirigimos al login
      navigate('/auth/login');

    } catch (err) {
      setLoading(false);
      
      // Errores específicos
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 403) {
          setError('Clave secreta de administrador incorrecta.');
        } else if (err.response.status === 409) {
          setError('El correo electrónico ya está registrado.');
        } else {
          setError('Ocurrió un error. Verifica los datos.');
        }
      } else {
        setError('No se pudo conectar con el servidor.');
      }
      console.error("Error en registro de admin:", err);
    }
  };

  return (
    // Reutilizamos el contenedor de la página de Auth
    <div className="auth-page-container">
      {/* Reutilizamos el 'wrapper' del formulario */}
      <div className="auth-form-wrapper">
        
        <h2 className="auth-title" style={{color: 'var(--color-secondary)'}}>
          Registro de Administrador
        </h2>
        <p style={{textAlign: 'center', color: 'var(--color-text-light)', marginTop: '-1rem', marginBottom: '1.5rem'}}>
          Ruta de aprovisionamiento de superusuario.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico</label>
            <input
              type="email"
              id="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              type="password"
              id="contrasena"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              minLength="6"
            />
          </div>
          
          {/* --- CAMPO DE SEGURIDAD --- */}
          <div className="form-group">
            <label htmlFor="adminSecret" style={{color: 'var(--color-secondary)'}}>
              Clave Secreta de Administrador
            </label>
            <input
              type="password"
              id="adminSecret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              required
              placeholder="••••••••••••"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{background: 'var(--color-secondary)', color: 'var(--color-bg-dark)'}}>
            {loading ? 'Creando...' : 'Crear Administrador'}
          </button>
        </form>

        <div className="auth-links" style={{marginTop: '1.5rem'}}>
          <Link to="/auth/login">Volver a Iniciar Sesión</Link>
        </div>

      </div>
    </div>
  );
};

export default AdminRegisterPage;