import { initAuth, apiFetch, showToast } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

async function cargarFacturas() {
    const container = document.getElementById('facturas-list');
    if (container) container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--gray-500)">Cargando facturas...</div>';

    try {
        const data: any[] = await apiFetch('/api/facturas');

        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--gray-500)">
                <div style="font-size:48px;margin-bottom:16px">🧾</div>
                <p style="font-size:18px;font-weight:600;margin-bottom:8px">No tenés facturas</p>
                <p>Las facturas aparecen después de confirmar una compra</p>
            </div>`;
            return;
        }

        container.innerHTML = data.map(f => {
            const fecha = f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString('es-AR') : '—';
            const metodo: Record<string, string> = {
                TARJETA_CREDITO: 'Tarjeta de crédito',
                TARJETA_DEBITO: 'Tarjeta de débito',
                TRANSFERENCIA: 'Transferencia bancaria',
            };
            return `
            <div class="booking-card">
                <div style="flex:1">
                    <div class="booking-route">Factura #${f.id}</div>
                    <div class="booking-details">Reserva #${f.reserva?.id || '—'} · ${metodo[f.metodoDePago] || f.metodoDePago || '—'}</div>
                    <div style="font-size:12px;color:var(--gray-500);margin-top:4px">CUIL: ${f.cuil || f.CUIL || '—'} · ${f.situacionFiscal || '—'}</div>
                </div>
                <div class="booking-date">
                    <div class="booking-date-day">${fecha.split('/')[0]}</div>
                    <div class="booking-date-month">${fecha.split('/').slice(1).join('/')}</div>
                </div>
                <div>
                    <button class="btn btn-dark" style="padding:8px 16px;font-size:12px"
                        onclick="showToastGlobal('Descargando factura #${f.id}...')">Descargar</button>
                </div>
            </div>`;
        }).join('');

    } catch (err: any) {
        if (container) container.innerHTML = `<div style="padding:20px;color:#c0392b;background:#fdf0ee;border-radius:8px">${err.message}</div>`;
    }
}

(window as any).showToastGlobal = (msg: string) => showToast(msg);

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  cargarFacturas();
});
