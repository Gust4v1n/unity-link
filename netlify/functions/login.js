// netlify/functions/login.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { username, hashedPassword, currentIP } = JSON.parse(event.body);
        if (!username || !hashedPassword || !currentIP) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Dados de login incompletos.' }) };
        }

        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            throw new Error('Usuário não encontrado ou inativo');
        }

        if (data.password !== hashedPassword) {
            throw new Error('Senha incorreta');
        }

        if (data.allowed_ip !== currentIP) {
            throw new Error(`Acesso negado. IP não autorizado.`);
        }

        // Atualiza o último login
        await supabase
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.id);

        const { password, ...userData } = data; // Nunca retorne a senha para o frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, user: userData }),
        };

    } catch (error) {
        return {
            statusCode: 401,
            body: JSON.stringify({ success: false, message: error.message }),
        };
    }
};