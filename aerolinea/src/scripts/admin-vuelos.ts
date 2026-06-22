import { initAuth, apiFetch, showToast, isAdmin } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

const statusBadge: Record<string, string> = {
    'PROGRAMADO': 'badge-info',
    'BOARDING': 'badge-warn',
    'ACTIVO': 'badge-success',
    'CANCELADO': 'badge-danger',
    'REPROGRAMADO': 'badge-warn',
};

let aeropuertos: any[] = [];
let aviones: any[] = [];
let todosLosVuelos: any[] = [];

async function cargarAeropuertos() {
    aeropuertos = await apiFetch('/api/aeropuertos');
}
async function cargarAviones() {
    aviones = await apiFetch('/api/aviones');
}

function crearModal(html: string, onSubmit: (data: any) => Promise<void>) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal">
            <form id="modal-form">${html}</form>
        </div>`;
    document.getElementById('modal-container')!.appendChild(overlay);
    const form = overlay.querySelector('#modal-form') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
        btn.disabled = true; btn.textContent = 'Guardando...';
        const fd = new FormData(form);
        const data: any = {};
        fd.forEach((v, k) => { data[k] = v; });
        try {
            await onSubmit(data);
            overlay.remove();
            cargarVuelos();
        } catch (err: any) { showToast(err.message, 'error'); }
        finally { btn.disabled = false; btn.textContent = 'Guardar'; }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function validarDuracionVuelo(data: any): boolean {
    const salida = new Date(data.fechaSalida + 'T' + data.horaSalida);
    const llegada = new Date(data.fechaLlegada + 'T' + data.horaLlegada);
    const horas = (llegada.getTime() - salida.getTime()) / 3600000;
    if (horas <= 0) { showToast('La fecha/hora de llegada debe ser posterior a la salida', 'error'); return false; }
    if (data.escala === 'false' && horas > 18) { showToast('Un vuelo directo no puede durar más de 18 horas', 'error'); return false; }
    if (data.escala === 'true' && horas > 36) { showToast('La duración total del vuelo no puede exceder las 36 horas', 'error'); return false; }
    return true;
}

function mostrarModalNuevo() {
    const aeropuertoOpts = aeropuertos.map(a => `<option value="${a.id}">${a.nombre} (${a.ciudad})</option>`).join('');
    const avionOpts = aviones.map(a => `<option value="${a.id}">${a.identificador} - ${a.modelo}</option>`).join('');
    crearModal(`
        <h2>Nuevo vuelo</h2>
        <div class="form-grid">
            <div class="form-group">
                <label>Aeropuerto origen</label>
                <select name="aeropuertoOrigenId" class="form-control" required>${aeropuertoOpts}</select>
            </div>
            <div class="form-group">
                <label>Aeropuerto destino</label>
                <select name="aeropuertoDestinoId" class="form-control" required>${aeropuertoOpts}</select>
            </div>
            <div class="form-group">
                <label>Avion</label>
                <select name="avionId" class="form-control" required>${avionOpts}</select>
            </div>
            <div class="form-group">
                <label>Estado</label>
                <select name="estado" class="form-control" required>
                    <option value="PROGRAMADO">Programado</option>
                    <option value="BOARDING">Boarding</option>
                    <option value="ACTIVO">Activo</option>
                    <option value="CANCELADO">Cancelado</option>
                    <option value="REPROGRAMADO">Reprogramado</option>
                </select>
            </div>
            <div class="form-group">
                <label>Fecha salida</label>
                <input type="date" name="fechaSalida" class="form-control" required />
            </div>
            <div class="form-group">
                <label>Fecha llegada</label>
                <input type="date" name="fechaLlegada" class="form-control" required />
            </div>
            <div class="form-group">
                <label>Hora salida</label>
                <input type="time" name="horaSalida" class="form-control" required />
            </div>
            <div class="form-group">
                <label>Hora llegada</label>
                <input type="time" name="horaLlegada" class="form-control" required />
            </div>
            <div class="form-group">
                <label>Precio ($)</label>
                <input type="number" step="0.01" name="precioVuelo" class="form-control" required />
            </div>
            <div class="form-group">
                <label>Escala</label>
                <select name="escala" class="form-control" required>
                    <option value="false">No</option>
                    <option value="true">Si</option>
                </select>
            </div>
        </div>
        <button type="submit" class="btn-submit">Guardar vuelo</button>
    `, async (data) => {
        if (!validarDuracionVuelo(data)) return;
        const body = {
            aeropuertoOrigen: { id: parseInt(data.aeropuertoOrigenId) },
            aeropuertoDestino: { id: parseInt(data.aeropuertoDestinoId) },
            avion: { id: parseInt(data.avionId) },
            fechaSalida: data.fechaSalida,
            fechaLlegada: data.fechaLlegada,
            horaSalida: data.horaSalida + ':00',
            horaLlegada: data.horaLlegada + ':00',
            estado: data.estado,
            precioVuelo: parseFloat(data.precioVuelo),
            escala: data.escala === 'true',
        };
        await apiFetch('/api/vuelos', { method: 'POST', body: JSON.stringify(body) });
        showToast('Vuelo creado con éxito', 'success');
    });
}

function mostrarModalEditar(v: any) {
    const aeropuertoOpts = aeropuertos.map(a =>
        `<option value="${a.id}" ${a.id === v.aeropuertoOrigen?.id ? 'selected' : ''}>${a.nombre} (${a.ciudad})</option>`).join('');
    const aeropuertoDestOpts = aeropuertos.map(a =>
        `<option value="${a.id}" ${a.id === v.aeropuertoDestino?.id ? 'selected' : ''}>${a.nombre} (${a.ciudad})</option>`).join('');
    const avionOpts = aviones.map(a =>
        `<option value="${a.id}" ${a.id === v.avion?.id ? 'selected' : ''}>${a.identificador} - ${a.modelo}</option>`).join('');
    crearModal(`
        <h2>Editar vuelo #${v.id}</h2>
        <div class="form-grid">
            <div class="form-group">
                <label>Aeropuerto origen</label>
                <select name="aeropuertoOrigenId" class="form-control" required>${aeropuertoOpts}</select>
            </div>
            <div class="form-group">
                <label>Aeropuerto destino</label>
                <select name="aeropuertoDestinoId" class="form-control" required>${aeropuertoDestOpts}</select>
            </div>
            <div class="form-group">
                <label>Avion</label>
                <select name="avionId" class="form-control" required>${avionOpts}</select>
            </div>
            <div class="form-group">
                <label>Estado</label>
                <select name="estado" class="form-control" required>
                    ${['PROGRAMADO', 'BOARDING', 'ACTIVO', 'CANCELADO', 'REPROGRAMADO'].map(e =>
                        `<option value="${e}" ${e === v.estado ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Fecha salida</label>
                <input type="date" name="fechaSalida" class="form-control" value="${v.fechaSalida || ''}" required />
            </div>
            <div class="form-group">
                <label>Fecha llegada</label>
                <input type="date" name="fechaLlegada" class="form-control" value="${v.fechaLlegada || ''}" required />
            </div>
            <div class="form-group">
                <label>Hora salida</label>
                <input type="time" name="horaSalida" class="form-control" value="${v.horaSalida?.substring(0, 5) || ''}" required />
            </div>
            <div class="form-group">
                <label>Hora llegada</label>
                <input type="time" name="horaLlegada" class="form-control" value="${v.horaLlegada?.substring(0, 5) || ''}" required />
            </div>
            <div class="form-group">
                <label>Precio ($)</label>
                <input type="number" step="0.01" name="precioVuelo" class="form-control" value="${v.precioVuelo || ''}" required />
            </div>
            <div class="form-group">
                <label>Escala</label>
                <select name="escala" class="form-control" required>
                    <option value="false" ${v.escala === false ? 'selected' : ''}>No</option>
                    <option value="true" ${v.escala === true ? 'selected' : ''}>Si</option>
                </select>
            </div>
        </div>
        <button type="submit" class="btn-submit">Guardar cambios</button>
    `, async (data) => {
        if (!validarDuracionVuelo(data)) return;
        const body = {
            aeropuertoOrigenId: parseInt(data.aeropuertoOrigenId),
            aeropuertoDestinoId: parseInt(data.aeropuertoDestinoId),
            avionId: parseInt(data.avionId),
            fechaSalida: data.fechaSalida,
            fechaLlegada: data.fechaLlegada,
            horaSalida: data.horaSalida + ':00',
            horaLlegada: data.horaLlegada + ':00',
            estado: data.estado,
            precioVuelo: parseFloat(data.precioVuelo),
            escala: data.escala === 'true',
        };
        await apiFetch('/api/vuelos/' + v.id, { method: 'PUT', body: JSON.stringify(body) });
        showToast('Vuelo actualizado', 'success');
    });
}

async function cargarVuelos() {
    const tbody = document.getElementById('tabla-vuelos')!;
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-msg"><div class="empty-icon">⏳</div>Cargando vuelos...</div></td></tr>';
    try {
        const vuelos = await apiFetch('/api/vuelos');
        todosLosVuelos = vuelos;
        renderTablaVuelos(vuelos);
    } catch (err: any) { tbody.innerHTML = '<tr><td colspan="9"><div class="empty-msg" style="color:var(--danger)">' + err.message + '</div></td></tr>'; }
}

function renderTablaVuelos(vuelos: any[]) {
    const tbody = document.getElementById('tabla-vuelos')!;
    if (!vuelos.length) {
        tbody.innerHTML = '<tr><td colspan="9"><div class="empty-msg"><div class="empty-icon">✈</div>No hay vuelos registrados todavía.</div></td></tr>';
        return;
    }
    tbody.innerHTML = vuelos.map((v: any) => `
        <tr>
            <td>${v.id}</td>
            <td><strong>${v.aeropuertoOrigen?.nombre || '—'}</strong></td>
            <td><strong>${v.aeropuertoDestino?.nombre || '—'}</strong></td>
            <td>${v.fechaSalida || '—'}</td>
            <td>${v.fechaLlegada || '—'}</td>
            <td><strong>$${v.precioVuelo?.toFixed(2) || '—'}</strong></td>
            <td><span class="badge ${statusBadge[v.estado] || 'badge-info'}">${v.estado || '—'}</span></td>
            <td>${v.avion?.modelo || '—'}</td>
            <td><div class="table-actions">
                <button class="btn-icon btn-icon-edit" data-editar="${v.id}">✎ Editar</button>
                <button class="btn-icon btn-icon-delete" data-eliminar="${v.id}">✕</button>
            </div></td>
        </tr>
    `).join('');

    tbody.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', async () => {
        const v = todosLosVuelos.find((x: any) => x.id === parseInt((btn as HTMLElement).dataset.editar!));
        if (v) { await cargarAeropuertos(); await cargarAviones(); mostrarModalEditar(v); }
    }));
    tbody.querySelectorAll('[data-eliminar]').forEach(btn => btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.eliminar!;
        if (!confirm('¿Eliminar vuelo #' + id + '?')) return;
        await apiFetch('/api/vuelos/' + id, { method: 'DELETE' });
        showToast('Vuelo eliminado', 'success');
        cargarVuelos();
    }));
}

(window as any).filtrarVuelos = function () {
    const q = ((document.getElementById('search-input') as HTMLInputElement)?.value || '').toLowerCase();
    const estado = (document.getElementById('filter-estado') as HTMLSelectElement)?.value || '';
    let filtrados = todosLosVuelos;
    if (q) {
        filtrados = filtrados.filter((v: any) =>
            String(v.id).includes(q) ||
            (v.aeropuertoOrigen?.nombre || '').toLowerCase().includes(q) ||
            (v.aeropuertoDestino?.nombre || '').toLowerCase().includes(q) ||
            (v.aeropuertoOrigen?.ciudad || '').toLowerCase().includes(q) ||
            (v.aeropuertoDestino?.ciudad || '').toLowerCase().includes(q)
        );
    }
    if (estado) filtrados = filtrados.filter((v: any) => v.estado === estado);
    renderTablaVuelos(filtrados);
};

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  if (!isAdmin()) {
    showToast('Acceso denegado', 'error');
    setTimeout(() => window.location.href = 'index.html', 1000);
    return;
  }

  document.getElementById('btn-nuevo-vuelo')!.addEventListener('click', async () => {
    await cargarAeropuertos();
    await cargarAviones();
    mostrarModalNuevo();
  });

  cargarAeropuertos();
  cargarAviones();
  cargarVuelos();
});
