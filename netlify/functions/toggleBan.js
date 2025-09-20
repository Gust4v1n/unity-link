// netlify/functions/toggleBan.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { id, newBanStatus } = JSON.parse(event.body);
        if (!id || typeof newBanStatus !== 'boolean') {
            return { statusCode: 400, body: JSON.stringify({ message: "Dados inválidos." }) };
        }

        const { error } = await supabase.from('usuarios').update({ banned: newBanStatus }).eq('id', id);
        if (error) throw error;
        
        return { statusCode: 200, body: JSON.stringify({ message: "Status de banimento atualizado." }) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};