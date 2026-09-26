// Meal Subscription Plans Client Script
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  loadPlans();
  loadMySubscriptions();
});

async function loadPlans() {
  const container = document.getElementById('meal-plans-list');
  if (!container) return;

  try {
    const res = await apiRequest('/subscriptions/plans');
    container.innerHTML = res.data.map(p => `
      <div class="card" style="border: 2px solid var(--primary); text-align: center; padding: 1.5rem;">
        <h3 style="color: var(--primary-dark);">${p.planName}</h3>
        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-dark); margin: 0.5rem 0;">${p.totalMeals} Meals</div>
        <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">₹${p.price}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Valid for ${p.validityDays} days</div>
        <button onclick="buyPlan('${p._id}')" class="btn btn-primary btn-block">Buy Pass Now</button>
      </div>
    `).join('');
  } catch (e) {}
}

async function loadMySubscriptions() {
  const container = document.getElementById('my-subscriptions-list');
  if (!container) return;

  try {
    const res = await apiRequest('/subscriptions/my-subscriptions');
    if (res.data.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">No active meal passes purchased.</p>`;
      return;
    }

    container.innerHTML = res.data.map(s => `
      <div class="card" style="margin-bottom: 1rem; background: var(--primary-light);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${s.mealPlan ? s.mealPlan.planName : 'Meal Pass'}</strong>
            <div style="font-size: 0.85rem; color: var(--text-muted);">Expires: ${new Date(s.expiryDate).toLocaleDateString()}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary-dark);">${s.remainingMeals} / ${s.totalMeals} Meals Left</div>
            <button onclick="useSubscriptionMeal()" class="btn btn-success" style="padding: 0.3rem 0.75rem; font-size: 0.85rem; margin-top: 0.4rem;">Use 1 Meal Pass</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {}
}

async function buyPlan(planId) {
  try {
    const res = await apiRequest('/subscriptions/buy', 'POST', { planId });
    showToast(res.message, 'success');
    loadMySubscriptions();
  } catch (e) {}
}

async function useSubscriptionMeal() {
  try {
    const res = await apiRequest('/subscriptions/consume', 'POST');
    showToast(res.message, 'success');
    loadMySubscriptions();
  } catch (e) {}
}

window.buyPlan = buyPlan;
window.useSubscriptionMeal = useSubscriptionMeal;
