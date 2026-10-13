const MenuItem = require('../models/MenuItem');
const { isSupabaseConfigured, menuService } = require('../services/supabaseService');

exports.getMenuItems = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const items = await menuService.getMenuItems(req.query);
      return res.json({
        success: true,
        count: items.length,
        data: items
      });
    }

    const { category, isVegetarian, isTodaySpecial, search, branchId, sort, isAvailable } = req.query;
    let filter = {};

    // Allow staff/admin to view all items including unavailable if isAvailable === 'all'
    if (isAvailable !== 'all') {
      filter.isAvailable = true;
    }

    if (category && category !== 'all' && category !== 'All Categories' && category !== 'All Items' && category !== 'All Food' && category.trim() !== '') {
      filter.category = category;
    }

    if (isVegetarian !== undefined && isVegetarian !== '' && isVegetarian !== 'all') {
      filter.isVegetarian = isVegetarian === 'true';
    }

    if (isTodaySpecial === 'true') {
      filter.isTodaySpecial = true;
    }

    if (branchId && branchId !== 'all' && branchId !== 'All Branches' && branchId.trim() !== '') {
      filter.branches = branchId;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { ingredients: searchRegex }
      ];
    }

    let query = MenuItem.find(filter);

    if (sort === 'price-low') {
      query = query.sort({ price: 1 });
    } else if (sort === 'price-high') {
      query = query.sort({ price: -1 });
    } else if (sort === 'popularity') {
      query = query.sort({ popularity: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const items = await query.exec();

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    next(err);
  }
};

exports.getMenuItemById = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const item = await menuService.getMenuItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Food item not found.' });
      }
      return res.json({ success: true, data: item });
    }

    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

exports.createMenuItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      isVegetarian,
      image,
      stockQuantity,
      preparationTime,
      isTodaySpecial,
      ingredients,
      allergyInfo,
      dietaryTags
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Food dish name is required.' });
    }

    // STRICT 100% PURE VEG ENFORCEMENT: Reject non-vegetarian dishes
    if (isVegetarian === false || isVegetarian === 'false') {
      return res.status(400).json({
        success: false,
        message: 'STRICT PURE VEG POLICY: Non-vegetarian dishes are strictly prohibited in Smart Campus Canteen.'
      });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a valid number greater than or equal to 0.' });
    }

    const validCategories = [
      'Breakfast', 'Lunch', 'Snacks', 'Beverages',
      'Meals', 'Fast Food', 'Healthy Food', 'Special Items'
    ];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    const parsedStock = stockQuantity !== undefined ? parseInt(stockQuantity, 10) : 50;
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative.' });
    }

    const parsedPrepTime = preparationTime !== undefined ? parseInt(preparationTime, 10) : 10;
    if (isNaN(parsedPrepTime) || parsedPrepTime < 1) {
      return res.status(400).json({ success: false, message: 'Preparation time must be at least 1 minute.' });
    }

    // Ensure real food image photograph is provided
    let finalImage = (image || '').trim();
    if (!finalImage || finalImage.endsWith('.svg')) {
      finalImage = '/images/food/placeholder.jpg';
    }

    if (isSupabaseConfigured()) {
      const newItem = await menuService.createMenuItem({
        name,
        description,
        price: parsedPrice,
        category,
        isVegetarian: true,
        image: finalImage,
        stockQuantity: parsedStock,
        preparationTime: parsedPrepTime,
        isTodaySpecial,
        ingredients,
        allergyInfo,
        dietaryTags
      });

      return res.status(201).json({
        success: true,
        message: `Dish "${newItem.name}" added to menu catalog successfully.`,
        data: newItem
      });
    }

    const newItem = await MenuItem.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: parsedPrice,
      category,
      isVegetarian: true,
      image: finalImage,
      stockQuantity: parsedStock,
      preparationTime: parsedPrepTime,
      isAvailable: true,
      isTodaySpecial: Boolean(isTodaySpecial),
      ingredients: Array.isArray(ingredients) ? ingredients : typeof ingredients === 'string' ? ingredients.split(',').map(s => s.trim()).filter(Boolean) : [],
      allergyInfo: Array.isArray(allergyInfo) ? allergyInfo : typeof allergyInfo === 'string' ? allergyInfo.split(',').map(s => s.trim()).filter(Boolean) : [],
      dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : typeof dietaryTags === 'string' ? dietaryTags.split(',').map(s => s.trim()).filter(Boolean) : []
    });

    res.status(201).json({
      success: true,
      message: `Dish "${newItem.name}" added to menu catalog successfully.`,
      data: newItem
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    if (req.body.isVegetarian === false || req.body.is_vegetarian === false) {
      return res.status(400).json({
        success: false,
        message: 'STRICT PURE VEG POLICY: Non-vegetarian dishes are prohibited.'
      });
    }

    if (isSupabaseConfigured()) {
      const updated = await menuService.updateMenuItem(req.params.id, req.body);
      return res.json({
        success: true,
        message: `Dish "${updated.name}" updated successfully.`,
        data: updated
      });
    }

    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }

    const updates = { ...req.body };
    if (updates.price !== undefined) {
      updates.price = parseFloat(updates.price);
      if (isNaN(updates.price) || updates.price < 0) {
        return res.status(400).json({ success: false, message: 'Price cannot be negative.' });
      }
    }
    if (updates.stockQuantity !== undefined) {
      updates.stockQuantity = parseInt(updates.stockQuantity, 10);
      if (isNaN(updates.stockQuantity) || updates.stockQuantity < 0) {
        return res.status(400).json({ success: false, message: 'Stock cannot be negative.' });
      }
    }

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    res.json({
      success: true,
      message: `Dish "${updated.name}" updated successfully.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleAvailability = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const updated = await menuService.toggleAvailability(req.params.id);
      return res.json({
        success: true,
        message: `"${updated.name}" is now marked as ${updated.isAvailable ? 'AVAILABLE' : 'SOLD OUT'}.`,
        data: updated
      });
    }

    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({
      success: true,
      message: `"${item.name}" is now marked as ${item.isAvailable ? 'AVAILABLE' : 'SOLD OUT'}.`,
      data: item
    });
  } catch (err) {
    next(err);
  }
};
