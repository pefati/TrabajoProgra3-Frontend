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

// Navbar scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// Tabs
(window as any).setTab = function(el: HTMLElement, tipo: string) {
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const vueltaGroup = document.getElementById('fecha-vuelta-group');
    if (vueltaGroup) vueltaGroup.style.display = tipo === 'solo-ida' ? 'none' : '';
};

// Swap aeropuertos
(window as any).swapAirports = function() {
    const o = document.getElementById('origen') as HTMLInputElement;
    const d = document.getElementById('destino') as HTMLInputElement;
    if (o && d) {
        [o.value, d.value] = [d.value, o.value];
    }
};

// Buscar vuelos
(window as any).buscarVuelos = function(e: Event) {
    e.preventDefault();
    const dest = (document.getElementById('destino') as HTMLInputElement).value;
    if (!dest.trim()) { (window as any).showToast('Por favor ingresá un destino'); return; }
    const params = new URLSearchParams({
        origen: (document.getElementById('origen') as HTMLInputElement).value,
        destino: dest,
        fechaIda: (document.getElementById('fecha-ida') as HTMLInputElement).value,
        fechaVuelta: (document.getElementById('fecha-vuelta') as HTMLInputElement).value,
        pasajeros: (document.getElementById('pasajeros') as HTMLSelectElement).value,
        clase: (document.getElementById('clase') as HTMLSelectElement).value,
    });
    window.location.href = 'vuelos.html?' + params.toString();
};

(window as any).irADestino = function(ciudad: string) {
    const d = document.getElementById('destino') as HTMLInputElement;
    if (d) {
        d.value = ciudad;
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    (window as any).showToast('Destino seleccionado: ' + ciudad);
};

(window as any).showToast = function(msg: string) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
};

// Fechas mínimas
const hoy = new Date().toISOString().split('T')[0];
const fechaIda = document.getElementById('fecha-ida') as HTMLInputElement;
const fechaVuelta = document.getElementById('fecha-vuelta') as HTMLInputElement;

if (fechaIda) fechaIda.min = hoy;
if (fechaVuelta) fechaVuelta.min = hoy;

if (fechaIda) {
    fechaIda.addEventListener('change', function() {
        if (fechaVuelta) fechaVuelta.min = fechaIda.value;
    });
}
