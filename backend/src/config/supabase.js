import { createClient } from "@supabase/supabase-js";

// Validar variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Criar cliente Supabase apenas se as credenciais estiverem configuradas
let supabase = null;
let supabaseAdmin = null;

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

// Criar cliente admin do Supabase com Service Role (para operações privilegiadas)
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  console.warn(
    "⚠️  AVISO: Variável SUPABASE_SERVICE_ROLE_KEY não configurada.",
  );
  console.warn(
    "⚠️  Rotas administrativas não funcionarão até configurar o .env",
  );
}

export { supabase, supabaseAdmin };
export default supabase;
