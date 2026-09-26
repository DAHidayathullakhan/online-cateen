const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');
const { Favorite } = require('../models/MiscModels');
const { logAudit } = require('../utils/auditLogger');

// GET /api/menu (Students & Guest view with backend filtering & pagination)
exports.getMenuItems = async (req, res, next) => {
  try {
    const {
      search,
      category,
      isVegetarian,
      isAvailable,
      isTodaySpecial,
      maxPrice,
      maxPrepTime,
      branchId,
      sortBy
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (isVegetarian === 'true') filter.isVegetarian = true;
    if (isVegetarian === 'false') filter.isVegetarian = false;
    if (isAvailable === 'true') filter.isAvailable = true;
    if (isTodaySpecial === 'true') filter.isTodaySpecial = true;
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };
    if (maxPrepTime) filter.preparationTime = { $lte: Number(maxPrepTime) };
    if (branchId) filter.branches = branchId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let query = MenuItem.find(filter).populate('branches', 'name code');

    if (sortBy === 'price_asc') query = query.sort({ price: 1 });
    else if (sortBy === 'price_desc') query = query.sort({ price: -1 });
    else if (sortBy === 'popularity') query = query.sort({ popularity: -1 });
    else query = query.sort({ createdAt: -1 });

    const items = await query;
    const categories = await MenuCategory.find({ isActive: true }).sort({ displayOrder: 1 });

    res.json({
      success: true,
      count: items.length,
      categories,
      data: items
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/menu/:id
exports.getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('branches');
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// POST /api/menu (Admin / Operator / Manager)
exports.createMenuItem = async (req, res, next) => {
  try {
    const itemData = req.body;
    const item = await MenuItem.create(itemData);
    await logAudit({ user: req.user, action: 'CREATE_MENU_ITEM', target: 'MenuItem', targetId: item._id, req });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// PUT /api/menu/:id
exports.updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    await logAudit({ user: req.user, action: 'UPDATE_MENU_ITEM', target: 'MenuItem', targetId: item._id, req });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/menu/:id
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    item.isActive = false;
    await item.save();
    await logAudit({ user: req.user, action: 'DISABLE_MENU_ITEM', target: 'MenuItem', targetId: item._id, req });
    res.json({ success: true, message: 'Menu item disabled successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/menu/favorites/:id (Student toggle favorite)
exports.toggleFavorite = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const menuItemId = req.params.id;

    const existing = await Favorite.findOne({ student: studentId, menuItem: menuItemId });
    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return res.json({ success: true, isFavorite: false, message: 'Removed from favorites' });
    } else {
      await Favorite.create({ student: studentId, menuItem: menuItemId });
      return res.json({ success: true, isFavorite: true, message: 'Added to favorites' });
    }
  } catch (err) {
    next(err);
  }
};

// GET /api/menu/favorites (Student favorites list)
exports.getStudentFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ student: req.user.id }).populate('menuItem');
    const items = favorites.map(f => f.menuItem).filter(item => item && item.isActive);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};
