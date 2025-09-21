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
        const { id } = JSON.parse(event.body);
        
        if (!id) {
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "ID do usuário ausente." }) 
            };
        }

        console.log(`Resetando HWID do usuário: ${id}`);

        // Verificar se o usuário existe
        const { data: existingUser, error: fetchError } = await supabase
            .from('usuarios')
            .select('id, username, hwid')
            .eq('id', id)
            .single();

        if (fetchError || !existingUser) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Usuário não encontrado." })
            };
        }

        // Resetar apenas o campo hwid
        const { data, error } = await supabase
            .from('usuarios')
            .update({ hwid: null })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro ao resetar HWID:', error);
            throw error;
        }
        
        console.log('HWID resetado com sucesso para usuário:', existingUser.username);
        
        return { 
            statusCode: 200, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: `HWID do usuário ${existingUser.username} foi resetado com sucesso!` 
            }) 
        };

    } catch (error) {
        console.error('Erro interno no resetHwid:', error);
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Erro interno: ${error.message}` }) 
        };
    }
};