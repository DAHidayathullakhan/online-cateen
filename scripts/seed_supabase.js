const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('../backend/config/supabase');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedSupabase = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('[Supabase Seed] Supabase credentials not configured in .env. Skipping Supabase seed.');
    return false;
  }

  console.log('================================================================');
  console.log('SEEDING SUPABASE POSTGRESQL FOR SMART CAMPUS CANTEEN');
  console.log('STRICT 100% PURE VEGETARIAN DISHES & REAL PHOTOGRAPHS');
  console.log('================================================================\n');

  try {
    // 1. Seed Branches
    console.log('1. Checking branches table...');
    const { data: existingBranches, error: branchErr } = await supabase.from('branches').select('id, name, code');
    if (branchErr) {
      console.warn('Branch fetch warning (table may need creation):', branchErr.message);
    }

    let branches = existingBranches || [];
    if (branches.length === 0) {
      console.log('Inserting default campus branches...');
      const { data: insertedBranches, error: insertBranchErr } = await supabase.from('branches').insert([
        { name: 'Main Canteen', code: 'MAIN', location: 'Central Academic Quad' },
        { name: 'Hostel Canteen', code: 'HOSTEL', location: 'Hostel Block A Ground Floor' },
        { name: 'Block B Canteen', code: 'BLOCK_B', location: 'Department Block B' },
        { name: 'Evening Snacks Counter', code: 'SNACKS', location: 'Sports Complex Pavilion' }
      ]).select();

      if (insertBranchErr) {
        console.warn('Failed to insert branches:', insertBranchErr.message);
      } else {
        branches = insertedBranches;
        console.log(`Inserted ${branches.length} branches.`);
      }
    } else {
      console.log(`Found ${branches.length} existing branches.`);
    }

    // 2. Seed Categories
    console.log('\n2. Checking menu_categories table...');
    const categoriesToSeed = [
      { name: 'Breakfast', description: 'Fresh morning items and south Indian tiffins', icon: 'Sunrise', display_order: 1 },
      { name: 'Lunch', description: 'Wholesome pure veg meals, thalis, and rice bowls', icon: 'Utensils', display_order: 2 },
      { name: 'Snacks', description: 'Crispy samosas, puffs, and evening snacks', icon: 'Cookie', display_order: 3 },
      { name: 'Beverages', description: 'Hot filter coffee, chai, and chilled fresh juices', icon: 'Coffee', display_order: 4 },
      { name: 'Meals', description: 'Full south & north Indian vegetarian meals', icon: 'Soup', display_order: 5 },
      { name: 'Fast Food', description: 'Quick vegetarian burgers, pizzas, and rolls', icon: 'Pizza', display_order: 6 },
      { name: 'Healthy Food', description: 'Fresh fruit bowls, sprouts, and salads', icon: 'Salad', display_order: 7 },
      { name: 'Special Items', description: "Today's chef specials and festive treats", icon: 'Sparkles', display_order: 8 }
    ];

    for (const cat of categoriesToSeed) {
      await supabase.from('menu_categories').upsert([cat], { onConflict: 'name' });
    }
    console.log('Menu categories verified.');

    // 3. Seed 100% Pure Vegetarian Food Items with Real Photographs
    console.log('\n3. Checking menu_items table...');
    const { count: itemCount } = await supabase.from('menu_items').select('*', { count: 'exact', head: true });

    if (itemCount === 0 || itemCount === null) {
      console.log('Seeding pure vegetarian menu items with real dish photographs...');
      const pureVegMenu = [
        // BREAKFAST
        {
          name: 'Steamed Idli with Sambar & Chutney',
          description: 'Fluffy steamed rice and lentil cakes served with piping hot vegetable sambar and fresh coconut chutney.',
          price: 35,
          category: 'Breakfast',
          image_url: '/images/food/idli.jpg',
          is_vegetarian: true,
          stock_quantity: 60,
          preparation_time: 5,
          popularity: 92,
          is_today_special: false,
          ingredients: ['Rice', 'Urad Dal', 'Coconut', 'Lentils', 'Drumsticks'],
          allergy_info: [],
          dietary_tags: ['Pure Veg', 'Gluten-Free', 'Vegan']
        },
        {
          name: 'Crispy Medu Vada (2 Pcs)',
          description: 'Golden fried crispy lentil donuts seasoned with black pepper, curry leaves, and green chillies.',
          price: 40,
          category: 'Breakfast',
          image_url: '/images/food/vada.jpg',
          is_vegetarian: true,
          stock_quantity: 50,
          preparation_time: 5,
          popularity: 88,
          is_today_special: false,
          ingredients: ['Urad Dal', 'Black Pepper', 'Curry Leaves', 'Ginger'],
          allergy_info: [],
          dietary_tags: ['Pure Veg', 'Gluten-Free']
        },
        {
          name: 'Classic Masala Dosa',
          description: 'Crispy golden fermented crepe stuffed with spiced potato mash, served with rich sambar and coconut chutney.',
          price: 55,
          category: 'Breakfast',
          image_url: '/images/food/masala-dosa.jpg',
          is_vegetarian: true,
          stock_quantity: 75,
          preparation_time: 8,
          popularity: 98,
          is_today_special: true,
          ingredients: ['Rice Batter', 'Potatoes', 'Onion', 'Mustard Seeds', 'Turmeric'],
          allergy_info: [],
          dietary_tags: ['Pure Veg', 'Signature Dish']
        },
        {
          name: 'Crispy Plain Dosa',
          description: 'Traditional thin, crispy golden crepe roasted with pure desi ghee, served with coconut chutney and sambar.',
          price: 45,
          category: 'Breakfast',
          image_url: '/images/food/plain-dosa.jpg',
          is_vegetarian: true,
          stock_quantity: 60,
          preparation_time: 6,
          popularity: 80,
          is_today_special: false,
          ingredients: ['Rice Flour', 'Urad Dal', 'Desi Ghee'],
          allergy_info: ['Dairy'],
          dietary_tags: ['Pure Veg']
        },
        {
          name: 'Poori Sagu (3 Pcs)',
          description: 'Deep-fried golden puffed wheat breads served with authentic potato sagu and coconut chutney.',
          price: 50,
          category: 'Breakfast',
          image_url: '/images/food/poori.jpg',
          is_vegetarian: true,
          stock_quantity: 45,
          preparation_time: 8,
          popularity: 85,
          is_today_special: false,
          ingredients: ['Whole Wheat Flour', 'Potato', 'Green Peas', 'Spices'],
          allergy_info: ['Gluten'],
          dietary_tags: ['Pure Veg']
        },
        {
          name: 'Rava Upma',
          description: 'Savory semolina porridge tempered with mustard seeds, curry leaves, roasted cashews, and garden vegetables.',
          price: 35,
          category: 'Breakfast',
          image_url: '/images/food/upma.jpg',
          is_vegetarian: true,
          stock_quantity: 40,
          preparation_time: 5,
          popularity: 70,
          is_today_special: false,
          ingredients: ['Semolina', 'Cashews', 'Mustard Seeds', 'Carrot', 'Curry Leaves'],
          allergy_info: ['Gluten', 'Nuts'],
          dietary_tags: ['Pure Veg']
        },

        // LUNCH & MEALS
        {
          name: 'Bisi Bele Bath with Boondi',
          description: 'Traditional Karnataka hot lentil rice cooked with assorted vegetables, tamarind, and aromatic spices.',
          price: 60,
          category: 'Lunch',
          image_url: '/images/food/bisibele-bath.jpg',
          is_vegetarian: true,
          stock_quantity: 50,
          preparation_time: 5,
          popularity: 90,
          is_today_special: false,
          ingredients: ['Rice', 'Toor Dal', 'Carrot', 'Beans', 'Desi Ghee', 'Boondi'],
          allergy_info: ['Dairy'],
          dietary_tags: ['Pure Veg', 'High-Protein']
        },
        {
          name: 'Tangy Lemon Rice',
          description: 'Aromatic basmati rice tempered with lemon juice, mustard seeds, crunchy peanuts, and curry leaves.',
          price: 45,
          category: 'Lunch',
          image_url: '/images/food/lemon-rice.jpg',
          is_vegetarian: true,
          stock_quantity: 45,
          preparation_time: 5,
          popularity: 78,
          is_today_special: false,
          ingredients: ['Rice', 'Lemon Juice', 'Peanuts', 'Green Chillies', 'Curry Leaves'],
          allergy_info: ['Nuts'],
          dietary_tags: ['Pure Veg', 'Gluten-Free']
        },
        {
          name: 'Comforting Curd Rice',
          description: 'Soft-cooked rice mixed with fresh homemade yoghurt, tempered with mustard seeds, ginger, and pomegranate.',
          price: 45,
          category: 'Lunch',
          image_url: '/images/food/curd-rice.jpg',
          is_vegetarian: true,
          stock_quantity: 40,
          preparation_time: 3,
          popularity: 82,
          is_today_special: false,
          ingredients: ['Rice', 'Fresh Yoghurt', 'Mustard Seeds', 'Pomegranate', 'Ginger'],
          allergy_info: ['Dairy'],
          dietary_tags: ['Pure Veg', 'Probiotic']
        },
        {
          name: 'Grand South Indian Veg Meal',
          description: 'Full wholesome thali with steamed rice, sambar, rasam, palya, kootu, curd, papad, pickle, and sweet payasam.',
          price: 90,
          category: 'Meals',
          image_url: '/images/food/veg-meals.jpg',
          is_vegetarian: true,
          stock_quantity: 60,
          preparation_time: 10,
          popularity: 96,
          is_today_special: true,
          ingredients: ['Steamed Rice', 'Sambar', 'Rasam', 'Vegetable Poriyal', 'Curd', 'Papad'],
          allergy_info: ['Dairy'],
          dietary_tags: ['Pure Veg', 'Full Thali']
        },
        {
          name: 'Executive Deluxe Thali',
          description: 'North Indian style feast with 2 butter chapatis, Paneer butter masala, Dal fry, Jeera rice, gulab jamun, and raita.',
          price: 130,
          category: 'Meals',
          image_url: '/images/food/special-meal.jpg',
          is_vegetarian: true,
          stock_quantity: 45,
          preparation_time: 12,
          popularity: 94,
          is_today_special: true,
          ingredients: ['Paneer', 'Wheat Flour', 'Basmati Rice', 'Dal Makhani', 'Gulab Jamun'],
          allergy_info: ['Dairy', 'Gluten'],
          dietary_tags: ['Pure Veg', 'Deluxe Feast']
        },
        {
          name: 'Special Hyderabadi Veg Biryani',
          description: 'Fragrant basmati rice dum cooked with marinated paneer, vegetables, mint, and saffron served with chilled raita.',
          price: 120,
          category: 'Special Items',
          image_url: '/images/food/biryani.jpg',
          is_vegetarian: true,
          stock_quantity: 50,
          preparation_time: 12,
          popularity: 95,
          is_today_special: true,
          ingredients: ['Basmati Rice', 'Paneer', 'Biryani Spices', 'Mint', 'Yoghurt Raita'],
          allergy_info: ['Dairy'],
          dietary_tags: ['Pure Veg', 'Chef Special']
        },

        // SNACKS & FAST FOOD
        {
          name: 'Crispy Punjabi Samosa (2 Pcs)',
          description: 'Flaky pastry pockets filled with spiced potato and green peas stuffing, served with tangy tamarind chutney.',
          price: 30,
          category: 'Snacks',
          image_url: '/images/food/samosa.jpg',
          is_vegetarian: true,
          stock_quantity: 80,
          preparation_time: 3,
          popularity: 93,
          is_today_special: false,
          ingredients: ['Wheat Flour', 'Potatoes', 'Green Peas', 'Garam Masala'],
          allergy_info: ['Gluten'],
          dietary_tags: ['Pure Veg']
        },
        {
          name: 'Fresh Veg Puff',
          description: 'Golden crispy baked puff pastry layered with seasoned mixed vegetable filling.',
          price: 25,
          category: 'Snacks',
          image_url: '/images/food/veg-puff.jpg',
          is_vegetarian: true,
          stock_quantity: 60,
          preparation_time: 2,
          popularity: 84,
          is_today_special: false,
          ingredients: ['Flour', 'Carrots', 'Beans', 'Potatoes', 'Butter'],
          allergy_info: ['Gluten'],
          dietary_tags: ['Pure Veg']
        },
        {
          name: 'Grilled Paneer Tikka Sandwich',
          description: 'Toasted brown bread layered with marinated paneer tikka, mint mayonnaise, tomatoes, and melting cheese.',
          price: 75,
          category: 'Fast Food',
          image_url: '/images/food/paneer-sandwich.jpg',
          is_vegetarian: true,
          stock_quantity: 40,
          preparation_time: 10,
          popularity: 89,
          is_today_special: false,
          ingredients: ['Brown Bread', 'Paneer', 'Cheese', 'Capsicum', 'Mint Chutney'],
          allergy_info: ['Dairy', 'Gluten'],
          dietary_tags: ['Pure Veg']
        },
        {
          name: 'Crispy Veg Burger',
          description: 'Crisp golden vegetable patty loaded with lettuce, tomato, sliced cucumbers, and house herb dressing in a sesame bun.',
          price: 70,
          category: 'Fast Food',
          image_url: '/images/food/veg-burger.jpg',
          is_vegetarian: true,
          stock_quantity: 45,
          preparation_time: 8,
          popularity: 87,
          is_today_special: false,
          ingredients: ['Burger Bun', 'Potato Patty', 'Lettuce', 'Tomato', 'Veg Mayo'],
          allergy_info: ['Gluten'],
          dietary_tags: ['Pure Veg']
        },
        {
          name: 'Paneer Tikka Roll',
          description: 'Char-grilled cottage cheese cubes wrapped in a soft paratha with mint chutney and onions.',
          price: 90,
          category: 'Special Items',
          image_url: '/images/food/paneer-roll.jpg',
          is_vegetarian: true,
          stock_quantity: 40,
          preparation_time: 10,
          popularity: 91,
          is_today_special: true,
          ingredients: ['Paneer', 'Paratha', 'Mint Chutney', 'Onion'],
          allergy_info: ['Dairy', 'Gluten'],
          dietary_tags: ['Pure Veg']
        },

        // BEVERAGES
        {
          name: 'South Indian Filter Coffee',
          description: 'Freshly brewed aromatic chicory coffee blended with frothy boiled milk, served in traditional brass dabarah.',
          price: 20,
          category: 'Beverages',
          image_url: '/images/food/coffee.jpg',
          is_vegetarian: true,
          stock_quantity: 120,
          preparation_time: 3,
          popularity: 97,
          is_today_special: false,
          ingredients: ['Roasted Coffee Beans', 'Boiled Milk', 'Sugar'],
          allergy_info: ['Dairy'],
          dietary_tags: ['Pure Veg', 'Fresh Brewed']
        },
        {
          name: 'Masala Chai',
          description: 'Rich milk tea simmered with fresh ginger, cardamom, cinnamon, and whole cloves.',
          price: 15,
          category: 'Beverages',
          image_url: '/images/food/tea.jpg',
          is_vegetarian: true,
          stock_quantity: 150,
          preparation_time: 3,
          popularity: 95,
          is_today_special: false,
          ingredients: ['Assam Black Tea', 'Milk', 'Ginger', 'Cardamom'],
          allergy_info: ['Dairy'],
          dietary_tags: ['Pure Veg']
        },
        {
          name: 'Fresh Orange Juice',
          description: 'Pure cold-pressed sweet orange juice without added preservatives or artificial colors.',
          price: 50,
          category: 'Beverages',
          image_url: '/images/food/orange-juice.jpg',
          is_vegetarian: true,
          stock_quantity: 40,
          preparation_time: 4,
          popularity: 83,
          is_today_special: false,
          ingredients: ['Fresh Oranges', 'Rock Salt', 'Mint'],
          allergy_info: [],
          dietary_tags: ['Pure Veg', 'Vegan', 'Cold-Pressed']
        },
        {
          name: 'Fresh Lime Soda (Sweet & Salt)',
          description: 'Refreshing thirst quencher made with freshly squeezed lemon, mint sprigs, and chilled sparkling soda.',
          price: 35,
          category: 'Beverages',
          image_url: '/images/food/lime-juice.jpg',
          is_vegetarian: true,
          stock_quantity: 60,
          preparation_time: 3,
          popularity: 81,
          is_today_special: false,
          ingredients: ['Fresh Lemon', 'Soda', 'Mint', 'Black Salt'],
          allergy_info: [],
          dietary_tags: ['Pure Veg', 'Vegan']
        },

        // HEALTHY FOOD
        {
          name: 'Fresh Seasonal Fruit Bowl',
          description: 'Assorted fresh bowl of apple, banana, pomegranate, papaya, and watermelon.',
          price: 60,
          category: 'Healthy Food',
          image_url: '/images/food/fruit-bowl.jpg',
          is_vegetarian: true,
          stock_quantity: 30,
          preparation_time: 5,
          popularity: 76,
          is_today_special: false,
          ingredients: ['Apple', 'Banana', 'Pomegranate', 'Papaya'],
          allergy_info: [],
          dietary_tags: ['Pure Veg', 'Vegan', 'Gluten-Free']
        },
        {
          name: 'Protein Sprouts Salad',
          description: 'Sprouted mung beans and chana salad tossed with onion, tomato, lemon, and chaat masala.',
          price: 50,
          category: 'Healthy Food',
          image_url: '/images/food/sprouts-salad.jpg',
          is_vegetarian: true,
          stock_quantity: 35,
          preparation_time: 5,
          popularity: 79,
          is_today_special: false,
          ingredients: ['Sprouted Mung', 'Chana', 'Lemon', 'Cucumber'],
          allergy_info: [],
          dietary_tags: ['Pure Veg', 'High-Protein']
        }
      ];

      const { data: insertedFood, error: foodErr } = await supabase.from('menu_items').insert(pureVegMenu).select();
      if (foodErr) {
        console.warn('Food items insert notice:', foodErr.message);
      } else {
        console.log(`Inserted ${insertedFood.length} 100% pure vegetarian menu dishes.`);
      }
    } else {
      console.log(`Found ${itemCount} existing menu items in Supabase.`);
    }

    // 4. Seed Demo Profiles
    console.log('\n4. Checking profiles table...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const defaultUsers = [
      { name: 'Admin User', email: 'admin@canteen.edu', role: 'ADMIN', phone: '9876543210' },
      { name: 'Kitchen Chef Ramu', email: 'kitchen@canteen.edu', role: 'KITCHEN_STAFF', phone: '9876543211' },
      { name: 'Operator Priya', email: 'operator@canteen.edu', role: 'CANTEEN_OPERATOR', phone: '9876543212' },
      { name: 'Rider Suresh', email: 'delivery@canteen.edu', role: 'DELIVERY_STAFF', phone: '9876543213' },
      { name: 'Manager Rajesh', email: 'manager@canteen.edu', role: 'BRANCH_MANAGER', phone: '9876543214' },
      { name: 'Rahul Sharma (Student)', email: 'student@canteen.edu', role: 'STUDENT', student_id: 'STU-2026-001', phone: '9876543215' },
      { name: 'Ananya Roy (Master Student)', email: 'mstudent@canteen.edu', role: 'MASTER_STUDENT', student_id: 'MST-2026-002', phone: '9876543216' }
    ];

    for (const u of defaultUsers) {
      const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', u.email).limit(1);
      if (!existingUser || existingUser.length === 0) {
        await supabase.from('profiles').insert([{
          ...u,
          password_hash: passwordHash,
          degree_level: u.role === 'MASTER_STUDENT' ? "Master's" : 'Degree',
          program_type: u.role === 'MASTER_STUDENT' ? 'MCA' : 'BCA',
          course: u.role === 'MASTER_STUDENT' ? 'MCA' : 'BCA',
          department: 'Computer Applications'
        }]);
      }
    }
    console.log('Demo user accounts verified in Supabase profiles.');

    console.log('\n================================================================');
    console.log('SUPABASE POSTGRESQL SEED FINISHED SUCCESSFULLY');
    console.log('================================================================');
    return true;
  } catch (err) {
    console.error('[Supabase Seed Error]:', err.message);
    return false;
  }
};

if (require.main === module) {
  seedSupabase()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = seedSupabase;
