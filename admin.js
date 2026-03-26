// profile.js - CONNECTED TO REAL BACKEND

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
if (!currentUser) window.location.href = 'login.html';

// --- MOBILE MENU ---
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.toggle('-translate-x-full');
});

function logout() { AuthAPI.logout(); }

// --- LOAD REAL PROFILE ---
async function loadProfile() {
    try {
        const profile = await UserAPI.getProfile();

        // Avatar + name
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=a38d6d&color=fff&size=256&font-size=0.4`;
        if (document.getElementById('profileImg'))         document.getElementById('profileImg').src           = avatarUrl;
        if (document.getElementById('profileNameDisplay')) document.getElementById('profileNameDisplay').innerText = profile.name;
        if (document.getElementById('profileRoleDisplay')) document.getElementById('profileRoleDisplay').innerText = profile.role;

        // Contact info
        if (document.getElementById('phoneDisplay'))    document.getElementById('phoneDisplay').innerText    = profile.phone    || 'Not set';
        if (document.getElementById('locationDisplay')) document.getElementById('locationDisplay').innerText = profile.location || 'Not set';

        // Wallet balance
        if (document.getElementById('walletBalance')) document.getElementById('walletBalance').innerText = '₦' + (profile.wallet_balance || 0).toLocaleString();

        // Pre-fill edit inputs
        if (document.getElementById('phoneInput'))    document.getElementById('phoneInput').value    = profile.phone    || '';
        if (document.getElementById('locationInput')) document.getElementById('locationInput').value = profile.location || '';

        // Load order history
        loadOrderHistory();

    } catch (err) {
        console.error('Failed to load profile:', err);
    }
}

// --- REAL ORDER HISTORY ---
async function loadOrderHistory() {
    const container = document.getElementById('orderHistoryContainer');
    if (!container) return;

    try {
        const orders = await OrdersAPI.getMyOrders();

        // Update order count stat
        const countEl = document.getElementById('totalOrdersCount');
        if (countEl) countEl.innerText = orders.length;

        if (orders.length === 0) {
            container.innerHTML = `<div class="text-center py-8 text-gray-500 text-sm">
                No orders yet. <a href="market.html" class="text-agri-500 hover:underline">Browse the market</a>
            </div>`;
            return;
        }

        container.innerHTML = orders.slice(0, 5).map(o => {
            const statusClass = o.status === 'Delivered'  ? 'status-completed'
                              : o.status === 'In Transit' ? 'status-shipped'
                              : 'status-processing';
            return `
                <div class="order-card p-4 rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between gap-4 bg-white dark:bg-transparent">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${o.icon || '📦'}</span>
                        <div>
                            <p class="font-medium text-sm text-gray-900 dark:text-white">${o.item}</p>
                            <p class="text-xs text-gray-500">${o.date}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-gray-900 dark:text-white">₦${o.amount.toLocaleString()}</p>
                        <span class="text-xs px-2 py-0.5 rounded-full ${statusClass}">${o.status}</span>
                    </div>
                </div>`;
        }).join('');

    } catch (err) {
        console.warn('Could not load order history:', err);
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

async function saveProfile() {
    const phone    = document.getElementById('phoneInput')?.value;
    const location = document.getElementById('locationInput')?.value;
    try {
        await UserAPI.updateProfile({ phone, location });
        if (document.getElementById('phoneDisplay'))    document.getElementById('phoneDisplay').innerText    = phone    || 'Not set';
        if (document.getElementById('locationDisplay')) document.getElementById('locationDisplay').innerText = location || 'Not set';
        toggleEditMode();
        showNotification('Profile updated successfully!', 'success');
    } catch (err) {
        showNotification('Update failed: ' + err.message, 'error');
    }
}

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
    setTimeout(() => { notif.classList.add('translate-y-[-100%]'); setTimeout(() => notif.remove(), 300); }, 3000);
}

loadProfile();