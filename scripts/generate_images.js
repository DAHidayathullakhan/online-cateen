const fs = require('fs');
const path = require('path');

const foodDir = path.join(__dirname, '../public/images/food');
if (!fs.existsSync(foodDir)) {
  fs.mkdirSync(foodDir, { recursive: true });
}

const foodItems = [
  { file: 'idli.svg', title: 'Soft Steamed Idli', bg: '#fef08a', icon: '🍘', color: '#854d0e' },
  { file: 'vada.svg', title: 'Crispy Medu Vada', bg: '#fef3c7', icon: '🍩', color: '#b45309' },
  { file: 'masala-dosa.svg', title: 'Butter Masala Dosa', bg: '#fde68a', icon: '🌯', color: '#92400e' },
  { file: 'plain-dosa.svg', title: 'Crispy Plain Dosa', bg: '#fef08a', icon: '🥐', color: '#a16207' },
  { file: 'poori.svg', title: 'Poori Bhaji', bg: '#fed7aa', icon: '🥙', color: '#c2410c' },
  { file: 'upma.svg', title: 'Rava Upma', bg: '#fef08a', icon: '🥣', color: '#854d0e' },
  { file: 'rice-bath.svg', title: 'South Indian Rice Bath', bg: '#fef08a', icon: '🍛', color: '#854d0e' },
  { file: 'veg-meals.svg', title: 'South Indian Veg Meals', bg: '#dcfce7', icon: '🍱', color: '#15803d' },
  { file: 'special-meal.svg', title: 'Executive Special Meal', bg: '#dcfce7', icon: '🍛', color: '#166534' },
  { file: 'special-meals.svg', title: 'Executive Special Thali', bg: '#dcfce7', icon: '🍛', color: '#166534' },
  { file: 'rice.svg', title: 'Steamed Basmati Rice', bg: '#f1f5f9', icon: '🍚', color: '#334155' },
  { file: 'curd-rice.svg', title: 'Curd Rice & Pickle', bg: '#e2e8f0', icon: '🥣', color: '#475569' },
  { file: 'lemon-rice.svg', title: 'Tangy Lemon Rice', bg: '#fef08a', icon: '🍚', color: '#854d0e' },
  { file: 'tomato-rice.svg', title: 'Spiced Tomato Rice', bg: '#fee2e2', icon: '🍛', color: '#991b1b' },
  { file: 'chapati.svg', title: 'Whole Wheat Chapati Combo', bg: '#fed7aa', icon: '🫓', color: '#9a3412' },
  { file: 'paratha.svg', title: 'Aloo Paratha with Curd', bg: '#fef08a', icon: '🫓', color: '#854d0e' },
  { file: 'biryani.svg', title: 'Special Hyderabadi Veg Biryani', bg: '#fef3c7', icon: '🍲', color: '#b45309' },
  { file: 'samosa.svg', title: 'Crispy Veg Samosa', bg: '#fed7aa', icon: '📐', color: '#c2410c' },
  { file: 'sandwich.svg', title: 'Grilled Cheese Veg Sandwich', bg: '#fde68a', icon: '🥪', color: '#92400e' },
  { file: 'maggi.svg', title: 'Hot Masala Maggi', bg: '#fef08a', icon: '🍜', color: '#a16207' },
  { file: 'veg-puff.svg', title: 'Flaky Veg Puff', bg: '#fed7aa', icon: '🥐', color: '#9a3412' },
  { file: 'french-fries.svg', title: 'Crispy French Fries', bg: '#fef08a', icon: '🍟', color: '#854d0e' },
  { file: 'biscuits.svg', title: 'Cream Biscuits Packet', bg: '#fed7aa', icon: '🍪', color: '#c2410c' },
  { file: 'paneer-roll.svg', title: 'Paneer Tikka Roll', bg: '#fde68a', icon: '🌯', color: '#92400e' },
  { file: 'paneer-sandwich.svg', title: 'Paneer Club Sandwich', bg: '#fef3c7', icon: '🥪', color: '#b45309' },
  { file: 'tea.svg', title: 'Hot Masala Chai Tea', bg: '#ffedd5', icon: '☕', color: '#9a3412' },
  { file: 'coffee.svg', title: 'South Indian Filter Coffee', bg: '#fed7aa', icon: '☕', color: '#7c2d12' },
  { file: 'juice.svg', title: 'Fresh Lime Juice', bg: '#ecfdf5', icon: '🍹', color: '#047857' },
  { file: 'lime-juice.svg', title: 'Fresh Lime Juice', bg: '#ecfdf5', icon: '🍹', color: '#047857' },
  { file: 'orange-juice.svg', title: 'Fresh Orange Juice', bg: '#ffedd5', icon: '🍊', color: '#c2410c' },
  { file: 'milkshake.svg', title: 'Rich Chocolate Milkshake', bg: '#f3e8ff', icon: '🥤', color: '#6b21a8' },
  { file: 'water.svg', title: 'Mineral Water Bottle', bg: '#e0f2fe', icon: '💧', color: '#0369a1' },
  { file: 'veg-burger.svg', title: 'Crispy Veg Burger', bg: '#ffedd5', icon: '🍔', color: '#9a3412' },
  { file: 'pizza.svg', title: 'Cheese Corn Pizza', bg: '#fee2e2', icon: '🍕', color: '#991b1b' },
  { file: 'noodles.svg', title: 'Veg Hakka Noodles', bg: '#fef08a', icon: '🍜', color: '#854d0e' },
  { file: 'fruit-bowl.svg', title: 'Fresh Seasonal Fruit Bowl', bg: '#fce7f3', icon: '🥗', color: '#be185d' },
  { file: 'sprouts-salad.svg', title: 'Protein Sprouts Salad', bg: '#dcfce7', icon: '🥗', color: '#15803d' },
  { file: 'vegetable-salad.svg', title: 'Garden Vegetable Salad', bg: '#dcfce7', icon: '🥗', color: '#166534' },
  { file: 'default-food.svg', title: 'Smart Campus Canteen Delicacy', bg: '#eff6ff', icon: '🍽️', color: '#1e40af' }
];

foodItems.forEach(item => {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%">
  <rect width="400" height="250" fill="${item.bg}" rx="12" />
  <circle cx="200" cy="115" r="70" fill="#ffffff" opacity="0.9" />
  <text x="200" y="135" font-size="64" text-anchor="middle" dominant-baseline="central">${item.icon}</text>
  <rect x="20" y="190" width="360" height="42" fill="#ffffff" rx="8" opacity="0.95" />
  <text x="200" y="216" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="16" font-weight="800" fill="${item.color}" text-anchor="middle">${item.title}</text>
</svg>`;

  fs.writeFileSync(path.join(foodDir, item.file), svgContent, 'utf8');
});

console.log(`Generated ${foodItems.length} SVG food image assets in public/images/food/`);
