// Support Client Script: Refunds, Complaint Tickets & Lost and Found
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  loadRefunds();
  loadTickets();
  loadLostFound();
});

async function loadRefunds() {
  const container = document.getElementById('refunds-list');
  if (!container) return;

  try {
    const res = await apiRequest('/refunds');
    if (res.data.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">No refund requests submitted.</p>`;
      return;
    }

    container.innerHTML = res.data.map(r => `
      <div class="card" style="margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between;">
          <strong>Order ${r.order ? r.order.orderNumber : 'N/A'}</strong>
          <span class="status-badge status-${r.status === 'Completed' ? 'COMPLETED' : r.status === 'Approved' ? 'READY' : 'NEW'}">${r.status}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Reason: ${r.reason}</div>
        <div style="font-weight: 700; color: var(--primary-dark); margin-top: 0.25rem;">Amount: ₹${r.amount}</div>
      </div>
    `).join('');
  } catch (e) {}
}

async function requestRefundOrder() {
  const orderId = document.getElementById('refund-order-select')?.value;
  const reason = document.getElementById('refund-reason-input')?.value;

  try {
    const res = await apiRequest('/refunds/request', 'POST', { orderId, reason });
    showToast(res.message, 'success');
    loadRefunds();
  } catch (e) {}
}

async function loadTickets() {
  const container = document.getElementById('tickets-list');
  if (!container) return;

  try {
    const res = await apiRequest('/tickets');
    if (res.data.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">No support tickets opened.</p>`;
      return;
    }

    container.innerHTML = res.data.map(t => `
      <div class="card" style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between;">
          <strong>Ticket ${t.ticketNumber} [${t.category}]</strong>
          <span class="status-badge status-${t.status === 'Resolved' ? 'COMPLETED' : 'NEW'}">${t.status}</span>
        </div>
        <p style="font-size: 0.9rem; margin: 0.5rem 0;">${t.description}</p>
        
        <!-- Responses -->
        ${t.responses.length > 0 ? `
          <div style="background: var(--bg-main); padding: 0.5rem; border-radius: 6px; font-size: 0.85rem; margin-top: 0.5rem;">
            <strong>Staff Responses:</strong>
            ${t.responses.map(resp => `<div>• ${resp.message}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (e) {}
}

async function createTicket() {
  const category = document.getElementById('ticket-category-select')?.value;
  const description = document.getElementById('ticket-desc-input')?.value;

  try {
    const res = await apiRequest('/tickets', 'POST', { category, description });
    showToast(res.message, 'success');
    loadTickets();
  } catch (e) {}
}

async function loadLostFound() {
  const container = document.getElementById('lost-found-grid');
  if (!container) return;

  try {
    const res = await apiRequest('/lost-found');
    if (res.data.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted);">No items reported in Lost & Found.</p>`;
      return;
    }

    container.innerHTML = res.data.map(item => `
      <div class="card">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
          <strong style="font-size: 1.05rem;">${item.title}</strong>
          <span class="status-badge ${item.category === 'Lost' ? 'status-CANCELLED' : 'status-READY'}">${item.category}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${item.description}</p>
        <div style="font-size: 0.8rem; background: var(--bg-main); padding: 0.4rem; border-radius: 4px;">
          📍 Location: ${item.location}<br>
          📞 Contact: ${item.contactMethod}
        </div>
      </div>
    `).join('');
  } catch (e) {}
}

async function reportLostFound() {
  const title = document.getElementById('lf-title-input')?.value;
  const category = document.getElementById('lf-category-select')?.value;
  const description = document.getElementById('lf-desc-input')?.value;
  const location = document.getElementById('lf-location-input')?.value;
  const contactMethod = document.getElementById('lf-contact-input')?.value;

  try {
    const res = await apiRequest('/lost-found', 'POST', { title, category, description, location, contactMethod });
    showToast(res.message, 'success');
    loadLostFound();
  } catch (e) {}
}

window.requestRefundOrder = requestRefundOrder;
window.createTicket = createTicket;
window.reportLostFound = reportLostFound;
