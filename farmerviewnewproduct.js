// farmerviewnewproduct.js - REFACTORED (uses ProductsAPI from api.js)

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
if (!currentUser || currentUser.role.toLowerCase() !== 'farmer') {
    window.location.href = 'index.html';
}

function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('-translate-x-full');
}

function logout() {
    AuthAPI.logout();
}

// --- POPULATE PRODUCT SELECTOR FROM API ---
const selector    = document.getElementById('productSelector');
const priceInput  = document.getElementById('listingPrice');
const stockInput  = document.getElementById('listingStock');
const unitInput   = document.getElementById('listingUnit');
const descInput   = document.getElementById('listingDesc');
const previewCard = document.getElementById('previewCard');

let selectedBaseProduct = null;
let allProducts = [];

async function initProductSelector() {
    try {
        allProducts = await ProductsAPI.getAll();

        const categories = [...new Set(allProducts.map(p => p.category))];
        categories.forEach(category => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category.charAt(0).toUpperCase() + category.slice(1);

            allProducts
                .filter(p => p.category === category)
                .forEach(prod => {
                    const option = document.createElement('option');
                    option.value = prod.id;
                    option.textContent = `${prod.icon} ${prod.name}`;
                    optgroup.appendChild(option);
                });

            selector.appendChild(optgroup);
        });
    } catch (err) {
        console.error('Failed to load products for selector:', err);
    }
}

selector.addEventListener('change', function () {
    selectedBaseProduct = allProducts.find(p => p.id === this.value);
    if (selectedBaseProduct) {
        previewCard.classList.remove('opacity-50');
        priceInput.value = selectedBaseProduct.price;
        stockInput.value = selectedBaseProduct.stock;
        unitInput.value  = selectedBaseProduct.unit;
        descInput.value  = selectedBaseProduct.desc;
        updatePreview();
    }
});

[priceInput, stockInput, unitInput].forEach(input => input.addEventListener('input', updatePreview));

function updatePreview() {
    if (!selectedBaseProduct) return;
    document.getElementById('previewIcon').textContent     = selectedBaseProduct.icon;
    document.getElementById('previewName').textContent     = selectedBaseProduct.name;
    document.getElementById('previewCategory').textContent = selectedBaseProduct.category;
    document.getElementById('previewPrice').textContent    = `₦${(parseInt(priceInput.value) || 0).toLocaleString()}`;
    document.getElementById('previewStock').textContent    = `${stockInput.value || '--'} in stock`;
    document.getElementById('previewUnit').textContent     = `per ${unitInput.value || '--'}`;
}

// --- FORM SUBMISSION ---
document.getElementById('newProductForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!selectedBaseProduct) return;

    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>`;
    lucide.createIcons();
    btn.disabled = true;

    const newProductData = {
        name:     selectedBaseProduct.name,
        category: selectedBaseProduct.category,
        price:    parseInt(priceInput.value),
        unit:     unitInput.value,
        stock:    stockInput.value,
        trend:    'stable',
        icon:     selectedBaseProduct.icon,
        location: currentUser.name + "'s Farm",
        desc:     descInput.value,
        sellerId: currentUser.username, // Will be used by backend to associate with farmer
    };

    try {
        await ProductsAPI.create(newProductData);

        // Show success modal
        const modal = document.getElementById('successModal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('div').classList.remove('scale-95');
        }, 10);

        setTimeout(() => {
            window.location.href = 'market.html';
        }, 1500);

    } catch (err) {
        btn.innerText = originalText;
        btn.disabled = false;
        alert('Failed to create listing: ' + err.message);
    }
});

// Start
initProductSelector();