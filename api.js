// api.js - FARMCONNECT API SERVICE LAYER
// ============================================================
// This is the single source of truth for all backend communication.
// When the backend is ready, ONLY this file needs to change.
//
// HOW TO SWITCH FROM MOCK TO REAL BACKEND:
//   1. Change BASE_URL to your Render deployment URL
//   2. Set USE_MOCK = false
//   3. Done. Every page inherits real data automatically.
// ============================================================

const BASE_URL = 'https://farmconnect-backend-qv19.onrender.com/api';
const USE_MOCK = false;

// ============================================================
// SECTION 1: TOKEN / AUTH HELPERS
// ============================================================

function getToken() {
    return localStorage.getItem('fc_token');
}

function setSession(userData, token) {
    localStorage.setItem('fc_user', JSON.stringify(userData));
    if (token) localStorage.setItem('fc_token', token);
}

function clearSession() {
    localStorage.removeItem('fc_user');
    localStorage.removeItem('fc_token');
}

function getSession() {
    const raw = localStorage.getItem('fc_user');
    return raw ? JSON.parse(raw) : null;
}

// ============================================================
// SECTION 2: CORE HTTP HELPER
// ============================================================

async function apiFetch(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(err.message || `HTTP ${response.status}`);
    }

    return response.json();
}

// ============================================================
// SECTION 3: AUTH API
// ============================================================

const AuthAPI = {
    /**
     * Login with username and password.
     * @returns { user: { name, role, username, isLoggedIn }, token }
     */
    async login(username, password) {
        if (USE_MOCK) {
            // --- MOCK LOGIC (replaces hardcoded checks in login.js / logisticslogin.js) ---
            await _mockDelay(800);
            const credentials = {
                'farmer':    { name: 'Farmer John',          role: 'Farmer' },
                'buyer':     { name: 'Buyer Sarah',          role: 'Buyer' },
                'admin':     { name: 'System Administrator', role: 'Admin' },
                'logistics': { name: 'Driver Adewale',       role: 'Transporter' },
            };
            const match = credentials[username.toLowerCase()];
            if (!match || password !== username) {
                throw new Error('Invalid credentials');
            }
            const userData = { name: match.name, role: match.role, username, isLoggedIn: true };
            return { user: userData, token: 'mock-token-' + Date.now() };
        }

        // --- REAL BACKEND ---
        return apiFetch('POST', '/auth/login', { username, password });
    },

    /**
     * Register a new user.
     * @returns { user, token }
     */
    async register(formData) {
        if (USE_MOCK) {
            await _mockDelay(600);
            const roleMap = { farmer: 'Farmer', buyer: 'Buyer', transporter: 'Transporter' };
            const userData = {
                name: `${formData.firstName} ${formData.lastName}`,
                role: roleMap[formData.role] || 'Buyer',
                username: formData.username,
                isLoggedIn: true,
            };
            return { user: userData, token: 'mock-token-' + Date.now() };
        }

        // --- REAL BACKEND ---
        return apiFetch('POST', '/auth/register', formData);
    },

    logout() {
        clearSession();
        window.location.href = 'login.html';
    },
};

// ============================================================
// SECTION 4: PRODUCTS API
// ============================================================

const ProductsAPI = {
    /**
     * Get all products, optionally filtered by category.
     * @returns Product[]
     */
    async getAll(category = null) {
        if (USE_MOCK) {
            await _mockDelay(200);
            const data = _getMockProducts();
            return category ? data.filter(p => p.category === category) : data;
        }

        const qs = category ? `?category=${category}` : '';
        return apiFetch('GET', `/products${qs}`);
    },

    /**
     * Get a single product by ID.
     * @returns Product | null
     */
    async getById(id) {
        if (USE_MOCK) {
            await _mockDelay(150);
            const data = _getMockProducts();
            return data.find(p => p.id === id) || null;
        }

        return apiFetch('GET', `/products/${id}`);
    },

    /**
     * Create a new product listing (Farmer only).
     * @returns Product (with server-generated ID)
     */
    async create(productData) {
        if (USE_MOCK) {
            await _mockDelay(600);
            const newProduct = { ...productData, id: 'np' + Date.now() };
            const products = _getMockProducts();
            products.unshift(newProduct);
            localStorage.setItem('fc_products', JSON.stringify(products));
            return newProduct;
        }

        return apiFetch('POST', '/products', productData);
    },
};

// ============================================================
// SECTION 5: ORDERS API
// ============================================================

const OrdersAPI = {
    /**
     * Get all orders for the current user.
     * @returns Order[]
     */
    async getMyOrders() {
        if (USE_MOCK) {
            await _mockDelay(300);
            return _getMockOrders();
        }

        return apiFetch('GET', '/orders/mine');
    },

    /**
     * Get all orders received by the current farmer.
     * @returns Order[]
     */
    async getFarmerOrders() {
        if (USE_MOCK) {
            await _mockDelay(300);
            return _getMockOrders();
        }

        return apiFetch('GET', '/orders/farmer');
    },

    /**
     * Create a new order (Buyer only).
     * @returns { order: Order, job: LogisticsJob }
     */
    async create(orderData) {
        if (USE_MOCK) {
            await _mockDelay(500);
            const newOrder = {
                ...orderData,
                id: 'FC-' + Math.floor(10000 + Math.random() * 90000),
                status: 'Processing',
                date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            };
            const orders = _getMockOrders();
            orders.unshift(newOrder);
            localStorage.setItem('fc_orders', JSON.stringify(orders));

            // Auto-create a logistics job
            const job = await LogisticsAPI.createJob({
                orderId: newOrder.id,
                product: newOrder.item,
                pickup: newOrder.seller || 'Farm Depot',
                dropoff: newOrder.buyer || 'Buyer Location',
                weight: Math.floor(Math.random() * 50) + 10,
                pay: 4500,
                distance: (Math.floor(Math.random() * 20) + 5) + 'km',
            });

            return { order: newOrder, job };
        }

        return apiFetch('POST', '/orders', orderData);
    },

    /**
     * Update order status (e.g., Logistics marks as delivered).
     */
    async updateStatus(orderId, status) {
        if (USE_MOCK) {
            const orders = _getMockOrders();
            const idx = orders.findIndex(o => o.id === orderId);
            if (idx !== -1) {
                orders[idx].status = status;
                localStorage.setItem('fc_orders', JSON.stringify(orders));
            }
            return { success: true };
        }

        return apiFetch('PATCH', `/orders/${orderId}/status`, { status });
    },
};

// ============================================================
// SECTION 6: LOGISTICS API
// ============================================================

const LogisticsAPI = {
    /**
     * Get all available logistics jobs.
     * @returns LogisticsJob[]
     */
    async getJobs() {
        if (USE_MOCK) {
            await _mockDelay(300);
            return _getMockJobs();
        }

        return apiFetch('GET', '/logistics/jobs');
    },

    /**
     * Create a new logistics job linked to an order.
     * @returns LogisticsJob
     */
    async createJob(jobData) {
        if (USE_MOCK) {
            const newJob = { ...jobData, id: Date.now(), status: 'pending' };
            const jobs = _getMockJobs();
            jobs.unshift(newJob);
            localStorage.setItem('fc_logistics_jobs', JSON.stringify(jobs));
            return newJob;
        }

        return apiFetch('POST', '/logistics/jobs', jobData);
    },

    /**
     * Driver accepts a job.
     */
    async acceptJob(jobId) {
        if (USE_MOCK) {
            await _updateMockJobStatus(jobId, 'active');
            return { success: true };
        }

        return apiFetch('PATCH', `/logistics/jobs/${jobId}/accept`);
    },

    /**
     * Driver marks a job as delivered.
     */
    async completeJob(jobId) {
        if (USE_MOCK) {
            await _updateMockJobStatus(jobId, 'delivered');
            return { success: true };
        }

        return apiFetch('PATCH', `/logistics/jobs/${jobId}/complete`);
    },
};

// ============================================================
// SECTION 7: USER / PROFILE API
// ============================================================

const UserAPI = {
    /**
     * Get the current user's profile.
     * @returns UserProfile
     */
    async getProfile() {
        if (USE_MOCK) {
            await _mockDelay(200);
            const user = getSession();
            return {
                ...user,
                phone: user.phone || '+234 800 000 0000',
                location: user.location || 'Lagos, Nigeria',
                walletBalance: user.walletBalance || 0,
            };
        }

        return apiFetch('GET', '/users/me');
    },

    /**
     * Update the current user's profile.
     */
    async updateProfile(updates) {
        if (USE_MOCK) {
            await _mockDelay(400);
            const user = getSession();
            const updated = { ...user, ...updates };
            localStorage.setItem('fc_user', JSON.stringify(updated));
            return updated;
        }

        return apiFetch('PATCH', '/users/me', updates);
    },
};

// ============================================================
// SECTION 8: MOCK DATA HELPERS (private)
// These mirror the old products.js defaults exactly.
// ============================================================

function _mockDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function _getMockProducts() {
    const stored = localStorage.getItem('fc_products');
    if (stored) return JSON.parse(stored);

    const defaults = [
        // TUBERS
        { id: "t01", name: "Yam (Puna/Medium)", category: "tubers", price: 3500, unit: "Per Tuber", stock: "High", trend: "stable", icon: "🥔", location: "Oyo", desc: "Fresh Puna Yam, harvested recently. High starch content." },
        { id: "t02", name: "Cassava (Garri Ijebu)", category: "tubers", price: 1800, unit: "Paint Bucket", stock: "Very High", trend: "stable", icon: "🥣", location: "Ogun", desc: "Sharp Ijebu Garri, dry and crunchy. Sand-free." },
        { id: "t03", name: "Sweet Potato", category: "tubers", price: 12000, unit: "Small Bag", stock: "Medium", trend: "up", icon: "🍠", location: "Osun", desc: "Red skin sweet potatoes, naturally sweet." },
        { id: "t04", name: "Irish Potato", category: "tubers", price: 28000, unit: "Bag", stock: "Low", trend: "up", icon: "🥔", location: "Jos", desc: "Fresh Irish potatoes direct from Jos plateau." },
        { id: "t05", name: "Cocoyam (Taro)", category: "tubers", price: 15000, unit: "Basket", stock: "Low", trend: "stable", icon: "🥔", location: "Enugu", desc: "Soup thickening cocoyam (Ede)." },
        { id: "t06", name: "Water Yam", category: "tubers", price: 2500, unit: "Per Tuber", stock: "High", trend: "down", icon: "🥔", location: "Ibadan", desc: "Great for Ikokore and frying." },
        // GRAINS
        { id: "g01", name: "Local Rice (Ofada)", category: "grains", price: 55000, unit: "50kg Bag", stock: "High", trend: "stable", icon: "🍚", location: "Ogun", desc: "Stone-free local Ofada rice with distinct aroma." },
        { id: "g02", name: "Foreign Rice (Long Grain)", category: "grains", price: 72000, unit: "50kg Bag", stock: "Medium", trend: "up", icon: "🍚", location: "Lagos", desc: "Premium imported long grain parboiled rice." },
        { id: "g03", name: "Beans (Oloyin/Honey)", category: "grains", price: 105000, unit: "100kg Bag", stock: "Scarce", trend: "up", icon: "🫘", location: "Borno", desc: "Sweet honey beans, weevil-free and clean." },
        { id: "g04", name: "Maize (Dry Corn)", category: "grains", price: 45000, unit: "100kg Bag", stock: "High", trend: "down", icon: "🌽", location: "Kaduna", desc: "Yellow dry maize for animal feed or pap (Ogi)." },
        { id: "g05", name: "Guinea Corn (Sorghum)", category: "grains", price: 42000, unit: "100kg Bag", stock: "Medium", trend: "stable", icon: "🌾", location: "Kano", desc: "Red sorghum, excellent for brewing or food." },
        { id: "g06", name: "Millet", category: "grains", price: 40000, unit: "100kg Bag", stock: "High", trend: "stable", icon: "🌾", location: "Jigawa", desc: "Cleaned millet grain, rich in fiber." },
        { id: "g07", name: "Soya Beans", category: "grains", price: 68000, unit: "100kg Bag", stock: "Medium", trend: "up", icon: "🫘", location: "Benue", desc: "High protein soya beans for milk or oil." },
        { id: "g08", name: "Bambara Nut", category: "grains", price: 55000, unit: "Bag", stock: "Low", trend: "stable", icon: "🥜", location: "Enugu", desc: "Okpa flour base, dried nuts." },
        // VEGETABLES
        { id: "v01", name: "Tomatoes (Big Basket)", category: "vegetables", price: 35000, unit: "Raffia Basket", stock: "Abundant", trend: "down", icon: "🍅", location: "Kano", desc: "Fresh red tomatoes, firm variety." },
        { id: "v02", name: "Red Pepper (Rodo)", category: "vegetables", price: 28000, unit: "Bag", stock: "Medium", trend: "up", icon: "🌶️", location: "Oyo", desc: "Spicy Scotch Bonnet (Habanero) pepper." },
        { id: "v03", name: "Onions (Dry)", category: "vegetables", price: 92000, unit: "Large Bag", stock: "Medium", trend: "stable", icon: "🧅", location: "Kebbi", desc: "Dry purple onions, long shelf life." },
        { id: "v04", name: "Okra", category: "vegetables", price: 8000, unit: "Basket", stock: "High", trend: "down", icon: "🥗", location: "Ogun", desc: "Fresh crunchy okra, snap-fresh." },
        { id: "v05", name: "Cabbage", category: "vegetables", price: 500, unit: "Per Head", stock: "Medium", trend: "stable", icon: "🥬", location: "Jos", desc: "Large green crispy cabbage." },
        { id: "v09", name: "Plantain (Unripe)", category: "vegetables", price: 4500, unit: "Bunch", stock: "Low", trend: "up", icon: "🍌", location: "Edo", desc: "Iron-rich unripe plantain bunch." },
        { id: "v13", name: "Ugu (Fluted Pumpkin Leaves)", category: "vegetables", price: 2500, unit: "Large Bundle", stock: "High", trend: "stable", icon: "🥬", location: "Delta", desc: "Freshly cut Ugu leaves, rich in iron." },
        // FRUITS
        { id: "f01", name: "Sweet Orange", category: "fruits", price: 15000, unit: "Sack", stock: "High", trend: "down", icon: "🍊", location: "Benue", desc: "Juicy, sweet Nigerian oranges directly from the farm." },
        { id: "f02", name: "Mango (Ogbomoso)", category: "fruits", price: 8000, unit: "Basket", stock: "Medium", trend: "up", icon: "🥭", location: "Oyo", desc: "Sweet, fleshy Ogbomoso mangoes. Seasonal." },
        { id: "f03", name: "Pineapple", category: "fruits", price: 1200, unit: "Per Head", stock: "High", trend: "stable", icon: "🍍", location: "Edo", desc: "Large, ripe, and extra sweet pineapples." },
        { id: "f04", name: "Banana (Sweet)", category: "fruits", price: 3000, unit: "Bunch", stock: "High", trend: "stable", icon: "🍌", location: "Cross River", desc: "Naturally ripened sweet bananas, spot-free." },
        // OILS & CASH CROPS
        { id: "o01", name: "Palm Oil", category: "oils", price: 64000, unit: "25L Keg", stock: "Medium", trend: "up", icon: "🛢️", location: "Imo", desc: "Red unadulterated palm oil. Great for cooking." },
        { id: "o02", name: "Groundnut Oil", category: "oils", price: 55000, unit: "25L Keg", stock: "High", trend: "stable", icon: "🌻", location: "Kano", desc: "Pure vegetable oil, cholesterol free." },
        { id: "o03", name: "Cocoa Beans", category: "oils", price: 180000, unit: "Bag", stock: "Low", trend: "up", icon: "🍫", location: "Ondo", desc: "Dried cocoa beans for export or processing." },
        { id: "o05", name: "Egusi (Melon)", category: "oils", price: 95000, unit: "Bag", stock: "Low", trend: "up", icon: "🍈", location: "Nasarawa", desc: "Hand-peeled egusi melon seeds." },
        { id: "o06", name: "Ginger", category: "oils", price: 35000, unit: "Bag", stock: "High", trend: "stable", icon: "🫚", location: "Kaduna", desc: "Dried split ginger." },
    ];
    localStorage.setItem('fc_products', JSON.stringify(defaults));
    return defaults;
}

function _getMockOrders() {
    const stored = localStorage.getItem('fc_orders');
    if (stored) return JSON.parse(stored);

    const defaults = [
        { id: "FC-29301", item: "50kg Premium Rice", icon: "🍚", buyer: "Sarah K.", seller: "Farmer John", amount: 85000, status: "In Transit", date: "Feb 15, 2026" },
        { id: "FC-10023", item: "25L Palm Oil", icon: "🛢️", buyer: "Mr. Okafor", seller: "Imo Processors", amount: 35000, status: "Delivered", date: "Jan 28, 2026" },
    ];
    localStorage.setItem('fc_orders', JSON.stringify(defaults));
    return defaults;
}

function _getMockJobs() {
    const stored = localStorage.getItem('fc_logistics_jobs');
    if (stored) return JSON.parse(stored);

    const defaults = [
        { id: 999, orderId: "FC-29301", product: "50kg Premium Rice", pickup: "Oyo Farms Hub", dropoff: "Sarah K. (Lagos)", weight: 300, pay: 25000, distance: "120km", status: "active" },
        { id: 998, orderId: "FC-10023", product: "Tomatoes Basket", pickup: "Kano Farm Gate", dropoff: "Alhaji Store (Abuja)", weight: 80, pay: 18000, distance: "95km", status: "pending" },
    ];
    localStorage.setItem('fc_logistics_jobs', JSON.stringify(defaults));
    return defaults;
}

async function _updateMockJobStatus(jobId, status) {
    const jobs = _getMockJobs();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx !== -1) {
        jobs[idx].status = status;
        localStorage.setItem('fc_logistics_jobs', JSON.stringify(jobs));
    }
}

// ============================================================
// SECTION 9: BACKWARDS COMPATIBILITY
// Keeps window.products / window.orders / window.logisticsJobs
// working so existing pages don't break during the transition.
// These will be removed once every page calls the API directly.
// ============================================================

(async function initLegacyGlobals() {
    window.products      = await ProductsAPI.getAll();
    window.orders        = await OrdersAPI.getMyOrders();
    window.logisticsJobs = await LogisticsAPI.getJobs();

    // Legacy helper functions used by older JS files
    window.addProduct = (p)              => ProductsAPI.create(p);
    window.addOrder   = (o)              => OrdersAPI.create(o);
    window.updateOrderStatus = (id, s)   => OrdersAPI.updateStatus(id, s);
    window.updateJobStatus   = (id, s)   => {
        if (s === 'active')    return LogisticsAPI.acceptJob(id);
        if (s === 'delivered') return LogisticsAPI.completeJob(id);
    };
})();