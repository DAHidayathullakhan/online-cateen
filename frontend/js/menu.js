document.addEventListener('DOMContentLoaded', () => {
  loadBranches();
  loadMenuItems();

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => loadMenuItems(), 300);
    });
  }
});

let currentCategory = '';
let currentVeg = '';

async function loadBranches() {
  const branchSelect = document.getElementById('branch-select');
  if (!branchSelect) return;

  try {
    const res = await apiRequest('/branches');
    branchSelect.innerHTML = `<option value="">All Campus Branches</option>` +
      (res.data || []).map(b => `<option value="${b._id}">${b.name} ${b.isClosed ? '(CLOSED)' : ''}</option>`).join('');
  } catch (e) {}
}

async function loadMenuItems() {
  const gridContainer = document.getElementById('menu-grid');
  if (!gridContainer) return;

  // Pulse skeleton loaders while loading
  gridContainer.innerHTML = Array(6).fill(0).map(() => `
    <div class="card" style="height: 320px; padding: 1rem;">
      <div class="skeleton" style="height: 160px; margin-bottom: 0.75rem;"></div>
      <div class="skeleton" style="height: 20px; width: 70%; margin-bottom: 0.5rem;"></div>
      <div class="skeleton" style="height: 15px; width: 90%; margin-bottom: 0.75rem;"></div>
      <div class="skeleton" style="height: 35px; width: 100%; margin-top: auto;"></div>
    </div>
  `).join('');

  const searchVal = document.getElementById('search-input')?.value || '';
  const branchVal = document.getElementById('branch-select')?.value || '';
  const specialOnly = document.getElementById('today-special-checkbox')?.checked || false;

  try {
    const res = await FoodService.getFoods({
      category: currentCategory,
      search: searchVal,
      isVegetarian: currentVeg,
      isTodaySpecial: specialOnly,
      branchId: branchVal
    });

    const items = res.data || [];
    gridContainer.innerHTML = ''; // Prevent duplication before rendering

    if (items.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3.5rem 1rem; background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border);">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🍽️</div>
          <h3 style="color: var(--primary-dark); font-weight: 800;">No food items found matching your filters</h3>
          <p style="color: var(--text-muted); margin-top: 0.35rem;">Try tweaking your search keywords or category filters.</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = items.map(item => {
      const rating = (4.2 + (item.popularity ? (item.popularity % 8) * 0.1 : 0.3)).toFixed(1);
      const prepTime = item.preparationTime || 10;
      const imageUrl = item.image || '/images/food/default-food.svg';
      const isVeg = item.isVegetarian !== undefined ? item.isVegetarian : item.vegetarian;
      const price = Number(item.price || 0).toFixed(0);

      return `
        <div class="card">
          ${(item.isTodaySpecial || item.isSpecial) ? `<span style="position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 800; z-index: 2; box-shadow: 0 3px 8px rgba(245, 158, 11, 0.4);">🔥 TODAY'S SPECIAL</span>` : ''}

          <div class="food-card-img-wrapper">
            <img src="${imageUrl}" alt="${item.name}" onerror="this.onerror=null; this.src='/images/food/default-food.svg';">
            <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(15, 23, 42, 0.85); color: white; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; backdrop-filter: blur(4px);">⭐ ${rating} • 🔥 Popular</div>
          </div>

          <div class="food-card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.35rem;">
              <strong style="font-size: 1.05rem; color: var(--text-main); font-weight: 800;">${item.name}</strong>
            </div>

            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${item.description || 'Freshly prepared campus canteen delicacy.'}
            </p>

            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
              <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${isVeg ? '#dcfce7' : '#fee2e2'}; color: ${isVeg ? '#166534' : '#991b1b'};">
                ${isVeg ? '🥬 Vegetarian' : '🍗 Non-Veg'}
              </span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">⏱️ ${prepTime} min prep</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: auto;">
              <div>
                <div class="food-price">₹${price}</div>
              </div>
              <button onclick='Cart.addItem(${JSON.stringify(item).replace(/'/g, "&apos;")})' class="btn btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem;">+ Add to Cart</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load menu items:', err);
    gridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">
        <h3 style="color: var(--danger); font-weight: 800; margin-bottom: 0.5rem;">Unable to load menu. Please try again.</h3>
        <button onclick="loadMenuItems()" class="btn btn-outline" style="margin-top: 0.75rem; font-weight: 700;">🔄 Try Again</button>
      </div>
    `;
  }
}

function filterCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.cat === cat);
  });
  loadMenuItems();
}

function filterVeg(vegType) {
  currentVeg = vegType;
  loadMenuItems();
}

window.filterCategory = filterCategory;
window.filterVeg = filterVeg;
window.loadMenuItems = loadMenuItems;
