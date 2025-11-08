import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaHourglassHalf, FaExclamationTriangle } from 'react-icons/fa';

/**
 * Muestra los detalles del perfil en modo "solo lectura".
 * Incluye la tarjeta de estado de verificación para docentes.
 */
const ViewProfileDetails = ({ usuario }) => {
    
    // Tarjeta de Estado de Verificación para Docentes
    const renderVerificationStatus = () => {
        if (usuario.rol !== 'docente') return null;
        
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
                            {/* Este enlace asume que tienes la ruta en App.jsx */}
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
                <dt>Correo Electrónico</dt>
                <dd>{usuario.correo}</dd>
                
                <dt>Ciudad</dt>
                <dd>{usuario.ciudad || <em>No especificada</em>}</dd>
                
                <dt>Biografía</dt>
                <dd className="bio-text">{usuario.biografia || <em>No has añadido una biografía.</em>}</dd>
            </dl>
            
            {/* Renderiza la tarjeta de estado del docente */}
            {renderVerificationStatus()}
        </div>
    );
};

export default ViewProfileDetails;