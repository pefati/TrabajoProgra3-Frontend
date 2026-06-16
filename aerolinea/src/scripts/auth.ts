
let _email: string = '';
let _perfilCompleto: boolean = false;
let _role: string = '';
let _nombre: string = '';

let _authPromise: Promise<void> | null = null;

export function setSession(_token: string, email: string, _userId: number, perfilCompleto: boolean, role: string) {
  _email = email;
  _perfilCompleto = perfilCompleto;
  _role = role;
}

export function clearSession() {
  _email = '';
  _perfilCompleto = false;
  _role = '';
  _nombre = '';
  _authPromise = null;
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
}

export function isLoggedIn(): boolean {
  return !!_email;
}

export function isPerfilCompleto(): boolean {
  return _perfilCompleto;
}

export function getRole(): string {
  return _role;
}

export function isAdmin(): boolean {
  return _role === 'ROLE_ADMIN';
}

export function initAuth(): Promise<void> {
  if (!_authPromise) {
    _authPromise = fetchAuth();
  }
  return _authPromise;
}

async function fetchAuth(): Promise<void> {
  try {
    const data = await apiFetch('/api/auth/perfil');
    _email = data.email || '';
    _perfilCompleto = data.isVerified === true;
    _role = data.role || '';
    _nombre = [data.nombre, data.apellido].filter(Boolean).join(' ') || _email.split('@')[0];
    applyUserUI();
  } catch {
    applyGuestUI();
  }
}

function applyGuestUI() {
  _email = '';
  _perfilCompleto = false;
  _role = '';
  _nombre = '';
  const guest = document.getElementById('guest-actions');
  const user = document.getElementById('user-actions');
  if (guest) guest.style.display = 'flex';
  if (user) user.style.display = 'none';
}

function applyUserUI() {
  const guestActions = document.getElementById('guest-actions');
  const userActions = document.getElementById('user-actions');
  if (guestActions) guestActions.style.display = 'none';
  if (userActions) userActions.style.display = 'flex';

  const email = _email;
  const nombre = _nombre || email.split('@')[0];
  const role = _role;

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

  if (ddAdmin && role === 'ROLE_ADMIN') ddAdmin.style.display = 'block';

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
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, { ...options, headers, credentials: 'include' });

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

export function showToast(msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
  const t = document.createElement('div');
  t.className = 'toast';
  if (type === 'warn') t.style.background = '#854F0B';
  if (type === 'error') t.style.background = '#c0392b';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
