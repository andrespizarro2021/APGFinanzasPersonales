import { supabase } from '../configuracion/supabaseCliente';

export async function obtenerPerfil(usuarioId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', usuarioId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Si no existe el perfil aún, lo creamos por defecto con el día 1
    const { data: nuevoPerfil, error: errorCrear } = await supabase
      .from('profiles')
      .insert([{ id: usuarioId, ciclo_dia_inicio: 1 }])
      .select()
      .single();
    if (errorCrear) throw errorCrear;
    return nuevoPerfil;
  }
  if (error) throw error;
  return data;
}

export async function actualizarCicloDia(usuarioId, diaInicio) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ciclo_dia_inicio: parseInt(diaInicio, 10), updated_at: new Date() })
    .eq('id', usuarioId)
    .select()
    .single();

  if (error) throw error;
  return data;
}