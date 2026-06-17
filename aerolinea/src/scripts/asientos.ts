<<<<<<< HEAD
import { initAuth, apiFetch } from './auth';
=======
import { initAuth } from './auth';

>>>>>>> 38a70059461986244b4470f8756a45df6d656420
fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('navbar-container')!.innerHTML = html;
        initAuth();
    });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('footer')!.innerHTML = html;
    });

<<<<<<< HEAD
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
=======
// ─── Tipos ───────────────────────────────────────────────
interface AsientoDTO {
    id: number;
    codigo: string;       // ej: "1A", "7F"
    precioExtra: number;
    vueloId: number;
    ocupado: boolean;
>>>>>>> 38a70059461986244b4470f8756a45df6d656420
}

// ─── Estado ──────────────────────────────────────────────
const vuelo = JSON.parse(sessionStorage.getItem('vuelo_seleccionado') || '{}');
const basePrice: number = vuelo.precio ?? 689;
let selectedSeatCodigo: string | null = null;
let asientosMap: Map<string, AsientoDTO> = new Map();

<<<<<<< HEAD
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
=======
// ─── Cabina ──────────────────────────────────────────────
async function buildCabin() {
    const cabin = document.getElementById('cabin-map');
    if (!cabin) return;
>>>>>>> 38a70059461986244b4470f8756a45df6d656420

    const vueloId: number = vuelo.id;
    if (!vueloId) {
        cabin.innerHTML = '<p style="color:red;padding:1rem">No se encontró el vuelo seleccionado.</p>';
        return;
    }

<<<<<<< HEAD
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
=======
    let asientos: AsientoDTO[] = [];
    try {
        const res = await fetch(`/api/asientos/vuelo/${vueloId}`);
        if (!res.ok) throw new Error('Error al cargar asientos');
        asientos = await res.json();
    } catch (e) {
        cabin.innerHTML = '<p style="color:red;padding:1rem">Error al cargar los asientos.</p>';
        return;
    }
>>>>>>> 38a70059461986244b4470f8756a45df6d656420

    // Indexar por código
    asientosMap = new Map(asientos.map(a => [a.codigo, a]));

    let html = '<div class="cabin-plane-nose">✈</div>';

    html += '<div class="cabin-section-label">Primera clase · Asiento incluido</div>';
    for (let r = 1; r <= 2; r++) {
        html += buildRow(r, ['A', 'C'], ['E', 'G'], 'Primera');
    }

    html += '<div class="cabin-section-label">Clase ejecutiva</div>';
    for (let r = 3; r <= 6; r++) {
        html += buildRow(r, ['A', 'B', 'C'], ['D', 'E', 'F'], 'Ejecutiva');
    }

    html += '<div class="cabin-section-label">Clase económica</div>';
    for (let r = 7; r <= 25; r++) {
        html += buildRow(r, ['A', 'B', 'C'], ['D', 'E', 'F'], 'Económica');
    }

    cabin.innerHTML = html;
}

<<<<<<< HEAD
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
=======
function buildRow(rowNum: number, leftCols: string[], rightCols: string[], clase: string) {
    const isFirst = clase === 'Primera';
    let html = `<div class="seat-row"><span class="seat-row-num">${rowNum}</span>`;

    [...leftCols, null, ...rightCols].forEach((col) => {
        if (col === null) {
            html += '<div class="seat-aisle"></div>';
            return;
        }
        html += buildSeatHTML(`${rowNum}${col}`, clase, isFirst);
    });

    html += '</div>';
    return html;
}

function buildSeatHTML(codigo: string, clase: string, isFirst: boolean): string {
    const asiento = asientosMap.get(codigo);

    // Si el backend no devolvió este asiento, no lo renderizamos
    if (!asiento) return '';

    const { ocupado, precioExtra } = asiento;
    const clases = ['seat', ocupado ? 'taken' : '', isFirst ? 'first-class' : ''].filter(Boolean).join(' ');
    const onclick = ocupado ? '' : `onclick="chooseSeat('${codigo}')"`;
    const title = ocupado ? 'Ocupado' : `${codigo} · ${clase}${precioExtra > 0 ? ' · +$' + precioExtra : ''}`;

    return `<div class="${clases}" id="seat-${codigo}" ${onclick} title="${title}">
    ${ocupado ? '' : codigo}
  </div>`;
}

// ─── Selección ───────────────────────────────────────────
(window as any).chooseSeat = function (codigo: string) {
    // Deseleccionar anterior
    if (selectedSeatCodigo) {
        document.getElementById('seat-' + selectedSeatCodigo)?.classList.remove('selected');
    }

    selectedSeatCodigo = codigo;
    document.getElementById('seat-' + codigo)?.classList.add('selected');

    const asiento = asientosMap.get(codigo)!;
    const extra = asiento.precioExtra ?? 0;
    const total = basePrice + extra;

    // Determinar clase por fila
    const fila = parseInt(codigo);
    const clase = fila <= 2 ? 'Primera' : fila <= 6 ? 'Ejecutiva' : 'Económica';

    document.getElementById('seat-name')!.textContent = codigo;
    document.getElementById('seat-type')!.textContent = clase;
    document.getElementById('seat-price')!.textContent = extra > 0 ? '+$' + extra : 'Sin costo';
    document.getElementById('total-price')!.textContent = '$' + total.toLocaleString('es-AR');
    (document.getElementById('btn-continue') as HTMLButtonElement).disabled = false;

    sessionStorage.setItem('asiento_seleccionado', JSON.stringify({
        id: asiento.id,       // ← id real para el CompraDTO
        codigo,
        clase,
        precioExtra: extra,
        total
    }));
>>>>>>> 38a70059461986244b4470f8756a45df6d656420
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
<<<<<<< HEAD
  if (selectedSeats.length !== seatsNeeded) return;
  window.location.href = 'pago.html';
=======
    if (!selectedSeatCodigo) return;
    window.location.href = 'pago.html';
>>>>>>> 38a70059461986244b4470f8756a45df6d656420
};

// ─── Init ────────────────────────────────────────────────
document.getElementById('base-price')!.textContent = '$' + basePrice.toLocaleString('es-AR');
buildCabin();