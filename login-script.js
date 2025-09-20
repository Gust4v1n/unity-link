// login-script.js

let userIP = null;

// Sistema de Temas
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');

    if (body.classList.contains('light-theme')) {
        // Mudar para tema escuro
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        // Mudar para tema claro
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// Carregar tema salvo
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');

    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        icon.className = 'fas fa-moon';
    } else {
        // Tema escuro por padrão
        body.classList.add('dark-theme');
        icon.className = 'fas fa-sun';
    }
}

// Função para mostrar notificações
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-${getIconForType(type)}"></i> ${message}`;
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

function getIconForType(type) {
    const icons = {
        success: 'check',
        error: 'exclamation-triangle',
        warning: 'exclamation',
        info: 'info'
    };
    return icons[type] || 'info';
}

// Função para obter IP do usuário
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
        document.getElementById('userIP').textContent = userIP;
        return userIP;
    } catch (error) {
        console.error('Erro ao obter IP:', error);
        document.getElementById('userIP').textContent = 'Erro ao obter IP';
        showNotification('Não foi possível obter seu IP. Tente novamente.', 'warning');
        return null;
    }
}

// Função para gerar SHA-256 (versão compatível)
async function hashSHA256(str) {
    try {
        if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            return await sha256Fallback(str);
        }
    } catch (error) {
        console.warn('Erro com crypto.subtle, usando fallback:', error);
        return await sha256Fallback(str);
    }
}

// Implementação SHA-256 pura em JavaScript (fallback)
async function sha256Fallback(str) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    
    function sha256Hash(message) {
        const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
        const msgBytes=new TextEncoder().encode(message),msgBits=8*msgBytes.length,paddedLength=512*Math.ceil((msgBits+1+64)/512),padded=new Uint8Array(paddedLength/8);padded.set(msgBytes),padded[msgBytes.length]=128;
        const view=new DataView(padded.buffer);view.setUint32(padded.length-4,msgBits,false);
        for(let chunk=0;chunk<padded.length;chunk+=64){const w=new Uint32Array(64);for(let i=0;i<16;i++)w[i]=view.getUint32(chunk+4*i,false);for(let i=16;i<64;i++){const s0=rightRotate(w[i-15],7)^rightRotate(w[i-15],18)^w[i-15]>>>3,s1=rightRotate(w[i-2],17)^rightRotate(w[i-2],19)^w[i-2]>>>10;w[i]=w[i-16]+s0+w[i-7]+s1>>>0}let[a,b,c,d,e,f,g,h2]=h;
        for(let i=0;i<64;i++){const S1=rightRotate(e,6)^rightRotate(e,11)^rightRotate(e,25),ch=e&f^~e&g,temp1=h2+S1+ch+k[i]+w[i]>>>0,S0=rightRotate(a,2)^rightRotate(a,13)^rightRotate(a,22),maj=a&b^a&c^b&c,temp2=S0+maj>>>0;h2=g,g=f,f=e,e=d+temp1>>>0,d=c,c=b,b=a,a=temp1+temp2>>>0}h[0]=h[0]+a>>>0,h[1]=h[1]+b>>>0,h[2]=h[2]+c>>>0,h[3]=h[3]+d>>>0,h[4]=h[4]+e>>>0,h[5]=h[5]+f>>>0,h[6]=h[6]+g>>>0,h[7]=h[7]+h2>>>0}
        return h.map(x=>x.toString(16).padStart(8,'0')).join('');
    }
    return sha256Hash(str);
}

// Função de login MODIFICADA
async function login(username, password, currentIP) {
    try {
        const hashedPassword = await hashSHA256(password);
        console.log('Tentando login com:', { username, currentIP });

        const response = await fetch('/.netlify/functions/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                hashedPassword,
                currentIP
            })
        });

        const result = await response.json();

        if (!response.ok) {
            // Lança um erro com a mensagem vinda do backend
            throw new Error(result.message || 'Erro desconhecido no servidor.');
        }

        // Salvar sessão se o login for bem-sucedido
        const session = {
            user_id: result.user.id,
            username: result.user.username,
            ip: currentIP,
            login_time: new Date().toISOString()
        };

        localStorage.setItem('admin_session', JSON.stringify(session));
        sessionStorage.setItem('admin_authenticated', 'true');

        return { success: true, user: result.user };

    } catch (error) {
        console.error('Erro no login:', error);
        throw error; // Propaga o erro para o event listener do formulário
    }
}

// Função para alternar visibilidade da senha
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

// Verificar se já está logado
function checkExistingSession() {
    const session = localStorage.getItem('admin_session');
    const authenticated = sessionStorage.getItem('admin_authenticated');
    
    if (session && authenticated === 'true') {
        try {
            const sessionData = JSON.parse(session);
            const loginTime = new Date(sessionData.login_time);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            // Sessão válida por 24 horas
            if (hoursDiff < 24 && sessionData.ip === userIP) {
                showNotification('Você já está logado!', 'info');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                return true;
            } else {
                localStorage.removeItem('admin_session');
                sessionStorage.removeItem('admin_authenticated');
            }
        } catch (error) {
            console.error('Erro ao verificar sessão:', error);
            localStorage.removeItem('admin_session');
            sessionStorage.removeItem('admin_authenticated');
        }
    }
    return false;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    loadTheme();
    await getUserIP();
    
    if (checkExistingSession()) {
        return;
    }
    
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!userIP) {
            showNotification('IP não carregado. Recarregue a página.', 'error');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            showNotification('Preencha todos os campos!', 'warning');
            return;
        }
        
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        loginBtn.innerHTML = '<i class="fas fa-spinner"></i> Entrando...';
        
        try {
            const result = await login(username, password, userIP);
            
            if (result.success) {
                showNotification(`Bem-vindo, ${result.user.username}!`, 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }
    });
    
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') passwordInput.focus();
    });
    
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') loginForm.dispatchEvent(new Event('submit'));
    });
});