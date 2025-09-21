// script.js - Versão Corrigida e Otimizada

// --- CONFIGURAÇÕES ---
const API_BASE_URL = '/.netlify/functions';

// --- FUNÇÕES DE AUTENTICAÇÃO E UI ---
function checkAuthentication() {
    try {
        const session = localStorage.getItem('admin_session');
        const authenticated = sessionStorage.getItem('admin_authenticated');
        
        if (!session || authenticated !== 'true') {
            window.location.href = 'login.html';
            return false;
        }
        
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
        if (icon) icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-theme');
        if (icon) icon.className = 'fas fa-sun';
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
        addNotificationStyles();
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

function addNotificationStyles() {
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
    `;
    document.head.appendChild(style);
}

// --- FUNÇÃO CENTRALIZADA PARA CHAMADAS DE API ---
async function apiCall(endpoint, method = 'GET', body = null, retries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Tentativa ${attempt}/${retries} - Fazendo chamada para: ${endpoint}`);
            
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

            console.log(`API Call: ${method} ${url}`, options.body ? JSON.parse(options.body) : null);

            const response = await fetch(url, options);
            let result;
            
            try {
                result = await response.json();
            } catch (parseError) {
                console.error('Erro ao processar JSON da resposta:', parseError);
                throw new Error(`Erro ao processar resposta da API: ${response.statusText}`);
            }

            if (!response.ok) {
                const errorMessage = result.message || `Erro HTTP ${response.status}: ${response.statusText}`;
                console.error(`Erro da API (${response.status}):`, errorMessage);
                throw new Error(errorMessage);
            }
            
            console.log(`Sucesso na chamada para ${endpoint}:`, result);
            return result;
            
        } catch (error) {
            lastError = error;
            console.error(`Erro na tentativa ${attempt} para ${endpoint}:`, error);
            
            // Se for erro de rede e ainda temos tentativas, aguarda antes de tentar novamente
            if (attempt < retries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
                console.log(`Aguardando antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            }
            
            // Se não é erro de rede ou é a última tentativa, lança o erro
            break;
        }
    }
    
    console.error(`Erro na chamada da API para ${endpoint} após ${retries} tentativas:`, lastError);
    throw lastError;
}

// --- FUNÇÕES DE HASH ---
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

async function sha256Fallback(str) {
    // Implementação simplificada para fallback
    return new Promise((resolve) => {
        // Hash básico para desenvolvimento - substitua por uma implementação real em produção
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        resolve(Math.abs(hash).toString(16));
    });
}

// --- FUNÇÕES UTILITÁRIAS DE DATA ---
function calcularDiasRestantes(dateString) {
    if (!dateString) return null;
    try {
        const expiryDate = new Date(dateString);
        const today = new Date();
        const timeDiff = expiryDate.getTime() - today.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    } catch (error) {
        console.error('Erro ao calcular dias restantes:', error);
        return null;
    }
}

function formatarDataParaInput(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return '';
    }
}

// --- FUNÇÕES DE ESTATÍSTICAS ---
async function atualizarEstatisticas() {
    try {
        console.log('Atualizando estatísticas...');
        
        // Tentar usar endpoint específico primeiro
        let stats;
        try {
            stats = await apiCall('getStats', 'GET');
            console.log('Estatísticas obtidas via API getStats:', stats);
        } catch (error) {
            console.log('Endpoint getStats não disponível, calculando via getUsers...');
            // Fallback: buscar usuários e calcular manualmente
            const usuarios = await apiCall('getUsers', 'GET');
            stats = calculateStatsFromUsers(usuarios);
        }
        
        updateStatsDisplay(stats);
        console.log('Estatísticas atualizadas:', stats);
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        displayStatsError();
    }
}

function calculateStatsFromUsers(usuarios) {
    const today = new Date();
    
    return {
        totalUsuarios: usuarios.length,
        usuariosAtivos: usuarios.filter(user => !user.banned).length,
        usuariosBanidos: usuarios.filter(user => user.banned).length,
        usuariosExpirados: usuarios.filter(user => {
            if (!user.date_expiry) return false;
            return new Date(user.date_expiry) < today;
        }).length,
        versao: '1.0.0'
    };
}

function updateStatsDisplay(stats) {
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
}

function displayStatsError() {
    const errorElements = ['totalUsers', 'activeUsers', 'bannedUsers', 'userCount', 'affectedCount'];
    errorElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = 'Erro';
        }
    });
    showNotification('Erro ao carregar estatísticas. Verifique a conexão.', 'error');
}

// --- FUNÇÕES DE USUÁRIOS ---
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
        
        renderUsers(usuarios, tbody);
        await atualizarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Erro: ${error.message}</td></tr>`;
        showNotification('Erro ao carregar usuários: ' + error.message, 'error');
    }
}

function renderUsers(usuarios, tbody) {
    tbody.innerHTML = "";
    
    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-user-slash"></i><br>Nenhum usuário encontrado</td></tr>';
        return;
    }

    usuarios.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = createUserRow(user);
        tbody.appendChild(tr);
    });
}

function createUserRow(user) {
    const bannedStatus = user.banned ? 
        '<span class="status-badge banned"><i class="fas fa-ban"></i> Banido</span>' : 
        '<span class="status-badge active"><i class="fas fa-check"></i> Ativo</span>';
    
    const diasRestantes = calcularDiasRestantes(user.date_expiry);
    const assinaturaStatus = getSubscriptionBadge(diasRestantes);
    const senhaDisplay = user.password ? user.password.substring(0, 8) + '...' : 'Não definida';
    
    return `
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
}

function getSubscriptionBadge(diasRestantes) {
    if (diasRestantes === null) {
        return '<span class="subscription-badge no-expiry"><i class="fas fa-infinity"></i> Sem limite</span>';
    } else if (diasRestantes < 0) {
        return `<span class="subscription-badge expired"><i class="fas fa-times"></i> Expirada (${Math.abs(diasRestantes)} dias)</span>`;
    } else if (diasRestantes <= 7) {
        return `<span class="subscription-badge warning"><i class="fas fa-exclamation-triangle"></i> ${diasRestantes} dias</span>`;
    } else {
        return `<span class="subscription-badge valid"><i class="fas fa-check"></i> ${diasRestantes} dias</span>`;
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
        const passwordElement = document.querySelector(`#password-${id}`);
        if (passwordElement) passwordElement.value = '';
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

// --- FUNÇÕES DE CONFIGURAÇÃO ---
async function carregarVersao() {
    try {
        console.log('Carregando configurações...');
        const config = await apiCall('getConfig', 'GET');
        
        updateVersionDisplay(config.versao || '1.0.0');
        console.log('Versão carregada:', config.versao);
        
    } catch (error) {
        console.error('Erro ao carregar versão:', error);
        updateVersionDisplay('Erro');
    }
}

function updateVersionDisplay(versao) {
    const currentVersionEl = document.getElementById('currentVersion');
    if (currentVersionEl) {
        currentVersionEl.textContent = versao === 'Erro' ? 'Erro' : `v${versao}`;
    }
    
    // Atualizar também na aba de versão
    const versionTags = document.querySelectorAll('.version-tag');
    versionTags.forEach(tag => {
        tag.textContent = versao === 'Erro' ? 'Erro' : `v${versao}`;
    });
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
        
        const versionInput = document.getElementById('versionInput');
        if (versionInput) versionInput.value = '';
        
        updateVersionDisplay(novaVersao);
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

// --- FUNÇÕES GLOBAIS ---
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
        if (daysInput) daysInput.value = '';
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

// --- FUNÇÕES DE MODAL ---
function openCreateUserModal() {
    if (document.getElementById('createUserModal')) return; // Evita modais duplicados
    
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
    
    addModalStyles();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    if (modal) {
        modal.remove();
    }
}

function addModalStyles() {
    if (document.querySelector('style[data-modal-styles]')) return;
    
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
        .form-control {
            background: var(--bg-input);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 8px 12px;
            color: var(--text-primary);
            font-size: 0.9rem;
            width: 100%;
            box-sizing: border-box;
        }
        .form-control:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
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
        .loading, .empty-state {
            text-align: center !important;
            color: var(--text-muted) !important;
            font-style: italic;
            padding: 40px !important;
        }
        .loading i, .empty-state i {
            display: block;
            margin-bottom: 12px;
            font-size: 32px;
            opacity: 0.6;
        }
        .loading i {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
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
        closeCreateUserModal();
        await carregarUsuarios();
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        showNotification(error.message, 'error');
    }
}

// --- FUNÇÕES DE SISTEMA ---
async function atualizarInfoSistema() {
    try {
        const lastUpdateEl = document.getElementById('lastUpdate');
        const memoryUsageEl = document.getElementById('memoryUsage');
        
        if (lastUpdateEl) {
            lastUpdateEl.textContent = new Date().toLocaleString('pt-BR');
        }
        
        if (memoryUsageEl) {
            if (performance && performance.memory) {
                const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                memoryUsageEl.textContent = `${used} MB`;
            } else {
                memoryUsageEl.textContent = 'N/A';
            }
        }
        
    } catch (error) {
        console.error('Erro ao atualizar informações do sistema:', error);
    }
}

// --- FUNÇÕES DE LOGS ---
function refreshLogs() {
    showNotification('Logs atualizados!');
    addLog('Logs atualizados pelo administrador', 'info');
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
            <div class="log-time">${time || new Date().toLocaleTimeString('pt-BR')}</div>
        </div>
    `;
    
    logsList.insertBefore(logItem, logsList.firstChild);
    
    // Manter apenas os últimos 50 logs
    const logs = logsList.querySelectorAll('.log-item');
    if (logs.length > 50) {
        logsList.removeChild(logs[logs.length - 1]);
    }
}

// --- FUNÇÃO DE NAVEGAÇÃO DE ABAS ---
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
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach((btn, index) => {
        const tabNames = ['usuarios', 'sistema', 'versao', 'global', 'logs'];
        if (tabNames[index] === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Carregar dados específicos da aba se necessário
    switch (tabName) {
        case 'usuarios':
            carregarUsuarios();
            break;
        case 'sistema':
            atualizarInfoSistema();
            break;
        case 'versao':
            carregarVersao();
            break;
        case 'logs':
            addLog('Aba de logs acessada', 'info');
            break;
    }
}

// --- INICIALIZAÇÃO E EVENT LISTENERS ---
function setupEventListeners() {
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

    // Event listeners para modais (fechar com ESC)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCreateUserModal();
        }
    });

    // Event listeners para clicks fora do modal
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('createUserModal');
        if (modal && e.target === modal) {
            closeCreateUserModal();
        }
    });
}

function startPeriodicUpdates() {
    // Atualizar estatísticas e informações do sistema periodicamente
    setInterval(() => {
        try {
            atualizarEstatisticas();
            atualizarInfoSistema();
        } catch (error) {
            console.error('Erro na atualização periódica:', error);
        }
    }, 30000); // A cada 30 segundos
}

function initializeSystem() {
    console.log('Inicializando painel administrativo...');
    
    if (!checkAuthentication()) {
        console.log('Usuário não autenticado, redirecionando...');
        return;
    }

    console.log('Usuário autenticado, carregando dados...');
    
    try {
        // Carregar tema
        loadTheme();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Carregar dados iniciais
        Promise.all([
            atualizarEstatisticas(),
            carregarUsuarios(),
            carregarVersao(),
            atualizarInfoSistema()
        ]).then(() => {
            console.log('Dados iniciais carregados com sucesso');
            addLog('Sistema inicializado com sucesso', 'success');
        }).catch(error => {
            console.error('Erro ao carregar dados iniciais:', error);
            addLog(`Erro na inicialização: ${error.message}`, 'error');
        });
        
        // Iniciar atualizações periódicas
        startPeriodicUpdates();
        
        console.log('Inicialização concluída!');
        
    } catch (error) {
        console.error('Erro durante a inicialização:', error);
        showNotification('Erro durante a inicialização do sistema', 'error');
        addLog(`Erro crítico na inicialização: ${error.message}`, 'error');
    }
}

// --- EVENT LISTENERS GLOBAIS ---
function setupGlobalEventListeners() {
    // Interceptar erros globais
    window.addEventListener('error', function(error) {
        console.error('Erro global capturado:', error);
        addLog(`Erro do sistema: ${error.message}`, 'error');
    });

    // Interceptar erros não tratados de Promises
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Promise rejeitada não tratada:', event.reason);
        addLog(`Erro de promise: ${event.reason}`, 'error');
        event.preventDefault(); // Previne que o erro apareça no console
    });

    // Interceptar problemas de rede
    window.addEventListener('offline', function() {
        showNotification('Conexão perdida! Verifique sua internet.', 'warning');
        addLog('Conexão com a internet perdida', 'warning');
    });

    window.addEventListener('online', function() {
        showNotification('Conexão restabelecida!', 'success');
        addLog('Conexão com a internet restabelecida', 'success');
        // Recarregar dados após reconexão
        setTimeout(() => {
            atualizarEstatisticas();
            carregarUsuarios();
        }, 1000);
    });
}

// --- INICIALIZAÇÃO PRINCIPAL ---
document.addEventListener('DOMContentLoaded', function() {
    setupGlobalEventListeners();
    initializeSystem();
});

// --- INTERCEPTADOR DE FETCH PARA LOGS ---
(function() {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const [url, options = {}] = args;
        const method = options.method || 'GET';
        const endpoint = url.split('/').pop();
        
        try {
            console.log(`API Call: ${method} ${url}`, options.body ? JSON.parse(options.body) : null);
            const response = await originalFetch.apply(this, args);
            
            if (response.ok) {
                addLog(`API: ${method} ${endpoint} - Sucesso`, 'success');
            } else {
                addLog(`API: ${method} ${endpoint} - Erro ${response.status}`, 'error');
            }
            
            return response;
        } catch (error) {
            addLog(`API: ${method} ${endpoint} - Falha: ${error.message}`, 'error');
            throw error;
        }
    };
})();

// --- FUNÇÕES EXPOSTAS GLOBALMENTE ---
window.toggleTheme = toggleTheme;
window.logout = logout;
window.switchTab = switchTab;
window.carregarUsuarios = carregarUsuarios;
window.atualizarUsuario = atualizarUsuario;
window.deletarUsuario = deletarUsuario;
window.toggleBanUsuario = toggleBanUsuario;
window.resetHwid = resetHwid;
window.openCreateUserModal = openCreateUserModal;
window.closeCreateUserModal = closeCreateUserModal;
window.criarNovoUsuario = criarNovoUsuario;
window.atualizarVersao = atualizarVersao;
window.adicionarTempoGlobal = adicionarTempoGlobal;
window.limparExpirados = limparExpirados;
window.resetGlobalHwid = resetGlobalHwid;
window.refreshLogs = refreshLogs;
window.clearLogs = clearLogs;