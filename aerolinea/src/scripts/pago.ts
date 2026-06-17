import { initAuth, apiFetch, showToast, isPerfilCompleto } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

let extras = 0;
let seatExtra = 0;
const impuestos = 85;

const vuelo = JSON.parse(sessionStorage.getItem('vuelo_seleccionado') || '{}');
const asiento = JSON.parse(sessionStorage.getItem('asiento_seleccionado') || '{}');

const basePago: number = vuelo.precioVuelo ?? vuelo.precio ?? 689;

let mpPublicKey: string = '';
let cardFormInstance: any = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  if (!isPerfilCompleto()) {
    showToast('Completá tu perfil antes de continuar', 'warn');
    setTimeout(() => window.location.href = 'perfil.html', 1500);
    return;
  }

  restaurarFormulario();

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

  calcTotal();

  await fetchPublicKey();
  initCardForm();
});

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
      sessionStorage.removeItem('asiento_seleccionado');
      ['nombre','apellido','email','telefono','cuil','situacionFiscal','eqBodega','eqExtra','seguro'].forEach(k => sessionStorage.removeItem('pago_' + k));

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
