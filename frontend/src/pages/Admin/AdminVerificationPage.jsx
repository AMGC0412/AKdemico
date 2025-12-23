import React, { useState, useEffect, useMemo } from 'react'; 
import { getAllVerificaciones, approveVerificacion, rejectVerificacion } from '../../services/admin.service';
import { 
  FaSpinner, FaExclamationTriangle, FaCheck, FaTimes, FaFilePdf, 
  FaIdCard, FaGraduationCap, FaEnvelope, FaClock, FaCheckCircle, 
  FaTimesCircle, FaUsers, FaClipboardList, FaArrowRight, FaShieldAlt
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
  const actionText = isRejecting ? 'RECHAZAR' : 'APROBAR';

  const handleSubmit = async () => {
    setError('');
    if (isRejecting && !observaciones.trim()) {
      setError('Debes proveer un motivo para el rechazo.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onConfirm(isRejecting, observaciones);
      setIsSubmitting(false);
      onClose(); 
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Error al procesar la solicitud.');
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-header">
          <h3>AUDITORÍA DE IDENTIDAD</h3>
          <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
        </header>
        
        <div className="admin-modal-body">
          <p className="modal-target-info">
            Aplicar decisión a: <strong style={{color: 'var(--color-data)'}}>{docente}</strong>
          </p>
          
          <div className="modal-actions-toggle">
            <button 
              className={`btn-modal-toggle ${!isRejecting ? 'active' : ''}`} 
              onClick={() => setIsRejecting(false)}
              disabled={isSubmitting}
            >
              <FaCheck /> APROBAR
            </button>
            <button 
              className={`btn-modal-toggle ${isRejecting ? 'active' : ''}`} 
              onClick={() => setIsRejecting(true)}
              disabled={isSubmitting}
            >
              <FaTimes /> RECHAZAR
            </button>
          </div>

          {/* Área de Observaciones */}
          <div className="form-group-modal verification-notes">
              <label htmlFor="observaciones" className="label-strong">{isRejecting ? 'MOTIVO DE RECHAZO (OBLIGATORIO)' : 'OBSERVACIONES (OPCIONAL)'}</label>
              <textarea
                id="observaciones"
                rows="3"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder={isRejecting ? "Ej: El DNI no es legible o el título es de una institución no reconocida." : "Notas internas sobre la verificación."}
                disabled={isSubmitting}
              />
          </div>
        </div>
        
        <footer className="admin-modal-footer">
          {error && <p className="error-message-modal">{error}</p>}
          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            CANCELAR
          </button>
          <button 
            className={`btn ${isRejecting ? 'btn-danger' : 'btn-primary'}`} 
            onClick={handleSubmit} 
            disabled={isSubmitting}>
            {isSubmitting ? <FaSpinner className="spin"/> : `CONFIRMAR ${actionText}`}
          </button>
        </footer>
      </div>
    </div>
  );
};


/**
 * Página principal para la cola de Verificaciones de Docentes
 */
const AdminVerificationPage = () => {
  const [allVerificaciones, setAllVerificaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('en_revision');
  const [selectedVerification, setSelectedVerification] = useState(null);

  const fetchVerificaciones = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllVerificaciones();
      setAllVerificaciones(data || []);
    } catch (err) {
      console.error("Error al cargar verificaciones:", err);
      setError("No se pudieron cargar las verificaciones.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchVerificaciones(); }, []);

  // Función de callback para el modal
  const handleConfirmAction = async (isRejecting, observaciones) => {
    const id = selectedVerification.id;
    try {
      if (isRejecting) {
        await rejectVerificacion(id, observaciones);
      } else {
        await approveVerificacion(id, observaciones);
      }
      fetchVerificaciones(); 
    } catch (err) {
      console.error("Error al confirmar acción:", err);
      throw err; 
    }
  };

  const verificacionesFiltradas = useMemo(() => {
    return allVerificaciones.filter(v => v.estado === filtroEstado);
  }, [allVerificaciones, filtroEstado]);

  // Limpia la ruta del archivo de la BD.
  const getCleanFilePath = (path) => path ? path.replace(/^uploads[\\/]/, '') : '';
  
  // Conteo de tabs
  const countState = (state) => allVerificaciones.filter(v => v.estado === state).length;


  // 1. Estado de Carga
  if (isLoading) {
    return (
      <div className="admin-page-state loading">
        <FaSpinner className="spin-icon" />
        <p>AUDITANDO REGISTROS DE DOCENTES...</p>
      </div>
    );
  }

  // 2. Estado de Error
  if (error) {
    return (
      <div className="admin-page-state error">
        <FaExclamationTriangle className="error-icon" />
        <h3>ERROR DE SINCORNIZACIÓN</h3>
        <p>{error}</p>
      </div>
    );
  }

return (
    <div className="admin-verification-page">
      <header className="admin-page-header">
        <h2>TERMINAL DE AUDITORÍA (DOCENTES)</h2>
        <p>Revisa, valida y sella los registros de identidad y credenciales de los postulantes.</p>
      </header>

      {/* --- Pestañas de Filtro --- */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-item ${filtroEstado === 'en_revision' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('en_revision')}
        >
          <FaClipboardList/> PENDIENTES ({countState('en_revision')})
        </button>
        <button
          className={`admin-tab-item ${filtroEstado === 'aprobado' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('aprobado')}
        >
          <FaCheckCircle/> APROBADOS ({countState('aprobado')})
        </button>
        <button
          className={`admin-tab-item ${filtroEstado === 'rechazado' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('rechazado')}
        >
          <FaTimesCircle/> RECHAZADOS ({countState('rechazado')})
        </button>
      </div>

      {/* --- Lista o Estado Vacío --- */}
      {verificacionesFiltradas.length === 0 ? (
        <div className="admin-empty-state">
          {filtroEstado === 'en_revision' ? <FaCheckCircle size="4em" /> : <FaUsers size="4em"/>}
          <h3>BANDEJA DE {filtroEstado.toUpperCase().replace('_', ' ')} LIMPIA</h3>
          <p>
            {filtroEstado === 'en_revision' 
              ? 'Todas las postulaciones han sido procesadas. Excelente trabajo.' 
              : `No hay registros ${filtroEstado}s actualmente.`}
          </p>
        </div>
      ) : (
        <div className="verification-list-container">
          {verificacionesFiltradas.map((v) => (
            <div key={v.id} className={`verification-card estado-${v.estado}`}>
              
              <div className="card-header-data">
                <h4>{v.docente_nombre}</h4>
                <div className={`status-pill status-${v.estado}`}>
                    {v.estado.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              <div className="card-docente-info">
                <span><FaEnvelope /> {v.docente_correo}</span>
                <span><FaClock /> Postuló: {new Date(v.fecha_postulacion).toLocaleDateString()}</span>
              </div>
              
              <div className="document-links-grid">
                <p className="grid-title"><FaShieldAlt/> DOCUMENTOS ESCANEADOS</p>
                
                {v.url_cv && <a href={`${API_BASE_URL}/files/${getCleanFilePath(v.url_cv)}`} target="_blank" rel="noopener noreferrer" className="btn-doc-link"><FaFilePdf /> CV (Hoja de Vida)</a>}
                
                {v.url_dni && <a href={`${API_BASE_URL}/files/${getCleanFilePath(v.url_dni)}`} target="_blank" rel="noopener noreferrer" className="btn-doc-link"><FaIdCard /> DNI / ID</a>}
                
                {v.url_titulo && <a href={`${API_BASE_URL}/files/${getCleanFilePath(v.url_titulo)}`} target="_blank" rel="noopener noreferrer" className="btn-doc-link"><FaGraduationCap /> TÍTULO / GRADO</a>}
              </div>
              
              {/* --- Mostrar notas finales --- */}
              {(v.estado === 'rechazado' || v.estado === 'aprobado') && v.observaciones_admin && (
                <div className={`admin-notes ${v.estado === 'rechazado' ? 'rejection-reason' : 'approval-notes'}`}>
                  <strong>{v.estado === 'rechazado' ? 'MOTIVO FINAL' : 'NOTAS DE AUDITORÍA'}</strong>
                  <p>{v.observaciones_admin}</p>
                </div>
              )}
              
              {/* Acciones solo para pendientes */}
              {v.estado === 'en_revision' && (
                <footer className="verification-card-actions">
                  <button 
                    className="btn-action btn-danger"
                    onClick={() => setSelectedVerification(v)}>
                    <FaTimes /> RECHAZAR
                  </button>
                  <button 
                    className="btn-action btn-primary"
                    onClick={() => setSelectedVerification(v)}>
                    <FaCheck /> APROBAR
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