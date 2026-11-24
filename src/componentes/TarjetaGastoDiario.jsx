import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../configuracion/supabaseCliente';

function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function TarjetaGastoDiario({ usuarioId, modoOculto = false, recargarTrigger = 0 }) {
  const [gastoHoy, setGastoHoy] = useState(0);
  const [cantidadHoy, setCantidadHoy] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargarGastoDeHoy = useCallback(async () => {
    if (!usuarioId) return;
    setCargando(true);

    try {
      const hoyISO = obtenerFechaLocalISO();

      const { data, error } = await supabase
        .from('gastos')
        .select('monto, fecha, created_at')
        .eq('user_id', usuarioId);

      if (error) throw error;

      const deHoy = (data || []).filter((item) => {
        const rawFecha = item?.fecha || item?.created_at;
        if (!rawFecha) return false;

        if (typeof rawFecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawFecha.trim())) {
          return rawFecha.trim() === hoyISO;
        }

        const f = new Date(rawFecha);
        return !Number.isNaN(f.getTime()) && obtenerFechaLocalISO(f) === hoyISO;
      });

      const total = deHoy.reduce((acc, item) => acc + Number(item?.monto || 0), 0);
      setGastoHoy(total);
      setCantidadHoy(deHoy.length);
    } catch (err) {
      console.error('Error al calcular gasto diario:', err);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarGastoDeHoy();
  }, [cargarGastoDeHoy, recargarTrigger]);

  const montoFormateado = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(gastoHoy);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-rose-500/30 flex items-center justify-between shadow-lg">
      <div>
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
          Monto gastado hoy
        </span>
        <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
          {cargando ? '...' : modoOculto ? '••••••' : montoFormateado}
        </p>
        <span className="text-xs text-slate-400 mt-0.5 block">
          {cantidadHoy} {cantidadHoy === 1 ? 'movimiento hoy' : 'movimientos hoy'}
        </span>
      </div>

      <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        Hoy
      </span>
    </div>
  );
}

export default TarjetaGastoDiario;