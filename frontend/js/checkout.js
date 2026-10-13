// Checkout & Order Placement Client Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  loadBranchesForCheckout();
  loadDeliveryLocations();
  renderCartSummary();

  document.getElementById('order-type-select')?.addEventListener('change', (e) => {
    const isDelivery = e.target.value === 'Room Delivery';
    document.getElementById('pickup-slot-section').style.display = isDelivery ? 'none' : 'block';
    document.getElementById('delivery-section').style.display = isDelivery ? 'block' : 'none';
    recalculateCart();
  });

  document.getElementById('branch-checkout-select')?.addEventListener('change', () => {
    loadPickupSlots();
  });
});

let appliedCouponCode = null;

async function loadBranchesForCheckout() {
  const select = document.getElementById('branch-checkout-select');
  if (!select) return;

  try {
    const res = await apiRequest('/branches');
    select.innerHTML = res.data.map(b => `<option value="${b._id}" ${b.isClosed ? 'disabled' : ''}>${b.name} ${b.isClosed ? '(CLOSED)' : ''}</option>`).join('');
    loadPickupSlots();
  } catch (e) {}
}

async function loadPickupSlots() {
  const select = document.getElementById('pickup-slot-select');
  const branchId = document.getElementById('branch-checkout-select')?.value;
  if (!select || !branchId) return;

  try {
    const res = await apiRequest(`/pickup-slots?branchId=${branchId}`);
    const slots = res.data;

    if (slots.length === 0) {
      select.innerHTML = `<option value="">No pickup slots active today</option>`;
      return;
    }

    select.innerHTML = slots.map(s => {
      const isFull = s.currentOrders >= s.maxOrders;
      return `<option value="${s._id}" ${isFull ? 'disabled' : ''}>${s.startTime} - ${s.endTime} ${isFull ? '[SLOT FULL]' : `(${s.availableCapacity} slots left)`}</option>`;
    }).join('');
  } catch (e) {}
}

async function loadDeliveryLocations() {
  const bSelect = document.getElementById('delivery-building-select');
  if (!bSelect) return;

  try {
    const res = await apiRequest('/deliveries/locations');
    bSelect.innerHTML = res.data.map(l => `<option value="${l.buildingName}">${l.buildingName}</option>`).join('');
  } catch (e) {}
}

async function applyCoupon() {
  const code = document.getElementById('coupon-input')?.value.trim();
  if (!code) {
    showToast('Please enter a coupon code.', 'error');
    return;
  }
  appliedCouponCode = code;
  await recalculateCart();
}

async function recalculateCart() {
  const cartItems = Cart.getCart();
  if (cartItems.length === 0) return;

  const orderType = document.getElementById('order-type-select')?.value || 'Pickup';
  const branchId = document.getElementById('branch-checkout-select')?.value;

  try {
    const res = await apiRequest('/cart/calculate', 'POST', {
      items: cartItems,
      orderType,
      branchId,
      couponCode: appliedCouponCode
    });

    const data = res.data;
    document.getElementById('summary-subtotal').textContent = `₹${data.foodTotal}`;
    document.getElementById('summary-delivery').textContent = `₹${data.deliveryCharge}`;
    document.getElementById('summary-discount').textContent = `-₹${data.discountAmount}`;
    document.getElementById('summary-final').textContent = `₹${data.finalAmount}`;

    if (data.couponCode) {
      showToast(`Coupon "${data.couponCode}" applied successfully!`, 'success');
    }
    return data;
  } catch (err) {
    appliedCouponCode = null;
  }
}

async function renderCartSummary() {
  const container = document.getElementById('checkout-items-list');
  if (!container) return;

  const cart = Cart.getCart();
  if (cart.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted);">Your cart is empty.</p>`;
    return;
  }

  container.innerHTML = cart.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
      <div>
        <strong>${item.name}</strong>
        <div style="font-size: 0.8rem; color: var(--text-muted);">₹${item.price} × ${item.quantity}</div>
      </div>
      <div style="font-weight: 700;">₹${item.price * item.quantity}</div>
    </div>
  `).join('');

  await recalculateCart();
}

async function submitCheckout() {
  const cartItems = Cart.getCart();
  if (cartItems.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  const branchId = document.getElementById('branch-checkout-select')?.value;
  const orderType = document.getElementById('order-type-select')?.value;
  const pickupSlotId = document.getElementById('pickup-slot-select')?.value;

  if (orderType === 'Pickup' && !pickupSlotId) {
    showToast('Please select a pickup window slot.', 'error');
    return;
  }

  const deliveryLocation = {
    building: document.getElementById('delivery-building-select')?.value,
    floor: document.getElementById('delivery-floor-input')?.value || '1st Floor',
    roomNumber: document.getElementById('delivery-room-input')?.value || '101'
  };

  const specialInstructions = document.getElementById('special-instructions-input')?.value || '';

  const selectedPaymentMethod = document.querySelector('input[name="checkout-payment-method"]:checked')?.value || 'CASH';

  const payload = {
    branchId,
    orderType,
    pickupWindow: orderType === 'Pickup' ? pickupSlotId : undefined,
    deliveryLocation: orderType === 'Room Delivery' ? deliveryLocation.building : undefined,
    roomNumber: orderType === 'Room Delivery' ? `${deliveryLocation.floor}, ${deliveryLocation.roomNumber}` : undefined,
    items: cartItems.map(item => ({
      id: item._id || item.id,
      quantity: item.quantity
    })),
    paymentMethod: selectedPaymentMethod,
    specialInstructions
  };

  try {
    const res = await apiRequest('/orders', 'POST', payload);

    Cart.clearCart();
    showToast(res.message || 'Order placed successfully!', 'success');
    
    const createdOrderId = res.data ? (res.data._id || res.data.id) : res.orderId;
    setTimeout(() => {
      window.location.href = `/token.html?id=${createdOrderId}`;
    }, 1200);
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Failed to place order. Please try again.', 'error');
  }
}

window.applyCoupon = applyCoupon;
window.recalculateCart = recalculateCart;
window.submitCheckout = submitCheckout;
