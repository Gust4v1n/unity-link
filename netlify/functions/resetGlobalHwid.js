// netlify/functions/resetGlobalHwid.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        // Contar quantos usuários têm HWID definido
        const { data: usersWithHwid, error: countError } = await supabase
            .from('usuarios')
            .select('id')
            .not('hwid', 'is', null);

        if (countError) throw countError;

        const affectedCount = usersWithHwid ? usersWithHwid.length : 0;

        // Resetar todos os HWIDs
        const { error } = await supabase
            .from('usuarios')
            .update({ hwid: null })
            .not('hwid', 'is', null);

        if (error) throw error;

        return { 
            statusCode: 200, 
            body: JSON.stringify({ 
                message: `HWIDs de ${affectedCount} usuários foram resetados com sucesso!`,
                affectedCount: affectedCount 
            }) 
        };

    } catch (error) {
        console.error('Erro ao resetar HWIDs globalmente:', error);
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};