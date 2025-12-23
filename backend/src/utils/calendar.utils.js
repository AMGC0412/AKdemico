// Archivo: src/utils/calendar.utils.js

// Colores base Cyberpunk/Neon (Huesos fríos y saturados)
const COHESIVE_NEON_COLORS = [
    { base: '#4DFFFF', dark: '#00A6AD', glow: 'rgba(77, 255, 255, 0.4)' }, // Cian
    { base: '#FF3EFF', dark: '#B8004A', glow: 'rgba(255, 62, 255, 0.4)' }, // Magenta
    { base: '#6C9EFF', dark: '#1A52B8', glow: 'rgba(108, 158, 255, 0.4)' }, // Azul
    { base: '#05FF00', dark: '#00A800', glow: 'rgba(5, 255, 0, 0.4)' },     // Verde Neón
    { base: '#FEEA00', dark: '#AA9E00', glow: 'rgba(254, 234, 0, 0.4)' },   // Amarillo
];

/**
 * Asigna colores aleatorios pero consistentes a un ID de lote.
 * @param {string|number} loteId
 * @returns {object} { primary, background, glow }
 */
export const getCourseColors = (loteId) => {
    // Convierte el ID en un índice fijo usando un hash simple
    const hash = String(loteId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % COHESIVE_NEON_COLORS.length;
    
    const selectedColor = COHESIVE_NEON_COLORS[index];
    
    return {
        // Color principal del evento (el más intenso para el texto o la clase)
        primary: selectedColor.base, 
        // Color de fondo suave (para la sombra del periodo)
        background: selectedColor.dark + '33', // 33 es ~20% de opacidad en HEX
        // Color de glow para efectos en el día de clase
        glow: selectedColor.glow,
        // Color de texto fuerte (para el evento FullCalendar, típicamente negro)
        text: '#000000' 
    };
};