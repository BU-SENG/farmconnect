// index.js - FIXED (waits for api.js async init before rendering)

lucide.createIcons();

// --- THEME TOGGLE LOGIC ---
function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('fc_theme', html.classList.contains('dark') ? 'dark' : 'light');
}
const savedTheme = localStorage.getItem('fc_theme');
if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
} else {
    document.documentElement.classList.add('dark');
}

// --- MOBILE MENU ---
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('-translate-x-full');
}

// --- AUTHENTICATION LOGIC ---
const authBtns        = document.getElementById('authBtns');
const userProfile     = document.getElementById('userProfile');
const userNameDisplay = document.getElementById('userNameDisplay');
const userRoleDisplay = document.getElementById('userRoleDisplay');
const dropdownUserName = document.getElementById('dropdownUserName');
const userAvatar      = document.getElementById('userAvatar');
const profileDropdown = document.getElementById('profileDropdown');
const mobileAuthArea  = document.getElementById('mobileAuthArea');

const currentUser = getSession();

if (currentUser && currentUser.isLoggedIn) {
    if (authBtns)    authBtns.style.setProperty('display', 'none', 'important');
    if (userProfile) { userProfile.classList.remove('hidden'); userProfile.style.display = 'flex'; }
    if (userNameDisplay)  userNameDisplay.innerText  = currentUser.name;
    if (userRoleDisplay)  userRoleDisplay.innerText  = currentUser.role || 'Buyer';
    if (dropdownUserName) dropdownUserName.innerText = currentUser.name;

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=a38d6d&color=fff&rounded=true`;
    if (userAvatar) userAvatar.src = avatarUrl;

    if (mobileAuthArea) {
        mobileAuthArea.innerHTML = `
            <button onclick="window.location.href='profile.html'" class="w-9 h-9 rounded-lg overflow-hidden border border-gray-300 dark:border-dark-500">
                <img src="${avatarUrl}" class="w-full h-full object-cover">
            </button>
        `;
    }
} else {
    if (authBtns)    authBtns.style.display = '';
    if (userProfile) userProfile.style.display = 'none';
}

function toggleDropdown() {
    profileDropdown?.classList.toggle('hidden');
}

function logout() {
    AuthAPI.logout();
}

window.onclick = function (event) {
    if (!event.target.closest('#userProfile')) {
        profileDropdown?.classList.add('hidden');
    }
};

// Keyboard shortcut Ctrl/Cmd+K → focus search
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-focus')?.focus();
    }
});

// --- SEARCH ---
document.querySelector('.search-focus')?.addEventListener('input', (e) => {
    const term  = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.card-hover');
    let visible = 0;

    cards.forEach(card => {
        const title    = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const category = card.querySelector('.capitalize')?.textContent.toLowerCase() || '';
        const show     = title.includes(term) || category.includes(term);
        card.style.display = show ? 'block' : 'none';
        if (show) visible++;
    });

    document.getElementById('emptyState')?.classList.toggle('hidden', visible > 0);
});

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
    renderCards(filter);
}

// --- RENDER CARDS ---
function renderCards(filter) {
    const container  = document.getElementById('card-container');
    const emptyState = document.getElementById('emptyState');
    container.innerHTML = '';

    // ✅ THE FIX: use ProductsAPI directly instead of window.products
    // This works whether products are already cached or still loading
    ProductsAPI.getAll(filter === 'all' ? null : filter).then(filtered => {

        if (filtered.length === 0) {
            emptyState?.classList.remove('hidden');
            return;
        }
        emptyState?.classList.add('hidden');

        filtered.forEach((item, index) => {
            const staggerClass = `stagger-${(index % 6) + 1}`;
            const trendIcon    = item.trend === 'up' ? 'trending-up' : 'trending-down';
            const trendClass   = item.trend === 'up' ? 'text-success' : 'text-danger';
            const trendText    = item.trend === 'up' ? 'Rising' : 'Falling';

            const card = document.createElement('div');
            card.className = `card-hover rounded-2xl p-5 cursor-pointer opacity-0 animate-fade-in ${staggerClass}
                bg-white border border-gray-200
                dark:bg-dark-700 dark:border-dark-500`;
            card.onclick = () => window.location.href = `product.html?id=${item.id}`;
            card.innerHTML = `
                <div class="flex items-start gap-4 mb-4">
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0
                        bg-gray-100 dark:bg-gradient-to-br dark:from-dark-600 dark:to-dark-500">
                        ${item.icon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold truncate text-gray-900 dark:text-gray-200">${item.name}</h3>
                        <p class="text-sm text-gray-500">${item.unit}</p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs px-2 py-0.5 rounded-full capitalize
                                bg-gray-100 text-gray-500
                                dark:bg-dark-600 dark:text-gray-400">${item.category}</span>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <div class="price-tag rounded-xl p-3 border border-success/20">
                        <p class="text-xs text-gray-500 mb-1">Buy Now</p>
                        <p class="text-success font-bold text-lg">₦${item.price.toLocaleString()}</p>
                    </div>
                    <div class="offer-tag rounded-xl p-3 border border-danger/20">
                        <p class="text-xs text-gray-500 mb-1">Best Offer</p>
                        <p class="text-danger font-bold text-lg">₦${Math.floor(item.price * 0.95).toLocaleString()}</p>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-500">
                    <div class="flex items-center gap-2 text-sm">
                        <i data-lucide="package" class="w-4 h-4 text-gray-400 dark:text-gray-500"></i>
                        <span class="text-gray-500 dark:text-gray-400">${item.stock} in stock</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-sm ${trendClass}">
                        <i data-lucide="${trendIcon}" class="w-4 h-4"></i>
                        <span class="font-medium">${trendText}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        lucide.createIcons();
    }).catch(() => {
        container.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-100 dark:bg-danger/10">
                    <i data-lucide="alert-circle" class="w-8 h-8 text-red-500 dark:text-danger"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300">Error loading products</h3>
                <p class="text-gray-500 text-sm mt-1">Please refresh the page and try again</p>
            </div>
        `;
        lucide.createIcons();
    });
}

// ✅ THE FIX: call renderCards immediately — ProductsAPI.getAll() handles its own async timing
renderCards('all');