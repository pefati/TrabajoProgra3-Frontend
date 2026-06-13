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

let vuelosActuales: any[] = [];

function renderFlights(lista: any[]) {
    const container = document.getElementById('flight-list');
    const countEl = document.getElementById('count');
    if (countEl) countEl.textContent = lista.length.toString();
    
    if (container) {
        container.innerHTML = lista.map(v => `
            <div class="flight-card" onclick="seleccionarVuelo(${v.id})" id="fc-${v.id}">
            <div>
                <div class="flight-airline">${v.aerolinea || 'AeroCielo'}</div>
                <div class="flight-route">
                <div>
                    <div class="flight-time">${new Date(v.fechaSalida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <div class="flight-city">${v.origen}</div>
                </div>
                <div class="flight-line">
                    <div class="flight-duration">Dir.</div>
                    <div class="flight-line-bar"></div>
                    <div class="flight-stops direct">Directo</div>
                </div>
                <div>
                    <div class="flight-time">${new Date(v.fechaLlegada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <div class="flight-city">${v.destino}</div>
                </div>
                </div>
            </div>
            <div class="flight-class">
                <div class="flight-class-name">Económica</div>
                <div class="flight-price">$${v.precio?.toLocaleString('es-AR') || '0'}</div>
                <div class="flight-price-label">por persona</div>
            </div>
            <div>
                <button class="btn btn-primary" onclick="event.stopPropagation();elegirVuelo(${v.id})">Elegir →</button>
            </div>
            </div>
        `).join('');
    }
}

(window as any).seleccionarVuelo = function(id: number) {
  document.querySelectorAll('.flight-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('fc-' + id)?.classList.add('selected');
};

(window as any).elegirVuelo = function(id: number) {
  const v = vuelosActuales.find(x => x.id === id);
  if (v) {
      sessionStorage.setItem('vuelo_seleccionado', JSON.stringify(v));
      window.location.href = 'asientos.html';
  }
};

(window as any).sortFlights = function(criterio: string) {
  if (criterio === 'precio') vuelosActuales.sort((a,b) => a.precio - b.precio);
  if (criterio === 'duracion') vuelosActuales.sort((a,b) => new Date(a.fechaLlegada).getTime() - new Date(a.fechaSalida).getTime() - (new Date(b.fechaLlegada).getTime() - new Date(b.fechaSalida).getTime()));
  if (criterio === 'salida') vuelosActuales.sort((a,b) => new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime());
  renderFlights(vuelosActuales);
};

(window as any).filtrarDirectos = function() {
  renderFlights(vuelosActuales);
};
(window as any).filtrarManana = function() { renderFlights(vuelosActuales); };
(window as any).filtrarBaratos = function() {
  const filtrados = vuelosActuales.filter(v => v.precio < 800);
  renderFlights(filtrados);
};

(window as any).swapAirports = function() {
  const o = document.getElementById('origen') as HTMLInputElement;
  const d = document.getElementById('destino') as HTMLInputElement;
  if (o && d) {
      [o.value, d.value] = [d.value, o.value];
  }
};

(window as any).actualizarBusqueda = function(e: Event) {
  e.preventDefault();
  fetchVuelos();
  (window as any).showToast('Búsqueda actualizada');
};

(window as any).showToast = function(msg: string) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
};

const params = new URLSearchParams(window.location.search);
const destInput = document.getElementById('destino') as HTMLInputElement;
const origInput = document.getElementById('origen') as HTMLInputElement;
const idaInput = document.getElementById('fecha-ida') as HTMLInputElement;

if (params.get('destino') && destInput) destInput.value = params.get('destino')!;
if (params.get('origen') && origInput) origInput.value = params.get('origen')!;
if (params.get('fechaIda') && idaInput) idaInput.value = params.get('fechaIda')!;

const hoy = new Date().toISOString().split('T')[0];
if (idaInput) {
    idaInput.min = hoy;
    if (!idaInput.value) idaInput.value = hoy;
}

function fetchVuelos() {
    let url = 'api/vuelos';
    
    // Si queremos usar /filtrar, armamos los params
    const origenBusqueda = origInput?.value || '';
    const destinoBusqueda = destInput?.value || '';
    
    if (origenBusqueda || destinoBusqueda) {
        // Asumimos un formato básico para extraer ciudad del string "Buenos Aires (EZE)"
        const oCiudad = origenBusqueda.split('(')[0].trim();
        const dCiudad = destinoBusqueda.split('(')[0].trim();
        
        const searchParams = new URLSearchParams();
        if (oCiudad) searchParams.append('origen', oCiudad);
        if (dCiudad) searchParams.append('destino', dCiudad);
        
        url = 'api/vuelos/filtrar?' + searchParams.toString();
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            vuelosActuales = data;
            renderFlights(vuelosActuales);
        })
        .catch(err => {
            console.error('Error fetching vuelos:', err);
            (window as any).showToast('Error cargando vuelos del servidor');
        });
}

fetchVuelos();
