// Kitchen Kanban Dashboard Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth(['Kitchen Staff', 'Admin', 'Branch Manager', 'Canteen Operator']);
  loadKitchenBoard();
  setInterval(loadKitchenBoard, 8000); // Live polling update
});

async function loadKitchenBoard() {
  try {
    const res = await apiRequest('/orders');
    const orders = res.data;

    const cols = {
      NEW: document.getElementById('col-new'),
      PREPARING: document.getElementById('col-preparing'),
      READY: document.getElementById('col-ready'),
      COMPLETED: document.getElementById('col-completed')
    };

    Object.values(cols).forEach(c => { if (c) c.innerHTML = ''; });

    orders.forEach(ord => {
      const colKey = ord.status === 'ACCEPTED' ? 'PREPARING' : ord.status;
      const col = cols[colKey];
      if (!col) return;

      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '0.75rem';
      card.style.borderLeft = `4px solid ${ord.status === 'NEW' ? '#0369a1' : ord.status === 'PREPARING' ? '#854d0e' : '#15803d'}`;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.4rem;">
          <strong style="font-size: 1.05rem;">${ord.orderNumber}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${ord.orderType}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--primary-dark); font-weight: 600; margin-bottom: 0.4rem;">
          ${ord.student ? ord.student.name : 'Student'} (${ord.student ? ord.student.phone || '' : ''})
        </div>
        <div style="font-size: 0.85rem; background: var(--bg-main); padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem;">
          ${ord.items.map(i => `<div>• <strong>${i.name}</strong> × ${i.quantity}</div>`).join('')}
        </div>
        ${ord.specialInstructions ? `<div style="font-size: 0.75rem; color: var(--danger); font-style: italic; margin-bottom: 0.5rem;">Note: ${ord.specialInstructions}</div>` : ''}
        
        <div style="display: flex; gap: 0.3rem; margin-top: 0.5rem;">
          ${ord.status === 'NEW' ? `<button onclick="changeStatus('${ord._id}', 'PREPARING')" class="btn btn-primary btn-block" style="padding: 0.3rem; font-size: 0.8rem;">Accept & Prepare</button>` : ''}
          ${ord.status === 'PREPARING' || ord.status === 'ACCEPTED' ? `<button onclick="changeStatus('${ord._id}', 'READY')" class="btn btn-success btn-block" style="padding: 0.3rem; font-size: 0.8rem;">Mark Ready</button>` : ''}
          ${ord.status === 'READY' ? `<button onclick="changeStatus('${ord._id}', 'COMPLETED')" class="btn btn-outline btn-block" style="padding: 0.3rem; font-size: 0.8rem;">Complete Order</button>` : ''}
        </div>
      `;

      col.appendChild(card);
    });
  } catch (err) {}
}

async function changeStatus(orderId, newStatus) {
  try {
    await apiRequest(`/orders/${orderId}/status`, 'PATCH', { status: newStatus });
    showToast(`Order status changed to ${newStatus}`, 'success');
    loadKitchenBoard();
  } catch (err) {}
}

window.changeStatus = changeStatus;
