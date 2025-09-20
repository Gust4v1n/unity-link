import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hivezsxwxmlozyjujcji.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function handler(event, context) {
    try {
        const { data, error } = await supabase.from("usuarios").select("*");
        if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
}
