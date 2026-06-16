
export function getToken(): string | null {
    return localStorage.getItem('token');
}

export function setSession(token: string, email: string, userId: number, perfilCompleto: boolean, role: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_id', String(userId));
    localStorage.setItem('perfil_completo', String(perfilCompleto));
    localStorage.setItem('user_role', role);
}

export function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('perfil_completo');
    localStorage.removeItem('user_role');
    localStorage.removeItem('persona_id');
    localStorage.removeItem('user_nombre');
}

export function isLoggedIn(): boolean {
    return !!getToken();
}

export function isPerfilCompleto(): boolean {
    return localStorage.getItem('perfil_completo') === 'true';
}

export function getRole(): string {
    return localStorage.getItem('user_role') || '';
}

export function isAdmin(): boolean {
    return getRole() === 'ROLE_ADMIN';
}

export function requireAuth(redirectTo = 'login.html') {
    if (!isLoggedIn()) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

export function requirePerfilCompleto() {
    if (!isLoggedIn()) { window.location.href = 'login.html'; return false; }
    if (!isPerfilCompleto()) {
        showToast('Completá tu perfil antes de continuar', 'warn');
        setTimeout(() => window.location.href = 'perfil.html', 1500);
        return false;
    }
    return true;
}


export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(path, { ...options, headers });

    if (res.status === 401) {
        clearSession();
        window.location.href = 'login.html';
        throw new Error('No autorizado');
    }
    if (!res.ok) {
        let msg = 'Error ' + res.status;
        try { const e = await res.json(); msg = e.message || msg; } catch { }
        throw new Error(msg);
    }
    if (res.status === 204) return null;

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return res.json();

    const text = await res.text();
    return text || null;
}


export function showToast(msg: string, type: 'info' | 'success' |'warn' | 'error' = 'info') {
    const t = document.createElement('div');
    t.className = 'toast';
    if (type === 'warn') t.style.background = '#854F0B';
    if (type === 'error') t.style.background = '#c0392b';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}


export function initAuth() {
    const token = getToken();
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');

    if (!token) {
        if (guestActions) guestActions.style.display = 'flex';
        if (userActions) userActions.style.display = 'none';
        return;
    }

    if (guestActions) guestActions.style.display = 'none';
    if (userActions) userActions.style.display = 'flex';

    const email = localStorage.getItem('user_email') || '';
    const nombre = localStorage.getItem('user_nombre') || email.split('@')[0];
    const role = getRole();

    const avatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const ddName = document.getElementById('dd-name');
    const ddEmail = document.getElementById('dd-email');
    const ddRole = document.getElementById('dd-role-badge');
    const ddAdmin = document.getElementById('dd-admin-section');

    if (avatar) avatar.textContent = (nombre[0] || '?').toUpperCase();
    if (userName) userName.textContent = nombre;
    if (ddName) ddName.textContent = nombre;
    if (ddEmail) ddEmail.textContent = email;

    const roleLabels: Record<string, string> = {
        'ROLE_ADMIN': 'Administrador',
        'ROLE_EMPLEADO': 'Empleado',
        'ROLE_USUARIO': 'Usuario',
        'ROLE_INCOMPLETO': '⚠ Perfil incompleto',
    };
    if (ddRole) {
        ddRole.textContent = roleLabels[role] || role;
        if (role === 'ROLE_INCOMPLETO') ddRole.style.background = '#FAEEDA';
        if (role === 'ROLE_ADMIN') ddRole.style.background = '#fde8f0';
    }

    if (ddAdmin && (role === 'ROLE_ADMIN')) ddAdmin.style.display = 'block';

    const trigger = document.getElementById('user-menu-trigger');
    const dropdown = document.getElementById('user-dropdown');
    if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', () => { dropdown.style.display = 'none'; });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
            window.location.href = 'index.html';
        });
    }

    if (token) {
        apiFetch('/api/auth/perfil').then((data: any) => {
            const fullName = [data.nombre, data.apellido].filter(Boolean).join(' ') || email.split('@')[0];
            localStorage.setItem('user_nombre', fullName);
            if (data.personaId) localStorage.setItem('persona_id', String(data.personaId));
            if (avatar) avatar.textContent = (fullName[0] || '?').toUpperCase();
            if (userName) userName.textContent = fullName;
            if (ddName) ddName.textContent = fullName;
        }).catch(() => { });
    }
}
