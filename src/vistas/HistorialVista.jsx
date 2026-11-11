import React, { useState, useEffect } from 'react';
import { supabase } from '../configuracion/supabaseCliente';

export function HistorialVista({ usuarioId, cicloDiaInicio = 1, modoOculto = false }) {
  const [cargando, setCargando] = useState(true);
  const [gastosPorDia, setGastosPorDia] = useState({});
  const [totalCiclo, setTotalCiclo] = useState(0);

  useEffect(() => {
    if (usuarioId) {
      cargarHistorialCiclo();
    }
  }, [usuarioId, cicloDiaInicio]);

  const cargarHistorialCiclo = async () => {
    try {
      setCargando(true);

      // 1. Calcular el rango de fechas actual basado en el cicloDiaInicio
      const hoy = new Date();
      let anio = hoy.getFullYear();
      let mes = hoy.getMonth();

      let fechaInicio, fechaFin;

      if (hoy.getDate() >= cicloDiaInicio) {
        // El ciclo actual comenzó este mes
        fechaInicio = new Date(anio, mes, cicloDiaInicio);
        fechaFin = new Date(anio, mes + 1, cicloDiaInicio - 1);
      } else {
        // El ciclo actual comenzó el mes pasado
        fechaInicio = new Date(anio, mes - 1, cicloDiaInicio);
        fechaFin = new Date(anio, mes, cicloDiaInicio - 1);
      }

      // Formatear a YYYY-MM-DD para Supabase
      const formatoInicio = fechaInicio.toISOString().split('T')[0];
      const formatoFin = fechaFin.toISOString().split('T')[0];

      // 2. Consultar los gastos de la tabla 'expenses'
      const { data, error } = await supabase
        .from('expenses')
        .select('date, amount, description, category')
        .eq('user_id', usuarioId)
        .gte('date', formatoInicio)
        .lte('date', formatoFin)
        .order('date', { ascending: false });

      if (error) throw error;

      // 3. Agrupar y sumar los gastos por día
      const agrupados = {};
      let sumaTotal = 0;

      data.forEach((item) => {
        // Compatibilidad por si la fecha viene en 'date' o 'fecha'
        const diaStr = item.date || item.fecha; 
        const montoNum = Number(item.amount || item.monto || 0);

        if (!agrupados[diaStr]) {
          agrupados[diaStr] = {
            totalDia: 0,
            transacciones: []
          };
        }

        agrupados[diaStr].totalDia += montoNum;
        agrupados[diaStr].transacciones.push({
          descripcion: item.description || item.descripcion || 'Gasto sin descripción',
          categoria: item.category || item.categoria || 'General',
          monto: montoNum
        });

        sumaTotal += montoNum;
      });

      setGastosPorDia(agrupados);
      setTotalCiclo(sumaTotal);

    } catch (err) {
      console.error('Error al cargar historial del ciclo:', err);
    } finally {
      setCargando(false);
    }
  };

  const formatearMonto = (monto) => {
    if (modoOculto) return '••••••';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400 text-xs font-mono">
        Calculando historial diario del ciclo...
      </div>
    );
  }

  const diasKeys = Object.keys(gastosPorDia);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* Cabecera de la Vista */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            📂 Historial Diario del Ciclo
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Desglose detallado de gastos día a día (Iniciado el día {cicloDiaInicio} de cada mes).
          </p>
        </div>
        <div className="bg-slate-950/60 px-4 py-3 rounded-2xl border border-slate-800 text-right">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block font-mono">Total Gastado en el Ciclo</span>
          <span className="text-base font-black text-rose-400 font-mono">{formatearMonto(totalCiclo)}</span>
        </div>
      </div>

      {/* Lista de Gastos por Día */}
      {diasKeys.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-3xl p-12 text-center text-slate-500 text-xs font-mono">
          No hay registros de gastos en el ciclo actual.
        </div>
      ) : (
        <div className="space-y-4">
          {diasKeys.map((fecha) => {
            const infoDia = gastosPorDia[fecha];
            return (
              <div 
                key={fecha} 
                className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl transition-all hover:border-indigo-500/30"
              >
                {/* Cabecera del Día */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 font-mono bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                      📅 {fecha}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({infoDia.transacciones.length} {infoDia.transacciones.length === 1 ? 'movimiento' : 'movimientos'})
                    </span>
                  </div>
                  <span className="text-sm font-bold text-rose-400 font-mono">
                    {formatearMonto(infoDia.totalDia)}
                  </span>
                </div>

                {/* Detalle de transacciones del día */}
                <div className="space-y-2">
                  {infoDia.transacciones.map((tx, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1.5 px-3 rounded-xl bg-slate-950/40 border border-slate-900">
                      <div className="flex flex-col">
                        <span className="text-slate-200 font-medium">{tx.descripcion}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{tx.categoria}</span>
                      </div>
                      <span className="font-semibold text-rose-400/90 font-mono">
                        -{formatearMonto(tx.monto)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HistorialVista;