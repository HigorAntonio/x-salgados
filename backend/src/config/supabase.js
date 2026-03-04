import { createClient } from "@supabase/supabase-js";

// Validar variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Criar cliente Supabase apenas se as credenciais estiverem configuradas
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn(
    "⚠️  AVISO: Variáveis SUPABASE_URL e SUPABASE_ANON_KEY não configuradas.",
  );
  console.warn(
    "⚠️  As rotas de autenticação não funcionarão até configurar o .env",
  );
}

export { supabase };
export default supabase;
