// Modern Food Menu & Filter Handler
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
      res.data.map(b => `<option value="${b._id}">${b.name} ${b.isClosed ? '(CLOSED)' : ''}</option>`).join('');
  } catch (e) {}
}

async function loadMenuItems() {
  const gridContainer = document.getElementById('menu-grid');
  if (!gridContainer) return;

  // Render Skeleton Shimmer Placeholders while loading
  gridContainer.innerHTML = Array(6).fill(0).map(() => `
    <div class="card food-card" style="height: 320px;">
      <div class="skeleton" style="height: 160px; margin-bottom: 0.75rem;"></div>
      <div class="skeleton" style="height: 20px; width: 70%; margin-bottom: 0.5rem;"></div>
      <div class="skeleton" style="height: 15px; width: 90%; margin-bottom: 0.75rem;"></div>
      <div class="skeleton" style="height: 35px; width: 100%; margin-top: auto;"></div>
    </div>
  `).join('');

  const searchVal = document.getElementById('search-input')?.value || '';
  const branchVal = document.getElementById('branch-select')?.value || '';
  const specialOnly = document.getElementById('today-special-checkbox')?.checked ? 'true' : '';

  let query = `?search=${encodeURIComponent(searchVal)}`;
  if (currentCategory) query += `&category=${encodeURIComponent(currentCategory)}`;
  if (currentVeg) query += `&isVegetarian=${currentVeg}`;
  if (branchVal) query += `&branchId=${branchVal}`;
  if (specialOnly) query += `&isTodaySpecial=true`;

  try {
    const res = await apiRequest(`/menu${query}`);
    const items = res.data;

    if (items.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3.5rem 1rem; background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border);">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🍽️</div>
          <h3 style="color: var(--primary-dark);">No food items found</h3>
          <p style="color: var(--text-muted); margin-top: 0.25rem;">Try tweaking your search keywords or category filters.</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = items.map(item => {
      const rating = (4.2 + (item.popularity % 8) * 0.1).toFixed(1);
      const prepTime = item.preparationTime || 10;

      return `
        <div class="card food-card">
          ${item.isTodaySpecial ? `<span style="position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 800; z-index: 2; box-shadow: 0 3px 8px rgba(245, 158, 11, 0.4);">🔥 TODAY'S SPECIAL</span>` : ''}

          <div class="food-card-img-wrapper">
            <img src="${item.image}" alt="${item.name}" onerror="handleImageError(this)">
            <div class="rating-badge">⭐ ${rating} • 🔥 Popular</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.35rem;">
            <strong style="font-size: 1.1rem; color: var(--text-main); font-weight: 700;">${item.name}</strong>
            <button onclick="toggleFav('${item._id}')" style="background: none; border: none; cursor: pointer; font-size: 1.15rem;" title="Add to favorites">❤️</button>
          </div>

          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${item.description || 'Freshly prepared campus canteen delicacy.'}
          </p>

          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
            <span class="dietary-tag ${item.isVegetarian ? 'tag-veg' : 'tag-nonveg'}">
              ${item.isVegetarian ? '🥬 Vegetarian' : '🍗 Non-Veg'}
            </span>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">⏱️ ${prepTime} min prep</span>
          </div>

          <!-- Allergy Warning Banners -->
          ${item.allergyInfo && item.allergyInfo.length > 0 ? `
            <div style="font-size: 0.72rem; color: #b45309; background: #fffbeb; padding: 4px 8px; border-radius: 6px; margin-bottom: 0.75rem; border: 1px solid #fef3c7;">
              ⚠️ Contains: ${item.allergyInfo.join(', ')}
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: auto;">
            <div>
              <div class="food-price">₹${item.price}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Stock: ${item.stockQuantity}</div>
            </div>
            <button onclick='Cart.addItem(${JSON.stringify(item).replace(/'/g, "&apos;")})' class="btn btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem;">+ Add to Cart</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    gridContainer.innerHTML = `<div style="grid-column: 1/-1; color: var(--danger); text-align: center; padding: 2rem;">Failed to load food menu.</div>`;
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

async function toggleFav(id) {
  if (!Auth.isLoggedIn()) {
    showToast('Please log in to add favorites', 'error');
    return;
  }
  try {
    const res = await apiRequest(`/menu/favorites/${id}`, 'POST');
    showToast(res.message, 'success');
  } catch (e) {}
}

window.filterCategory = filterCategory;
window.filterVeg = filterVeg;
window.loadMenuItems = loadMenuItems;
window.toggleFav = toggleFav;
