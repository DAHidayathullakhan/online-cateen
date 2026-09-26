// Branch Manager Dashboard Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth(['Branch Manager', 'Admin', 'Canteen Operator']);
  loadTransfers();
});

async function loadTransfers() {
  const container = document.getElementById('transfers-table-body');
  if (!container) return;

  try {
    const res = await apiRequest('/transfers');
    const transfers = res.data;

    container.innerHTML = transfers.map(t => `
      <tr>
        <td><strong>${t.transferNumber}</strong></td>
        <td>${t.menuItem ? t.menuItem.name : 'Food Item'}</td>
        <td>${t.quantity}</td>
        <td>${t.sourceBranch ? t.sourceBranch.name : 'Branch A'}</td>
        <td>${t.destinationBranch ? t.destinationBranch.name : 'Branch B'}</td>
        <td><span class="status-badge status-${t.status === 'Received' ? 'COMPLETED' : t.status === 'Approved' ? 'READY' : 'NEW'}">${t.status}</span></td>
        <td>
          ${t.status === 'Requested' ? `<button onclick="approveTransfer('${t._id}')" class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Approve</button>` : ''}
          ${t.status === 'Approved' ? `<button onclick="receiveTransfer('${t._id}')" class="btn btn-success" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Receive Stock</button>` : ''}
          ${t.status === 'Received' ? `✅ Received` : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {}
}

async function requestStockTransfer() {
  const menuItemId = document.getElementById('trf-item-select')?.value;
  const quantity = document.getElementById('trf-qty-input')?.value;
  const sourceBranchId = document.getElementById('trf-source-select')?.value;
  const destinationBranchId = document.getElementById('trf-dest-select')?.value;

  try {
    await apiRequest('/transfers', 'POST', {
      menuItemId,
      quantity,
      sourceBranchId,
      destinationBranchId
    });
    showToast('Stock transfer requested successfully!', 'success');
    loadTransfers();
  } catch (err) {}
}

async function approveTransfer(id) {
  try {
    await apiRequest(`/transfers/${id}/approve`, 'PATCH');
    showToast('Transfer approved!', 'success');
    loadTransfers();
  } catch (err) {}
}

async function receiveTransfer(id) {
  try {
    const res = await apiRequest(`/transfers/${id}/receive`, 'PATCH');
    showToast(res.message, 'success');
    loadTransfers();
  } catch (err) {}
}

window.requestStockTransfer = requestStockTransfer;
window.approveTransfer = approveTransfer;
window.receiveTransfer = receiveTransfer;
