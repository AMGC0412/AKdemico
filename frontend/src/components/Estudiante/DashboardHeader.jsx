/* Archivo: src/components/Estudiante/DashboardHeader.jsx */
import React from 'react';
import { 
    FaLayerGroup, 
    FaBolt, 
    FaHourglassHalf, 
    FaChartLine,
    FaPlus,
    FaSpinner,
    FaExclamationCircle
} from 'react-icons/fa';
// Nota: Requiere importar MisInscripcionesPage.css en el componente padre o globalmente.

// --- Sub-componente para las Tarjetas de Placeholder (Estructura de Carga/Error/Vacío) ---
const PlaceholderCard = ({ index, statusIcon: StatusIcon, accentColor, statusText }) => {
    const isPrimaryStatusCard = index === 0;
    
    const renderContent = () => {
        if (isPrimaryStatusCard) {
            return (
                <>
                    {/* Placeholder principal: Ícono de estado centrado */}
                    <div 
                        className="stat-number" 
                        style={{ color: accentColor, fontSize: '2.5rem' }}
                    >
                        <StatusIcon className={StatusIcon === FaSpinner ? 'fa-spin' : ''} />
                    </div>
                    {/* Texto de estado más pequeño */}
                    <div className="stat-label" style={{ color: accentColor }}>
                        <span>{statusText}</span>
                    </div>
                </>
            );
        }
        // Placeholder secundario: Líneas de contenido simulado
        return (
            <>
                <div className="stat-number" style={{ height: '3rem', width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                <div className="stat-label" style={{ height: '0.8rem', width: '60%', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', borderRadius: '4px' }}></div>
            </>
        );
    };

    return (
        <div 
            className="stat-card stat-card-placeholder" 
            style={{ 
                animationDelay: `${index * 0.1}s`,
                border: isPrimaryStatusCard ? `1px dashed ${accentColor}` : '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
            {renderContent()}
        </div>
    );
};
// --------------------------------------------------------------------------

// --- Sub-componente para las Tarjetas Individuales (Datos Reales) ---
const StatCard = ({ icon: Icon, number, label, index, colorClass }) => (
    <div className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
        <div className="stat-number" style={{ color: colorClass }}>{number}</div>
        <div className="stat-label">
            <Icon /> 
            <span>{label}</span>
        </div>
    </div>
);
// --------------------------------------------------------------------------

const DashboardHeader = ({ user, stats, loading, error, inscripcionesCount }) => {
    
    const cardLabels = [
        "Total Inscripciones", 
        "En Progreso", 
        "Pendientes", 
        "Progreso Promedio"
    ];
    const primaryAccent = "var(--color-accent-cyan)";

    const renderStatsContent = () => {
        if (loading || error || inscripcionesCount === 0) {
            
            let statusText;
            let StatusIconComponent;
            let accentColor;

            if (loading) {
                statusText = "CARGANDO DATOS";
                StatusIconComponent = FaSpinner;
                accentColor = primaryAccent;
            } else if (error) {
                statusText = "ERROR DE CONEXIÓN";
                StatusIconComponent = FaExclamationCircle;
                accentColor = "var(--color-accent-red)";
            } else if (inscripcionesCount === 0) {
                statusText = "EMPIEZA A EXPLORAR";
                StatusIconComponent = FaPlus;
                accentColor = primaryAccent;
            }

            // Renderizar Placeholders para mantener la cuadrícula
            return (
                <div className="dashboard-stats">
                    {cardLabels.map((label, index) => (
                        <PlaceholderCard
                            key={index}
                            index={index}
                            statusText={statusText}
                            accentColor={accentColor}
                            statusIcon={StatusIconComponent}
                        />
                    ))}
                </div>
            );
        }

        // Renderizar tarjetas con datos
        return (
            <div className="dashboard-stats">
                <StatCard 
                    icon={FaLayerGroup} 
                    number={stats.total} 
                    label="Total Inscripciones" 
                    index={0}
                    colorClass="var(--color-accent-cyan)"
                />
                <StatCard 
                    icon={FaBolt} 
                    number={stats.activos} 
                    label="En Progreso" 
                    index={1}
                    colorClass="var(--color-accent-green)"
                />
                <StatCard 
                    icon={FaHourglassHalf} 
                    number={stats.pendientes + stats.rechazados} 
                    label="Pendientes" 
                    index={2}
                    colorClass="var(--color-accent-yellow)"
                />
                <StatCard 
                    icon={FaChartLine} 
                    number={`${stats.progresoPromedio}%`}
                    label="Progreso Promedio" 
                    index={3}
                    colorClass="var(--color-accent-blue)" 
                />
            </div>
        );
    };

    return (
        <header className="dashboard-header">
            <div className="header-content">
                <div className="header-title-block">
                    <h1>PANEL DE CONTROL ACADÉMICO</h1>
                    <p>
                        {user?.nombre ? `¡Hola, ${user.nombre}! ` : ''}
                        Gestiona tu aprendizaje, progreso y actividades académicas desde un solo lugar.
                    </p>
                </div>
                
                {renderStatsContent()}
            </div>
        </header>
    );
};

export default DashboardHeader;