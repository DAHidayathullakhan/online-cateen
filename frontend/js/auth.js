// Authentication Module
const Auth = {
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('canteen_user')) || null;
    } catch (e) {
      return null;
    }
  },

  getToken: () => localStorage.getItem('canteen_token') || null,

  isLoggedIn: () => Boolean(localStorage.getItem('canteen_token')),

  saveSession: (token, user) => {
    localStorage.setItem('canteen_token', token);
    localStorage.setItem('canteen_user', JSON.stringify(user));
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', 'POST');
    } catch (e) {}
    localStorage.removeItem('canteen_token');
    localStorage.removeItem('canteen_user');
    window.location.href = '/login.html';
  },

  requireAuth: (allowedRoles = []) => {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }

    const user = Auth.getUser();
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      alert(`Access denied for role ${user ? user.role : 'Guest'}`);
      window.location.href = '/index.html';
      return false;
    }
    return true;
  }
};

window.Auth = Auth;
