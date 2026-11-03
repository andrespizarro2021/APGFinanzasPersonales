import React, { useState, useEffect, useCallback } from 'react';
import { obtenerDeudas, agregarDeuda, eliminarDeuda, registrarPagoCuota } from '../servicios/deudaServicio';
import { formatearMoneda } from '../utilidades/formateaMoneda';
import { formatearMonto} from '../utilidades/formateador';

export function DeudasVista({ usuarioId }) {
  const [deudas, setDeudas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados del formulario
  const [creditor, setCreditor] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState('');
  const [fechaInicioPago, setFechaInicioPago] = useState('');

  // Estado para el Modal de Cuotas
  const [deudaSeleccionadaModal, setDeudaSeleccionadaModal] = useState(null);

  const cargarDeudas = useCallback(async () => {
    if (!usuarioId) return;
    try {
      setCargando(true);
      const data = await obtenerDeudas(usuarioId);
      setDeudas(data);
    } catch (error) {
      console.error('Error al cargar deudas:', error);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarDeudas();
  }, [cargarDeudas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!creditor || !montoTotal || !numeroCuotas || !fechaInicioPago) return;

    try {
      setGuardando(true);
      const total = parseFloat(montoTotal);
      const cuotas = parseInt(numeroCuotas, 10);
      const cuotaMonto = total / cuotas;

      await agregarDeuda({
        user_id: usuarioId,
        creditor: creditor,
        total_amount: total,
        remaining_amount: total,
        total_installments: cuotas,
        paid_installments: 0,
        monthly_payment: cuotaMonto,
        start_date: fechaInicioPago
      });

      setCreditor('');
      setMontoTotal('');
      setNumeroCuotas('');
      setFechaInicioPago('');
      cargarDeudas();
    } catch (error) {
      console.error('Error al guardar deuda:', error);
      alert('Error al guardar la deuda en Supabase.');
    } finally {
      setGuardando(false);
    }
  };

  const handlePagarCuota = async (deuda) => {
    try {
      const cuotasPagadas = deuda.paid_installments || 0;
      const totalCuotas = deuda.total_installments || 1;
      
      if (cuotasPagadas >= totalCuotas) {
        alert('¡Esta deuda ya está totalmente pagada!');
        return;
      }

      await registrarPagoCuota(deuda);
      cargarDeudas();
      const deudaActualizada = { ...deuda, paid_installments: cuotasPagadas + 1 };
      setDeudaSeleccionadaModal(deudaActualizada);
    } catch (error) {
      console.error('Error al registrar pago de cuota:', error);
      alert('No se pudo registrar el pago de la cuota.');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro de deuda?')) return;
    try {
      await eliminarDeuda(id);
      setDeudaSeleccionadaModal(null);
      cargarDeudas();
    } catch (error) {
      console.error('Error al eliminar deuda:', error);
    }
  };

  const generarCalendarioCuotas = (fechaInicial, totalCuotas, cuotasPagadas, cuotaMonto) => {
    if (!fechaInicial) return [];
    
    const lista = [];
    const [year, month, day] = fechaInicial.split('-').map(Number);

    for (let i = 0; i < totalCuotas; i++) {
      const fechaCuota = new Date(year, month - 1 + i, day);
      const estaPagada = i < cuotasPagadas;
      const esProxima = i === cuotasPagadas;

      lista.push({
        numero: i + 1,
        fecha: fechaCuota.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
        monto: cuotaMonto,
        pagada: estaPagada,
        proxima: esProxima
      });
    }

    return lista;
  };

  const deudaTotalGeneral = deudas.reduce((acc, item) => acc + Number(item.remaining_amount || 0), 0);
  const cuotaMensualTotal = deudas.reduce((acc, item) => {
    const totalCuotas = Number(item.total_installments || 1);
    const cuotasPagadas = Number(item.paid_installments || 0);
    return cuotasPagadas < totalCuotas ? acc + Number(item.monthly_payment || 0) : acc;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn font-sans">
      
      {/* Encabezado Principal con Glassmorphism y Neón Índigo */}
      <div className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden neon-glow-indigo">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Control de Deudas</h1>
          <p className="text-xs text-slate-400 mt-1">Planifica créditos y amortiza cuota por cuota.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 border border-slate-700/60 shadow-inner">
            Pendiente: <strong className="text-rose-400 font-mono text-sm ml-1">${formatearMoneda(deudaTotalGeneral)}</strong>
          </div>
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 border border-slate-700/60 shadow-inner">
            Cuota Mensual: <strong className="text-indigo-400 font-mono text-sm ml-1">${formatearMoneda(cuotaMensualTotal)}</strong>
          </div>
        </div>
      </div>

      {/* 1. Formulario Arriba */}
      <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>💳</span> Registrar Nueva Deuda
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Acreedor</label>
            <input
              type="text"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              placeholder="Ej. Banco / Tarjeta"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Monto Total ($)</label>
            <input
              type="number"
              step="any"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              placeholder="0"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nº Cuotas</label>
            <input
              type="number"
              min="1"
              value={numeroCuotas}
              onChange={(e) => setNumeroCuotas(e.target.value)}
              placeholder="Ej. 12"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">1er Vencimiento</label>
            <input
                type="date"
                value={fechaInicioPago}
                onChange={(e) => setFechaInicioPago(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all [color-scheme:dark]"
            />
            </div>
          <div className="sm:col-span-2 lg:col-span-4 pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-300 text-sm disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : '⚡ Crear Plan de Deuda'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Listado Horizontal de Deudas Abajo */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Deudas Activas</h3>
        {cargando ? (
          <div className="text-center py-8 text-slate-400 text-sm">Cargando deudas...</div>
        ) : deudas.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-sm">
            No tienes deudas registradas. ¡Excelente salud financiera!
          </div>
        ) : (
          <div className="space-y-3">
            {deudas.map((deuda) => {
              const total = Number(deuda.total_amount || 0);
              const totalCuotas = Number(deuda.total_installments || 1);
              const cuotasPagadas = Number(deuda.paid_installments || 0);
              const cuotaMonto = Number(deuda.monthly_payment || (total / totalCuotas));
              const saldoPendiente = Number(deuda.remaining_amount ?? (total - (cuotasPagadas * cuotaMonto)));
              const porcentajeProgreso = Math.min(Math.round((cuotasPagadas / totalCuotas) * 100), 100);
              const estaPagadaTotal = cuotasPagadas >= totalCuotas;

              return (
                <div 
                  key={deuda.id} 
                  className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  {/* Info principal horizontal */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">{deuda.creditor}</h4>
                      {estaPagadaTotal && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-semibold border border-emerald-800">
                          ¡Completada!
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Total: <strong className="font-mono text-slate-300">${formatearMoneda(total)}</strong></span>
                      <span>Cuota: <strong className="font-mono text-indigo-400">${formatearMoneda(cuotaMonto)}</strong></span>
                      <span>Progreso: <strong className="font-mono text-cyan-400">{cuotasPagadas}/{totalCuotas} ({porcentajeProgreso}%)</strong></span>
                    </div>
                  </div>

                  {/* Saldo y Botones de Acción Horizontal */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Saldo Pendiente</span>
                      <span className="font-mono font-bold text-rose-400 text-lg">
                        ${formatearMoneda(saldoPendiente)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDeudaSeleccionadaModal(deuda)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs rounded-xl transition-all shadow-sm"
                      >
                        📅 Ver Cuotas
                      </button>

                      <button
                        onClick={() => handleEliminar(deuda.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
                        title="Eliminar deuda"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. MODAL DE CUOTAS */}
      {deudaSeleccionadaModal && (() => {
        const deuda = deudaSeleccionadaModal;
        const totalCuotas = Number(deuda.total_installments || 1);
        const cuotasPagadas = Number(deuda.paid_installments || 0);
        const cuotaMonto = Number(deuda.monthly_payment || (deuda.total_amount / totalCuotas));
        const calendario = generarCalendarioCuotas(deuda.start_date, totalCuotas, cuotasPagadas, cuotaMonto);
        const estaPagadaTotal = cuotasPagadas >= totalCuotas;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Cabecera del Modal */}
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <div>
                  <h3 className="text-lg font-bold text-white">{deuda.creditor}</h3>
                  <p className="text-xs text-slate-400">Resumen de amortización y calendario de cuotas</p>
                </div>
                <button
                  onClick={() => setDeudaSeleccionadaModal(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  ✕
                </button>
              </div>

              {/* Contenido Desplazable del Modal */}
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* Resumen y Botón de Pagar Siguiente Cuota */}
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-950/60 rounded-xl gap-4 border border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">Cuotas Pagadas: <strong className="font-mono text-white">{cuotasPagadas} / {totalCuotas}</strong></span>
                    <span className="text-xs text-slate-400 block mt-0.5">Monto por cuota: <strong className="font-mono text-indigo-400">${formatearMoneda(cuotaMonto)}</strong></span>
                  </div>

                  {!estaPagadaTotal ? (
                    <button
                      onClick={() => handlePagarCuota(deuda)}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2"
                    >
                      💳 Pagar Cuota #{cuotasPagadas + 1}
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-emerald-950/80 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-800">
                      ¡Deuda Cancelada! 🎉
                    </span>
                  )}
                </div>

                {/* Lista de Cuotas */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Calendario Detallado
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {calendario.map((c) => (
                      <div
                        key={c.numero}
                        className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                          c.pagada
                            ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
                            : c.proxima
                            ? 'bg-indigo-950/50 border-indigo-700/80 text-indigo-300 font-bold ring-1 ring-indigo-500/30'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div>
                          <span className="block font-semibold">Cuota #{c.numero}</span>
                          <span className="text-[10px] opacity-75">{c.fecha}</span>
                        </div>
                        <span className="font-mono font-medium">
                          {c.pagada ? '✓ Pagada' : `$${formatearMoneda(c.monto)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Pie del Modal */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
                <button
                  onClick={() => setDeudaSeleccionadaModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-all"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}