// Campus Wallet Client Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  loadWalletData();
});

async function loadWalletData() {
  try {
    const res = await apiRequest('/wallet/balance');
    document.getElementById('wallet-balance').textContent = `₹${res.balance}`;

    const container = document.getElementById('wallet-transactions-list');
    if (!container) return;

    if (res.transactions.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">No wallet transactions yet.</p>`;
      return;
    }

    container.innerHTML = res.transactions.map(t => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
        <div>
          <strong>${t.description}</strong>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${new Date(t.createdAt).toLocaleString()}</div>
        </div>
        <div style="font-weight: 700; font-size: 1.05rem; color: ${t.type === 'credit' || t.type === 'topup' || t.type === 'refund' ? 'var(--success)' : 'var(--danger)'};">
          ${t.type === 'credit' || t.type === 'topup' || t.type === 'refund' ? '+' : '-'}₹${t.amount}
        </div>
      </div>
    `).join('');
  } catch (err) {}
}

async function topupWalletAmount() {
  const amount = document.getElementById('topup-amount-input')?.value;
  if (!amount || Number(amount) <= 0) {
    showToast('Enter a valid top-up amount', 'error');
    return;
  }

  try {
    const res = await apiRequest('/wallet/topup', 'POST', { amount: Number(amount) });
    showToast(res.message, 'success');
    loadWalletData();
  } catch (err) {}
}

window.topupWalletAmount = topupWalletAmount;
