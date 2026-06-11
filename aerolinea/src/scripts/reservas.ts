fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('navbar-container')!.innerHTML = html;
    });

fetch("/src/components/footer.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById('footer')!.innerHTML = html;
    });

// Reservas de prueba? + las guardadas
const defaultReservas = [
  { codigo:'AC-2025-4521', ruta:'Buenos Aires → París', vuelo:'AC205', fecha:'22 Ago 2025', asiento:'12B', clase:'Económica', total:890, estado:'activo', pasajero:'Usuario Demo' },
  { codigo:'AC-2025-3198', ruta:'Buenos Aires → Nueva York', vuelo:'AC330', fecha:'10 Sep 2025', asiento:'5A', clase:'Ejecutiva', total:1850, estado:'pendiente', pasajero:'Usuario Demo' },
];

function cargarReservas() {
  const guardadas = JSON.parse(localStorage.getItem('reservas') || '[]');
  return [...defaultReservas, ...guardadas];
}

let todasLasReservas = cargarReservas();
let reservaSeleccionada: string | null = null;

function renderActivas(lista: any[]) {
  const activas = lista.filter(r => r.estado === 'activo' || r.estado === 'pendiente');
  const statActivas = document.getElementById('stat-activas');
  if (statActivas) statActivas.textContent = activas.length.toString();
  
  const container = document.getElementById('booking-list-activas');
  if (!container) return;
  
  if (activas.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--gray-500)">
      <div style="font-size:48px;margin-bottom:16px">✈</div>
      <p style="font-size:18px;font-weight:600;margin-bottom:8px">No tenés reservas activas</p>
      <p style="margin-bottom:20px">¡Empezá a planificar tu próximo viaje!</p>
      <a href="vuelos.html" class="btn btn-primary">Buscar vuelos</a>
    </div>`;
    return;
  }
  
  container.innerHTML = activas.map(r => `
    <div class="booking-card" onclick="verDetalle('${r.codigo}')">
      <div class="booking-status ${r.estado === 'activo' ? 'status-active' : 'status-pending'}"></div>
      <div>
        <div class="booking-route">${r.ruta}</div>
        <div class="booking-details">Vuelo ${r.vuelo} · Asiento ${r.asiento} ${r.clase} · ${r.pasajero}</div>
        <div style="display:inline-block;margin-top:6px;font-size:11px;padding:3px 10px;border-radius:4px;background:${r.estado==='activo'?'#EAF3DE':'#FAEEDA'};color:${r.estado==='activo'?'#3B6D11':'#854F0B'};font-weight:600">
          ${r.estado === 'activo' ? '● Confirmado' : '◌ Pendiente de pago'}
        </div>
      </div>
      <div class="booking-date">
        <div class="booking-date-day">${r.fecha.split(' ')[0]}</div>
        <div class="booking-date-month">${r.fecha.split(' ').slice(1).join(' ')}</div>
      </div>
      <div class="booking-actions">
        <button class="btn btn-primary" style="padding:8px 16px;font-size:12px" onclick="event.stopPropagation();showToast('Descargando boarding pass...')">Check-in</button>
        <button class="btn" style="padding:8px 16px;font-size:12px;border:1px solid var(--white)" onclick="event.stopPropagation();verDetalle('${r.codigo}')">Ver</button>
      </div>
    </div>
  `).join('');
}

(window as any).verDetalle = function(codigo: string) {
  const r = todasLasReservas.find(x => x.codigo === codigo);
  if (!r) return;
  reservaSeleccionada = codigo;
  document.getElementById('modal-ruta')!.textContent = r.ruta;
  document.getElementById('modal-codigo')!.textContent = r.codigo;
  document.getElementById('modal-detalles')!.innerHTML = `
    <div><div style="font-size:11px;color:var(--gray-500);margin-bottom:3px">Vuelo</div><div style="font-weight:600">${r.vuelo}</div></div>
    <div><div style="font-size:11px;color:var(--gray-500);margin-bottom:3px">Fecha</div><div style="font-weight:600">${r.fecha}</div></div>
    <div><div style="font-size:11px;color:var(--gray-500);margin-bottom:3px">Asiento</div><div style="font-weight:600">${r.asiento} · ${r.clase}</div></div>
    <div><div style="font-size:11px;color:var(--gray-500);margin-bottom:3px">Total pagado</div><div style="font-weight:600;color:var(--navy)">$${r.total?.toLocaleString('es-AR')}</div></div>
  `;
  document.getElementById('detail-modal')!.style.display = 'flex';
};

(window as any).closeModal = function() {
  document.getElementById('detail-modal')!.style.display = 'none';
};

(window as any).cancelarReserva = function() {
  if (!confirm('¿Confirmar la cancelación de esta reserva?')) return;
  const guardadas = JSON.parse(localStorage.getItem('reservas') || '[]');
  const nuevas = guardadas.filter((r: any) => r.codigo !== reservaSeleccionada);
  localStorage.setItem('reservas', JSON.stringify(nuevas));
  todasLasReservas = cargarReservas();
  renderActivas(todasLasReservas);
  (window as any).closeModal();
  (window as any).showToast('Reserva cancelada. El reembolso se procesará en 3-5 días hábiles.');
};

(window as any).showTab = function(tab: string, el: HTMLElement) {
  ['activas','pasadas','checkin'].forEach(t => {
    document.getElementById('tab-' + t)!.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.booking-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
};

(window as any).filtrarReservas = function() {
  const input = document.getElementById('search-booking') as HTMLInputElement;
  const q = input.value.toLowerCase();
  const filtradas = q ? todasLasReservas.filter(r =>
    r.codigo.toLowerCase().includes(q) ||
    r.ruta.toLowerCase().includes(q) ||
    r.vuelo.toLowerCase().includes(q) ||
    r.fecha.toLowerCase().includes(q)
  ) : todasLasReservas;
  renderActivas(filtradas);
};

(window as any).hacerCheckin = function() {
  const input = document.getElementById('checkin-code') as HTMLInputElement;
  const codigo = input.value;
  const reserva = todasLasReservas.find(r => r.codigo.toLowerCase() === codigo.toLowerCase());
  if (!reserva) { (window as any).showToast('Código no encontrado. Verificá los datos.'); return; }
  (window as any).showToast('✓ Check-in exitoso para ' + reserva.ruta + ' · Imprimí tu boarding pass.');
};

(window as any).showToast = function(msg: string) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
};

renderActivas(todasLasReservas);
