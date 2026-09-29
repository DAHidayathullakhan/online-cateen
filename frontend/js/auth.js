const Auth = {
  getToken() {
    return localStorage.getItem('token');
  },
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  setUserSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },
  redirectBasedOnRole(role) {
    switch (role) {
      case 'Admin':
        window.location.href = '/admin/dashboard.html';
        break;
      case 'Kitchen Staff':
        window.location.href = '/kitchen/dashboard.html';
        break;
      case 'Delivery Staff':
        window.location.href = '/delivery/dashboard.html';
        break;
      case 'Canteen Operator':
        window.location.href = '/operator/dashboard.html';
        break;
      case 'Branch Manager':
        window.location.href = '/manager/dashboard.html';
        break;
      case 'Student':
      case "Master's Student":
      default:
        window.location.href = '/menu.html';
        break;
    }
  }
};

window.Auth = Auth;
