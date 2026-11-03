import React, { useState, useEffect, useCallback } from 'react';
import { usarCicloFinanciero } from '../../hooks/usarCicloFinanciero';
import { obtenerIngresos, obtenerGastos } from '../../servicios/transaccionServicio';
import { obtenerDeudas } from '../../servicios/deudaServicio';
import { FormularioTransaccion } from '../../componentes/transacciones/FormularioTransaccion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatearMonto} from '../../utilidades/formateador';

// Función auxiliar para formatear dinero sin decimales y con puntos de miles
const formatearMoneda = (monto) => {
  return Number(monto || 0).toLocaleString('es-CL', { 
    maximumFractionDigits: 0 
  });
};


export function DashboardVista({ usuarioId, cicloDiaInicio = 1, modoOculto }) {
  const [ingresosTotales, setIngresosTotales] = useState(0);
  const [gastosTotales, setGastosTotales] = useState(0);
  const [gastosPorCategoria, setGastosPorCategoria] = useState({});
  const [deudaTotalCiclo, setDeudaTotalCiclo] = useState(0);
  const [cargando, setCargando] = useState(true);

  // Obtenemos las fechas del ciclo actual basadas en el día configurado que viene por prop
  const { fechaInicio, fechaFin, diasRestantes, presupuestoDiario } = usarCicloFinanciero(0, cicloDiaInicio);

  const cargarDatosFinancieros = useCallback(async () => {
    if (!usuarioId || usuarioId === "pega-tu-uuid-real-aqui") {
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const [listaIngresos, listaGastos, listaDeudas] = await Promise.all([
        obtenerIngresos(usuarioId),
        obtenerGastos(usuarioId),
        obtenerDeudas(usuarioId).catch(() => [])
      ]);

      // --- FILTRAR INGRESOS SEGÚN EL CICLO ACTUAL ---
      const ingresosFiltrados = listaIngresos.filter((item) => {
        if (!item.date) return true;
        const fechaItem = new Date(item.date + 'T00:00:00');
        return fechaItem >= fechaInicio && fechaItem <= fechaFin;
      });

      const totalIngresos = ingresosFiltrados.reduce((acc, item) => acc + Number(item.amount), 0);
      setIngresosTotales(totalIngresos);

      // --- FILTRAR GASTOS SEGÚN EL CICLO ACTUAL ---
      let totalGastos = 0;
      const categorias = {};

      listaGastos.forEach((gasto) => {
        if (gasto.date) {
          const fechaGasto = new Date(gasto.date + 'T00:00:00');
          if (fechaGasto < fechaInicio || fechaGasto > fechaFin) return;
        }

        const monto = Number(gasto.amount);
        totalGastos += monto;
        categorias[gasto.category] = (categorias[gasto.category] || 0) + monto;
      });

      setGastosTotales(totalGastos);
      setGastosPorCategoria(categorias);

      const totalDeudas = listaDeudas.reduce((acc, item) => {
        const restante = item.remaining_amount !== undefined 
          ? Number(item.remaining_amount) 
          : Number(item.total_amount || 0) - (Number(item.paid_installments || 0) * Number(item.monthly_payment || 0));
        return acc + Math.max(restante, 0);
      }, 0);
      
      setDeudaTotalCiclo(totalDeudas);

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setCargando(false);
    }
  }, [usuarioId, fechaInicio, fechaFin]);

  useEffect(() => {
    cargarDatosFinancieros();
  }, [cargarDatosFinancieros]);

  const saldoDisponible = ingresosTotales - gastosTotales;
  const presupuestoCalculado = usarCicloFinanciero(saldoDisponible, cicloDiaInicio).presupuestoDiario;

  // Cálculo del porcentaje del presupuesto gastado en el ciclo
  const porcentajeGastado = ingresosTotales > 0 
    ? Math.min(Math.round((gastosTotales / ingresosTotales) * 100), 100) 
    : (gastosTotales > 0 ? 100 : 0);

  let estadoTexto = 'Saludable';
  let estadoBadgeBg = 'bg-emerald-950/80 text-emerald-400 border-emerald-800';

  if (porcentajeGastado >= 85) {
    estadoTexto = '¡Punto Crítico / Alerta!';
    estadoBadgeBg = 'bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse';
  } else if (porcentajeGastado >= 70) {
    estadoBadgeBg = 'bg-amber-950/80 text-amber-400 border-amber-800';
    estadoTexto = 'Precaución';
  }

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400 font-medium">
        Cargando tus finanzas...
      </div>
    );
  }
 // --- CALCULAR COMPARATIVO HISTÓRICO DE LOS ÚLTIMOS 4 MESES ---
  const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  // Agrupar todos los gastos históricos por mes y año
  const mapaMeses = {};
  // Si tienes guardada toda la lista de gastos sin filtrar por ciclo en alguna variable o si prefieres agrupar los del ciclo actual y anteriores:
  // (Asumiendo que tienes acceso a la lista completa de gastos, o puedes usar los del ciclo actual).
  // Vamos a generar un objeto con los últimos 4 meses dinámicamente:
  const fechaActualObj = new Date();
  for (let i = 3; i >= 0; i--) {
    const d = new Date(fechaActualObj.getFullYear(), fechaActualObj.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${d.getMonth()}`;
    const nombreEtiqueta = `${nombresMeses[d.getMonth()]} ${d.getFullYear()}`;
    mapaMeses[clave] = { mes: nombreEtiqueta, gastos: 0, anio: d.getFullYear(), mesIndex: d.getMonth() };
  }

        // Rellenar con los gastos reales (si tienes la lista completa de gastos guardada en un estado o variable)
        // Si usas listaGastos general:
        if (typeof listaGastosCompleta !== 'undefined') {
            listaGastosCompleta.forEach(gasto => {
            if (!gasto.date) return;
            const f = new Date(gasto.date + 'T00:00:00');
            const clave = `${f.getFullYear()}-${f.getMonth()}`;
            if (mapaMeses[clave]) {
                mapaMeses[clave].gastos += Number(gasto.amount || 0);
            }
            });
        } else {
            // Fallback si solo tienes el gasto total del ciclo actual
            const claveActual = `${fechaActualObj.getFullYear()}-${fechaActualObj.getMonth()}`;
            if (mapaMeses[claveActual]) {
            mapaMeses[claveActual].gastos = gastosTotales;
            }
        }

        const datosComparativosMeses = Object.values(mapaMeses);
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12 font-sans">
      
      {/* Encabezado con Glassmorphism */}
      <div className="glass-card glass-card-hover p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Panel Financiero</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ciclo actual: <span className="font-semibold text-slate-200">{fechaInicio.toLocaleDateString()}</span> al <span className="font-semibold text-slate-200">{fechaFin.toLocaleDateString()}</span> (Inicia el día {cicloDiaInicio})
          </p>
        </div>
        <div className="glass-card px-4 py-2 rounded-2xl text-xs font-semibold text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
          ⏳ Días restantes: <strong className="text-indigo-400 font-mono text-sm">{diasRestantes}</strong>
        </div>
      </div>

      {/* Tarjetas Principales con Glassmorphism y Hover */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Saldo Disponible */}
        <div className="glass-card glass-card-hover neon-glow-indigo p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            ⚡
          </div>
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">Saldo Disponible</span>
          <h3 className={`text-2xl font-black font-mono tracking-tight mt-2 ${saldoDisponible >= 0 ? 'text-white' : 'text-rose-400'}`}>
            ${formatearMoneda(saldoDisponible)}
          </h3>
          <span className="text-[11px] text-slate-400 mt-2 block">Ingresos menos gastos del ciclo</span>
        </div>

        {/* Presupuesto Diario */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            📅
          </div>
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">Presupuesto Diario</span>
          <h3 className="text-2xl font-black font-mono tracking-tight mt-2 text-white">
            ${formatearMoneda(presupuestoCalculado)}
          </h3>
          <span className="text-[11px] text-slate-400 mt-2 block">Recomendado para hoy</span>
        </div>

        {/* Ingresos Totales */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            📈
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Ingresos del Ciclo</span>
          <h3 className="text-2xl font-black font-mono tracking-tight mt-2 text-emerald-400">
            +${formatearMoneda(ingresosTotales)}
          </h3>
          <span className="text-[11px] text-slate-400 mt-2 block">Total acumulado en el ciclo</span>
        </div>

        {/* Gastos Totales */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
            📉
          </div>
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">Gastos del Ciclo</span>
          <h3 className="text-2xl font-black font-mono tracking-tight mt-2 text-rose-400">
            -${formatearMoneda(gastosTotales)}
          </h3>
          <span className="text-[11px] text-slate-400 mt-2 block">Total acumulado en el ciclo</span>
        </div>

        {/* Deuda Total del Ciclo */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden sm:col-span-2 lg:col-span-1 group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            💳
          </div>
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Deuda Pendiente</span>
          <h3 className="text-2xl font-black font-mono tracking-tight mt-2 text-amber-400">
            ${formatearMoneda(deudaTotalCiclo)}
          </h3>
          <span className="text-[11px] text-slate-400 mt-2 block">Total por amortizar</span>
        </div>

      </div>

      {/* Gráfico de Estado Crítico del Presupuesto */}
      <div className={`glass-card glass-card-hover p-6 rounded-3xl space-y-4 relative overflow-hidden ${porcentajeGastado >= 85 ? 'neon-glow-rose' : ''}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Analítica y Consumo del Presupuesto del Ciclo</h3>
            <p className="text-xs text-slate-400">Monitoreo automático del porcentaje de egresos en relación a tus ingresos del ciclo</p>
          </div>
          <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${estadoBadgeBg}`}>
            {estadoTexto}
          </span>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Gastos consumidos: <strong className="text-white font-mono">${formatearMoneda(gastosTotales)}</strong></span>
            <span className="text-slate-400">Ingresos del ciclo: <strong className="text-white font-mono">${formatearMoneda(ingresosTotales)}</strong></span>
          </div>

          <div className="w-full bg-slate-950/90 h-5 rounded-2xl p-1 border border-slate-800 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-xl transition-all duration-700 shadow-md ${
                porcentajeGastado >= 85 
                  ? 'bg-gradient-to-r from-rose-600 to-red-500 shadow-rose-600/50' 
                  : porcentajeGastado >= 70 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                  : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
              }`}
              style={{ width: `${porcentajeGastado}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-slate-400">Porcentaje utilizado: <strong className="font-mono text-white">{porcentajeGastado}%</strong></span>
            {porcentajeGastado >= 85 && (
              <span className="text-rose-400 font-bold animate-pulse">⚠️ ¡Atención! Estás en punto crítico de consumo del ciclo.</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid Principal: Formulario y Segmentación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
       

        {/* Segmentación de Gastos a la derecha */}
        <div className="lg:col-span-2 glass-card glass-card-hover p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-white mb-4">
            Segmentación de Gastos por Categoría (Ciclo Actual)
          </h3>
        
        {/* Gráfico Comparativo Mensual */}
            <div className="glass-card glass-card-hover p-6 rounded-3xl space-y-4">
            <div>
                <h3 className="text-base font-bold text-white">Comparativo Histórico de Gastos</h3>
                <p className="text-xs text-slate-400">Evolución de egresos en los últimos ciclos financieros</p>
            </div>

            <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosComparativosMeses}>
                    <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(value) => [`$${formatearMoneda(value)}`, 'Gastos']}
                    />
                    <Bar dataKey="gastos" fill="#f43f5e" radius={[8, 8, 0, 0]}>
                    {datosComparativosMeses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === datosComparativosMeses.length - 1 ? '#f43f5e' : '#6366f1'} />
                    ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
          {Object.keys(gastosPorCategoria).length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No hay gastos registrados en este ciclo. ¡Usa el formulario de la izquierda para registrar el primero!
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(gastosPorCategoria).map(([categoria, monto]) => {
                const porcentaje = gastosTotales > 0 ? Math.round((monto / gastosTotales) * 100) : 0;
                return (
                  <div key={categoria} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium text-slate-300">
                      <span>{categoria}</span>
                      <span className="font-mono text-white">${formatearMoneda(monto)} <span className="text-slate-400 text-xs">({porcentaje}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-950/80 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                      <div 
                        className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-sm" 
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}