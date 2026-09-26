// Admin & Manager Supply Chain Client Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth(['Admin', 'Branch Manager', 'Kitchen Staff']);
  loadIngredients();
  loadVendors();
  loadPurchaseOrders();
  loadCateringRequests();
  loadPredictions();
});

async function loadIngredients() {
  const container = document.getElementById('ingredients-list-body');
  if (!container) return;

  try {
    const res = await apiRequest('/ingredients');
    container.innerHTML = res.data.map(i => `
      <tr>
        <td><strong>${i.name}</strong></td>
        <td>${i.quantity} ${i.unit}</td>
        <td>${i.minStock} ${i.unit}</td>
        <td>${i.branch ? i.branch.name : 'Main Canteen'}</td>
        <td><span class="status-badge ${i.quantity <= i.minStock ? 'status-CANCELLED' : 'status-READY'}">${i.quantity <= i.minStock ? 'Low Stock' : 'Sufficient'}</span></td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function loadVendors() {
  const container = document.getElementById('vendors-list-body');
  if (!container) return;

  try {
    const res = await apiRequest('/vendors');
    container.innerHTML = res.data.map(v => `
      <tr>
        <td><strong>${v.name}</strong></td>
        <td>${v.contactPerson || 'N/A'}</td>
        <td>${v.phone || 'N/A'}</td>
        <td>${v.suppliedIngredients.join(', ')}</td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function loadPurchaseOrders() {
  const container = document.getElementById('purchases-list-body');
  if (!container) return;

  try {
    const res = await apiRequest('/vendors/purchases');
    container.innerHTML = res.data.map(po => `
      <tr>
        <td><strong>${po.poNumber}</strong></td>
        <td>${po.vendor ? po.vendor.name : 'Supplier'}</td>
        <td>₹${po.totalCost}</td>
        <td><span class="status-badge status-${po.status === 'Received' ? 'COMPLETED' : 'NEW'}">${po.status}</span></td>
        <td>
          ${po.status === 'Ordered' ? `<button onclick="receivePO('${po._id}')" class="btn btn-success" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Mark Goods Received ✅</button>` : 'Received & Restocked'}
        </td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function receivePO(poId) {
  try {
    const res = await apiRequest(`/vendors/purchases/${poId}/receive`, 'PATCH');
    showToast(res.message, 'success');
    loadPurchaseOrders();
    loadIngredients();
  } catch (e) {}
}

async function loadCateringRequests() {
  const container = document.getElementById('catering-list');
  if (!container) return;

  try {
    const res = await apiRequest('/catering');
    if (res.data.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">No bulk catering requests.</p>`;
      return;
    }

    container.innerHTML = res.data.map(c => `
      <div class="card" style="margin-bottom: 1rem; border-left: 4px solid var(--warning);">
        <div style="display: flex; justify-content: space-between;">
          <strong>${c.eventTitle} (${c.department})</strong>
          <span class="status-badge status-${c.status === 'Approved' ? 'READY' : 'NEW'}">${c.status}</span>
        </div>
        <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">
          📅 Date: ${c.eventDate} ${c.eventTime} • Guests: ${c.guestCount} • Location: ${c.location}
        </div>
      </div>
    `).join('');
  } catch (e) {}
}

async function loadPredictions() {
  const container = document.getElementById('predictions-list');
  if (!container) return;

  try {
    const res = await apiRequest('/ingredients/predictions');
    container.innerHTML = res.predictions.map(p => `
      <div class="card" style="padding: 1rem;">
        <strong style="font-size: 1rem; color: var(--primary-dark);">${p.name}</strong>
        <div style="font-size: 0.85rem; margin-top: 0.25rem;">Est Sell-Out Time: <strong>~${p.estimatedSellOutTime}</strong></div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Remaining Stock: ${p.stockQuantity} (${p.confidence})</div>
      </div>
    `).join('');
  } catch (e) {}
}

window.receivePO = receivePO;
