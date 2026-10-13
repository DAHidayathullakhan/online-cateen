// Digital Food Token Page Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  loadTokenDetails();
});

async function loadTokenDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    showToast('No order ID provided.', 'error');
    return;
  }

  try {
    const res = await apiRequest(`/tokens/order/${orderId}`);
    const token = res.data;
    const order = token.order;

    document.getElementById('token-number').textContent = token.tokenNumber;
    document.getElementById('token-status').textContent = token.status;
    document.getElementById('token-status').className = `status-badge status-${token.status === 'Active' ? 'READY' : token.status === 'Used' ? 'COMPLETED' : 'CANCELLED'}`;
    
    if (order.orderNumber) {
      document.getElementById('order-number-display').textContent = `Order #${order.orderNumber}`;
    }

    // Payment banner & cash instructions
    const banner = document.getElementById('payment-notice-banner');
    if (banner) {
      if (order.paymentMethod === 'CASH' && order.paymentStatus !== 'PAID') {
        banner.style.background = '#fffbeb';
        banner.style.color = '#92400e';
        banner.style.border = '1px solid #fde68a';
        banner.innerHTML = `
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #b45309; margin-bottom: 0.2rem;">⚠️ Payment Pending (Cash)</div>
          <div>Please pay <strong>₹${order.finalAmount || order.totalAmount}</strong> at the canteen counter when picking up your food.</div>
        `;
      } else {
        banner.style.background = '#ecfdf5';
        banner.style.color = '#065f46';
        banner.style.border = '1px solid #a7f3d0';
        banner.innerHTML = `
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #047857; margin-bottom: 0.2rem;">✅ Online Payment Verified</div>
          <div>Total amount of <strong>₹${order.finalAmount || order.totalAmount}</strong> has been successfully received.</div>
        `;
      }
    }

    document.getElementById('branch-name').textContent = token.branch ? token.branch.name : (order.branch || 'Main Canteen');
    
    if (token.pickupWindow && token.pickupWindow.startTime) {
      document.getElementById('pickup-time').textContent = token.pickupWindow.endTime
        ? `${token.pickupWindow.startTime} - ${token.pickupWindow.endTime}`
        : token.pickupWindow.startTime;
      startPickupCountdown(token.pickupWindow.startTime);
    } else if (order.pickupWindow) {
      document.getElementById('pickup-time').textContent = order.pickupWindow;
    } else {
      document.getElementById('pickup-time').textContent = order.deliveryLocation ? `${order.deliveryLocation} (${order.roomNumber || ''})` : 'Room Delivery';
    }

    // Render Order Items
    const itemsList = document.getElementById('token-items-list');
    const items = order.items || [];
    itemsList.innerHTML = items.map(i => `
      <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px dashed var(--border-color);">
        <span>${i.name || i.item?.name} × ${i.quantity}</span>
        <strong>₹${(i.price || i.item?.price || 0) * i.quantity}</strong>
      </div>
    `).join('');

    document.getElementById('token-total').textContent = `₹${order.finalAmount || order.totalAmount}`;
  } catch (err) {
    console.error(err);
    showToast('Failed to load token details.', 'error');
  }
}

function startPickupCountdown(startTimeStr) {
  const timerElem = document.getElementById('countdown-timer');
  if (!timerElem) return;

  setInterval(() => {
    // Simple mock countdown simulation display
    timerElem.textContent = "Your pickup window starts in 15 minutes.";
  }, 1000);
}
