// Group Order & Split Payment Client Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  loadGroupBranches();
});

let currentGroupId = null;

async function loadGroupBranches() {
  const select = document.getElementById('group-branch-select');
  if (!select) return;
  try {
    const res = await apiRequest('/branches');
    select.innerHTML = res.data.map(b => `<option value="${b._id}">${b.name}</option>`).join('');
  } catch (e) {}
}

async function createGroupOrder() {
  const branchId = document.getElementById('group-branch-select')?.value;
  try {
    const res = await apiRequest('/groups/create', 'POST', { branchId });
    showToast(res.message, 'success');
    document.getElementById('group-code-display').textContent = res.groupCode;
    currentGroupId = res.group._id;
    renderGroupDetails(res.group);
  } catch (err) {}
}

async function joinGroupOrder() {
  const code = document.getElementById('join-code-input')?.value.trim();
  if (!code) {
    showToast('Enter group order code', 'error');
    return;
  }

  try {
    const res = await apiRequest('/groups/join', 'POST', { groupCode: code });
    showToast(res.message, 'success');
    currentGroupId = res.group._id;
    renderGroupDetails(res.group);
  } catch (err) {}
}

function renderGroupDetails(group) {
  document.getElementById('group-details-card').style.display = 'block';
  document.getElementById('group-status-badge').textContent = group.status;

  const membersList = document.getElementById('group-members-list');
  membersList.innerHTML = group.members.map(m => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
      <div>
        <strong>${m.user ? m.user.name || 'Student Member' : 'Member'}</strong>
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Items: ${m.items.length > 0 ? m.items.map(i => `${i.name} (x${i.quantity})`).join(', ') : 'No items added'}
        </div>
      </div>
      <div>
        <span style="font-weight: 700; margin-right: 0.75rem;">₹${m.subtotal}</span>
        <span class="status-badge status-${m.paymentStatus === 'Paid' ? 'COMPLETED' : 'PREPARING'}">${m.paymentStatus}</span>
        ${m.user._id === Auth.getUser().id && m.paymentStatus === 'Pending' ? `<button onclick="payMySplit('${group._id}')" class="btn btn-success" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;">Pay Split (₹${m.subtotal})</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function payMySplit(groupId) {
  try {
    const res = await apiRequest(`/groups/${groupId}/pay-split`, 'POST');
    showToast(res.message, 'success');
    renderGroupDetails(res.group);
  } catch (err) {}
}

window.createGroupOrder = createGroupOrder;
window.joinGroupOrder = joinGroupOrder;
window.payMySplit = payMySplit;
