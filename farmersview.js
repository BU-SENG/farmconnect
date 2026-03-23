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

// --- AUTHENTICATION & ROUTING LOGIC ---
// Fetch user details from localStorage
const currentUser = JSON.parse(localStorage.getItem('fc_user'));

if (!currentUser) {
    // If not logged in, boot them to the login screen
    window.location.href = 'login.html';
} else if (currentUser.role.toLowerCase() !== 'farmer') {
    // SECURITY: If a buyer tries to access the farmer dashboard, redirect them back to the marketplace
    window.location.href = 'index.html';
} else {
    // User is authorized. Populate the UI with their name and avatar.
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userAvatar = document.getElementById('userAvatar');

    if(userNameDisplay) userNameDisplay.innerText = currentUser.name;
    if(userAvatar) userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=a38d6d&color=fff&rounded=true`;
}

// --- MOBILE MENU LOGIC ---
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

// Slides the mobile menu in and out
function toggleMobileMenu() {
    mobileMenu.classList.toggle('-translate-x-full');
}

// Listen for clicks on the hamburger menu icon
mobileMenuBtn?.addEventListener('click', toggleMobileMenu);

// --- LOGOUT LOGIC ---
// Clears the saved user session and sends the user back to the login screen
function logout() {
    localStorage.removeItem('fc_user');
    window.location.href = 'login.html';
}