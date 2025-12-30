// login-script.js - VERSÃO CORRIGIDA

// Configurações
const API_BASE_URL = '/.netlify/functions';

// Função para obter IP do usuário
async function getCurrentIP() {
    try {
        // Tentar várias APIs para obter IP
        const ipServices = [
            'https://api.ipify.org?format=json',
            'https://httpbin.org/ip',
            'https://api.my-ip.io/ip.json'
        ];

        for (const service of ipServices) {
            try {
                const response = await fetch(service);
                const data = await response.json();

                // Diferentes APIs retornam o IP em campos diferentes
                const ip = data.ip || data.origin || data.query;
                if (ip) {
                    console.log('IP obtido:', ip);
                    return ip;
                }
            } catch (error) {
                console.warn(`Falha ao obter IP de ${service}:`, error);
                continue;
            }
        }

        // Fallback: usar IP local para desenvolvimento
        console.warn('Não foi possível obter IP real, usando fallback');
        return '127.0.0.1';

    } catch (error) {
        console.error('Erro ao obter IP:', error);
        return '127.0.0.1'; // Fallback para localhost
    }
}

// Função para gerar hash SHA-256
async function hashSHA256(str) {
    try {
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } else {
            // Fallback para navegadores sem crypto.subtle
            return await sha256Fallback(str);
        }
    } catch (error) {
        console.warn('Erro com crypto.subtle, usando fallback:', error);
        return await sha256Fallback(str);
    }
}

// Fallback para SHA-256 (implementação simples)
async function sha256Fallback(str) {
    // Para desenvolvimento - em produção use uma biblioteca como crypto-js
    console.warn('Usando fallback de hash - não recomendado para produção');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-triangle',
        warning: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };

    notification.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;

    // Adicionar estilos se não existirem
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 10000;
                min-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-success {
                background: linear-gradient(45deg, #4CAF50, #45a049);
            }
            .notification-error {
                background: linear-gradient(45deg, #f44336, #d32f2f);
            }
            .notification-warning {
                background: linear-gradient(45deg, #ff9800, #f57c00);
            }
            .notification-info {
                background: linear-gradient(45deg, #2196F3, #1976D2);
            }
            .notification i {
                font-size: 18px;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 100);

    // Remover após alguns segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Função para mostrar/ocultar loader
function toggleLoader(show = true) {
    const loader = document.querySelector('.loader');
    const submitBtn = document.querySelector('#submitBtn');

    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }

    if (submitBtn) {
        submitBtn.disabled = show;
        submitBtn.innerHTML = show ?
            '<i class="fas fa-spinner fa-spin"></i> Entrando...' :
            '<i class="fas fa-sign-in-alt"></i> Entrar';
    }
}

// Função principal de login
async function login(event) {
    event.preventDefault();

    const username = document.getElementById('username') ? .value ? .trim();
    const password = document.getElementById('password') ? .value;

    // Validações básicas
    if (!username || !password) {
        showNotification('Por favor, preencha todos os campos.', 'warning');
        return;
    }

    if (username.length < 3) {
        showNotification('Username deve ter pelo menos 3 caracteres.', 'warning');
        return;
    }

    if (password.length < 6) {
        showNotification('Senha deve ter pelo menos 6 caracteres.', 'warning');
        return;
    }

    toggleLoader(true);

    try {
        // Obter IP atual
        const currentIP = await getCurrentIP();

        // Gerar hash da senha
        const hashedPassword = await hashSHA256(password);

        const loginData = {
            username: username,
            hashedPassword: hashedPassword,
            currentIP: currentIP
        };

        console.log('Tentando login com:', {
            username: loginData.username,
            ip: loginData.currentIP,
            hashedPassword: loginData.hashedPassword.substring(0, 10) + '...'
        });

        // Fazer requisição de login
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            console.error('Erro ao fazer parse da resposta:', parseError);
            throw new Error('Resposta inválida do servidor');
        }

        console.log('Resposta do servidor:', result);

        if (result.success) {
            // Login bem-sucedido
            const sessionData = {
                username: result.user.username,
                user_id: result.user.id,
                role: result.user.role || 'admin',
                login_time: new Date().toISOString(),
                ip: currentIP
            };

            // Salvar sessão
            localStorage.setItem('admin_session', JSON.stringify(sessionData));
            sessionStorage.setItem('admin_authenticated', 'true');

            showNotification('Login realizado com sucesso! Redirecionando...', 'success');

            // Limpar campos
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';

            // Redirecionar após pequeno delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } else {
            // Login falhou
            const errorMessage = result.message || 'Credenciais inválidas';
            showNotification(errorMessage, 'error');

            // Casos específicos de erro
            if (result.error_code === 'TABLE_NOT_FOUND') {
                showNotification('Sistema não configurado. Contate o administrador.', 'error');
            }
        }

    } catch (error) {
        console.error('Erro no login:', error);

        let errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
        } else if (error.message.includes('JSON')) {
            errorMessage = 'Erro de comunicação com o servidor.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        showNotification(errorMessage, 'error');

    } finally {
        toggleLoader(false);
    }
}

// Função para verificar se já está logado
function checkIfLoggedIn() {
    const session = localStorage.getItem('admin_session');
    const authenticated = sessionStorage.getItem('admin_authenticated');

    if (session && authenticated === 'true') {
        try {
            const sessionData = JSON.parse(session);
            const loginTime = new Date(sessionData.login_time);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

            if (hoursDiff < 24) {
                // Sessão ainda válida, redirecionar
                console.log('Usuário já logado, redirecionando...');
                window.location.href = 'index.html';
                return;
            } else {
                // Sessão expirada
                localStorage.removeItem('admin_session');
                sessionStorage.removeItem('admin_authenticated');
                showNotification('Sessão expirada. Faça login novamente.', 'warning');
            }
        } catch (error) {
            console.error('Erro ao verificar sessão:', error);
            localStorage.removeItem('admin_session');
            sessionStorage.removeItem('admin_authenticated');
        }
    }
}

// Função para toggle de mostrar/ocultar senha
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de login carregada');

    // Verificar se já está logado
    checkIfLoggedIn();

    // Configurar formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }

    // Configurar toggle de senha
    const togglePasswordBtn = document.querySelector('.toggle-password');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePassword);
    }

    // Focus no primeiro campo
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.focus();
    }

    // Enter para submeter em qualquer campo
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const form = document.getElementById('loginForm');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    });
});

// Interceptar erros globais
window.addEventListener('error', function(error) {
    console.error('Erro global capturado:', error);
    showNotification('Ocorreu um erro inesperado. Recarregue a página.', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Promise rejeitada:', event.reason);
    event.preventDefault();
});

// Exportar funções para uso global
window.login = login;
window.togglePassword = togglePassword;
window.showNotification = showNotification;