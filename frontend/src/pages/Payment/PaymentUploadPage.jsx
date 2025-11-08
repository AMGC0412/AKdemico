import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { subirComprobante, obtenerEstadoPagoPorInscripcion } from '../../services/pagos.service.js';
import { useAuth } from '../../context/AuthContext';
import './PaymentUploadPage.css';
import { FaFileUpload, FaCheckCircle, FaTimesCircle, FaSpinner, FaEdit, FaExclamationTriangle, FaHourglassHalf, FaPaperclip } from 'react-icons/fa';

// --- Constantes ---
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
// -------------------

const PaymentUploadPage = () => {
    const { inscripcionId } = useParams();
    const { usuario } = useAuth();
    const navigate = useNavigate();

    // Estados UI
    const [archivoLocal, setArchivoLocal] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false); // Para subir/actualizar
    const [pageLoading, setPageLoading] = useState(true); // Para cargar estado inicial
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null); // Mensaje temporal de éxito
    const [isDragging, setIsDragging] = useState(false);

    // Estado del Pago desde Backend
    const [pagoActual, setPagoActual] = useState({
        existePago: false,
        estado: null,
        urlComprobante: null,
        observacionAdmin: null
    });

    // Estado para controlar explícitamente si se muestra el formulario
    const [modoEdicion, setModoEdicion] = useState(false);

    // Cargar estado inicial
    useEffect(() => {
        const cargarEstado = async () => {
            setPageLoading(true);
            setError(null);
            setExito(null); // Limpiar mensajes al cargar
            try {
                const data = await obtenerEstadoPagoPorInscripcion(inscripcionId);
                setPagoActual(data);
                // Mostrar formulario solo si NO existe pago O si está RECHAZADO
                setModoEdicion(!data.existePago || data.estado === 'rechazado');
            } catch (err) {
                setError("Error al cargar estado del pago.");
                console.error("Error useEffect:", err);
                setPagoActual({ existePago: false });
                setModoEdicion(true); // Permitir subir si hay error cargando
            } finally {
                setPageLoading(false);
            }
        };
        if (usuario?.rol === 'estudiante' && inscripcionId) {
             cargarEstado();
        } else {
             setPageLoading(false);
             if (!inscripcionId) setError("ID de inscripción no encontrado.");
        }
    }, [inscripcionId, usuario]);

    // Procesar archivo seleccionado/arrastrado
    const procesarArchivo = useCallback((file) => {
        // ... (Validaciones de tamaño y tipo igual que antes) ...
        setError(null); setExito(null); if (!file) { setArchivoLocal(null); setPreviewUrl(null); return; }
        if (file.size > MAX_FILE_SIZE_BYTES) { setError(`Máx ${MAX_FILE_SIZE_MB}MB.`); setArchivoLocal(null); setPreviewUrl(null); return; }
        if (!ALLOWED_MIME_TYPES.includes(file.type)) { setError('Solo JPG, PNG, PDF.'); setArchivoLocal(null); setPreviewUrl(null); return; }
        setArchivoLocal(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader(); reader.onloadend = () => { setPreviewUrl(reader.result); }; reader.readAsDataURL(file);
        } else { setPreviewUrl(null); }
    }, []);

    // Handlers Drag & Drop
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); if (!loading && modoEdicion) setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (loading || !modoEdicion) return;
        const file = e.dataTransfer.files[0];
        setArchivoLocal(null); setPreviewUrl(null); setError(null);
        procesarArchivo(file);
    };

    // Handler input file
    const handleFileChange = (event) => { procesarArchivo(event.target.files[0]); };

    // Handler envío de formulario
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!archivoLocal) { setError('Selecciona o arrastra un archivo.'); return; }
        setLoading(true); setError(null); setExito(null);

        const formData = new FormData();
        formData.append('comprobante', archivoLocal);

        try {
            const respuesta = await subirComprobante(inscripcionId, formData);
            setExito(respuesta.mensaje || 'Acción completada.');
            setArchivoLocal(null); setPreviewUrl(null);

            // Actualizar estado local y salir del modo edición
            setPagoActual(prev => ({
                ...prev,
                existePago: true,
                estado: 'pendiente', // Siempre queda pendiente
                observacionAdmin: null,
                // Idealmente, el backend devolvería la nueva urlComprobante aquí
            }));
            setModoEdicion(false); // Ocultar formulario

        } catch (err) {
            setError(err.mensaje || 'Error al subir el comprobante.');
            console.error("Error handleSubmit:", err);
        } finally {
            setLoading(false);
        }
    };

    // Handler para activar modo edición (botón "Cambiar Archivo")
    const activarModoEdicion = () => {
        setModoEdicion(true);
        setArchivoLocal(null); setPreviewUrl(null); setError(null); setExito(null);
    };

    // --- Renderizado ---
    if (!usuario || usuario.rol !== 'estudiante') { return <Navigate to="/login" replace />; }
    if (pageLoading) return <div className="page-loading">Cargando estado del pago...</div>;

    return (
        <div className="payment-upload-page styled">
            <div className={`upload-container styled ${isDragging ? 'dragging' : ''}`}>
                <h2>Comprobante de Pago</h2>
                <p>Inscripción #{inscripcionId}</p>

                {/* --- Mostrar Estado Actual o Mensaje Temporal de Éxito --- */}
                {exito && <div className="message success"><FaCheckCircle /> {exito}</div>}

                {!modoEdicion && pagoActual.existePago && !exito && (
                    <div className="estado-actual">
                        {pagoActual.estado === 'validado' && (
                            <div className="message success"><FaCheckCircle /> Pago Validado. Inscripción confirmada.</div>
                        )}
                        {pagoActual.estado === 'pendiente' && (
                            <>
                                <div className="message info"><FaHourglassHalf /> Comprobante en revisión.</div>
                                {pagoActual.urlComprobante && (
                                     <a href={`http://localhost:4000/files/${pagoActual.urlComprobante}`} target="_blank" rel="noopener noreferrer" className="link-ver-comprobante">
                                        <FaPaperclip/> Ver comprobante actual
                                     </a>
                                )}
                                <button onClick={activarModoEdicion} className="btn btn-secondary btn-cambiar">
                                    <FaEdit /> Cambiar Archivo
                                </button>
                            </>
                        )}
                         {/* El estado 'rechazado' fuerza modoEdicion=true, no se muestra aquí */}
                    </div>
                )}

                {/* --- Mostrar Formulario de Subida (si aplica) --- */}
                {modoEdicion && !exito && ( // Mostrar formulario si estamos en modo edición Y no hubo éxito reciente
                    <>
                        {pagoActual.estado === 'rechazado' && (
                            <div className="message error">
                                <FaExclamationTriangle /> Pago Rechazado. Motivo: {pagoActual.observacionAdmin || 'Sin motivo.'} Por favor, sube un nuevo comprobante.
                            </div>
                        )}
                        {/* Mensaje de error de validación local */}
                        {error && <div className="message error"><FaTimesCircle /> {error}</div>}

                        <form onSubmit={handleSubmit} className="upload-form">
                            <div
                                className={`form-group file-drop-zone ${isDragging ? 'dragging' : ''} ${archivoLocal ? 'has-file' : ''}`}
                                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver} onDrop={handleDrop}
                                onClick={() => document.getElementById('comprobante-input')?.click()}
                            >
                                <FaFileUpload className="drop-icon" />
                                <span className="file-label styled">
                                    {archivoLocal ? archivoLocal.name : (isDragging ? '¡Suelta aquí!' : 'Arrastra o haz clic')}
                                </span>
                                <input type="file" id="comprobante-input" accept={ALLOWED_MIME_TYPES.join(',')} onChange={handleFileChange} disabled={loading} style={{ display: 'none' }} />
                                {!archivoLocal && <span className="file-instructions">(JPG, PNG, PDF - Máx {MAX_FILE_SIZE_MB}MB)</span>}
                                {archivoLocal && !previewUrl && <p className="pdf-info">PDF: {archivoLocal.name}</p>}
                            </div>

                            {previewUrl && (
                                <div className="image-preview styled">
                                    <img src={previewUrl} alt="Vista previa" />
                                </div>
                            )}

                            <button type="submit" className={`btn btn-primary btn-full ${loading || !archivoLocal ? 'disabled-like' : ''}`} disabled={loading || !archivoLocal}>
                                {loading ? <><FaSpinner className="spinner" /> Subiendo...</> : (pagoActual.existePago && pagoActual.estado !== 'rechazado' ? 'Actualizar Comprobante' : 'Enviar Comprobante')}
                            </button>
                            {/* Botón para cancelar la edición si ya existía un pago pendiente */}
                            {pagoActual.existePago && pagoActual.estado === 'pendiente' && (
                                <button type="button" onClick={() => setModoEdicion(false)} className="btn btn-link btn-cancelar-cambio">
                                    Cancelar cambio
                                </button>
                            )}
                        </form>
                    </>
                )}

                 <div className="back-link styled">
                     <Link to="/mis-inscripciones">Ir a Mis Inscripciones</Link>
                 </div>
            </div>
        </div>
    );
};

export default PaymentUploadPage;