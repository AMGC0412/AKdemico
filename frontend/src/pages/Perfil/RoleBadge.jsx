import React from 'react';
import { FaUserCheck } from 'react-icons/fa';

/**
 * Componente para mostrar la insignia de rol del usuario y estado de verificación.
 */
const RoleBadge = ({ rol, estadoVerificacion }) => {
    let text = rol;
    let className = `role-${rol}`;
    
    // Asignar texto y clase basado en el rol
    if (rol === 'estudiante') {
        text = 'Estudiante';
    } else if (rol === 'docente') {
        text = 'Docente';
    } else if (rol === 'administrador') {
        text = 'Administrador';
    }

    const esDocente = rol === 'docente';
    const esVerificado = estadoVerificacion === 'verificado';

    return (
        <div className="role-badge-container">
            <span className={`profile-role-badge ${className}`}>{text}</span>
            {esDocente && esVerificado && (
                <span className="profile-role-badge role-verificado" title="Docente Verificado">
                    <FaUserCheck /> Verificado
                </span>
            )}
        </div>
    );
};

export default RoleBadge;