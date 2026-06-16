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
            if (form.dataset.step === '2fa') {
                const code = (document.getElementById('login-2fa') as HTMLInputElement).value;
                const reqEmail = form.dataset.email;
                
                const res = await fetch('/api/auth/verify-2fa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email: reqEmail, code })
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || 'Código incorrecto');
                }

                const data = await res.json();
                await completeLogin(data);
                return;
            }

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Credenciales incorrectas');
            }

            const data = await res.json();

            if (data.requires2fa) {
                document.getElementById('login-email')!.parentElement!.style.display = 'none';
                document.getElementById('login-password')!.parentElement!.style.display = 'none';
                document.getElementById('group-2fa')!.style.display = 'block';
                form.dataset.step = '2fa';
                form.dataset.email = data.email;
                btn.textContent = 'Verificar Código';
                btn.disabled = false;
                showToast('Se ha enviado un código a tu email', 'success');
                return;
            }

            await completeLogin(data);

        } catch (err: any) {
            showToast(err.message || 'Error al iniciar sesión', 'error');
        } finally {
            if (form.dataset.step !== '2fa') {
                btn.disabled = false;
                btn.textContent = 'Ingresar';
            }
        }
    });

    async function completeLogin(data: any) {
        let role = '';
        try {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            role = payload.role || payload.roles?.[0] || '';
        } catch { }

        setSession(data.token, data.email, data.userId, data.perfilCompleto ?? false, role);

        if (!data.perfilCompleto) {
            showToast('Completá tu perfil para continuar.', 'warn');
            setTimeout(() => window.location.href = 'perfil.html', 1200);
        } else {
            window.location.href = 'index.html';
        }
    }

});