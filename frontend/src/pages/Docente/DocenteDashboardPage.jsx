/* Archivo: src/pages/Docente/DocenteDashboardPage.jsx */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
// [IMPORTACIÓN CORRECTA]
import { obtenerEstadisticasDocente } from '../../services/dashboard.service'; 
import { Navigate, Link } from 'react-router-dom';
import './DocenteDashboardPage.css'; // Estilos Ultra Elite
import { 
    FaBookOpen, FaCalendarAlt, FaCreditCard, 
    FaExclamationTriangle, FaTimesCircle, FaCheckCircle, 
    FaSpinner, FaArrowRight, FaLock, FaUsers, FaChartLine, FaUniversity, FaLayerGroup, FaStar 
} from 'react-icons/fa';

/* --- CONFIGURACIÓN DE UI POR ESTADO (Strategy Pattern) --- */
const UI_CONFIG = {
    verificado: {
        text: 'CUENTA VERIFICADA',
        icon: FaCheckCircle,
        style: 'status-verificado'
    },
    pendiente: {
        text: 'VALIDACIÓN PENDIENTE',
        icon: FaSpinner,
        style: 'status-pendiente',
        alertClass: 'alert-pendiente',
        title: 'Documentación en Revisión',
        desc: 'Tus credenciales están siendo analizadas por nuestro equipo académico. Te notificaremos vía email en cuanto el proceso finalice.',
        btnText: 'Consultar Estado',
        btnLink: '/docente/verificacion',
        spin: true
    },
    rechazado: {
        text: 'ACCIÓN REQUERIDA',
        icon: FaTimesCircle,
        style: 'status-rechazado',
        alertClass: 'alert-rechazado',
        title: 'Postulación Rechazada',
        desc: 'Se encontraron inconsistencias en tu documentación. Por favor, revisa las observaciones del administrador y vuelve a intentarlo.',
        btnText: 'Corregir Documentos',
        btnLink: '/docente/verificacion'
    },
    no_aplica: {
        text: 'PERFIL INCOMPLETO',
        icon: FaExclamationTriangle,
        style: 'status-no_aplica',
        alertClass: 'alert-no_aplica',
        title: 'Verificación Profesional',
        desc: 'Para garantizar la calidad académica, requerimos validar tus credenciales antes de que puedas publicar cursos.',
        btnText: 'Iniciar Verificación',
        btnLink: '/docente/verificacion'
    }
};

/* --- COMPONENTES VISUALES --- */

// 1. SKELETON LOADER (Pantalla de carga futurista)
const DashboardSkeleton = () => (
    <div className="dashboard-page akademic-theme">
        <div className="dashboard-header" style={{height: '300px'}}>
            <div className="header-content" style={{width: '100%'}}>
                <div className="skeleton" style={{width: '60%', height: '50px', marginBottom: '1rem'}}></div>
                <div className="skeleton" style={{width: '40%', height: '20px'}}></div>
            </div>
        </div>
        <div className="stats-deck">
            <div className="skeleton" style={{height: '150px'}}></div>
            <div className="skeleton" style={{height: '150px'}}></div>
            <div className="skeleton" style={{height: '150px'}}></div>
        </div>
    </div>
);

// 2. PANEL DE ESTADÍSTICAS (Datos Reales)
const StatsDeck = ({ stats }) => (
    <div className="stats-deck">
        {/* Tarjeta 1: Alumnos */}
        <div className="stat-card">
            <div className="stat-icon-box mint-glow">
                <FaUsers />
            </div>
            <div className="stat-data">
                <h3>{stats?.alumnos_total || 0}</h3>
                <p>Estudiantes Activos</p>
            </div>
        </div>

        {/* Tarjeta 2: Cursos (Planes Publicados) */}
        <div className="stat-card">
            <div className="stat-icon-box cyan-glow">
                <FaUniversity />
            </div>
            <div className="stat-data">
                {/* [LECTURA CORREGIDA] Lee 'cursos_publicados' */}
                <h3>{stats?.cursos_publicados || 0}</h3>
                <p>Cursos Publicados</p>
            </div>
        </div>

        {/* Tarjeta 3: Ingresos */}
        <div className="stat-card">
            <div className="stat-icon-box purple-glow">
                <FaChartLine />
            </div>
            <div className="stat-data">
                <h3>S/. {stats?.ingresos_mes ? Number(stats.ingresos_mes).toFixed(2) : '0.00'}</h3>
                <p>Ingresos del Mes</p>
            </div>
        </div>
        
        {/* Tarjeta 4 (Opcional): Valoración */}
        {stats?.valoracion_promedio > 0 && (
             <div className="stat-card">
                <div className="stat-icon-box yellow-glow">
                    <FaStar />
                </div>
                <div className="stat-data">
                    <h3>{stats.valoracion_promedio}</h3>
                    <p>Calificación Promedio</p>
                </div>
            </div>
        )}
    </div>
);

// 3. TARJETA DE ALERTA (Para estados no verificados)
const VerificationAlert = ({ config }) => (
    <div className={`verification-alert-card ${config.alertClass}`}>
        <div className="alert-icon-wrapper">
            <config.icon className={config.spin ? 'fa-spin' : ''} />
        </div>
        <div className="alert-content">
            <h3>{config.title}</h3>
            <p>{config.desc}</p>
        </div>
        <Link to={config.btnLink} className="btn-action btn-primary">
            {config.btnText} <FaArrowRight />
        </Link>
    </div>
);

// 4. TARJETA DE HERRAMIENTA (Grid Interactivo)
const ToolCard = ({ title, icon: Icon, desc, link, isDisabled }) => (
    <div className={`tool-card ${isDisabled ? 'disabled' : ''}`}>
        {isDisabled && (
            <div className="lock-screen">
                <FaLock size={30} />
                <span>ACCESO RESTRINGIDO</span>
            </div>
        )}
        <div className="tool-icon">
            <Icon />
        </div>
        <h4>{title}</h4>
        <p>{desc}</p>
        <Link 
            to={isDisabled ? '#' : link} 
            className="btn-action btn-ghost"
            style={{ pointerEvents: isDisabled ? 'none' : 'auto' }}
        >
            {isDisabled ? 'Bloqueado' : 'Gestionar'} {!isDisabled && <FaArrowRight />}
        </Link>
    </div>
);

/* --- CONTROLADOR PRINCIPAL --- */
const DocenteDashboardPage = () => {
    const { usuario, loading: authLoading, authToken } = useAuth();
    
    // [CORRECCIÓN] Inicializamos el estado con la propiedad correcta
    const [stats, setStats] = useState({ 
        alumnos_total: 0, 
        cursos_publicados: 0, // Propiedad utilizada en el backend
        ingresos_mes: 0,
        valoracion_promedio: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // Efecto: Cargar Datos Reales desde BD
    useEffect(() => {
        let isMounted = true;
        
        const fetchDashboardData = async () => {
            if (usuario?.roles?.includes('docente') && usuario?.estado_verificacion === 'verificado' && authToken) {
                try {
                    setLoadingStats(true);
                    const data = await obtenerEstadisticasDocente(authToken); // Usamos authToken en la llamada
                    if (isMounted && data) {
                        setStats(data);
                    }
                } catch (error) {
                    console.error("Error cargando dashboard:", error);
                } finally {
                    if (isMounted) setLoadingStats(false);
                }
            } else {
                if (isMounted) setLoadingStats(false);
            }
        };

        if (!authLoading) {
            fetchDashboardData();
        }

        return () => { isMounted = false; };
    }, [usuario, authLoading, authToken]);

    // Protecciones de Renderizado
    if (authLoading) return <DashboardSkeleton />;
   if (!usuario || !usuario.roles?.includes('docente')) return <Navigate to="/" replace />;

    // Lógica UI
    const estado = usuario.estado_verificacion || 'no_aplica';
    const config = UI_CONFIG[estado] || UI_CONFIG['no_aplica'];
    const isVerified = estado === 'verificado';
    const StatusIcon = config.icon;

    // Helper de Saludo
    const getGreeting = () => {
        const hour = new Date().getHours();
        return hour < 12 ? 'BUENOS DÍAS' : hour < 18 ? 'BUENAS TARDES' : 'BUENAS NOCHES';
    };

    return (
        <div className="dashboard-page akademic-theme">
            
            {/* 1. HEADER */}
            <header className="dashboard-header">
                <div className="header-content">
                    <h1 className="welcome-title">
                        {getGreeting()}, {usuario.nombre.split(' ')[0].toUpperCase()}
                        
                        {/* Chip de Estado Integrado al Título */}
                        <div style={{display: 'inline-flex', marginLeft: '1.5rem', verticalAlign: 'middle'}}>
                            <span className={`status-badge ${config.style}`}>
                                <StatusIcon className={config.spin ? 'fa-spin' : ''} />
                                {config.text}
                            </span>
                        </div>
                    </h1>
                    <p className="dashboard-desc">
                        Bienvenido a tu centro de operaciones. Gestiona tus cursos, horarios y finanzas en tiempo real desde aquí.
                    </p>
                </div>
                
                <div className="header-mascot-wrapper">
                    <img src="/images/pet/pet_02.png" alt="Mascota Akdemico" />
                </div>
            </header>

            {/* 2. ZONA DE DATOS O VERIFICACIÓN */}
            {isVerified ? (
                loadingStats ? (
                    /* Skeleton mientras cargan stats */
                    <div className="stats-deck">
                        <div className="skeleton" style={{height: '140px', borderRadius: '20px'}}></div>
                        <div className="skeleton" style={{height: '140px', borderRadius: '20px'}}></div>
                        <div className="skeleton" style={{height: '140px', borderRadius: '20px'}}></div>
                    </div>
                ) : (
                    <StatsDeck stats={stats} />
                )
            ) : (
                <VerificationAlert config={config} />
            )}

            {/* 3. GRID DE HERRAMIENTAS */}
            <div className="section-separator">
                <FaLayerGroup /> HERRAMIENTAS DE GESTIÓN
            </div>
            
            <div className="tools-grid">
                <ToolCard 
                    title="Crear Plan" 
                    icon={FaBookOpen} 
                    desc="Crea nuevos planes de estudio, organiza módulos y publica contenido para tus alumnos."
                    link="/docente/cursos"
                    isDisabled={!isVerified}
                />
                <ToolCard 
                    title="Agenda Horaria" 
                    icon={FaCalendarAlt} 
                    desc="Verifica tu disponibilidad semanal."
                    link="/docente/horarios"
                    isDisabled={!isVerified}
                />
                <ToolCard 
                    title="Validación de Pagos" 
                    icon={FaCreditCard} 
                    desc="Revisa inscripciones pendientes y gestiona el acceso de estudiantes."
                    link="/docente/pagos"
                    isDisabled={!isVerified}
                />
            </div>

        </div>
    );
};

export default DocenteDashboardPage;