import { initAuth, showToast, setSession } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const loadingState = document.getElementById('loading-state');
    const successState = document.getElementById('success-state');
    const errorState = document.getElementById('error-state');
    const errorMsg = document.getElementById('error-msg');

    if (!token) {
        loadingState!.style.display = 'none';
        errorState!.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`/api/auth/verify?token=${token}`, {
            method: 'GET',
            credentials: 'include'
        });

        loadingState!.style.display = 'none';

        if (response.ok) {
            const data = await response.json();
            let role = '';
            try {
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                role = payload.role || payload.roles?.[0] || '';
            } catch { }

            setSession(data.token, data.email, data.userId, data.perfilCompleto ?? false, role);

            successState!.style.display = 'block';
            
            setTimeout(() => {
                window.location.href = 'perfil.html';
            }, 5000);
        } else {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'El enlace es inválido o ya fue usado.');
        }
    } catch (err: any) {
        loadingState!.style.display = 'none';
        errorState!.style.display = 'block';
        errorMsg!.textContent = err.message;
        showToast(err.message, 'error');
    }
});
