import React, { useState } from 'react';
import { supabase } from '../configuracion/supabaseCliente';

export function RecuperacionCorreoVista({ alVolver }) {
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Paso 1: Enviar el código de 6 dígitos al correo usando tu SMTP configurado
  const manejarEnvioCodigo = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      setMensaje({
        tipo: 'exito',
        texto: '¡Código enviado! Revisa tu correo (y la carpeta Spam).',
      });
      setPaso(2);
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err?.message || 'No se pudo enviar el código. Verifica que el correo esté registrado.',
      });
    } finally {
      setCargando(false);
    }
  };

  // Paso 2: Validar el código de 6 dígitos y guardar la nueva contraseña
  const manejarVerificacionYCambio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      const { error: errorVerify } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: codigo.trim(),
        type: 'email',
      });

      if (errorVerify) throw errorVerify;

      const { error: errorUpdate } = await supabase.auth.updateUser({
        password: nuevaClave,
      });

      if (errorUpdate) throw errorUpdate;

      setMensaje({
        tipo: 'exito',
        texto: '¡Contraseña actualizada! Volviendo al inicio de sesión...',
      });

      setTimeout(() => {
        if (typeof alVolver === 'function') {
          alVolver();
        }
      }, 2000);
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err?.message || 'El código es incorrecto o ya expiró.',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/80 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl text-slate-100 shadow-2xl">
      <h2 className="text-lg font-bold font-mono mb-1 text-white">Recuperar Contraseña</h2>
      <p className="text-xs text-slate-400 mb-6 font-mono">
        {paso === 1
          ? 'Ingresa tu correo registrado para recibir un código de 6 dígitos.'
          : 'Ingresa el código que llegó a tu correo y tu nueva contraseña.'}
      </p>

      {mensaje && (
        <div
          className={`p-3 rounded-xl text-xs mb-4 font-mono ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {paso === 1 ? (
        <form onSubmit={manejarEnvioCodigo} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
              Correo Electrónico
            </label>
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
            {cargando ? 'Enviando código...' : 'Enviar Código al Correo'}
          </button>
        </form>
      ) : (
        <form onSubmit={manejarVerificacionYCambio} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
              Código de 6 dígitos
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="123456"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono tracking-widest text-center text-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
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
            {cargando ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={alVolver}
        className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors mt-5 block font-mono cursor-pointer"
      >
        ← Volver al inicio de sesión
      </button>
    </div>
  );
}

export default RecuperacionCorreoVista;