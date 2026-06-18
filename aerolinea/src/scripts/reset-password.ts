import { initAuth, showToast, apiFetch } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const formContainer = document.getElementById('reset-form-container');
    const successDiv = document.getElementById('reset-success');
    const errorDiv = document.getElementById('reset-error');
    const errorMsg = document.getElementById('reset-error-msg');

    if (!token) {
        if (formContainer) formContainer.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'block';
        if (errorMsg) errorMsg.textContent = 'Token no proporcionado.';
        return;
    }

    (document.getElementById('reset-token') as HTMLInputElement).value = token;
    if (formContainer) formContainer.style.display = 'block';

    const form = document.getElementById('reset-form') as HTMLFormElement;
    const passwordInput = document.getElementById('reset-password') as HTMLInputElement;
    const confirmInput = document.getElementById('reset-confirm') as HTMLInputElement;
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = passwordInput.value;
        const confirmPassword = confirmInput.value;

        if (newPassword.length < 6) {
            showToast('La contraseña debe tener al menos 6 caracteres', 'warn');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Las contraseñas no coinciden', 'warn');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Restableciendo...';

        try {
            await apiFetch('/api/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, newPassword })
            });
            if (formContainer) formContainer.style.display = 'none';
            if (successDiv) successDiv.style.display = 'block';
        } catch (err: any) {
            if (err.message.includes('expirado') || err.message.includes('inválido')) {
                if (formContainer) formContainer.style.display = 'none';
                if (errorDiv) errorDiv.style.display = 'block';
                if (errorMsg) errorMsg.textContent = err.message;
            } else {
                showToast(err.message, 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Restablecer';
        }
    });
});
