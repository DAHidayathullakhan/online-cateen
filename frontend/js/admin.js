// Admin Dashboard & Analytics Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth(['Admin']);
  loadAnalytics();
  loadAdminBranches();
  loadAdminUsers();
});

async function loadAnalytics() {
  try {
    const res = await apiRequest('/analytics');
    const { summary, chartData } = res.data;

    document.getElementById('stat-today-orders').textContent = summary.todayOrdersCount;
    document.getElementById('stat-today-revenue').textContent = `₹${summary.todayRevenue}`;
    document.getElementById('stat-total-revenue').textContent = `₹${summary.totalRevenue}`;
    document.getElementById('stat-rush-hour').textContent = summary.rushHourText;

    renderChart(chartData);
  } catch (err) {}
}

function renderChart(chartData) {
  const ctx = document.getElementById('salesChart')?.getContext('2d');
  if (!ctx || typeof Chart === 'undefined') return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
      datasets: [{
        label: 'Orders per Hour',
        data: [5, 12, 45, 30, 18, 25, 10],
        backgroundColor: '#2563eb',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

async function loadAdminBranches() {
  const container = document.getElementById('admin-branches-list');
  if (!container) return;

  try {
    const res = await apiRequest('/branches');
    container.innerHTML = res.data.map(b => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
        <div>
          <strong>${b.name} (${b.code})</strong>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${b.location}</div>
        </div>
        <div>
          <button onclick="toggleBranchClosure('${b._id}', ${!b.isClosed})" class="btn ${b.isClosed ? 'btn-success' : 'btn-danger'}" style="padding: 0.3rem 0.65rem; font-size: 0.8rem;">
            ${b.isClosed ? 'Reopen Branch' : 'Emergency Close'}
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {}
}

async function toggleBranchClosure(branchId, closeIt) {
  const msg = closeIt ? prompt('Enter emergency closure message for students:') : '';
  try {
    await apiRequest(`/branches/${branchId}/toggle-closure`, 'PATCH', {
      isClosed: closeIt,
      closureMessage: msg
    });
    showToast('Branch closure state updated!', 'success');
    loadAdminBranches();
  } catch (e) {}
}

async function loadAdminUsers() {
  const container = document.getElementById('admin-users-table');
  if (!container) return;

  try {
    const res = await apiRequest('/users');
    container.innerHTML = res.data.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td><span class="role-badge">${u.role}</span></td>
        <td>
          <select onchange="changeRole('${u._id}', this.value)" style="padding: 0.2rem; font-size: 0.8rem;">
            <option value="Student" ${u.role === 'Student' ? 'selected' : ''}>Student</option>
            <option value="Master's Student" ${u.role === "Master's Student" ? 'selected' : ''}>Master's Student</option>
            <option value="Canteen Operator" ${u.role === 'Canteen Operator' ? 'selected' : ''}>Canteen Operator</option>
            <option value="Kitchen Staff" ${u.role === 'Kitchen Staff' ? 'selected' : ''}>Kitchen Staff</option>
            <option value="Delivery Staff" ${u.role === 'Delivery Staff' ? 'selected' : ''}>Delivery Staff</option>
            <option value="Branch Manager" ${u.role === 'Branch Manager' ? 'selected' : ''}>Branch Manager</option>
            <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function changeRole(userId, newRole) {
  try {
    await apiRequest(`/users/${userId}/role`, 'PATCH', { role: newRole });
    showToast('User role updated!', 'success');
  } catch (e) {}
}

window.toggleBranchClosure = toggleBranchClosure;
window.changeRole = changeRole;
