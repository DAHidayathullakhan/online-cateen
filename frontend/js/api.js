// Dynamic API URL resolving automatically on any port (3000, 3838, etc.)
const API_BASE_URL = window.location.protocol === 'file:'
  ? 'http://localhost:3000/api'
  : '/api';

let isRedirecting = false;

function isProtectedRoutePath() {
  const path = window.location.pathname.toLowerCase();
  const protectedKeywords = [
    '/admin', '/kitchen', '/delivery', '/operator', '/manager', 
    '/orders.html', '/profile.html', '/tickets.html', '/token.html', '/wallet.html'
  ];
  return protectedKeywords.some(keyword => path.includes(keyword));
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token') || localStorage.getItem('smart_campus_jwt');
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (response.status === 401) {
      if (isProtectedRoutePath() && !isRedirecting) {
        isRedirecting = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('smart_campus_jwt');
        localStorage.removeItem('smart_campus_user');
        window.location.href = '/login.html';
      }
      throw new Error(data.message || 'Unauthorized access');
    }

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    const friendlyMsg = (error.message && (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED') || error.message.includes('NetworkError')))
      ? 'Unable to connect to the canteen server. Please try again.'
      : (error.message || 'API request failed');
    console.error(`API Error [${endpoint}]:`, error.message);
    throw new Error(friendlyMsg);
  }
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  if (type === 'error') toast.style.background = '#ef4444';
  if (type === 'success') toast.style.background = '#10b981';

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

window.apiRequest = apiRequest;
window.showToast = showToast;
