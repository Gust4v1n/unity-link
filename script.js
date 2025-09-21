// --- FUNÇÕES DE ESTATÍSTICAS ---
async function atualizarEstatisticas() {
    try {
        console.log('Atualizando estatísticas...');
        
        // Usar endpoint específico para estatísticas se disponível
        let stats;
        try {
            stats = await apiCall('getStats', 'GET');
            console.log('Estatísticas obtidas via API:', stats);
        } catch (error) {
            console.log('Endpoint de estatísticas não disponível, calculando manualmente...');
            // Fallback: buscar usuários e calcular manualmente
            const usuarios = await apiCall('getUsers', 'GET');
            stats = {
                totalUsuarios: usuarios.length,
                usuariosAtivos: usuarios.filter(user => !user.banned).length,
                usuariosBanidos: usuarios.filter(user => user.banned).length,
                versao: '1.0.0'
            };
        }
        
        // Atualizar elementos da interface
        const elementos = {
            totalUsers: stats.totalUsuarios,
            activeUsers: stats.usuariosAtivos,
            bannedUsers: stats.usuariosBanidos,
            userCount: stats.totalUsuarios,
            affectedCount: stats.usuariosAtivos,
            currentVersion: `v${stats.versao}`
        };
        
        Object.keys(elementos).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elementos[id];
            }
        });
        
        console.log('Estatísticas atualizadas:', stats);
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        showNotification('Erro ao carregar estatísticas: ' + error.message, 'error');
    }
}// script.js - Versão Integrada com Backend

// --- CONFIGURAÇÕES ---
const API_BASE_URL = '/.netlify/functions';

// --- FUNÇÕES DE AUTENTICAÇÃO E UI ---
function checkAuthentication() {
    const session = localStorage.getItem('admin_session');
    const authenticated = sessionStorage.getItem('admin_authenticated');
    
    if (!session || authenticated !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const sessionData = JSON.parse(session);
        const loginTime = new Date(sessionData.login_time);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff >= 24) {
            localStorage.removeItem('admin_session');
            sessionStorage.removeItem('admin_authenticated');
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html';
            return false;
        }
        
        displayUserInfo(sessionData);
        return true;
        
    } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        localStorage.removeItem('admin_session');
        sessionStorage.removeItem('admin_authenticated');
        window.location.href = 'login.html';
        return false;
    }
}

function displayUserInfo(sessionData) {
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement) {
        currentUserElement.textContent = sessionData.username || 'Admin';
    }
}

function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('admin_session');
        sessionStorage.removeItem('admin_authenticated');
        showNotification('Logout realizado com sucesso!');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// --- FUNÇÕES UTILITÁRIAS ---
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-theme');
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        if (icon) icon.className = 'fas fa-sun';
    } else {
        if (icon) icon.className = 'fas fa-moon';
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'exclamation-triangle'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${type === 'success' ? 'Sucesso!' : type === 'error' ? 'Erro!' : 'Aviso!'}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    // Adiciona estilos se não existirem
    if (!document.querySelector('style[data-notification-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notification-styles', 'true');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
                max-width: 400px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification.success {
                border-left: 4px solid var(--success);
            }
            .notification.error {
                border-left: 4px solid var(--danger);
            }
            .notification.warning {
                border-left: 4px solid var(--warning);
            }
            .notification-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .notification.success .notification-icon {
                background: rgba(0, 214, 143, 0.1);
                color: var(--success);
            }
            .notification.error .notification-icon {
                background: rgba(255, 61, 113, 0.1);
                color: var(--danger);
            }
            .notification.warning .notification-icon {
                background: rgba(255, 170, 0, 0.1);
                color: var(--warning);
            }
            .notification-title {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 2px;
            }
            .notification-message {
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
            .password-field {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .current-password {
                font-size: 0.75rem;
                color: var(--text-muted);
                font-family: monospace;
            }
            .loading {
                text-align: center;
                color: var(--text-muted);
                font-style: italic;
                padding: 40px !important;
            }
            .loading i {
                font-size: 24px;
                margin-bottom: 8px;
                display: block;
            }
            .empty-state {
                text-align: center;
                color: var(--text-muted);
                font-style: italic;
                padding: 40px !important;
            }
            .empty-state i {
                font-size: 48px;
                margin-bottom: 12px;
                display: block;
                opacity: 0.5;
            }
            .status-badge, .subscription-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 500;
            }
            .status-badge.active {
                background: rgba(0, 214, 143, 0.1);
                color: var(--success);
            }
            .status-badge.banned {
                background: rgba(255, 61, 113, 0.1);
                color: var(--danger);
            }
            .subscription-badge.valid {
                background: rgba(0, 214, 143, 0.1);
                color: var(--success);
            }
            .subscription-badge.warning {
                background: rgba(255, 170, 0, 0.1);
                color: var(--warning);
            }
            .subscription-badge.expired {
                background: rgba(255, 61, 113, 0.1);
                color: var(--danger);
            }
            .subscription-badge.no-expiry {
                background: rgba(0, 180, 216, 0.1);
                color: var(--info);
            }
            .subscription-cell {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .actions-cell {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }
            .hwid-display {
                font-family: monospace;
                font-size: 0.85rem;
                color: var(--text-secondary);
                word-break: break-all;
                max-width: 120px;
                display: block;
            }
            .date-input {
                font-size: 0.85rem;
                padding: 4px 6px;
            }
            .btn-sm {
                padding: 6px 8px;
                font-size: 0.8rem;
            }
            .form-control {
                background: var(--bg-input);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                padding: 6px 10px;
                color: var(--text-primary);
                font-size: 0.9rem;
            }
            .form-control:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

async function hashSHA256(str) {
    try {
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        }
        return await sha256Fallback(str);
    } catch (error) {
        console.warn('Erro com crypto.subtle, usando fallback:', error);
        return await sha256Fallback(str);
    }
}

function calcularDiasRestantes(dateString) {
    if (!dateString) return null;
    const expiryDate = new Date(dateString);
    const today = new Date();
    const timeDiff = expiryDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

function formatarDataParaInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// --- FUNÇÃO CENTRALIZADA PARA CHAMADAS DE API ---
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        let url = `${API_BASE_URL}/${endpoint}`;
        if (method === 'GET' && body) {
            const params = new URLSearchParams();
            Object.keys(body).forEach(key => {
                if (body[key] !== null && body[key] !== undefined) {
                    params.append(key, body[key]);
                }
            });
            if (params.toString()) {
                url += '?' + params.toString();
            }
        }

        console.log(`Fazendo chamada para: ${url}`, { method, body });

        const response = await fetch(url, options);
        let result;
        
        try {
            result = await response.json();
        } catch (e) {
            throw new Error(`Erro ao processar resposta da API: ${response.statusText}`);
        }

        if (!response.ok) {
            throw new Error(result.message || `Erro HTTP ${response.status}: ${response.statusText}`);
        }
        
        return result;
    } catch (error) {
        console.error(`Erro na chamada da API para ${endpoint}:`, error);
        throw error;
    }
}

// --- FUNÇÕES DE ESTATÍSTICAS ---
async function atualizarEstatisticas() {
    try {
        console.log('Atualizando estatísticas...');
        const usuarios = await apiCall('getUsers', 'GET');
        
        const totalUsuarios = usuarios.length;
        const usuariosAtivos = usuarios.filter(user => !user.banned).length;
        const usuariosBanidos = totalUsuarios - usuariosAtivos;
        
        // Atualizar cards de estatísticas
        const totalUsersEl = document.getElementById('totalUsers');
        const activeUsersEl = document.getElementById('activeUsers');
        const bannedUsersEl = document.getElementById('bannedUsers');
        const userCountEl = document.getElementById('userCount');
        const affectedCountEl = document.getElementById('affectedCount');
        
        if (totalUsersEl) totalUsersEl.textContent = totalUsuarios;
        if (activeUsersEl) activeUsersEl.textContent = usuariosAtivos;
        if (bannedUsersEl) bannedUsersEl.textContent = usuariosBanidos;
        if (userCountEl) userCountEl.textContent = totalUsuarios;
        if (affectedCountEl) affectedCountEl.textContent = usuariosAtivos;
        
        console.log('Estatísticas atualizadas:', { totalUsuarios, usuariosAtivos, usuariosBanidos });
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        showNotification('Erro ao carregar estatísticas: ' + error.message, 'error');
    }
}

// --- FUNÇÕES DE INTERAÇÃO COM A API ---
async function carregarUsuarios() {
    const tbody = document.querySelector("#usersTable tbody");
    if (!tbody) {
        console.error('Tabela de usuários não encontrada');
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="7" class="loading"><i class="fas fa-spinner fa-spin"></i><br>Carregando usuários...</td></tr>';
    
    try {
        const searchValue = document.querySelector("#searchInput")?.value?.trim() || '';
        console.log('Carregando usuários com busca:', searchValue);
        
        const usuarios = await apiCall('getUsers', 'GET', searchValue ? { search: searchValue } : null);
        console.log('Usuários carregados:', usuarios);
        
        // Limpar tabela
        tbody.innerHTML = "";
        
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-user-slash"></i><br>Nenhum usuário encontrado</td></tr>';
            return;
        }

        usuarios.forEach(user => {
            const tr = document.createElement("tr");
            const bannedStatus = user.banned ? 
                '<span class="status-badge banned"><i class="fas fa-ban"></i> Banido</span>' : 
                '<span class="status-badge active"><i class="fas fa-check"></i> Ativo</span>';
            
            const diasRestantes = calcularDiasRestantes(user.date_expiry);
            let assinaturaStatus = '';
            
            if (diasRestantes === null) {
                assinaturaStatus = '<span class="subscription-badge no-expiry"><i class="fas fa-infinity"></i> Sem limite</span>';
            } else if (diasRestantes < 0) {
                assinaturaStatus = `<span class="subscription-badge expired"><i class="fas fa-times"></i> Expirada (${Math.abs(diasRestantes)} dias)</span>`;
            } else if (diasRestantes <= 7) {
                assinaturaStatus = `<span class="subscription-badge warning"><i class="fas fa-exclamation-triangle"></i> ${diasRestantes} dias</span>`;
            } else {
                assinaturaStatus = `<span class="subscription-badge valid"><i class="fas fa-check"></i> ${diasRestantes} dias</span>`;
            }
            
            // Mascarar senha se existir (mostrar apenas primeiros caracteres)
            const senhaDisplay = user.password ? 
                user.password.substring(0, 8) + '...' : 
                'Não definida';
            
            tr.innerHTML = `
                <td><strong>#${user.id}</strong></td>
                <td><input type="text" value="${user.username || ''}" id="username-${user.id}" placeholder="Username" class="form-control"></td>
                <td>
                    <div class="password-field">
                        <small class="current-password">Hash: ${senhaDisplay}</small>
                        <input type="password" placeholder="Nova senha" id="password-${user.id}" class="form-control">
                    </div>
                </td>
                <td><span class="hwid-display">${user.hwid || '<em>Não definido</em>'}</span></td>
                <td>
                    <div class="subscription-cell">
                        ${assinaturaStatus}
                        <input type="date" id="expiry-${user.id}" value="${formatarDataParaInput(user.date_expiry)}" class="date-input form-control" title="Data de expiração">
                    </div>
                </td>
                <td>${bannedStatus}</td>
                <td>
                    <div class="actions-cell">
                        <button onclick="atualizarUsuario(${user.id})" class="btn btn-success btn-sm" title="Salvar alterações">
                            <i class="fas fa-save"></i>
                        </button>
                        <button onclick="toggleBanUsuario(${user.id}, ${user.banned})" class="btn ${user.banned ? 'btn-info' : 'btn-danger'} btn-sm" title="${user.banned ? 'Desbanir' : 'Banir'}">
                            <i class="fas fa-${user.banned ? 'user-check' : 'ban'}"></i>
                        </button>
                        <button onclick="deletarUsuario(${user.id})" class="btn btn-danger btn-sm" title="Deletar usuário">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button onclick="resetHwid(${user.id})" class="btn btn-warning btn-sm" title="Resetar HWID">
                            <i class="fas fa-refresh"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Atualizar estatísticas após carregar usuários
        await atualizarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showNotification('Erro ao carregar usuários: ' + error.message, 'error');
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Erro: ${error.message}</td></tr>`;
    }
}

async function atualizarUsuario(id) {
    try {
        const username = document.querySelector(`#username-${id}`)?.value?.trim();
        const passwordInput = document.querySelector(`#password-${id}`)?.value;
        const expiryDate = document.querySelector(`#expiry-${id}`)?.value;
    
        if (!username) {
            showNotification("Username não pode estar vazio!", 'error');
            return;
        }

        let updates = { 
            username, 
            date_expiry: expiryDate || null 
        };
        
        if (passwordInput) {
            updates.password = await hashSHA256(passwordInput);
        }

        console.log('Atualizando usuário:', id, updates);
        await apiCall('updateUser', 'POST', { id, updates });
        
        showNotification("Usuário atualizado com sucesso!");
        document.querySelector(`#password-${id}`).value = '';
        await carregarUsuarios();

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showNotification(error.message, 'error');
    }
}

async function deletarUsuario(id) {
    if (!confirm("⚠️ Deseja realmente deletar este usuário? Esta ação não pode ser desfeita!")) return;
    
    try {
        console.log('Deletando usuário:', id);
        await apiCall('deleteUser', 'POST', { id });
        showNotification("Usuário deletado com sucesso!");
        await carregarUsuarios();
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        showNotification(error.message, 'error');
    }
}

async function toggleBanUsuario(id, currentBanStatus) {
    const action = currentBanStatus ? 'desbanir' : 'banir';
    if (!confirm(`Deseja realmente ${action} este usuário?`)) return;
    
    try {
        console.log('Alterando status de ban:', id, !currentBanStatus);
        await apiCall('toggleBan', 'POST', { id, newBanStatus: !currentBanStatus });
        showNotification(`Usuário ${action === 'banir' ? 'banido' : 'desbanido'} com sucesso!`);
        await carregarUsuarios();
    } catch (error) {
        console.error('Erro ao alterar status de ban:', error);
        showNotification(error.message, 'error');
    }
}

async function resetHwid(id) {
    if (!confirm("Deseja resetar o HWID deste usuário? Isso permitirá que ele faça login em um novo dispositivo.")) return;
    
    try {
        console.log('Resetando HWID:', id);
        await apiCall('resetHwid', 'POST', { id });
        showNotification("HWID resetado com sucesso!");
        await carregarUsuarios();
    } catch (error) {
        console.error('Erro ao resetar HWID:', error);
        showNotification(error.message, 'error');
    }
}

async function carregarVersao() {
    try {
        console.log('Carregando configurações...');
        const config = await apiCall('getConfig', 'GET');
        
        const currentVersionEl = document.getElementById('currentVersion');
        if (currentVersionEl) {
            currentVersionEl.textContent = `v${config.versao}`;
        }
        
        // Atualizar também na aba de versão
        const versionTags = document.querySelectorAll('.version-tag');
        versionTags.forEach(tag => {
            tag.textContent = `v${config.versao}`;
        });
        
        console.log('Versão carregada:', config.versao);
        
    } catch (error) {
        console.error('Erro ao carregar versão:', error);
        const currentVersionEl = document.getElementById('currentVersion');
        if (currentVersionEl) currentVersionEl.textContent = 'Erro';
    }
}

async function atualizarVersao() {
    const novaVersao = document.getElementById('versionInput')?.value?.trim();
    
    if (!novaVersao) {
        showNotification("Digite uma versão!", 'warning');
        return;
    }
    
    if (!/^\d+\.\d+\.\d+$/.test(novaVersao)) {
        showNotification("Formato de versão inválido! Use o formato x.x.x (ex: 1.0.1)", 'error');
        return;
    }
    
    if (!confirm(`Deseja atualizar a versão para v${novaVersao}?`)) return;
    
    try {
        console.log('Atualizando versão para:', novaVersao);
        await apiCall('updateVersion', 'POST', { novaVersao });
        showNotification(`Versão atualizada para v${novaVersao}!`);
        document.getElementById('versionInput').value = '';
        
        // Atualizar a exibição da versão atual
        const currentVersionEl = document.getElementById('currentVersion');
        if (currentVersionEl) currentVersionEl.textContent = `v${novaVersao}`;
        
        // Adicionar ao histórico
        adicionarAoHistoricoVersao(novaVersao);
        
    } catch (error) {
        console.error('Erro ao atualizar versão:', error);
        showNotification(error.message, 'error');
    }
}

function adicionarAoHistoricoVersao(versao) {
    const historyContainer = document.querySelector('.version-history');
    if (historyContainer) {
        const novoItem = document.createElement('div');
        novoItem.className = 'history-item';
        novoItem.innerHTML = `
            <div class="history-version">v${versao}</div>
            <div class="history-date">${new Date().toLocaleDateString('pt-BR')}</div>
            <div class="history-user">Admin</div>
        `;
        historyContainer.insertBefore(novoItem, historyContainer.firstChild);
        
        // Manter apenas os últimos 10 itens
        const items = historyContainer.querySelectorAll('.history-item');
        if (items.length > 10) {
            historyContainer.removeChild(items[items.length - 1]);
        }
    }
}

async function adicionarTempoGlobal() {
    const daysInput = document.getElementById('daysInput');
    const days = daysInput?.value?.trim();
    
    if (!days || parseInt(days) <= 0 || parseInt(days) > 365) {
        showNotification("Insira um número de dias válido (1-365).", 'error');
        return;
    }
    
    if (!confirm(`Deseja adicionar ${days} dias para todos os usuários ativos? Esta ação afetará todos os usuários não banidos.`)) return;
    
    try {
        console.log('Adicionando tempo global:', days, 'dias');
        const result = await apiCall('addGlobalTime', 'POST', { days: parseInt(days) });
        showNotification(result.message);
        daysInput.value = '';
        await carregarUsuarios();
    } catch (error) {
        console.error('Erro ao adicionar tempo global:', error);
        showNotification(error.message, 'error');
    }
}

async function limparExpirados() {
    const expiredDaysInput = document.getElementById('expiredDays');
    const expiredDays = expiredDaysInput?.value?.trim() || '30';
    
    if (!expiredDays || parseInt(expiredDays) <= 0) {
        showNotification("Insira um número de dias válido.", 'error');
        return;
    }
    
    if (!confirm(`⚠️ ATENÇÃO: Esta ação irá DELETAR PERMANENTEMENTE todos os usuários com assinatura expirada há mais de ${expiredDays} dias. Esta ação NÃO PODE ser desfeita!\n\nDeseja continuar?`)) return;
    
    try {
        console.log('Limpando usuários expirados há mais de', expiredDays, 'dias');
        const result = await apiCall('cleanupExpired', 'POST', { expiredDays: parseInt(expiredDays) });
        showNotification(result.message);
        await carregarUsuarios();
        addLog(`${result.deletedCount} usuários expirados foram removidos`, 'warning');
    } catch (error) {
        console.error('Erro ao limpar expirados:', error);
        showNotification(error.message, 'error');
    }
}

async function resetGlobalHwid() {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá resetar o HWID de TODOS os usuários do sistema. Isso permitirá que todos façam login em novos dispositivos.\n\nDeseja continuar?')) return;
    
    try {
        console.log('Resetando HWID global');
        const result = await apiCall('resetGlobalHwid', 'POST');
        showNotification(result.message);
        await carregarUsuarios();
        addLog(`HWIDs de ${result.affectedCount} usuários foram resetados`, 'warning');
    } catch (error) {
        console.error('Erro ao resetar HWID global:', error);
        showNotification(error.message, 'error');
    }
}

async function criarNovoUsuario() {
    const username = document.getElementById('newUsername')?.value?.trim();
    const password = document.getElementById('newPassword')?.value;
    const days = document.getElementById('newUserDays')?.value?.trim();

    if (!username || !password) {
        showNotification("Username e senha são obrigatórios!", 'warning');
        return;
    }

    if (username.length < 3) {
        showNotification("Username deve ter pelo menos 3 caracteres!", 'error');
        return;
    }

    if (password.length < 6) {
        showNotification("Senha deve ter pelo menos 6 caracteres!", 'error');
        return;
    }

    try {
        const hashedPassword = await hashSHA256(password);
        let expiryDate = null;
        
        if (days && parseInt(days) > 0) {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(days));
            expiryDate = date.toISOString();
        }

        console.log('Criando novo usuário:', { username, expiryDate });
        await apiCall('createUser', 'POST', { username, hashedPassword, expiryDate });
        
        showNotification(`Usuário "${username}" criado com sucesso!`);
        
        // Limpar campos
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newUserDays').value = '';
        
        await carregarUsuarios();
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        showNotification(error.message, 'error');
    }
}

// Função para criar modal de novo usuário (já que a função openCreateUserModal é chamada no HTML)
function openCreateUserModal() {
    // Vamos criar um modal simples
    const modalHTML = `
        <div id="createUserModal" class="modal" style="display: flex;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> Criar Novo Usuário</h3>
                    <button onclick="closeCreateUserModal()" class="btn-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Username:</label>
                        <input type="text" id="newUsername" class="form-control" placeholder="Digite o username">
                    </div>
                    <div class="form-group">
                        <label>Senha:</label>
                        <input type="password" id="newPassword" class="form-control" placeholder="Digite a senha">
                    </div>
                    <div class="form-group">
                        <label>Dias de assinatura (opcional):</label>
                        <input type="number" id="newUserDays" class="form-control" placeholder="Ex: 30" min="1" max="365">
                        <small>Deixe em branco para assinatura sem limite</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeCreateUserModal()" class="btn btn-secondary">Cancelar</button>
                    <button onclick="criarNovoUsuario()" class="btn btn-success">Criar Usuário</button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar estilos do modal se não existirem
    if (!document.querySelector('style[data-modal-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-modal-styles', 'true');
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .modal-content {
                background: var(--bg-card);
                border-radius: 16px;
                width: 90%;
                max-width: 500px;
                border: 1px solid var(--border-color);
            }
            .modal-header {
                padding: 20px 24px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-header h3 {
                margin: 0;
                color: var(--text-primary);
            }
            .btn-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
            }
            .btn-close:hover {
                background: var(--tab-inactive);
            }
            .modal-body {
                padding: 24px;
            }
            .modal-footer {
                padding: 20px 24px;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            .form-group {
                margin-bottom: 16px;
            }
            .form-group label {
                display: block;
                margin-bottom: 6px;
                color: var(--text-secondary);
                font-weight: 500;
            }
            .form-group small {
                display: block;
                margin-top: 4px;
                color: var(--text-muted);
                font-size: 0.85rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    if (modal) {
        modal.remove();
    }
}

// Função para atualizar informações do sistema
async function atualizarInfoSistema() {
    try {
        const lastUpdateEl = document.getElementById('lastUpdate');
        const memoryUsageEl = document.getElementById('memoryUsage');
        
        if (lastUpdateEl) {
            lastUpdateEl.textContent = new Date().toLocaleString('pt-BR');
        }
        
        if (memoryUsageEl && performance && performance.memory) {
            const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            memoryUsageEl.textContent = `${used} MB`;
        } else if (memoryUsageEl) {
            memoryUsageEl.textContent = 'N/A';
        }
        
    } catch (error) {
        console.error('Erro ao atualizar informações do sistema:', error);
    }
}

// Funções para logs
function refreshLogs() {
    showNotification('Logs atualizados!');
    // Aqui você implementaria a lógica para recarregar os logs do servidor
    console.log('Atualizando logs...');
}

function clearLogs() {
    if (confirm('Tem certeza que deseja limpar os logs? Esta ação não pode ser desfeita.')) {
        const logsList = document.getElementById('logsList');
        if (logsList) {
            logsList.innerHTML = '<div class="log-item log-info"><div class="log-icon"><i class="fas fa-info"></i></div><div class="log-content"><div class="log-message">Logs limpos pelo administrador</div><div class="log-time">Agora</div></div></div>';
        }
        showNotification('Logs limpos com sucesso!');
    }
}

// Função para adicionar log
function addLog(message, type = 'info', time = null) {
    const logsList = document.getElementById('logsList');
    if (!logsList) return;
    
    const logItem = document.createElement('div');
    logItem.className = `log-item log-${type}`;
    
    const icons = {
        success: 'check',
        error: 'times',
        warning: 'exclamation-triangle',
        info: 'info'
    };
    
    logItem.innerHTML = `
        <div class="log-icon"><i class="fas fa-${icons[type] || 'info'}"></i></div>
        <div class="log-content">
            <div class="log-message">${message}</div>
            <div class="log-time">${time || 'Agora'}</div>
        </div>
    `;
    
    logsList.insertBefore(logItem, logsList.firstChild);
    
    // Manter apenas os últimos 50 logs
    const logs = logsList.querySelectorAll('.log-item');
    if (logs.length > 50) {
        logsList.removeChild(logs[logs.length - 1]);
    }
}

// Função para switch de abas
function switchTab(tabName) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover classe active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Adicionar classe active ao botão clicado
    const clickedButton = event.target.closest('.tab-btn');
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    // Carregar dados específicos da aba se necessário
    if (tabName === 'usuarios') {
        carregarUsuarios();
    } else if (tabName === 'sistema') {
        atualizarInfoSistema();
    }
}

// Função fallback para SHA256 (caso crypto.subtle não esteja disponível)
async function sha256Fallback(str) {
    return new Promise((resolve) => {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }
        
        function sha256Hash(str) {
            const h = [
                0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
            ];
            
            const k = [
                0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
                0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
                0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
                0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
                0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
                0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
                0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
                0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
            ];
            
            const msg = new TextEncoder().encode(str);
            const msgLength = msg.length * 8;
            const blockCount = Math.ceil((msgLength + 1 + 64) / 512);
            const totalLength = blockCount * 512;
            const paddedMsg = new Uint8Array(totalLength / 8);
            
            paddedMsg.set(msg);
            paddedMsg[msg.length] = 0x80;
            
            const dataView = new DataView(paddedMsg.buffer);
            dataView.setUint32(paddedMsg.length - 4, msgLength, false);
            
            for (let i = 0; i < paddedMsg.length; i += 64) {
                const w = new Uint32Array(64);
                
                for (let j = 0; j < 16; j++) {
                    w[j] = dataView.getUint32(i + j * 4, false);
                }
                
                for (let j = 16; j < 64; j++) {
                    const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
                    const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
                    w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
                }
                
                let [a, b, c, d, e, f, g, h1] = h;
                
                for (let j = 0; j < 64; j++) {
                    const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
                    const ch = (e & f) ^ (~e & g);
                    const temp1 = (h1 + S1 + ch + k[j] + w[j]) >>> 0;
                    const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
                    const maj = (a & b) ^ (a & c) ^ (b & c);
                    const temp2 = (S0 + maj) >>> 0;
                    
                    h1 = g;
                    g = f;
                    f = e;
                    e = (d + temp1) >>> 0;
                    d = c;
                    c = b;
                    b = a;
                    a = (temp1 + temp2) >>> 0;
                }
                
                h[0] = (h[0] + a) >>> 0;
                h[1] = (h[1] + b) >>> 0;
                h[2] = (h[2] + c) >>> 0;
                h[3] = (h[3] + d) >>> 0;
                h[4] = (h[4] + e) >>> 0;
                h[5] = (h[5] + f) >>> 0;
                h[6] = (h[6] + g) >>> 0;
                h[7] = (h[7] + h1) >>> 0;
            }
            
            return h.map(x => x.toString(16).padStart(8, '0')).join('');
        }
        
        resolve(sha256Hash(str));
    });
}

// --- INICIALIZAÇÃO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando painel administrativo...');
    
    if (checkAuthentication()) {
        console.log('Usuário autenticado, carregando dados...');
        
        // Carregar tema
        loadTheme();
        
        // Carregar dados iniciais
        atualizarEstatisticas();
        carregarUsuarios();
        carregarVersao();
        atualizarInfoSistema();
        
        // Configurar busca com debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    console.log('Realizando busca:', this.value);
                    carregarUsuarios();
                }, 300);
            });

            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    clearTimeout(searchTimeout);
                    carregarUsuarios();
                }
            });
        }
        
        // Configurar switches de configuração
        const twoFactorToggle = document.getElementById('2faToggle');
        const ipVerificationToggle = document.getElementById('ipVerification');
        
        if (twoFactorToggle) {
            twoFactorToggle.addEventListener('change', function() {
                const label = this.parentElement.nextElementSibling;
                if (label) {
                    label.textContent = this.checked ? 'Ativado' : 'Desativado';
                }
            });
        }
        
        if (ipVerificationToggle) {
            ipVerificationToggle.addEventListener('change', function() {
                const label = this.parentElement.nextElementSibling;
                if (label) {
                    label.textContent = this.checked ? 'Ativado' : 'Desativado';
                }
            });
        }
        
        // Atualizar estatísticas periodicamente
        setInterval(() => {
            atualizarEstatisticas();
            atualizarInfoSistema();
        }, 30000); // A cada 30 segundos
        
        console.log('Inicialização concluída!');
    } else {
        console.log('Usuário não autenticado, redirecionando...');
    }
});

// Adicionar event listeners globais
window.addEventListener('error', function(error) {
    console.error('Erro global capturado:', error);
    addLog(`Erro do sistema: ${error.message}`, 'error');
});

// Interceptar chamadas de API para adicionar aos logs
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const [url, options = {}] = args;
    const method = options.method || 'GET';
    
    try {
        console.log(`API Call: ${method} ${url}`, options.body ? JSON.parse(options.body) : null);
        const response = await originalFetch.apply(this, args);
        
        if (response.ok) {
            addLog(`API: ${method} ${url.split('/').pop()} - Sucesso`, 'success');
        } else {
            addLog(`API: ${method} ${url.split('/').pop()} - Erro ${response.status}`, 'error');
        }
        
        return response;
    } catch (error) {
        addLog(`API: ${method} ${url.split('/').pop()} - Erro: ${error.message}`, 'error');
        throw error;
    }
};