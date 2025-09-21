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
        const { days } = JSON.parse(event.body);
        
        if (!days || isNaN(parseInt(days))) {
            return { 
                statusCode: 400, 
                headers,
                body: JSON.stringify({ message: "Número de dias inválido." }) 
            };
        }

        const daysToAdd = parseInt(days);
        console.log(`Adicionando ${daysToAdd} dias a todos os usuários ativos`);

        // Primeiro, tentar usar a função RPC se existir
        try {
            const { data: rpcResult, error: rpcError } = await supabase.rpc('add_days_to_active_users', {
                days_to_add: daysToAdd
            });

            if (!rpcError) {
                console.log('Sucesso com RPC add_days_to_active_users');
                return { 
                    statusCode: 200, 
                    headers,
                    body: JSON.stringify({ 
                        message: `${daysToAdd} dias adicionados a todos os usuários ativos via RPC!` 
                    }) 
                };
            } else {
                console.log('RPC não disponível, usando método alternativo:', rpcError.message);
            }
        } catch (rpcErr) {
            console.log('RPC falhou, usando método alternativo:', rpcErr.message);
        }

        // Método alternativo: buscar usuários ativos e atualizar um por vez
        const { data: activeUsers, error: fetchError } = await supabase
            .from('usuarios')
            .select('id, username, date_expiry')
            .eq('banned', false);

        if (fetchError) {
            console.error('Erro ao buscar usuários ativos:', fetchError);
            throw fetchError;
        }

        if (!activeUsers || activeUsers.length === 0) {
            return { 
                statusCode: 200, 
                headers,
                body: JSON.stringify({ 
                    message: "Nenhum usuário ativo encontrado." 
                }) 
            };
        }

        console.log(`Encontrados ${activeUsers.length} usuários ativos para atualizar`);

        // Atualizar cada usuário individualmente para evitar conflitos
        let sucessCount = 0;
        let errorCount = 0;

        for (const user of activeUsers) {
            try {
                let newExpiryDate;
                
                if (user.date_expiry) {
                    // Se já tem data de expiração, adicionar os dias
                    const currentExpiry = new Date(user.date_expiry);
                    newExpiryDate = new Date(currentExpiry.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
                } else {
                    // Se não tem data de expiração, definir a partir de hoje
                    newExpiryDate = new Date();
                    newExpiryDate.setDate(newExpiryDate.getDate() + daysToAdd);
                }

                // Atualizar usuário individual - SEM tentar atualizar campos que não existem
                const { error: updateError } = await supabase
                    .from('usuarios')
                    .update({ date_expiry: newExpiryDate.toISOString() })
                    .eq('id', user.id);

                if (updateError) {
                    console.error(`Erro ao atualizar usuário ${user.username}:`, updateError);
                    errorCount++;
                } else {
                    sucessCount++;
                    console.log(`Usuário ${user.username} atualizado com sucesso`);
                }
            } catch (userError) {
                console.error(`Erro ao processar usuário ${user.username}:`, userError);
                errorCount++;
            }
        }

        const message = `${sucessCount} usuários atualizados com sucesso. ${errorCount} erros.`;
        console.log(message);

        return { 
            statusCode: sucessCount > 0 ? 200 : 500, 
            headers,
            body: JSON.stringify({ 
                message: `${daysToAdd} dias adicionados! ${message}`,
                sucessCount,
                errorCount,
                totalProcessed: activeUsers.length
            }) 
        };

    } catch (error) {
        console.error('Erro interno no addGlobalTime:', error);
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