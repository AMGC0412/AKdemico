import React from 'react';
import { Link } from 'react-router-dom';
import './CourseCard.css'; // Importamos el CSS actualizado
// Importamos iconos
import { FaMapMarkerAlt, FaLaptop, FaChalkboardTeacher } from 'react-icons/fa';

// Componente Placeholder para Estrellas (requiere implementación)
const StarRatingDisplaySmall = ({ rating }) => {
    if (!rating) return null; // No mostrar si no hay calificación
    const stars = Math.round(rating);
    const ratingValue = Number(rating).toFixed(1);
    return (
        <div className="star-rating-display-small">
            <span className="stars">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
            {/* Opcional: mostrar valor numérico <span className="rating-number">{ratingValue}</span> */}
        </div>
    );
};

const CourseCard = ({ curso }) => {
    const precioNumerico = Number(curso.precio);

    // Determinar icono de modalidad
    const ModalidadIcon = curso.modalidad === 'virtual' ? FaLaptop : FaMapMarkerAlt;

    return (
        <div className="course-card styled"> {/* Añadimos clase 'styled' */}
            {/* 1. Imagen del Curso (Placeholder) */}
            <div className="course-card-image">
                {/* Reemplazar con <img src={curso.imagen_url || '/default-course.jpg'} alt={curso.plan_titulo} /> */}
                [Image Placeholder]
                <div className="price-overlay">S/ {!isNaN(precioNumerico) ? precioNumerico.toFixed(2) : 'N/A'}</div>
            </div>

            {/* 2. Contenido de la Tarjeta */}
            <div className="course-card-content styled">
                {/* Podríamos añadir categoría/tag aquí */}
                {/* <span className="course-card-category">Educación</span> */}
                <h3 className="course-card-title styled">
                    <Link to={`/cursos/${curso.lote_id}`}>{curso.plan_titulo || 'Título no disponible'}</Link>
                </h3>

                <div className="course-card-teacher-info">
                   <FaChalkboardTeacher className="teacher-icon"/>
                   <span>{curso.docente_nombre || 'Docente N/A'}</span>
                   {/* Opcional: Añadir calificación del docente si la API la provee aquí */}
                   {/* <StarRatingDisplaySmall rating={curso.docente_calificacion_promedio}/> */}
                </div>

                <div className="course-card-meta">
                   <span className="meta-item styled">
                       <ModalidadIcon className="meta-icon"/> {curso.modalidad || 'N/A'}
                   </span>
                   {/* Podríamos añadir duración o cupos aquí */}
                   {/* <span className="meta-item styled"><FaClock className="meta-icon"/> {curso.duracion} sem.</span> */}
                </div>

                {/* 3. Botón (Opcional, si queremos acción directa desde la tarjeta) */}
                {/* <Link to={`/cursos/${curso.lote_id}`} className="btn btn-secondary btn-card-details">
                    Ver Detalles
                </Link> */}
            </div>
        </div>
    );
};

export default CourseCard;