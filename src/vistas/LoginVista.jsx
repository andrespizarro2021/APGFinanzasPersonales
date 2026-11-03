import React, { useState } from 'react';
import { supabase } from '../configuracion/supabaseCliente';

export function LoginVista() {
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setMensajeExito(null);

    try {
      if (esRegistro) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMensajeExito('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta o inicia sesión.');
        setEsRegistro(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 relative overflow-hidden">
        
        {/* Destello decorativo */}
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <span className="text-xl">⚡</span>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            {esRegistro ? 'Crea tu cuenta Fintech' : 'Bienvenido de nuevo'}
          </h1>
          <p className="text-xs text-slate-400">
            {esRegistro ? 'Comienza a gestionar tus finanzas personales' : 'Ingresa a tu panel financiero seguro'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        {mensajeExito && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-xs text-emerald-400 text-center">
            {mensajeExito}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@dominio.com"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm disabled:opacity-50 mt-2"
          >
            {cargando ? 'Procesando...' : esRegistro ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Alternar entre Login y Registro */}
        <div className="text-center pt-2 border-t border-slate-800">
          <button
            onClick={() => { setEsRegistro(!esRegistro); setError(null); setMensajeExito(null); }}
            className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
          >
            {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>

      </div>
    </div>
  );
}