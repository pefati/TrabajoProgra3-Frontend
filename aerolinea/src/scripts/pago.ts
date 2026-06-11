import { initAuth } from './auth';
// Fetch Navbar
fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('navbar-container')!.innerHTML = html; initAuth();
    });

// Fetch Footer
fetch("/src/components/footer.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById('footer')!.innerHTML = html;
    });

let extras = 0;
const basePago = 689;
const impuestos = 85;
let seatExtra = 0;

// Cargar asiento de session
const asiento = JSON.parse(sessionStorage.getItem('asiento_seleccionado') || '{}');
if (asiento.id) {
  document.getElementById('asiento-display')!.textContent = asiento.id;
  document.getElementById('asiento-precio')!.textContent = asiento.precio > 0 ? '+$' + asiento.precio : '$0';
  seatExtra = asiento.precio || 0;
  calcTotal();
}

(window as any).actualizarExtras = function() {
  extras = 0;
  const bodega = (document.getElementById('eq-bodega') as HTMLInputElement).checked;
  const extra = (document.getElementById('eq-extra') as HTMLInputElement).checked;
  const seguro = (document.getElementById('seguro') as HTMLInputElement).checked;
  if (bodega) extras += 45;
  if (extra) extras += 75;
  if (seguro) extras += 29;
  document.getElementById('eq-bodega-line')!.style.display = bodega ? 'flex' : 'none';
  document.getElementById('eq-extra-line')!.style.display = extra ? 'flex' : 'none';
  document.getElementById('seguro-line')!.style.display = seguro ? 'flex' : 'none';
  calcTotal();
};

function calcTotal() {
  const total = basePago + seatExtra + extras + impuestos;
  document.getElementById('grand-total')!.textContent = '$' + total.toLocaleString('es-AR');
}

(window as any).formatCard = function(input: HTMLInputElement) {
  let v = input.value.replace(/\\D/g,'').substring(0,16);
  input.value = v.replace(/(.{4})/g,'$1 ').trim();
};

(window as any).formatExpiry = function(input: HTMLInputElement) {
  let v = input.value.replace(/\\D/g,'').substring(0,4);
  if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
  input.value = v;
};

(window as any).confirmarPago = function() {
  const nombre = (document.getElementById('nombre') as HTMLInputElement).value;
  const email = (document.getElementById('email') as HTMLInputElement).value;
  if (!nombre || !email) { (window as any).showToast('Completá nombre y email'); return; }

  const code = 'AC-2025-' + Math.floor(1000 + Math.random() * 9000);
  document.getElementById('booking-code')!.textContent = code;

  // Guardar en "base de datos" local
  const reservas = JSON.parse(localStorage.getItem('reservas') || '[]');
  reservas.push({
    codigo: code,
    ruta: 'Buenos Aires → Madrid',
    vuelo: 'AC801',
    fecha: '14 Jul 2025',
    asiento: asiento.id || '—',
    clase: asiento.clase || 'Económica',
    total: basePago + seatExtra + extras + impuestos,
    estado: 'activo',
    pasajero: nombre,
  });
  localStorage.setItem('reservas', JSON.stringify(reservas));

  document.getElementById('confirm-modal')!.style.display = 'flex';
};

(window as any).showToast = function(msg: string) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
};

calcTotal();
