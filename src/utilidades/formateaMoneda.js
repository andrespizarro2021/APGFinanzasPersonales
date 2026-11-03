// src/utilidades/formato.js

export function formatearMoneda(monto) {
  return Number(monto || 0).toLocaleString('es-CL', { 
    maximumFractionDigits: 0 
  });
}