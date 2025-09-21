// netlify/functions/toggleBan.js - CORREÇÃO FINAL

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

exports.handler = async (event, context) => {
    // Headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Verificar método HTTP
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
        // Validar variáveis de ambiente
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Configuração do Supabase não encontrada');
        }

        // Parse do body
        let requestData;
        try {
            requestData = JSON.parse(event.body);
        } catch (parseError) {
            console.error('Erro ao fazer parse do JSON:', parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Dados da requisição inválidos' })
            };
        }

        const { id, newBanStatus } = requestData;
        
        // Validação dos dados
        if (!id || typeof newBanStatus !== 'boolean') {
            console.error('Dados inválidos recebidos:', { id, newBanStatus });
            return { 
                statusCode: 400, 
                headers,
                body: JSON.stringify({ message: "ID e status de ban são obrigatórios." }) 
            };
        }

        console.log(`[toggleBan] Iniciando alteração - ID: ${id}, Novo status: ${newBanStatus}`);

        // Primeiro, verificar se o usuário existe e buscar dados atuais
        const { data: userData, error: selectError } = await supabase
            .from('usuarios')
            .select('id, username, banned')
            .eq('id', id)
            .single();

        if (selectError) {
            console.error('Erro ao buscar usuário:', selectError);
            
            if (selectError.code === 'PGRST116') {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ message: "Usuário não encontrado." })
                };
            }
            
            throw selectError;
        }

        if (!userData) {
            console.error('Usuário não encontrado para ID:', id);
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ message: "Usuário não encontrado." })
            };
        }

        console.log(`[toggleBan] Usuário encontrado: ${userData.username}, Status atual: ${userData.banned}`);

        // Verificar se já está no status desejado
        if (userData.banned === newBanStatus) {
            const statusText = newBanStatus ? 'banido' : 'ativo';
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    message: `Usuário ${userData.username} já está ${statusText}.` 
                })
            };
        }

        // Realizar a atualização APENAS do campo banned
        console.log(`[toggleBan] Atualizando status de ban para usuário ID ${id}`);
        
        const { data: updateData, error: updateError } = await supabase
            .from('usuarios')
            .update({ banned: newBanStatus })
            .eq('id', id)
            .select('id, username, banned');

        if (updateError) {
            console.error('Erro na atualização:', updateError);
            console.error('Detalhes do erro:', {
                code: updateError.code,
                message: updateError.message,
                details: updateError.details,
                hint: updateError.hint
            });
            
            // Tentar identificar se é problema de campo inexistente
            if (updateError.message && updateError.message.includes('updated_at')) {
                console.error('ERRO: Tentativa de atualizar campo updated_at inexistente!');
                
                // Tentar uma atualização mais simples usando query raw
                try {
                    const { data: rawUpdateData, error: rawError } = await supabase
                        .rpc('update_user_ban_status', { 
                            user_id: id, 
                            new_ban_status: newBanStatus 
                        });
                    
                    if (!rawError) {
                        const action = newBanStatus ? 'banido' : 'desbanido';
                        return {
                            statusCode: 200,
                            headers,
                            body: JSON.stringify({ 
                                message: `Usuário ${userData.username} foi ${action} com sucesso via RPC!` 
                            })
                        };
                    }
                } catch (rpcError) {
                    console.log('RPC também falhou, tentando query SQL direta');
                }
                
                // Se chegou até aqui, vamos tentar uma abordagem diferente
                throw new Error('Campo updated_at não existe na tabela. Execute o script SQL de correção.');
            }
            
            throw updateError;
        }

        if (!updateData || updateData.length === 0) {
            throw new Error('Nenhum registro foi atualizado');
        }

        const updatedUser = updateData[0];
        const action = newBanStatus ? 'banido' : 'desbanido';
        const successMessage = `Usuário ${updatedUser.username} foi ${action} com sucesso!`;
        
        console.log(`[toggleBan] Sucesso: ${successMessage}`);
        console.log(`[toggleBan] Dados atualizados:`, updatedUser);
        
        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ 
                message: successMessage,
                user: updatedUser
            }) 
        };

    } catch (error) {
        console.error('[toggleBan] Erro crítico:', error);
        console.error('[toggleBan] Stack trace:', error.stack);
        
        // Log detalhado para debug
        console.error('[toggleBan] Detalhes completos do erro:', {
            name: error.name,
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });

        let errorMessage = 'Erro interno do servidor';
        let statusCode = 500;

        if (error.message.includes('updated_at')) {
            errorMessage = 'Estrutura da tabela inválida. Execute o script de correção no Supabase.';
            statusCode = 500;
        } else if (error.message.includes('Configuração')) {
            errorMessage = 'Configuração do servidor incompleta';
            statusCode = 500;
        } else if (error.code) {
            errorMessage = `Erro de banco de dados: ${error.message}`;
        }

        return { 
            statusCode,
            headers,
            body: JSON.stringify({ 
                message: errorMessage,
                error_code: error.code || 'INTERNAL_ERROR',
                debug_info: process.env.NODE_ENV === 'development' ? error.message : undefined
            }) 
        };
    }
};