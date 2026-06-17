import { initAuth } from './auth';

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

// ─── Tipos ───────────────────────────────────────────────
interface AsientoDTO {
    id: number;
    codigo: string;       // ej: "1A", "7F"
    precioExtra: number;
    vueloId: number;
    ocupado: boolean;
}

// ─── Estado ──────────────────────────────────────────────
const vuelo = JSON.parse(sessionStorage.getItem('vuelo_seleccionado') || '{}');
const basePrice: number = vuelo.precio ?? 689;
let selectedSeatCodigo: string | null = null;
let asientosMap: Map<string, AsientoDTO> = new Map();

// ─── Cabina ──────────────────────────────────────────────
async function buildCabin() {
    const cabin = document.getElementById('cabin-map');
    if (!cabin) return;

    const vueloId: number = vuelo.id;
    if (!vueloId) {
        cabin.innerHTML = '<p style="color:red;padding:1rem">No se encontró el vuelo seleccionado.</p>';
        return;
    }

    let asientos: AsientoDTO[] = [];
    try {
        const res = await fetch(`/api/asientos/vuelo/${vueloId}`);
        if (!res.ok) throw new Error('Error al cargar asientos');
        asientos = await res.json();
    } catch (e) {
        cabin.innerHTML = '<p style="color:red;padding:1rem">Error al cargar los asientos.</p>';
        return;
    }

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
};

(window as any).continuarPago = function () {
    if (!selectedSeatCodigo) return;
    window.location.href = 'pago.html';
};

// ─── Init ────────────────────────────────────────────────
document.getElementById('base-price')!.textContent = '$' + basePrice.toLocaleString('es-AR');
buildCabin();