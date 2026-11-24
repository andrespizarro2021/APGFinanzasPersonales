import React, { useState } from 'react';
import { supabase } from '../configuracion/supabaseCliente';
import { LogoAPG } from '../componentes/LogoAPG';

export function LoginVista() {
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const manejarAutenticacion = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      if (esRegistro) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          await supabase.from('profiles').insert([
            { id: data.user.id, email }
          ]).select();
        }

        setMensaje({ tipo: 'exito', texto: '¡Cuenta creada! Ya puedes iniciar sesión.' });
        setEsRegistro(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error en la autenticación.' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono">
      
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-xl relative z-10 shadow-2xl">
        
        <div className="flex flex-col items-center mb-6">
          <LogoAPG className="w-14 h-14 mb-3" />
          <h1 className="text-xl font-black text-white tracking-tight text-center">
            APG Finanzas Personales
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {esRegistro ? 'Crea tu cuenta Neo-Fintech' : 'Accede a tu panel financiero'}
          </p>
        </div>

        {mensaje && (
          <div className={`p-3 rounded-xl text-xs mb-4 ${mensaje.tipo === 'exito' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={manejarAutenticacion} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@dominio.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 text-white font-semibold rounded-xl text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer mt-2"
          >
            {cargando ? 'Procesando...' : (esRegistro ? 'Registrar Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
          <p className="text-xs text-slate-400">
            {esRegistro ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}{' '}
            <button
              onClick={() => { setEsRegistro(!esRegistro); setMensaje(null); }}
              className="text-cyan-400 hover:underline font-bold ml-1 cursor-pointer"
            >
              {esRegistro ? 'Inicia sesión' : 'Regístrate aquí'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default LoginVista;