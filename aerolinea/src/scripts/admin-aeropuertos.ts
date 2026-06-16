import { initAuth, apiFetch, showToast, isAdmin } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

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
            cargarAeropuertos();
        } catch (err: any) { showToast(err.message, 'error'); }
        finally { btn.disabled = false; btn.textContent = 'Guardar'; }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function mostrarModalNuevo() {
    crearModal(`
        <h2>Nuevo aeropuerto</h2>
        <div class="form-group">
            <label>Nombre</label>
            <input type="text" name="nombre" class="form-control" placeholder="Ej: Aeropuerto Internacional de Ezeiza" required />
        </div>
        <div class="form-group">
            <label>Código IATA</label>
            <input type="text" name="codigoIata" class="form-control" placeholder="EZE" maxlength="3" required />
        </div>
        <div class="form-group">
            <label>Ciudad</label>
            <input type="text" name="ciudad" class="form-control" placeholder="Buenos Aires" required />
        </div>
        <div class="form-group">
            <label>País</label>
            <input type="text" name="pais" class="form-control" placeholder="Argentina" required />
        </div>
        <button type="submit" class="btn-submit">Guardar aeropuerto</button>
    `, async (data) => {
        await apiFetch('/api/aeropuertos', { method: 'POST', body: JSON.stringify(data) });
        showToast('Aeropuerto creado con éxito', 'success');
    });
}

function mostrarModalEditar(a: any) {
    crearModal(`
        <h2>Editar aeropuerto #${a.id}</h2>
        <div class="form-group">
            <label>Nombre</label>
            <input type="text" name="nombre" class="form-control" value="${a.nombre || ''}" required />
        </div>
        <div class="form-group">
            <label>Código IATA</label>
            <input type="text" name="codigoIata" class="form-control" value="${a.codigoIata || ''}" maxlength="3" required />
        </div>
        <div class="form-group">
            <label>Ciudad</label>
            <input type="text" name="ciudad" class="form-control" value="${a.ciudad || ''}" required />
        </div>
        <div class="form-group">
            <label>País</label>
            <input type="text" name="pais" class="form-control" value="${a.pais || ''}" required />
        </div>
        <button type="submit" class="btn-submit">Guardar cambios</button>
    `, async (data) => {
        await apiFetch('/api/aeropuertos/' + a.id, { method: 'PUT', body: JSON.stringify(data) });
        showToast('Aeropuerto actualizado', 'success');
    });
}

async function cargarAeropuertos() {
    const tbody = document.getElementById('tabla-aeropuertos')!;
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-msg"><div class="empty-icon">⏳</div>Cargando aeropuertos...</div></td></tr>';
    try {
        const aeropuertos = await apiFetch('/api/aeropuertos');
        if (!aeropuertos.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-msg"><div class="empty-icon">📍</div>No hay aeropuertos registrados todavía.</div></td></tr>';
            return;
        }
        tbody.innerHTML = aeropuertos.map((a: any) => `
            <tr>
                <td>${a.id}</td>
                <td><strong>${a.nombre}</strong></td>
                <td><span class="badge badge-info">${a.codigoIata}</span></td>
                <td>${a.ciudad}</td>
                <td>${a.pais}</td>
                <td><div class="table-actions">
                    <button class="btn-icon btn-icon-edit" data-editar="${a.id}">✎ Editar</button>
                    <button class="btn-icon btn-icon-delete" data-eliminar="${a.id}">✕</button>
                </div></td>
            </tr>
        `).join('');

        tbody.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', () => {
            const a = aeropuertos.find((x: any) => x.id === parseInt((btn as HTMLElement).dataset.editar!));
            if (a) mostrarModalEditar(a);
        }));
        tbody.querySelectorAll('[data-eliminar]').forEach(btn => btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.eliminar!;
            if (!confirm('¿Eliminar aeropuerto #' + id + '?')) return;
            await apiFetch('/api/aeropuertos/' + id, { method: 'DELETE' });
            showToast('Aeropuerto eliminado', 'success');
            cargarAeropuertos();
        }));
    } catch (err: any) { tbody.innerHTML = '<tr><td colspan="6"><div class="empty-msg" style="color:var(--danger)">' + err.message + '</div></td></tr>'; }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  if (!isAdmin()) {
    showToast('Acceso denegado', 'error');
    setTimeout(() => window.location.href = 'index.html', 1000);
    return;
  }

  document.getElementById('btn-nuevo-aeropuerto')!.addEventListener('click', mostrarModalNuevo);
  cargarAeropuertos();
});
