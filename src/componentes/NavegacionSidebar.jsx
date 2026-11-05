import React from 'react';
import { LogoAPG } from './LogoAPG';

export function NavegacionSidebar({ vistaActiva, setVistaActiva, menuAbierto, setMenuAbierto }) {
  const opciones = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'ingresos', label: 'Ingresos', icon: '💰' },
    { id: 'gastos', label: 'Gastos', icon: '📉' },
    { id: 'deudas', label: 'Deudas', icon: '💳' },
    { id: 'metas', label: 'Metas', icon: '🎯' },
    { id: 'historial', label: 'Historial', icon: '📂' },
  ];

  return (
    <>
      {/* --- BARRA SUPERIOR MÓVIL (Visible solo en celulares/tablets) --- */}
      <div className="md:hidden flex items-center justify-between bg-slate-900/80 border-b border-slate-800/80 px-4 py-3 backdrop-blur-xl sticky top-0 z-40">
        {/* Al presionar el logo se abre el menú */}
        <button 
          onClick={() => setMenuAbierto(true)}
          className="flex items-center gap-2.5 focus:outline-none cursor-pointer group"
          title="Abrir menú"
        >
          <LogoAPG className="w-8 h-8 transition-transform group-hover:scale-105" />
          <div className="flex flex-col text-left">
            <span className="text-base font-black tracking-tight text-white font-mono leading-tight">APG</span>
            <span className="text-[7px] uppercase tracking-widest text-slate-400 font-semibold">Finanzas Personales</span>
          </div>
        </button>

        {/* Indicador de vista actual en móvil */}
        <span className="text-xs font-semibold text-cyan-400 font-mono uppercase bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/20">
          {vistaActiva}
        </span>
      </div>

      {/* --- OVERLAY OSCURO PARA MÓVIL CUANDO EL MENÚ ESTÁ ABIERTO --- */}
      {menuAbierto && (
        <div 
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden transition-opacity"
        />
      )}

      {/* --- SIDEBAR PRINCIPAL (Fijo a la izquierda en PC, Panel Deslizante en Celular) --- */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 md:w-64 bg-slate-900/95 md:bg-slate-900/60 
        border-r border-slate-800/80 p-5 md:p-6 
        flex flex-col justify-between backdrop-blur-xl shrink-0
        transform transition-transform duration-300 ease-in-out
        ${menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        <div className="space-y-6">
          {/* Cabecera del Sidebar con Logo y Botón Cerrar (X) en móvil */}
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-3">
              <LogoAPG className="w-9 h-9" />
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white font-mono">APG</span>
                <span className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">Finanzas Personales</span>
              </div>
            </div>

            {/* Botón X para cerrar en móvil */}
            <button
              onClick={() => setMenuAbierto(false)}
              className="md:hidden p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
              title="Cerrar menú"
            >
              ✕
            </button>
          </div>

          {/* Opciones de Navegación */}
          <nav className="space-y-1.5 mt-4 md:mt-0">
            {opciones.map((op) => {
              const activo = vistaActiva === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => {
                    setVistaActiva(op.id);
                    setMenuAbierto(false); // Cierra el menú automáticamente al elegir una opción en móvil
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    activo
                      ? 'bg-gradient-to-r from-indigo-600/30 to-pink-600/20 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-base">{op.icon}</span>
                  <span className="text-sm">{op.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie del Sidebar opcional */}
        <div className="pt-4 border-t border-slate-800/60 hidden md:block">
          <div className="px-2 text-[10px] text-slate-500 font-mono">
            Neo-Fintech v2.0
          </div>
        </div>

      </aside>
    </>
  );
}