import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../configuracion/supabaseCliente';

function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function normalizarIngreso(item) {
  const monto = Number(item?.amount ?? item?.monto ?? 0);
  const descripcion =
    item?.description ?? item?.descripcion ?? item?.source ?? item?.fuente ?? 'Ingreso';
  const categoria = item?.category ?? item?.categoria ?? 'Sueldo / Honorarios';
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

export function IngresosVista({ usuarioId, modoOculto = false }) {
  const [ingresos, setIngresos] = useState([]);
  const [tablaActiva, setTablaActiva] = useState('incomes');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('Sueldo');

  const cargarIngresos = useCallback(async () => {
    if (!usuarioId) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setErrorMsg(null);

    try {
      let tablaUsada = 'incomes';
      let { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', usuarioId)
        .order('created_at', { ascending: false });

      if (
        error &&
        (error.code === 'PGRST205' ||
          String(error.message || '').toLowerCase().includes('schema cache'))
      ) {
        tablaUsada = 'ingresos';
        const res = await supabase
          .from('ingresos')
          .select('*')
          .eq('user_id', usuarioId)
          .order('created_at', { ascending: false });
        data = res.data;
        error = res.error;
      }

      if (error) throw error;

      setTablaActiva(tablaUsada);
      setIngresos((Array.isArray(data) ? data : []).map(normalizarIngreso));
    } catch (err) {
      console.error('Error al cargar ingresos:', err);
      setErrorMsg(err?.message || 'No se pudieron cargar los ingresos.');
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarIngresos();
  }, [cargarIngresos]);

  const formatoCLP = useCallback(
    (valor = 0) => {
      if (modoOculto) return '••••••';
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(Math.round(Number(valor) || 0));
    },
    [modoOculto]
  );

  const hoyISO = useMemo(() => obtenerFechaLocalISO(), []);

  const totalIngresos = useMemo(() => {
    return ingresos.reduce((acc, item) => acc + item.monto, 0);
  }, [ingresos]);

  const manejarAgregarIngreso = async (e) => {
    e.preventDefault();
    const montoNum = Number(monto);

    if (!usuarioId) {
      setErrorMsg('Sesión no encontrada para guardar el ingreso.');
      return;
    }
    if (!descripcion.trim() || !montoNum || montoNum <= 0) {
      setErrorMsg('Ingresa una descripción y un monto válido mayor a 0.');
      return;
    }

    setGuardando(true);
    setErrorMsg(null);

    try {
      const payload =
        tablaActiva === 'incomes'
          ? {
              user_id: usuarioId,
              description: descripcion.trim(),
              amount: montoNum,
              category: categoria || 'Otros',
            }
          : {
              user_id: usuarioId,
              descripcion: descripcion.trim(),
              monto: montoNum,
              categoria: categoria || 'Otros',
            };

      const { data, error } = await supabase
        .from(tablaActiva)
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setIngresos((prev) => [normalizarIngreso(data), ...prev]);
      setDescripcion('');
      setMonto('');
    } catch (err) {
      console.error('Error al agregar ingreso:', err);
      setErrorMsg(err?.message || 'No se pudo guardar el ingreso.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminarIngreso = async (idIngreso) => {
    if (!usuarioId || !idIngreso) return;
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from(tablaActiva)
        .delete()
        .eq('id', idIngreso)
        .eq('user_id', usuarioId);

      if (error) throw error;

      setIngresos((prev) => prev.filter((item) => item.id !== idIngreso));
    } catch (err) {
      console.error('Error al eliminar ingreso:', err);
      setErrorMsg(err?.message || 'No se pudo eliminar el ingreso.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Ingresos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro y control de entradas de dinero ({hoyISO})
          </p>
        </div>

        <button
          type="button"
          onClick={cargarIngresos}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#161B22] hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
        >
          ↻ Actualizar
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-[#F43F5E] text-xs">
          {errorMsg}
        </div>
      )}

      {/* Resumen Total Ingresos */}
      <div className="p-5 rounded-2xl bg-[#161B22] border border-[#10B981]/35 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
            Total ingresos registrados
          </span>
          <p className="text-2xl sm:text-3xl font-black text-[#10B981] mt-1">
            {cargando ? '...' : formatoCLP(totalIngresos)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {ingresos.length} {ingresos.length === 1 ? 'ingreso registrado' : 'ingresos registrados'}
          </span>
        </div>
      </div>

      {/* Formulario nuevo ingreso */}
      <form
        onSubmit={manejarAgregarIngreso}
        className="p-5 rounded-2xl bg-[#161B22] border border-slate-800 space-y-3"
      >
        <h2 className="text-sm font-bold text-slate-200">Registrar nuevo ingreso</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            placeholder="Ej. Sueldo, venta, proyecto..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full bg-[#0D1117] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]"
          />

          <input
            type="number"
            required
            min="1"
            step="1"
            placeholder="Monto ($)"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full bg-[#0D1117] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]"
          />
        </div>

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full bg-[#0D1117] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]"
        >
          <option value="Sueldo">Sueldo</option>
          <option value="Honorarios / Freelance">Honorarios / Freelance</option>
          <option value="Ventas">Ventas</option>
          <option value="Bonos / Extras">Bonos / Extras</option>
          <option value="Otros">Otros</option>
        </select>

        <button
          type="submit"
          disabled={guardando}
          className="w-full py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : '+ Agregar Ingreso'}
        </button>
      </form>

      {/* Listado */}
      <div className="rounded-2xl bg-[#161B22] border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">Listado de ingresos</h2>
          <span className="text-xs text-slate-400">{ingresos.length} registros</span>
        </div>

        {cargando ? (
          <p className="p-6 text-center text-sm text-slate-400">Cargando ingresos...</p>
        ) : ingresos.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">
            No tienes ingresos registrados aún.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/80">
            {ingresos.map((ingreso, idx) => (
              <li
                key={ingreso?.id ?? idx}
                className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#0D1117]/60 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {ingreso.descripcion}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ingreso.categoria} • {ingreso.fechaISO || 'Sin fecha'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-[#10B981]">
                    +{formatoCLP(ingreso.monto)}
                  </span>

                  {ingreso?.id && (
                    <button
                      type="button"
                      onClick={() => manejarEliminarIngreso(ingreso.id)}
                      title="Eliminar ingreso"
                      className="text-xs text-slate-400 hover:text-[#F43F5E] px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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

export default IngresosVista;