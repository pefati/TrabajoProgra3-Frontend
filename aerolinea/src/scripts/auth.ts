export function initAuth() {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('user_email');

    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    const userEmailSpan = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');
    const adminPanel = document.getElementById('admin-panel');

    if (token && email) {
        if (guestActions) guestActions.style.display = 'none';
        if (userActions) userActions.style.display = 'flex';
        if (userEmailSpan) userEmailSpan.textContent = email;

    } else {
        if (guestActions) guestActions.style.display = 'flex';
        if (userActions) userActions.style.display = 'none';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user_email');
            window.location.href = 'index.html';
        });
    }
}
