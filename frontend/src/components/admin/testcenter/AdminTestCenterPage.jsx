import React, { useEffect, useMemo, useRef, useState } from "react";
import "./testcenter.css";
// Se usan Placeholders para evitar errores de compilación por librerías no instaladas
const FaVial = ({ className }) => <span className={className}>🧪</span>;
const FaCheck = ({ className }) => <span className={className}>✅</span>; 
const FaExclamationTriangle = ({ className }) => <span className={className}>⚠️</span>; // Cambiado a un ícono de advertencia más estándar
const FaPlay = ({ className }) => <span className={className}>▶️</span>; 
const FaSync = ({ className }) => <span className={className}>🔄</span>; 
const FaEdit = ({ className }) => <span className={className}>✏️</span>; 
const FaTimes = ({ className }) => <span className={className}>❌</span>; 
const FaSave = ({ className }) => <span className={className}>💾</span>; 
const FaBug = ({ className }) => <span className={className}>🐛</span>; 
const FaTerminal = ({ className }) => <span className={className}>💻</span>;

// --- CORRECCIÓN DE RUTAS RELATIVAS ---
import { runTest } from "./testRunner.js"; 
import { defaultRegistry } from "./testRegistry.js";

// --- Constantes y Helpers de Utilidad ---
const API_BASE = typeof import.meta.env !== 'undefined' 
  ? import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000"
  : "http://localhost:3000";

const LS_KEY = "admin-testcenter-registry";

/**
 * Carga el registro de pruebas desde Local Storage o usa el default.
 */
function loadRegistry() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error loading registry from localStorage:", e);
  }
  return defaultRegistry;
}

/**
 * Guarda el registro de pruebas en Local Storage.
 */
function saveRegistry(registry) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(registry));
  } catch (e) {
    console.error("Error saving registry to localStorage:", e);
  }
}

/**
 * Intenta parsear un string como JSON o un valor especial (Ej: ':nonEmpty').
 */
function safeParse(value) {
    if (typeof value !== 'string') return value;
    if (value.trim() === '') return undefined;
    
    // Si no es un valor especial, intenta JSON
    if (!value.startsWith(':')) {
        try {
            return JSON.parse(value);
        } catch (e) {
            // Si el JSON es inválido, devuelve el string.
            return value; 
        }
    }
    return value; // Devolver ':nonEmpty', etc.
}


export default function AdminTestCenterPage() {
  // --- 1. Estado (State) ---
  const [registry, setRegistry] = useState(loadRegistry());
  const [results, setResults] = useState({}); // { moduleKey: { testKey: {ok, status, ms, error, at}} }
  const [filter, setFilter] = useState("");
  const [auto, setAuto] = useState(false); 
  const [intervalMs, setIntervalMs] = useState(15000); 
  const [editing, setEditing] = useState(null); // { moduleKey, testIndex, tempSpec }
  
  const timerRef = useRef(null);

  // 2. Cálculos (useMemo)
  const modules = useMemo(() => {
    return registry.modules.filter(m => 
      !filter || m.name.toLowerCase().includes(filter.toLowerCase()) || m.description?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [registry, filter]);

  // 3. Efectos (useEffect) - Auto Run
  useEffect(() => {
    if (!auto) {
      timerRef.current && clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    timerRef.current && clearInterval(timerRef.current);
    const interval = Math.max(5000, intervalMs); // Mínimo 5 segundos
    timerRef.current = setInterval(() => {
      runAll(false); 
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [auto, intervalMs, registry]); 

  // 4. Handlers de Lógica (Funciones)
  
  /**
   * Determina la clase de estilo para el módulo (ok, warn, bad, o '')
   */
  const getModuleStatusClass = (moduleKey) => {
    const mod = registry.modules.find(m => m.key === moduleKey);
    if (!mod) return '';

    const moduleResults = results[moduleKey] || {};
    const hasAnyResult = mod.tests.some(test => moduleResults[test.key]);
    
    if (!hasAnyResult) return ''; // PENDING (sin clase de color)

    const allOk = mod.tests.every(test => moduleResults[test.key] && moduleResults[test.key].ok);
    if (allOk) return 'ok'; // Éxito total

    const allBad = mod.tests.every(test => moduleResults[test.key] && !moduleResults[test.key].ok);
    if (allBad) return 'bad'; // Fallo total
    
    // Si hay una mezcla de OK y BAD
    const anyBad = mod.tests.some(test => moduleResults[test.key] && !moduleResults[test.key].ok);
    if (anyBad) return 'warn'; // Advertencia (Éxito parcial)
    
    return ''; // Caso por defecto/pendiente
  };

  /**
   * Ejecuta una prueba individual y actualiza los resultados.
   */
  async function runOne(moduleKey, testIndex) {
    const mod = registry.modules.find(m => m.key === moduleKey);
    if (!mod) return;
    const spec = mod.tests[testIndex];
    if (!spec) return;
    
    // El 'runTest' ya calcula el tiempo y maneja errores robustos
    const res = await runTest({ API_BASE, spec });
      
    setResults(prev => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || {}),
        [spec.key]: { 
          ok: res.ok, 
          status: res.status, 
          ms: res.ms, 
          at: new Date().toISOString(), 
          error: res.error || null 
        }
      }
    }));
  }

  /**
   * Ejecuta todas las pruebas en el registro.
   */
  async function runAll(showLog = true) {
    if (showLog) console.log("Ejecutando todas las pruebas...");
    // Ejecutar de forma asíncrona para no bloquear el hilo
    const promises = [];
    for (const mod of registry.modules) {
      for (let i = 0; i < mod.tests.length; i++) {
        promises.push(runOne(mod.key, i)); 
      }
    }
    // No esperamos Promise.all para que las actualizaciones de la UI sean reactivas
    // await Promise.all(promises); 
    
    if (showLog) console.log("Ejecución de pruebas lanzada.");
  }
  
  /**
   * Abre o cierra el editor de la especificación de la prueba.
   */
  function toggleEdit(moduleKey, testIndex) {
    const currentTest = registry.modules.find(m => m.key === moduleKey)?.tests[testIndex];
    
    setEditing(prevEditing => {
        if (prevEditing?.moduleKey === moduleKey && prevEditing?.testIndex === testIndex) {
            return null; // Cancelar/Cerrar
        }

        // Abrir/Inicializar la edición
        const initialSpec = currentTest 
            ? { ...currentTest, expectedStatus: currentTest.expectedStatus || 200 } 
            : { method: 'GET', expectedStatus: 200 };
            
        // Asegurar que body y headers sean objetos para la UI
        if (typeof initialSpec.body !== 'object' || initialSpec.body === null) initialSpec.body = {};
        if (typeof initialSpec.headers !== 'object' || initialSpec.headers === null) initialSpec.headers = {};
            
        return { 
            moduleKey, 
            testIndex, 
            tempSpec: initialSpec
        }; 
    });
  }

  /**
   * Actualiza el valor temporal en el editor.
   */
  function updateTempSpec(key, value) {
    setEditing(prev => {
        if (!prev) return null;
        
        // Manejar JSON Body, Headers y ExpectValue con safeParse
        if (key === 'body' || key === 'headers' || key === 'expectValue') {
            const parsed = safeParse(value);
            // Solo actualiza si el valor es válido (no es un string con error de parseo)
            if (typeof parsed !== 'string' || value.startsWith(':') || key !== 'expectValue') {
                 // Permitir que body y headers sean strings no-JSON si el método lo requiere (ej: text/plain)
                return {
                    ...prev,
                    tempSpec: { ...prev.tempSpec, [key]: parsed }
                };
            }
            // Si el parseo de expectValue falló, no actualizamos el estado
            return prev; 
        }

        // Manejar el resto de campos
        return {
            ...prev,
            tempSpec: { ...prev.tempSpec, [key]: value }
        };
    });
  }

  /**
   * Guarda los cambios de la especificación editada en el registro (y Local Storage).
   */
  function saveChanges() {
    if (!editing) return;
    const { moduleKey, testIndex, tempSpec } = editing;

    const newRegistry = {
        ...registry,
        modules: registry.modules.map(mod => {
            if (mod.key !== moduleKey) return mod;
            return {
                ...mod,
                tests: mod.tests.map((test, idx) => 
                    idx === testIndex ? tempSpec : test
                )
            };
        })
    };
    
    setRegistry(newRegistry);
    saveRegistry(newRegistry); 
    setEditing(null); 
  }

  // 5. Renderizado (JSX)
  return (
    <div className="test-center">
        {/* Encabezado */}
        <div className="admin-page-header">
            <h2><FaTerminal /> Centro de Pruebas de API</h2>
            <p>Verificación continua de la salud de los módulos del Backend. <span className="tc-api-base">API Base: {API_BASE}</span></p>
        </div>
      
        {/* Barra de Controles (Filtro, Auto Run, Ejecutar Todo) */}
        <div className="tc-bar">
            <input 
                type="text" 
                placeholder="Filtrar módulos..." 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)} 
            />
            
            <div className="tc-controls">
                <label className="btn sm">
                    <input 
                        type="checkbox" 
                        checked={auto} 
                        onChange={(e) => setAuto(e.target.checked)} 
                        className="mr-1"
                    /> 
                    Auto Run
                </label>
                
                {auto && (
                    <input 
                        type="number" 
                        min="5000" 
                        step="500"
                        value={intervalMs} 
                        onChange={(e) => setIntervalMs(Number(e.target.value))} 
                        title="Intervalo de ejecución automática en milisegundos (mínimo 5000ms)"
                    />
                )}

                <button className="btn tc-run-all" onClick={() => runAll()} title="Ejecutar todas las pruebas inmediatamente">
                    <FaSync /> Ejecutar Todas
                </button>
            </div>
        </div>

      {/* Grid de Módulos (Cards) */}
      <div className="tc-grid">
        {modules.length === 0 ? (
          <p>No se encontraron módulos de prueba que coincidan con el filtro.</p>
        ) : (
          modules.map(mod => (
            // Uso de tc-card con las clases de estado (ok, warn, bad, o '')
            <div key={mod.key} className={`tc-card ${getModuleStatusClass(mod.key)}`}>
              <div className="tc-card-h">
                <h2>{mod.name}</h2>
                <span>{mod.description}</span>
              </div>
              
              <ul className="tc-tests">
                {mod.tests.map((test, index) => {
                  const result = results[mod.key]?.[test.key];
                  const isEditing = editing?.moduleKey === mod.key && editing?.testIndex === index;
                  const testStatusClass = result ? (result.ok ? 'ok' : 'bad') : '';
                  
                  // Lógica para el ícono de estado
                  let statusIcon = <FaPlay className="pending-i" title="Pendiente de ejecución" />;
                  if (result) {
                      if (result.ok) {
                          statusIcon = <FaCheck className="ok-i" title="Pasó" />;
                      } else {
                          statusIcon = <FaExclamationTriangle className="bad-i" title="Falló" />;
                      }
                  }
                  
                  // Convertir valores a string para la interfaz
                  const expectedValueString = 
                    (typeof test.expectValue === 'object' && test.expectValue !== null) 
                    ? JSON.stringify(test.expectValue) 
                    : String(test.expectValue || '');
                    
                  const bodyString = 
                    (typeof test.body === 'object' && test.body !== null) 
                    ? JSON.stringify(test.body) 
                    : String(test.body || ''); // Maneja cuerpos que no son objetos (ej: texto plano)
                    
                  return (
                    <li key={test.key} className={`tc-test ${testStatusClass}`}>
                      
                      {/* Vista de Prueba */}
                      <div className="tc-test-main">
                          <div>{statusIcon}</div>
                          <div className="tc-main-info">
                              <span className="kpi">{test.name}</span>
                              <span className="tc-method">[{test.method || 'GET'}]</span>
                              <span className="tc-path">{test.path}</span>
                              {result && (
                                  <>
                                      <span className="tc-status">Status: {result.status}</span>
                                      <span className="tc-ms">{result.ms}ms</span>
                                      {result.at && <span className="tc-time">{new Date(result.at).toLocaleTimeString()}</span>}
                                  </>
                              )}
                          </div>
                      </div>

                      {/* Detalles de Validación */}
                      {test.expectPath && (
                          <div className="tc-expect-details">
                            <p><strong>Ruta:</strong> `{test.expectPath}`</p>
                            <p><strong>Valor esperado:</strong> `{expectedValueString || 'Cualquier valor'}`</p>
                            {test.body && <p><strong>Body:</strong> `{bodyString.substring(0, 50)}{bodyString.length > 50 ? '...' : ''}`</p>}
                          </div>
                      )}

                      {/* Mensaje de Error */}
                      {result?.error && (
                          <pre className="tc-error"><FaBug className="bad-i mr-2"/> {result.error}</pre>
                      )}

                      {/* Acciones */}
                      <div className="tc-test-actions">
                          <button className="btn sm" onClick={() => runOne(mod.key, index)} title="Ejecutar solo esta prueba">
                              <FaPlay /> Run
                          </button>
                          <button className="btn sm" onClick={() => toggleEdit(mod.key, index)} title={isEditing ? "Cancelar Edición" : "Editar Especificación"}>
                              {isEditing ? <FaTimes /> : <FaEdit />} {isEditing ? 'Cancel' : 'Edit'}
                          </button>
                          {isEditing && (
                              <button className="btn sm ok-i" onClick={saveChanges} title="Guardar cambios permanentemente en Local Storage">
                                  <FaSave /> Save
                              </button>
                          )}
                      </div>

                      {/* Editor de Pruebas */}
                      {isEditing && editing.tempSpec && (
                          <div className="tc-editor">
                              <div className="tc-editor-grid">
                                  {/* Columna 1 */}
                                  <label>
                                      Path (Ruta de la API)
                                      <input type="text" value={editing.tempSpec.path || ''} onChange={(e) => updateTempSpec('path', e.target.value)} />
                                  </label>
                                  {/* Columna 2 */}
                                  <label>
                                      Method (GET/POST/PUT/DEL)
                                      <input type="text" value={editing.tempSpec.method || ''} onChange={(e) => updateTempSpec('method', e.target.value.toUpperCase())} />
                                  </label>
                                  <label>
                                      Expected Status (200, 201, 404...)
                                      <input type="number" value={editing.tempSpec.expectedStatus || 200} onChange={(e) => updateTempSpec('expectedStatus', Number(e.target.value))} />
                                  </label>
                                  <label>
                                      Expect Path (Ej: data[0].id)
                                      <input type="text" value={editing.tempSpec.expectPath || ''} onChange={(e) => updateTempSpec('expectPath', e.target.value)} />
                                  </label>
                                  {/* Headers - Ancho completo */}
                                  <label style={{ gridColumn: 'span 2' }}>
                                      Headers (JSON)
                                      <textarea 
                                          rows="2" 
                                          value={JSON.stringify(editing.tempSpec.headers || {}, null, 2)} 
                                          onChange={(e) => updateTempSpec('headers', e.target.value)}
                                          placeholder='{"Authorization": "Bearer token"}'
                                      />
                                  </label>
                                  {/* Body - Ancho completo */}
                                  <label style={{ gridColumn: 'span 2' }}>
                                      Body (JSON)
                                      <textarea 
                                          rows="3" 
                                          value={JSON.stringify(editing.tempSpec.body || {}, null, 2)} 
                                          onChange={(e) => updateTempSpec('body', e.target.value)}
                                          placeholder='{"campo": "valor"}'
                                      />
                                  </label>
                                  {/* Expect Value - Ancho completo */}
                                  <label style={{ gridColumn: 'span 2' }}>
                                      Expect Value (JSON o :nonEmpty)
                                      <input type="text" 
                                          value={
                                              (typeof editing.tempSpec.expectValue === 'object' && editing.tempSpec.expectValue !== null) 
                                              ? JSON.stringify(editing.tempSpec.expectValue, null, 0)
                                              : String(editing.tempSpec.expectValue || '')
                                          } 
                                          onChange={(e) => updateTempSpec('expectValue', e.target.value)} 
                                          placeholder='Ej: ":nonEmpty" o 5 o {"id": 1}'
                                      />
                                  </label>
                              </div>
                          </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

    </div>
  );
}