import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import './DocenteDashboardPage.css'; 
import { FaUserCheck, FaBookOpen, FaCalendarAlt, FaCreditCard, FaUserEdit, FaExclamationTriangle, FaTimesCircle, FaRegCheckCircle, FaLock } from 'react-icons/fa'; // Añadido FaLock

// --- LÓGICA DE CARDS CORREGIDA ---
const dashboardItems = (verificationStatus) => {
    const isVerified = verificationStatus === 'verificado';
    
    return [
        {
            title: 'Verificación de Perfil',
            status: verificationStatus,
            icon: FaUserCheck,
            description: 'Revisa el estado de tu postulación y documentos.',
            link: '/docente/verificacion',
            buttonText: isVerified ? 'Verificado' : 'Postular / Revisar',
            // --- CAMBIO AQUÍ ---
            // El botón ahora siempre será morado (secundario)
            buttonClass: 'btn-secondary',
            // --------------------
            isDisabled: false, // Este card nunca se deshabilita
        },
        {
            title: 'Mis Cursos y Planes',
            icon: FaBookOpen,
            description: 'Crea, edita y publica tus planes de estudio y lotes.',
            link: '/docente/cursos',
            buttonText: 'Gestionar Cursos',
            buttonClass: 'btn-secondary', // Botón morado
            isDisabled: !isVerified, // Deshabilitado si no está verificado
        },
        {
            title: 'Disponibilidad y Horarios',
            icon: FaCalendarAlt,
            description: 'Define tu franja horaria semanal para recibir reservas.',
            link: '/docente/horarios',
            buttonText: 'Ajustar Horario',
            buttonClass: 'btn-secondary', // Botón morado
            isDisabled: !isVerified,
        },
        {
            title: 'Pagos Pendientes',
            icon: FaCreditCard,
            description: 'Valida los comprobantes de pago de tus estudiantes.',
            link: '/docente/pagos',
            buttonText: 'Validar Pagos',
            buttonClass: 'btn-secondary', // Botón morado
            isDisabled: !isVerified,
        },
    ];
};
// ---------------------------------


// Componente Card (lógica de deshabilitado actualizada)
const DashboardCard = ({ item }) => (
    <div className={`dashboard-card styled ${item.isDisabled ? 'card-disabled' : ''}`}>
        <item.icon className="card-icon" size={30} />
        <h4>{item.title}</h4>
        <p>{item.description}</p>
        <Link 
            to={!item.isDisabled ? item.link : '#'} 
            className={`btn ${item.buttonClass} btn-dashboard ${item.isDisabled ? 'btn-disabled' : ''}`}
            // Prevenir clic si está deshabilitado
            onClick={(e) => item.isDisabled && e.preventDefault()} 
        >
            {item.buttonText}
        </Link>
        {/* Badge de estado (opcional, solo para el primer card) */}
        {item.status && item.title === 'Verificación de Perfil' && (
             <span className={`status-badge status-${item.status}`}>
                 {item.status.toUpperCase()}
             </span>
        )}
        {/* Overlay de deshabilitado (más limpio) */}
        {item.isDisabled && (
            <div className="card-disabled-overlay">
                <FaLock />
                <span>Requiere Verificación</span>
            </div>
        )}
    </div>
);


const DocenteDashboardPage = () => {
    const { usuario, loading } = useAuth();
    
    // El 'usuario' del AuthContext AHORA SÍ tiene 'estado_verificacion'
    // gracias a la corrección del backend (users.controller.js)
    const verificationStatus = usuario?.estado_verificacion || 'no_aplica';

    if (loading) return <div className="page-loading">Cargando...</div>;
    
    if (!usuario || usuario.rol !== 'docente') {
        return <Navigate to="/" replace />; 
    }

    const items = dashboardItems(verificationStatus);

    let AlertaComponent = null;
    if (verificationStatus === 'pendiente') {
        AlertaComponent = (
            <div className="alert alert-warning">
                <FaExclamationTriangle /> Tu perfil está **en revisión**. Las funciones de publicación están limitadas.
            </div>
        );
    } else if (verificationStatus === 'rechazado') {
        AlertaComponent = (
            <div className="alert alert-error">
                <FaTimesCircle /> Tu postulación fue **rechazada**. Revisa tus documentos en la sección de Verificación.
            </div>
        );
    } else if (verificationStatus === 'no_aplica') {
         AlertaComponent = (
            <div className="alert alert-info">
                <FaUserCheck /> ¡Bienvenido! El primer paso es **completar tu postulación** en "Verificación de Perfil".
            </div>
        );
    }

    return (
        <div className="dashboard-page styled">

            <section className="dashboard-header-styled">
                <div className="header-info">
                    <h1 className="welcome-header">Bienvenido, {usuario.nombre}!</h1>
                    <p className="dashboard-summary">Panel de control de tu actividad docente. Accede a todas tus herramientas.</p>
                </div>
                 <div className="header-status">
                    <span className="status-label">Estado de Verificación</span>
                    <div className={`status-box status-${verificationStatus}`}>
                        {verificationStatus === 'verificado' ? <FaRegCheckCircle /> : <FaTimesCircle />}
                        {verificationStatus.replace('_', ' ').toUpperCase()}
                    </div>
                </div>
            </section>
            
            {AlertaComponent}

            <div className="dashboard-grid">
                {items.map((item, index) => (
                    <DashboardCard key={index} item={item} />
                ))}
            </div>

             <div className="quick-link-perfil">
                <Link to="/perfil" className="btn btn-tertiary">
                    <FaUserEdit /> Editar mi Información Personal
                </Link>
             </div>

        </div>
    );
};

export default DocenteDashboardPage;