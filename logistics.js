// logistics.js - REFACTORED (uses LogisticsAPI from api.js)

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
if (!currentUser || currentUser.role.toLowerCase() !== 'transporter') {
    window.location.href = 'logisticslogin.html';
} else {
    document.getElementById('userNameDisplay').innerText = currentUser.name;
    document.getElementById('userAvatar').src =
        `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=a38d6d&color=fff&rounded=true`;
}

function logout() { AuthAPI.logout(); }
function toggleDropdown() { document.getElementById('profileDropdown').classList.toggle('hidden'); }

// --- STATE ---
let currentCapacity = 500;
let activeJob = null;
let allJobs = [];

// UI refs
const jobsContainer          = document.getElementById('jobsContainer');
const historyContainer       = document.getElementById('historyContainer');
const activeDeliveryContainer = document.getElementById('activeDeliveryContainer');
const routeLine              = document.getElementById('routeLine');
const destinationMarker      = document.getElementById('destinationMarker');
const mapStatusText          = document.getElementById('mapStatusText');
const capacityDisplay        = document.getElementById('capacityDisplay');
const capacityModal          = document.getElementById('capacityModal');
const capacityInput          = document.getElementById('capacityInput');

// --- LOAD DATA & RENDER ---
async function renderDashboard() {
    try {
        allJobs = await LogisticsAPI.getJobs();

        // Restore active job from session
        const savedActiveId = localStorage.getItem('fc_driver_active_job_id');
        if (savedActiveId) {
            activeJob = allJobs.find(j => String(j.id) === savedActiveId) || null;
        }

        renderActiveJob();
        renderAvailableJobs();
        renderHistory();
    } catch (err) {
        jobsContainer.innerHTML = `<p class="text-sm text-danger text-center py-4">Failed to load jobs. Please refresh.</p>`;
    }
}

function renderActiveJob() {
    if (activeJob) {
        activeDeliveryContainer.classList.remove('hidden');
        document.getElementById('activeProduct').innerText = activeJob.product;
        document.getElementById('activePickup').innerText  = activeJob.pickup;
        document.getElementById('activeDropoff').innerText = activeJob.dropoff;
        document.getElementById('activePay').innerText     = `₦${activeJob.pay.toLocaleString()}`;

        routeLine.classList.remove('hidden');
        destinationMarker.classList.remove('hidden');
        mapStatusText.innerText = `En route to ${activeJob.dropoff} (${activeJob.distance})`;
        mapStatusText.previousElementSibling.classList.replace('bg-success', 'bg-amber-500');
    } else {
        activeDeliveryContainer.classList.add('hidden');
        routeLine.classList.add('hidden');
        destinationMarker.classList.add('hidden');
        mapStatusText.innerText = 'Looking for jobs...';
        mapStatusText.previousElementSibling.classList.replace('bg-amber-500', 'bg-success');
    }
}

function renderAvailableJobs() {
    jobsContainer.innerHTML = '';
    const pending = allJobs.filter(j => j.status === 'pending');

    if (pending.length === 0) {
        jobsContainer.innerHTML = `<p class="text-sm text-gray-500 text-center py-4">No jobs available right now.</p>`;
        return;
    }

    pending.forEach(job => {
        const isLocked   = job.weight > currentCapacity;
        const lockedClass = isLocked ? 'job-locked' : '';
        const btnClass   = isLocked
            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            : 'bg-agri-500 hover:bg-agri-600 dark:bg-gold-500 dark:text-dark-900 dark:hover:bg-gold-400';

        jobsContainer.innerHTML += `
            <div class="job-card glass-panel p-4 rounded-xl border border-gray-200 dark:border-white/5 relative ${lockedClass}">
                ${isLocked ? `<i data-lucide="lock" class="w-4 h-4 text-danger absolute top-4 right-4"></i>` : ''}
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-gray-900 dark:text-white">${job.product}</h4>
                    <span class="font-bold text-agri-600 dark:text-gold-400">₦${job.pay.toLocaleString()}</span>
                </div>
                <div class="space-y-1 mb-4 text-xs text-gray-600 dark:text-gray-400">
                    <div class="flex items-center gap-2"><i data-lucide="arrow-up-circle" class="w-3 h-3 text-agri-500"></i> ${job.pickup}</div>
                    <div class="flex items-center gap-2"><i data-lucide="map-pin" class="w-3 h-3 text-danger"></i> ${job.dropoff}</div>
                    <div class="flex items-center gap-4 mt-2">
                        <span class="flex items-center gap-1"><i data-lucide="scale" class="w-3 h-3"></i> ${job.weight} KG</span>
                        <span class="flex items-center gap-1"><i data-lucide="route" class="w-3 h-3"></i> ${job.distance}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="acceptJob(${job.id})" ${isLocked ? 'disabled' : ''} 
                        class="flex-1 py-2 rounded-lg font-medium text-xs text-white transition-colors ${btnClass}">
                        Accept Job
                    </button>
                    <button onclick="this.closest('.job-card').remove()" 
                        class="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-danger dark:border-dark-600 dark:hover:bg-dark-700 transition-colors">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

function renderHistory() {
    historyContainer.innerHTML = '';
    const history = allJobs.filter(j => j.status === 'delivered');

    if (history.length === 0) {
        historyContainer.innerHTML = `<p class="text-xs text-gray-400 text-center">No recent trips.</p>`;
        return;
    }

    history.forEach(h => {
        historyContainer.innerHTML += `
            <div class="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-600">
                <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">${h.product}</p>
                    <p class="text-xs text-gray-500">Completed</p>
                </div>
                <span class="text-sm font-bold text-success">+₦${h.pay.toLocaleString()}</span>
            </div>
        `;
    });
}

// --- ACTIONS ---
window.acceptJob = async function (jobId) {
    if (activeJob) { alert('Please complete your current job first!'); return; }

    try {
        await LogisticsAPI.acceptJob(jobId);

        const job = allJobs.find(j => j.id === jobId);
        if (job?.orderId) await OrdersAPI.updateStatus(job.orderId, 'In Transit');

        localStorage.setItem('fc_driver_active_job_id', String(jobId));
        await renderDashboard();
    } catch (err) {
        alert('Failed to accept job: ' + err.message);
    }
};

window.completeJob = async function () {
    if (!activeJob) return;

    try {
        await LogisticsAPI.completeJob(activeJob.id);

        if (activeJob.orderId) await OrdersAPI.updateStatus(activeJob.orderId, 'Delivered');

        localStorage.removeItem('fc_driver_active_job_id');
        activeJob = null;
        await renderDashboard();
    } catch (err) {
        alert('Failed to complete job: ' + err.message);
    }
};

// --- CAPACITY MODAL ---
window.openCapacityModal = function () {
    capacityInput.value = currentCapacity;
    capacityModal.classList.remove('hidden');
    setTimeout(() => {
        capacityModal.classList.remove('opacity-0');
        capacityModal.querySelector('div').classList.remove('scale-95');
    }, 10);
};

window.closeCapacityModal = function () {
    capacityModal.classList.add('opacity-0');
    capacityModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => capacityModal.classList.add('hidden'), 300);
};

window.saveCapacity = function () {
    const val = parseInt(capacityInput.value);
    if (val > 0) {
        currentCapacity = val;
        capacityDisplay.innerText = currentCapacity;
        closeCapacityModal();
        renderDashboard();
    }
};

// Start
renderDashboard();