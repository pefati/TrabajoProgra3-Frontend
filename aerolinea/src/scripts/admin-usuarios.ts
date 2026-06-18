import { initAuth, apiFetch, showToast, isAdmin } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

const roleBadge: Record<string, string> = {
    'ROLE_ADMIN': 'badge-admin',
    'ROLE_EMPLEADO': 'badge-empleado',
    'ROLE_USUARIO': 'badge-user',
    'ROLE_INCOMPLETO': 'badge-incompleto',
};

const roleLabels: Record<string, string> = {
    'ROLE_ADMIN': 'Admin',
    'ROLE_EMPLEADO': 'Empleado',
    'ROLE_USUARIO': 'Usuario',
    'ROLE_INCOMPLETO': 'Incompleto',
};

let todosLosUsuarios: any[] = [];

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  if (!isAdmin()) {
    showToast('Acceso denegado', 'error');
    setTimeout(() => window.location.href = 'index.html', 1000);
    return;
  }
  await cargarUsuarios();
  document.getElementById('search-input')?.focus();
});

async function cargarUsuarios() {
    const tbody = document.getElementById('tabla-usuarios')!;
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-msg"><div class="empty-icon">⏳</div>Cargando usuarios...</div></td></tr>';
    try {
        const usuarios = await apiFetch('/api/auth/usuarios');
        todosLosUsuarios = usuarios;
        renderTablaUsuarios();
    } catch (err: any) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-msg" style="color:var(--danger)">${err.message}</div></td></tr>`;
    }
}

function renderTablaUsuarios() {
    const tbody = document.getElementById('tabla-usuarios')!;
    const filtro = (document.getElementById('search-input') as HTMLInputElement)?.value?.toLowerCase() || '';
    const rolFiltro = (document.getElementById('filter-rol') as HTMLSelectElement)?.value || '';

    let lista = todosLosUsuarios;

    if (filtro) {
        lista = lista.filter((u: any) =>
            (u.nombre || '').toLowerCase().includes(filtro) ||
            (u.apellido || '').toLowerCase().includes(filtro) ||
            (u.email || '').toLowerCase().includes(filtro) ||
            (u.telefono || '').toLowerCase().includes(filtro)
        );
    }

    if (rolFiltro) {
        lista = lista.filter((u: any) => u.role === rolFiltro);
    }

    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-msg"><div class="empty-icon">👥</div>No se encontraron usuarios.</div></td></tr>';
        return;
    }

    tbody.innerHTML = lista.map((u: any) => {
        const currentRole = u.role || 'ROLE_USUARIO';
        const isIncompleto = currentRole === 'ROLE_INCOMPLETO';
        return `<tr>
            <td>${u.id}</td>
            <td><strong>${u.nombre || '—'} ${u.apellido || ''}</strong></td>
            <td>${u.email}</td>
            <td>${u.telefono || '—'}</td>
            <td><span class="badge ${roleBadge[currentRole] || 'badge-user'}">${roleLabels[currentRole] || currentRole}</span></td>
            <td>
                <div class="table-actions">
                    ${currentRole !== 'ROLE_ADMIN' && !isIncompleto ? `<button class="btn-icon btn-icon-role btn-icon-role-admin" data-role="admin" data-uid="${u.id}">Admin</button>` : ''}
                    ${currentRole !== 'ROLE_EMPLEADO' && !isIncompleto ? `<button class="btn-icon btn-icon-role btn-icon-role-empleado" data-role="empleado" data-uid="${u.id}">Empleado</button>` : ''}
                    ${currentRole !== 'ROLE_USUARIO' && !isIncompleto ? `<button class="btn-icon btn-icon-role btn-icon-role-usuario" data-role="usuario" data-uid="${u.id}">Usuario</button>` : ''}
                    ${isIncompleto ? `<span style="font-size:12px;color:var(--gray-500)">Pendiente completar perfil</span>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-role]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const uid = (btn as HTMLElement).dataset.uid!;
            const role = (btn as HTMLElement).dataset.role!;
            const label = role === 'admin' ? 'Administrador' : role === 'empleado' ? 'Empleado' : 'Usuario';
            if (!confirm(`¿Cambiar el rol del usuario #${uid} a «${label}»?`)) return;

            let endpoint = '';
            if (role === 'admin') endpoint = `/api/admin/users/haceradmin/${uid}`;
            else if (role === 'empleado') endpoint = `/api/admin/users/emplear/${uid}`;
            else endpoint = `/api/admin/users/hacerusuario/${uid}`;

            try {
                await apiFetch(endpoint, { method: 'PATCH' });
                showToast(`Rol cambiado a ${label}`, 'success');
                cargarUsuarios();
            } catch (err: any) {
                showToast(err.message, 'error');
            }
        });
    });
}

(window as any).filtrarUsuarios = function () {
    renderTablaUsuarios();
};
