import { initAuth, showToast, apiFetch } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgot-form') as HTMLFormElement;
    const emailInput = document.getElementById('forgot-email') as HTMLInputElement;
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!email) {
            showToast('Ingresa tu correo electrónico', 'warn');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            await apiFetch('/api/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            showToast('Si el email existe, recibirás un enlace para restablecer tu contraseña.', 'success');
            form.reset();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar enlace';
        }
    });
});
