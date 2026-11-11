import React, { useState, useEffect } from 'react';
import { supabase } from '../configuracion/supabaseCliente';

export function RecuperacionCorreoVista({ alVolver }) {
  const [email, setEmail] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');
  const [esRecuperacionActiva, setEsRecuperacionActiva] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Detectar si el usuario abrió la app desde el enlace del correo (Evento PASSWORD_RECOVERY)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setEsRecuperacionActiva(true);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 1. Solicitar el enlace de recuperación al correo
  const manejarEnvioCorreo = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`, // Redirige a la URL actual de tu app
      });

      if (error) throw error;

      setMensaje({ 
        tipo: 'exito', 
        texto: '¡Correo enviado con éxito! Abre tu correo y haz clic en el enlace para cambiar la contraseña.' 
      });
    } catch (err) {
      setMensaje({ 
        tipo: 'error', 
        texto: err.message || 'Error al enviar el correo de recuperación.' 
      });
    } finally {
      setCargando(false);
    }
  };

  // 2. Guardar la nueva contraseña tras hacer clic en el enlace
  const manejarActualizacionClave = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: nuevaClave
      });

      if (error) throw error;

      setMensaje({ 
        tipo: 'exito', 
        texto: '¡Contraseña actualizada con éxito! Redirigiendo al login...' 
      });

      setTimeout(() => {
        alVolver();
      }, 2000);

    } catch (err) {
      setMensaje({ 
        tipo: 'error', 
        texto: err.message || 'Error al actualizar la contraseña.' 
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/80 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl text-slate-100 shadow-2xl">
      <h2 className="text-lg font-bold font-mono mb-1 text-white">Recuperar Contraseña</h2>
      <p className="text-xs text-slate-400 mb-6 font-mono">
        {esRecuperacionActiva 
          ? 'Ingresa tu nueva contraseña a continuación.' 
          : 'Ingresa tu correo registrado y te enviaremos un enlace seguro para restablecer tu clave.'}
      </p>

      {mensaje && (
        <div className={`p-3 rounded-xl text-xs mb-4 font-mono ${mensaje.tipo === 'exito' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
          {mensaje.texto}
        </div>
      )}

      {!esRecuperacionActiva ? (
        <form onSubmit={manejarEnvioCorreo} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">Correo Electrónico</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@dominio.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-xl text-xs uppercase tracking-wider font-mono hover:opacity-95 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            {cargando ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
          </button>
        </form>
      ) : (
        <form onSubmit={manejarActualizacionClave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">Nueva Contraseña</label>
            <input 
              type="password"
              required
              value={nuevaClave}
              onChange={(e) => setNuevaClave(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-semibold rounded-xl text-xs uppercase tracking-wider font-mono hover:opacity-95 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            {cargando ? 'Guardando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      )}

      <button
        onClick={alVolver}
        className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors mt-5 block font-mono"
      >
        ← Volver al inicio de sesión
      </button>
    </div>
  );
}