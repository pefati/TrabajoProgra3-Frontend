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
    const registerForm = document.querySelector('.auth-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('reg-email') as HTMLInputElement;
            const passwordInput = document.getElementById('reg-password') as HTMLInputElement;
            const nameInput = document.getElementById('reg-name') as HTMLInputElement;
            const lastnameInput = document.getElementById('reg-lastname') as HTMLInputElement;

            try {
                // 1. Registro
                const regResponse = await fetch('http://localhost:8080/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: emailInput.value,
                        password: passwordInput.value
                    })
                });

                if (regResponse.ok) {
                    const data = await regResponse.json();
                    const token = data.token;
                    
                    // 2. Completar Perfil
                    await fetch('http://localhost:8080/api/auth/completarPerfil', {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({
                            nombre: nameInput.value,
                            apellido: lastnameInput.value,
                            numeroIdentificador: "00000000",
                            identificador: "DNI",
                            sexo: "MASCULINO",
                            fechaNacimiento: "2000-01-01",
                            telefono: "0000000000"
                        })
                    });

                    // Guardar en local storage y redirigir
                    localStorage.setItem('token', token);
                    localStorage.setItem('user_email', data.email);
                    window.location.href = 'index.html';
                } else {
                    const error = await regResponse.json();
                    alert('Error en registro: ' + (error.message || 'Datos inválidos'));
                }
            } catch (err) {
                console.error(err);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }
});
