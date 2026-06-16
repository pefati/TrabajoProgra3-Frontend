import { initAuth, setSession, showToast } from './auth';

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
        const email = (document.getElementById('reg-email') as HTMLInputElement).value;
        const password = (document.getElementById('reg-password') as HTMLInputElement).value;
        const terms = (document.getElementById('terms') as HTMLInputElement).checked;

        if (!terms) { showToast('Debés aceptar los términos', 'warn'); return; }

        const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
        btn.disabled = true;
        btn.textContent = 'Creando cuenta...';

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Error en registro');
            }

            showToast('Cuenta creada. Revisá tu email para verificar tu cuenta.', 'success');
            setTimeout(() => window.location.href = 'index.html', 3000);

        } catch (err: any) {
            showToast(err.message || 'Error al registrarse', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Registrarme';
        }
    });
});
