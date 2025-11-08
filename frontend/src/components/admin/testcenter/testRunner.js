/**
 * Navega y extrae un valor de un objeto usando una ruta de puntos (dot notation) y arrays.
 *
 * @param {object} obj El objeto donde buscar el valor.
 * @param {string} path La ruta de la propiedad anidada (ej: 'data.items[0].id').
 * @returns {*} El valor encontrado, o `undefined` si la ruta no existe o es inválida.
 */
function pick(obj, path) {
  if (!path || typeof obj !== 'object' || obj === null) return undefined;
  
  // Reemplazar notación de array [0] con .0 para simplificar la reducción
  // Ej: 'data.items[0].id' -> 'data.items.0.id'
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1'); 

  return normalizedPath.split('.')
    .reduce((acc, k) => {
      // Navegación segura (si el acumulador es válido y la clave existe en él)
      // Usamos acc && k in acc para permitir valores null, 0 o false
      return (acc && k in acc) ? acc[k] : undefined;
    }, obj);
}

/**
 * Ejecuta una prueba HTTP contra el API y valida la respuesta.
 * @param {object} params
 * @param {string} params.API_BASE URL base del API.
 * @param {object} params.spec Especificación de la prueba.
 * @returns {Promise<{ok: boolean, status: number, data: any, error: (string|null)}>} Resultado de la prueba.
 */
export async function runTest({ API_BASE, spec }) {
  const url = API_BASE + spec.path;
  const init = {
    method: spec.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(spec.headers || {}) },
    credentials: 'include'
  };
  
  // Añadir cuerpo solo si está definido y el método es apropiado
  if (spec.body && init.method !== 'GET' && init.method !== 'HEAD') {
    init.body = JSON.stringify(spec.body);
  }

  let data = null; let status = 0; let ok = false; let error = null;
  
  const started = performance.now(); // Iniciar medición de tiempo aquí
  
  try {
    const res = await fetch(url, init);
    status = res.status;
    const ct = res.headers.get('content-type') || '';
    
    // Intentar siempre leer como JSON si es posible, retroceder a texto
    try {
      if (ct.includes('application/json')) {
         data = await res.json();
      } else {
        // Incluso si no es application/json, intenta JSON.parse si es texto
        const text = await res.text();
        data = text;
        try {
            data = JSON.parse(text); // Intentar parsear si parece JSON
        } catch {} 
      }
    } catch (e) {
        // En caso de error al leer el cuerpo, lo guardamos como error
        error = `Error al parsear el cuerpo de la respuesta: ${e.message}`;
    }

    // 1. Validación de Estatus
    if (spec.expectedStatus && spec.expectedStatus !== status) {
      throw new Error(`Status HTTP esperado ${spec.expectedStatus} pero obtuve ${status}.`);
    }

    // 2. Validación de Contenido (Payload)
    if (spec.expectPath) {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        // Solo lanzamos error si data no es un objeto iterable (como un array o string)
        if (typeof data !== 'object' || data === null) {
             throw new Error('La respuesta no es un objeto (JSON) y no se puede usar expectPath.');
        }
      }
      
      const val = pick(data, spec.expectPath);
      const expected = spec.expectValue;
      
      if (expected === ':nonEmpty') {
        const isEmpty = val == null || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && val.trim() === '');
        if (isEmpty) throw new Error(`El valor en la ruta '${spec.expectPath}' es nulo, vacío o inexistente.`);
      } else if (expected !== undefined) {
        // Permitimos que null sea un valor esperado.
        // Usamos JSON.stringify para una comparación profunda segura de objetos/arrays/tipos básicos
        if (JSON.stringify(val) !== JSON.stringify(expected)) {
          throw new Error(`Fallo de Validación: Esperado ${JSON.stringify(expected)} en '${spec.expectPath}', obtuve ${JSON.stringify(val)}.`);
        }
      }
    }

    ok = true;
  } catch (e) {
    ok = false; 
    error = e.message || String(e);
  }
  
  const ms = Math.round(performance.now() - started); // Recalculamos ms al final

  return { ok, status, data, error, ms };
}