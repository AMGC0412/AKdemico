import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { obtenerMiEstadoDeVerificacion, postularParaVerificacion } from '../../services/verification.service.js';
import './DocenteVerificacionPage.css';
import { FaFileUpload, FaUserCheck, FaHourglassHalf, FaTimesCircle, FaSpinner, FaPaperclip } from 'react-icons/fa';

const DocenteVerificacionPage = () => {
    const { usuario, loading: authLoading } = useAuth(); // Renombrar 'loading'
    const [estadoVerificacion, setEstadoVerificacion] = useState(null);
    const [loading, setLoading] = useState(true); // Loading de la página
    const [error, setError] = useState(null);

    // Estados para los archivos del formulario
    const [fileCV, setFileCV] = useState(null);
    const [fileDNI, setFileDNI] = useState(null);
    const [fileTitulo, setFileTitulo] = useState(null);
    const [uploading, setUploading] = useState(false); // Estado para la subida

    // Cargar el estado de verificación
    useEffect(() => {
        const cargarEstado = async () => {
            try {
                setLoading(true);
                const data = await obtenerMiEstadoDeVerificacion();
                setEstadoVerificacion(data);
            } catch (err) {
                // El error 403 (de admin) ya no debería ocurrir por la RutaDocente
                // Esto capturará errores 500 o de red
                setError(err.mensaje || "Error al cargar tu estado de verificación.");
            } finally {
                setLoading(false);
            }
        };
        // Solo cargar si el usuario de AuthContext está listo y es docente
        if (!authLoading && usuario?.roles?.includes('docente')) {
            cargarEstado();
        } else if (authLoading) {
            // Esperar que la autenticación termine...
        }
    }, [authLoading, usuario]); // Depender del loading de autenticación

    // Manejador para el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fileCV || !fileDNI || !fileTitulo) {
            setError("Debes adjuntar los tres documentos.");
            return;
        }
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('cv', fileCV);
        formData.append('dni', fileDNI);
        formData.append('titulo', fileTitulo);

        try {
            const respuesta = await postularParaVerificacion(formData);
            setUploading(false);
            // Actualizar estado local para mostrar "Pendiente"
            setEstadoVerificacion({
                estadoGeneral: 'pendiente',
                estadoDetallado: 'en_revision',
                mensaje: respuesta.mensaje || "Postulación enviada."
            });
        } catch (err) {
            setUploading(false);
            setError(err.mensaje || "Error al subir los archivos.");
        }
    };

    // Renderizado
    if (authLoading || loading) return <div className="page-loading">Cargando...</div>;
    
    // (La RutaDocente ya protege esto, pero es una doble seguridad)
    if (!usuario || !usuario.roles?.includes('docente')) {
        return <Navigate to="/" replace />;
    }

    const renderContent = () => {
        if (estadoVerificacion?.estadoGeneral === 'verificado') {
            return (
                <div className="status-box status-verificado-box">
                    <FaUserCheck size={50} />
                    <h2>¡Perfil Verificado!</h2>
                    <p>Tu cuenta ha sido aprobada. Ya tienes acceso a todas las funciones.</p>
                    <Link to="/docente/dashboard" className="btn btn-secondary">Volver al Panel</Link>
                </div>
            );
        }

        if (estadoVerificacion?.estadoGeneral === 'pendiente') {
            return (
                <div className="status-box status-pendiente-box">
                    <FaHourglassHalf size={50} />
                    <h2>Postulación en Revisión</h2>
                    <p>Has enviado tus documentos. El equipo los está revisando y te notificaremos pronto.</p>
                    <p><strong>Estado:</strong> {estadoVerificacion.estadoDetallado || 'En Revisión'}</p>
                    <Link to="/docente/dashboard" className="btn btn-secondary">Volver al Panel</Link>
                </div>
            );
        }

        // Formulario (estado 'rechazado' o 'no_aplica')
        return (
            <form className="verification-form" onSubmit={handleSubmit}>
                <h2>Postula para ser Docente Verificado</h2>
                <p>Necesitamos validar tu identidad y experiencia. Por favor, sube los siguientes documentos (PDF o Imágenes, máx 5MB c/u).</p>

                {estadoVerificacion?.estadoGeneral === 'rechazado' && (
                    <div className="alert alert-error">
                        <FaTimesCircle /> 
                        Tu postulación anterior fue rechazada.
                        {estadoVerificacion.observaciones_admin && <strong> Motivo: {estadoVerificacion.observaciones_admin}</strong>}
                        <br/>Vuelve a subir tus documentos corregidos.
                    </div>
                )}
                
                {/* --- INPUTS DE ARCHIVO MEJORADOS --- */}
                <div className="form-group-file">
                    <label htmlFor="file-cv">
                        <FaPaperclip /> Curriculum Vitae (CV)
                    </label>
                    <label htmlFor="file-cv" className="file-input-label">
                        <span>{fileCV?.name || "Seleccionar archivo"}</span>
                        <div className="btn-browse">Buscar</div>
                    </label>
                    <input id="file-cv" type="file" accept=".pdf, image/*" onChange={(e) => setFileCV(e.target.files[0])} />
                </div>

                <div className="form-group-file">
                    <label htmlFor="file-dni">
                        <FaPaperclip /> Documento de Identidad
                    </label>
                    <label htmlFor="file-dni" className="file-input-label">
                        <span>{fileDNI?.name || "Seleccionar archivo"}</span>
                        <div className="btn-browse">Buscar</div>
                    </label>
                    <input id="file-dni" type="file" accept=".pdf, image/*" onChange={(e) => setFileDNI(e.target.files[0])} />
                </div>

                <div className="form-group-file">
                    <label htmlFor="file-titulo">
                        <FaPaperclip /> Título o Certificado Profesional
                    </label>
                    <label htmlFor="file-titulo" className="file-input-label">
                        <span>{fileTitulo?.name || "Seleccionar archivo"}</span>
                        <div className="btn-browse">Buscar</div>
                    </label>
                    <input id="file-titulo" type="file" accept=".pdf, image/*" onChange={(e) => setFileTitulo(e.target.files[0])} />
                </div>
                {/* ---------------------------------- */}


                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="btn btn-primary btn-full" disabled={uploading || !fileCV || !fileDNI || !fileTitulo}>
                    {uploading ? <><FaSpinner className="spinner" /> Enviando...</> : "Enviar Postulación"}
                </button>
            </form>
        );
    };

    return (
        <div className="page-container verification-page">
            <div className="content-box frosted-glass">
                {renderContent()}
            </div>
             <div className="back-link styled" style={{textAlign: 'center', marginTop: '1rem'}}>
                <Link to="/docente/dashboard">Volver al Panel</Link>
             </div>
        </div>
    );
};

export default DocenteVerificacionPage;