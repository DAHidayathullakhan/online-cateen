const fs = require('fs');
const path = require('path');

const foodDir = path.join(__dirname, '../public/images/food');
if (!fs.existsSync(foodDir)) {
  fs.mkdirSync(foodDir, { recursive: true });
}

// Helper to create detailed, beautiful, appetising SVG illustrations
function generateDishSVG(dish) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad_${dish.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${dish.bg1}" />
      <stop offset="100%" stop-color="${dish.bg2}" />
    </linearGradient>
    
    <!-- Dish Shadow -->
    <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </radialGradient>

    <!-- Plate Rim Gradient -->
    <linearGradient id="plateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="70%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>

    <!-- Leaf Gradient -->
    <linearGradient id="bananaLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22c55e" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>

    <!-- Golden Fried / Roast Gradient -->
    <linearGradient id="goldenCrust" x1="0%" y1="0%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
  </defs>

  <!-- Ambient Backdrop -->
  <rect width="500" height="320" fill="url(#bgGrad_${dish.id})" />

  <!-- Soft Warm Light Beam -->
  <circle cx="250" cy="90" r="180" fill="#ffffff" opacity="0.08" />

  <!-- Shadow below plate/food -->
  <ellipse cx="250" cy="225" rx="190" ry="45" fill="url(#shadowGrad)" />

  <!-- MAIN PLATE OR SERVING PLATTER -->
  ${dish.platterType === 'leaf' ? `
    <!-- Banana Leaf Plate -->
    <path d="M 50 170 C 90 120, 410 120, 450 170 C 430 230, 70 230, 50 170 Z" fill="url(#bananaLeaf)" />
    <path d="M 55 170 Q 250 168 445 170" stroke="#166534" stroke-width="2" stroke-dasharray="8 6" opacity="0.6" fill="none" />
  ` : dish.platterType === 'thali' ? `
    <!-- Stainless Steel / Silver Thali -->
    <ellipse cx="250" cy="180" rx="180" ry="75" fill="url(#plateGrad)" stroke="#94a3b8" stroke-width="4" />
    <ellipse cx="250" cy="180" rx="160" ry="65" fill="#f8fafc" stroke="#e2e8f0" stroke-width="3" />
  ` : dish.platterType === 'cup' ? `
    <!-- Saucer / Plate for Drink -->
    <ellipse cx="250" cy="225" rx="140" ry="35" fill="url(#plateGrad)" stroke="#cbd5e1" stroke-width="3" />
  ` : `
    <!-- Modern Ceramic Platter -->
    <ellipse cx="250" cy="185" rx="175" ry="70" fill="url(#plateGrad)" stroke="#e2e8f0" stroke-width="2" />
    <ellipse cx="250" cy="185" rx="155" ry="60" fill="#ffffff" />
  `}

  <!-- DEDICATED DISH ARTWORK -->
  ${dish.svgArtwork}

  <!-- VIBRANT HERBS & CONDIMENTS -->
  ${dish.garnishes || ''}

  <!-- FRESH STEAM PARTICLES -->
  ${dish.hasSteam ? `
    <g stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.55">
      <path d="M 210 100 Q 200 75 215 50 Q 225 35 215 20" />
      <path d="M 250 90 Q 265 65 245 40 Q 240 25 250 10" />
      <path d="M 290 105 Q 280 80 295 55 Q 305 40 295 25" />
    </g>
  ` : ''}

  <!-- BOTTOM ACCENT BADGE -->
  <rect x="0" y="270" width="500" height="50" fill="#0f172a" opacity="0.85" />
  <text x="250" y="302" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="17" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">
    ${dish.name}
  </text>
</svg>`;
}

const dishes = [
  // 1. Idli
  {
    id: 'idli',
    file: 'idli.svg',
    name: 'Steamed South Indian Idlis (2 pcs)',
    bg1: '#f8fafc',
    bg2: '#e2e8f0',
    platterType: 'leaf',
    hasSteam: true,
    svgArtwork: `
      <!-- 2 Soft Fluffy Steamed Idlis -->
      <ellipse cx="180" cy="170" rx="60" ry="38" fill="#ffffff" stroke="#f1f5f9" stroke-width="2" />
      <ellipse cx="178" cy="168" rx="55" ry="33" fill="#fefefe" />
      <circle cx="170" cy="165" r="1.5" fill="#e2e8f0" />
      <circle cx="190" cy="172" r="1.5" fill="#e2e8f0" />
      
      <ellipse cx="280" cy="165" rx="60" ry="38" fill="#ffffff" stroke="#f1f5f9" stroke-width="2" />
      <ellipse cx="278" cy="163" rx="55" ry="33" fill="#fefefe" />

      <!-- Sambar Bowl (Red-orange stew with coriander) -->
      <ellipse cx="370" cy="180" rx="35" ry="22" fill="#d97706" stroke="#92400e" stroke-width="2" />
      <ellipse cx="370" cy="178" rx="30" ry="18" fill="#ea580c" />
      <circle cx="365" cy="176" r="4" fill="#15803d" />

      <!-- Chutney Bowl (White coconut chutney) -->
      <ellipse cx="120" cy="180" rx="32" ry="20" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2" />
      <ellipse cx="120" cy="179" rx="28" ry="16" fill="#f8fafc" />
      <circle cx="118" cy="177" r="2" fill="#1e293b" />
      <circle cx="125" cy="181" r="1.5" fill="#166534" />
    `
  },
  // 2. Vada
  {
    id: 'vada',
    file: 'vada.svg',
    name: 'Crispy Medu Vada (2 pcs)',
    bg1: '#fffbeb',
    bg2: '#fde68a',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Vada 1 (Golden-brown ring donut) -->
      <g transform="translate(160, 160)">
        <ellipse cx="0" cy="0" rx="58" ry="42" fill="url(#goldenCrust)" stroke="#78350f" stroke-width="2" />
        <ellipse cx="0" cy="0" rx="20" ry="14" fill="#ffffff" stroke="#78350f" stroke-width="2" />
        <!-- Pepper & curry leaf bits -->
        <circle cx="-25" cy="-10" r="2.5" fill="#1e293b" />
        <circle cx="20" cy="12" r="3" fill="#15803d" />
        <circle cx="30" cy="-8" r="2" fill="#1e293b" />
      </g>
      <!-- Vada 2 (Slightly overlapped) -->
      <g transform="translate(260, 175)">
        <ellipse cx="0" cy="0" rx="60" ry="44" fill="url(#goldenCrust)" stroke="#78350f" stroke-width="2" />
        <ellipse cx="0" cy="0" rx="21" ry="15" fill="#ffffff" stroke="#78350f" stroke-width="2" />
        <circle cx="-15" cy="15" r="2.5" fill="#1e293b" />
        <circle cx="25" cy="-5" r="3" fill="#15803d" />
      </g>
      <!-- Coconut Chutney Cup -->
      <ellipse cx="370" cy="165" rx="32" ry="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
      <circle cx="368" cy="163" r="2" fill="#0f172a" />
      <circle cx="373" cy="166" r="2.5" fill="#16a34a" />
    `
  },
  // 3. Masala Dosa
  {
    id: 'masala-dosa',
    file: 'masala-dosa.svg',
    name: 'Butter Masala Dosa',
    bg1: '#fef3c7',
    bg2: '#fed7aa',
    platterType: 'leaf',
    hasSteam: true,
    svgArtwork: `
      <!-- Crisp Golden Cylindrical Rolled Dosa -->
      <path d="M 80 185 C 100 135, 380 135, 410 185 C 380 205, 100 205, 80 185 Z" fill="url(#goldenCrust)" stroke="#78350f" stroke-width="2" />
      <!-- Dosa Texture Rings -->
      <path d="M 120 180 Q 240 160 370 180" stroke="#78350f" stroke-width="3" opacity="0.4" fill="none" />
      <path d="M 140 187 Q 240 170 350 187" stroke="#78350f" stroke-width="2" opacity="0.3" fill="none" />
      <!-- Melting Butter Pat -->
      <rect x="235" y="150" width="30" height="18" rx="4" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5" />
      <path d="M 230 168 Q 250 174 270 168" stroke="#eab308" stroke-width="4" stroke-linecap="round" fill="none" />

      <!-- Side Sambar & Chutneys -->
      <ellipse cx="110" cy="205" rx="26" ry="16" fill="#ea580c" stroke="#c2410c" stroke-width="2" />
      <ellipse cx="380" cy="205" rx="26" ry="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
    `
  },
  // 4. Plain Dosa
  {
    id: 'plain-dosa',
    file: 'plain-dosa.svg',
    name: 'Crispy Plain Dosa',
    bg1: '#fef9c3',
    bg2: '#fef08a',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Triangular Golden Cone / Folded Dosa -->
      <path d="M 250 110 L 110 210 Q 250 230 390 210 Z" fill="url(#goldenCrust)" stroke="#92400e" stroke-width="2.5" />
      <path d="M 250 110 L 250 220" stroke="#78350f" stroke-width="1.5" opacity="0.5" />
      <path d="M 180 180 Q 250 200 320 180" stroke="#78350f" stroke-width="2" opacity="0.35" fill="none" />
      
      <!-- Chutney Katoris -->
      <ellipse cx="140" cy="140" rx="28" ry="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
      <ellipse cx="360" cy="140" rx="28" ry="18" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
    `
  },
  // 5. Poori
  {
    id: 'poori',
    file: 'poori.svg',
    name: 'Poori Bhaji (3 pcs)',
    bg1: '#ffedd5',
    bg2: '#fed7aa',
    platterType: 'thali',
    hasSteam: true,
    svgArtwork: `
      <!-- 2 Puffed Golden Balloon Pooris -->
      <ellipse cx="190" cy="175" rx="55" ry="42" fill="url(#goldenCrust)" stroke="#78350f" stroke-width="2" />
      <ellipse cx="270" cy="165" rx="55" ry="40" fill="url(#goldenCrust)" stroke="#78350f" stroke-width="2" />
      <!-- Potato Bhaji Bowl -->
      <ellipse cx="355" cy="185" rx="35" ry="22" fill="#ca8a04" stroke="#a16207" stroke-width="2" />
      <circle cx="350" cy="182" r="4" fill="#84cc16" />
      <circle cx="365" cy="186" r="3" fill="#15803d" />
    `
  },
  // 6. Upma
  {
    id: 'upma',
    file: 'upma.svg',
    name: 'Rava Upma & Chutney',
    bg1: '#fef08a',
    bg2: '#fde047',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Domed Upma Mound -->
      <ellipse cx="230" cy="180" rx="75" ry="50" fill="#fef08a" stroke="#ca8a04" stroke-width="2" />
      <ellipse cx="230" cy="160" rx="55" ry="32" fill="#fef9c3" />
      <!-- Cashews, Mustard seeds, Curry leaves -->
      <path d="M 210 155 Q 220 145 228 156" stroke="#b45309" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M 245 160 Q 255 150 263 162" stroke="#b45309" stroke-width="5" stroke-linecap="round" fill="none" />
      <circle cx="205" cy="168" r="2" fill="#0f172a" />
      <circle cx="240" cy="172" r="2" fill="#0f172a" />
      <path d="M 220 162 Q 228 170 232 165" stroke="#16a34a" stroke-width="4" stroke-linecap="round" fill="none" />
      
      <!-- Chutney Katori -->
      <ellipse cx="350" cy="175" rx="35" ry="22" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
      <circle cx="348" cy="173" r="2" fill="#0f172a" />
      <circle cx="353" cy="177" r="2" fill="#15803d" />
    `
  },
  // 7. Rice Bath
  {
    id: 'rice-bath',
    file: 'rice-bath.svg',
    name: 'South Indian Rice Bath',
    bg1: '#fef3c7',
    bg2: '#fde68a',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Aromatic Spiced Rice Bath with Veggies -->
      <ellipse cx="250" cy="180" rx="90" ry="55" fill="#f59e0b" stroke="#b45309" stroke-width="2" />
      <ellipse cx="250" cy="168" rx="75" ry="42" fill="#d97706" />
      <!-- Veggie bits: Peas, carrots, fried onions -->
      <circle cx="215" cy="160" r="4.5" fill="#22c55e" />
      <circle cx="270" cy="155" r="4.5" fill="#22c55e" />
      <circle cx="240" cy="175" r="4" fill="#22c55e" />
      <rect x="230" y="155" width="8" height="6" rx="2" fill="#ef4444" />
      <rect x="280" y="170" width="8" height="6" rx="2" fill="#ef4444" />
      <path d="M 245 160 Q 255 152 265 160" stroke="#78350f" stroke-width="3" stroke-linecap="round" fill="none" />
      <ellipse cx="370" cy="170" rx="32" ry="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
    `
  },
  // 8. Veg Meals
  {
    id: 'veg-meals',
    file: 'veg-meals.svg',
    name: 'South Indian Veg Meals',
    bg1: '#dcfce7',
    bg2: '#bbf7d0',
    platterType: 'thali',
    hasSteam: true,
    svgArtwork: `
      <!-- Grand Thali with Rice Mound and 5 Katori Bowls -->
      <ellipse cx="250" cy="185" rx="55" ry="38" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
      <!-- Sambar, Rasam, Curd, Veg Curry, Palya -->
      <ellipse cx="160" cy="145" rx="24" ry="16" fill="#ea580c" stroke="#94a3b8" stroke-width="2" />
      <ellipse cx="220" cy="130" rx="24" ry="16" fill="#b91c1c" stroke="#94a3b8" stroke-width="2" />
      <ellipse cx="280" cy="130" rx="24" ry="16" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" />
      <ellipse cx="340" cy="145" rx="24" ry="16" fill="#ca8a04" stroke="#94a3b8" stroke-width="2" />
      <!-- Crispy Appalam Papad -->
      <circle cx="340" cy="200" r="28" fill="#fef08a" stroke="#ca8a04" stroke-width="2" opacity="0.9" />
    `
  },
  // 9. Special Meal
  {
    id: 'special-meal',
    file: 'special-meal.svg',
    name: 'Executive Special Meal',
    bg1: '#fef3c7',
    bg2: '#fed7aa',
    platterType: 'thali',
    hasSteam: true,
    svgArtwork: `
      <!-- Royal Thali: Paneer Butter Masala, Dal Makhani, Jeera Rice, 2 Butter Rotis, Gulab Jamun -->
      <ellipse cx="250" cy="190" rx="55" ry="36" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
      <circle cx="245" cy="188" r="2" fill="#78350f" />
      <ellipse cx="150" cy="155" rx="26" ry="18" fill="#ea580c" stroke="#94a3b8" stroke-width="2" />
      <!-- Paneer Cubes -->
      <rect x="142" y="148" width="8" height="8" rx="1.5" fill="#ffffff" />
      <rect x="154" y="152" width="8" height="8" rx="1.5" fill="#ffffff" />
      <ellipse cx="215" cy="135" rx="26" ry="18" fill="#451a03" stroke="#94a3b8" stroke-width="2" />
      <!-- Gulab Jamun Bowl -->
      <ellipse cx="285" cy="135" rx="24" ry="16" fill="#fed7aa" stroke="#94a3b8" stroke-width="2" />
      <circle cx="285" cy="135" r="9" fill="#78350f" />
      <!-- 2 Butter Rotis -->
      <ellipse cx="340" cy="165" rx="35" ry="24" fill="#fde68a" stroke="#b45309" stroke-width="2" />
    `
  },
  // 10. Curd Rice
  {
    id: 'curd-rice',
    file: 'curd-rice.svg',
    name: 'Curd Rice & Pickle',
    bg1: '#f1f5f9',
    bg2: '#e2e8f0',
    platterType: 'ceramic',
    hasSteam: false,
    svgArtwork: `
      <!-- Cool Creamy White Curd Rice with Pomegranate & Mustard Tempering -->
      <ellipse cx="240" cy="180" rx="80" ry="50" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
      <circle cx="210" cy="170" r="3.5" fill="#dc2626" />
      <circle cx="235" cy="160" r="3.5" fill="#dc2626" />
      <circle cx="265" cy="175" r="3.5" fill="#dc2626" />
      <!-- Mustard seeds & Curry leaves -->
      <circle cx="225" cy="180" r="1.5" fill="#0f172a" />
      <circle cx="250" cy="172" r="1.5" fill="#0f172a" />
      <path d="M 238 165 Q 244 172 250 167" stroke="#16a34a" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- Mango Pickle Spoon/Katori -->
      <ellipse cx="360" cy="175" rx="30" ry="20" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
    `
  },
  // 11. Lemon Rice
  {
    id: 'lemon-rice',
    file: 'lemon-rice.svg',
    name: 'Tangy Lemon Rice',
    bg1: '#fef9c3',
    bg2: '#fef08a',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Turmeric Yellow Rice with Roasted Peanuts and Green Chillies -->
      <ellipse cx="250" cy="180" rx="85" ry="52" fill="#facc15" stroke="#ca8a04" stroke-width="2" />
      <!-- Peanuts -->
      <ellipse cx="220" cy="165" rx="8" ry="5" fill="#9a3412" />
      <ellipse cx="265" cy="160" rx="8" ry="5" fill="#9a3412" />
      <ellipse cx="245" cy="185" rx="8" ry="5" fill="#9a3412" />
      <!-- Curry leaves & Chillies -->
      <path d="M 230 175 Q 240 185 250 177" stroke="#15803d" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <circle cx="235" cy="162" r="1.5" fill="#0f172a" />
      <circle cx="275" cy="175" r="1.5" fill="#0f172a" />
    `
  },
  // 12. Chapati
  {
    id: 'chapati',
    file: 'chapati.svg',
    name: 'Whole Wheat Chapati Combo',
    bg1: '#ffedd5',
    bg2: '#fed7aa',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Stack of 3 Soft Whole Wheat Chapatis -->
      <ellipse cx="200" cy="190" rx="65" ry="42" fill="#fed7aa" stroke="#9a3412" stroke-width="2" />
      <ellipse cx="205" cy="178" rx="65" ry="42" fill="#fed7aa" stroke="#9a3412" stroke-width="2" />
      <ellipse cx="210" cy="165" rx="65" ry="42" fill="#fde68a" stroke="#9a3412" stroke-width="2" />
      <!-- Brown Roasting Spots -->
      <circle cx="180" cy="160" r="3" fill="#78350f" opacity="0.6" />
      <circle cx="220" cy="155" r="4" fill="#78350f" opacity="0.6" />
      <circle cx="235" cy="170" r="3.5" fill="#78350f" opacity="0.6" />
      <!-- Mixed Veg Curry Bowl -->
      <ellipse cx="350" cy="170" rx="35" ry="22" fill="#d97706" stroke="#92400e" stroke-width="2" />
      <circle cx="345" cy="168" r="4" fill="#15803d" />
    `
  },
  // 13. Paratha
  {
    id: 'paratha',
    file: 'paratha.svg',
    name: 'Aloo Paratha with Curd',
    bg1: '#fef3c7',
    bg2: '#fde68a',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Golden Layered Stuffed Paratha with Butter -->
      <ellipse cx="210" cy="175" rx="75" ry="50" fill="url(#goldenCrust)" stroke="#78350f" stroke-width="2.5" />
      <!-- Pat of white butter melting -->
      <ellipse cx="210" cy="165" rx="18" ry="10" fill="#ffffff" stroke="#fef08a" stroke-width="2" />
      <path d="M 195 170 Q 210 178 225 170" stroke="#fef08a" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- Fresh Curd Bowl & Pickle -->
      <ellipse cx="355" cy="160" rx="32" ry="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
      <ellipse cx="355" cy="205" rx="20" ry="12" fill="#dc2626" stroke="#991b1b" stroke-width="1.5" />
    `
  },
  // 14. Samosa
  {
    id: 'samosa',
    file: 'samosa.svg',
    name: 'Crispy Veg Samosa (2 pcs)',
    bg1: '#ffedd5',
    bg2: '#fed7aa',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Samosa 1 (Golden-brown Crispy Triangular Pastry) -->
      <path d="M 180 120 L 120 210 L 230 210 Z" fill="url(#goldenCrust)" stroke="#78350f" stroke-width="2.5" />
      <!-- Samosa 2 -->
      <path d="M 270 130 L 210 215 L 320 215 Z" fill="url(#goldenCrust)" stroke="#78350f" stroke-width="2.5" />
      <!-- Green Mint Chutney & Tamarind -->
      <ellipse cx="370" cy="180" rx="26" ry="16" fill="#16a34a" stroke="#15803d" stroke-width="2" />
      <ellipse cx="370" cy="215" rx="22" ry="14" fill="#78350f" stroke="#451a03" stroke-width="2" />
    `
  },
  // 15. Sandwich
  {
    id: 'sandwich',
    file: 'sandwich.svg',
    name: 'Grilled Cheese Veg Sandwich',
    bg1: '#fef3c7',
    bg2: '#fed7aa',
    platterType: 'ceramic',
    hasSteam: false,
    svgArtwork: `
      <!-- Diagonal Toasted Bread with Grill Marks and Veg Layers -->
      <path d="M 140 160 L 260 120 L 240 210 Z" fill="#fde68a" stroke="#b45309" stroke-width="2" />
      <path d="M 150 170 L 270 130 L 250 220 Z" fill="#fed7aa" stroke="#9a3412" stroke-width="2" />
      <!-- Diagonal Grill Char Marks -->
      <line x1="170" y1="140" x2="210" y2="180" stroke="#78350f" stroke-width="3" stroke-linecap="round" />
      <line x1="195" y1="135" x2="235" y2="175" stroke="#78350f" stroke-width="3" stroke-linecap="round" />
      <line x1="220" y1="130" x2="255" y2="165" stroke="#78350f" stroke-width="3" stroke-linecap="round" />
      <!-- Melted cheese & tomato layer -->
      <path d="M 170 185 Q 210 195 240 185" stroke="#ef4444" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M 160 190 Q 210 200 245 190" stroke="#facc15" stroke-width="5" stroke-linecap="round" fill="none" />
    `
  },
  // 16. Maggi
  {
    id: 'maggi',
    file: 'maggi.svg',
    name: 'Hot Masala Maggi',
    bg1: '#fef9c3',
    bg2: '#fef08a',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Steaming Bowl of Wavy Yellow Noodles -->
      <ellipse cx="250" cy="180" rx="80" ry="50" fill="#facc15" stroke="#ca8a04" stroke-width="2" />
      <!-- Wavy noodle strands -->
      <path d="M 190 170 Q 210 155 230 170 T 270 170 T 310 170" stroke="#eab308" stroke-width="4" fill="none" />
      <path d="M 185 180 Q 210 165 235 180 T 285 180 T 315 180" stroke="#ca8a04" stroke-width="3.5" fill="none" />
      <!-- Veggie bits: Peas, carrots -->
      <circle cx="210" cy="165" r="4.5" fill="#22c55e" />
      <circle cx="260" cy="160" r="4.5" fill="#22c55e" />
      <rect x="235" y="172" width="7" height="6" rx="2" fill="#ef4444" />
      <rect x="280" y="168" width="7" height="6" rx="2" fill="#ef4444" />
    `
  },
  // 17. Tea
  {
    id: 'tea',
    file: 'tea.svg',
    name: 'Special Ginger Masala Tea',
    bg1: '#ffedd5',
    bg2: '#fed7aa',
    platterType: 'cup',
    hasSteam: true,
    svgArtwork: `
      <!-- Terracotta / Clay Kulhad Tea Cup with Frothy Chai -->
      <ellipse cx="250" cy="140" rx="45" ry="16" fill="#9a3412" stroke="#7c2d12" stroke-width="2" />
      <path d="M 205 140 L 220 220 Q 250 230 280 220 L 295 140 Z" fill="#c2410c" stroke="#7c2d12" stroke-width="2" />
      <!-- Frothy Chai Surface -->
      <ellipse cx="250" cy="142" rx="40" ry="13" fill="#d97706" />
      <ellipse cx="250" cy="142" rx="35" ry="10" fill="#f59e0b" opacity="0.6" />
    `
  },
  // 18. Coffee
  {
    id: 'coffee',
    file: 'coffee.svg',
    name: 'South Indian Filter Coffee',
    bg1: '#fef3c7',
    bg2: '#fed7aa',
    platterType: 'cup',
    hasSteam: true,
    svgArtwork: `
      <!-- Traditional Brass Dabarah & Tumbler -->
      <ellipse cx="250" cy="205" rx="65" ry="22" fill="#d97706" stroke="#b45309" stroke-width="2.5" />
      <path d="M 215 150 L 225 210 Q 250 215 275 210 L 285 150 Z" fill="#f59e0b" stroke="#b45309" stroke-width="2.5" />
      <!-- Rich frothy coffee top -->
      <ellipse cx="250" cy="150" rx="35" ry="12" fill="#78350f" />
      <ellipse cx="250" cy="150" rx="30" ry="9" fill="#d97706" opacity="0.75" />
      <circle cx="242" cy="149" r="2" fill="#ffffff" opacity="0.6" />
      <circle cx="258" cy="151" r="2.5" fill="#ffffff" opacity="0.6" />
    `
  },
  // 19. Fresh Juice
  {
    id: 'juice',
    file: 'juice.svg',
    name: 'Fresh Chilled Fruit Juice',
    bg1: '#ecfdf5',
    bg2: '#a7f3d0',
    platterType: 'cup',
    hasSteam: false,
    svgArtwork: `
      <!-- Tall Chilled Glass with Citrus Slice and Straw -->
      <path d="M 210 110 L 225 220 Q 250 228 275 220 L 290 110 Z" fill="#34d399" opacity="0.85" stroke="#059669" stroke-width="2" />
      <!-- Liquid top surface -->
      <ellipse cx="250" cy="115" rx="38" ry="12" fill="#10b981" />
      <!-- Lemon wheel garnish on rim -->
      <circle cx="215" cy="110" r="20" fill="#facc15" stroke="#ca8a04" stroke-width="2" />
      <!-- Straw -->
      <line x1="260" y1="80" x2="245" y2="200" stroke="#f43f5e" stroke-width="5" stroke-linecap="round" />
    `
  },
  // 20. Biscuits
  {
    id: 'biscuits',
    file: 'biscuits.svg',
    name: 'Bakery Butter Cookies & Biscuits',
    bg1: '#ffedd5',
    bg2: '#fed7aa',
    platterType: 'ceramic',
    hasSteam: false,
    svgArtwork: `
      <!-- Crisp Golden Baked Butter Biscuits with Choco chips -->
      <g transform="translate(200, 175)">
        <circle cx="0" cy="0" r="42" fill="#fed7aa" stroke="#9a3412" stroke-width="2" />
        <circle cx="-12" cy="-10" r="3.5" fill="#451a03" />
        <circle cx="15" cy="-8" r="4" fill="#451a03" />
        <circle cx="0" cy="14" r="3.5" fill="#451a03" />
      </g>
      <g transform="translate(280, 170)">
        <circle cx="0" cy="0" r="40" fill="#fde68a" stroke="#b45309" stroke-width="2" />
        <circle cx="-10" cy="-12" r="3" fill="#451a03" />
        <circle cx="12" cy="10" r="3.5" fill="#451a03" />
        <circle cx="-5" cy="8" r="3.5" fill="#451a03" />
      </g>
    `
  },
  // 21. Bisibele Bath
  {
    id: 'bisibele-bath',
    file: 'bisibele-bath.svg',
    name: 'Karnataka Bisi Bele Bhath',
    bg1: '#fef3c7',
    bg2: '#fed7aa',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Piping Hot Spicy Lentil Rice with Ghee and Boondi -->
      <ellipse cx="250" cy="180" rx="85" ry="50" fill="#c2410c" stroke="#9a3412" stroke-width="2" />
      <ellipse cx="250" cy="168" rx="72" ry="40" fill="#ea580c" />
      <!-- Golden crispy boondi on top -->
      <circle cx="225" cy="162" r="3.5" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
      <circle cx="240" cy="155" r="4" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
      <circle cx="255" cy="160" r="3.5" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
      <circle cx="270" cy="165" r="4" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
      <circle cx="235" cy="172" r="3" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
      <circle cx="255" cy="175" r="3.5" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
      <!-- Cashew & coriander leaf -->
      <path d="M 235 158 Q 242 150 250 156" stroke="#9a3412" stroke-width="4.5" stroke-linecap="round" fill="none" />
      <circle cx="248" cy="168" r="4" fill="#15803d" />
      <!-- Raitha / Papad side -->
      <ellipse cx="370" cy="175" rx="30" ry="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
    `
  },
  // 22. Sambar Rice
  {
    id: 'sambar-rice',
    file: 'sambar-rice.svg',
    name: 'Authentic Sambar Rice',
    bg1: '#ffedd5',
    bg2: '#fed7aa',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <!-- Comforting Sambar Sadam with Shallots, Drumsticks, and Ghee -->
      <ellipse cx="250" cy="180" rx="85" ry="52" fill="#d97706" stroke="#b45309" stroke-width="2" />
      <ellipse cx="250" cy="170" rx="72" ry="40" fill="#f59e0b" />
      <!-- Shallots (pearl onions) -->
      <ellipse cx="230" cy="165" rx="7" ry="5" fill="#be123c" />
      <ellipse cx="270" cy="160" rx="7" ry="5" fill="#be123c" />
      <!-- Drumstick pieces & Coriander -->
      <rect x="245" y="172" width="16" height="5" rx="2" fill="#15803d" />
      <circle cx="240" cy="160" r="3.5" fill="#16a34a" />
      <!-- Dollop of Pure Ghee -->
      <ellipse cx="250" cy="165" rx="10" ry="6" fill="#fef08a" stroke="#eab308" stroke-width="1.5" />
      <!-- Crispy Potato Chips / Papad -->
      <ellipse cx="365" cy="175" rx="30" ry="18" fill="#fde68a" stroke="#ca8a04" stroke-width="2" />
    `
  },
  // 23. Default Food Fallback
  {
    id: 'default-food',
    file: 'default-food.svg',
    name: 'Smart Campus Canteen Fresh Special',
    bg1: '#eff6ff',
    bg2: '#bfdbfe',
    platterType: 'ceramic',
    hasSteam: true,
    svgArtwork: `
      <ellipse cx="250" cy="180" rx="85" ry="50" fill="#f59e0b" stroke="#d97706" stroke-width="2" />
      <circle cx="230" cy="170" r="8" fill="#15803d" />
      <circle cx="270" cy="170" r="8" fill="#ef4444" />
      <ellipse cx="250" cy="165" rx="40" ry="20" fill="#ffffff" opacity="0.4" />
    `
  }
];

dishes.forEach(dish => {
  const content = generateDishSVG(dish);
  fs.writeFileSync(path.join(foodDir, dish.file), content, 'utf8');
});

console.log(`Successfully generated ${dishes.length} high-fidelity food illustrations in ${foodDir}`);
