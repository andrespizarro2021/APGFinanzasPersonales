import React, { useState, useEffect, useCallback } from 'react';
import { obtenerIngresos, obtenerGastos } from '../servicios/transaccionServicio';
import { obtenerDeudas } from '../servicios/deudaServicio';
import { formatearMonto } from '../utilidades/formateador';

const formatearMoneda = (monto) => {
  return Number(monto || 0).toLocaleString('es-CL', { 
    maximumFractionDigits: 0 
  });
};

export function HistorialVista({ usuarioId }) {
  const [historialMeses, setHistorialMeses] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarHistorial = useCallback(async () => {
    if (!usuarioId) return;

    try {
      setCargando(true);
      const [listaIngresos, listaGastos, listaDeudas] = await Promise.all([
        obtenerIngresos(usuarioId).catch(() => []),
        obtenerGastos(usuarioId).catch(() => []),
        obtenerDeudas(usuarioId).catch(() => [])
      ]);

      const mesesAgrupados = {};

      const obtenerClaveMes = (fechaStr) => {
        if (!fechaStr) return null;
        // Limpiar la cadena por si viene con formato ISO completo (ej. 2026-10-21T00:00:00)
        const soloFecha = String(fechaStr).split('T')[0];
        const partes = soloFecha.split('-');
        
        if (partes.length < 2) return null;
        
        const anio = partes[0];
        const mes = partes[1];
        
        if (!anio || !mes || isNaN(anio) || isNaN(mes)) return null;
        return `${anio}-${mes.padStart(2, '0')}`;
      };

      const crearEstructuraMes = (clave) => {
        let nombreFormateado = clave;
        if (clave && clave !== 'Sin Fecha') {
          const [anio, mes] = clave.split('-');
          const fechaObj = new Date(Number(anio), Number(mes) - 1, 1);
          if (!isNaN(fechaObj.getTime())) {
            nombreFormateado = fechaObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            nombreFormateado = nombreFormateado.charAt(0).toUpperCase() + nombreFormateado.slice(1);
          }
        }
        return {
          clave: clave || 'sin-fecha',
          nombre: nombreFormateado || 'Período Indefinido',
          ingresos: 0,
          gastosNormales: 0,
          gastosHormiga: 0,
          gastosTotales: 0,
          deudasPendientes: 0,
        };
      };

      // Procesar Ingresos
      listaIngresos.forEach(item => {
        const clave = obtenerClaveMes(item.date) || obtenerClaveMes(item.created_at) || '2026-10'; // Fallback seguro
        if (!mesesAgrupados[clave]) mesesAgrupados[clave] = crearEstructuraMes(clave);
        mesesAgrupados[clave].ingresos += Number(item.amount || 0);
      });

      // Procesar Gastos y Gastos Hormiga
      listaGastos.forEach(item => {
        const clave = obtenerClaveMes(item.date) || obtenerClaveMes(item.created_at) || '2026-10';
        if (!mesesAgrupados[clave]) mesesAgrupados[clave] = crearEstructuraMes(clave);
        const monto = Number(item.amount || 0);
        mesesAgrupados[clave].gastosTotales += monto;

        if (item.category === 'Gastos Hormiga') {
          mesesAgrupados[clave].gastosHormiga += monto;
        } else {
          mesesAgrupados[clave].gastosNormales += monto;
        }
      });

      // Procesar Deudas
      listaDeudas.forEach(item => {
        const restante = item.remaining_amount !== undefined 
          ? Number(item.remaining_amount) 
          : Number(item.total_amount || 0) - (Number(item.paid_installments || 0) * Number(item.monthly_payment || 0));
        
        const clave = obtenerClaveMes(item.created_at) || obtenerClaveMes(item.fecha_inicio) || '2026-10';
        if (!mesesAgrupados[clave]) mesesAgrupados[clave] = crearEstructuraMes(clave);
        mesesAgrupados[clave].deudasPendientes += Math.max(restante, 0);
      });

      const arrayHistorial = Object.values(mesesAgrupados).sort((a, b) => b.clave.localeCompare(a.clave));
      setHistorialMeses(arrayHistorial);

    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400 font-medium">
        Cargando historial de ciclos...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12 font-sans">
      
      {/* Encabezado */}
      <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="text-2xl font-black text-white tracking-tight">Historial de Ciclos Financieros</h1>
        <p className="text-xs text-slate-400 mt-1">
          Resumen detallado de tus ingresos, egresos, gastos hormiga y deudas por cada período anterior.
        </p>
      </div>

      {historialMeses.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 text-sm rounded-3xl">
          No hay registros históricos suficientes en este momento.
        </div>
      ) : (
        <div className="space-y-4">
          {historialMeses.map((mes) => {
            const saldoNeto = mes.ingresos - mes.gastosTotales;
            return (
              <div key={mes.clave} className="glass-card glass-card-hover p-6 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">{mes.nombre}</h3>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">Período Financiero Cerrado</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Balance Neto</span>
                    <span className={`text-base font-black font-mono ${saldoNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {saldoNeto >= 0 ? '+' : ''}${formatearMoneda(saldoNeto)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  {/* Ingresos */}
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-emerald-500/20">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">Ingresos</span>
                    <span className="text-lg font-black font-mono text-white mt-1 block">
                      +${formatearMoneda(mes.ingresos)}
                    </span>
                  </div>

                  {/* Gastos Totales */}
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-rose-500/20">
                    <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block">Gastos Totales</span>
                    <span className="text-lg font-black font-mono text-white mt-1 block">
                      -${formatearMoneda(mes.gastosTotales)}
                    </span>
                  </div>

                  {/* Gastos Hormiga */}
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-amber-500/20">
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">🐜 Gastos Hormiga</span>
                    <span className="text-lg font-black font-mono text-amber-300 mt-1 block">
                      -${formatearMoneda(mes.gastosHormiga)}
                    </span>
                  </div>

                  {/* Deudas */}
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-cyan-500/20">
                    <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block">Deuda Pendiente</span>
                    <span className="text-lg font-black font-mono text-white mt-1 block">
                      ${formatearMoneda(mes.deudasPendientes)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}