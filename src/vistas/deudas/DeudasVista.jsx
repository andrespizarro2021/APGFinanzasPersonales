import React, { useState, useEffect, useCallback } from 'react';
import { obtenerDeudas, agregarDeuda, eliminarDeuda } from '../servicios/deudaServicio';

export function DeudasVista({ usuarioId }) {
  const [deudas, setDeudas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [cuotaMensual, setCuotaMensual] = useState('');
  const [fechaCorte, setFechaCorte] = useState('');

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
    if (!nombre || !montoTotal) return;

    try {
      setGuardando(true);
      await agregarDeuda({
        user_id: usuarioId,
        name: nombre,
        total_amount: parseFloat(montoTotal),
        paid_amount: montoPagado ? parseFloat(montoPagado) : 0,
        monthly_payment: cuotaMensual ? parseFloat(cuotaMensual) : 0,
        due_date: fechaCorte || null
      });

      // Limpiar formulario
      setNombre('');
      setMontoTotal('');
      setMontoPagado('');
      setCuotaMensual('');
      setFechaCorte('');
      cargarDeudas();
    } catch (error) {
      console.error('Error al guardar deuda:', error);
      alert('Hubo un error al registrar la deuda. Revisa la consola o asegúrate de que la tabla "debts" exista en Supabase.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro de deuda?')) return;
    try {
      await eliminarDeuda(id);
      cargarDeudas();
    } catch (error) {
      console.error('Error al eliminar deuda:', error);
      alert('No se pudo eliminar el registro.');
    }
  };

  const deudaTotalGeneral = deudas.reduce((acc, item) => acc + (Number(item.total_amount) - Number(item.paid_amount || 0)), 0);
  const cuotaMensualTotal = deudas.reduce((acc, item) => acc + Number(item.monthly_payment || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Control de Deudas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra tus créditos, préstamos y pagos mensuales pendientes.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Deuda Pendiente: <strong className="text-red-500 font-mono text-sm">${deudaTotalGeneral.toLocaleString()}</strong>
          </div>
          <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Cuota Mensual: <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">${cuotaMensualTotal.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario a la izquierda */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Registrar Nueva Deuda
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Nombre de la Deuda
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Préstamo Auto / Tarjeta Visa"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Monto Total de la Deuda
                </label>
                <input
                  type="number"
                  step="any"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Monto Ya Pagado (Opcional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Cuota Mensual (Opcional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={cuotaMensual}
                  onChange={(e) => setCuotaMensual(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Fecha de Corte / Vencimiento
                </label>
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Registrar Deuda'}
              </button>
            </form>
          </div>
        </div>

        {/* Listado de Deudas a la derecha */}
        <div className="lg:col-span-2">
          {cargando ? (
            <div className="text-center py-12 text-slate-400 text-sm">Cargando deudas...</div>
          ) : deudas.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 text-center text-slate-400 text-sm">
              No hay deudas registradas. ¡Excelente trabajo manteniendo tus finanzas limpias!
            </div>
          ) : (
            <div className="space-y-4">
              {deudas.map((deuda) => {
                const total = Number(deuda.total_amount);
                const pagado = Number(deuda.paid_amount || 0);
                const restante = total - pagado;
                const porcentaje = total > 0 ? Math.min(Math.round((pagado / total) * 100), 100) : 0;

                return (
                  <div key={deuda.id} className="bg-white dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-base">{deuda.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Cuota mensual: <span className="font-mono text-slate-600 dark:text-slate-300">${Number(deuda.monthly_payment || 0).toLocaleString()}</span> {deuda.due_date && `• Vence: ${deuda.due_date}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEliminar(deuda.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Eliminar deuda"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Barra de Progreso de Pago */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span>Pagado: <strong className="font-mono text-emerald-500">${pagado.toLocaleString()}</strong> de ${total.toLocaleString()}</span>
                        <span className="font-mono font-bold text-indigo-500">{porcentaje}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700/50 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-violet-600 to-cyan-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50 text-xs">
                      <span className="text-slate-400">Restante por pagar:</span>
                      <span className="font-mono font-bold text-red-500 text-sm">${restante.toLocaleString()}</span>
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