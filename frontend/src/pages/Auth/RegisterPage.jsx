import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// [MODIFICADO] Importamos ambas funciones de registro
import { registerEstudiante, registerDocente } from '../../services/auth.service'; 
// 'Link' ya no es necesario aquí
// 'AuthPages.css' se sigue usando para los estilos del formulario en sí

/**
 * [MODIFICADO] El componente ahora acepta un 'mode'
 * para diferenciar entre registro de estudiante y docente.
 * Se quita el layout principal (div.auth-page, div.auth-container)
 * y el h2, ya que ahora vive dentro de AuthPageLayout.
 */
const RegisterPage = ({ mode = 'estudiante' }) => { // <-- Acepta 'mode'
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- Lógica Dinámica basada en el 'mode' ---
  const esDocente = mode === 'docente';
  const buttonText = esDocente ? 'Registrarme como Docente' : 'Crear Cuenta';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      // --- [MODIFICADO] Lógica de registro dinámico ---
      let data;
      if (esDocente) {
        // Llama a la función de registro de docente
        data = await registerDocente(nombre, correo, contrasena);
      } else {
        // Llama a la función de registro de estudiante
        data = await registerEstudiante(nombre, correo, contrasena);
      }
      
      console.log('Registro exitoso:', data);
      setLoading(false);
      
      // Redirige al usuario a la página de Login después del registro
      // La pestaña de Login ya estará visible en el layout
      navigate('/auth/login'); 

    } catch (err) {
      setLoading(false);
      if (err.response && err.response.status === 409) {
        setError('El correo electrónico ya está registrado.');
      } else {
        setError('Ocurrió un error durante el registro. Inténtalo de nuevo.');
      }
      console.error("Error en registro:", err);
    }
  };

  // [MODIFICADO] Se eliminan los contenedores exteriores y el h2
  return (
    <>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="nombre">Nombre Completo</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Tu Nombre Completo"
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
            placeholder="Mínimo 6 caracteres" 
            minLength="6"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmarContrasena">Confirmar Contraseña</label>
          <input
            type="password"
            id="confirmarContrasena"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
            required
            placeholder="Repite tu contraseña"
            minLength="6"
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        {/* [MODIFICADO] Texto del botón dinámico */}
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Registrando...' : buttonText}
        </button>
      </form>
      {/* [ELIMINADO] Se quita el div.auth-links, ya que ahora lo manejan las pestañas */}
    </>
  );
};

export default RegisterPage;