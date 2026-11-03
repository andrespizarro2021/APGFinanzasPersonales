import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../configuracion/supabaseCliente';
import { formatearMoneda } from '../utilidades/formateaMoneda';

export function MetasVista({ usuarioId }) {
  const [metas, setMetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Formulario nueva meta
  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [montoActual, setMontoActual] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  // Modal para abonar a una meta
  const [metaAbonar, setMetaAbonar] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');

  const cargarMetas = useCallback(async () => {
    if (!usuarioId) return;
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', usuarioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMetas(data || []);
    } catch (error) {
      console.error('Error al cargar metas:', error);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarMetas();
  }, [cargarMetas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !montoObjetivo) return;

    try {
      setGuardando(true);
      const target = parseFloat(montoObjetivo);
      const current = montoActual ? parseFloat(montoActual) : 0;

      const { error } = await supabase.from('goals').insert([
        {
          user_id: usuarioId,
          title: nombre,
          target_amount: target,
          current_amount: current,
          deadline: fechaLimite || null
        }
      ]);

      if (error) throw error;

      setNombre('');
      setMontoObjetivo('');
      setMontoActual('');
      setFechaLimite('');
      cargarMetas();
    } catch (error) {
      console.error('Error al crear meta:', error);
      alert('Error al guardar la meta de ahorro.');
    } finally {
      setGuardando(false);
    }
  };

  const handleAbonar = async (e) => {
    e.preventDefault();
    if (!montoAbono || !metaAbonar) return;

    try {
      const nuevoMonto = Number(metaAbonar.current_amount || 0) + parseFloat(montoAbono);
      const { error } = await supabase
        .from('goals')
        .update({ current_amount: nuevoMonto })
        .eq('id', metaAbonar.id);

      if (error) throw error;

      setMetaAbonar(null);
      setMontoAbono('');
      cargarMetas();
    } catch (error) {
      console.error('Error al registrar abono:', error);
      alert('No se pudo actualizar el ahorro.');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Deseas borrar esta meta de ahorro?')) return;
    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      cargarMetas();
    } catch (error) {
      console.error('Error al eliminar meta:', error);
    }
  };

  const totalAhorrado = metas.reduce((acc, m) => acc + Number(m.current_amount || 0), 0);
  const totalObjetivos = metas.reduce((acc, m) => acc + Number(m.target_amount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn font-sans">
      
      {/* Encabezado Principal con Glassmorphism y Neón Cian */}
      <div className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden neon-glow-cyan">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Metas y Fondo de Ahorro</h1>
          <p className="text-xs text-slate-400 mt-1">Monitorea tus objetivos financieros a mediano y largo plazo.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 border border-slate-700/60 shadow-inner">
            Acumulado: <strong className="text-emerald-400 font-mono text-sm ml-1">${formatearMoneda(totalAhorrado)}</strong>
          </div>
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 border border-slate-700/60 shadow-inner">
            Objetivo Global: <strong className="text-cyan-400 font-mono text-sm ml-1">${formatearMoneda(totalObjetivos)}</strong>
          </div>
        </div>
      </div>

      {/* Formulario de Nueva Meta */}
      <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>🎯</span> Crear Nueva Meta
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nombre / Objetivo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Fondo de Emergencia"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Monto Meta ($)</label>
            <input
              type="number"
              step="any"
              value={montoObjetivo}
              onChange={(e) => setMontoObjetivo(e.target.value)}
              placeholder="0"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Ahorro Inicial ($)</label>
            <input
              type="number"
              step="any"
              value={montoActual}
              onChange={(e) => setMontoActual(e.target.value)}
              placeholder="0 (Opcional)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha Límite</label>
            <input
                type="date"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all [color-scheme:dark]"
            />
            </div>
          <div className="sm:col-span-2 lg:col-span-4 pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all duration-300 text-sm disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : '⚡ Establecer Objetivo'}
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Metas */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Tus Objetivos Financieros</h3>
        {cargando ? (
          <div className="text-center py-8 text-slate-400 text-sm">Cargando metas...</div>
        ) : metas.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-sm">
            No tienes metas definidas. ¡Empieza creando la primera para visualizar tu progreso!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metas.map((meta) => {
              const actual = Number(meta.current_amount || 0);
              const metaTotal = Number(meta.target_amount || 1);
              const restante = Math.max(metaTotal - actual, 0);
              const porcentaje = Math.min(Math.round((actual / metaTotal) * 100), 100);
              const completada = actual >= metaTotal;

              return (
                <div
                  key={meta.id}
                  className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-base">{meta.title}</h4>
                      {meta.deadline && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">Meta para el <span className="font-mono">{meta.deadline}</span></span>
                      )}
                    </div>
                    <button
                      onClick={() => handleEliminar(meta.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                      title="Eliminar meta"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Barra de progreso */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400 font-mono">
                        ${formatearMoneda(actual)} / ${formatearMoneda(metaTotal)}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">{porcentaje}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          completada
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30'
                        }`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>

                  {/* Detalle y Botón de Abono */}
                  <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                    <span className="text-xs text-slate-400">
                      Faltan: <strong className="font-mono text-slate-200">${formatearMoneda(restante)}</strong>
                    </span>
                    <button
                      onClick={() => setMetaAbonar(meta)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-medium text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      ➕ Abonar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Abonar Ahorro */}
      {metaAbonar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Abonar a "{metaAbonar.title}"</h3>
            <form onSubmit={handleAbonar} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Monto a sumar ($)</label>
                <input
                  type="number"
                  step="any"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  placeholder="0"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMetaAbonar(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-cyan-600/30 transition-all"
                >
                  Sumar Ahorro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}