const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Method Not Allowed' }) 
        };
    }

    try {
        console.log('Iniciando reset global de HWID...');

        // Contar usuários com HWID definido
        const { data: usersWithHwid, error: countError } = await supabase
            .from('usuarios')
            .select('id')
            .not('hwid', 'is', null);

        if (countError) {
            console.error('Erro ao contar usuários:', countError);
            throw countError;
        }

        const affectedCount = usersWithHwid ? usersWithHwid.length : 0;
        console.log(`Encontrados ${affectedCount} usuários com HWID definido`);

        if (affectedCount === 0) {
            return { 
                statusCode: 200, 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: "Nenhum usuário com HWID definido foi encontrado.",
                    affectedCount: 0 
                }) 
            };
        }

        // Resetar todos os HWIDs
        const { data, error } = await supabase
            .from('usuarios')
            .update({ hwid: null })
            .not('hwid', 'is', null);

        if (error) {
            console.error('Erro ao resetar HWIDs:', error);
            throw error;
        }

        console.log(`Reset global concluído. ${affectedCount} HWIDs foram resetados.`);

        return { 
            statusCode: 200, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: `HWIDs de ${affectedCount} usuários foram resetados com sucesso!`,
                affectedCount: affectedCount 
            }) 
        };

    } catch (error) {
        console.error('Erro interno no resetGlobalHwid:', error);
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Erro interno: ${error.message}` }) 
        };
    }
};