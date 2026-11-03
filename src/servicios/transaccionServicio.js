import { supabase } from '../configuracion/supabaseCliente';

// --- INGRESOS ---
export async function obtenerIngresos(usuarioId) {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .eq('user_id', usuarioId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function agregarIngreso(datosIngreso) {
  // 💡 Si tu tabla usa 'category' en vez de 'source', mapeamos el campo aquí:
  const payload = {
    user_id: datosIngreso.user_id,
    amount: datosIngreso.amount,
    category: datosIngreso.source || datosIngreso.category, 
    description: datosIngreso.description,
    date: datosIngreso.date
  };

  const { data, error } = await supabase
    .from('incomes')
    .insert([payload])
    .select();

  if (error) throw error;
  return data[0];
}

export async function eliminarIngreso(id) {
  const { error } = await supabase
    .from('incomes')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// --- GASTOS ---
export async function obtenerGastos(usuarioId) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', usuarioId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function agregarGasto(datosGasto) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([datosGasto])
    .select();

  if (error) throw error;
  return data[0];
}

export async function eliminarGasto(id) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}