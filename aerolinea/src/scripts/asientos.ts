import { initAuth } from './auth';
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

const basePrice = 689;
let selectedSeat: string | null = null;

const takenSeats = new Set(['1A', '1C', '2B', '2D', '3A', '4C', '5B', '6D', '7A', '7C', '8B', '9A', '9D', '10C', '11B', '12A', '13D', '14B', '15C', '16A', '17B', '18D', '19C', '20A']);

const seatPrices: Record<string, number> = { 'Primera': 300, 'Ejecutiva': 80, 'Económica': 0 };

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
    html += `<div class="seat ${isTaken ? 'taken' : ''} ${isFirst ? 'first-class' : ''}"
      id="seat-${id}" onclick="${isTaken ? '' : `chooseSeat('${id}','${clase}')`}"
      title="${isTaken ? 'Ocupado' : id + ' · ' + clase}">
      ${isTaken ? '' : id}
    </div>`;
  });

  html += '<div class="seat-aisle"></div>';

  [...rightCols].forEach(col => {
    const id = rowNum + col;
    const isTaken = takenSeats.has(id);
    const isFirst = zone === 'first-class';
    html += `<div class="seat ${isTaken ? 'taken' : ''} ${isFirst ? 'first-class' : ''}"
      id="seat-${id}" onclick="${isTaken ? '' : `chooseSeat('${id}','${clase}')`}"
      title="${isTaken ? 'Ocupado' : id + ' · ' + clase}">
      ${isTaken ? '' : id}
    </div>`;
  });

  html += '</div>';
  return html;
}

(window as any).chooseSeat = function (id: string, clase: string) {
  if (selectedSeat) {
    const prev = document.getElementById('seat-' + selectedSeat);
    if (prev) prev.classList.remove('selected');
  }

  selectedSeat = id;
  const el = document.getElementById('seat-' + id);
  if (el) el.classList.add('selected');

  const extra = seatPrices[clase] || 0;
  const total = basePrice + extra;

  document.getElementById('seat-name')!.textContent = id;
  document.getElementById('seat-type')!.textContent = clase;
  document.getElementById('seat-price')!.textContent = extra > 0 ? '+$' + extra : 'Sin costo';
  document.getElementById('total-price')!.textContent = '$' + total.toLocaleString('es-AR');
  (document.getElementById('btn-continue') as HTMLButtonElement).disabled = false;

  sessionStorage.setItem('asiento_seleccionado', JSON.stringify({ id, clase, precio: extra, total }));
};

(window as any).continuarPago = function () {
  if (!selectedSeat) return;
  window.location.href = 'pago.html';
};

buildCabin();
