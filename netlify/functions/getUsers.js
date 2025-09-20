// netlify/functions/getUsers.js

const supabase = require('./_supabaseClient');

exports.handler = async (event) => {
    try {
        const searchValue = event.queryStringParameters.search;
        let query = supabase.from('usuarios').select('*').order('id', { ascending: true });

        if (searchValue) {
            query = query.ilike('username', `%${searchValue}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return { statusCode: 200, body: JSON.stringify(data) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};