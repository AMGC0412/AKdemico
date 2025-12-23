import axios from 'axios';
const API_URL = 'http://localhost:4000/api/v1/catalogos'; // Ajusta tu puerto

export const obtenerListaCategorias = async () => {
    const response = await axios.get(`${API_URL}/categorias`);
    return response.data;
};

export const obtenerListaNiveles = async () => {
    const response = await axios.get(`${API_URL}/niveles`);
    return response.data;
};