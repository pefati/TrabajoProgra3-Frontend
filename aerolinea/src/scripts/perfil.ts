git import { initAuth, apiFetch, showToast, requireAuth, isPerfilCompleto, setSession, getToken } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

if (!requireAuth()) { throw new Error('not authenticated'); }

const perfilCompleto = isPerfilCompleto();

async function cargarPerfil() {
    try {
        const data = await apiFetch('/api/auth/perfil');
        if (data.personaId) localStorage.setItem('persona_id', String(data.personaId));
        (document.getElementById('p-nombre') as HTMLInputElement).value = data.nombre || '';
        (document.getElementById('p-apellido') as HTMLInputElement).value = data.apellido || '';
        (document.getElementById('p-email') as HTMLInputElement).value = data.email || '';
        (document.getElementById('p-telefono') as HTMLInputElement).value = data.telefono || '';
        (document.getElementById('p-dni') as HTMLInputElement).value = data.numeroIdentificador || '';
        if (data.fechaNacimiento) (document.getElementById('p-nacimiento') as HTMLInputElement).value = data.fechaNacimiento;
        const sexoSel = document.getElementById('p-sexo') as HTMLSelectElement;
        if (sexoSel && data.sexo) sexoSel.value = data.sexo;
        const idSel = document.getElementById('p-identificador') as HTMLSelectElement;
        if (idSel && data.identificador) idSel.value = data.identificador;

        const banner = document.getElementById('perfil-banner');
        if (banner) banner.style.display = perfilCompleto ? 'none' : 'flex';
    } catch (err: any) {
        showToast('Error al cargar el perfil: ' + err.message, 'error');
    }
}

const form = document.getElementById('perfil-form') as HTMLFormElement;
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        const body = {
            nombre: (document.getElementById('p-nombre') as HTMLInputElement).value,
            apellido: (document.getElementById('p-apellido') as HTMLInputElement).value,
            telefono: (document.getElementById('p-telefono') as HTMLInputElement).value,
            numeroIdentificador: (document.getElementById('p-dni') as HTMLInputElement).value,
            identificador: (document.getElementById('p-identificador') as HTMLSelectElement).value,
            sexo: (document.getElementById('p-sexo') as HTMLSelectElement).value,
            fechaNacimiento: (document.getElementById('p-nacimiento') as HTMLInputElement).value,
        };

        try {
            const endpoint = perfilCompleto ? '/api/auth/perfil' : '/api/auth/completarPerfil';
            const method = perfilCompleto ? 'PUT' : 'PUT';
            const res = await apiFetch(endpoint, { method, body: JSON.stringify(body) });

            if (res?.token) {
                const email = localStorage.getItem('user_email') || '';
                const userId = parseInt(localStorage.getItem('user_id') || '0');
                setSession(res.token, email, userId, true, 'ROLE_USUARIO');
                localStorage.setItem('user_role', 'ROLE_USUARIO');
            }

            localStorage.setItem('perfil_completo', 'true');
            showToast('Perfil actualizado correctamente ✓');
            setTimeout(() => window.location.href = 'index.html', 1200);

        } catch (err: any) {
            showToast(err.message || 'Error al guardar el perfil', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Guardar cambios';
        }
    });
}

cargarPerfil();
