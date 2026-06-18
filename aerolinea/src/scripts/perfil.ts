import { initAuth, apiFetch, showToast, isPerfilCompleto, isLoggedIn, setSession } from './auth';

fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('navbar-container')!.innerHTML = html; initAuth(); });

fetch('/src/components/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer')!.innerHTML = html; });

async function cargarPerfil() {
    try {
        const data = await apiFetch('/api/auth/perfil');
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
        if (banner) banner.style.display = isPerfilCompleto() ? 'none' : 'flex';

        const twofaEmail = document.getElementById('twofa-email') as HTMLInputElement;
        if (twofaEmail) {
            twofaEmail.checked = data.twoFactorEnabled || false;
            twofaEmail.addEventListener('change', async () => {
                try {
                    const res = await apiFetch('/api/auth/toggle-2fa', { method: 'POST' });
                    showToast(res || 'Preferencia de 2FA actualizada', 'success');
                } catch (err: any) {
                    showToast('Error al actualizar 2FA: ' + err.message, 'error');
                    twofaEmail.checked = !twofaEmail.checked;
                }
            });
        }
        
        if (data.isVerified === false) {
            const warningHtml = `<div style="margin-top: 10px; padding: 10px; background: rgba(255, 0, 0, 0.2); border-radius: 5px; border: 1px solid red; color: white;">
                <strong>⚠️ Cuenta no verificada:</strong> Revisa tu email para verificarla. No podrás reservar ni comprar vuelos hasta que lo hagas.
            </div>`;
            const header = document.querySelector('.auth-header');
            if (header) header.insertAdjacentHTML('afterend', warningHtml);
        }
    } catch (err: any) {
        showToast('Error al cargar el perfil: ' + err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  const nacimientoInput = document.getElementById('p-nacimiento') as HTMLInputElement;
  if (nacimientoInput) nacimientoInput.max = new Date().toISOString().split('T')[0];

  cargarPerfil();

  const form = document.getElementById('perfil-form') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nombre = (document.getElementById('p-nombre') as HTMLInputElement).value.trim();
      const apellido = (document.getElementById('p-apellido') as HTMLInputElement).value.trim();
      const telefono = (document.getElementById('p-telefono') as HTMLInputElement).value.trim();
      const dni = (document.getElementById('p-dni') as HTMLInputElement).value.trim();
      const sexo = (document.getElementById('p-sexo') as HTMLSelectElement).value;
      const nacimiento = (document.getElementById('p-nacimiento') as HTMLInputElement).value;

      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(nombre)) { showToast('El nombre solo puede contener letras y espacios.', 'error'); return; }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(apellido)) { showToast('El apellido solo puede contener letras y espacios.', 'error'); return; }
      if (!telefono) { showToast('El teléfono es obligatorio.', 'error'); return; }
      if (!dni || !/^\d+$/.test(dni)) { showToast('El número de documento solo puede contener dígitos.', 'error'); return; }
      if (!sexo) { showToast('Seleccioná un género.', 'error'); return; }
      if (!nacimiento) { showToast('La fecha de nacimiento es obligatoria.', 'error'); return; }
      if (new Date(nacimiento) >= new Date()) { showToast('La fecha de nacimiento debe ser anterior a hoy.', 'error'); return; }

      const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      const body = { nombre, apellido, telefono, numeroIdentificador: dni, identificador: (document.getElementById('p-identificador') as HTMLSelectElement).value, sexo, fechaNacimiento: nacimiento };

      try {
        const endpoint = isPerfilCompleto() ? '/api/auth/perfil' : '/api/auth/completarPerfil';
        const res = await apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) });

        if (res?.token) {
          setSession(res.token, res.email || '', res.userId || 0, true, res.role || 'ROLE_USUARIO');
        }
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
});
