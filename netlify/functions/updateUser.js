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
        const { id, updates } = JSON.parse(event.body);
        
        if (!id || !updates) {
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "ID ou dados de atualização ausentes." }) 
            };
        }

        console.log(`Atualizando usuário ${id} com dados:`, updates);

        // Verificar se o usuário existe
        const { data: existingUser, error: fetchError } = await supabase
            .from('usuarios')
            .select('id, username')
            .eq('id', id)
            .single();

        if (fetchError || !existingUser) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Usuário não encontrado." })
            };
        }

        // Filtrar apenas campos válidos para evitar erro de campo inexistente
        const validFields = ['username', 'password', 'hwid', 'date_expiry', 'banned'];
        const filteredUpdates = {};
        
        Object.keys(updates).forEach(key => {
            if (validFields.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        if (Object.keys(filteredUpdates).length === 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Nenhum campo válido para atualizar." })
            };
        }

        // Realizar atualização
        const { data, error } = await supabase
            .from('usuarios')
            .update(filteredUpdates)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro na atualização:', error);
            throw error;
        }
        
        console.log('Usuário atualizado com sucesso:', data);
        
        return { 
            statusCode: 200, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: "Usuário atualizado com sucesso!",
                updatedFields: Object.keys(filteredUpdates)
            }) 
        };

    } catch (error) {
        console.error('Erro interno no updateUser:', error);
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Erro interno: ${error.message}` }) 
        };
    }
};