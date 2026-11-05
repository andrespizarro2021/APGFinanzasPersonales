import React, { useState, useEffect } from 'react';
import { supabase } from './configuracion/supabaseCliente';
import { LandingVista } from './vistas/LandingVista';
import { LoginVista } from './vistas/LoginVista';
import { NavegacionSidebar } from './componentes/NavegacionSidebar';
import { DashboardVista } from './vistas/dashboard/DashboardVista';
import { IngresosVista } from './vistas/IngresosVista';
import { GastosVista } from './vistas/GastosVista';
import { DeudasVista } from './vistas/DeudasVista';
import { MetasVista } from './vistas/MetasVista';
import { HistorialVista } from './vistas/HistorialVista';
import { ConfigurarCicloModal } from './componentes/ConfigurarCicloModal';

export function App() {
  const [session, setSession] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const [cicloDiaInicio, setCicloDiaInicio] = useState(1);
  const [modalCicloAbierto, setModalCicloAbierto] = useState(false);
  
  // --- Estado para abrir/cerrar el menú en móvil ---
  const [menuAbierto, setMenuAbierto] = useState(false);

  // --- Estado del Modo Privacidad (Incognito Mode) ---
  const [modoOculto, setModoOculto] = useState(() => {
    return localStorage.getItem('modo_oculto') === 'true';
  });

  const toggleModoOculto = () => {
    setModoOculto((prev) => {
      const nuevoValor = !prev;
      localStorage.setItem('modo_oculto', nuevoValor);
      return nuevoValor;
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        cargarCicloLocal(session.user.id);
      }
      setCargandoSesion(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        cargarCicloLocal(session.user.id);
      }
      setCargandoSesion(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const cargarCicloLocal = (userId) => {
    try {
      const cicloGuardado = localStorage.getItem(`ciclo_dia_${userId}`);
      if (cicloGuardado) {
        setCicloDiaInicio(parseInt(cicloGuardado, 10));
      }
    } catch (error) {
      console.error('Error al leer ciclo local:', error);
    }
  };

  if (cargandoSesion) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm font-medium">
        Cargando ecosistema financiero APG...
      </div>
    );
  }

  if (!session && !mostrarLogin) {
    return <LandingVista alIrALogin={() => setMostrarLogin(true)} />;
  }

  if (!session && mostrarLogin) {
    return <LoginVista alVolver={() => setMostrarLogin(false)} />;
  }

  if (!session?.user) {
    return <LandingVista alIrALogin={() => setMostrarLogin(true)} />;
  }

  const usuarioId = session.user.id;

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setMostrarLogin(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-x-hidden font-sans">
      
      {/* Barra lateral con soporte para drawer móvil */}
      <NavegacionSidebar 
        vistaActiva={vistaActiva} 
        setVistaActiva={setVistaActiva} 
        menuAbierto={menuAbierto}
        setMenuAbierto={setMenuAbierto}
      />

      {/* Contenido Principal */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative pb-24 md:pb-6">
        
        {/* Barra superior con acciones globales */}
        <div className="flex flex-wrap items-center justify-end gap-2 mb-6 md:absolute md:top-4 md:right-4 md:z-20">
          
          {/* Botón Modo Privacidad */}
          <button
            onClick={toggleModoOculto}
            title={modoOculto ? "Mostrar montos" : "Ocultar montos"}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              modoOculto 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 neon-glow-amber' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            {modoOculto ? '👁️‍🗨️ Privacidad ON' : '👁️ Visibilidad'}
          </button>

          {/* Botón Ciclo */}
          <button
            onClick={() => setModalCicloAbierto(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            ⚙️ Día {cicloDiaInicio}
          </button>

          {/* Botón Logout */}
          <button
            onClick={cerrarSesion}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            🚪 Salir
          </button>
        </div>

        {/* Vistas dinámicas */}
        <div className="mt-2 md:mt-0">
          {vistaActiva === 'dashboard' && <DashboardVista usuarioId={usuarioId} cicloDiaInicio={cicloDiaInicio} modoOculto={modoOculto} />}
          {vistaActiva === 'ingresos' && <IngresosVista usuarioId={usuarioId} modoOculto={modoOculto} />}
          {vistaActiva === 'gastos' && <GastosVista usuarioId={usuarioId} modoOculto={modoOculto} />}
          {vistaActiva === 'deudas' && <DeudasVista usuarioId={usuarioId} modoOculto={modoOculto} />}
          {vistaActiva === 'metas' && <MetasVista usuarioId={usuarioId} modoOculto={modoOculto} />}
          {vistaActiva === 'historial' && <HistorialVista usuarioId={usuarioId} modoOculto={modoOculto} />}
        </div>
      </main>

      {/* Modal para configurar ciclo */}
      {modalCicloAbierto && (
        <ConfigurarCicloModal
          usuarioId={usuarioId}
          cicloActual={cicloDiaInicio}
          alGuardar={(nuevoDia) => setCicloDiaInicio(nuevoDia)}
          alCerrar={() => setModalCicloAbierto(false)}
        />
      )}

    </div>
  );
}

export default App;