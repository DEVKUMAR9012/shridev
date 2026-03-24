// js/auth.js - Complete Authentication & Navigation

// Check if user is authenticated
function isAuthenticated() {
    return !!(localStorage.getItem('shridev_token') || sessionStorage.getItem('shridev_token'));
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('shridev_user') || sessionStorage.getItem('shridev_user');
    return userStr ? JSON.parse(userStr) : null;
}

// Protect routes
function protectRoute() {
    if (!isAuthenticated()) {
        sessionStorage.setItem('redirect_url', window.location.href);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

// Update UI with user info
function updateUserUI() {
    const user = getCurrentUser();
    if (user) {
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = user.name || 'Dev Kumar';
        });
        document.querySelectorAll('.user-avatar img').forEach(el => {
            el.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Dev Kumar')}&background=d4e0e8&color=2c3e50&bold=true`;
        });
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl) {
            const firstName = (user.name || 'Dev').split(' ')[0];
            welcomeEl.textContent = `Welcome back, ${firstName} ✦`;
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    const publicPages = ['login.html', 'signup.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'login.html';
    
    if (!publicPages.includes(currentPage)) {
        protectRoute();
        updateUserUI();
    }
    
    // Setup logout buttons
    document.querySelectorAll('.logout-btn, [onclick="logout()"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
    
    // Setup profile dropdown
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        document.addEventListener('click', function() {
            profileDropdown.classList.remove('show');
        });
        profileDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Setup mobile menu
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
});

// Redirect if already logged in
if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
    }
}