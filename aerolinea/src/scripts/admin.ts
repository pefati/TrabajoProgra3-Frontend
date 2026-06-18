import { initAuth, apiFetch, showToast, isAdmin } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

const cards: { icon: string; title: string; desc: string; link: string; countUrl?: string }[] = [
    { icon: '✈', title: 'Vuelos', desc: 'Crear, editar y gestionar vuelos.', link: 'admin-vuelos.html', countUrl: '/api/vuelos' },
    { icon: '📍', title: 'Aeropuertos', desc: 'Registrar y administrar aeropuertos.', link: 'admin-aeropuertos.html', countUrl: '/api/aeropuertos' },
    { icon: '🛩', title: 'Aviones', desc: 'Gestionar la flota de aviones.', link: 'admin-aviones.html', countUrl: '/api/aviones' },
    { icon: '👥', title: 'Usuarios', desc: 'Listar y cambiar roles de usuarios.', link: 'admin-usuarios.html', countUrl: '/api/auth/usuarios' },
    { icon: '🎫', title: 'Reservas', desc: 'Listar y aceptar reservas.', link: 'admin-reservas.html', countUrl: '/api/reservas' },
];

async function loadCards() {
    const container = document.getElementById('admin-cards');
    if (!container) return;
    for (const c of cards) {
        let count = '';
        if (c.countUrl) {
            try {
                const data = await apiFetch(c.countUrl);
                if (Array.isArray(data)) count = String(data.length);
            } catch { count = '—'; }
        }
        container.innerHTML += `
            <a href="${c.link}" class="admin-dash-card">
                <div class="card-icon">${c.icon}</div>
                <h3>${c.title}</h3>
                <p class="card-desc">${c.desc}</p>
                <div class="card-stat">${count} <span>registrados</span></div>
            </a>`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  if (!isAdmin()) {
    showToast('Acceso denegado', 'error');
    setTimeout(() => window.location.href = 'index.html', 1000);
    return;
  }
  loadCards();
});
