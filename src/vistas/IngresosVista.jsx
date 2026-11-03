import React, { useState, useEffect, useCallback } from 'react';
import { obtenerIngresos, agregarIngreso, eliminarIngreso } from '../servicios/transaccionServicio';
import { formatearMoneda } from '../utilidades/formateaMoneda';
import { formatearMonto} from '../utilidades/formateador';

export function IngresosVista({ usuarioId, modoOculto }) {
  const [ingresos, setIngresos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados del formulario
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('Sueldo');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const cargarIngresos = useCallback(async () => {
    if (!usuarioId) return;
    try {
      setCargando(true);
      const data = await obtenerIngresos(usuarioId);
      setIngresos(data);
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarIngresos();
  }, [cargarIngresos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto) return;

    try {
      setGuardando(true);
      await agregarIngreso({
        user_id: usuarioId,
        amount: parseFloat(monto),
        category: categoria,
        description: descripcion,
        date: fecha
      });

      setMonto('');
      setDescripcion('');
      cargarIngresos();
    } catch (error) {
      console.error('Error al guardar ingreso:', error);
      alert('Error al guardar el ingreso en Supabase.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este registro de ingreso?')) return;
    try {
      await eliminarIngreso(id);
      cargarIngresos();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const totalIngresos = ingresos.reduce((acc, item) => acc + Number(item.amount), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn font-sans">
      
      {/* Encabezado Principal con Glassmorphism y Neón Esmeralda */}
      <div className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden neon-glow-emerald">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestión de Ingresos</h1>
          <p className="text-xs text-slate-400 mt-1">Registra tus entradas de dinero con trazabilidad segura.</p>
        </div>
        <div className="bg-slate-900/80 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 border border-slate-700/60 shadow-inner">
          Total Ingresos: <strong className="text-emerald-400 font-mono text-sm ml-1">${formatearMoneda(totalIngresos)}</strong>
        </div>
      </div>

      {/* 1. Formulario Arriba */}
      <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>💰</span> Registrar Nuevo Ingreso
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Monto ($)</label>
            <input
              type="number"
              step="any"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            >
              <option value="Sueldo">Sueldo / Salario</option>
              <option value="Freelance">Freelance / Extra</option>
              <option value="Inversiones">Inversiones</option>
              <option value="Regalo">Regalo / Varios</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Descripción (Opcional)</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Quincena de enero"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                📅 Fecha de la Transacción
            </label>
            <input
                type="date"
                value={fecha} // o date
                onChange={(e) => setFecha(e.target.value)} // o setDate(e.target.value)
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all [color-scheme:dark]"
            />
            </div>
          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all duration-300 text-sm disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : '⚡ Guardar Ingreso'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Historial Abajo */}
      <div className="glass-card p-6 rounded-2xl relative">
        <h3 className="text-base font-bold text-white mb-4">Historial de Ingresos</h3>
        {cargando ? (
          <div className="text-center py-8 text-slate-400 text-sm">Cargando historial...</div>
        ) : ingresos.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No hay ingresos registrados todavía.</div>
        ) : (
          <div className="space-y-3">
            {ingresos.map((item) => (
              <div 
                key={item.id} 
                className="flex justify-between items-center p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div>
                  <h4 className="font-bold text-white text-sm">{item.category}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description || 'Sin descripción'} • <span className="font-mono">{item.date}</span></p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-emerald-400 text-base">+${formatearMoneda(item.amount)}</span>
                  <button 
                    onClick={() => handleEliminar(item.id)} 
                    className="text-slate-500 hover:text-rose-400 text-xs p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                    title="Eliminar ingreso"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}