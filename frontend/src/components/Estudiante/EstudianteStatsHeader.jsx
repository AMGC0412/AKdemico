/* Archivo: src/components/Estudiante/EstudianteStatsHeader.jsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FaLayerGroup, 
    FaBolt, 
    FaHourglassHalf, 
    FaChartLine,
    FaPlus,
    FaSpinner,
    FaExclamationCircle
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
// Nota: Requiere importar MisInscripcionesPage.css en el componente padre o globalmente.

// --- Sub-componente para las Tarjetas Individuales (Datos Reales) ---
const StatCard = ({ icon: Icon, number, label, index, colorClass }) => (
    <div className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
        {/* Número y Título de la tarjeta */}
        <div className="stat-number" style={{ color: colorClass }}>{number}</div>
        <div className="stat-label">
            <Icon /> 
            <span>{label}</span>
        </div>
    </div>
);

// --- Sub-componente para las Tarjetas de Placeholder (Estructura de Carga ESTABLE) ---
const PlaceholderCard = ({ index, statusIcon: StatusIcon, accentColor, statusText, label }) => {
    
    // El objetivo es mantener el mismo espacio que una tarjeta de datos real
    const isPrimaryStatusCard = index === 0;
    
    return (
        <div 
            className="stat-card stat-card-placeholder" 
            style={{ 
                animationDelay: `${index * 0.1}s`,
                border: isPrimaryStatusCard ? `1px dashed ${accentColor}` : '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
            {isPrimaryStatusCard ? (
                <>
                    {/* Ícono de Estado Central (Reemplaza el número grande) */}
                    <div 
                        className="stat-number" 
                        style={{ 
                            color: accentColor, 
                            fontSize: '3rem', // Mismo tamaño que el número real
                            lineHeight: 1
                        }}
                    >
                        <StatusIcon className={statusIcon.name === 'FaSpinner' ? 'fa-spin' : ''} />
                    </div>
                    {/* Texto de estado forzado en la posición del Label */}
                    <div className="stat-label">
                        <span>{statusText}</span>
                    </div>
                </>
            ) : (
                <>
                    {/* Placeholder simple para el resto de tarjetas */}
                    <div 
                        className="stat-number placeholder-line" 
                        style={{ height: '3rem', width: '80%', margin: '0 0 0.5rem 0' }}
                    ></div>
                    <div className="stat-label placeholder-line" style={{ height: '0.9rem', width: '60%' }}>
                        <span>{label}</span>
                    </div>
                </>
            )}
        </div>
    );
};
// --------------------------------------------------------------------------

const EstudianteStatsHeader = ({ stats, loading, error, inscripciones }) => {
    const { user } = useAuth();
    
    const renderStatsContent = () => {
        
        const cardLabels = [
            "Total Inscripciones", 
            "En Progreso", 
            "Pendientes", 
            "Progreso Promedio"
        ];
        const primaryAccent = "var(--color-accent-cyan)";
        
        if (loading || error || inscripciones.length === 0) {
            
            let statusText;
            let StatusIconComponent;
            let statusIconName;
            let accentColor;

            if (loading) {
                statusText = "CARGANDO DATOS";
                StatusIconComponent = FaSpinner;
                statusIconName = 'FaSpinner';
                accentColor = primaryAccent;
            } else if (error) {
                statusText = "ERROR DE CONEXIÓN";
                StatusIconComponent = FaExclamationCircle;
                statusIconName = 'FaExclamationCircle';
                accentColor = "var(--color-accent-red)";
            } else if (inscripciones.length === 0) {
                statusText = "EMPIEZA A EXPLORAR";
                StatusIconComponent = FaPlus;
                statusIconName = 'FaPlus';
                accentColor = primaryAccent;
            }

            // Renderizar Placeholders estables
            return (
                <div className="dashboard-stats">
                    {cardLabels.map((label, index) => (
                        <PlaceholderCard
                            key={index}
                            index={index}
                            label={label}
                            statusText={statusText}
                            accentColor={accentColor}
                            statusIcon={{ name: statusIconName, component: StatusIconComponent }}
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
                    number={stats.pendientes} 
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

export default EstudianteStatsHeader;