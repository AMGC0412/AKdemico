import React, { useState, useEffect } from 'react';
import { obtenerPagosPendientes, validarPago } from '../../services/pagos.service.js';
import './DocentePagosPage.css'; 
import { 
    FaMoneyBillWave, FaCheck, FaTimes, FaSpinner, FaEye, 
    FaCalendarAlt, FaUserGraduate, FaReceipt, FaBarcode, FaHashtag 
} from 'react-icons/fa';

const DocentePagosPage = () => {
    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); 
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [imagenModal, setImagenModal] = useState(null);

    const cargarData = async () => {
        setLoading(true);
        try {
            const data = await obtenerPagosPendientes();
            setPagos(data);
        } catch (err) {
            setError("Error de conexión al cargar pagos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarData(); }, []);

    const procesar = async (id, accion) => {
        const esAprobar = accion === 'aprobar';
        let obs = '';

        if (!esAprobar) {
            obs = prompt("Motivo del rechazo (Obligatorio):");
            if (!obs) return alert("El motivo es obligatorio.");
        } else {
            if (!confirm("¿Validar este pago y activar la inscripción?")) return;
        }

        setActionLoading(id);
        try {
            await validarPago(id, { 
                estado: esAprobar ? 'validado' : 'rechazado', 
                observacion: obs 
            });
            setMensaje(esAprobar ? "¡Transacción aprobada con éxito!" : "Transacción rechazada.");
            setPagos(prev => prev.filter(p => p.pago_id !== id)); 
        } catch (err) {
            alert(err.mensaje || "Error al procesar.");
        } finally {
            setActionLoading(null);
            setTimeout(() => setMensaje(null), 4000);
        }
    };

    return (
        <div className="pagos-page-wrapper">
            <div className="cyber-grid-bg"></div>
            
            <div className="pagos-container">
                {/* HEADER */}
                <header className="pagos-header">
                    <div className="header-glow"></div>
                    <div className="header-content">
                        <div className="icon-box">
                            <FaMoneyBillWave />
                        </div>
                        <div className="title-box">
                            <h1>Validación de Tesorería</h1>
                            <p>Centro de control de transacciones entrantes.</p>
                        </div>
                        <div className="stats-box">
                            <span className="stat-label">COLA DE REVISIÓN</span>
                            <span className="stat-number">{pagos.length}</span>
                        </div>
                    </div>
                </header>

                {/* NOTIFICACIONES */}
                {mensaje && (
                    <div className={`cyber-toast ${mensaje.includes('rechazada') ? 'warning' : 'success'}`}>
                        <div className="toast-icon">
                            {mensaje.includes('rechazada') ? <FaTimes /> : <FaCheck />}
                        </div>
                        <span>{mensaje}</span>
                    </div>
                )}

                {/* CONTENIDO */}
                {loading ? (
                    <div className="loader-cyber">
                        <FaSpinner className="spin-icon" />
                        <p>ESCANEANDO TRANSACCIONES...</p>
                    </div>
                ) : pagos.length === 0 ? (
                    <div className="empty-state-cyber">
                        <div className="empty-icon"><FaCheck /></div>
                        <h3>Bandeja Sincronizada</h3>
                        <p>No hay operaciones pendientes en este momento.</p>
                    </div>
                ) : (
                    <div className="tickets-grid">
                        {pagos.map((p, index) => (
                            <div 
                                key={p.pago_id} 
                                className={`cyber-ticket ${actionLoading === p.pago_id ? 'processing' : ''}`}
                                style={{ animationDelay: `${index * 0.1}s` }} 
                            >
                                {/* CINTA DE ESTADO */}
                                <div className="ticket-status-bar"></div>

                                {/* CABECERA TICKET */}
                                <div className="ticket-header">
                                    <div className="amount-group">
                                        <span className="currency">S/</span>
                                        <span className="value">{Number(p.monto).toFixed(2)}</span>
                                    </div>
                                    <div className="id-badge">
                                        <FaHashtag /> {p.pago_id.toString().padStart(4, '0')}
                                    </div>
                                </div>

                                {/* CUERPO TICKET */}
                                <div className="ticket-body">
                                    <div className="info-group">
                                        <label><FaUserGraduate /> ALUMNO</label>
                                        <div className="info-value highlight">{p.estudiante_nombre}</div>
                                        <div className="info-sub">{p.estudiante_correo}</div>
                                    </div>

                                    <div className="info-group">
                                        <label><FaBarcode /> CONCEPTO</label>
                                        <div className="info-value">{p.curso_titulo}</div>
                                    </div>

                                    <div className="info-meta">
                                        <span><FaCalendarAlt /> {new Date(p.fecha_subida).toLocaleDateString()}</span>
                                        <span className="status-dot">PENDIENTE</span>
                                    </div>

                                    <button 
                                        className="btn-evidence"
                                        onClick={() => setImagenModal(p.comprobante_url)}
                                    >
                                        <FaReceipt /> <span>VER EVIDENCIA</span> <FaEye className="eye" />
                                    </button>
                                </div>

                                {/* ACCIONES (PIE DEL TICKET) */}
                                <div className="ticket-footer">
                                    <button 
                                        className="action-btn reject"
                                        disabled={actionLoading === p.pago_id}
                                        onClick={() => procesar(p.pago_id, 'rechazar')}
                                    >
                                        RECHAZAR
                                    </button>
                                    <button 
                                        className="action-btn approve"
                                        disabled={actionLoading === p.pago_id}
                                        onClick={() => procesar(p.pago_id, 'aprobar')}
                                    >
                                        {actionLoading === p.pago_id ? <FaSpinner className="spin-icon"/> : 'AUTORIZAR'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* LIGHTBOX DE ALTA DEFINICIÓN */}
            {imagenModal && (
                <div className="cyber-modal-overlay" onClick={() => setImagenModal(null)}>
                    <div className="cyber-modal-window" onClick={e => e.stopPropagation()}>
                        <div className="cyber-modal-header">
                            <h4>EVIDENCIA DIGITAL</h4>
                            <button onClick={() => setImagenModal(null)}><FaTimes/></button>
                        </div>
                        <div className="cyber-modal-content">
                            <img src={`http://localhost:4000/files/${imagenModal}`} alt="Comprobante" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocentePagosPage;