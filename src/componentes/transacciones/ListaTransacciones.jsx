import React from 'react';
import { formatearMoneda } from '../../utilidades/formateaMoneda';

export function ListaTransacciones({ transacciones, tipo, onEliminar }) {
  if (!transacciones || transacciones.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center text-slate-400 text-sm">
        No hay registros de {tipo === 'ingreso' ? 'ingresos' : 'gastos'} en este ciclo.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
          Historial de {tipo === 'ingreso' ? 'Ingresos' : 'Gastos'}
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-6">Fecha</th>
              <th className="py-3 px-6">{tipo === 'ingreso' ? 'Fuente' : 'Categoría'}</th>
              <th className="py-3 px-6">Descripción</th>
              <th className="py-3 px-6 text-right">Monto</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            {transacciones.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                <td className="py-4 px-6 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {item.date}
                </td>
                <td className="py-4 px-6 font-medium text-slate-800 dark:text-white whitespace-nowrap">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs">
                    {item.category}
                  </span>
                </td>
                <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                  {item.description || 'Sin descripción'}
                </td>
                <td className={`py-4 px-6 font-bold text-right whitespace-nowrap ${tipo === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                  ${formatearMoneda(item.amount)}
                </td>
                <td className="py-4 px-6 text-center whitespace-nowrap">
                  <button
                    onClick={() => onEliminar(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    title="Eliminar registro"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}