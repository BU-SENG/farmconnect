// farmerviewprofile.js - REFACTORED (uses UserAPI from api.js)

lucide.createIcons();

// --- THEME ---
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

// --- AUTH & SECURITY ---
const currentUser = getSession();
if (!currentUser) {
    window.location.href = 'login.html';
} else if (currentUser.role.toLowerCase() !== 'farmer') {
    window.location.href = 'profile.html'; // Redirect buyers to their own profile
}

// --- MOBILE MENU ---
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('-translate-x-full');
});

// --- LOAD PROFILE ---
async function loadProfile() {
    try {
        const profile = await UserAPI.getProfile();

        document.getElementById('profileNameDisplay').innerText = profile.name;
        document.getElementById('profileImg').src =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=a38d6d&color=fff&size=256&font-size=0.4`;

        const phoneDisplay    = document.getElementById('phoneDisplay');
        const locationDisplay = document.getElementById('locationDisplay');
        if (phoneDisplay)    phoneDisplay.innerText    = profile.phone    || 'Not set';
        if (locationDisplay) locationDisplay.innerText = profile.location || 'Not set';

        // Pre-fill edit inputs
        const phoneInput    = document.getElementById('phoneInput');
        const locationInput = document.getElementById('locationInput');
        if (phoneInput)    phoneInput.value    = profile.phone    || '';
        if (locationInput) locationInput.value = profile.location || '';

    } catch (err) {
        console.error('Failed to load farmer profile:', err);
    }
}

// --- EDIT MODE ---
let isEditMode = false;

function toggleEditMode() {
    isEditMode = !isEditMode;
    document.querySelectorAll('.view-mode').forEach(el  => el.classList.toggle('hidden', isEditMode));
    document.querySelectorAll('.edit-input').forEach(el => el.classList.toggle('hidden', !isEditMode));
    document.getElementById('editBtn')?.classList.toggle('hidden', isEditMode);
    document.getElementById('saveBtn')?.classList.toggle('hidden', !isEditMode);
}

// --- SAVE PROFILE ---
async function saveProfile() {
    const phone    = document.getElementById('phoneInput')?.value;
    const location = document.getElementById('locationInput')?.value;

    try {
        await UserAPI.updateProfile({ phone, location });

        if (document.getElementById('phoneDisplay'))    document.getElementById('phoneDisplay').innerText    = phone;
        if (document.getElementById('locationDisplay')) document.getElementById('locationDisplay').innerText = location;

        toggleEditMode();
        showNotification('Farm Profile updated successfully!', 'success');
    } catch (err) {
        showNotification('Update failed: ' + err.message, 'error');
    }
}

// --- TOAST ---
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-[-100%] ${
        type === 'success' ? 'bg-success text-black' : 'bg-danger text-white'
    }`;
    notif.innerHTML = `
        <div class="flex items-center gap-2">
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-5 h-5"></i>
            <span class="font-medium">${message}</span>
        </div>
    `;
    document.body.appendChild(notif);
    lucide.createIcons();
    setTimeout(() => notif.classList.remove('translate-y-[-100%]'), 100);
    setTimeout(() => {
        notif.classList.add('translate-y-[-100%]');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// --- LOGOUT ---
function logout() { AuthAPI.logout(); }

// Start
loadProfile();