// Student Orders List & Reorder Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  loadOrders();
});

async function loadOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  try {
    const res = await apiRequest('/orders');
    const orders = res.data;

    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3.5rem 1rem; background: var(--card-bg); border-radius: var(--radius); border: 1px solid var(--border-color);">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">📦</div>
          <h3 style="color: var(--text-dark); font-weight: 700; margin-bottom: 0.5rem;">No past orders yet!</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Order delicious hot meals, snacks and drinks from the campus menu.</p>
          <a href="/menu.html" class="btn btn-primary" style="padding: 0.75rem 1.5rem; font-weight: 700;">Browse Menu 🍔</a>
        </div>
      `;
      return;
    }

    const getTimelineStep = (status) => {
      if (status === 'PLACED') return 1;
      if (status === 'PREPARING') return 2;
      if (status === 'READY') return 3;
      if (status === 'COMPLETED') return 4;
      return 1;
    };

    container.innerHTML = orders.map(ord => {
      const currentStep = getTimelineStep(ord.status);
      const isCancelled = ord.status === 'CANCELLED';

      return `
        <div class="card" style="margin-bottom: 1.5rem; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); padding: 1.5rem;">
          <!-- Order Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">ORDER TICKET</div>
              <strong style="font-size: 1.15rem; color: var(--primary-dark); font-weight: 800;">${ord.orderNumber}</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.1rem;">
                📅 ${new Date(ord.createdAt).toLocaleString()} • 📍 ${ord.branch ? ord.branch.name : 'Main Canteen'}
              </div>
            </div>
            <div>
              <span class="status-badge status-${ord.status}">${ord.status}</span>
            </div>
          </div>

          <!-- Live Step Tracker -->
          ${!isCancelled ? `
            <div style="margin-bottom: 1.25rem; background: var(--bg-main); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; align-items: center; position: relative; font-size: 0.8rem; font-weight: 700;">
                <div style="display: flex; flex-direction: column; align-items: center; z-index: 2; flex: 1;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; background: ${currentStep >= 1 ? 'var(--primary)' : '#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-bottom: 0.25rem;">1</div>
                  <span style="color: ${currentStep >= 1 ? 'var(--primary-dark)' : 'var(--text-muted)'};">Order Placed</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; z-index: 2; flex: 1;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; background: ${currentStep >= 2 ? 'var(--warning)' : '#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-bottom: 0.25rem;">2</div>
                  <span style="color: ${currentStep >= 2 ? 'var(--warning)' : 'var(--text-muted)'};">Kitchen Preparing</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; z-index: 2; flex: 1;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; background: ${currentStep >= 3 ? 'var(--success)' : '#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-bottom: 0.25rem;">3</div>
                  <span style="color: ${currentStep >= 3 ? 'var(--success)' : 'var(--text-muted)'};">Ready for Pickup</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; z-index: 2; flex: 1;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; background: ${currentStep >= 4 ? 'var(--primary-dark)' : '#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-bottom: 0.25rem;">4</div>
                  <span style="color: ${currentStep >= 4 ? 'var(--primary-dark)' : 'var(--text-muted)'};">Completed</span>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Items List -->
          <div style="margin-bottom: 1rem; background: white; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            ${ord.items.map(i => `
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.3rem 0; border-bottom: 1px dashed #f1f5f9;">
                <span style="color: var(--text-dark); font-weight: 600;">${i.name} × ${i.quantity}</span>
                <strong style="color: var(--primary-dark);">₹${i.price * i.quantity}</strong>
              </div>
            `).join('')}
          </div>

          <!-- Order Summary Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--primary-light); padding: 0.85rem 1rem; border-radius: var(--radius-sm); flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">Total Paid Amount</span>
              <strong style="font-size: 1.25rem; color: var(--primary-dark); font-weight: 800;">₹${ord.finalAmount}</strong>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${ord.digitalToken ? `<a href="/token.html?id=${ord._id}" class="btn btn-outline" style="padding: 0.45rem 0.85rem; font-size: 0.85rem; font-weight: 700;">📱 Digital QR Token</a>` : ''}
              ${ord.status === 'COMPLETED' ? `<button onclick="openReviewModal('${ord._id}')" class="btn btn-outline" style="padding: 0.45rem 0.85rem; font-size: 0.85rem; font-weight: 600;">⭐ Rate Food</button>` : ''}
              <button onclick="reorderOrder('${ord._id}')" class="btn btn-primary" style="padding: 0.45rem 0.85rem; font-size: 0.85rem; font-weight: 700;">🔄 ORDER AGAIN</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
  }
}

async function reorderOrder(orderId) {
  try {
    const res = await apiRequest(`/orders/${orderId}/reorder`, 'POST');
    if (res.items && res.items.length > 0) {
      res.items.forEach(item => Cart.addItem(item, item.quantity));
      showToast('Items added to cart for reorder!', 'success');
      setTimeout(() => window.location.href = '/cart.html', 800);
    }
  } catch (err) {}
}

function openReviewModal(orderId) {
  document.getElementById('review-order-id').value = orderId;
  document.getElementById('review-modal').style.display = 'flex';
}

async function submitReview() {
  const orderId = document.getElementById('review-order-id').value;
  const foodRating = document.getElementById('food-rating-select').value;
  const comment = document.getElementById('review-comment-input').value;

  try {
    await apiRequest('/reviews', 'POST', { orderId, foodRating, comment });
    showToast('Review submitted successfully!', 'success');
    document.getElementById('review-modal').style.display = 'none';
  } catch (err) {}
}

window.reorderOrder = reorderOrder;
window.openReviewModal = openReviewModal;
window.submitReview = submitReview;
