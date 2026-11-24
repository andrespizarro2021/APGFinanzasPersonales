import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../configuracion/supabaseCliente';

function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function extraerFechaLocal(item) {
  const raw = item?.created_at ?? item?.fecha ?? item?.date ?? '';
  if (!raw) return null;

  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    const [anio, mes, dia] = raw.trim().split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function extraerMonto(item) {
  const val = Number(item?.amount ?? item?.monto ?? 0);
  return Number.isFinite(val) ? val : 0;
}

function obtenerDatosCiclo(diaInicio = 1, referencia = new Date()) {
  const diaSeguro = Math.min(28, Math.max(1, Number(diaInicio) || 1));
  const anio = referencia.getFullYear();
  const mes = referencia.getMonth();
  const diaActual = referencia.getDate();

  let inicio;
  let fin;

  if (diaActual >= diaSeguro) {
    inicio = new Date(anio, mes, diaSeguro);
    fin = new Date(anio, mes + 1, diaSeguro - 1);
  } else {
    inicio = new Date(anio, mes - 1, diaSeguro);
    fin = new Date(anio, mes, diaSeguro - 1);
  }

  const hoySinHora = new Date(anio, mes, diaActual);
  const msPorDia = 1000 * 60 * 60 * 24;

  const diasTotales = Math.max(1, Math.round((fin - inicio) / msPorDia) + 1);
  const diasTranscurridos = Math.min(
    diasTotales,
    Math.max(1, Math.round((hoySinHora - inicio) / msPorDia) + 1)
  );
  const diasRestantes = Math.max(1, Math.round((fin - hoySinHora) / msPorDia) + 1);

  return {
    inicioISO: obtenerFechaLocalISO(inicio),
    finISO: obtenerFechaLocalISO(fin),
    diasTotales,
    diasTranscurridos,
    diasRestantes,
  };
}

async function consultarTablaConRespaldo(tablasCandidatas, usuarioId) {
  for (const tabla of tablasCandidatas) {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .eq('user_id', usuarioId);

    if (!error) {
      return { data: Array.isArray(data) ? data : [], error: null };
    }

    const esTablaInexistente =
      error?.code === 'PGRST205' ||
      String(error?.message || '').toLowerCase().includes('schema cache') ||
      String(error?.message || '').toLowerCase().includes('does not exist');

    if (!esTablaInexistente) {
      return { data: [], error };
    }
  }

  return { data: [], error: null };
}

export function DashboardVista({
  usuarioId,
  cicloDiaInicio = 1,
  modoOculto = false,
}) {
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [metas, setMetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [umbralHormiga, setUmbralHormiga] = useState(5000);

  const cargarResumen = useCallback(async () => {
    if (!usuarioId) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setErrorMsg(null);

    try {
      const [resIngresos, resExpenses, resDeudas, resMetas] = await Promise.all([
        consultarTablaConRespaldo(['incomes', 'ingresos'], usuarioId),
        consultarTablaConRespaldo(['expenses', 'gastos'], usuarioId),
        consultarTablaConRespaldo(['debts', 'deudas'], usuarioId),
        consultarTablaConRespaldo(['goals', 'metas'], usuarioId),
      ]);

      if (resIngresos.error) console.warn('Aviso ingresos:', resIngresos.error);
      if (resExpenses.error) throw resExpenses.error;

      setIngresos(resIngresos.data);
      setGastos(resExpenses.data);
      setDeudas(resDeudas.data);
      setMetas(resMetas.data);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      setErrorMsg(err?.message || 'No se pudieron cargar los datos del dashboard.');
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

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

  const ciclo = useMemo(
    () => obtenerDatosCiclo(cicloDiaInicio),
    [cicloDiaInicio]
  );

  const hoyISO = useMemo(() => obtenerFechaLocalISO(), []);

  // Movimientos del ciclo activo
  const ingresosCiclo = useMemo(() => {
    return ingresos.filter((item) => {
      const f = extraerFechaLocal(item);
      if (!f) return true;
      const iso = obtenerFechaLocalISO(f);
      return iso >= ciclo.inicioISO && iso <= ciclo.finISO;
    });
  }, [ingresos, ciclo]);

  const gastosCiclo = useMemo(() => {
    return gastos.filter((item) => {
      const f = extraerFechaLocal(item);
      if (!f) return true;
      const iso = obtenerFechaLocalISO(f);
      return iso >= ciclo.inicioISO && iso <= ciclo.finISO;
    });
  }, [gastos, ciclo]);

  const gastosHoy = useMemo(() => {
    return gastos.filter((item) => {
      const f = extraerFechaLocal(item);
      return f && obtenerFechaLocalISO(f) === hoyISO;
    });
  }, [gastos, hoyISO]);

  // Totales financieros
  const totalIngresosCiclo = useMemo(
    () => ingresosCiclo.reduce((acc, item) => acc + extraerMonto(item), 0),
    [ingresosCiclo]
  );

  const totalGastosCiclo = useMemo(
    () => gastosCiclo.reduce((acc, item) => acc + extraerMonto(item), 0),
    [gastosCiclo]
  );

  const montoGastadoHoy = useMemo(
    () => gastosHoy.reduce((acc, item) => acc + extraerMonto(item), 0),
    [gastosHoy]
  );

  const balanceDisponible = totalIngresosCiclo - totalGastosCiclo;

  // --- 1. PRESUPUESTO DIARIO ---
  // Saldo disponible antes de los gastos de hoy dividido por los días restantes (incluyendo hoy)
  const saldoAlIniciarHoy = balanceDisponible + montoGastadoHoy;
  const presupuestoDiarioBase =
    saldoAlIniciarHoy > 0 ? saldoAlIniciarHoy / ciclo.diasRestantes : 0;
  const presupuestoDiarioRestanteHoy = presupuestoDiarioBase - montoGastadoHoy;
  const presupuestoDiarioManana =
    balanceDisponible > 0 && ciclo.diasRestantes > 1
      ? balanceDisponible / (ciclo.diasRestantes - 1)
      : balanceDisponible > 0
      ? balanceDisponible
      : 0;

  // --- 2. CONSUMO DEL PRESUPUESTO DEL CICLO ---
  const porcentajeConsumido = useMemo(() => {
    if (totalIngresosCiclo <= 0) return totalGastosCiclo > 0 ? 100 : 0;
    return Math.min(100, Math.round((totalGastosCiclo / totalIngresosCiclo) * 100));
  }, [totalIngresosCiclo, totalGastosCiclo]);

  const porcentajeRealSinTope = useMemo(() => {
    if (totalIngresosCiclo <= 0) return totalGastosCiclo > 0 ? 100 : 0;
    return Math.round((totalGastosCiclo / totalIngresosCiclo) * 100);
  }, [totalIngresosCiclo, totalGastosCiclo]);

  const promedioGastoDiario = totalGastosCiclo / ciclo.diasTranscurridos;
  const proyeccionGastoCiclo = promedioGastoDiario * ciclo.diasTotales;

  // --- 3. ANALÍTICA POR CATEGORÍA ---
  const analiticaCategorias = useMemo(() => {
    const mapa = {};
    for (const g of gastosCiclo) {
      const cat = (g?.category ?? g?.categoria ?? 'Otros').trim() || 'Otros';
      const monto = extraerMonto(g);
      if (!mapa[cat]) {
        mapa[cat] = { categoria: cat, total: 0, cantidad: 0 };
      }
      mapa[cat].total += monto;
      mapa[cat].cantidad += 1;
    }

    return Object.values(mapa)
      .sort((a, b) => b.total - a.total)
      .map((item) => ({
        ...item,
        porcentaje:
          totalGastosCiclo > 0
            ? Math.round((item.total / totalGastosCiclo) * 100)
            : 0,
      }));
  }, [gastosCiclo, totalGastosCiclo]);

  // --- 4. GASTOS HORMIGA ---
  const gastosHormiga = useMemo(() => {
    return gastosCiclo
      .filter((g) => {
        const m = extraerMonto(g);
        return m > 0 && m <= umbralHormiga;
      })
      .sort((a, b) => extraerMonto(b) - extraerMonto(a));
  }, [gastosCiclo, umbralHormiga]);

  const totalGastosHormiga = useMemo(
    () => gastosHormiga.reduce((acc, item) => acc + extraerMonto(item), 0),
    [gastosHormiga]
  );

  const porcentajeHormigaDelTotal =
    totalGastosCiclo > 0
      ? Math.round((totalGastosHormiga / totalGastosCiclo) * 100)
      : 0;

  // Deudas y metas
  const totalDeudasPendientes = useMemo(
    () =>
      deudas.reduce(
        (acc, d) =>
          acc + (Number(d?.monto_pendiente ?? d?.saldo ?? d?.monto ?? d?.amount ?? 0) || 0),
        0
      ),
    [deudas]
  );

  const totalAhorradoMetas = useMemo(
    () =>
      metas.reduce(
        (acc, m) =>
          acc +
          (Number(m?.monto_actual ?? m?.ahorrado ?? m?.saved_amount ?? m?.monto ?? 0) || 0),
        0
      ),
    [metas]
  );

  if (cargando) {
    return (
      <div className="p-6 rounded-2xl bg-[#161B22] border border-slate-800 text-slate-400 text-sm">
        Cargando analítica financiera...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ciclo: <span className="text-slate-200 font-semibold">{ciclo.inicioISO}</span> al{' '}
            <span className="text-slate-200 font-semibold">{ciclo.finISO}</span> • Día{' '}
            <span className="text-slate-200 font-semibold">
              {ciclo.diasTranscurridos}/{ciclo.diasTotales}
            </span>{' '}
            (quedan {ciclo.diasRestantes} {ciclo.diasRestantes === 1 ? 'día' : 'días'})
          </p>
        </div>

        <button
          type="button"
          onClick={cargarResumen}
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

      {/* Bloque 1: Balance + Presupuesto Diario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Balance disponible */}
        <div className="p-6 rounded-3xl bg-[#161B22] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Balance disponible del ciclo
            </span>
            <p
              className={`text-3xl sm:text-4xl font-black mt-1.5 ${
                modoOculto
                  ? 'text-slate-200'
                  : balanceDisponible >= 0
                  ? 'text-[#10B981]'
                  : 'text-[#F43F5E]'
              }`}
            >
              {formatoCLP(balanceDisponible)}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Ingresos ({formatoCLP(totalIngresosCiclo)}) − Gastos ({formatoCLP(totalGastosCiclo)})
          </p>
        </div>

        {/* Presupuesto Diario */}
        <div className="p-6 rounded-3xl bg-[#161B22] border border-[#10B981]/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                Presupuesto diario sugerido
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-semibold">
                {ciclo.diasRestantes} {ciclo.diasRestantes === 1 ? 'día restante' : 'días restantes'}
              </span>
            </div>

            <p className="text-3xl sm:text-4xl font-black text-[#10B981] mt-1.5">
              {formatoCLP(presupuestoDiarioBase)}
              <span className="text-xs font-normal text-slate-400"> / día</span>
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">
              Cupo libre hoy:{' '}
              <strong
                className={
                  presupuestoDiarioRestanteHoy >= 0 ? 'text-slate-100' : 'text-[#F43F5E]'
                }
              >
                {formatoCLP(presupuestoDiarioRestanteHoy)}
              </strong>
            </span>
            <span className="text-slate-400">
              Desde mañana: <strong className="text-slate-200">{formatoCLP(presupuestoDiarioManana)}/día</strong>
            </span>
          </div>
        </div>
      </div>

      {/* KPIs: Ingresos, Gastos del Ciclo y Gasto Diario (Hoy) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#161B22] border border-slate-800">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Ingresos del ciclo
          </span>
          <p className="text-2xl font-black text-[#10B981] mt-1">
            {formatoCLP(totalIngresosCiclo)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            {ingresosCiclo.length} {ingresosCiclo.length === 1 ? 'ingreso' : 'ingresos'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#161B22] border border-slate-800">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Gastos del ciclo
          </span>
          <p className="text-2xl font-black text-[#F43F5E] mt-1">
            {formatoCLP(totalGastosCiclo)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            {gastosCiclo.length} {gastosCiclo.length === 1 ? 'gasto' : 'gastos'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#161B22] border border-[#F43F5E]/35 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
              Gastado hoy
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F43F5E]/15 text-[#F43F5E] font-semibold">
              Diario
            </span>
          </div>
          <p className="text-2xl font-black text-[#F43F5E] mt-1">
            {formatoCLP(montoGastadoHoy)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {gastosHoy.length} {gastosHoy.length === 1 ? 'gasto hoy' : 'gastos hoy'} ({hoyISO})
          </span>
        </div>
      </div>

      {/* Bloque 2: Consumo del Presupuesto del Ciclo */}
      <div className="p-5 rounded-2xl bg-[#161B22] border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              Consumo del presupuesto del ciclo
            </h2>
           
          </div>

          <span
            className={`text-sm font-black px-3 py-1 rounded-xl ${
              porcentajeRealSinTope > 90
                ? 'bg-[#F43F5E]/15 text-[#F43F5E]'
                : porcentajeRealSinTope >= 70
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-[#10B981]/15 text-[#10B981]'
            }`}
          >
            {porcentajeRealSinTope}% consumido
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-3 bg-[#0D1117] rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              porcentajeRealSinTope > 90
                ? 'bg-[#F43F5E]'
                : porcentajeRealSinTope >= 70
                ? 'bg-amber-400'
                : 'bg-[#10B981]'
            }`}
            style={{ width: `${porcentajeConsumido}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Gastado: {formatoCLP(totalGastosCiclo)}</span>
          <span>Tope ingresos del ciclo: {formatoCLP(totalIngresosCiclo)}</span>
        </div>
      </div>

      {/* Bloque 3: Analítica por Categoría + Gastos Hormiga */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Analítica por Categoría */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100">
              Analítica por categoría (Ciclo)
            </h2>
            <span className="text-xs text-slate-400">
              {analiticaCategorias.length} {analiticaCategorias.length === 1 ? 'categoría' : 'categorías'}
            </span>
          </div>

          {analiticaCategorias.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">
              Aún no hay gastos en este ciclo para analizar.
            </p>
          ) : (
            <div className="space-y-3">
              {analiticaCategorias.map((cat) => (
                <div key={cat.categoria} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {cat.categoria}{' '}
                      <span className="text-slate-500 font-normal">({cat.cantidad})</span>
                    </span>
                    <span className="font-bold text-slate-100">
                      {formatoCLP(cat.total)}{' '}
                      <span className="text-slate-400 font-normal">({cat.porcentaje}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#0D1117] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F43F5E] rounded-full"
                      style={{ width: `${cat.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gastos Hormiga */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-amber-500/25 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                🐜 Gastos hormiga del ciclo
              </h2>
              <p className="text-[11px] text-slate-400">
                Compras pequeñas ≤ {formatoCLP(umbralHormiga)}
              </p>
            </div>

            {/* Selector de umbral */}
            <div className="flex items-center gap-1 bg-[#0D1117] p-1 rounded-xl border border-slate-800">
              {[3000, 5000, 10000].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setUmbralHormiga(valor)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    umbralHormiga === valor
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ≤${valor / 1000}k
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0D1117] border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Total acumulado hormiga</span>
              <span className="text-xl font-black text-amber-400">
                {formatoCLP(totalGastosHormiga)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-200 block">
                {gastosHormiga.length} {gastosHormiga.length === 1 ? 'compra' : 'compras'}
              </span>
              <span className="text-[11px] text-slate-400">
                {porcentajeHormigaDelTotal}% de tus gastos
              </span>
            </div>
          </div>

          {gastosHormiga.length === 0 ? (
            <p className="text-xs text-slate-400">
              No se detectan gastos hormiga bajo {formatoCLP(umbralHormiga)} en este ciclo.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800/80 max-h-48 overflow-y-auto pr-1">
              {gastosHormiga.slice(0, 8).map((item, idx) => (
                <li
                  key={item?.id ?? idx}
                  className="py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-slate-200 font-medium truncate">
                      {item?.description ?? item?.descripcion ?? 'Gasto menor'}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {item?.category ?? item?.categoria ?? 'Otros'}
                    </span>
                  </div>
                  <span className="font-bold text-amber-400 shrink-0">
                    -{formatoCLP(extraerMonto(item))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Deudas y Metas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#161B22] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Deudas pendientes</span>
            <span className="text-lg font-bold text-[#F43F5E]">
              {formatoCLP(totalDeudasPendientes)}
            </span>
          </div>
          <span className="text-xs text-slate-500">{deudas.length} registros</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#161B22] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Ahorrado en metas</span>
            <span className="text-lg font-bold text-[#10B981]">
              {formatoCLP(totalAhorradoMetas)}
            </span>
          </div>
          <span className="text-xs text-slate-500">{metas.length} metas</span>
        </div>
      </div>

      {/* Detalle rápido de gastos de hoy */}
      <div className="p-5 rounded-2xl bg-[#161B22] border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-200">
            Gastos registrados hoy ({gastosHoy.length})
          </h2>
          <span className="text-xs font-bold text-[#F43F5E]">
            Total hoy: {formatoCLP(montoGastadoHoy)}
          </span>
        </div>

        {gastosHoy.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            Todavía no tienes gastos registrados hoy.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/80">
            {gastosHoy.map((gasto, idx) => (
              <li
                key={gasto?.id || idx}
                className="py-2.5 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-slate-100 font-medium truncate">
                    {gasto?.description ?? gasto?.descripcion ?? 'Gasto'}
                  </p>
                  {(gasto?.category ?? gasto?.categoria) && (
                    <span className="text-xs text-slate-400">
                      {gasto?.category ?? gasto?.categoria}
                    </span>
                  )}
                </div>
                <span className="font-bold text-[#F43F5E] shrink-0">
                  -{formatoCLP(extraerMonto(gasto))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DashboardVista;