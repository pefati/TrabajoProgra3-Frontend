import { initAuth } from './auth';

// Fetch Navbar
fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('navbar-container')!.innerHTML = html;
        initAuth();
    });

// Fetch Footer
fetch("/src/components/footer.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById('footer')!.innerHTML = html;
    });

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.auth-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('login-email') as HTMLInputElement;
            const passwordInput = document.getElementById('login-password') as HTMLInputElement;
            
            try {
                const response = await fetch('http://localhost:8080/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: emailInput.value,
                        password: passwordInput.value
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user_email', data.email);
                    window.location.href = 'index.html'; // Redirigir a inicio
                } else {
                    const error = await response.json();
                    alert('Error en login: ' + (error.message || 'Credenciales incorrectas'));
                }
            } catch (err) {
                console.error(err);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }
});
