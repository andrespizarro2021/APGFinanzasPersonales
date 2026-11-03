import { supabase } from '../configuracion/supabaseCliente';

export async function obtenerDeudas(usuarioId) {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', usuarioId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function agregarDeuda(datosDeuda) {
  const { data, error } = await supabase
    .from('debts')
    .insert([datosDeuda])
    .select();

  if (error) throw error;
  return data[0];
}

export async function registrarPagoCuota(deuda) {
  const nuevasCuotasPagadas = Math.min((deuda.paid_installments || 0) + 1, deuda.total_installments);
  const cuotaMonto = Number(deuda.monthly_payment || 0);
  const nuevoRestante = Math.max(Number(deuda.total_amount) - (nuevasCuotasPagadas * cuotaMonto), 0);

  const { data, error } = await supabase
    .from('debts')
    .update({ 
      paid_installments: nuevasCuotasPagadas,
      remaining_amount: nuevoRestante
    })
    .eq('id', deuda.id)
    .select();

  if (error) throw error;
  return data[0];
}

export async function eliminarDeuda(id) {
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}