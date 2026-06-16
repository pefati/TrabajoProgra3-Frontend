import { initAuth, apiFetch, showToast, requirePerfilCompleto } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

if (!requirePerfilCompleto()) { throw new Error('not authorized'); }

let extras = 0;
let seatExtra = 0;
const impuestos = 85;

const vuelo = JSON.parse(sessionStorage.getItem('vuelo_seleccionado') || '{}');
const asiento = JSON.parse(sessionStorage.getItem('asiento_seleccionado') || '{}');

const basePago: number = vuelo.precioVuelo ?? vuelo.precio ?? 689;

const flightSummary = document.getElementById('flight-summary-info');
if (flightSummary && vuelo.id) {
    const origen = vuelo.aeropuertoOrigen?.ciudad || vuelo.origen || '—';
    const destino = vuelo.aeropuertoDestino?.ciudad || vuelo.destino || '—';
    flightSummary.innerHTML = `<div style="font-weight:600">${origen} → ${destino}</div>
        <div style="font-size:13px;color:var(--gray-500)">Vuelo #${vuelo.id} · ${vuelo.escala ? '1 escala' : 'Directo'}</div>`;
}

const tarifaBaseEl = document.getElementById('tarifa-base');
if (tarifaBaseEl) tarifaBaseEl.textContent = '$' + basePago.toLocaleString('es-AR');

if (asiento.id) {
    const asientoDisplay = document.getElementById('asiento-display');
    const asientoPrecio = document.getElementById('asiento-precio');
    if (asientoDisplay) asientoDisplay.textContent = asiento.id;
    if (asientoPrecio) asientoPrecio.textContent = asiento.precio > 0 ? '+$' + asiento.precio : '$0';
    seatExtra = asiento.precio || 0;
    calcTotal();
}

(window as any).actualizarExtras = function () {
    extras = 0;
    const bodega = (document.getElementById('eq-bodega') as HTMLInputElement)?.checked;
    const extra = (document.getElementById('eq-extra') as HTMLInputElement)?.checked;
    const seguro = (document.getElementById('seguro') as HTMLInputElement)?.checked;
    if (bodega) extras += 45;
    if (extra) extras += 75;
    if (seguro) extras += 29;

    const lines = [['eq-bodega-line', bodega], ['eq-extra-line', extra], ['seguro-line', seguro]];
    lines.forEach(([id, show]) => {
        const el = document.getElementById(id as string);
        if (el) el.style.display = show ? 'flex' : 'none';
    });
    calcTotal();
};

function calcTotal() {
    const total = basePago + seatExtra + extras + impuestos;
    const el = document.getElementById('grand-total');
    if (el) el.textContent = '$' + total.toLocaleString('es-AR');
}

(window as any).formatCard = function (input: HTMLInputElement) {
    let v = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = v.replace(/(.{4})/g, '$1 ').trim();
};

(window as any).formatExpiry = function (input: HTMLInputElement) {
    let v = input.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
    input.value = v;
};

(window as any).confirmarPago = async function () {
    const nombre = (document.getElementById('nombre') as HTMLInputElement)?.value?.trim();
    const emailEl = (document.getElementById('email') as HTMLInputElement)?.value?.trim();
    const cuil = (document.getElementById('cuil') as HTMLInputElement)?.value?.trim() || '';
    const situacionFiscal = (document.getElementById('situacion-fiscal') as HTMLSelectElement)?.value || 'Consumidor Final';
    const metodoPago = (document.getElementById('metodo-pago') as HTMLSelectElement)?.value || 'TARJETA_CREDITO';

    if (!nombre || !emailEl) { showToast('Completá nombre y email', 'warn'); return; }

    const btn = document.getElementById('btn-pagar') as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = '🔒 Procesando...'; }

    try {
        const equipajeId = (document.getElementById('eq-bodega') as HTMLInputElement)?.checked
            ? parseInt((document.getElementById('equipaje-id') as HTMLInputElement)?.value || '0') || null
            : null;

        await apiFetch('/api/compras/confirmar', {
            method: 'POST',
            body: JSON.stringify({
                equipajeId,
                asistenciaId: null,
                cuil,
                situacionFiscal,
                metodoPago: metodoPago.toUpperCase().replace(' ', '_'),
            })
        });

        const codeEl = document.getElementById('booking-code');
        if (codeEl) codeEl.textContent = 'Ver en Mis Reservas';
        document.getElementById('confirm-modal')!.style.display = 'flex';

        sessionStorage.removeItem('vuelo_seleccionado');
        sessionStorage.removeItem('asiento_seleccionado');

    } catch (err: any) {
        showToast(err.message || 'Error al procesar el pago', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '🔒 Confirmar y pagar'; }
    }
};

(window as any).showToast = (msg: string) => showToast(msg);
calcTotal();
