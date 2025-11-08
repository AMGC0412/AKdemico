import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 'Link' ya no es necesario aquí
import { login } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css'; // Mantenemos los estilos del formulario

/**
 * [MODIFICADO] Se quita el layout principal (div.auth-page, div.auth-container),
 * el h2 y los enlaces inferiores (auth-links), ya que ahora vive 
 * dentro de AuthPageLayout.
 */
const LoginPage = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(correo, contrasena);
      iniciarSesion(data.token); // El contexto maneja el token
      setLoading(false);
      
      // [MODIFICADO] Redirige al dashboard o perfil según el rol
      // (Esta es una mejora de UX opcional)
      const userRol = data.rol; // Asumiendo que el login devuelve el rol
      if (userRol === 'docente') {
          navigate('/docente/dashboard');
      } else if (userRol === 'administrador') {
          navigate('/admin/dashboard'); // Si tienes panel de admin
      } else {
          navigate('/perfil'); // O a '/buscar' o a '/'
      }

    } catch (err) {
      setLoading(false);
      if (err.response && err.response.status === 401) {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else {
        setError('Ocurrió un error al intentar iniciar sesión. Inténtalo de nuevo.');
      }
      console.error("Error en login:", err);
    }
  };

  // [MODIFICADO] Se eliminan los contenedores exteriores, el h2 y los enlaces
  return (
    <>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="correo">Correo Electrónico</label>
          <input
            type="email"
            id="correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            placeholder="tu@correo.com"
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
            placeholder="••••••••"
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      {/* [ELIMINADO] El div.auth-links ya no es necesario */}
    </>
  );
};

export default LoginPage;