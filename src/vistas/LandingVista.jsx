import React from 'react';
import { LogoAPG } from '../componentes/LogoAPG';



export function LandingVista({ alIrALogin }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Efectos de fondo de neón (Glows) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header / Barra de Navegación */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <LogoAPG className="w-9 h-9" />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white font-mono">APG</span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">Finanzas Personales</span>
          </div>
        </div>

        <button
          onClick={alIrALogin}
          className="px-5 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl border border-slate-700/60 transition-all hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md"
        >
          Iniciar Sesión
        </button>
      </header>

      {/* Hero Section Central */}
      <main className="max-w-5xl mx-auto px-6 py-12 text-center relative z-10 space-y-8 my-auto">
        
        {/* Badge de estado */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          Ecosistema Financiero Inteligente
        </div>

        {/* Título Principal */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Toma el Control Absoluto de tu Dinero con{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
            APG Finanzas
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
          Diseñado para optimizar tus ciclos mensuales, analizar tu historial acumulado, clasificar tus gastos hormiga y alcanzar metas de ahorro con una interfaz ultra moderna.
        </p>

        {/* Botón de Acción Principal (CTA) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={alIrALogin}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Empezar Ahora</span>
            <span>→</span>
          </button>
        </div>

        {/* Grid de Características Destacadas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          
          <div className="glass-card glass-card-hover p-6 rounded-3xl space-y-2 border border-slate-800/80">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg">
              📅
            </div>
            <h3 className="text-sm font-bold text-white">Ciclos Personalizados</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define el día exacto de corte de tu presupuesto mensual para un balance preciso y sin desfasajes.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-3xl space-y-2 border border-slate-800/80">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
              🐜
            </div>
            <h3 className="text-sm font-bold text-white">Control Gastos Hormiga</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detecta y aísla micro-gastos diarios que afectan inadvertidamente tu liquidez mensual.
            </p>
          </div>

          {/* TARJETA ACTUALIZADA: Historial de Ciclos */}
          <div className="glass-card glass-card-hover p-6 rounded-3xl space-y-2 border border-slate-800/80">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-lg">
              📂
            </div>
            <h3 className="text-sm font-bold text-white">Historial de Ciclos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consulta y compara automáticamente tus balances netos, ingresos, egresos y deudas de todos los períodos anteriores.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500 relative z-10">
        © {new Date().getFullYear()} APG Finanzas Personales. Todos los derechos reservados.
      </footer>

    </div>
  );
}