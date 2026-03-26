// farmersview.js - CONNECTED TO REAL BACKEND

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
    window.location.href = 'index.html';
}

// --- MOBILE MENU ---
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('-translate-x-full');
});

function logout() { AuthAPI.logout(); }

function toggleDropdown() {
    document.getElementById('profileDropdown')?.classList.toggle('hidden');
}

// --- POPULATE HEADER ---
async function populateHeader() {
    try {
        const profile = await UserAPI.getProfile();
        const nameEl   = document.getElementById('userNameDisplay');
        const avatarEl = document.getElementById('userAvatar');
        if (nameEl)   nameEl.innerText = profile.name;
        if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=a38d6d&color=fff&rounded=true`;
    } catch (err) {
        console.warn('Could not load profile:', err);
        // Fallback to session data
        const nameEl   = document.getElementById('userNameDisplay');
        const avatarEl = document.getElementById('userAvatar');
        if (nameEl && currentUser)   nameEl.innerText = currentUser.name;
        if (avatarEl && currentUser) avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=a38d6d&color=fff&rounded=true`;
    }
}

// --- LOAD DASHBOARD STATS FROM REAL ORDERS ---
async function loadDashboardStats() {
    try {
        const orders = await OrdersAPI.getFarmerOrders();

        // Calculate real stats from actual order data
        const totalRevenue   = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.amount, 0);
        const activeOrders   = orders.filter(o => o.status === 'Processing' || o.status === 'In Transit').length;
        const completedOrders = orders.filter(o => o.status === 'Delivered').length;
        const totalOrders    = orders.length;

        // Update stat cards if they exist on the page
        const revEl     = document.getElementById('statRevenue');
        const activeEl  = document.getElementById('statActiveOrders');
        const totalEl   = document.getElementById('statTotalOrders');
        const doneEl    = document.getElementById('statCompleted');

        if (revEl)    revEl.innerText    = '₦' + totalRevenue.toLocaleString();
        if (activeEl) activeEl.innerText = activeOrders;
        if (totalEl)  totalEl.innerText  = totalOrders;
        if (doneEl)   doneEl.innerText   = completedOrders;

        // Render recent orders table if it exists
        renderRecentOrders(orders.slice(0, 5));

    } catch (err) {
        console.warn('Could not load dashboard stats:', err);
        // Show zeros rather than fake data
        ['statRevenue','statActiveOrders','statTotalOrders','statCompleted'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = id === 'statRevenue' ? '₦0' : '0';
        });
    }
}

function renderRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">
                No orders yet. Share your listings to get started.
            </td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(o => {
        const statusColor = o.status === 'Delivered'  ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                          : o.status === 'In Transit' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                          : o.status === 'Cancelled'  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                          :                             'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
        return `
            <tr class="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                <td class="px-4 py-3 text-xs text-gray-500">${o.id}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${o.item}</td>
                <td class="px-4 py-3 text-sm text-gray-500">${o.buyer || '—'}</td>
                <td class="px-4 py-3 text-sm text-gray-500">${o.date}</td>
                <td class="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">₦${o.amount.toLocaleString()}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">${o.status}</span>
                </td>
            </tr>`;
    }).join('');
}

// Start
populateHeader();
loadDashboardStats();