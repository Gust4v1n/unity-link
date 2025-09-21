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
        const { novaVersao } = JSON.parse(event.body);
        
        if (!novaVersao) {
            return { 
                statusCode: 400, 
                headers,
                body: JSON.stringify({ message: "Versão ausente." }) 
            };
        }

        console.log(`Atualizando versão para: ${novaVersao}`);

        // Primeiro, verificar se o registro existe
        const { data: existingConfig, error: selectError } = await supabase
            .from('configuracoes')
            .select('id, versao')
            .eq('id', 1)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            console.error('Erro ao buscar configuração:', selectError);
            throw selectError;
        }

        if (existingConfig) {
            // Atualizar registro existente - SEM tentar usar updated_at
            const { error: updateError } = await supabase
                .from('configuracoes')
                .update({ versao: novaVersao })
                .eq('id', 1);

            if (updateError) {
                console.error('Erro na atualização:', updateError);
                throw updateError;
            }
        } else {
            // Criar novo registro se não existir
            const { error: insertError } = await supabase
                .from('configuracoes')
                .insert({ id: 1, versao: novaVersao });

            if (insertError) {
                console.error('Erro na inserção:', insertError);
                throw insertError;
            }
        }

        console.log(`Versão atualizada para: ${novaVersao}`);

        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ 
                message: "Versão atualizada com sucesso!",
                novaVersao: novaVersao
            }) 
        };

    } catch (error) {
        console.error('Erro interno no updateVersion:', error);
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