// admin.js - REFACTORED (uses AdminAPI stub from api.js pattern)

lucide.createIcons();

// --- THEME ---
function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('fc_theme', html.classList.contains('dark') ? 'dark' : 'light');
    updateChartTheme(html.classList.contains('dark') ? 'dark' : 'light');
}
if (localStorage.getItem('fc_theme') === 'light') {
    document.documentElement.classList.remove('dark');
} else {
    document.documentElement.classList.add('dark');
}

// --- AUTH CHECK ---
const currentUser = getSession();
if (!currentUser || currentUser.role !== 'Admin') {
    window.location.href = 'login.html';
}

function logout() { AuthAPI.logout(); }

// ============================================================
// ADMIN API STUB
// When backend is ready, replace these with real fetch calls:
//   GET    /api/admin/verifications         → PendingUser[]
//   POST   /api/admin/verifications/:id/approve
//   DELETE /api/admin/verifications/:id
//   GET    /api/admin/users                 → User[]
//   PATCH  /api/admin/users/:id/ban
//   GET    /api/admin/tickets               → Ticket[]
//   PATCH  /api/admin/tickets/:id/resolve
//   GET    /api/admin/logs                  → LogEntry[]
//   GET    /api/admin/stats                 → { totalUsers, farmers, buyers, logistics, revenue }
// ============================================================
const AdminAPI = {
    async getPendingVerifications() {
        const stored = localStorage.getItem('fc_admin_verifications');
        if (stored) return JSON.parse(stored);

        const defaults = [
            { id: 101, name: 'Musa Ibrahim',   location: 'Kano State',  nin: '12903847561', date: 'Feb 20, 2026' },
            { id: 102, name: 'Chinedu Okeke',  location: 'Enugu State', nin: '55403928172', date: 'Feb 21, 2026' },
            { id: 103, name: 'Folake Adebayo', location: 'Ogun State',  nin: '99201837465', date: 'Feb 22, 2026' },
        ];
        localStorage.setItem('fc_admin_verifications', JSON.stringify(defaults));
        return defaults;
    },

    async approveVerification(id) {
        const list = await this.getPendingVerifications();
        const updated = list.filter(u => u.id !== id);
        localStorage.setItem('fc_admin_verifications', JSON.stringify(updated));
        return updated;
    },

    async rejectVerification(id) {
        return this.approveVerification(id); // Same removal logic for mock
    },

    async getAllUsers() {
        const stored = localStorage.getItem('fc_admin_users');
        if (stored) return JSON.parse(stored);

        const defaults = [
            { id: 1, name: 'Farmer John',   role: 'Farmer',    status: 'Active' },
            { id: 2, name: 'Buyer Sarah',   role: 'Buyer',     status: 'Active' },
            { id: 3, name: 'Logistics Co.', role: 'Logistics', status: 'Banned' },
            { id: 4, name: 'Admin User',    role: 'Admin',     status: 'Active' },
            { id: 5, name: 'Iya Basit',     role: 'Buyer',     status: 'Active' },
        ];
        localStorage.setItem('fc_admin_users', JSON.stringify(defaults));
        return defaults;
    },

    async toggleBan(id) {
        const users = await this.getAllUsers();
        const user  = users.find(u => u.id === id);
        if (user) {
            user.status = user.status === 'Active' ? 'Banned' : 'Active';
            localStorage.setItem('fc_admin_users', JSON.stringify(users));
        }
        return users;
    },

    async getTickets() {
        return [
            { id: 'T-992', user: 'Buyer Sarah', issue: 'Payment failed but deducted', status: 'Open' },
            { id: 'T-993', user: 'Farmer John', issue: 'Cannot update stock count',   status: 'Resolved' },
        ];
    },

    async getLogs() {
        // REAL: GET /api/admin/logs?limit=50 — returns structured log objects
        // These should stream from the server in production (Server-Sent Events)
        return [
            { level: 'INFO',  text: 'System boot sequence initiated...' },
            { level: 'INFO',  text: 'Database connection established (Latency: 24ms)' },
            { level: 'AUTH',  text: "User 'Farmer John' logged in from 192.168.1.45" },
            { level: 'TRANS', text: 'Payment ID #99023 processed successfully' },
            { level: 'WARN',  text: 'High latency detected on /api/market-data' },
            { level: 'AUTH',  text: 'Admin accessed dashboard' },
        ];
    },

    async getStats() {
        // REAL: GET /api/admin/stats → { totalUsers, farmers, buyers, logistics, revenue }
        return { farmers: 45, buyers: 35, logistics: 20 };
    },
};

// --- NAVIGATION ---
function showSection(sectionId) {
    document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`section-${sectionId}`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const order = ['dashboard', 'users', 'tickets', 'logs'];
    const idx   = order.indexOf(sectionId);
    if (idx !== -1) document.querySelectorAll('.nav-btn')[idx].classList.add('active');

    const titles = {
        dashboard: 'Dashboard Overview',
        users:     'User Management',
        tickets:   'Support Tickets',
        logs:      'System Logs',
    };
    document.getElementById('pageTitle').innerText = titles[sectionId] || '';
}

// --- VERIFICATIONS ---
async function renderVerificationTable() {
    const list  = await AdminAPI.getPendingVerifications();
    const tbody = document.getElementById('verificationTable');
    tbody.innerHTML = '';

    list.forEach(user => {
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                <td class="py-3 pl-2 font-medium text-gray-900 dark:text-white">${user.name}</td>
                <td class="text-gray-500">${user.location}</td>
                <td class="font-mono text-xs text-gray-500">${user.nin}</td>
                <td class="text-gray-500 text-xs">${user.date}</td>
                <td class="text-right pr-2">
                    <div class="flex justify-end gap-2">
                        <button onclick="verifyUser(${user.id})"
                            class="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400 transition-colors" title="Approve">
                            <i data-lucide="check" class="w-4 h-4"></i>
                        </button>
                        <button onclick="rejectUser(${user.id})"
                            class="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 transition-colors" title="Reject">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.getElementById('pendingVerificationCount').innerText = list.length;
    lucide.createIcons();
}

async function verifyUser(id) {
    await AdminAPI.approveVerification(id);
    await renderVerificationTable();
}

async function rejectUser(id) {
    await AdminAPI.rejectVerification(id);
    await renderVerificationTable();
}

// --- ALL USERS ---
async function renderAllUsers() {
    const users = await AdminAPI.getAllUsers();
    const tbody = document.getElementById('allUsersTable');
    tbody.innerHTML = '';

    users.forEach(user => {
        const statusClass = user.status === 'Active' ? 'status-active' : 'status-banned';
        const btnText     = user.status === 'Active' ? 'Ban' : 'Unban';
        const btnColor    = user.status === 'Active' ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600';

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0">
                <td class="py-3 pl-2 font-medium text-gray-900 dark:text-white">${user.name}</td>
                <td class="text-xs text-gray-500">${user.role}</td>
                <td><span class="status-badge ${statusClass}">${user.status}</span></td>
                <td class="text-right pr-2">
                    <button onclick="toggleBan(${user.id})" class="text-xs font-medium ${btnColor} transition-colors">
                        ${btnText}
                    </button>
                </td>
            </tr>
        `;
    });
}

async function toggleBan(id) {
    await AdminAPI.toggleBan(id);
    await renderAllUsers();
}

// --- TICKETS ---
async function renderTickets() {
    const tickets   = await AdminAPI.getTickets();
    const container = document.getElementById('ticketsContainer');
    container.innerHTML = '';

    tickets.forEach(ticket => {
        const border = ticket.status === 'Open'
            ? 'border-l-4 border-yellow-500'
            : 'border-l-4 border-green-500 opacity-60';

        container.innerHTML += `
            <div class="glass-panel p-4 rounded-lg flex justify-between items-center ${border} bg-gray-50 dark:bg-white/5">
                <div>
                    <h4 class="font-bold text-gray-900 dark:text-white text-sm">${ticket.issue}</h4>
                    <p class="text-xs text-gray-500">From: ${ticket.user} · ID: ${ticket.id}</p>
                </div>
                <button class="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                    ${ticket.status === 'Open' ? 'Resolve' : 'Archive'}
                </button>
            </div>
        `;
    });
}

// --- SYSTEM LOGS ---
async function renderLogs() {
    const logs      = await AdminAPI.getLogs();
    const container = document.getElementById('systemLogs');
    const colorMap  = { WARN: 'text-yellow-400', ERR: 'text-red-400', AUTH: 'text-blue-400' };

    container.innerHTML = logs.map(log => {
        const color = colorMap[log.level] || 'text-gray-400';
        return `<div class="font-mono ${color}">[${log.level}] ${log.text}</div>`;
    }).join('');
}

// --- CHART ---
let userChart = null;

async function initChart() {
    const stats  = await AdminAPI.getStats();
    const ctx    = document.getElementById('userChart').getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');
    const colors = isDark
        ? ['#10b981', '#a38d6d', '#3b82f6']
        : ['#059669', '#d97706', '#2563eb'];

    userChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Farmers', 'Buyers', 'Logistics'],
            datasets: [{
                data: [stats.farmers, stats.buyers, stats.logistics],
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: isDark ? '#e5e7eb' : '#374151' },
                },
            },
            cutout: '70%',
        },
    });
}

function updateChartTheme(theme) {
    if (!userChart) return;
    const isDark = theme === 'dark';
    userChart.data.datasets[0].backgroundColor = isDark
        ? ['#10b981', '#a38d6d', '#3b82f6']
        : ['#059669', '#d97706', '#2563eb'];
    userChart.options.plugins.legend.labels.color = isDark ? '#e5e7eb' : '#374151';
    userChart.update();
}

// --- INIT ---
async function initAdmin() {
    await renderVerificationTable();
    await renderAllUsers();
    await renderTickets();
    await renderLogs();
    await initChart();
}

initAdmin();