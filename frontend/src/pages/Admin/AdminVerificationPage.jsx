// [CORREGIDO] Añadimos 'useMemo' a la importación
import React, { useState, useEffect, useMemo } from 'react'; 
// [CORREGIDO] Importamos la función renombrada
import { getAllVerificaciones, approveVerificacion, rejectVerificacion } from '../../services/admin.service';
import { 
  FaSpinner, FaExclamationTriangle, FaCheck, FaTimes, FaFilePdf, 
  FaIdCard, FaGraduationCap, FaEnvelope, FaClock, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import './AdminVerificationPage.css';

const API_BASE_URL = 'http://localhost:4000';

/**
 * Componente Modal para confirmar acciones (Aprobar/Rechazar)
 */
const VerificationModal = ({ verificacion, onClose, onConfirm }) => {
  const [observaciones, setObservaciones] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const docente = verificacion.docente_nombre;
  const action = isRejecting ? 'Rechazar' : 'Aprobar';

  const handleSubmit = async () => {
    setError('');
    // Validación para rechazo
    if (isRejecting && !observaciones.trim()) {
      setError('Debes proveer un motivo para el rechazo.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // onConfirm es la función (approveVerificacion o rejectVerificacion)
      await onConfirm(isRejecting, observaciones);
      setIsSubmitting(false);
      onClose(); // Cierra el modal al éxito
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Error al procesar la solicitud.');
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-header">
          <h3>Confirmar Acción</h3>
          <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
        </header>
        
        <div className="admin-modal-body">
          {!isRejecting ? (
            <p>¿Estás seguro de que quieres <strong>Aprobar</strong> la verificación de <strong>{docente}</strong>?</p>
          ) : (
            <p>Vas a <strong>Rechazar</strong> la verificación de <strong>{docente}</strong>.</p>
          )}

          <div className="modal-actions-toggle">
            <button 
              className={`btn-modal-toggle ${!isRejecting ? 'active' : ''}`} 
              onClick={() => setIsRejecting(false)}>
              <FaCheck /> Aprobar
            </button>
            <button 
              className={`btn-modal-toggle ${isRejecting ? 'active' : ''}`} 
              onClick={() => setIsRejecting(true)}>
              <FaTimes /> Rechazar
            </button>
          </div>

          {isRejecting && (
            <div className="form-group-modal">
              <label htmlFor="observaciones">Motivo del Rechazo (ObligatorIO)</label>
              <textarea
                id="observaciones"
                rows="3"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: El DNI no es legible, el título no es válido..."
              />
            </div>
          )}
        </div>
        
        <footer className="admin-modal-footer">
          {error && <p className="error-message-modal">{error}</p>}
          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button 
            className={`btn ${isRejecting ? 'btn-danger' : 'btn-primary'}`} 
            onClick={handleSubmit} 
            disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : `Confirmar ${action}`}
          </button>
        </footer>
      </div>
    </div>
  );
};


/**
 * Página principal para la cola de Verificaciones de Docentes
 * [MODIFICADA] con Pestañas (Tabs)
 */
const AdminVerificationPage = () => {
  const [allVerificaciones, setAllVerificaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('en_revision');
  const [selectedVerification, setSelectedVerification] = useState(null);

  // Función para cargar los datos
  const fetchVerificaciones = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // [CORREGIDO] Llama a la nueva función del servicio
      const data = await getAllVerificaciones();
      setAllVerificaciones(data || []);
    } catch (err) {
      console.error("Error al cargar verificaciones:", err);
      setError("No se pudieron cargar las verificaciones.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificaciones();
  }, []);

  // Función de callback para el modal
  const handleConfirmAction = async (isRejecting, observaciones) => {
    const id = selectedVerification.id;
    try {
      if (isRejecting) {
        await rejectVerificacion(id, observaciones);
      } else {
        await approveVerificacion(id, observaciones);
      }
      // Si tiene éxito, refrescamos la lista
      fetchVerificaciones(); 
    } catch (err) {
      console.error("Error al confirmar acción:", err);
      throw err; 
    }
  };

// [CORREGIDO] Esta línea ahora funcionará porque 'useMemo' está importado
  const verificacionesFiltradas = useMemo(() => {
    return allVerificaciones.filter(v => v.estado === filtroEstado);
  }, [allVerificaciones, filtroEstado]);

  // --- [NUEVO] Función para limpiar las URLs ---
  /**
   * Limpia la ruta del archivo de la BD.
   * Asume que la BD guarda "uploads/archivo.pdf"
   * y queremos solo "archivo.pdf".
   */
  const getCleanFilePath = (path) => {
    if (!path) return '';
    // Quita 'uploads/' o 'uploads\' (para Windows) del inicio
    return path.replace(/^uploads[\\/]/, '');
  };
  // ------------------------------------------

  // 1. Estado de Carga
  if (isLoading) {
    return (
      <div className="admin-page-loader">
        <FaSpinner className="fa-spin" size="3em" />
        <p>Cargando verificaciones...</p>
      </div>
    );
  }

  // 2. Estado de Error
  if (error) {
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
    <div className="admin-verification-page">
      <header className="admin-page-header">
        <h2>Cola de Verificación de Docentes</h2>
        <p>Revisa y aprueba o rechaza las postulaciones.</p>
      </header>

      {/* --- Pestañas de Filtro --- */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-item ${filtroEstado === 'en_revision' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('en_revision')}
        >
          Pendientes ({allVerificaciones.filter(v => v.estado === 'en_revision').length})
        </button>
        <button
          className={`admin-tab-item ${filtroEstado === 'aprobado' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('aprobado')}
        >
          Aprobados ({allVerificaciones.filter(v => v.estado === 'aprobado').length})
        </button>
        <button
          className={`admin-tab-item ${filtroEstado === 'rechazado' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('rechazado')}
        >
          Rechazados ({allVerificaciones.filter(v => v.estado === 'rechazado').length})
        </button>
      </div>

      {/* --- Lista o Estado Vacío --- */}
      {verificacionesFiltradas.length === 0 ? (
        <div className="admin-empty-state">
          {filtroEstado === 'en_revision' && <FaCheckCircle size="4em" />}
          <h3>No hay docentes en esta categoría.</h3>
          <p>
            {filtroEstado === 'en_revision' 
              ? '¡Todo al día! No hay verificaciones pendientes.' 
              : `No hay docentes ${filtroEstado}s.`}
          </p>
        </div>
      ) : (
        <div className="verification-list-container">
          {verificacionesFiltradas.map((v) => (
            <div key={v.id} className={`verification-card estado-${v.estado}`}>
              <header className="verification-card-header">
                <h4>{v.docente_nombre}</h4>
                <span><FaEnvelope /> {v.docente_correo}</span>
              </header>
              
              <div className="verification-card-body">
                <p>
                  <FaClock /> 
                  Postuló el: {new Date(v.fecha_postulacion).toLocaleDateString()}
                </p>
                <div className="document-links">
                  
                  {/* --- [CORREGIDO] Aplicamos la función de limpieza --- */}
                  
                  {v.url_cv && <a href={`${API_BASE_URL}/files/${getCleanFilePath(v.url_cv)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small"><FaFilePdf /> Ver CV</a>}
                  
                  {v.url_dni && <a href={`${API_BASE_URL}/files/${getCleanFilePath(v.url_dni)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small"><FaIdCard /> Ver DNI</a>}
                  
                  {v.url_titulo && <a href={`${API_BASE_URL}/files/${getCleanFilePath(v.url_titulo)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small"><FaGraduationCap /> Ver Título</a>}
                  {/* ----------------------------------------------- */}
                </div>
                
                {/* --- Mostrar motivo de rechazo --- */}
                {v.estado === 'rechazado' && v.observaciones_admin && (
                  <div className="rejection-reason">
                    <strong>Motivo del Rechazo:</strong>
                    <p>{v.observaciones_admin}</p>
                  </div>
                )}
                {v.estado === 'aprobado' && v.observaciones_admin && (
                  <div className="approval-notes">
                    <strong>Observaciones:</strong>
                    <p>{v.observaciones_admin}</p>
                  </div>
                )}
              </div>
              
              {/* Acciones solo para pendientes */}
              {v.estado === 'en_revision' && (
                <footer className="verification-card-actions">
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => setSelectedVerification(v)}>
                    <FaTimes /> Revisar (Rechazar)
                  </button>
                  <button 
                    className="btn btn-primary btn-small"
                    onClick={() => setSelectedVerification(v)}>
                    <FaCheck /> Revisar (Aprobar)
                  </button>
                </footer>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedVerification && (
        <VerificationModal
          verificacion={selectedVerification}
          onClose={() => setSelectedVerification(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
};

export default AdminVerificationPage;