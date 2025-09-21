// netlify/functions/cleanupExpired.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { expiredDays = 30 } = JSON.parse(event.body);
        if (!expiredDays || isNaN(parseInt(expiredDays))) {
            return { statusCode: 400, body: JSON.stringify({ message: "Número de dias inválido." }) };
        }

        // Calcular data limite (data atual - dias especificados)
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - parseInt(expiredDays));

        // Buscar usuários expirados há mais tempo que o especificado
        const { data: expiredUsers, error: fetchError } = await supabase
            .from('usuarios')
            .select('id, username, date_expiry')
            .lt('date_expiry', limitDate.toISOString())
            .not('date_expiry', 'is', null);

        if (fetchError) throw fetchError;

        if (expiredUsers.length === 0) {
            return { 
                statusCode: 200, 
                body: JSON.stringify({ 
                    message: `Nenhum usuário expirado há mais de ${expiredDays} dias foi encontrado.`,
                    deletedCount: 0 
                }) 
            };
        }

        // Deletar usuários expirados
        const { error: deleteError } = await supabase
            .from('usuarios')
            .delete()
            .lt('date_expiry', limitDate.toISOString())
            .not('date_expiry', 'is', null);

        if (deleteError) throw deleteError;

        return { 
            statusCode: 200, 
            body: JSON.stringify({ 
                message: `${expiredUsers.length} usuários expirados foram removidos com sucesso!`,
                deletedCount: expiredUsers.length 
            }) 
        };

    } catch (error) {
        console.error('Erro ao limpar usuários expirados:', error);
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};