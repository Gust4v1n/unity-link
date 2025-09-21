// netlify/functions/getStats.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        // Buscar todos os usuários para calcular estatísticas
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('id, banned, date_expiry');

        if (error) throw error;

        // Calcular estatísticas
        const totalUsuarios = usuarios.length;
        const usuariosAtivos = usuarios.filter(user => !user.banned).length;
        const usuariosBanidos = usuarios.filter(user => user.banned).length;
        
        // Calcular usuários expirados
        const hoje = new Date();
        const usuariosExpirados = usuarios.filter(user => {
            if (!user.date_expiry) return false; // Usuários sem data de expiração não expiram
            return new Date(user.date_expiry) < hoje;
        }).length;

        // Calcular usuários que expiram em 7 dias
        const proximaSemanaa = new Date();
        proximaSemanaa.setDate(proximaSemanaa.getDate() + 7);
        
        const usuariosProximoVencimento = usuarios.filter(user => {
            if (!user.date_expiry) return false;
            const dataExpiracao = new Date(user.date_expiry);
            return dataExpiracao > hoje && dataExpiracao <= proximaSemanaa;
        }).length;

        // Buscar configurações para versão
        let versao = '1.0.0';
        try {
            const { data: config } = await supabase
                .from('configuracoes')
                .select('versao')
                .eq('id', 1)
                .single();
            
            if (config && config.versao) {
                versao = config.versao;
            }
        } catch (configError) {
            console.log('Usando versão padrão');
        }

        const stats = {
            totalUsuarios,
            usuariosAtivos,
            usuariosBanidos,
            usuariosExpirados,
            usuariosProximoVencimento,
            versao,
            ultimaAtualizacao: new Date().toISOString()
        };

        return { statusCode: 200, body: JSON.stringify(stats) };

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};