const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayOrder: { type: Number, default: 0 }
});

module.exports = mongoose.model('MenuCategory', menuCategorySchema);
