// farmerviewprofile.js - CONNECTED TO REAL BACKEND

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

// --- AUTH ---
const currentUser = getSession();
if (!currentUser) {
    window.location.href = 'login.html';
} else if (currentUser.role.toLowerCase() !== 'farmer') {
    window.location.href = 'profile.html';
}

// --- MOBILE MENU ---
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.toggle('-translate-x-full');
});

function logout() { AuthAPI.logout(); }

// --- LOAD REAL PROFILE ---
async function loadProfile() {
    try {
        const profile = await UserAPI.getProfile();

        // Avatar
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=a38d6d&color=fff&size=256&font-size=0.4`;
        const imgEl = document.getElementById('profileImg');
        if (imgEl) imgEl.src = avatarUrl;

        // Name
        const nameEl = document.getElementById('profileNameDisplay');
        if (nameEl) nameEl.innerText = profile.name;

        // Username
        const userEl = document.getElementById('usernameDisplay');
        if (userEl) userEl.innerText = '@' + profile.username;

        // Verification badge
        const verifiedEl = document.getElementById('verifiedBadge');
        if (verifiedEl) {
            verifiedEl.innerHTML = profile.is_verified
                ? `<span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 flex items-center gap-1">
                       <i data-lucide="shield-check" class="w-3 h-3"></i> Verified Farm
                   </span>`
                : `<span class="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 flex items-center gap-1">
                       <i data-lucide="clock" class="w-3 h-3"></i> Pending Verification
                   </span>`;
            lucide.createIcons();
        }

        // Contact info — view mode
        const phoneDisplay    = document.getElementById('phoneDisplay');
        const locationDisplay = document.getElementById('locationDisplay');
        if (phoneDisplay)    phoneDisplay.innerText    = profile.phone    || 'Not set';
        if (locationDisplay) locationDisplay.innerText = profile.location || 'Not set';

        // Pre-fill edit inputs
        const phoneInput    = document.getElementById('phoneInput');
        const locationInput = document.getElementById('locationInput');
        if (phoneInput)    phoneInput.value    = profile.phone    || '';
        if (locationInput) locationInput.value = profile.location || '';

        // Load order stats for this farmer
        loadFarmerStats();

    } catch (err) {
        console.error('Failed to load profile:', err);
        showNotification('Could not load profile data', 'error');
    }
}

// --- LOAD STATS FROM REAL ORDERS ---
async function loadFarmerStats() {
    try {
        const orders = await OrdersAPI.getFarmerOrders();
        const delivered = orders.filter(o => o.status === 'Delivered');

        const soldEl    = document.getElementById('statSold');
        const revenueEl = document.getElementById('statRevenue');
        const listEl    = document.getElementById('statListings');

        if (soldEl)    soldEl.innerText    = delivered.length;
        if (revenueEl) revenueEl.innerText = '₦' + delivered.reduce((s, o) => s + o.amount, 0).toLocaleString();

        // Product count from real listings
        if (listEl) {
            const products = await ProductsAPI.getAll();
            const myListings = products.filter(p => p.seller_id === currentUser.id || p.seller_id === currentUser.username);
            listEl.innerText = myListings.length;
        }
    } catch (err) {
        console.warn('Could not load farmer stats:', err);
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
        if (document.getElementById('phoneDisplay'))    document.getElementById('phoneDisplay').innerText    = phone || 'Not set';
        if (document.getElementById('locationDisplay')) document.getElementById('locationDisplay').innerText = location || 'Not set';
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
    notif.innerHTML = `<div class="flex items-center gap-2">
        <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-5 h-5"></i>
        <span class="font-medium">${message}</span>
    </div>`;
    document.body.appendChild(notif);
    lucide.createIcons();
    setTimeout(() => notif.classList.remove('translate-y-[-100%]'), 100);
    setTimeout(() => {
        notif.classList.add('translate-y-[-100%]');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Start
loadProfile();