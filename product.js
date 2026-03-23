// product.js - FIXED (uses ProductsAPI.getById() async, no window.products race condition)

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

// --- USER ROLE ---
const currentUser = getSession();
const isFarmer    = currentUser && currentUser.role.toLowerCase() === 'farmer';

// --- BACK LINK ---
const backLink = document.getElementById('backLink');
const backText = document.getElementById('backText');
if (isFarmer) {
    backLink.href       = 'market.html';
    backText.innerText  = 'Back to Market Tracker';
} else {
    backLink.href       = 'market.html';
    backText.innerText  = 'Back to Market';
}

// --- FETCH & RENDER ---
const params    = new URLSearchParams(window.location.search);
const productId = params.get('id');
const container = document.getElementById('productContent');

async function loadProduct() {
    try {
        const product = await ProductsAPI.getById(productId);

        if (!product) {
            renderNotFound();
            return;
        }

        renderProduct(product);

    } catch (err) {
        renderNotFound();
    }
}

function renderNotFound() {
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-100 dark:bg-danger/10">
                <i data-lucide="alert-circle" class="w-10 h-10 text-red-500 dark:text-danger"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
            <p class="text-gray-500 mb-6">The item you are looking for might have been removed or does not exist.</p>
            <a href="market.html" class="px-6 py-3 rounded-xl transition-colors font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-white">
                Return to Directory
            </a>
        </div>
    `;
    lucide.createIcons();
}

function renderProduct(product) {
    const price   = product.price;
    const sellers = [
        { name: isFarmer ? 'Verified Farmer (Avg. Rate)' : 'Verified Farmer', loc: product.location || 'Farm Hub', price: price,                  score: '4.9', verified: true },
        { name: 'Local Aggregator',                                             loc: 'Regional Center',              price: price + (price * 0.05),  score: '4.7', verified: true },
        { name: 'Market Reseller',                                              loc: 'City Market',                  price: price + (price * 0.15),  score: '4.5', verified: false },
    ];

    const verifiedBadgeHTML = isFarmer
        ? `<i data-lucide="activity" class="w-4 h-4 text-blue-500"></i> Market Insight Data`
        : `<i data-lucide="shield-check" class="w-4 h-4 text-success"></i> Verified Quality`;

    const dealLabel   = isFarmer ? 'MARKET AVERAGE'     : 'RECOMMENDED DEAL';
    const offersLabel = isFarmer ? 'Competitor Insights' : 'More Offers';

    const actionButtonsHTML = isFarmer
        ? `<div class="text-center md:text-right mt-2">
               <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-gray-400 border border-gray-200 dark:border-dark-600">
                   <i data-lucide="eye" class="w-4 h-4"></i> View Only Mode
               </span>
               <p class="text-[10px] text-gray-400 mt-2">Farmers cannot purchase goods.</p>
           </div>`
        : `<button onclick="window.location.href='checkout.html?id=${product.id}'"
                class="w-full py-3.5 px-6 font-bold rounded-xl transform hover:-translate-y-0.5 transition-all shadow-lg flex items-center justify-center gap-2
                       bg-gradient-to-r from-agri-500 to-agri-600 text-white shadow-agri-500/20 hover:from-agri-400 hover:to-agri-500
                       dark:from-gold-500 dark:to-gold-600 dark:text-dark-900 dark:shadow-gold-500/20 dark:hover:from-gold-400 dark:hover:to-gold-500">
               <i data-lucide="shopping-cart" class="w-5 h-5"></i> Buy Now
           </button>
           <button onclick="window.location.href='chat.html?id=${product.id}&seller=${encodeURIComponent(sellers[0].name)}'"
                class="w-full py-3.5 px-6 font-medium rounded-xl border transition-colors flex items-center justify-center gap-2
                       bg-white text-gray-700 border-gray-300 hover:bg-gray-50
                       dark:bg-dark-700 dark:text-white dark:border-dark-500 dark:hover:bg-dark-600">
               <i data-lucide="message-circle" class="w-5 h-5"></i> Negotiate
           </button>`;

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-1 space-y-6">
                <div class="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div class="absolute inset-0 pointer-events-none bg-gradient-to-b from-agri-500/5 dark:from-gold-500/5 to-transparent"></div>
                    <div class="text-9xl mb-6 transform hover:scale-110 transition-transform duration-300 cursor-default">${product.icon}</div>
                    <div class="flex flex-wrap justify-center gap-2 mb-4">
                        <span class="tag-badge px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider text-agri-600 dark:text-gold-400 border-agri-200 dark:border-gold-500/20">${product.category}</span>
                        <span class="tag-badge px-3 py-1 rounded-full text-xs font-medium text-success uppercase tracking-wider">Fresh Harvest</span>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm">${product.desc || 'Fresh produce directly from the farm.'}</p>
                </div>

                <div class="glass-panel rounded-2xl p-6">
                    <h3 class="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <i data-lucide="bar-chart-2" class="w-4 h-4"></i> Market Stats
                    </h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center p-3 rounded-xl bg-gray-100 dark:bg-dark-800/50">
                            <span class="text-gray-500 dark:text-gray-400 text-sm">Availability</span>
                            <span class="font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                                <div class="w-2 h-2 rounded-full bg-success"></div> ${product.stock} Stock
                            </span>
                        </div>
                        <div class="flex justify-between items-center p-3 rounded-xl bg-gray-100 dark:bg-dark-800/50">
                            <span class="text-gray-500 dark:text-gray-400 text-sm">Location</span>
                            <span class="font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                                <i data-lucide="map-pin" class="w-3 h-3 text-agri-500 dark:text-gold-400"></i> ${product.location || 'Nigeria'}
                            </span>
                        </div>
                        <div class="flex justify-between items-center p-3 rounded-xl bg-gray-100 dark:bg-dark-800/50">
                            <span class="text-gray-500 dark:text-gray-400 text-sm">Market Trend</span>
                            <span class="font-medium flex items-center gap-1 ${product.trend === 'up' ? 'text-success' : 'text-danger'}">
                                <i data-lucide="${product.trend === 'up' ? 'trending-up' : 'trending-down'}" class="w-4 h-4"></i>
                                ${product.trend === 'up' ? 'Rising' : product.trend === 'down' ? 'Falling' : 'Stable'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-2 space-y-6">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-gray-200 dark:border-dark-500">
                    <div>
                        <h1 class="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">${product.name}</h1>
                        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            ${verifiedBadgeHTML}
                            <span class="w-1 h-1 rounded-full bg-gray-400 dark:bg-dark-500"></span>
                            <span>${product.unit}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">${isFarmer ? 'Average Market Price' : 'Best Price'}</p>
                        <p class="text-3xl font-bold text-agri-600 dark:text-gold-400">₦${price.toLocaleString()}</p>
                    </div>
                </div>

                <div class="featured-border p-6 relative overflow-hidden group">
                    <div class="absolute top-0 right-0 text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg bg-gradient-to-l from-agri-500 to-agri-600 text-white dark:from-gold-500 dark:to-gold-600 dark:text-dark-900">
                        ${dealLabel}
                    </div>
                    <div class="flex flex-col md:flex-row gap-6 items-center">
                        <div class="flex-1 w-full">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold border bg-white text-agri-600 border-agri-200 dark:bg-dark-700 dark:text-gold-400 dark:border-gold-500/20">
                                    ${sellers[0].name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 class="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                                        ${sellers[0].name}
                                        <i data-lucide="badge-check" class="w-5 h-5 fill-current text-agri-500 dark:text-gold-400"></i>
                                    </h3>
                                    <div class="flex items-center gap-3 text-sm">
                                        <span class="text-gray-500 dark:text-gray-400">${sellers[0].loc}</span>
                                        <span class="w-1 h-1 rounded-full bg-gray-400 dark:bg-dark-500"></span>
                                        <span class="text-success flex items-center gap-1">
                                            <i data-lucide="star" class="w-3 h-3 fill-current"></i> ${sellers[0].score}/5.0
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div class="p-2 rounded-lg text-center bg-gray-100 dark:bg-dark-800/50">
                                    <p class="text-gray-500 text-xs">Delivery</p>
                                    <p class="font-medium text-gray-900 dark:text-white">2-4 Days</p>
                                </div>
                                <div class="p-2 rounded-lg text-center bg-gray-100 dark:bg-dark-800/50">
                                    <p class="text-gray-500 text-xs">Stock</p>
                                    <p class="font-medium text-gray-900 dark:text-white">${product.stock}</p>
                                </div>
                            </div>
                        </div>
                        <div class="w-full md:w-auto flex flex-col gap-3 min-w-[200px]">
                            <div class="text-center md:text-right mb-2">
                                <span class="text-2xl font-bold text-gray-900 dark:text-white">₦${sellers[0].price.toLocaleString()}</span>
                                <span class="text-gray-500 text-sm">/${product.unit}</span>
                            </div>
                            ${actionButtonsHTML}
                        </div>
                    </div>
                </div>

                <div class="pt-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${offersLabel} (${sellers.length - 1})</h3>
                    </div>
                    <div class="space-y-3">
                        ${sellers.slice(1).map(s => `
                            <div class="seller-card glass-panel rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border bg-white border-gray-200 dark:bg-transparent dark:border-white/5">
                                <div class="flex items-center gap-4 w-full sm:w-auto">
                                    <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400">
                                        ${s.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 class="font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                                            ${s.name}
                                            ${s.verified ? '<i data-lucide="badge-check" class="w-4 h-4 text-blue-400 fill-current"></i>' : ''}
                                        </h4>
                                        <p class="text-xs text-gray-500">${s.loc} • <span class="text-agri-500 dark:text-gold-400">★ ${s.score}</span></p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                    <div class="text-right">
                                        <p class="font-bold text-lg text-gray-900 dark:text-white">₦${Math.floor(s.price).toLocaleString()}</p>
                                        <p class="text-xs text-gray-500">per unit</p>
                                    </div>
                                    ${!isFarmer ? `<button class="px-4 py-2 text-sm font-medium rounded-lg transition-colors border bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-white dark:border-dark-600">View Offer</button>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// Start
loadProduct();