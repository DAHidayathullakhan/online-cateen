// Global Shared UI Header, Dark Mode & Component Helper Script
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderNavbar();
  renderMobileNav();
  updateCartBadge();
  loadCanteenCapacity();
});

function initTheme() {
  const savedTheme = localStorage.getItem('canteen_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('canteen_theme', next);
  renderNavbar();
}

async function loadCanteenCapacity() {
  const elem = document.getElementById('canteen-capacity-indicator');
  if (!elem) return;

  try {
    const res = await apiRequest('/orders/capacity-monitor');
    elem.textContent = `Canteen Load: ${res.statusLabel}`;
    elem.className = `status-badge status-${res.statusClass === 'danger' ? 'CANCELLED' : res.statusClass === 'warning' ? 'PREPARING' : 'READY'}`;
  } catch (e) {}
}

function renderNavbar() {
  const navContainer = document.getElementById('navbar-container');
  if (!navContainer) return;

  const user = Auth.getUser();
  const isLoggedIn = Auth.isLoggedIn();
  const currentTheme = document.documentElement.getAttribute('data-theme');

  let roleLinks = '';
  if (isLoggedIn && user) {
    if (user.role === 'Admin') {
      roleLinks = `<a href="/admin/index.html">Admin</a> <a href="/admin/intelligence.html">Supply Chain</a>`;
    } else if (user.role === 'Kitchen Staff') {
      roleLinks = `<a href="/kitchen/index.html">Kitchen Board</a> <a href="/admin/intelligence.html">Ingredients</a>`;
    } else if (user.role === 'Canteen Operator') {
      roleLinks = `<a href="/operator/index.html">Verification Counter</a>`;
    } else if (user.role === 'Delivery Staff') {
      roleLinks = `<a href="/delivery/index.html">Delivery Tasks</a>`;
    } else if (user.role === 'Branch Manager') {
      roleLinks = `<a href="/manager/index.html">Manager Stock</a>`;
    }
  }

  navContainer.innerHTML = `
    <nav class="navbar">
      <a href="/index.html" class="brand-logo">
        <div class="brand-icon">🎓</div>
        <span>Smart Campus Canteen</span>
      </a>

      <ul class="nav-links">
        <li><a href="/index.html">Home</a></li>
        <li><a href="/menu.html">Menu</a></li>
        ${isLoggedIn ? `
          <li><a href="/group-order.html">Group Order</a></li>
          <li><a href="/subscriptions.html">Passes</a></li>
          <li><a href="/wallet.html">Wallet</a></li>
          <li><a href="/orders.html">My Orders</a></li>
          <li><a href="/tickets.html">Support</a></li>
        ` : ''}
        ${roleLinks}
      </ul>

      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span id="canteen-capacity-indicator" class="status-badge status-READY" style="font-size: 0.75rem;">Canteen Load: 🟢 Normal</span>

        <button onclick="toggleDarkMode()" class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.9rem;" title="Toggle Dark/Light Mode">
          ${currentTheme === 'dark' ? '☀️' : '🌙'}
        </button>

        <a href="/cart.html" style="position: relative; font-size: 1.25rem; color: var(--primary-dark);">
          🛒
          <span id="cart-badge" style="position: absolute; top: -6px; right: -10px; background: var(--danger); color: white; border-radius: 50%; font-size: 0.7rem; font-weight: 700; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">0</span>
        </a>

        ${isLoggedIn ? `
          <span class="role-badge">${user.role}</span>
          <a href="/profile.html" style="font-weight: 600;">${user.name.split(' ')[0]}</a>
          <button onclick="Auth.logout()" class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.85rem;">Logout</button>
        ` : `
          <a href="/login.html" class="btn btn-outline" style="padding: 0.4rem 0.75rem;">Login</a>
          <a href="/register.html" class="btn btn-primary" style="padding: 0.4rem 0.75rem;">Register</a>
        `}
      </div>
    </nav>
  `;
}

function renderMobileNav() {
  let mobileContainer = document.getElementById('mobile-nav');
  if (!mobileContainer) {
    mobileContainer = document.createElement('div');
    mobileContainer.id = 'mobile-nav';
    mobileContainer.className = 'mobile-bottom-nav';
    document.body.appendChild(mobileContainer);
  }

  const currentPath = window.location.pathname;

  mobileContainer.innerHTML = `
    <a href="/index.html" class="mobile-nav-item ${currentPath === '/index.html' || currentPath === '/' ? 'active' : ''}"><span>🏠</span>Home</a>
    <a href="/menu.html" class="mobile-nav-item ${currentPath === '/menu.html' ? 'active' : ''}"><span>🍔</span>Menu</a>
    <a href="/group-order.html" class="mobile-nav-item ${currentPath === '/group-order.html' ? 'active' : ''}"><span>👥</span>Group</a>
    <a href="/wallet.html" class="mobile-nav-item ${currentPath === '/wallet.html' ? 'active' : ''}"><span>💳</span>Wallet</a>
    <a href="/orders.html" class="mobile-nav-item ${currentPath === '/orders.html' ? 'active' : ''}"><span>📦</span>Orders</a>
  `;
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const cart = JSON.parse(localStorage.getItem('canteen_cart')) || [];
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  badge.textContent = count;
}

function handleImageError(img) {
  img.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
}

window.updateCartBadge = updateCartBadge;
window.toggleDarkMode = toggleDarkMode;
window.handleImageError = handleImageError;
