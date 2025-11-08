import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx'; // <-- Importa el AuthProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envuelve App con AuthProvider */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)