import { initAuth, apiFetch } from './auth';
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

let basePrice = 689;
let seatsNeeded = 1;
let selectedSeats: { id: string; clase: string; precio: number }[] = [];

const takenSeats = new Set(['1A', '1C', '2B', '2D', '3A', '4C', '5B', '6D', '7A', '7C', '8B', '9A', '9D', '10C', '11B', '12A', '13D', '14B', '15C', '16A', '17B', '18D', '19C', '20A']);

const seatPrices: Record<string, number> = { 'Primera': 300, 'Ejecutiva': 80, 'Económica': 0 };

(async () => {
    try {
        const carrito = await apiFetch('/api/carrito');
        if (carrito?.items?.length > 0) {
            seatsNeeded = carrito.items.reduce((sum: number, i: any) => sum + i.cantidad, 0);
            const first = carrito.items[0];
            const v = await fetch('/api/vuelos/' + first.vueloId).then(r => r.json());
            if (v?.precioVuelo) basePrice = v.precioVuelo;

            const origen = v?.aeropuertoOrigen?.ciudad || '—';
            const destino = v?.aeropuertoDestino?.ciudad || '—';
            document.getElementById('vuelo-info')!.textContent = `${origen} → ${destino} · ${seatsNeeded} pasaje(s)`;
            document.getElementById('base-price')!.textContent = '$' + basePrice.toLocaleString('es-AR');
        }
    } catch {}
    document.getElementById('asientos-progress')!.textContent = `Seleccioná 0 de ${seatsNeeded} asientos`;
})();

function buildCabin() {
    const cabin = document.getElementById('cabin-map');
    if (!cabin) return;
    let html = '<div class="cabin-plane-nose">✈</div>';

    html += '<div class="cabin-section-label">Primera clase · Asiento incluido</div>';
    for (let r = 1; r <= 2; r++) {
        html += buildRow(r, ['A', 'C'], ['E', 'G'], 'first-class', 'Primera');
    }

    html += '<div class="cabin-section-label">Clase ejecutiva</div>';
    for (let r = 3; r <= 6; r++) {
        html += buildRow(r, ['A', 'B', 'C'], ['D', 'E', 'F'], 'biz', 'Ejecutiva');
    }

    html += '<div class="cabin-section-label">Clase económica</div>';
    for (let r = 7; r <= 25; r++) {
        html += buildRow(r, ['A', 'B', 'C'], ['D', 'E', 'F'], 'eco', 'Económica');
    }

    cabin.innerHTML = html;
}

function buildRow(rowNum: number, leftCols: string[], rightCols: string[], zone: string, clase: string) {
    let html = `<div class="seat-row"><span class="seat-row-num">${rowNum}</span>`;

    [...leftCols].forEach(col => {
        const id = rowNum + col;
        const isTaken = takenSeats.has(id);
        const isFirst = zone === 'first-class';
        const isSelected = selectedSeats.some(s => s.id === id);
        html += `<div class="seat ${isTaken ? 'taken' : ''} ${isFirst ? 'first-class' : ''} ${isSelected ? 'selected' : ''}"
      id="seat-${id}" onclick="${isTaken ? '' : `toggleSeat('${id}','${clase}')`}"
      title="${isTaken ? 'Ocupado' : id + ' · ' + clase}">
      ${isTaken ? '' : id}
    </div>`;
    });

    html += '<div class="seat-aisle"></div>';

    [...rightCols].forEach(col => {
        const id = rowNum + col;
        const isTaken = takenSeats.has(id);
        const isFirst = zone === 'first-class';
        const isSelected = selectedSeats.some(s => s.id === id);
        html += `<div class="seat ${isTaken ? 'taken' : ''} ${isFirst ? 'first-class' : ''} ${isSelected ? 'selected' : ''}"
      id="seat-${id}" onclick="${isTaken ? '' : `toggleSeat('${id}','${clase}')`}"
      title="${isTaken ? 'Ocupado' : id + ' · ' + clase}">
      ${isTaken ? '' : id}
    </div>`;
    });

    html += '</div>';
    return html;
}

(window as any).toggleSeat = function (id: string, clase: string) {
    const idx = selectedSeats.findIndex(s => s.id === id);
    if (idx >= 0) {
        selectedSeats.splice(idx, 1);
        document.getElementById('seat-' + id)?.classList.remove('selected');
    } else {
        if (selectedSeats.length >= seatsNeeded) {
            import('./auth').then(m => m.showToast(`Ya seleccionaste ${seatsNeeded} asientos`, 'warn'));
            return;
        }
        const extra = seatPrices[clase] || 0;
        selectedSeats.push({ id, clase, precio: extra });
        document.getElementById('seat-' + id)?.classList.add('selected');
    }
    actualizarResumen();
};

function actualizarResumen() {
    const count = selectedSeats.length;
    const totalExtra = selectedSeats.reduce((sum, s) => sum + s.precio, 0);
    const total = basePrice * seatsNeeded + totalExtra;

    document.getElementById('asientos-progress')!.textContent = `Seleccionaste ${count} de ${seatsNeeded} asientos`;

    const seatNames = document.getElementById('asientos-seleccionados');
    if (seatNames) {
        if (count === 0) {
            seatNames.textContent = 'Ninguno aún';
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

    (document.getElementById('btn-continue') as HTMLButtonElement).disabled = count !== seatsNeeded;

    sessionStorage.setItem('asientos_seleccionados', JSON.stringify(selectedSeats));
}

(window as any).continuarPago = function () {
    if (!selectedSeats) {
        sessionStorage.removeItem('asiento_seleccionado');
    }
    window.location.href = 'pago.html';
};

buildCabin();