import { initAuth, apiFetch, showToast, actualizarContadorCarrito } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

async function cargarFavoritos() {
    const container = document.getElementById('favoritos-list');
    if (container) container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--gray-500)">Cargando favoritos...</div>';

    try {
        const favs: any[] = await apiFetch('/api/favoritos');

        if (!container) return;

        if (favs.length === 0) {
            container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--gray-500)">
                <div style="font-size:48px;margin-bottom:16px">♡</div>
                <p style="font-size:18px;font-weight:600;margin-bottom:8px">No tenés vuelos favoritos</p>
                <p style="margin-bottom:20px">Guardá los vuelos que te interesan para encontrarlos fácil</p>
                <a href="vuelos.html" class="btn btn-primary">Ver vuelos</a>
            </div>`;
            return;
        }

        const vuelosDetails = await Promise.all(
            favs.map(f => fetch('/api/vuelos/' + f.vueloId).then(r => r.json()).catch(() => null))
        );

        container.innerHTML = favs.map((fav, i) => {
            const v = vuelosDetails[i];
            if (!v) return '';
            const origen = v.aeropuertoOrigen?.ciudad || '—';
            const destino = v.aeropuertoDestino?.ciudad || '—';
            const precio = v.precioVuelo ?? 0;
            const fecha = new Date(fav.fechaAgregado).toLocaleDateString('es-AR');

            return `
            <div class="flight-card" id="fav-card-${fav.id}">
                <div style="flex:1">
                    <div class="flight-airline">AeroGest</div>
                    <div class="flight-route">
                        <div><div class="flight-time">${v.horaSalida?.slice(0, 5) || '—'}</div><div class="flight-city">${origen}</div></div>
                        <div class="flight-line">
                            <div class="flight-line-bar"></div>
                            <div class="flight-stops ${!v.escala ? 'direct' : ''}">${v.escala ? '1 escala' : 'Directo'}</div>
                        </div>
                        <div><div class="flight-time">${v.horaLlegada?.slice(0, 5) || '—'}</div><div class="flight-city">${destino}</div></div>
                    </div>
                    <div style="font-size:12px;color:var(--gray-500);margin-top:6px">Guardado el ${fecha}</div>
                </div>
                <div class="flight-class">
                    <div class="flight-price">$${precio.toLocaleString('es-AR')}</div>
                    <div class="flight-price-label">por persona</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    <button class="btn btn-primary" onclick="elegirVuelo(${v.id}, ${JSON.stringify(v).replace(/"/g, '&quot;')})">Elegir →</button>
                    <button class="btn" style="padding:8px 16px;font-size:12px;border:1px solid #c0392b;color:#c0392b" onclick="eliminarFavorito(${fav.id})">♥ Quitar</button>
                </div>
            </div>`;
        }).join('');

    } catch (err: any) {
        if (container) container.innerHTML = `<div style="padding:20px;color:#c0392b;background:#fdf0ee;border-radius:8px">${err.message}</div>`;
    }
}

(window as any).eliminarFavorito = async function (favId: number) {
    try {
        await apiFetch(`/api/favoritos/${favId}`, { method: 'DELETE' });
        showToast('Eliminado de favoritos');
document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  cargarFavoritos();
});
    } catch (err: any) {
        showToast(err.message || 'Error al eliminar', 'error');
    }
};

(window as any).elegirVuelo = async function (id: number, vuelo: any) {
    try {
        await apiFetch(`/api/carrito/items?vueloId=${id}&cantidad=1&clase=ECONOMICA`, { method: 'POST' });
        await actualizarContadorCarrito();
        window.location.href = 'carrito.html';
    } catch (err: any) {
        showToast(err.message || 'Error al agregar al carrito', 'error');
    }
};

cargarFavoritos();
