import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import { 
  FaUsers, FaDollarSign, FaChalkboardTeacher, FaUserCheck, 
  FaSpinner, FaExclamationTriangle,
  FaUserClock, FaFlag, FaArrowRight
} from 'react-icons/fa';
import './AdminDashboardPage.css';

/**
 * Tarjeta de estadística individual para el grid.
 */
const StatCard = ({ icon, label, value, colorClass }) => (
  <div className={`stat-card ${colorClass}`}>
    <div className="stat-card-icon">
      {icon}
    </div>
    <div className="stat-card-info">
      <span className="stat-card-value">{value}</span>
      <span className="stat-card-label">{label}</span>
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
      <h3 className="admin-section-title">Centro de Acciones</h3>
      <ul className="pending-actions-list">
        {/* Tarea 1: Verificaciones */}
        <li>
          <Link to="/admin/verificaciones" className={`pending-action-item ${hasVerificaciones ? 'highlight' : ''}`}>
            <div className="action-item-icon color-primary">
              <FaUserClock />
            </div>
            <div className="action-item-info">
              <span>Verificaciones Pendientes</span>
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
              <span>Reseñas Reportadas</span>
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
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error("Error al cargar métricas:", err);
        setError("No se pudieron cargar las métricas. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Función para formatear los nombres de los roles
  const formatearRol = (rol) => {
    const formatos = {
      'estudiante': 'Estudiante',
      'docente': 'Profesor',
      'administrador': 'Administrador'
    };
    return formatos[rol] || rol;
  };

  // Estado de Carga
  if (isLoading) {
    return (
      <div className="admin-page-loader">
        <FaSpinner className="fa-spin" size="3em" />
        <p>Cargando métricas...</p>
      </div>
    );
  }

  // Estado de Error
  if (error) {
    return (
      <div className="admin-page-error">
        <FaExclamationTriangle size="3em" />
        <h3>Error al Cargar</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page admin-dashboard-layout">
      
      {/* --- COLUMNA PRINCIPAL --- */}
      <div className="dashboard-main-content">
        <header className="admin-page-header">
          <h2>¡Bienvenido, {usuario?.nombre}!</h2>
          <p>Este es el resumen del estado de la plataforma.</p>
        </header>

        {/* --- Grid de Estadísticas --- */}
        <div className="stats-grid">
          <StatCard
            icon={<FaUsers />}
            label="Usuarios Totales"
            value={metrics?.usuarios?.total || 0}
            colorClass="color-primary"
          />
          <StatCard
            icon={<FaDollarSign />}
            label="Ingresos Totales"
            value={`S/ ${parseFloat(metrics?.ingresosTotales || 0).toFixed(2)}`}
            colorClass="color-success"
          />
          <StatCard
            icon={<FaChalkboardTeacher />}
            label="Lotes Publicados"
            value={metrics?.lotesPublicados || 0}
            colorClass="color-secondary"
          />
          <StatCard
            icon={<FaUserCheck />}
            label="Inscripciones Pagadas"
            value={metrics?.inscripcionesCompletadas || 0}
            colorClass="color-warning"
          />
        </div>
      </div>
      
      {/* --- COLUMNA SECUNDARIA --- */}
      <div className="dashboard-sidebar-content">
        
        {/* --- Centro de Acciones Pendientes --- */}
        {metrics && <PendingActionsCard actions={metrics.accionesPendientes} />}

        {/* --- Desglose de Usuarios --- */}
        <div className="admin-section-container">
          <h3 className="admin-section-title">Desglose de Usuarios</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rol de Usuario</th>
                  <th>Cantidad Total</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.usuarios?.detalle?.length > 0 ? (
                  metrics.usuarios.detalle.map((item) => (
                    <tr key={item.rol}>
                      <td className="rol-capitalize">{formatearRol(item.rol)}</td>
                      <td>{item.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', color: '#A0A0A0' }}>
                      No hay datos de usuarios disponibles
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Total General</td>
                  <td style={{ fontWeight: 'bold', color: '#FFFFFF' }}>
                    {metrics?.usuarios?.total || 0}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
};

// CORRECCIÓN: Exportación por defecto
export default AdminDashboardPage;