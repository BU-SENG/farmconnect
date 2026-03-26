// farmervieworders.js - CONNECTED TO REAL BACKEND

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
    window.location.href = 'orders.html';
}

// --- MOBILE MENU ---
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.toggle('-translate-x-full');
});

function logout() { AuthAPI.logout(); }

// --- LOAD REAL ORDERS ---
async function loadFarmerOrders() {
    const container = document.getElementById('ordersContainer') || document.querySelector('tbody');
    if (!container) return;

    // Show loading state
    const isTable = container.tagName === 'TBODY';
    container.innerHTML = isTable
        ? `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">
               <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-agri-500 dark:border-gold-400 mx-auto"></div>
           </td></tr>`
        : `<div class="text-center py-8 text-gray-400">Loading orders...</div>`;

    try {
        const orders = await OrdersAPI.getFarmerOrders();

        // Update summary counts
        const totalEl     = document.getElementById('totalOrdersCount');
        const activeEl    = document.getElementById('activeOrdersCount');
        const completedEl = document.getElementById('completedOrdersCount');
        const revenueEl   = document.getElementById('totalRevenueCount');

        if (totalEl)     totalEl.innerText     = orders.length;
        if (activeEl)    activeEl.innerText     = orders.filter(o => o.status === 'Processing' || o.status === 'In Transit').length;
        if (completedEl) completedEl.innerText  = orders.filter(o => o.status === 'Delivered').length;
        if (revenueEl)   revenueEl.innerText    = '₦' + orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + o.amount, 0).toLocaleString();

        if (orders.length === 0) {
            container.innerHTML = isTable
                ? `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No orders received yet.</td></tr>`
                : `<div class="text-center py-12 text-gray-500"><p class="font-medium">No orders yet</p><p class="text-sm mt-1">Orders placed for your products will appear here.</p></div>`;
            return;
        }

        if (isTable) {
            container.innerHTML = orders.map(o => {
                const badge = o.status === 'Delivered'  ? 'delivered'
                            : o.status === 'In Transit' ? 'transit'
                            : o.status === 'Cancelled'  ? 'cancelled' : 'transit';
                return `
                    <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5">
                        <td class="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">${o.id}</td>
                        <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            <div class="flex items-center gap-2">
                                <span class="text-lg">${o.icon || '📦'}</span>${o.item}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-gray-500 dark:text-gray-400">${o.buyer || '—'}</td>
                        <td class="px-6 py-4 text-gray-500 dark:text-gray-400">${o.date}</td>
                        <td class="px-6 py-4 text-gray-900 dark:text-white font-bold">₦${o.amount.toLocaleString()}</td>
                        <td class="px-6 py-4"><span class="status-badge ${badge}">${o.status}</span></td>
                    </tr>`;
            }).join('');
        } else {
            container.innerHTML = orders.map(o => `
                <div class="glass-panel p-4 rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${o.icon || '📦'}</span>
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white text-sm">${o.item}</p>
                            <p class="text-xs text-gray-500">Buyer: ${o.buyer || '—'} · ${o.date}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-gray-900 dark:text-white">₦${o.amount.toLocaleString()}</p>
                        <p class="text-xs text-gray-500 mt-1">${o.status}</p>
                    </div>
                </div>`).join('');
        }

    } catch (err) {
        container.innerHTML = isTable
            ? `<tr><td colspan="6" class="px-6 py-8 text-center text-danger">Failed to load orders. Please refresh.</td></tr>`
            : `<div class="text-center py-8 text-danger">Failed to load orders. Please refresh.</div>`;
    }
}

loadFarmerOrders();