import { initAuth, apiFetch, showToast, isPerfilCompleto, actualizarContadorCarrito } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

let carritoData: any = null;

async function cargarCarrito() {
    const container = document.getElementById('carrito-list');
    if (container) container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--gray-500)">Cargando carrito...</div>';

    try {
        const data = await apiFetch('/api/carrito');
        carritoData = data;
        await renderCarrito(data);
        await actualizarContadorCarrito();
    } catch (err: any) {
        if (container) container.innerHTML = `<div style="padding:20px;color:#c0392b;background:#fdf0ee;border-radius:8px">${err.message}</div>`;
    }
}

async function getVueloDetails(vueloId: number) {
    try {
        return await fetch('/api/vuelos/' + vueloId).then(r => r.json());
    } catch { return null; }
}

async function renderCarrito(data: any) {
    const container = document.getElementById('carrito-list');
    const totalEl = document.getElementById('carrito-total');
    const subtotalEl = document.getElementById('carrito-subtotal');
    if (!container) return;

    if (!data.items || data.items.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--gray-500)">
            <div style="font-size:48px;margin-bottom:16px">🛒</div>
            <p style="font-size:18px;font-weight:600;margin-bottom:8px">Tu carrito está vacío</p>
            <p style="margin-bottom:20px">Buscá vuelos y agregálos al carrito</p>
            <a href="vuelos.html" class="btn btn-primary">Buscar vuelos</a>
        </div>`;
        if (totalEl) totalEl.textContent = '$0';
        if (subtotalEl) subtotalEl.textContent = '$0';
        return;
    }

    const items = await Promise.all(data.items.map(async (item: any) => {
        const v = await getVueloDetails(item.vueloId);
        return { ...item, vuelo: v };
    }));

    let total = 0;
    container.innerHTML = items.map((item: any) => {
        const v = item.vuelo;
        const precio = (v?.precioVuelo ?? 0) * item.cantidad;
        total += precio;
        const origen = v?.aeropuertoOrigen?.ciudad || '—';
        const destino = v?.aeropuertoDestino?.ciudad || '—';

        return `
        <div class="booking-card" id="item-${item.id}">
            <div style="flex:1">
                <div class="booking-route">${origen} → ${destino}</div>
                <div class="booking-details">Clase: ${item.claseVuelo}</div>
                <div style="font-size:12px;color:var(--gray-500);margin-top:4px">Vuelo #${item.vueloId}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <button class="btn btn-sm" style="padding:4px 10px;font-size:14px" onclick="cambiarCantidad(${item.id}, -1)">−</button>
                <span style="font-weight:600;min-width:24px;text-align:center" id="qty-${item.id}">${item.cantidad}</span>
                <button class="btn btn-sm" style="padding:4px 10px;font-size:14px" onclick="cambiarCantidad(${item.id}, 1)">+</button>
            </div>
            <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--navy);min-width:100px;text-align:right">
                $${precio.toLocaleString('es-AR')}
            </div>
            <div>
                <button class="btn" style="padding:8px 16px;font-size:12px;border:1px solid #c0392b;color:#c0392b"
                    onclick="eliminarItem(${item.id})">✕ Quitar</button>
            </div>
        </div>`;
    }).join('');

    if (subtotalEl) subtotalEl.textContent = '$' + total.toLocaleString('es-AR');
    if (totalEl) totalEl.textContent = '$' + total.toLocaleString('es-AR');
}

(window as any).cambiarCantidad = async function (itemId: number, delta: number) {
    const item = carritoData?.items?.find((i: any) => i.id === itemId);
    if (!item) return;
    const nueva = item.cantidad + delta;
    if (nueva < 1) return;
    try {
        await apiFetch(`/api/carrito/items/${itemId}?cantidad=${nueva}`, { method: 'PATCH' });
        cargarCarrito();
    } catch (err: any) {
        showToast(err.message || 'Error al actualizar cantidad', 'error');
    }
};

(window as any).eliminarItem = async function (itemId: number) {
    try {
        await apiFetch(`/api/carrito/items/${itemId}`, { method: 'DELETE' });
        showToast('Item eliminado');
        cargarCarrito();
    } catch (err: any) {
        showToast(err.message || 'Error al eliminar', 'error');
    }
};

(window as any).vaciarCarrito = async function () {
    if (!carritoData?.id) return;
    if (!confirm('¿Vaciar todo el carrito?')) return;
    try {
        await apiFetch(`/api/carrito/${carritoData.id}/clear`, { method: 'DELETE' });
        showToast('Carrito vaciado');
        cargarCarrito();
    } catch (err: any) {
        showToast(err.message || 'Error', 'error');
    }
};

(window as any).irAPagar = function () {
    if (!isPerfilCompleto()) return;
    if (!carritoData?.items?.length) { showToast('El carrito está vacío', 'warn'); return; }
    window.location.href = 'asientos.html';
};

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  cargarCarrito();
});
