// netlify/functions/updateVersion.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { novaVersao } = JSON.parse(event.body);
        if (!novaVersao) return { statusCode: 400, body: JSON.stringify({ message: "Versão ausente." }) };

        // Assume que a tabela 'configuracoes' tem apenas uma linha com id=1
        const { error } = await supabase.from('configuracoes').update({ versao: novaVersao }).eq('id', 1);
        if (error) throw error;

        return { statusCode: 200, body: JSON.stringify({ message: "Versão atualizada com sucesso!" }) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};