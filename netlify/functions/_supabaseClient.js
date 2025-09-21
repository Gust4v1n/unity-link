// netlify/functions/_supabaseClient.js - VERSÃO CORRIGIDA

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Validação mais robusta
if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente Supabase:');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Definida' : 'NÃO DEFINIDA');
  console.error('SUPABASE_SERVICE_KEY:', supabaseKey ? 'Definida' : 'NÃO DEFINIDA');
  throw new Error("Supabase URL or Service Key is not defined in environment variables.");
}

// Validar formato da URL
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`SUPABASE_URL tem formato inválido: ${supabaseUrl}`);
}

// Configurações específicas para Netlify Functions
const supabaseConfig = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'User-Agent': 'netlify-functions-admin-panel'
    }
  }
};

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey, supabaseConfig);

// Testar conexão na inicialização (opcional - só para debug)
if (process.env.NODE_ENV === 'development') {
  console.log('Cliente Supabase criado com sucesso');
  console.log('URL:', supabaseUrl);
  console.log('Configurações aplicadas:', Object.keys(supabaseConfig));
}

// EXPORTAÇÃO CORRETA
module.exports = supabase;