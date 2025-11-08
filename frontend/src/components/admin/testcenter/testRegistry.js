/**
 * Registro de pruebas por defecto para verificar la salud de los principales módulos de la API.
 * Las pruebas cubren varios EPICS del proyecto.
 */
export const defaultRegistry = {
  modules: [
    {
      key: 'cursos',
      name: 'Cursos y Lotes',
      description: 'Verifica la disponibilidad de lotes publicados (US-15) y planes.',
      tests: [
        {
          key: 'publicados',
          name: 'Lotes publicados',
          method: 'GET',
          path: '/api/lotes?estado=programado&limit=1', // Asumiendo que lotes va directamente en /api/lotes o /api/cursos/lotes
          expectedStatus: 200,
          expectPath: 'data.length',
          expectValue: ':nonEmpty' 
        },
        {
          key: 'planes',
          name: 'Planes de estudio (API)',
          method: 'GET',
          path: '/api/planes?limit=1', // US-12
          expectedStatus: 200,
          expectPath: 'data.length',
          expectValue: ':nonEmpty' 
        }
      ]
    },
    {
      key: 'pagos',
      name: 'Pagos',
      description: 'Comprobantes y reportes (US-21, US-22).',
      tests: [
        {
          key: 'morosidad',
          name: 'Reporte de morosidad',
          method: 'GET',
          path: '/api/pagos/morosidad?limit=1', // US-22
          expectedStatus: 200,
          expectPath: 'data.length',
          expectValue: ':nonEmpty'
        },
        {
          key: 'validar',
          name: 'Pendientes por validar',
          method: 'GET',
          path: '/api/pagos/pendientes?limit=1', // US-21
          expectedStatus: 200,
          expectPath: 'data.length',
          expectValue: ':nonEmpty'
        }
      ]
    },
    {
      key: 'resenas',
      name: 'Reseñas y Reputación',
      description: 'API para listar reseñas (US-23).',
      tests: [
        {
          key: 'ultimas',
          name: 'Últimas reseñas',
          method: 'GET',
          path: '/api/resenas?limit=1', // US-23
          expectedStatus: 200,
          expectPath: 'data.length',
          expectValue: ':nonEmpty'
        }
      ]
    },
    {
      key: 'admin',
      name: 'Administración',
      description: 'Métricas, KPIs (US-25) y Taxonomías (US-26).',
      tests: [
        {
          key: 'kpi',
          name: 'KPI básicos',
          method: 'GET',
          path: '/api/admin/kpis', // US-25
          expectedStatus: 200,
          expectPath: 'usuarios.total',
          expectValue: ':nonEmpty'
        },
        {
          key: 'taxonomia',
          name: 'Listar taxonomías',
          method: 'GET',
          path: '/api/taxonomia?tipo=materia', // US-26
          expectedStatus: 200,
          expectPath: 'data.length',
          expectValue: ':nonEmpty'
        }
      ]
    },
    {
      key: 'autenticacion',
      name: 'Autenticación / Usuarios',
      description: 'Verifica la ruta de sesión (GET /me - requiere token válido).',
      tests: [
        {
          key: 'usuarios_list',
          name: 'Listar usuarios (Admin)',
          method: 'GET',
          path: '/api/users?limit=1', // Asume que admin puede listar
          expectedStatus: 200,
          expectPath: 'data.length',
          expectValue: ':nonEmpty'
        }
      ]
    }
  ]
};