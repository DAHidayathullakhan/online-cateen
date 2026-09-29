const FoodService = {
  async getFoods({ category = '', search = '', isVegetarian = '', isTodaySpecial = false, branchId = '' } = {}) {
    try {
      // Primary: Fetch from Express REST API connected to MongoDB
      let query = `?search=${encodeURIComponent(search)}`;
      if (category && category !== 'all' && category !== 'All Categories') query += `&category=${encodeURIComponent(category)}`;
      if (isVegetarian !== '' && isVegetarian !== 'all') query += `&isVegetarian=${isVegetarian}`;
      if (branchId && branchId !== 'all') query += `&branchId=${branchId}`;
      if (isTodaySpecial) query += `&isTodaySpecial=true`;

      const res = await apiRequest(`/menu${query}`);
      if (res && res.success && res.data && res.data.length > 0) {
        return { success: true, data: res.data };
      }
    } catch (e) {
      console.warn('API menu fetch failed or empty, falling back to local food data:', e);
    }

    // Fallback: Local food dataset
    if (typeof window.LOCAL_FOODS !== 'undefined') {
      let items = [...window.LOCAL_FOODS];

      if (category && category.toLowerCase() !== 'all' && category !== 'All Categories') {
        items = items.filter(f => f.category.toLowerCase() === category.toLowerCase());
      }
      if (isVegetarian !== '' && isVegetarian !== 'all') {
        const isVegBool = isVegetarian === 'true';
        items = items.filter(f => f.vegetarian === isVegBool || f.isVegetarian === isVegBool);
      }
      if (isTodaySpecial) {
        items = items.filter(f => f.isSpecial === true || f.isTodaySpecial === true);
      }
      if (search && search.trim() !== '') {
        const q = search.toLowerCase().trim();
        items = items.filter(f =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
        );
      }

      return { success: true, data: items };
    }

    return { success: true, data: [] };
  }
};

window.FoodService = FoodService;
