import { initAuth, setSession, showToast, apiFetch } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.auth-form') as HTMLFormElement;
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('login-email') as HTMLInputElement).value;
        const password = (document.getElementById('login-password') as HTMLInputElement).value;
        const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
        btn.disabled = true;
        btn.textContent = 'Ingresando...';

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Credenciales incorrectas');
            }

            const data = await res.json();

            let role = '';
            try {
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                role = payload.role || payload.roles?.[0] || '';
            } catch { }

            setSession(data.token, data.email, data.userId, data.perfilCompleto ?? false, role);

            try {
                const perfil = await apiFetch('/api/auth/perfil');
                if (perfil.nombre) {
                    localStorage.setItem('user_nombre', perfil.nombre + ' ' + (perfil.apellido || ''));
                }
                if (perfil.personaId) {
                    localStorage.setItem('persona_id', String(perfil.personaId));
                }
            } catch { }

            if (!data.perfilCompleto) {
                showToast('Completá tu perfil para continuar.', 'warn');
                setTimeout(() => window.location.href = 'perfil.html', 1200);
            } else {
                window.location.href = 'index.html';
            }

        } catch (err: any) {
            showToast(err.message || 'Error al iniciar sesión', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Ingresar';
        }
    });
});
