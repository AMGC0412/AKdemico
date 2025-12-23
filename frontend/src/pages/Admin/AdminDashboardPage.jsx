import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics } from '../../services/admin.service'; 
import { useAuth } from '../../context/AuthContext';
import { 
  FaUsers, FaDollarSign, FaChalkboardTeacher, FaCalendarCheck, FaFlag, FaArrowRight,
  FaSpinner, FaExclamationTriangle, FaUserClock, FaChartBar, FaClipboardList,
  FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import './AdminDashboardPage.css';

/**
 * Tarjeta de estadística individual (Estructura de Terminal de Datos).
 */
const StatCard = ({ icon, label, value, colorClass, delta }) => (
  <div className={`stat-card ${colorClass}`}>
    <div className="stat-card-top-info">
      <div className="stat-card-icon">{icon}</div>
      {/* Línea de escaneo decorativa */}
      <div className="top-scan-line"></div> 
    </div>
    
    <div className="stat-card-value-row">
      <span className="stat-card-value">{value}</span>
    </div>
    
    <div className="stat-card-footer-info">
      <span className="stat-card-label">{label}</span>
      {delta !== undefined && (
        <span className={`stat-delta ${delta >= 0 ? 'up' : 'down'}`}>
          {delta >= 0 ? <FaArrowUp /> : <FaArrowDown />}
          {Math.abs(delta)}%
        </span>
      )}
    </div>
  </div>
);

/**
 * Componente para la "Bandeja de Tareas"
 */
const PendingActionsCard = ({ actions }) => {
  const hasVerificaciones = actions?.verificaciones > 0;
  const hasResenas = actions?.resenas > 0;

  return (
    <div className="admin-section-container pending-actions-card">
      <h3 className="admin-section-title"><FaClipboardList /> CENTRO DE ACCIONES</h3>
      <ul className="pending-actions-list">
        {/* Tarea 1: Verificaciones */}
        <li>
          <Link to="/admin/verificaciones" className={`pending-action-item ${hasVerificaciones ? 'highlight' : ''}`}>
            <div className="action-item-icon color-primary">
              <FaUserClock />
            </div>
            <div className="action-item-info">
              <span>Verificaciones Docentes</span>
              <small>{hasVerificaciones ? 'Docentes esperando aprobación' : 'No hay tareas pendientes'}</small>
            </div>
            <span className={`action-count ${hasVerificaciones ? 'highlight' : ''}`}>
              {actions?.verificaciones || 0}
            </span>
            <FaArrowRight className="action-arrow" />
          </Link>
        </li>
        {/* Tarea 2: Moderación */}
        <li>
          <Link to="/admin/moderacion" className={`pending-action-item ${hasResenas ? 'highlight' : ''}`}>
            <div className="action-item-icon color-warning">
              <FaFlag />
            </div>
            <div className="action-item-info">
              <span>Moderación Reseñas</span>
              <small>{hasResenas ? 'Reseñas marcadas por abuso' : 'No hay tareas pendientes'}</small>
            </div>
            <span className={`action-count ${hasResenas ? 'highlight' : ''}`}>
              {actions?.resenas || 0}
            </span>
            <FaArrowRight className="action-arrow" />
          </Link>
        </li>
      </ul>
    </div>
  );
};

/**
 * Componente para la barra de progreso (Desglose de Usuarios).
 */
const UserBreakdownBar = ({ total, current, label, color }) => {
    const percentage = total > 0 ? ((current / total) * 100) : 0;
    return (
        <div className="breakdown-bar-wrapper">
            <div className="bar-info">
                <span className="bar-label">{label}</span>
                <span className="bar-percentage" style={{color: color}}>{percentage.toFixed(1)}%</span>
            </div>
            <div className="bar-container">
                <div 
                    className="bar-progress" 
                    style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: color, 
                        boxShadow: `0 0 10px ${color}`
                    }}
                ></div>
            </div>
        </div>
    );
};


/**
 * Página principal del Dashboard del Administrador.
 */
const AdminDashboardPage = () => {
  const { usuario } = useAuth();
  const [metrics, setMetrics] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // LLAMADA REAL (Descomentar y usar la función real en producción)
        const data = await getDashboardMetrics(); 
        setMetrics(data);
      } catch (err) {
        setError("Error de conexión con la Matrix. No se pudieron cargar las métricas.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Función para formatear los nombres de los roles y asignar colores
  const getRoleStyle = (rol) => {
    const item = metrics?.usuarios?.detalle?.find(d => d.rol === rol);
    const count = item ? item.total : 0;
    
    switch (rol) {
        case 'estudiante': return { label: 'Estudiante', color: 'var(--color-data)', count: count }; 
        case 'docente': return { label: 'Profesor', color: 'var(--color-secondary)', count: count }; 
        case 'administrador': return { label: 'Administrador', color: 'var(--color-primary)', count: count }; 
        default: return { label: capitalizar(rol), color: 'var(--color-text-light)', count: count };
    }
  };
  const capitalizar = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const totalUsuarios = metrics?.usuarios?.total || 1; 
  
  // Datos MOCK de Delta (Asumiendo que el servicio real los proporciona)
  const mockDelta = (value) => {
    switch(value) {
        case 'Usuarios Totales': return 2.5;
        case 'Ingresos (Total)': return -1.2;
        case 'Lotes Activos': return 5;
        case 'Inscripciones': return 0.8;
        default: return undefined;
    }
  };

  // --- Renderizado de Estados ---
  if (isLoading) {
    return (
      <div className="admin-page-state loading">
        <FaSpinner className="spin-icon" />
        <p>CALIBRANDO SISTEMA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-state error">
        <FaExclamationTriangle className="error-icon" />
        <h3>ERROR: FALLA EN LA MATRIZ</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      
      {/* --- COLUMNA PRINCIPAL --- */}
      <div className="dashboard-main-content">
        <header className="admin-page-header">
          <h2 className="admin-page-title">BIENVENIDO, {usuario?.nombre?.toUpperCase()}!</h2>
          <p className="admin-page-subtitle">Panel de Control Operacional de la Plataforma.</p>
        </header>

        {/* --- Grid de Estadísticas (KPI) --- */}
        <div className="stats-grid">
          <StatCard
            icon={<FaUsers />}
            label="Usuarios Totales"
            value={metrics?.usuarios?.total || 0}
            colorClass="color-primary"
            delta={mockDelta('Usuarios Totales')}
          />
          <StatCard
            icon={<FaDollarSign />}
            label="Ingresos (Total)"
            value={`S/ ${parseFloat(metrics?.ingresosTotales || 0).toFixed(2)}`}
            colorClass="color-success"
            delta={mockDelta('Ingresos (Total)')}
          />
          <StatCard
            icon={<FaChalkboardTeacher />}
            label="Lotes Activos"
            value={metrics?.lotesPublicados || 0}
            colorClass="color-secondary"
            delta={mockDelta('Lotes Activos')}
          />
          <StatCard
            icon={<FaCalendarCheck />}
            label="Inscripciones"
            value={metrics?.inscripcionesCompletadas || 0}
            colorClass="color-data"
            delta={mockDelta('Inscripciones')}
          />
        </div>
        
        {/* --- Desglose de Usuarios (Gráfico de Barras Simple) --- */}
        <div className="admin-section-container user-breakdown-card">
          <h3 className="admin-section-title"><FaChartBar /> DISTRIBUCIÓN DE ROLES</h3>
          <div className="breakdown-chart-area">
            {['estudiante', 'docente', 'administrador'].map((rol) => {
                const style = getRoleStyle(rol);
                return (
                    <UserBreakdownBar 
                        key={rol}
                        total={totalUsuarios}
                        current={style.count}
                        label={style.label}
                        color={style.color}
                    />
                );
            })}
          </div>
        </div>
      </div>
      
      {/* --- COLUMNA SECUNDARIA (SIDEBAR) --- */}
      <div className="dashboard-sidebar-content">
        
        {/* --- Centro de Acciones Pendientes --- */}
        {metrics && <PendingActionsCard actions={metrics.accionesPendientes} />}

        {/* --- Log de Actividad Reciente --- */}
        <div className="admin-section-container recent-activity-card">
            <h3 className="admin-section-title"><FaFlag /> LOG DE ACTIVIDAD</h3>
            <ul className="activity-list">
                {metrics?.actividadReciente?.map((act, index) => (
                    <li key={index} className={`activity-item status-${act.estado}`}>
                        <span className="activity-type">{act.tipo}</span>
                        <span className="activity-desc">{act.descripcion}</span>
                        <FaArrowRight className="activity-arrow" />
                    </li>
                ))}
            </ul>
            <Link to="/admin/logs" className="btn-view-all">VER LOG COMPLETO</Link>
        </div>
        
      </div>
      
    </div>
  );
};

export default AdminDashboardPage;