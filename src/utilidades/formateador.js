export const formatearMonto = (monto, ocultar = false) => {
  if (ocultar) return '$••••••';
  return `$${Number(monto || 0).toLocaleString('es-CL', {
    maximumFractionDigits: 0
  })}`;
};