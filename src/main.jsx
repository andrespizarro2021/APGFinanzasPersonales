import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 💡 Asegúrate de importar el proveedor desde la ruta correcta
import { ProveedorCiclo } from './contexto/CicloContexto';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProveedorCiclo>
      <App />
    </ProveedorCiclo>
  </React.StrictMode>,
);