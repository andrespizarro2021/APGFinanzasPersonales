import { createClient } from '@supabase/supabase-js';

const urlSupabase = import.meta.env.VITE_SUPABASE_URL;
const llaveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!urlSupabase || !llaveAnonima) {
  console.error("Faltan las variables de entorno de Supabase. Revisa tu archivo .env");
}

export const supabase = createClient(urlSupabase, llaveAnonima);