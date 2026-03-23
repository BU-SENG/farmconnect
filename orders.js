// orders.js - REFACTORED (uses OrdersAPI from api.js)

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

// --- AUTH CHECK ---
const currentUser = getSession();
if (!currentUser) window.location.href = 'login.html';

// --- MOBILE MENU ---
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('-translate-x-full');
});

function logout() {
    AuthAPI.logout();
}

// --- STATUS BADGE HELPER ---
function getStatusBadge(status) {
    const s = status.toLowerCase();
    if (s.includes('transit'))   return { class: 'transit',   label: 'In Transit' };
    if (s.includes('delivered')) return { class: 'delivered', label: 'Delivered' };
    if (s.includes('cancelled')) return { class: 'cancelled', label: 'Cancelled' };
    return { class: 'transit', label: 'Processing' };
}

// --- RENDER ---
async function renderOrders() {
    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = `
        <tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-agri-500 dark:border-gold-400 mx-auto"></div>
        </td></tr>
    `;

    try {
        const myOrders = await OrdersAPI.getMyOrders();
        tableBody.innerHTML = '';

        if (myOrders.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    You haven't placed any orders yet.
                    <a href="market.html" class="text-agri-500 hover:underline">Go Shopping</a>
                </td></tr>
            `;
            return;
        }

        myOrders.forEach(order => {
            const badge = getStatusBadge(order.status);
            tableBody.innerHTML += `
                <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5">
                    <td class="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">${order.id}</td>
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">${order.icon || '📦'}</span>
                            ${order.item}
                        </div>
                    </td>
                    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">${order.date}</td>
                    <td class="px-6 py-4 text-gray-900 dark:text-white font-bold">₦${order.amount.toLocaleString()}</td>
                    <td class="px-6 py-4">
                        <span class="status-badge ${badge.class}">${badge.label}</span>
                    </td>
                    <td class="px-6 py-4">
                        <button class="text-agri-600 hover:text-agri-700 dark:text-gold-400 dark:hover:text-white transition-colors text-xs font-medium">View Details</button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        tableBody.innerHTML = `
            <tr><td colspan="6" class="px-6 py-8 text-center text-danger">
                Failed to load orders. Please refresh.
            </td></tr>
        `;
    }
}

renderOrders();