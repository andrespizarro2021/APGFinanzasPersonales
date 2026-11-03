import React from 'react';
import { LogoAPG } from './LogoAPG'; // Asegúrate de ajustar la ruta si está en otra carpeta

export function NavegacionSidebar({ vistaActiva, setVistaActiva }) {
  const opciones = [
    { id: 'dashboard', label: 'Resumen', icon: '📊' },
    { id: 'ingresos', label: 'Ingresos', icon: '💰' },
    { id: 'gastos', label: 'Gastos', icon: '📉' },
    { id: 'deudas', label: 'Deudas', icon: '💳' },
    { id: 'metas', label: 'Metas', icon: '🎯' },
    { id: 'historial', label: 'Historial', icon: '📂' },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 sm:p-6 flex flex-col justify-between backdrop-blur-xl">
      
      <div className="space-y-6">
        {/* Cabecera del Sidebar con el nuevo Logo y Nombre */}
        <div className="flex items-center gap-3 px-2 py-1">
          <LogoAPG className="w-9 h-9" />
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white font-mono">APG</span>
            <span className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">Finanzas Personales</span>
          </div>
        </div>

        {/* Opciones de Navegación */}
        <nav className="space-y-1.5">
          {opciones.map((op) => {
            const activo = vistaActiva === op.id;
            return (
              <button
                key={op.id}
                onClick={() => setVistaActiva(op.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  activo
                    ? 'bg-gradient-to-r from-indigo-600/30 to-pink-600/20 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-sm">{op.icon}</span>
                <span>{op.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pie del Sidebar (Opcional, versión o estado) */}
      <div className="pt-4 mt-6 border-t border-slate-800/60 hidden md:block">
        <div className="px-2 text-[10px] text-slate-500 font-mono">
          Neo-Fintech v2.0
        </div>
      </div>

    </aside>
  );
}