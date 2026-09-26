// Canteen Operator Dashboard Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth(['Canteen Operator', 'Admin', 'Branch Manager']);
  loadQueueSummary();
});

async function verifyToken() {
  const tokenInput = document.getElementById('token-input')?.value.trim();
  if (!tokenInput) {
    showToast('Please enter or scan a digital token number.', 'error');
    return;
  }

  try {
    const res = await apiRequest('/tokens/verify', 'POST', { tokenNumber: tokenInput });
    showToast(res.message, 'success');
    document.getElementById('verification-result').innerHTML = `
      <div style="background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 1rem; border-radius: var(--radius); margin-top: 1rem;">
        <h4>✅ Order Verified Successfully!</h4>
        <p>Token: <strong>${tokenInput}</strong></p>
        <p>Status: Order collected & completed.</p>
      </div>
    `;
    document.getElementById('token-input').value = '';
    loadQueueSummary();
  } catch (err) {
    document.getElementById('verification-result').innerHTML = `
      <div style="background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 1rem; border-radius: var(--radius); margin-top: 1rem;">
        <h4>❌ Verification Failed</h4>
        <p>${err.message}</p>
      </div>
    `;
  }
}

async function loadQueueSummary() {
  try {
    const res = await apiRequest('/orders?status=READY');
    const count = res.count || 0;
    const elem = document.getElementById('ready-queue-count');
    if (elem) elem.textContent = count;
  } catch (e) {}
}

async function recordFoodWaste() {
  const branchId = document.getElementById('waste-branch-select')?.value;
  const menuItemId = document.getElementById('waste-item-select')?.value;
  const preparedQuantity = document.getElementById('waste-prep-qty')?.value;
  const soldQuantity = document.getElementById('waste-sold-qty')?.value;
  const remainingQuantity = document.getElementById('waste-rem-qty')?.value;
  const wastedQuantity = document.getElementById('waste-wasted-qty')?.value;

  try {
    const res = await apiRequest('/food-waste', 'POST', {
      branchId,
      menuItemId,
      preparedQuantity,
      soldQuantity,
      remainingQuantity,
      wastedQuantity
    });
    showToast('Food waste record saved successfully!', 'success');
    if (res.data.transferSuggestion) {
      alert(`Transfer Suggestion: ${res.data.transferSuggestion.message}`);
    }
  } catch (err) {}
}

window.verifyToken = verifyToken;
window.recordFoodWaste = recordFoodWaste;
