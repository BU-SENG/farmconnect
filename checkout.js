// checkout.js - REFACTORED (uses OrdersAPI + ProductsAPI from api.js)

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

// --- STATE ---
const params    = new URLSearchParams(window.location.search);
const productId = params.get('id');

let product   = null;
let quantity  = 1;
let finalTotal = 0;

// Fee config — when backend is ready, fetch these from GET /api/config/fees
const DELIVERY_FEE   = 4500;
const SERVICE_FEE_PCT = 0.015; // 1.5%

// --- INIT ---
async function initCheckout() {
    try {
        product = await ProductsAPI.getById(productId);
    } catch (err) {
        product = null;
    }

    if (!product) {
        document.getElementById('checkoutProductDetails').innerHTML = `
            <p class="text-danger text-sm">Product not found. 
                <a href="market.html" class="underline">Return to market</a>
            </p>
        `;
        return;
    }

    // Check for negotiated price from chat (will come from backend offer system later)
    const negotiatedPrice = localStorage.getItem('fc_negotiated_price');
    if (negotiatedPrice) {
        product = { ...product, price: parseInt(negotiatedPrice) };
        localStorage.removeItem('fc_negotiated_price'); // Clear after use
    }

    // Render product summary
    document.getElementById('checkoutProductDetails').innerHTML = `
        <div class="w-16 h-16 rounded-xl flex items-center justify-center text-3xl bg-gray-100 dark:bg-dark-700">
            ${product.icon}
        </div>
        <div>
            <h3 class="font-bold text-gray-900 dark:text-white">${product.name}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Sold by Verified Farmer · ${product.location}</p>
        </div>
    `;

    // Auto-fill user name
    const currentUser = getSession();
    if (currentUser) {
        document.getElementById('custName').value = currentUser.name;
    }

    calculateTotal();
}

// --- QUANTITY ---
function updateQty(change) {
    const newQty = quantity + change;
    if (newQty >= 1 && newQty <= 99) {
        quantity = newQty;
        document.getElementById('qtyDisplay').innerText = quantity;
        calculateTotal();
    }
}

// --- TOTALS ---
function calculateTotal() {
    if (!product) return;
    const subtotal   = product.price * quantity;
    const serviceFee = Math.floor(subtotal * SERVICE_FEE_PCT);
    finalTotal       = subtotal + DELIVERY_FEE + serviceFee;

    document.getElementById('subtotalDisplay').innerText = `₦${subtotal.toLocaleString()}`;
    document.getElementById('feeDisplay').innerText      = `₦${serviceFee.toLocaleString()}`;
    document.getElementById('totalDisplay').innerText    = `₦${finalTotal.toLocaleString()}`;
}

// --- SUBMIT ORDER ---
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>`;
    lucide.createIcons();
    btn.disabled = true;

    const currentUser   = getSession();
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'transfer';

    const orderData = {
        item:          `${quantity}x ${product.name}`,
        icon:          product.icon,
        productId:     product.id,
        buyer:         document.getElementById('custName').value,
        buyerPhone:    document.getElementById('custPhone').value,
        buyerAddress:  document.getElementById('custAddress').value,
        seller:        product.location || 'Verified Farm',
        sellerId:      product.sellerId || null, // Backend will use this to notify farmer
        amount:        finalTotal,
        quantity:      quantity,
        paymentMethod: paymentMethod,
        // Note: status and date are assigned by the backend/API layer
    };

    try {
        await OrdersAPI.create(orderData);

        // Show success modal
        const modal = document.getElementById('successModal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('div').classList.remove('scale-95');
        }, 10);

        setTimeout(() => window.location.href = 'orders.html', 2000);

    } catch (err) {
        btn.innerText = originalText;
        btn.disabled  = false;
        alert('Order failed: ' + err.message);
    }
});

// Start
initCheckout();