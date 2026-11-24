import React, { useMemo, useState } from 'react';
import {
  calcularGastoDiario,
  filtrarGastosDeHoy,
  formatearMonedaCLP,
  obtenerFechaLocalISO,
} from '../utilidades/finanzasFecha';

export function HistorialVista({
  gastos = [],
  onAgregarGasto,
  onEliminarGasto,
  cargando = false,
}) {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('Alimentación');
  const [fecha, setFecha] = useState(obtenerFechaLocalISO());
  const [soloHoy, setSoloHoy] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const gastoHoy = useMemo(() => calcularGastoDiario(gastos), [gastos]);
  const movimientosHoy = useMemo(() => filtrarGastosDeHoy(gastos), [gastos]);

  const gastosVisibles = useMemo(() => {
    const base = soloHoy ? movimientosHoy : gastos;
    return [...base].sort((a, b) => {
      const fA = String(a?.fecha || a?.created_at || '');
      const fB = String(b?.fecha || b?.created_at || '');
      return fB.localeCompare(fA);
    });
  }, [gastos, movimientosHoy, soloHoy]);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    const montoNumerico = Number(monto);
    if (!descripcion.trim() || !montoNumerico || montoNumerico <= 0) return;

    setGuardando(true);
    try {
      if (typeof onAgregarGasto === 'function') {
        await onAgregarGasto({
          descripcion: descripcion.trim(),
          monto: montoNumerico,
          categoria,
          fecha,
        });
      }
      setDescripcion('');
      setMonto('');
      setFecha(obtenerFechaLocalISO());
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* Tarjeta superior: Gasto Diario */}
      <div className="p-5 rounded-2xl bg-[#161B22] border border-slate-800 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Monto gastado hoy
          </p>
          <p className="text-3xl font-black text-[#F43F5E] mt-1">
            {formatearMonedaCLP(gastoHoy)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {movimientosHoy.length}{' '}
            {movimientosHoy.length === 1 ? 'gasto registrado hoy' : 'gastos registrados hoy'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSoloHoy((prev) => !prev)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            soloHoy
              ? 'bg-[#F43F5E] text-white border-[#F43F5E]'
              : 'bg-[#0D1117] text-slate-300 border-slate-700 hover:border-slate-500'
          }`}
        >
          {soloHoy ? 'Viendo: Solo hoy' : 'Filtrar hoy'}
        </button>
      </div>

      {/* Formulario rápido de registro de gasto */}
      {typeof onAgregarGasto === 'function' && (
        <form
          onSubmit={manejarSubmit}
          className="p-4 rounded-2xl bg-[#161B22] border border-slate-800 space-y-3"
        >
          <h3 className="text-sm font-bold text-slate-200">Registrar nuevo gasto</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Ej. Supermercado, bencina, pan..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-[#0D1117] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F43F5E]"
            />

            <input
              type="number"
              required
              min="1"
              step="1"
              placeholder="Monto ($)"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full bg-[#0D1117] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F43F5E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-[#0D1117] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F43F5E]"
            >
              <option value="Alimentación">Alimentación</option>
              <option value="Transporte">Transporte</option>
              <option value="Cuentas y Hogar">Cuentas y Hogar</option>
              <option value="Salud">Salud</option>
              <option value="Vehículo">Vehículo</option>
              <option value="Otros">Otros</option>
            </select>

            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-[#0D1117] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F43F5E]"
            />
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full py-2.5 rounded-xl bg-[#F43F5E] hover:opacity-95 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {guardando ? 'Guardando gasto...' : '+ Agregar Gasto'}
          </button>
        </form>
      )}

      {/* Listado de gastos */}
      <div className="rounded-2xl bg-[#161B22] border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">
            {soloHoy ? 'Movimientos de hoy' : 'Historial de gastos'}
          </h3>
          <span className="text-xs text-slate-400">{gastosVisibles.length} registros</span>
        </div>

        {cargando ? (
          <p className="p-6 text-center text-sm text-slate-400">Cargando movimientos...</p>
        ) : gastosVisibles.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">
            {soloHoy ? 'Aún no registras gastos hoy.' : 'No hay gastos registrados.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/80">
            {gastosVisibles.map((gasto, idx) => (
              <li
                key={gasto.id || idx}
                className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#0D1117]/60 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {gasto.descripcion || 'Gasto sin descripción'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {gasto.categoria || 'General'} •{' '}
                    {String(gasto.fecha || gasto.created_at || '').slice(0, 10)}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-[#F43F5E]">
                    -{formatearMonedaCLP(gasto.monto)}
                  </span>

                  {typeof onEliminarGasto === 'function' && gasto.id && (
                    <button
                      type="button"
                      onClick={() => onEliminarGasto(gasto.id)}
                      title="Eliminar gasto"
                      className="text-xs text-slate-500 hover:text-[#F43F5E] px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default HistorialVista;