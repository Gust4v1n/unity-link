// netlify/functions/deleteUser.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { id } = JSON.parse(event.body);
        if (!id) return { statusCode: 400, body: JSON.stringify({ message: "ID do usuário ausente." }) };

        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        if (error) throw error;
        
        return { statusCode: 200, body: JSON.stringify({ message: "Usuário deletado com sucesso!" }) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};