/* Archivo: PaymentUploadPage.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { subirComprobante, obtenerEstadoPagoPorInscripcion } from '../../services/pagos.service.js';
import { cancelarInscripcion } from '../../services/inscripcion.service.js';
import { useAuth } from '../../context/AuthContext';
import './PaymentUploadPage.css'; // Estilos Ultimate
import { 
    FaFileUpload, FaCheckCircle, FaTimesCircle, FaSpinner, FaEdit, 
    FaExclamationTriangle, FaHourglassHalf, FaPaperclip, FaArrowLeft, 
    FaMoneyBillWave, FaTrashAlt, FaShieldAlt
} from 'react-icons/fa';

// Configuración
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const PaymentUploadPage = () => {
    const { inscripcionId } = useParams();
    const { usuario } = useAuth();
    const navigate = useNavigate();

    // UI States
    const [archivoLocal, setArchivoLocal] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Data State
    const [pagoActual, setPagoActual] = useState({
        existePago: false, estado: null, urlComprobante: null, observacionAdmin: null
    });
    const [modoEdicion, setModoEdicion] = useState(false);

    // 1. Init Data
    useEffect(() => {
        const cargarEstado = async () => {
            setPageLoading(true); 
            setError(null);
            try {
                const data = await obtenerEstadoPagoPorInscripcion(inscripcionId);
                setPagoActual(data);
                setModoEdicion(!data.existePago || data.estado === 'rechazado');
            } catch (err) {
                setError("Error de conexión con la terminal de pagos.");
                setPagoActual({ existePago: false });
                setModoEdicion(true);
            } finally {
                setPageLoading(false);
            }
        };

        // CORRECCIÓN: Ajustar la verificación del rol según tu nueva estructura de BD
        const esEstudiante = usuario?.roles?.includes('estudiante') || usuario?.rol === 'estudiante';
        
        if (esEstudiante && inscripcionId) {
            cargarEstado();
        } else {
            setPageLoading(false);
        }
    }, [inscripcionId, usuario]);

    // 2. File Handling
    const procesarArchivo = useCallback((file) => {
        setError(null); setExito(null); 
        if (!file) { setArchivoLocal(null); setPreviewUrl(null); return; }
        
        if (file.size > MAX_FILE_SIZE_BYTES) { 
            setError(`ERROR: TAMAÑO EXCEDE ${MAX_FILE_SIZE_MB}MB.`); return; 
        }
        if (!ALLOWED_MIME_TYPES.includes(file.type)) { 
            setError('ERROR: FORMATO INVÁLIDO. SOLO JPG, PNG, PDF.'); return; 
        }
        
        setArchivoLocal(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader(); 
            reader.onloadend = () => setPreviewUrl(reader.result); 
            reader.readAsDataURL(file);
        } else { setPreviewUrl(null); }
    }, []);

    // 3. Drag & Drop Events
    const handleDrag = (e, active) => { e.preventDefault(); e.stopPropagation(); setIsDragging(active); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (loading || !modoEdicion) return;
        procesarArchivo(e.dataTransfer.files[0]);
    };

    // 4. Actions
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!archivoLocal) { setError('REQUERIDO: SELECCIONAR ARCHIVO.'); return; }
        setLoading(true); setError(null); setExito(null);

        const formData = new FormData();
        formData.append('comprobante', archivoLocal);

        try {
            const res = await subirComprobante(inscripcionId, formData);
            setExito(res.mensaje || 'VOUCHER TRANSMITIDO CON ÉXITO.');
            setArchivoLocal(null); setPreviewUrl(null);
            setPagoActual(prev => ({ ...prev, existePago: true, estado: 'pendiente', observacionAdmin: null }));
            setModoEdicion(false);
        } catch (err) {
            setError(err.mensaje || 'FALLO EN TRANSMISIÓN DE DATOS.');
        } finally { setLoading(false); }
    };

    const handleCancelar = async () => {
        if (!window.confirm("ATENCIÓN: Se eliminará el voucher y se liberará el cupo. ¿Confirmar anulación?")) return;
        setCancelling(true); setError(null);
        try {
            await cancelarInscripcion(inscripcionId);
            alert("INSCRIPCIÓN ANULADA CORRECTAMENTE.");
            navigate('/estudiante/cursos');
        } catch (err) {
            setError(err.mensaje || "ERROR CRÍTICO AL CANCELAR.");
            setCancelling(false);
        }
    };

    if (!usuario || !usuario.roles?.includes('estudiante')) return <Navigate to="/auth/login" replace />;

    return (
        <div className="payment-page-layout">
            <div className="pay-terminal-panel">
                
                {/* Header Técnico */}
                <div className="pay-header">
                    <div className="pay-header-icon-box">
                        <FaShieldAlt />
                    </div>
                    <div className="pay-title-group">
                        <h2>Validación de Pago</h2>
                        <span className="pay-id-label">ID TRANSACCIÓN:</span>
                        <span className="pay-id-badge">#{inscripcionId}</span>
                    </div>
                </div>

                {/* Loader */}
                {pageLoading && (
                    <div className="pay-loader">
                        <FaSpinner className="fa-spin" />
                        <p>ESTABLECIENDO ENLACE SEGURO...</p>
                    </div>
                )}

                {/* Contenido */}
                {!pageLoading && (
                    <div className="pay-content">
                        
                        {/* Alertas */}
                        {exito && <div className="pay-alert success"><FaCheckCircle /> {exito}</div>}
                        {error && <div className="pay-alert error"><FaTimesCircle /> {error}</div>}

                        {/* --- VISTA: ESTADO ACTUAL (Holograma) --- */}
                        {!modoEdicion && pagoActual.existePago && (
                            <div className={`pay-status-hologram status-${pagoActual.estado}`}>
                                {pagoActual.estado === 'validado' ? (
                                    <>
                                        <FaCheckCircle className="pay-status-icon" />
                                        <h3>ACCESO AUTORIZADO</h3>
                                        <p className="status-text">Transacción completada. Inscripción activa.</p>
                                    </>
                                ) : (
                                    <>
                                        <FaHourglassHalf className="pay-status-icon fa-spin-slow" />
                                        <h3>ESTADO: PENDIENTE PAGO</h3>
                                        <p className="status-text">El sistema está validando la integridad del comprobante.</p>
                                        
                                        <div className="pay-hologram-actions">
                                            {pagoActual.urlComprobante && (
                                                <a href={`http://localhost:4000/files/${pagoActual.urlComprobante}`} target="_blank" rel="noreferrer" className="pay-btn-secondary">
                                                    <FaPaperclip /> VER ARCHIVO
                                                </a>
                                            )}
                                            <button onClick={() => { setModoEdicion(true); setExito(null); }} className="pay-btn-secondary">
                                                <FaEdit /> MODIFICAR
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* --- VISTA: FORMULARIO DE CARGA (Dropzone) --- */}
                        {modoEdicion && (
                            <form onSubmit={handleSubmit} className="cyber-form">
                                {pagoActual.estado === 'rechazado' && (
                                    <div className="pay-alert error">
                                        <FaExclamationTriangle /> RECHAZADO: {pagoActual.observacionAdmin || 'Archivo ilegible'}
                                    </div>
                                )}

                                <div
                                    className={`pay-dropzone ${isDragging ? 'dragging' : ''} ${archivoLocal ? 'has-file' : ''}`}
                                    onDragEnter={(e) => handleDrag(e, true)}
                                    onDragLeave={(e) => handleDrag(e, false)}
                                    onDragOver={(e) => handleDrag(e, true)}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('file-upload').click()}
                                >
                                    <input type="file" id="file-upload" accept={ALLOWED_MIME_TYPES.join(',')} onChange={(e) => procesarArchivo(e.target.files[0])} disabled={loading} hidden />
                                    
                                    <FaFileUpload className="pay-upload-icon" />
                                    
                                    {archivoLocal ? (
                                        <div className="pay-file-preview">
                                            <span className="pay-filename">{archivoLocal.name}</span>
                                            <span className="pay-filesize">{(archivoLocal.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="pay-label-main">INICIAR SECUENCIA DE CARGA</span>
                                            <span className="pay-label-sub">Arrastre archivo o click para interfaz</span>
                                            <span className="pay-label-meta">JPG :: PNG :: PDF</span>
                                        </>
                                    )}
                                </div>

                                {previewUrl && (
                                    <div className="pay-img-preview">
                                        <img src={previewUrl} alt="Vista Previa" />
                                    </div>
                                )}

                                <div className="pay-actions-grid">
                                    <button type="submit" className="pay-btn pay-btn-primary" disabled={loading || !archivoLocal}>
                                        {loading ? <><FaSpinner className="fa-spin"/> TRANSMITIENDO...</> : <><FaMoneyBillWave/> SUBIR COMPROBANTE</>}
                                    </button>
                                    
                                    {pagoActual.existePago && pagoActual.estado === 'pendiente' && (
                                        <button type="button" onClick={() => setModoEdicion(false)} className="pay-btn-text">
                                            Cancelar Edición
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}

                        {/* --- BOTÓN DESTRUCTIVO (Siempre visible si no validado) --- */}
                        {pagoActual.estado !== 'validado' && (
                            <div className="pay-actions-grid">
                                <button onClick={handleCancelar} className="pay-btn pay-btn-danger" disabled={loading || cancelling}>
                                    {cancelling ? <><FaSpinner className="fa-spin"/> ANULANDO...</> : <><FaTrashAlt /> CANCELAR INSCRIPCIÓN</>}
                                </button>
                            </div>
                        )}

                    </div>
                )}

                <div className="pay-footer">
                    <Link to="/estudiante/cursos" className="pay-back-link">
                        <FaArrowLeft /> RETORNAR AL PANEL
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentUploadPage;