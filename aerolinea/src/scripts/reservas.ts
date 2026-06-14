import { initAuth, apiFetch, showToast, requireAuth } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

if (!requireAuth()) { throw new Error('not authenticated'); }

let todasLasReservas: any[] = [];
let reservaSeleccionada: number | null = null;

async function cargarReservas() {
    const container = document.getElementById('booking-list-activas');
    if (container) container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--gray-500)">Cargando reservas...</div>';

    try {
        const data: any[] = await apiFetch('/api/reservas/mis-reservas');
        todasLasReservas = data;

        const activas = data.filter(r => r.estadoReserva === 'CONFIRMADO' || r.estadoReserva === 'PROCESANDO' || r.estadoReserva === 'ACTIVO');
        const statEl = document.getElementById('stat-activas');
        if (statEl) statEl.textContent = activas.length.toString();

        const totalEl = document.getElementById('stat-total');
        if (totalEl) totalEl.textContent = data.length.toString();

        renderActivas(data);
    } catch (err: any) {
        const container = document.getElementById('booking-list-activas');
        if (container) container.innerHTML = `<div style="padding:20px;color:#c0392b;background:#fdf0ee;border-radius:8px">${err.message}</div>`;
    }
}

function estadoStyle(estado: string) {
    const map: Record<string, {bg: string; color: string; label: string; cls: string}> = {
        'CONFIRMADO': { bg: '#EAF3DE', color: '#3B6D11', label: '● Confirmado', cls: 'status-active' },
        'ACTIVO':     { bg: '#EAF3DE', color: '#3B6D11', label: '● Activo',     cls: 'status-active' },
        'PROCESANDO': { bg: '#FAEEDA', color: '#854F0B', label: '◌ Procesando', cls: 'status-pending' },
        'CANCELADA':  { bg: '#fdf0ee', color: '#c0392b', label: '✗ Cancelada',  cls: 'status-past' },
    };
    return map[estado] || { bg: '#f0f0f0', color: '#555', label: estado, cls: '' };
}

function renderActivas(lista: any[]) {
    const activas = lista.filter(r => r.estadoReserva !== 'CANCELADA');
    const container = document.getElementById('booking-list-activas');
    if (!container) return;

    if (activas.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--gray-500)">
            <div style="font-size:48px;margin-bottom:16px">✈</div>
            <p style="font-size:18px;font-weight:600;margin-bottom:8px">No tenés reservas activas</p>
            <p style="margin-bottom:20px">¡Empezá a planificar tu próximo viaje!</p>
            <a href="vuelos.html" class="btn btn-primary">Buscar vuelos</a>
        </div>`;
        return;
    }

    container.innerHTML = activas.map(r => {
        const st = estadoStyle(r.estadoReserva);
        const fecha = new Date(r.fechaReserva);
        return `
        <div class="booking-card" onclick="verDetalle(${r.id})">
            <div class="booking-status ${st.cls}"></div>
            <div>
                <div class="booking-route">Reserva #${r.id}</div>
                <div class="booking-details">${r.cantidadPasajes} pasaje(s) · $${r.valor?.toLocaleString('es-AR')}</div>
                <div style="display:inline-block;margin-top:6px;font-size:11px;padding:3px 10px;border-radius:4px;background:${st.bg};color:${st.color};font-weight:600">${st.label}</div>
            </div>
            <div class="booking-date">
                <div class="booking-date-day">${fecha.getDate()}</div>
                <div class="booking-date-month">${fecha.toLocaleString('es-AR', {month:'short', year:'numeric'})}</div>
            </div>
            <div class="booking-actions">
                <button class="btn btn-primary" style="padding:8px 16px;font-size:12px" onclick="event.stopPropagation();showToastGlobal('Check-in próximamente disponible')">Check-in</button>
                <button class="btn" style="padding:8px 16px;font-size:12px;border:1px solid var(--navy)" onclick="event.stopPropagation();verDetalle(${r.id})">Ver</button>
            </div>
        </div>`;
    }).join('');
}

function renderHistorial(lista: any[]) {
    const canceladas = lista.filter(r => r.estadoReserva === 'CANCELADA');
    const container = document.getElementById('booking-list-historial');
    if (!container) return;

    if (canceladas.length === 0) {
        container.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:40px">Sin historial de reservas canceladas.</p>';
        return;
    }

    container.innerHTML = canceladas.map(r => {
        const fecha = new Date(r.fechaReserva);
        return `
        <div class="booking-card">
            <div class="booking-status status-past"></div>
            <div>
                <div class="booking-route">Reserva #${r.id}</div>
                <div class="booking-details">${r.cantidadPasajes} pasaje(s) · $${r.valor?.toLocaleString('es-AR')}</div>
            </div>
            <div class="booking-date">
                <div class="booking-date-day">${fecha.getDate()}</div>
                <div class="booking-date-month">${fecha.toLocaleString('es-AR', {month:'short', year:'numeric'})}</div>
            </div>
        </div>`;
    }).join('');
}

(window as any).verDetalle = function (id: number) {
    const r = todasLasReservas.find(x => x.id === id);
    if (!r) return;
    reservaSeleccionada = id;
    const st = estadoStyle(r.estadoReserva);
    document.getElementById('modal-ruta')!.textContent = `Reserva #${r.id}`;
    document.getElementById('modal-codigo')!.textContent = `#${r.id}`;
    document.getElementById('modal-detalles')!.innerHTML = `
        <div><div style="font-size:11px;color:var(--gray-500);margin-bottom:3px">Pasajero</div><div style="font-weight:600">${r.persona?.nombre || ''} ${r.persona?.apellido || ''}</div></div>
        <div><div style="font-size:11px;color:var(--gray-500);margin-bottom:3px">Fecha reserva</div><div style="font-weight:600">${new Date(r.fechaReserva).toLocaleDateString('es-AR')}</div></div>
        <div><div style="font-size:11px;color:var(--gray-500);margin-bottom:3px">Pasajes</div><div style="font-weight:600">${r.cantidadPasajes}</div></div>
        <div><div style="font-size:11px;color:var(--gray-500);margin-bottom:3px">Total</div><div style="font-weight:600;color:var(--navy)">$${r.valor?.toLocaleString('es-AR')}</div></div>
        <div style="grid-column:span 2"><div style="font-size:11px;color:var(--gray-500);margin-bottom:3px">Estado</div>
            <div style="display:inline-block;font-size:12px;padding:3px 10px;border-radius:4px;background:${st.bg};color:${st.color};font-weight:600">${st.label}</div>
        </div>`;
    document.getElementById('detail-modal')!.style.display = 'flex';

    const cancelBtn = document.getElementById('btn-cancelar-modal') as HTMLButtonElement;
    if (cancelBtn) cancelBtn.style.display = r.estadoReserva === 'CANCELADA' ? 'none' : '';
};

(window as any).closeModal = function () {
    document.getElementById('detail-modal')!.style.display = 'none';
};

(window as any).cancelarReserva = async function () {
    if (!reservaSeleccionada) return;
    if (!confirm('¿Confirmar la cancelación de esta reserva?')) return;

    try {
        await apiFetch(`/api/reservas/cancelar/${reservaSeleccionada}`, { method: 'PATCH' });
        showToast('Reserva cancelada. El reembolso se procesará en 3-5 días hábiles.');
        (window as any).closeModal();
        await cargarReservas();
    } catch (err: any) {
        showToast(err.message || 'Error al cancelar', 'error');
    }
};

(window as any).showTab = function (tab: string, el: HTMLElement) {
    ['activas', 'pasadas', 'checkin'].forEach(t => {
        const tabEl = document.getElementById('tab-' + t);
        if (tabEl) tabEl.style.display = t === tab ? 'block' : 'none';
    });
    document.querySelectorAll('.booking-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    if (tab === 'pasadas') renderHistorial(todasLasReservas);
};

(window as any).filtrarReservas = function () {
    const input = document.getElementById('search-booking') as HTMLInputElement;
    const q = input.value.toLowerCase();
    const filtradas = q
        ? todasLasReservas.filter(r => String(r.id).includes(q) || r.estadoReserva?.toLowerCase().includes(q))
        : todasLasReservas;
    renderActivas(filtradas);
};

(window as any).hacerCheckin = function () {
    const input = document.getElementById('checkin-code') as HTMLInputElement;
    const id = parseInt(input.value);
    const r = todasLasReservas.find(x => x.id === id);
    if (!r) { showToast('Código no encontrado. Verificá los datos.', 'warn'); return; }
    if (r.estadoReserva === 'CANCELADA') { showToast('Esta reserva está cancelada.', 'error'); return; }
    showToast('✓ Check-in exitoso para reserva #' + r.id);
};

(window as any).showToastGlobal = (msg: string) => showToast(msg);

cargarReservas();
