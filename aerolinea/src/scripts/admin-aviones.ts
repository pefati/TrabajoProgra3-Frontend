import { initAuth, apiFetch, showToast, isAdmin } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

const statusBadge: Record<string, string> = {
    'DISPONIBLE': 'badge-success',
    'MANTENIMIENTO': 'badge-warn',
    'ACTIVO': 'badge-info',
    'BAJA': 'badge-danger',
};

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
            cargarAviones();
        } catch (err: any) { showToast(err.message, 'error'); }
        finally { btn.disabled = false; btn.textContent = 'Guardar'; }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function mostrarModalNuevo() {
    crearModal(`
        <h2>Nuevo avión</h2>
        <div class="form-group">
            <label>Identificador</label>
            <input type="text" name="identificador" class="form-control" placeholder="LV-ABC" required />
        </div>
        <div class="form-group">
            <label>Modelo</label>
            <input type="text" name="modelo" class="form-control" placeholder="Boeing 737-800" required />
        </div>
        <div class="form-group">
            <label>Capacidad de pasajeros</label>
            <input type="number" name="capacidadPasajeros" class="form-control" placeholder="180" required />
        </div>
        <div class="form-group">
            <label>Capacidad de bodega (kg)</label>
            <input type="number" step="0.1" name="capacidadBodega" class="form-control" placeholder="2500" required />
        </div>
        <div class="form-group">
            <label>Estado</label>
            <select name="estado" class="form-control" required>
                <option value="DISPONIBLE">Disponible</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="ACTIVO">Activo</option>
                <option value="BAJA">Baja</option>
            </select>
        </div>
        <button type="submit" class="btn-submit">Guardar avión</button>
    `, async (data) => {
        await apiFetch('/api/aviones', { method: 'POST', body: JSON.stringify(data) });
        showToast('Avión creado con éxito', 'success');
    });
}

function mostrarModalEditar(a: any) {
    crearModal(`
        <h2>Editar avión #${a.id}</h2>
        <div class="form-group">
            <label>Identificador</label>
            <input type="text" name="identificador" class="form-control" value="${a.identificador || ''}" required />
        </div>
        <div class="form-group">
            <label>Modelo</label>
            <input type="text" name="modelo" class="form-control" value="${a.modelo || ''}" required />
        </div>
        <div class="form-group">
            <label>Capacidad de pasajeros</label>
            <input type="number" name="capacidadPasajeros" class="form-control" value="${a.capacidadPasajeros || ''}" required />
        </div>
        <div class="form-group">
            <label>Capacidad de bodega (kg)</label>
            <input type="number" step="0.1" name="capacidadBodega" class="form-control" value="${a.capacidadBodega || ''}" required />
        </div>
        <div class="form-group">
            <label>Estado</label>
            <select name="estado" class="form-control" required>
                ${['DISPONIBLE', 'MANTENIMIENTO', 'ACTIVO', 'BAJA'].map(e =>
                    `<option value="${e}" ${e === a.estado ? 'selected' : ''}>${e}</option>`).join('')}
            </select>
        </div>
        <button type="submit" class="btn-submit">Guardar cambios</button>
    `, async (data) => {
        await apiFetch('/api/aviones/' + a.id, { method: 'PUT', body: JSON.stringify(data) });
        showToast('Avión actualizado', 'success');
    });
}

async function cargarAviones() {
    const tbody = document.getElementById('tabla-aviones')!;
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-msg"><div class="empty-icon">⏳</div>Cargando aviones...</div></td></tr>';
    try {
        const aviones = await apiFetch('/api/aviones');
        if (!aviones.length) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty-msg"><div class="empty-icon">🛩</div>No hay aviones registrados todavía.</div></td></tr>';
            return;
        }
        tbody.innerHTML = aviones.map((a: any) => `
            <tr>
                <td>${a.id}</td>
                <td><strong>${a.identificador}</strong></td>
                <td>${a.modelo}</td>
                <td>${a.capacidadPasajeros}</td>
                <td>${a.capacidadBodega} kg</td>
                <td><span class="badge ${statusBadge[a.estado] || 'badge-info'}">${a.estado}</span></td>
                <td><div class="table-actions">
                    <button class="btn-icon btn-icon-edit" data-editar="${a.id}">✎ Editar</button>
                    <button class="btn-icon btn-icon-delete" data-eliminar="${a.id}">✕</button>
                </div></td>
            </tr>
        `).join('');

        tbody.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', () => {
            const a = aviones.find((x: any) => x.id === parseInt((btn as HTMLElement).dataset.editar!));
            if (a) mostrarModalEditar(a);
        }));
        tbody.querySelectorAll('[data-eliminar]').forEach(btn => btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.eliminar!;
            if (!confirm('¿Eliminar avión #' + id + '?')) return;
            await apiFetch('/api/aviones/' + id, { method: 'DELETE' });
            showToast('Avión eliminado', 'success');
            cargarAviones();
        }));
    } catch (err: any) { tbody.innerHTML = '<tr><td colspan="7"><div class="empty-msg" style="color:var(--danger)">' + err.message + '</div></td></tr>'; }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  if (!isAdmin()) {
    showToast('Acceso denegado', 'error');
    setTimeout(() => window.location.href = 'index.html', 1000);
    return;
  }

  document.getElementById('btn-nuevo-avion')!.addEventListener('click', mostrarModalNuevo);
  cargarAviones();
});
