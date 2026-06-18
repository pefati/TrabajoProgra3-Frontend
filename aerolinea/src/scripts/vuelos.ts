import { initAuth, apiFetch, showToast, isLoggedIn, isPerfilCompleto, actualizarContadorCarrito } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

let vuelosActuales: any[] = [];
let vuelosFiltrados: any[] = [];
let favoritosIds = new Set<number>();
const filtrosActivos = new Set<string>();

function renderFlights(lista: any[]) {
    const container = document.getElementById('flight-list');
    const countEl = document.getElementById('count');
    vuelosFiltrados = lista;
    if (countEl) countEl.textContent = lista.length.toString();

    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--gray-500)">
            <div style="font-size:48px;margin-bottom:16px">🔍</div>
            <p style="font-size:18px;font-weight:600;margin-bottom:8px">No se encontraron vuelos</p>
            <p>Probá con otros criterios de búsqueda</p>
        </div>`;
        return;
    }

    container.innerHTML = lista.map(v => {
        const salida = v.horaSalida?.slice(0, 5) || (v.fechaSalida ? new Date(v.fechaSalida).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—');
        const llegada = v.horaLlegada?.slice(0, 5) || (v.fechaLlegada ? new Date(v.fechaLlegada).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—');
        const origen = v.aeropuertoOrigen?.ciudad || v.origen || '—';
        const destino = v.aeropuertoDestino?.ciudad || v.destino || '—';
        const precio = v.precioVuelo ?? v.precio ?? 0;
        const isFav = favoritosIds.has(v.id);

        return `
        <div class="flight-card" id="fc-${v.id}">
            <div onclick="seleccionarVuelo(${v.id})" style="flex:1;cursor:pointer">
                <div class="flight-airline">AeroGest</div>
                <div class="flight-route">
                    <div>
                        <div class="flight-time">${salida}</div>
                        <div class="flight-city">${origen}</div>
                    </div>
                    <div class="flight-line">
                        <div class="flight-duration">${formatearDuracion(v)}</div>
                        <div class="flight-line-bar"></div>
                        <div class="flight-stops ${!v.escala ? 'direct' : ''}">${v.escala ? '1 escala' : 'Directo'}</div>
                    </div>
                    <div>
                        <div class="flight-time">${llegada}</div>
                        <div class="flight-city">${destino}</div>
                    </div>
                </div>
            </div>
            <div class="flight-class">
                <div class="flight-class-name">Económica</div>
                <div class="flight-price">$${precio.toLocaleString('es-AR')}</div>
                <div class="flight-price-label">por persona</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
            <button class="btn" style="padding:6px 14px;font-size:16px;" 
                            title="Agregar al carrito"
                              onclick="event.stopPropagation();agregarAlCarrito(${v.id})">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></button>
                <button class="btn btn-primary" onclick="event.stopPropagation();elegirVuelo(${v.id})">Elegir →</button>
                <button class="btn ${isFav ? 'btn-dark' : ''}" style="padding:6px 12px;font-size:12px;border:1px solid var(--navy)" 
                    id="fav-btn-${v.id}" onclick="event.stopPropagation();toggleFavorito(${v.id})">
                    ${isFav ? '♥ Guardado' : '♡ Favorito'}
                </button>
               
                <button class="btn" style="padding:6px 12px;font-size:12px;border:1px solid var(--navy)" 
                        onclick="event.stopPropagation();verDetalle(${v.id})">
                        Más info
                </button>
                
            </div>
        </div>`;
    }).join('');
}

(window as any).seleccionarVuelo = function (id: number) {
    document.querySelectorAll('.flight-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('fc-' + id)?.classList.add('selected');
};

(window as any).agregarAlCarrito = async function (vueloId: number) {
    if (!isLoggedIn()) { showToast('Iniciá sesión para agregar al carrito', 'warn'); return; }
    if (!isPerfilCompleto()) return;

    try {
        await apiFetch(`/api/carrito/items?vueloId=${vueloId}&cantidad=1&clase=ECONOMICA`, { method: 'POST' });
        showToast('Vuelo agregado al carrito ✓');
        await actualizarContadorCarrito();
    } catch (err: any) {
        showToast(err.message || 'Error al agregar al carrito', 'error');
    }
};

if (isLoggedIn()) actualizarContadorCarrito();


(window as any).verDetalle = function (id: number) {
    const v = vuelosActuales.find(x => x.id === id);
    if (!v) return;

    const origen = v.aeropuertoOrigen?.ciudad || v.origen || '—';
    const destino = v.aeropuertoDestino?.ciudad || v.destino || '—';
    const fechaSalida = v.fechaSalida ? new Date(v.fechaSalida).toLocaleDateString('es-AR') : '—';
    const fechaLlegada = v.fechaLlegada ? new Date(v.fechaLlegada).toLocaleDateString('es-AR') : '—';
    const horaSalida = v.horaSalida || (v.fechaSalida ? new Date(v.fechaSalida).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—');
    const horaLlegada = v.horaLlegada || (v.fechaLlegada ? new Date(v.fechaLlegada).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—');
    const precio = v.precioVuelo ?? v.precio ?? 0;

    const nombreOrigen = v.aeropuertoOrigen?.nombre || origen;
    const nombreDestino = v.aeropuertoDestino?.nombre || destino;
    const codOrigen = v.aeropuertoOrigen?.codigoIata || '';
    const codDestino = v.aeropuertoDestino?.codigoIata || '';

    document.getElementById('modal-contenido')!.innerHTML = `
        <h2 style="font-size:18px;font-weight:600;margin-bottom:0.25rem">${origen} → ${destino}</h2>
        <div style="font-size:13px;color:#888;margin-bottom:1.5rem">${codOrigen ? codOrigen + ' · ' : ''}${nombreOrigen} → ${codDestino ? codDestino + ' · ' : ''}${nombreDestino}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
            <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px">Fecha salida</div>
                <div style="font-weight:500">${fechaSalida}</div>
            </div>
            <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px">Fecha llegada</div>
                <div style="font-weight:500">${fechaLlegada}</div>
            </div>
            <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px">Hora salida</div>
                <div style="font-weight:500">${horaSalida}</div>
            </div>
            <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px">Hora llegada</div>
                <div style="font-weight:500">${horaLlegada}</div>
            </div>
            <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px">Escala</div>
                <div style="font-weight:500">${v.escala ? 'Sí (1 escala)' : 'Directo'}</div>
            </div>
            <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px">Estado</div>
                <div style="font-weight:500">${v.estado || '—'}</div>
            </div>
        </div>
        ${v.escala ? `<div style="background:#FAEEDA;padding:10px 14px;border-radius:var(--radius-md);margin-bottom:1rem;font-size:13px"><strong>🔄 Escala</strong> — Este vuelo realiza una escala intermedia.</div>` : ''}
        <div style="border-top:1px solid #eee;padding-top:1rem;display:flex;justify-content:space-between;align-items:center">
            <div>
                <div style="font-size:11px;color:#888">Precio por persona</div>
                <div style="font-size:22px;font-weight:600">$${precio.toLocaleString('es-AR')}</div>
            </div>
            <button class="btn btn-primary" onclick="cerrarModal();elegirVuelo(${v.id})">Elegir →</button>
        </div>
    `;

    const modal = document.getElementById('modal-detalle')!;
    modal.style.display = 'flex';
};

(window as any).cerrarModal = function () {
    document.getElementById('modal-detalle')!.style.display = 'none';
};

document.getElementById('modal-detalle')?.addEventListener('click', function (e) {
    if (e.target === this) (window as any).cerrarModal();
});


(window as any).elegirVuelo = async function (id: number) {
    if (!isLoggedIn()) { showToast('Iniciá sesión para comprar', 'warn'); return; }
    if (!isPerfilCompleto()) return;
    try {
        await apiFetch(`/api/carrito/items?vueloId=${id}&cantidad=1&clase=ECONOMICA`, { method: 'POST' });
        showToast('Vuelo agregado al carrito ✓');
        await actualizarContadorCarrito();
        window.location.href = 'carrito.html';
    } catch (err: any) {
        showToast(err.message || 'Error al agregar al carrito', 'error');
    }
};

(window as any).toggleFavorito = async function (vueloId: number) {
    if (!isLoggedIn()) { showToast('Iniciá sesión para guardar favoritos', 'warn'); return; }
    if (!isPerfilCompleto()) return;

    try {
        if (favoritosIds.has(vueloId)) {
            const favs: any[] = await apiFetch('/api/favoritos');
            const fav = favs.find((f: any) => f.vueloId === vueloId);
            if (fav) {
                await apiFetch(`/api/favoritos/${fav.id}`, { method: 'DELETE' });
                favoritosIds.delete(vueloId);
                const btn = document.getElementById('fav-btn-' + vueloId);
                if (btn) { btn.textContent = '♡ Favorito'; btn.classList.remove('btn-dark'); }
                showToast('Eliminado de favoritos');
            }
        } else {
            await apiFetch(`/api/favoritos/vuelos/${vueloId}`, { method: 'POST' });
            favoritosIds.add(vueloId);
            const btn = document.getElementById('fav-btn-' + vueloId);
            if (btn) { btn.textContent = '♥ Guardado'; btn.classList.add('btn-dark'); }
            showToast('Agregado a favoritos');
        }
    } catch (err: any) {
        showToast(err.message || 'Error al guardar favorito', 'error');
    }
};

(window as any).sortFlights = function (criterio: string) {
    const lista = [...vuelosFiltrados];
    ordenarVuelos(lista, criterio);
    renderFlights(lista);
};

(window as any).filtrarDirectos = function () {
    toggleFiltro('directos');
};
(window as any).filtrarManana = function () { toggleFiltro('manana'); };
(window as any).filtrarBaratos = function () {
    toggleFiltro('baratos');
};
(window as any).filtrarTemprano = function () {
    toggleFiltro('temprano');
};
(window as any).limpiarFiltrosVuelos = function () {
    filtrosActivos.clear();
    document.querySelectorAll('.quick-filter.active').forEach(el => el.classList.remove('active'));
    aplicarFiltros();
};

(window as any).swapAirports = function () {
    const o = document.getElementById('origen') as HTMLInputElement;
    const d = document.getElementById('destino') as HTMLInputElement;
    if (o && d) [o.value, d.value] = [d.value, o.value];
};

(window as any).actualizarBusqueda = function (e: Event) {
    e.preventDefault();
    fetchVuelos();
};

(window as any).showToast = (msg: string) => showToast(msg);

const params = new URLSearchParams(window.location.search);
const destInput = document.getElementById('destino') as HTMLInputElement;
const origInput = document.getElementById('origen') as HTMLInputElement;
const idaInput = document.getElementById('fecha-ida') as HTMLInputElement;

if (params.get('destino') && destInput) destInput.value = params.get('destino')!;
if (params.get('origen') && origInput) origInput.value = params.get('origen')!;
if (params.get('fechaIda') && idaInput) idaInput.value = params.get('fechaIda')!;

const hoy = new Date().toISOString().split('T')[0];
if (idaInput) { idaInput.min = hoy; if (!idaInput.value) idaInput.value = hoy; }

async function fetchVuelos() {
    const container = document.getElementById('flight-list');
    if (container) container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--gray-500)">Cargando vuelos...</div>';

    const oCiudad = origInput?.value.split('(')[0].trim() || '';
    const dCiudad = destInput?.value.split('(')[0].trim() || '';
    const fecha = idaInput?.value || '';

    const searchParams = new URLSearchParams();
    if (oCiudad) searchParams.append('origen', oCiudad);
    if (dCiudad) searchParams.append('destino', dCiudad);
    if (fecha) searchParams.append('fechaSalida', fecha + 'T00:00:00');

    const url = '/api/vuelos/filtrar?' + searchParams.toString();

    const routeTitle = document.getElementById('route-title');
    if (routeTitle) {
        routeTitle.style.display = '';
        routeTitle.textContent = (oCiudad && dCiudad) ? `${oCiudad} → ${dCiudad}` : 'Todos los vuelos';
    }

    const fechaEl = document.getElementById('fecha-resultados');
    if (fechaEl) {
        const ahora = new Date();
        fechaEl.textContent = ahora.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }

    try {
        const data = await fetch(url).then(r => r.json());
        vuelosActuales = Array.isArray(data) ? data : [];

        if (isLoggedIn()) {
            try {
                const favs: any[] = await apiFetch('/api/favoritos');
                favoritosIds = new Set(favs.map((f: any) => f.vueloId));
            } catch { }
        }

        aplicarFiltros();
    } catch (err) {
        if (container) container.innerHTML = '<div style="text-align:center;padding:40px;color:#c0392b;background:#fdf0ee;border-radius:8px">No se pudieron cargar los vuelos. Verificá que el servidor esté activo.</div>';
    }
}

function toggleFiltro(filtro: string) {
    const btn = document.querySelector(`[data-flight-filter="${filtro}"]`);
    if (filtrosActivos.has(filtro)) {
        filtrosActivos.delete(filtro);
        btn?.classList.remove('active');
    } else {
        filtrosActivos.add(filtro);
        btn?.classList.add('active');
    }
    aplicarFiltros();
}

function aplicarFiltros() {
    let lista = [...vuelosActuales];

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const mananaStr = manana.toISOString().split('T')[0];

    if (filtrosActivos.has('directos')) {
        lista = lista.filter(v => !v.escala);
    }

    if (filtrosActivos.has('manana')) {

        lista = lista.filter(v => v.fechaSalida === mananaStr);
    }

    if (filtrosActivos.has('baratos')) {
        lista = lista.filter(v => (v.precioVuelo ?? v.precio ?? 0) < 800);
    }

    if (filtrosActivos.has('temprano')) {

        lista = lista.filter(v => {
            const hora = obtenerHora(v.fechaSalida, v.horaSalida);
            return v.fechaSalida === mananaStr && hora < 14;
        });
    }

    const sort = document.getElementById('sort-vuelos') as HTMLSelectElement | null;
    if (sort?.value) ordenarVuelos(lista, sort.value);
    renderFlights(lista);
}

function ordenarVuelos(lista: any[], criterio: string) {
    if (criterio === 'precio') lista.sort((a, b) => (a.precioVuelo ?? a.precio ?? 0) - (b.precioVuelo ?? b.precio ?? 0));
    if (criterio === 'salida') lista.sort((a, b) => new Date(a.fechaSalida || 0).getTime() - new Date(b.fechaSalida || 0).getTime());
    if (criterio === 'duracion') lista.sort((a, b) => calcularDuracion(a) - calcularDuracion(b));
}

function obtenerHora(fechaSalida?: string, horaSalida?: string): number {
    if (horaSalida) return parseInt(horaSalida.slice(0, 2), 10);
    if (fechaSalida) return new Date(fechaSalida).getHours();
    return 99;
}

function calcularDuracion(v: any) {
    if (!v.fechaSalida || !v.fechaLlegada) return Number.MAX_SAFE_INTEGER;
    return new Date(v.fechaLlegada).getTime() - new Date(v.fechaSalida).getTime();
}

function formatearDuracion(v: any): string {
    if (!v.fechaSalida || !v.fechaLlegada) return '—';
    const ms = new Date(v.fechaLlegada).getTime() - new Date(v.fechaSalida).getTime();
    const horas = Math.floor(ms / 3600000);
    const minutos = Math.floor((ms % 3600000) / 60000);
    return `${horas}h ${minutos}m`;
}

fetchVuelos();
