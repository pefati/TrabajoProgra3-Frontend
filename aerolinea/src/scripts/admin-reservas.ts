import { initAuth, apiFetch, showToast, isAdmin, getRole } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

let todasLasReservas: any[] = [];

const estadoStyle: Record<string, { bg: string; color: string; label: string }> = {
    'CONFIRMADO': { bg: '#EAF3DE', color: '#3B6D11', label: 'Confirmado' },
    'ACTIVO': { bg: '#D6EAF8', color: '#1A5276', label: 'Check-in ✓' },
    'PROCESANDO': { bg: '#FAEEDA', color: '#854F0B', label: 'Procesando' },
    'CANCELADA': { bg: '#fdf0ee', color: '#c0392b', label: 'Cancelada' },
};

async function cargarReservas() {
    const tbody = document.getElementById('tabla-reservas')!;
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-msg">Cargando reservas...</div></td></tr>';
    try {
        const data: any[] = await apiFetch('/api/reservas');
        todasLasReservas = data;
        renderTabla(data);
    } catch (err: any) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-msg" style="color:var(--danger)">${err.message}</div></td></tr>`;
    }
}

function renderTabla(lista: any[]) {
    const tbody = document.getElementById('tabla-reservas')!;
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-msg">No se encontraron reservas</div></td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(r => {
        const st = estadoStyle[r.estadoReserva] || { bg: '#f0f0f0', color: '#555', label: r.estadoReserva };
        const fecha = r.fechaReserva ? new Date(r.fechaReserva).toLocaleDateString('es-AR') : '—';
        const nombre = r.persona ? `${r.persona.nombre || ''} ${r.persona.apellido || ''}`.trim() : '—';
        const email = r.persona?.email || '—';
        const puedeCheckin = r.estadoReserva === 'CONFIRMADO' || r.estadoReserva === 'PROCESANDO';
        const puedeCancelar = r.estadoReserva !== 'CANCELADA';
        return `
        <tr>
            <td>${r.id}</td>
            <td><strong>${nombre}</strong></td>
            <td style="font-size:12px">${email}</td>
            <td>${r.cantidadPasajes}</td>
            <td><strong>$${r.valor?.toLocaleString('es-AR') || '—'}</strong></td>
            <td><span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;background:${st.bg};color:${st.color}">${st.label}</span></td>
            <td style="font-size:12px">${fecha}</td>
            <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                    ${puedeCheckin ? `<button class="btn-icon btn-icon-edit" data-checkin="${r.id}">✅ Check-in</button>` : ''}
                    ${puedeCancelar ? `<button class="btn-icon btn-icon-delete" data-cancelar="${r.id}">✕ Cancelar</button>` : ''}
                    ${!puedeCheckin && !puedeCancelar ? '<span style="font-size:11px;color:#999">—</span>' : ''}
                </div>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-checkin]').forEach(btn => btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.checkin!;
        if (!confirm(`¿Confirmar check-in para la reserva #${id}?`)) return;
        try {
            await apiFetch(`/api/reservas/${id}/checkin`, { method: 'PATCH' });
            showToast('Check-in realizado', 'success');
            cargarReservas();
        } catch (err: any) { showToast(err.message, 'error'); }
    }));

    tbody.querySelectorAll('[data-cancelar]').forEach(btn => btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.cancelar!;
        if (!confirm(`¿Cancelar la reserva #${id}?`)) return;
        try {
            await apiFetch(`/api/reservas/cancelar/${id}`, { method: 'PATCH' });
            showToast('Reserva cancelada', 'success');
            cargarReservas();
        } catch (err: any) { showToast(err.message, 'error'); }
    }));
}

(window as any).filtrarReservas = function () {
    const q = ((document.getElementById('search-input') as HTMLInputElement)?.value || '').toLowerCase();
    const estado = (document.getElementById('filter-estado') as HTMLSelectElement)?.value || '';
    let filtradas = todasLasReservas;
    if (q) {
        filtradas = filtradas.filter(r =>
            String(r.id).includes(q) ||
            (r.persona?.nombre || '').toLowerCase().includes(q) ||
            (r.persona?.apellido || '').toLowerCase().includes(q) ||
            (r.persona?.email || '').toLowerCase().includes(q)
        );
    }
    if (estado) filtradas = filtradas.filter(r => r.estadoReserva === estado);
    renderTabla(filtradas);
};

document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();
    const role = getRole();
    if (role !== 'ROLE_ADMIN' && role !== 'ROLE_EMPLEADO') {
        showToast('Acceso denegado', 'error');
        setTimeout(() => window.location.href = 'index.html', 1000);
        return;
    }
    cargarReservas();
});
