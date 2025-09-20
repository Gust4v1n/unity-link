// netlify/functions/updateUser.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { id, updates } = JSON.parse(event.body);
        if (!id || !updates) {
            return { statusCode: 400, body: JSON.stringify({ message: "ID ou dados de atualização ausentes." }) };
        }

        const { error } = await supabase.from('usuarios').update(updates).eq('id', id);
        if (error) throw error;
        
        return { statusCode: 200, body: JSON.stringify({ message: "Usuário atualizado com sucesso!" }) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};