import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../configuracion/supabaseCliente';

function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function normalizarGasto(item) {
  const monto = Number(item?.amount ?? item?.monto ?? 0);
  const descripcion = item?.description ?? item?.descripcion ?? item?.title ?? 'Gasto';
  const categoria = item?.category ?? item?.categoria ?? 'General';
  const rawFecha = item?.created_at ?? item?.fecha ?? item?.date ?? '';

  let fechaISO = '';
  if (rawFecha) {
    const parsed = new Date(rawFecha);
    if (!Number.isNaN(parsed.getTime())) {
      fechaISO = obtenerFechaLocalISO(parsed);
    } else if (typeof rawFecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawFecha.trim())) {
      fechaISO = rawFecha.trim().slice(0, 10);
    }
  }

  return {
    ...item,
    id: item?.id,
    monto: Number.isFinite(monto) ? monto : 0,
    descripcion,
    categoria,
    fechaISO,
  };
}

export function GastosVista({ usuarioId, modoOculto = false }) {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [soloHoy, setSoloHoy] = useState(false);

  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('Alimentación');

  const cargarGastos = useCallback(async () => {
    if (!usuarioId) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', usuarioId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalizados = (Array.isArray(data) ? data : []).map(normalizarGasto);
      setGastos(normalizados);
    } catch (err) {
      console.error('Error al cargar gastos:', err);
      setErrorMsg(err?.message || 'No se pudieron cargar los gastos desde expenses.');
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarGastos();
  }, [cargarGastos]);

  const formatoCLP = useCallback(
    (valor = 0) => {
      if (modoOculto) return '••••••';
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(Number(valor) || 0);
    },
    [modoOculto]
  );

  const hoyISO = useMemo(() => obtenerFechaLocalISO(), []);

  const gastosDeHoy = useMemo(() => {
    return gastos.filter((item) => item.fechaISO === hoyISO);
  }, [gastos, hoyISO]);

  const montoGastadoHoy = useMemo(() => {
    return gastosDeHoy.reduce((acc, item) => acc + item.monto, 0);
  }, [gastosDeHoy]);

  const totalGeneral = useMemo(() => {
    return gastos.reduce((acc, item) => acc + item.monto, 0);
  }, [gastos]);

  const gastosVisibles = useMemo(() => {
    return soloHoy ? gastosDeHoy : gastos;
  }, [gastos, gastosDeHoy, soloHoy]);

  const manejarAgregarGasto = async (e) => {
    e.preventDefault();
    const montoNum = Number(monto);

    if (!usuarioId) {
      setErrorMsg('Sesión no encontrada para guardar el gasto.');
      return;
    }
    if (!descripcion.trim() || !montoNum || montoNum <= 0) {
      setErrorMsg('Ingresa una descripción y un monto válido mayor a 0.');
      return;
    }

    setGuardando(true);
    setErrorMsg(null);

    try {
      const payload = {
        user_id: usuarioId,
        description: descripcion.trim(),
        amount: montoNum,
        category: categoria || 'Otros',
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setGastos((prev) => [normalizarGasto(data), ...prev]);
      setDescripcion('');
      setMonto('');
    } catch (err) {
      console.error('Error al agregar gasto:', err);
      setErrorMsg(err?.message || 'No se pudo guardar el gasto en expenses.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminarGasto = async (idGasto) => {
    if (!usuarioId || !idGasto) return;
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', idGasto)
        .eq('user_id', usuarioId);

      if (error) throw error;

      setGastos((prev) => prev.filter((item) => item.id !== idGasto));
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
      setErrorMsg(err?.message || 'No se pudo eliminar el gasto.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Gastos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control diario y registro de egresos ({hoyISO})
          </p>
        </div>

        <button
          type="button"
          onClick={cargarGastos}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
        >
          ↻ Actualizar
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Resumen: Monto gastado hoy vs Total acumulado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-rose-500/35 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Monto gastado hoy
            </span>
            <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
              {cargando ? '...' : formatoCLP(montoGastadoHoy)}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">
              {gastosDeHoy.length} {gastosDeHoy.length === 1 ? 'gasto hoy' : 'gastos hoy'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSoloHoy((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              soloHoy
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            {soloHoy ? 'Viendo hoy' : 'Ver solo hoy'}
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Total gastos registrados
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
              {cargando ? '...' : formatoCLP(totalGeneral)}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">
              {gastos.length} {gastos.length === 1 ? 'movimiento' : 'movimientos'}
            </span>
          </div>
        </div>
      </div>

      {/* Formulario nuevo gasto */}
      <form
        onSubmit={manejarAgregarGasto}
        className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
      >
        <h2 className="text-sm font-bold text-slate-200">Registrar nuevo gasto</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            placeholder="Ej. Pan, colación, bencina..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
          />

          <input
            type="number"
            required
            min="1"
            step="1"
            placeholder="Monto ($)"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
        >
          <option value="Alimentación">Alimentación</option>
          <option value="Transporte">Transporte</option>
          <option value="Hogar y Cuentas">Hogar y Cuentas</option>
          <option value="Vehículo">Vehículo</option>
          <option value="Salud">Salud</option>
          <option value="Otros">Otros</option>
        </select>

        <button
          type="submit"
          disabled={guardando}
          className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : '+ Agregar Gasto'}
        </button>
      </form>

      {/* Listado */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">
            {soloHoy ? 'Gastos de hoy' : 'Listado de gastos'}
          </h2>
          <span className="text-xs text-slate-400">{gastosVisibles.length} registros</span>
        </div>

        {cargando ? (
          <p className="p-6 text-center text-sm text-slate-400">Cargando gastos...</p>
        ) : gastosVisibles.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">
            {soloHoy ? 'No hay gastos registrados hoy.' : 'No tienes gastos registrados aún.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/80">
            {gastosVisibles.map((gasto, idx) => (
              <li
                key={gasto?.id ?? idx}
                className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-950/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {gasto.descripcion}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {gasto.categoria} • {gasto.fechaISO || 'Sin fecha'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-rose-400">
                    -{formatoCLP(gasto.monto)}
                  </span>

                  {gasto?.id && (
                    <button
                      type="button"
                      onClick={() => manejarEliminarGasto(gasto.id)}
                      title="Eliminar gasto"
                      className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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

export default GastosVista;