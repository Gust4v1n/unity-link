// script.js

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
            // Usamos alert aqui porque a função showNotification pode não estar visível
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html';
            return false;
        }
        
        displayUserInfo(sessionData);
        return true;
        
    } catch (error) {
        localStorage.removeItem('admin_session');
        sessionStorage.removeItem('admin_authenticated');
        window.location.href = 'login.html';
        return false;
    }
}

function displayUserInfo(sessionData) {
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <div class="user-details">
            <i class="fas fa-user"></i>
            <span>Logado como: <strong>${sessionData.username}</strong></span>
        </div>
        <button onclick="logout()" class="btn-logout" title="Fazer Logout">
            <i class="fas fa-sign-out-alt"></i>
        </button>
    `;
    document.querySelector('.header').appendChild(userInfo);
}

function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('admin_session');
        sessionStorage.removeItem('admin_authenticated');
        // A notificação pode não ser exibida se o redirecionamento for muito rápido
        alert('Logout realizado com sucesso!');
        window.location.href = 'login.html';
    }
}

// --- FUNÇÕES UTILITÁRIAS ---
function toggleTheme() {
    const body=document.body,icon=document.getElementById("themeToggle").querySelector("i");
    if(body.classList.contains("light-theme")){body.classList.remove("light-theme"),body.classList.add("dark-theme"),icon.className="fas fa-sun",localStorage.setItem("theme","dark")}
    else{body.classList.remove("dark-theme"),body.classList.add("light-theme"),icon.className="fas fa-moon",localStorage.setItem("theme","light")}}
function loadTheme(){const e=localStorage.getItem("theme"),t=document.body,s=document.getElementById("themeToggle").querySelector("i");"light"===e?(t.classList.add("light-theme"),s.className="fas fa-moon"):(t.classList.add("dark-theme"),s.className="fas fa-sun")}
function showNotification(e,t="success"){const s=document.createElement("div");s.className=`notification ${t}`,s.innerHTML=`<i class="fas fa-${"success"===t?"check":"exclamation-triangle"}"></i> ${e}`,document.body.appendChild(s),setTimeout(()=>s.classList.add("show"),100),setTimeout(()=>{s.classList.remove("show"),setTimeout(()=>document.body.removeChild(s),300)},3e3)}
async function hashSHA256(str){try{if(window.crypto&&window.crypto.subtle&&window.crypto.subtle.digest){const e=new TextEncoder,t=e.encode(str),s=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(s)).map(e=>e.toString(16).padStart(2,"0")).join("")}return await sha256Fallback(str)}catch(e){return console.warn("Erro com crypto.subtle, usando fallback:",e),await sha256Fallback(str)}}
async function sha256Fallback(e){return(t=>{function s(e,t){return e>>>t|e<<(32-t)}return(function(e){const t=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],a=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2541561241,2873612464,3634488961,3889429448,522102528,543335824,1243675347,1391986903,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3591028636,366663542,4096336452,275423344,430227734,502801925,554649393,692930398,844380142,1069521898,1193060517,1336432822,1363412102,1424214041,1467043836,1537066236,1702917032,1838607683,1894474488,1927285223,2040183124,2075939474,2227730452,2361852424,2428436474,2532448328,2643560851,2734883394,2859775116,2930588775,3094406323,3239853587,3365555215,3440745281,3579409817,3928222380,4059575411,4183445713,227286326,376950682,490457602,599949983,639534575,708283355,750438447,816363643,924610295,980764124,1034457628,1121059954,1217550359,1283641846,1320492341,1559885064,1619641002,1681944335,1743543508,1864861592,1967965492,2083979435,2121258284,2165275466,2299839446,2334685121,2466948901,2591338527,2728359403,2792965311,288219502,328488881,346983833,353326137,392236243,457056213,488433579,542453884,655462224,764118337,771923983,858638634,930103403,1044428339,1095259423,1176258252,1264640445];const o=new TextEncoder().encode(e),l=8*o.length,c=512*Math.ceil((l+1+64)/512),n=new Uint8Array(c/8);n.set(o),n[o.length]=128;const i=new DataView(n.buffer);i.setUint32(n.length-4,l,!1);for(let e=0;e<n.length;e+=64){const o=new Uint32Array(64);for(let t=0;t<16;t++)o[t]=i.getUint32(e+4*t,!1);for(let e=16;e<64;e++){const t=s(o[e-15],7)^s(o[e-15],18)^o[e-15]>>>3,a=s(o[e-2],17)^s(o[e-2],19)^o[e-2]>>>10;o[e]=o[e-16]+t+o[e-7]+a>>>0}let[r,d,u,p,m,h,g,f]=t;for(let e=0;e<64;e++){const t=s(m,6)^s(m,11)^s(m,25),l=m&h^~m&g,c=f+t+l+a[e]+o[e]>>>0,n=s(r,2)^s(r,13)^s(r,22),i=r&d^r&u^d&u,v=n+i>>>0;f=g,g=h,h=m,m=p+c>>>0,p=u,u=d,d=r,r=c+v>>>0}t[0]=t[0]+r>>>0,t[1]=t[1]+d>>>0,t[2]=t[2]+c>>>0,t[3]=t[3]+p>>>0,t[4]=t[4]+m>>>0,t[5]=t[5]+h>>>0,t[6]=t[6]+g>>>0,t[7]=t[7]+f>>>0}return t.map(e=>e.toString(16).padStart(8,"0")).join("")})(e)})(str)}
function calcularDiasRestantes(e){if(!e)return null;const t=(new Date(e)).getTime()-(new Date).getTime();return Math.ceil(t/864e5)}
function formatarDataParaInput(e){if(!e)return"";return(new Date(e)).toISOString().split("T")[0]}

// --- FUNÇÃO CENTRALIZADA PARA CHAMADAS DE API ---
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`/.netlify/functions/${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || `Erro na chamada da API para ${endpoint}`);
    }
    return result;
}

// --- FUNÇÕES DE INTERAÇÃO COM A API ---

async function carregarVersao() {
    // Você precisará de um endpoint de backend, por exemplo, 'getConfig'
    // que retorna a versão e outras configurações.
    // Por enquanto, vamos deixar um valor fixo.
    try {
        // const config = await apiCall('getConfig');
        // document.getElementById('currentVersion').textContent = 'v' + config.versao;
    } catch(e) {
        document.getElementById('currentVersion').textContent = 'Erro';
    }
}

async function carregarUsuarios() {
    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = '<tr><td colspan="7" class="loading"><i class="fas fa-spinner"></i><br>Carregando...</td></tr>';
    
    try {
        const searchValue = document.querySelector("#searchInput").value.trim();
        const data = await apiCall(`getUsers?search=${encodeURIComponent(searchValue)}`);
        
        document.getElementById('totalUsers').textContent = data.length;
        const activeUsers = data.filter(user => !user.banned).length;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('bannedUsers').textContent = data.length - activeUsers;
        
        tbody.innerHTML = "";
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-user-slash"></i><br>Nenhum usuário encontrado</td></tr>';
            return;
        }

        data.forEach(user => {
            const tr = document.createElement("tr");
            const bannedStatus = user.banned ? '<span class="status-badge banned"><i class="fas fa-ban"></i> Banido</span>' : '<span class="status-badge active"><i class="fas fa-check"></i> Ativo</span>';
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
            
            tr.innerHTML = `
                <td><strong>#${user.id}</strong></td>
                <td><input type="text" value="${user.username}" id="username-${user.id}" placeholder="Username"></td>
                <td><input type="password" placeholder="Digite nova senha" id="password-${user.id}"></td>
                <td><span class="hwid-display">${user.hwid || '<em>Não definido</em>'}</span></td>
                <td>
                    <div class="subscription-cell">
                        ${assinaturaStatus}
                        <input type="date" id="expiry-${user.id}" value="${formatarDataParaInput(user.date_expiry)}" class="date-input" title="Data de expiração">
                    </div>
                </td>
                <td>${bannedStatus}</td>
                <td>
                    <div class="actions-cell">
                        <button onclick="atualizarUsuario(${user.id})" class="btn btn-success" title="Salvar alterações"><i class="fas fa-save"></i></button>
                        <button onclick="toggleBanUsuario(${user.id}, ${user.banned})" class="btn ${user.banned ? 'btn-info' : 'btn-danger'}" title="${user.banned ? 'Desbanir' : 'Banir'}"><i class="fas fa-${user.banned ? 'user-check' : 'ban'}"></i></button>
                        <button onclick="deletarUsuario(${user.id})" class="btn btn-danger" title="Deletar usuário"><i class="fas fa-trash"></i></button>
                        <button onclick="resetHwid(${user.id})" class="btn btn-warning" title="Resetar HWID"><i class="fas fa-refresh"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        showNotification(error.message, 'error');
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>${error.message}</td></tr>`;
    }
}

async function atualizarUsuario(id) {
    try {
        const username = document.querySelector(`#username-${id}`).value.trim();
        const passwordInput = document.querySelector(`#password-${id}`).value;
        const expiryDate = document.querySelector(`#expiry-${id}`).value;
    
        if (!username) return showNotification("Username não pode estar vazio!", 'error');

        let updates = { username, date_expiry: expiryDate || null };
        if (passwordInput) {
            updates.password = await hashSHA256(passwordInput);
        }

        await apiCall('updateUser', 'POST', { id, updates });
        showNotification("Usuário atualizado com sucesso!");
        document.querySelector(`#password-${id}`).value = '';
        await carregarUsuarios();

    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function deletarUsuario(id) {
    if (!confirm("⚠️ Deseja realmente deletar este usuário?")) return;
    try {
        await apiCall('deleteUser', 'POST', { id });
        showNotification("Usuário deletado com sucesso!");
        await carregarUsuarios();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function toggleBanUsuario(id, currentBanStatus) {
    const action = currentBanStatus ? 'desbanir' : 'banir';
    if (!confirm(`Deseja realmente ${action} este usuário?`)) return;
    try {
        await apiCall('toggleBan', 'POST', { id, newBanStatus: !currentBanStatus });
        showNotification(`Usuário ${action === 'banir' ? 'banido' : 'desbanido'} com sucesso!`);
        await carregarUsuarios();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function resetHwid(id) {
    if (!confirm("Deseja resetar o HWID deste usuário?")) return;
    try {
        await apiCall('resetHwid', 'POST', { id });
        showNotification("HWID resetado com sucesso!");
        await carregarUsuarios();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function atualizarVersao() {
    const novaVersao = document.getElementById('versionInput').value.trim();
    if (!/^\d+\.\d+\.\d+$/.test(novaVersao)) {
        return showNotification("Formato de versão inválido! Use x.x.x", 'error');
    }
    if (!confirm(`Deseja atualizar a versão para ${novaVersao}?`)) return;
    try {
        await apiCall('updateVersion', 'POST', { novaVersao });
        showNotification(`Versão atualizada para ${novaVersao}!`);
        document.getElementById('versionInput').value = '';
        await carregarVersao();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function adicionarTempoGlobal() {
    const days = document.getElementById('daysInput').value.trim();
    if (!days || parseInt(days) <= 0) {
        return showNotification("Insira um número de dias válido.", 'error');
    }
    if (!confirm(`Deseja adicionar ${days} dias para todos os usuários ativos?`)) return;
    try {
        const result = await apiCall('addGlobalTime', 'POST', { days: parseInt(days) });
        showNotification(result.message);
        await carregarUsuarios();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function criarNovoUsuario() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const days = document.getElementById('newUserDays').value.trim();

    if (!username || !password) {
        return showNotification("Username e senha são obrigatórios!", 'warning');
    }
    try {
        const hashedPassword = await hashSHA256(password);
        let expiryDate = null;
        if (days && parseInt(days) > 0) {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(days));
            expiryDate = date.toISOString();
        }

        await apiCall('createUser', 'POST', { username, hashedPassword, expiryDate });
        showNotification(`Usuário "${username}" criado com sucesso!`);
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newUserDays').value = '';
        await carregarUsuarios();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// --- INICIALIZAÇÃO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', function() {
    if (checkAuthentication()) {
        loadTheme();
        carregarUsuarios();
        carregarVersao();

        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
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
});