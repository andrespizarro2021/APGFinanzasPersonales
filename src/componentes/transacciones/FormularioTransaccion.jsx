import React, { useState } from 'react';
import { agregarIngreso, agregarGasto } from '../../servicios/transaccionServicio';

export function FormularioTransaccion({ usuarioId, onTransaccionAgregada, tipoForzado }) {
  // Si tipoForzado viene definido ('ingreso' o 'gasto'), lo usa fijo. Si no, permite alternar.
  const [tipo, setTipo] = useState(tipoForzado || 'gasto'); 
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState(tipoForzado === 'ingreso' ? 'Salario' : 'Comida');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [guardando, setGuardando] = useState(false);

  // Actualizar categoría por defecto si cambia el tipo forzado o manual
  const handleCambiarTipo = (nuevoTipo) => {
    if (tipoForzado) return; // Si está bloqueado por la vista, no permite cambiar
    setTipo(nuevoTipo);
    setCategoria(nuevoTipo === 'ingreso' ? 'Salario' : 'Comida');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || isNaN(monto)) return;

    try {
      setGuardando(true);
      const datosComunes = {
        user_id: usuarioId,
        amount: parseFloat(monto),
        description: descripcion,
        date: fecha
      };

      if (tipo === 'ingreso') {
        await agregarIngreso({ ...datosComunes, source: categoria });
      } else {
        await agregarGasto({ ...datosComunes, category: categoria });
      }

      setMonto('');
      setDescripcion('');
      if (onTransaccionAgregada) onTransaccionAgregada();
      alert('¡Transacción guardada con éxito!');
    } catch (error) {
      console.error('Error al guardar la transacción:', error);
      alert('Hubo un error al guardar la transacción.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
        {tipoForzado === 'ingreso' ? 'Registrar Nuevo Ingreso' : tipoForzado === 'gasto' ? 'Registrar Nuevo Gasto' : 'Registrar Movimiento'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Tipo (Solo aparece si NO está forzado) */}
        {!tipoForzado && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <button
              type="button"
              onClick={() => handleCambiarTipo('gasto')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                tipo === 'gasto' 
                  ? 'bg-white dark:bg-slate-800 text-red-500 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => handleCambiarTipo('ingreso')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                tipo === 'ingreso' 
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Ingreso
            </button>
          </div>
        )}

        {/* Monto */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Monto
          </label>
          <input
            type="number"
            step="any"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Categoría / Fuente */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {tipo === 'gasto' ? 'Categoría' : 'Fuente de Ingreso'}
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {tipo === 'gasto' ? (
              <>
                <option value="Comida">Comida / Supermercado</option>
                <option value="Transporte">Transporte / Gasolina</option>
                <option value="Vivienda">Vivienda / Alquiler</option>
                <option value="Entretenimiento">Entretenimiento</option>
                <option value="Servicios">Servicios Básicos</option>
                <option value="Otros">Otros</option>
              </>
            ) : (
              <>
                <option value="Salario">Salario / Sueldo</option>
                <option value="Freelance">Freelance / Extras</option>
                <option value="Inversiones">Inversiones</option>
                <option value="Otros">Otros</option>
              </>
            )}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Descripción (Opcional)
          </label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Quincena o Compra de víveres"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Fecha */}
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

        {/* Botón Guardar */}
        <button
          type="submit"
          disabled={guardando}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar Registro'}
        </button>
      </form>
    </div>
  );
}