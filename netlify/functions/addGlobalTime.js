// netlify/functions/addGlobalTime.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { days } = JSON.parse(event.body);
        if (!days || isNaN(parseInt(days))) {
            return { statusCode: 400, body: JSON.stringify({ message: "Número de dias inválido." }) };
        }

        // Esta é uma operação mais complexa. O Supabase não permite
        // atualizar uma data baseada no valor atual dela mesma diretamente.
        // A solução é usar uma RPC (Remote Procedure Call) no banco de dados.
        
        // 1. Vá para o seu editor de SQL no Supabase.
        // 2. Crie a seguinte função:
        /*
            create or replace function add_days_to_active_users(days_to_add int)
            returns void as $$
            begin
              update usuarios
              set date_expiry = case
                when date_expiry is null then now() + (days_to_add * interval '1 day')
                else date_expiry + (days_to_add * interval '1 day')
              end
              where banned = false;
            end;
            $$ language plpgsql;
        */

        const { error } = await supabase.rpc('add_days_to_active_users', {
            days_to_add: parseInt(days)
        });

        if (error) throw error;

        return { statusCode: 200, body: JSON.stringify({ message: `${days} dias adicionados a todos os usuários ativos!` }) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};