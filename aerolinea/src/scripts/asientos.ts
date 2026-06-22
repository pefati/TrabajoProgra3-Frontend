import { initAuth, apiFetch, showToast } from './auth';
fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('navbar-container')!.innerHTML = html; initAuth();
    });

fetch("/src/components/footer.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById('footer')!.innerHTML = html;
    });

let basePrice = 0;
let seatsNeeded = 1;
let selectedSeats: { id: string; clase: string; precio: number; entityId: number }[] = [];
let asientosData: any[] = [];
let vueloId: number | null = null;
let avionId: number | null = null;

function clasePorFila(rowNum: number): string {
    if (rowNum <= 2) return 'Primera';
    if (rowNum <= 6) return 'Ejecutiva';
    return 'Económica';
}

async function cargarAsientos() {
    if (!avionId) return;
    try {
        const asientos = await fetch('/api/asientos/avion/' + avionId).then(r => r.json());
        asientosData = Array.isArray(asientos) ? asientos : [];
        selectedSeats = selectedSeats.filter(s => {
            const a = asientosData.find((ad: any) => ad.codigo === s.id);
            return a && a.ocupado !== true;
        });
        buildCabin();
        actualizarResumen();
    } catch {}
}

(async () => {
    try {
        const carrito = await apiFetch('/api/carrito');
        if (carrito?.items?.length > 0) {
            seatsNeeded = carrito.items.reduce((sum: number, i: any) => sum + i.cantidad, 0);
            const first = carrito.items[0];
            vueloId = first.vueloId;
            const v = await fetch('/api/vuelos/' + first.vueloId).then(r => r.json());
            if (v?.precioVuelo) basePrice = v.precioVuelo;

            avionId = v?.avion?.id;
            if (avionId) {
                const asientos = await fetch('/api/asientos/avion/' + avionId).then(r => r.json());
                asientosData = Array.isArray(asientos) ? asientos : [];
            }

            const origen = v?.aeropuertoOrigen?.ciudad || '—';
            const destino = v?.aeropuertoDestino?.ciudad || '—';
            document.getElementById('vuelo-info')!.textContent = `${origen} → ${destino} · ${seatsNeeded} pasaje(s)`;
            document.getElementById('base-price')!.textContent = '$' + basePrice.toLocaleString('es-AR');
            buildCabin();
        }
    } catch {}
    actualizarResumen();
})();

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) cargarAsientos();
});

function extraerFila(codigo: string): number {
    const match = codigo.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

function extraerColumna(codigo: string): string {
    return codigo.replace(/^[A-Za-z]?\d+/, '');
}

function asientoOcupado(codigo: string): boolean {
    const a = asientosData.find(s => s.codigo === codigo);
    return a ? a.ocupado === true : false;
}

function precioExtraPorCodigo(codigo: string): number {
    const a = asientosData.find(s => s.codigo === codigo);
    return a?.precioExtra ?? 0;
}

function buildCabin() {
    const cabin = document.getElementById('cabin-map');
    if (!cabin) return;
    let html = '<div class="cabin-plane-nose">✈</div>';

    const filas = new Set<number>();
    asientosData.forEach(a => {
        const fila = extraerFila(a.codigo || '');
        if (fila) filas.add(fila);
    });

    if (filas.size === 0) {
        cabin.innerHTML = html + '<p style="text-align:center;padding:40px;color:var(--gray-500)">No hay asientos disponibles para este vuelo.</p>';
        return;
    }

    const maxFila = Math.max(...filas);

    html += '<div class="cabin-section-label">Primera clase</div>';
    for (let r = 1; r <= Math.min(2, maxFila); r++) {
        html += buildRowDesdeData(r, 'Primera');
    }

    if (maxFila >= 3) {
        html += '<div class="cabin-section-label">Clase ejecutiva</div>';
        for (let r = 3; r <= Math.min(6, maxFila); r++) {
            html += buildRowDesdeData(r, 'Ejecutiva');
        }
    }

    if (maxFila >= 7) {
        html += '<div class="cabin-section-label">Clase económica</div>';
        for (let r = 7; r <= maxFila; r++) {
            html += buildRowDesdeData(r, 'Económica');
        }
    }

    cabin.innerHTML = html;
}

function columnasPorFila(rowNum: number): { left: string[]; right: string[] } {
    const asis = asientosData.filter(a => extraerFila(a.codigo || '') === rowNum);
    const cols = asis.map(a => ({
        codigo: a.codigo,
        col: extraerColumna(a.codigo || '')
    })).sort((a, b) => a.col.localeCompare(b.col));
    const mid = Math.ceil(cols.length / 2);
    return {
        left: cols.map(c => c.codigo).slice(0, mid),
        right: cols.map(c => c.codigo).slice(mid)
    };
}

function buildRowDesdeData(rowNum: number, clase: string): string {
    const { left, right } = columnasPorFila(rowNum);
    if (left.length === 0 && right.length === 0) return '';

    let html = `<div class="seat-row"><span class="seat-row-num">${rowNum}</span>`;

    const buildSeats = (codes: string[]) => {
        codes.forEach(codigo => {
            const ocupado = asientoOcupado(codigo);
            const isFirst = clase === 'Primera';
            const isSelected = selectedSeats.some(s => s.id === codigo);
            const display = extraerColumna(codigo);
            html += `<div class="seat ${ocupado ? 'taken' : ''} ${isFirst ? 'first-class' : ''} ${isSelected ? 'selected' : ''}"
          id="seat-${codigo}" onclick="${ocupado ? '' : `toggleSeat('${codigo}','${clase}')`}"
          title="${ocupado ? 'Ocupado' : codigo + ' · ' + clase}">
          ${ocupado ? '' : display}
        </div>`;
        });
    };

    buildSeats(left);
    html += '<div class="seat-aisle"></div>';
    buildSeats(right);

    html += '</div>';
    return html;
}

(window as any).toggleSeat = function (codigo: string, clase: string) {
    const el = document.getElementById('seat-' + codigo);
    if (!el || el.classList.contains('taken')) return;

    const idx = selectedSeats.findIndex(s => s.id === codigo);
    if (idx >= 0) {
        selectedSeats.splice(idx, 1);
        el.classList.remove('selected');
    } else {
        if (selectedSeats.length >= seatsNeeded) {
            showToast(`Ya seleccionaste ${seatsNeeded} asientos`, 'warn');
            return;
        }
        const asiento = asientosData.find(a => a.codigo === codigo);
        const entityId = asiento?.id;
        const extra = precioExtraPorCodigo(codigo);
        selectedSeats.push({ id: codigo, clase, precio: extra, entityId });
        el.classList.add('selected');
    }
    actualizarResumen();
};

function actualizarResumen() {
    const count = selectedSeats.length;
    const totalExtra = selectedSeats.reduce((sum, s) => sum + s.precio, 0);
    const total = basePric  e * seatsNeeded + totalExtra;

    document.getElementById('asientos-progress')!.textContent =
        count > 0
            ? `Seleccionaste ${count} de ${seatsNeeded} asientos`
            : `Seleccioná 0 de ${seatsNeeded} asientos (se asignarán automáticamente en clase económica)`;

    const seatNames = document.getElementById('asientos-seleccionados');
    if (seatNames) {
        if (count === 0) {
            seatNames.textContent = 'Ninguno aún — se asignarán en clase económica al pagar';
        } else {
            seatNames.innerHTML = selectedSeats.map(s =>
                `<span style="display:inline-block;background:var(--navy);color:white;padding:2px 8px;border-radius:4px;margin:2px;font-size:13px">${s.id}</span>`
            ).join(' ');
        }
    }

    const seatPriceEl = document.getElementById('seat-price');
    if (seatPriceEl) seatPriceEl.textContent = totalExtra > 0 ? '+$' + totalExtra.toLocaleString('es-AR') : 'Sin costo';

    const totalEl = document.getElementById('total-price');
    if (totalEl) totalEl.textContent = '$' + total.toLocaleString('es-AR');

    (document.getElementById('btn-continue') as HTMLButtonElement).disabled = false;

    sessionStorage.setItem('asientos_seleccionados', JSON.stringify(selectedSeats));
}

(window as any).continuarPago = async function () {
    const idsToCheck = selectedSeats.map(s => s.entityId).filter(id => id != null);
    if (idsToCheck.length > 0) {
        try {
            const res = await fetch('/api/asientos/verificar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(idsToCheck)
            });
            const ocupados: Record<number, boolean> = await res.json();
            const tomados = selectedSeats.filter(s => ocupados[s.entityId] === true);
            if (tomados.length > 0) {
                const codes = tomados.map(s => s.id).join(', ');
                showToast(`Los asientos ${codes} ya no están disponibles. Se asignarán automáticamente.`, 'warn');
                tomados.forEach(s => {
                    document.getElementById('seat-' + s.id)?.classList.remove('selected');
                });
                selectedSeats = selectedSeats.filter(s => ocupados[s.entityId] !== true);
                sessionStorage.setItem('asientos_seleccionados', JSON.stringify(selectedSeats));
                actualizarResumen();
            }
        } catch {}
    }
    sessionStorage.setItem('asientos_seleccionados', JSON.stringify(selectedSeats));
    window.location.href = 'pago.html';
};
