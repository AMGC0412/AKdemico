/* Archivo: ViewProfileDetails.jsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaHourglassHalf, FaExclamationTriangle } from 'react-icons/fa';

/**
 * Muestra los detalles del perfil en modo "solo lectura".
 * [MODIFICADO] Lógica corregida para mostrar estado de verificación solo al dueño.
 */
const ViewProfileDetails = ({ usuario, esPropietario }) => {
    
    // Tarjeta de Estado de Verificación para Docentes
    const renderVerificationStatus = () => {
        // 1. Si no es docente, no mostrar nada.
        // 2. [NUEVA LÓGICA] Si NO es el propietario, tampoco mostrar nada (privacidad).
        if (usuario.rol !== 'docente' || !esPropietario) return null;
        
        switch (usuario.estado_verificacion) {
            case 'verificado':
                return (
                    <div className="verification-status-card status-verificado">
                        <FaCheckCircle className="icon" />
                        <div>
                            <h4>¡Perfil Verificado!</h4>
                            <p>Tu perfil de docente está aprobado y es visible para los estudiantes.</p>
                        </div>
                    </div>
                );
            case 'pendiente':
                return (
                    <div className="verification-status-card status-pendiente">
                        <FaHourglassHalf className="icon" />
                        <div>
                            <h4>Verificación Pendiente</h4>
                            <p>Tu postulación está siendo revisada por nuestro equipo. Te notificaremos pronto.</p>
                        </div>
                    </div>
                );
            case 'rechazado':
                return (
                    <div className="verification-status-card status-rechazado">
                        <FaExclamationTriangle className="icon" />
                        <div>
                            <h4>Verificación Rechazada</h4>
                            <p>Hubo un problema con tu postulación. Revisa tu correo o contacta a soporte.</p>
                        </div>
                    </div>
                );
            case 'no_aplica':
            default:
                 return (
                    <div className="verification-status-card status-rechazado">
                        <FaExclamationTriangle className="icon" />
                        <div>
                            <h4>Postulación Requerida</h4>
                            <p>Aún no has completado tu postulación de docente. ¡Hazlo para empezar a enseñar!</p>
                            
                            <Link to="/docente/verificacion" className="btn btn-primary" style={{marginTop: '1rem'}}>
                                Postular Ahora
                            </Link>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="profile-details-view">
            <dl>
                <div className="detail-item-group">
                    <dt>Correo Electrónico</dt>
                    {/* Oculta el correo si no eres propietario */}
                    <dd>{esPropietario ? usuario.correo : <em>Información privada</em>}</dd>
                </div>
                
                <div className="detail-item-group">
                    <dt>Ubicación</dt>
                    <dd>{usuario.ciudad || <em>No especificada</em>}</dd>
                </div>
                
                <div className="detail-item-group">
                    <dt>Biografía</dt>
                    <dd className="bio-text">{usuario.biografia || <em>No hay biografía disponible.</em>}</dd>
                </div>
            </dl>
            
            {/* Solo se renderizará si eres docente Y el dueño del perfil */}
            {renderVerificationStatus()}
        </div>
    );
};

export default ViewProfileDetails;