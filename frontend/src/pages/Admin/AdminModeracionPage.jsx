import React, { useState, useEffect } from 'react';
import { getReportedResenas, approveResena, hideResena } from '../../services/admin.service';
import { 
  FaSpinner, FaExclamationTriangle, FaCheckCircle, FaCheck, FaTimes, FaStar, FaQuoteLeft, FaUser, FaChalkboardTeacher, FaExclamationCircle
} from 'react-icons/fa';
// Reutilizamos estilos del admin
import './AdminModeracionPage.css'; 

/**
 * Componente principal para la Moderación de Reseñas (US-24)
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

  const handleAction = async (resenaId, actionType) => {
    setProcessingId(resenaId);
    try {
      if (actionType === 'approve') {
        await approveResena(resenaId);
      } else {
        await hideResena(resenaId);
      }
      // Refrescar la lista quitando la reseña procesada
      setResenas(resenas.filter(r => r.id !== resenaId));
    } catch (err) {
      setError(err.message || `Error al ${actionType === 'approve' ? 'aprobar' : 'ocultar'}.`); 
    } finally {
      setProcessingId(null);
    }
  };

  // 1. Estado de Carga
  if (isLoading) {
    return (
      <div className="admin-page-state loading">
        <FaSpinner className="spin-icon" />
        <p>CALIBRANDO SISTEMA / CARGANDO COLA DE MODERACIÓN...</p>
      </div>
    );
  }

  // 2. Estado de Error
  if (error && !isLoading) {
    return (
      <div className="admin-page-state error">
        <FaExclamationTriangle className="error-icon" />
        <h3>FALLA CRÍTICA</h3>
        <p>{error}</p>
      </div>
    );
  }

  // 3. Estado de Éxito
  return (
    <div className="admin-moderacion-page">
      <header className="admin-page-header">
        <h2>TERMINAL TÁCTICO DE AMENAZAS</h2>
        <p>Revisa la cola de reseñas reportadas por contenido inapropiado y toma una decisión final de publicación u ocultamiento.</p>
      </header>
      
      {/* Mensaje de Alerta (Barra superior para errores) */}
      {error && <div className="alert-bar danger"><FaExclamationCircle/> {error}</div>}

      {/* Si no hay reseñas pendientes */}
      {resenas.length === 0 ? (
        <div className="admin-empty-state">
          <FaCheckCircle className="empty-icon" />
          <h3>¡COLA LIMPIA!</h3>
          <p>No hay registros de amenazas pendientes de moderación.</p>
        </div>
      ) : (
        <div className="moderacion-list-container">
          {resenas.map((resena, index) => (
            <div key={resena.id} className="moderacion-card" style={{ animationDelay: `${index * 0.1}s` }}>
              
              {/* CINTA DE ALERTA LATERAL */}
              <div className="card-alert-indicator"></div> 

              <header className="moderacion-card-header">
                <div className="moderacion-info">
                  <span className="info-title"><FaUser /> Autor: <strong>{resena.autor_nombre}</strong></span>
                  <span className="info-title"><FaChalkboardTeacher /> Docente: <strong>{resena.docente_nombre}</strong></span>
                </div>
                <div className="moderacion-rating">
                  <span className="rating-value">{resena.calificacion}.0</span>
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
                  className="btn btn-danger btn-action-small"
                  onClick={() => handleAction(resena.id, 'hide')}
                  disabled={processingId === resena.id}
                >
                  {processingId === resena.id ? <FaSpinner className="spin"/> : <FaTimes />}
                  OCULTAR (AMENAZA)
                </button>
                <button 
                  className="btn btn-primary btn-action-small"
                  onClick={() => handleAction(resena.id, 'approve')}
                  disabled={processingId === resena.id}
                >
                  {processingId === resena.id ? <FaSpinner className="spin"/> : <FaCheck />}
                  APROBAR (RESTAURAR)
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