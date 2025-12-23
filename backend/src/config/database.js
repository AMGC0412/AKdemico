import mysql from 'mysql2/promise';
import 'dotenv/config'; // Carga las variables de .env

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// --- MODIFICAR ESTA LÍNEA ---
// Añade 'export' al inicio
export const pool = mysql.createPool(dbConfig);
// ----------------------------

// Exportamos una función 'query' para usarla en toda la app
export const query = async (sql, params) => {
  const [rows, fields] = await pool.execute(sql, params);
  return rows;
};