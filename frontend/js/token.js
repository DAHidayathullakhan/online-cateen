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
    document.getElementById('qr-image').src = token.qrCodeDataUrl;
    document.getElementById('branch-name').textContent = token.branch ? token.branch.name : 'Main Canteen';
    
    if (token.pickupWindow) {
      document.getElementById('pickup-time').textContent = `${token.pickupWindow.startTime} - ${token.pickupWindow.endTime}`;
      startPickupCountdown(token.pickupWindow.startTime);
    } else {
      document.getElementById('pickup-time').textContent = 'Room Delivery';
    }

    // Render Order Items
    const itemsList = document.getElementById('token-items-list');
    itemsList.innerHTML = order.items.map(i => `
      <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px dashed var(--border-color);">
        <span>${i.name} × ${i.quantity}</span>
        <strong>₹${i.price * i.quantity}</strong>
      </div>
    `).join('');

    document.getElementById('token-total').textContent = `₹${order.finalAmount}`;
  } catch (err) {
    console.error(err);
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
