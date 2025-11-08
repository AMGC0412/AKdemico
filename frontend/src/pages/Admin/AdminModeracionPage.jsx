import React, { useState, useEffect } from 'react';
import { getReportedResenas, approveResena, hideResena } from '../../services/admin.service';
import { 
  FaSpinner, FaExclamationTriangle, FaCheckCircle, FaCheck, FaTimes, FaStar, FaQuoteLeft, FaUser, FaChalkboardTeacher
} from 'react-icons/fa';
// Reutilizamos estilos del admin
import './AdminVerificationPage.css';
import './AdminModeracionPage.css'; // Crearemos este CSS

/**
 * Página principal para la Moderación de Reseñas (US-24)
 */
const AdminModeracionPage = () => {
  const [resenas, setResenas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para saber qué ítem está siendo procesado
  const [processingId, setProcessingId] = useState(null);

  // Función para cargar los datos
  const fetchResenas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getReportedResenas();
      setResenas(data || []);
    } catch (err) {
      console.error("Error al cargar reseñas:", err);
      setError("No se pudieron cargar las reseñas reportadas.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchResenas();
  }, []);

  // --- Handlers de Acciones ---

  const handleApprove = async (resenaId) => {
    setProcessingId(resenaId);
    try {
      await approveResena(resenaId);
      // Refrescar la lista quitando la reseña procesada
      setResenas(resenas.filter(r => r.id !== resenaId));
    } catch (err) {
      setError(err.message); // Mostrar error en la parte superior
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleHide = async (resenaId) => {
    setProcessingId(resenaId);
    try {
      await hideResena(resenaId);
      // Refrescar la lista quitando la reseña procesada
      setResenas(resenas.filter(r => r.id !== resenaId));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 1. Estado de Carga
  if (isLoading) {
    return (
      <div className="admin-page-loader">
        <FaSpinner className="fa-spin" size="3em" />
        <p>Cargando cola de moderación...</p>
      </div>
    );
  }

  // 2. Estado de Error
  if (error && !isLoading) {
    return (
      <div className="admin-page-error">
        <FaExclamationTriangle size="3em" />
        <h3>Error al Cargar</h3>
        <p>{error}</p>
      </div>
    );
  }

  // 3. Estado de Éxito
  return (
    <div className="admin-moderacion-page">
      <header className="admin-page-header">
        <h2>Moderación de Reseñas</h2>
        <p>Revisa las reseñas reportadas por los usuarios y toma una acción.</p>
      </header>

      {/* Si no hay reseñas pendientes */}
      {resenas.length === 0 ? (
        <div className="admin-empty-state">
          <FaCheckCircle size="4em" />
          <h3>¡Cola Limpia!</h3>
          <p>No hay reseñas pendientes de moderación.</p>
        </div>
      ) : (
        <div className="moderacion-list-container">
          {resenas.map((resena) => (
            <div key={resena.id} className="moderacion-card">
              <header className="moderacion-card-header">
                <div className="moderacion-info">
                  <span><FaUser /> <strong>Autor:</strong> {resena.autor_nombre}</span>
                  <span><FaChalkboardTeacher /> <strong>Docente:</strong> {resena.docente_nombre}</span>
                </div>
                <div className="moderacion-rating">
                  {/* Genera las estrellas */}
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < resena.calificacion ? 'star-filled' : 'star-empty'} />
                  ))}
                </div>
              </header>
              
              <div className="moderacion-card-body">
                <FaQuoteLeft className="quote-icon" />
                <p className="comentario-texto">{resena.comentario}</p>
              </div>
              
              <footer className="moderacion-card-actions">
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => handleHide(resena.id)}
                  disabled={processingId === resena.id}
                >
                  {processingId === resena.id ? <FaSpinner className="fa-spin" /> : <FaTimes />}
                  Ocultar Reseña
                </button>
                <button 
                  className="btn btn-primary btn-small"
                  onClick={() => handleApprove(resena.id)}
                  disabled={processingId === resena.id}
                >
                  {processingId === resena.id ? <FaSpinner className="fa-spin" /> : <FaCheck />}
                  Aprobar (Restaurar)
                </button>
              </footer>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminModeracionPage;