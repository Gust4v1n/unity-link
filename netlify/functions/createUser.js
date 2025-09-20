// netlify/functions/createUser.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { username, hashedPassword, expiryDate } = JSON.parse(event.body);
        if (!username || !hashedPassword) {
            return { statusCode: 400, body: JSON.stringify({ message: "Username e senha são obrigatórios." }) };
        }

        const newUser = {
            username: username,
            password: hashedPassword,
            date_expiry: expiryDate || null, // Permite que a data seja nula
            banned: false,
            hwid: null
        };
        
        const { error } = await supabase.from('usuarios').insert([newUser]);
        if (error) {
            if (error.code === '23505') { // Código de violação de unicidade
                 throw new Error("Este nome de usuário já existe.");
            }
            throw error;
        }
        
        return { statusCode: 201, body: JSON.stringify({ message: "Usuário criado com sucesso!" }) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};