import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { obtenerPagosPendientes, validarPago } from '../../services/pagos.service.js';
import './DocentePagosPage.css'; // Importamos el CSS de este módulo
import { FaCreditCard, FaCheck, FaTimes, FaSpinner, FaPaperclip, FaHourglassHalf, FaCalendarAlt, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

const DocentePagosPage = () => {
    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Función para cargar/recargar la lista de pagos
    const cargarPagos = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerPagosPendientes();
            setPagos(data);
        } catch (err) {
            setError(err.mensaje || "Error al cargar los pagos pendientes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarPagos();
    }, []);

    // Función para validar/rechazar el pago
    const handleValidarRechazar = async (pagoId, accion) => {
        const estado = accion === 'aprobar' ? 'validado' : 'rechazado';
        let observacion = '';

        // Si la acción es rechazar, solicitamos un motivo al docente
        if (accion === 'rechazar') {
             observacion = window.prompt('Escribe el motivo del rechazo (obligatorio si rechazas):');
             if (!observacion) {
                 setError('Debes proporcionar un motivo para rechazar el pago.');
                 return;
             }
        }
        
        if (!window.confirm(`¿Confirmas que deseas ${estado.toUpperCase()} este pago?`)) {
            return;
        }

        setLoading(true); // Bloquear UI
        setSuccessMessage(null);
        setError(null);

        try {
            const respuesta = await validarPago(pagoId, { estado, observacion });
            setSuccessMessage(respuesta.mensaje || `Pago ${estado} exitosamente.`);
            
            // Recargar la lista para eliminar el pago procesado
            await cargarPagos(); 

        } catch (err) {
            setError(err.mensaje || "No se pudo procesar la solicitud.");
        } finally {
            setLoading(false);
            // Limpiar mensaje después de un tiempo
            setTimeout(() => setSuccessMessage(null), 4000);
        }
    };

    if (loading && pagos.length === 0) return <div className="page-loading"><FaSpinner className="spinner" /> Cargando lista de pagos...</div>;

    return (
        <div className="docente-pagos-page page-container">
            <div className="page-header-actions">
                <h1><FaCreditCard /> Validación de Pagos</h1>
                <p className="page-summary">Revisa los comprobantes de pago subidos por tus estudiantes y valida la transacción.</p>
            </div>
            
            {error && <div className="message error"><FaTimesCircle /> {error}</div>}
            {successMessage && <div className="message success"><FaCheckCircle /> {successMessage}</div>}
            
            {pagos.length === 0 && !loading ? (
                 <div className="no-data-box frosted-glass">
                    <h3><FaCheckCircle /> No hay pagos pendientes de revisión.</h3>
                    <p>¡Todo está al día!</p>
                 </div>
            ) : (
                <div className="pagos-list-grid">
                    {pagos.map(pago => (
                        <div key={pago.pago_id} className="pago-card frosted-glass">
                            <div className="pago-header">
                                <span className="pago-status-pending"><FaHourglassHalf /> Pendiente</span>
                                <span className="pago-monto">S/ {Number(pago.monto).toFixed(2)}</span>
                            </div>
                            
                            <div className="pago-details">
                                <p><strong>Estudiante:</strong> {pago.estudiante_nombre} ({pago.estudiante_correo})</p>
                                <p><strong>Curso:</strong> {pago.curso_titulo}</p>
                                <p><strong>Inscripción:</strong> #{pago.inscripcion_id}</p>
                                <p className="fecha-subida"><FaCalendarAlt /> Subido el: {new Date(pago.fecha_subida).toLocaleDateString()}</p>
                                
                                {pago.comprobante_url && (
                                    // Servimos el archivo usando la ruta estática del backend /files
                                    <a href={`http://localhost:4000/files/${pago.comprobante_url}`} target="_blank" rel="noopener noreferrer" className="btn-comprobante-link">
                                        <FaPaperclip /> Ver Comprobante
                                    </a>
                                )}
                            </div>
                            
                            <div className="pago-acciones">
                                <button 
                                    onClick={() => handleValidarRechazar(pago.pago_id, 'aprobar')} 
                                    className="btn btn-primary btn-accion-sm"
                                    disabled={loading}
                                >
                                    <FaCheck /> Aprobar
                                </button>
                                <button 
                                    onClick={() => handleValidarRechazar(pago.pago_id, 'rechazar')} 
                                    className="btn btn-danger btn-accion-sm"
                                    disabled={loading}
                                >
                                    <FaTimes /> Rechazar
                                </button>
                            </div>
                            
                        </div>
                    ))}
                </div>
            )}

            {/* Spinner global (solo si la lista ya cargó y está haciendo una acción) */}
            {loading && pagos.length > 0 && (
                <div className="overlay-spinner">
                    <FaSpinner className="spinner" size={40} />
                </div>
            )}
        </div>
    );
};

export default DocentePagosPage;