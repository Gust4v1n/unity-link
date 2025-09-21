const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ message: 'Method Not Allowed' }) 
        };
    }

    try {
        const { expiredDays = 30 } = JSON.parse(event.body);
        
        if (!expiredDays || isNaN(parseInt(expiredDays))) {
            return { 
                statusCode: 400, 
                headers,
                body: JSON.stringify({ message: "Número de dias inválido." }) 
            };
        }

        const daysThreshold = parseInt(expiredDays);
        console.log(`Limpando usuários expirados há mais de ${daysThreshold} dias`);

        // Calcular data limite (data atual - dias especificados)
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - daysThreshold);
        const limitDateISO = limitDate.toISOString();

        console.log(`Data limite para exclusão: ${limitDateISO}`);

        // Buscar usuários expirados há mais tempo que o especificado
        const { data: expiredUsers, error: fetchError } = await supabase
            .from('usuarios')
            .select('id, username, date_expiry')
            .lt('date_expiry', limitDateISO)
            .not('date_expiry', 'is', null);

        if (fetchError) {
            console.error('Erro ao buscar usuários expirados:', fetchError);
            throw fetchError;
        }

        if (!expiredUsers || expiredUsers.length === 0) {
            return { 
                statusCode: 200, 
                headers,
                body: JSON.stringify({ 
                    message: `Nenhum usuário expirado há mais de ${daysThreshold} dias foi encontrado.`,
                    deletedCount: 0 
                }) 
            };
        }

        console.log(`Encontrados ${expiredUsers.length} usuários para deletar:`, 
                   expiredUsers.map(u => u.username));

        // Deletar usuários expirados
        const { error: deleteError } = await supabase
            .from('usuarios')
            .delete()
            .lt('date_expiry', limitDateISO)
            .not('date_expiry', 'is', null);

        if (deleteError) {
            console.error('Erro ao deletar usuários:', deleteError);
            throw deleteError;
        }

        const message = `${expiredUsers.length} usuários expirados foram removidos com sucesso!`;
        console.log(message);

        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ 
                message,
                deletedCount: expiredUsers.length,
                deletedUsers: expiredUsers.map(u => u.username)
            }) 
        };

    } catch (error) {
        console.error('Erro interno no cleanupExpired:', error);
        return { 
            statusCode: 500, 
            headers,
            body: JSON.stringify({ 
                message: `Erro interno: ${error.message}`,
                error_code: error.code || 'INTERNAL_ERROR'
            }) 
        };
    }
};