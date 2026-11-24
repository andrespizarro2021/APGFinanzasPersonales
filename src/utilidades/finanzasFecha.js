export function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function formatearMonedaCLP(valor = 0) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
}

export function filtrarGastosDeHoy(gastos = [], fechaObjetivo = new Date()) {
  const claveHoy = obtenerFechaLocalISO(fechaObjetivo);

  return gastos.filter((item) => {
    const rawFecha = item?.fecha || item?.created_at;
    if (!rawFecha) return false;

    // Si viene como 'YYYY-MM-DD' puro, lo comparamos directo
    if (typeof rawFecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawFecha.trim())) {
      return rawFecha.trim() === claveHoy;
    }

    // Si viene como timestamp ISO, lo convertimos a fecha local
    const fechaItem = new Date(rawFecha);
    if (Number.isNaN(fechaItem.getTime())) return false;

    return obtenerFechaLocalISO(fechaItem) === claveHoy;
  });
}

export function calcularGastoDiario(gastos = [], fechaObjetivo = new Date()) {
  const deHoy = filtrarGastosDeHoy(gastos, fechaObjetivo);
  return deHoy.reduce((total, item) => total + Number(item?.monto || 0), 0);
}