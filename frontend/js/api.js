// API Client Module with Toast Notification & Auth Header Integration
const API_BASE = '/api';

const showToast = (message, type = 'info') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span> ${message}`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
};

const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem('canteen_token');
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || 'An error occurred during request.';
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        showToast('Session expired. Please log in again.', 'error');
        localStorage.removeItem('canteen_token');
        localStorage.removeItem('canteen_user');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1200);
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
};

window.apiRequest = apiRequest;
window.showToast = showToast;
