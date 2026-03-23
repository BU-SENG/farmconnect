// signup.js - REFACTORED (uses AuthAPI from api.js)

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
document.getElementById('signupForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>`;
    lucide.createIcons();
    btn.disabled = true;

    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName:  document.getElementById('lastName').value.trim(),
        username:  document.getElementById('usernameInput').value.trim(),
        role:      document.getElementById('userRole').value, // 'farmer', 'buyer', 'transporter'
    };

    try {
        const { user, token } = await AuthAPI.register(formData);
        setSession(user, token);

        // Route by role
        const routes = {
            'Farmer':      'farmersview.html',
            'Transporter': 'logistics.html',
            'Buyer':       'index.html',
        };
        window.location.href = routes[user.role] || 'index.html';

    } catch (err) {
        btn.innerText = originalText;
        btn.disabled = false;
        // You can add an error message element to signup.html to display err.message
        alert('Registration failed: ' + err.message);
    }
});