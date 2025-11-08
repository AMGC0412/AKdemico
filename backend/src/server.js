import app from './app.js';

// Define el puerto. 4000 para el backend.
const PORT = process.env.PORT || 4000; 

// ESTA ES LA LÍNEA MÁS IMPORTANTE.
// Le dice al servidor que se quede "escuchando" peticiones en ese puerto.
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});