// Delivery Staff Dashboard Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth(['Delivery Staff', 'Admin', 'Branch Manager']);
  loadDeliveries();
});

async function loadDeliveries() {
  const container = document.getElementById('delivery-list');
  if (!container) return;

  try {
    const res = await apiRequest('/deliveries');
    const deliveries = res.data;

    if (deliveries.length === 0) {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No pending room delivery orders.</div>`;
      return;
    }

    container.innerHTML = deliveries.map(d => `
      <div class="card" style="margin-bottom: 1rem; border-left: 4px solid var(--primary);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <strong>Order ${d.order ? d.order.orderNumber : 'N/A'}</strong>
          <span class="status-badge status-${d.status === 'Delivered' ? 'COMPLETED' : 'PREPARING'}">${d.status}</span>
        </div>
        <div style="font-size: 1.1rem; font-weight: 700; color: var(--primary-dark); margin-bottom: 0.4rem;">
          📍 ${d.building} • Floor ${d.floor} • Room ${d.roomNumber}
        </div>
        <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">
          Student: ${d.student ? d.student.name : 'Student'} (${d.student ? d.student.phone || '' : ''})
        </div>
        
        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
          ${d.status === 'Order received' || d.status === 'Preparing' ? `<button onclick="updateDelivery('${d._id}', 'Out for delivery')" class="btn btn-primary btn-block">Start Delivery (Out for Delivery)</button>` : ''}
          ${d.status === 'Out for delivery' ? `<button onclick="updateDelivery('${d._id}', 'Delivered')" class="btn btn-success btn-block">Mark Delivered ✅</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {}
}

async function updateDelivery(id, newStatus) {
  try {
    await apiRequest(`/deliveries/${id}/status`, 'PATCH', { status: newStatus });
    showToast(`Delivery updated to ${newStatus}`, 'success');
    loadDeliveries();
  } catch (e) {}
}

window.updateDelivery = updateDelivery;
