import { initAuth, apiFetch, showToast, isPerfilCompleto, actualizarContadorCarrito } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

let extras = 0;
let seatExtra = 0;
const impuestos = 85;

let basePago = 0;
let cartItems: any[] = [];

let mpPublicKey: string = '';
let cardFormInstance: any = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  if (!isPerfilCompleto()) {
    showToast('Completá tu perfil antes de continuar', 'warn');
    setTimeout(() => window.location.href = 'perfil.html', 1500);
    return;
  }

  await cargarDatosCarrito();
  restaurarFormulario();
  calcTotal();
  await fetchPublicKey();
  initCardForm();
});

async function cargarDatosCarrito() {
  try {
    const carrito = await apiFetch('/api/carrito');
    if (!carrito.items || carrito.items.length === 0) {
      showToast('El carrito está vacío', 'warn');
      setTimeout(() => window.location.href = 'carrito.html', 1500);
      return;
    }

    const itemsConDetalle = await Promise.all(carrito.items.map(async (item: any) => {
      try {
        const v = await fetch('/api/vuelos/' + item.vueloId).then(r => r.json());
        return { ...item, vuelo: v };
      } catch { return { ...item, vuelo: null }; }
    }));

    cartItems = itemsConDetalle;
    basePago = itemsConDetalle.reduce((sum: number, item: any) => {
      return sum + (item.vuelo?.precioVuelo ?? 0) * item.cantidad;
    }, 0);

    const flightSummary = document.getElementById('flight-summary-info');
    if (flightSummary) {
      if (itemsConDetalle.length === 1) {
        const item = itemsConDetalle[0];
        const v = item.vuelo;
        const origen = v?.aeropuertoOrigen?.ciudad || '—';
        const destino = v?.aeropuertoDestino?.ciudad || '—';
        flightSummary.innerHTML = `<div style="font-weight:600">${origen} → ${destino}</div>
            <div style="font-size:13px;color:var(--gray-500)">Vuelo #${v?.id} · ${v?.escala ? '1 escala' : 'Directo'} · ${item.cantidad} pasaje(s)</div>`;
      } else {
        let html = '<div style="font-weight:600;margin-bottom:8px">Resumen del carrito</div>';
        itemsConDetalle.forEach((item: any) => {
          const v = item.vuelo;
          const origen = v?.aeropuertoOrigen?.ciudad || '—';
          const destino = v?.aeropuertoDestino?.ciudad || '—';
          html += `<div style="font-size:13px;color:var(--gray-500)">• ${origen} → ${destino} × ${item.cantidad} pasaje(s) — $${((v?.precioVuelo ?? 0) * item.cantidad).toLocaleString('es-AR')}</div>`;
        });
        flightSummary.innerHTML = html;
      }
    }

    const tarifaBaseEl = document.getElementById('tarifa-base');
    if (tarifaBaseEl) tarifaBaseEl.textContent = '$' + basePago.toLocaleString('es-AR');
  } catch (err: any) {
    showToast(err.message || 'Error al cargar carrito', 'error');
  }
}

const asientosSeleccionados: { id: string; clase: string; precio: number }[] = JSON.parse(sessionStorage.getItem('asientos_seleccionados') || '[]');
if (asientosSeleccionados.length > 0) {
  seatExtra = asientosSeleccionados.reduce((sum, s) => sum + (s.precio || 0), 0);
  document.addEventListener('DOMContentLoaded', () => {
    const asientoDisplay = document.getElementById('asiento-display');
    const asientoPrecio = document.getElementById('asiento-precio');
    if (asientoDisplay) asientoDisplay.textContent = asientosSeleccionados.length + ' asientos';
    if (asientoPrecio) asientoPrecio.textContent = seatExtra > 0 ? '+$' + seatExtra.toLocaleString('es-AR') : '$0';
  });
}

async function fetchPublicKey() {
  try {
    const data = await apiFetch('/api/mercadopago/public-key', { method: 'GET' });
    mpPublicKey = data.publicKey;
  } catch {
    showToast('Error al inicializar Mercado Pago', 'error');
  }
}

function getTotal(): number {
  return basePago + seatExtra + extras + impuestos;
}

function initCardForm() {
  if (!mpPublicKey) return;
  const formEl = document.getElementById('mp-card-form');
  if (!formEl) return;

  const mp = new (window as any).MercadoPago(mpPublicKey);

  cardFormInstance = mp.cardForm({
    amount: getTotal().toString(),
    autoMount: true,
    form: {
      id: 'mp-card-form',
      cardNumber: { id: 'cardNumber', placeholder: 'Número de tarjeta' },
      cardholderName: { id: 'cardholderName', placeholder: 'Titular' },
      expirationDate: { id: 'expirationDate', placeholder: 'MM/AA' },
      securityCode: { id: 'securityCode', placeholder: 'CVV' },
      installments: { id: 'installments' },
      identificationType: { id: 'docType' },
      identificationNumber: { id: 'docNumber', placeholder: 'Documento' },
      issuer: { id: 'issuer', placeholder: 'Banco emisor' },
    },
    callbacks: {
      onFormMounted: (error: any) => {
        if (error) showToast('Error al montar el formulario de pago', 'error');
      },
      onSubmit: (event: Event) => {
        event.preventDefault();
        procesarPago();
      },
      onBinChange: (bin: string) => {
        if (!bin || bin.length < 6) return;
        mp.getIssuers({ bin })
          .then((issuers: any[]) => {
            const select = document.getElementById('issuer') as HTMLSelectElement;
            if (!select) return;
            select.innerHTML = '<option value="">Banco emisor</option>';
            issuers.forEach((iss: any) => {
              const opt = document.createElement('option');
              opt.value = iss.id;
              opt.textContent = iss.name;
              select.appendChild(opt);
            });
          })
          .catch(() => {});
        mp.getInstallments({
          amount: getTotal().toString(),
          bin,
          locale: 'es-AR',
        })
          .then((data: any) => {
            const select = document.getElementById('installments') as HTMLSelectElement;
            if (!select || !data?.[0]?.payer_costs) return;
            select.innerHTML = '';
            data[0].payer_costs.forEach((c: any) => {
              const opt = document.createElement('option');
              opt.value = c.installments;
              opt.textContent = c.recommended_message || c.installments + ' cuotas';
              select.appendChild(opt);
            });
          })
          .catch(() => {});
      },
    },
  });
}

async function procesarPago() {
  if (!cardFormInstance) return;

  const btn = document.getElementById('btn-pagar') as HTMLButtonElement;
  const errorEl = document.getElementById('mp-card-error') as HTMLDivElement;
  const loadingEl = document.getElementById('mp-loading') as HTMLDivElement;

  if (errorEl) errorEl.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'block';
  if (btn) { btn.disabled = true; btn.style.display = 'none'; }

  try {
    const token = await cardFormInstance.createCardToken();
    const cardData = cardFormInstance.getCardFormData();

    const cuil = (document.getElementById('cuil') as HTMLInputElement)?.value?.trim() || '';
    const situacionFiscal = (document.getElementById('situacion-fiscal') as HTMLSelectElement)?.value || 'Consumidor Final';

    let equipajeId: number | null = null;
    const bodega = (document.getElementById('eq-bodega') as HTMLInputElement)?.checked;
    const extra = (document.getElementById('eq-extra') as HTMLInputElement)?.checked;
    if (bodega) equipajeId = 1;
    else if (extra) equipajeId = 2;

    const result = await apiFetch('/api/mercadopago/procesar-pago', {
      method: 'POST',
      body: JSON.stringify({
        token: token.id,
        amount: getTotal(),
        installments: parseInt(cardData?.installments || '1'),
        paymentMethodId: cardData?.paymentMethodId || null,
        issuerId: cardData?.issuerId || null,
        payerEmail: (document.getElementById('email') as HTMLInputElement)?.value?.trim() || '',
        payerDocType: cardData?.identificationType || 'DNI',
        payerDocNumber: cardData?.identificationNumber || '',
        equipajeId,
        asistenciaId: null,
        cuil,
        situacionFiscal,
      }),
    });

    if (result.status === 'approved') {
      sessionStorage.removeItem('vuelo_seleccionado');
      sessionStorage.removeItem('asientos_seleccionados');
      ['nombre','apellido','email','telefono','cuil','situacionFiscal','eqBodega','eqExtra','seguro'].forEach(k => sessionStorage.removeItem('pago_' + k));

      await actualizarContadorCarrito();

      const codeEl = document.getElementById('booking-code');
      if (codeEl) codeEl.textContent = result.bookingCode || 'AC-' + Date.now().toString(36).toUpperCase();
      document.getElementById('confirm-modal')!.style.display = 'flex';
    } else {
      throw new Error(result.message || 'El pago fue rechazado. Verificá los datos e intentá de nuevo.');
    }
  } catch (err: any) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = err.message || 'Error al procesar el pago';
    }
    if (loadingEl) loadingEl.style.display = 'none';
    if (btn) { btn.disabled = false; btn.style.display = 'flex'; }
  }
}

function guardarFormulario() {
  const campos = ['nombre', 'apellido', 'email', 'telefono', 'cuil'];
  campos.forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) sessionStorage.setItem('pago_' + id, el.value);
  });
  const sf = (document.getElementById('situacion-fiscal') as HTMLSelectElement)?.value;
  if (sf) sessionStorage.setItem('pago_situacionFiscal', sf);
}

function restaurarFormulario() {
  const campos = ['nombre', 'apellido', 'email', 'telefono', 'cuil'];
  campos.forEach(id => {
    const val = sessionStorage.getItem('pago_' + id);
    if (val) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.value = val;
    }
  });
  const sf = sessionStorage.getItem('pago_situacionFiscal');
  if (sf) {
    const el = document.getElementById('situacion-fiscal') as HTMLSelectElement | null;
    if (el) el.value = sf;
  }
}

document.addEventListener('input', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('#cuil, #nombre, #apellido, #email, #telefono, #situacion-fiscal')) {
    guardarFormulario();
  }
});

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
    const btnTotal = document.getElementById('total-pagar');
    if (btnTotal) btnTotal.textContent = total.toLocaleString('es-AR');
}
