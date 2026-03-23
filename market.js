// market.js - FIXED (calls ProductsAPI directly, no window.products race condition)

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

// --- MOBILE MENU ---
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('-translate-x-full');
}

// --- AUTH CHECK ---
const currentUser = getSession();
if (!currentUser || !currentUser.isLoggedIn) {
    window.location.href = 'login.html';
}

const isFarmer = currentUser.role.toLowerCase() === 'farmer';

// --- ROLE-BASED UI ---
if (isFarmer) {
    document.getElementById('farmerMobileNav')?.classList.remove('hidden');
    document.getElementById('farmerDesktopNav')?.classList.remove('hidden');
    if (document.getElementById('pageTitle'))      document.getElementById('pageTitle').innerText      = "Farmer Market Insights - FarmConnect";
    if (document.getElementById('headerSubtitle')) document.getElementById('headerSubtitle').innerText = "Competitor prices and trends";
    if (document.getElementById('priceStatText'))  document.getElementById('priceStatText').innerText  = "Live Prices";
    if (document.getElementById('dropdownProfileLink')) {
        document.getElementById('dropdownProfileLink').innerHTML = `<i data-lucide="user" class="w-4 h-4"></i> Farm Profile`;
        document.getElementById('dropdownProfileLink').href = 'farmerviewprofile.html';
    }
} else {
    document.getElementById('buyerMobileNav')?.classList.remove('hidden');
    document.getElementById('buyerDesktopNav')?.classList.remove('hidden');
    if (document.getElementById('pageTitle'))      document.getElementById('pageTitle').innerText      = "FarmConnect - Market Insights";
    if (document.getElementById('headerSubtitle')) document.getElementById('headerSubtitle').innerText = "price trends and predictions";
    if (document.getElementById('priceStatText'))  document.getElementById('priceStatText').innerText  = "Prices";
}

// --- PROFILE AREA ---
document.getElementById('authBtns')?.style.setProperty('display', 'none', 'important');
const userProfileEl = document.getElementById('userProfile');
if (userProfileEl) { userProfileEl.classList.remove('hidden'); userProfileEl.style.display = 'flex'; }

if (document.getElementById('userNameDisplay'))  document.getElementById('userNameDisplay').innerText  = currentUser.name;
if (document.getElementById('userRoleDisplay'))  document.getElementById('userRoleDisplay').innerText  = currentUser.role || 'Buyer';
if (document.getElementById('dropdownUserName')) document.getElementById('dropdownUserName').innerText = currentUser.name;

const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=a38d6d&color=fff&rounded=true`;
if (document.getElementById('userAvatar')) document.getElementById('userAvatar').src = avatarUrl;

const mobileProfileLink = isFarmer ? 'farmerviewprofile.html' : 'profile.html';
const mobileAuthArea    = document.getElementById('mobileAuthArea');
if (mobileAuthArea) {
    mobileAuthArea.innerHTML = `
        <button onclick="window.location.href='${mobileProfileLink}'" class="w-9 h-9 rounded-lg overflow-hidden border border-gray-300 dark:border-dark-500">
            <img src="${avatarUrl}" class="w-full h-full object-cover">
        </button>
    `;
}

function toggleDropdown() {
    document.getElementById('profileDropdown')?.classList.toggle('hidden');
}

function logout() { AuthAPI.logout(); }

window.onclick = function (event) {
    if (!event.target.closest('#userProfile')) {
        document.getElementById('profileDropdown')?.classList.add('hidden');
    }
};

document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
    }
});

// --- SPARKLINE GENERATOR ---
function generateSparkline(trend, values = [30, 50, 80, 40, 90, 60, 85]) {
    const color = trend === 'up' ? '#4ecca3' : '#e85d75';
    const min   = Math.min(...values);
    const max   = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * 100;
        const y = 100 - ((v - min) / range) * 80 - 10;
        return `${x},${y}`;
    }).join(' ');

    return `
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
            <polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="sparkline"/>
            <defs>
                <linearGradient id="grad-${trend}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <polygon points="0,100 ${points} 100,100" fill="url(#grad-${trend})"/>
        </svg>
    `;
}

function getStockBadge(stock) {
    const num = parseInt(stock) || (stock === 'High' ? 100 : 0);
    if (num > 500 || stock === 'High' || stock === 'Abundant') return { text: 'High',   class: 'bg-success/10 text-success border-success/20' };
    if (num > 100 || stock === 'Medium')                       return { text: 'Medium', class: 'bg-gold-500/10 text-gold-400 border-gold-500/20' };
    return { text: 'Low', class: 'bg-danger/10 text-danger border-danger/20' };
}

const categoryIcons = { grains: 'wheat', tubers: 'circle-dot', vegetables: 'carrot', oils: 'droplet', fruits: 'apple' };

// --- FILTER ---
let currentFilter = 'all';

function setFilter(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.remove('active');
        pill.classList.add('text-gray-600', 'bg-gray-100', 'hover:text-gray-900', 'hover:bg-gray-200', 'dark:text-gray-400', 'dark:bg-dark-700');
    });
    btn.classList.add('active');
    btn.classList.remove('text-gray-600', 'bg-gray-100', 'hover:text-gray-900', 'hover:bg-gray-200', 'dark:text-gray-400', 'dark:bg-dark-700');
    renderTable(filter);
}

// --- RENDER TABLE ---
// ✅ THE FIX: calls ProductsAPI.getAll() directly — no window.products dependency
function renderTable(filter) {
    const tbody        = document.getElementById('marketTableBody');
    const emptyState   = document.getElementById('emptyState');
    const totalProducts = document.getElementById('totalProducts');
    tbody.innerHTML    = '';

    // Show loading state while fetching
    tbody.innerHTML = `
        <tr><td colspan="5" class="py-12 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-500 dark:border-gold-400 mx-auto"></div>
        </td></tr>
    `;

    ProductsAPI.getAll(filter === 'all' ? null : filter).then(filtered => {
        tbody.innerHTML = '';
        if (totalProducts) totalProducts.innerText = filtered.length;

        if (filtered.length === 0) {
            emptyState?.classList.remove('hidden');
            return;
        }
        emptyState?.classList.add('hidden');

        filtered.forEach((product, index) => {
            const staggerClass = `stagger-${(index % 8) + 1}`;
            const trendIcon    = product.trend === 'up' ? 'trending-up' : 'trending-down';
            const trendClass   = product.trend === 'up' ? 'text-success' : 'text-danger';
            const trendBg      = product.trend === 'up' ? 'bg-success/10' : 'bg-danger/10';
            const stockBadge   = getStockBadge(product.stock);
            const catIcon      = categoryIcons[product.category] || 'package';

            const row = document.createElement('tr');
            row.className = `table-row border-b cursor-pointer opacity-0 animate-fade-in ${staggerClass}
                bg-white border-gray-100 hover:bg-agri-500/05
                dark:bg-transparent dark:border-dark-500/50 dark:hover:bg-gold-500/05`;
            row.onclick = () => window.location.href = `product.html?id=${product.id}`;

            row.innerHTML = `
                <td class="py-4 px-6">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gray-100 text-gray-600 dark:bg-gradient-to-br dark:from-dark-600 dark:to-dark-500 dark:text-gray-200">
                            ${product.icon}
                        </div>
                        <div>
                            <p class="font-medium text-gray-900 dark:text-gray-200">${product.name}</p>
                            <div class="flex items-center gap-2 mt-0.5">
                                <i data-lucide="${catIcon}" class="w-3 h-3 text-gray-400 dark:text-gray-500"></i>
                                <span class="text-xs text-gray-500 capitalize">${product.category}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <p class="text-lg font-bold text-gray-900 dark:text-gray-200">₦${product.price.toLocaleString()}</p>
                    <p class="text-xs text-gray-500">per ${product.unit || 'unit'}</p>
                </td>
                <td class="py-4 px-6 hidden md:table-cell">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${stockBadge.class}">
                        <div class="w-1.5 h-1.5 rounded-full ${stockBadge.text === 'High' ? 'bg-success' : stockBadge.text === 'Medium' ? 'bg-gold-400' : 'bg-danger'}"></div>
                        ${stockBadge.text} Stock
                    </span>
                    <p class="text-xs text-gray-500 mt-1">${product.stock} units</p>
                </td>
                <td class="py-4 px-6 hidden lg:table-cell">
                    <div class="w-28 h-12">${generateSparkline(product.trend)}</div>
                </td>
                <td class="py-4 px-6">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${trendBg} ${trendClass}">
                        <i data-lucide="${trendIcon}" class="w-4 h-4"></i>
                        ${product.trend === 'up' ? '+5.2%' : '-3.8%'}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });

        lucide.createIcons();

    }).catch(() => {
        tbody.innerHTML = `
            <tr><td colspan="5" class="py-20 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-100 dark:bg-danger/10">
                    <i data-lucide="alert-circle" class="w-8 h-8 text-red-500 dark:text-danger"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300">Error loading data</h3>
                <p class="text-gray-500 text-sm mt-1">Please refresh the page and try again</p>
            </td></tr>
        `;
        lucide.createIcons();
    });
}

// --- SEARCH ---
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.table-row');
    let visible = 0;

    rows.forEach(row => {
        const name     = row.querySelector('td:first-child p.font-medium')?.textContent.toLowerCase() || '';
        const category = row.querySelector('td:first-child span.capitalize')?.textContent.toLowerCase() || '';
        const show     = name.includes(term) || category.includes(term);
        row.style.display = show ? 'table-row' : 'none';
        if (show) visible++;
    });

    document.getElementById('emptyState')?.classList.toggle('hidden', visible > 0);
});

// ✅ Render immediately — ProductsAPI handles its own async
renderTable('all');