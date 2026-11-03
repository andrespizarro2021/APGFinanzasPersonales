import React, { useState } from 'react';

export function ConfigurarCicloModal({ usuarioId, cicloActual, alGuardar, alCerrar }) {
  const [dia, setDia] = useState(cicloActual || 1);
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const nuevoDia = parseInt(dia, 10);
      // Guardar en el almacenamiento local del navegador asociado al usuario
      localStorage.setItem(`ciclo_dia_${usuarioId}`, nuevoDia.toString());
      
      alGuardar(nuevoDia);
      alCerrar();
    } catch (error) {
      console.error('Error al guardar ciclo:', error);
      alert('No se pudo guardar la configuración.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Personalización</span>
          <h3 className="text-xl font-bold text-white mt-0.5">Configurar Ciclo Mensual</h3>
          <p className="text-xs text-slate-400 mt-1">Elige el día del mes en que inicia tu período financiero (ej. cuando recibes tu sueldo).</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Día de inicio del ciclo (1 al 31)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white font-mono text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              Ejemplo: Si eliges el día 5, tus ciclos irán del 5 de cada mes al 4 del mes siguiente.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={alCerrar}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar Ciclo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}