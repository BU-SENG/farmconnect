// login.js - REFACTORED (uses AuthAPI from api.js)

lucide.createIcons();

// --- THEME TOGGLE ---
function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('fc_theme', html.classList.contains('dark') ? 'dark' : 'light');
}
if (localStorage.getItem('fc_theme') === 'light') {
    document.documentElement.classList.remove('dark');
} else {
    document.documentElement.classList.add('dark');
}

// --- FORM SUBMISSION ---
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.toLowerCase().trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    const btn      = this.querySelector('button[type="submit"]');

    // Loading state
    const originalText = btn.innerText;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>`;
    lucide.createIcons();
    btn.disabled = true;

    try {
        const { user, token } = await AuthAPI.login(username, password);

        // Persist session
        setSession(user, token);

        // Route by role
        const routes = {
            'Farmer':      'farmersview.html',
            'Admin':       'admin.html',
            'Buyer':       'index.html',
            'Transporter': 'logistics.html',
        };
        window.location.href = routes[user.role] || 'index.html';

    } catch (err) {
        errorMsg.classList.remove('hidden');
        btn.innerText = originalText;
        btn.disabled = false;

        const card = document.querySelector('.glass-panel');
        card.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => card.style.animation = '', 500);
    }
});