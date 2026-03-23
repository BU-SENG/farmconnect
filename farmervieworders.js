// Initialize the Lucide SVG icons
lucide.createIcons();

// --- THEME TOGGLE LOGIC ---
// Switches the CSS class on the HTML tag and saves preference to localStorage
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('fc_theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('fc_theme', 'dark');
    }
}

// Load the saved theme from memory on page load
const savedTheme = localStorage.getItem('fc_theme');
if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
} else {
    document.documentElement.classList.add('dark'); // Default to dark mode
}

// --- AUTHENTICATION CHECK ---
// Fetch user details from localStorage
const currentUser = JSON.parse(localStorage.getItem('fc_user'));

// If no user is logged in, redirect them immediately to the login page
if (!currentUser) {
    window.location.href = 'login.html';
} else if (currentUser.role.toLowerCase() !== 'farmer') {
    // SECURITY: If a buyer tries to access the farmer orders page, redirect them to the buyer orders page
    window.location.href = 'orders.html';
}

// --- MOBILE MENU LOGIC ---
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

// Slides the mobile menu in and out by toggling the translate utility class
function toggleMobileMenu() {
    if(mobileMenu) {
        mobileMenu.classList.toggle('-translate-x-full');
    }
}

// Listen for clicks on the hamburger menu icon
if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
}

// --- LOGOUT LOGIC ---
// Clears the saved user session from localStorage and sends user back to login screen
function logout() {
    localStorage.removeItem('fc_user');
    window.location.href = 'login.html';
}