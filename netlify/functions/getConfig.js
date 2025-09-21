// netlify/functions/getConfig.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        // Tentar buscar configurações da tabela 'configuracoes'
        const { data, error } = await supabase
            .from('configuracoes')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            // Se a tabela não existir ou não tiver dados, retornar configurações padrão
            if (error.code === 'PGRST116' || error.code === '42P01') {
                return { 
                    statusCode: 200, 
                    body: JSON.stringify({ 
                        versao: '1.0.0',
                        maintenance_mode: false,
                        max_users: 1000,
                        registration_enabled: true
                    }) 
                };
            }
            throw error;
        }

        return { statusCode: 200, body: JSON.stringify(data) };

    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        
        // Retornar configurações padrão em caso de erro
        return { 
            statusCode: 200, 
            body: JSON.stringify({ 
                versao: '1.0.0',
                maintenance_mode: false,
                max_users: 1000,
                registration_enabled: true,
                error_message: 'Usando configurações padrão'
            }) 
        };
    }
};