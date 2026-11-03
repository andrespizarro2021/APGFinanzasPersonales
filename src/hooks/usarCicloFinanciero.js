import { useState, useEffect } from 'react';

export function usarCicloFinanciero(saldoDisponible, diaInicioCiclo = 1) {
  const [fechasCiclo, setFechasCiclo] = useState({
    fechaInicio: new Date(),
    fechaFin: new Date(),
    diasRestantes: 0,
    presupuestoDiario: 0,
  });

  useEffect(() => {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = ahora.getMonth();
    const diaActual = ahora.getDate();

    let fechaInicio, fechaFin;

    if (diaInicioCiclo === 1) {
      // Si el ciclo comienza el día 1, va del 1 al último día del mes actual
      fechaInicio = new Date(anio, mes, 1);
      fechaFin = new Date(anio, mes + 1, 0, 23, 59, 59); // Último día del mes
    } else {
      // Si comienza en otro día (ej. 21)
      if (diaActual >= diaInicioCiclo) {
        fechaInicio = new Date(anio, mes, diaInicioCiclo);
        fechaFin = new Date(anio, mes + 1, diaInicioCiclo - 1, 23, 59, 59);
      } else {
        fechaInicio = new Date(anio, mes - 1, diaInicioCiclo);
        fechaFin = new Date(anio, mes, diaInicioCiclo - 1, 23, 59, 59);
      }
    }

    // Cálculo de días restantes
    const hoy = new Date();
    const diferenciaTiempo = fechaFin.getTime() - hoy.getTime();
    const diasRestantes = Math.max(Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)), 1);

    // Cálculo del presupuesto diario
    const presupuestoDiario = diasRestantes > 0 ? Math.max(saldoDisponible / diasRestantes, 0) : 0;

    setFechasCiclo({
      fechaInicio,
      fechaFin,
      diasRestantes,
      presupuestoDiario,
    });
  }, [saldoDisponible, diaInicioCiclo]);

  return fechasCiclo;
}