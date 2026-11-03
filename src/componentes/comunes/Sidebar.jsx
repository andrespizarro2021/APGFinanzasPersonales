import React from 'react';



export function Sidebar({ vistaActiva, setVistaActiva }) {
  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'ingresos', label: '📈 Ingresos' },
    { id: 'gastos', label: '📉 Gastos' },
    { id: 'deudas', label: '💳 Deudas' },
    { id: 'metas', label: '🎯 Ahorro y Metas' },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 p-6 flex flex-col justify-between shrink-0">
      <div>
        <div className="mb-8">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">💰 FinanzasApp</h2>
          <p className="text-xs text-slate-400 mt-0.5">Gestión de ciclo inteligente</p>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setVistaActiva(item.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                vistaActiva === item.id
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 text-center">
        Ciclo Activo: 21 al 20
      </div>
    </aside>
  );
}