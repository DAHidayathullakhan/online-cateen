const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });



const User = require('../backend/models/User');
const StudentProfile = require('../backend/models/StudentProfile');
const { ProgramType, Course, Department, AcademicYear, Semester, Section } = require('../backend/models/Academic');
const Branch = require('../backend/models/Branch');
const MenuCategory = require('../backend/models/MenuCategory');
const MenuItem = require('../backend/models/MenuItem');
const connectDB = require('../backend/config/db');

const seedData = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB for seed...');
      await connectDB();
    } else {
      console.log('Using active MongoDB connection for seed...');
    }

    console.log('Clearing old database collections...');
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await ProgramType.deleteMany({});
    await Course.deleteMany({});
    await Department.deleteMany({});
    await AcademicYear.deleteMany({});
    await Semester.deleteMany({});
    await Section.deleteMany({});
    await Branch.deleteMany({});
    await MenuCategory.deleteMany({});
    await MenuItem.deleteMany({});

    await ProgramType.insertMany([
      { name: 'Degree', code: 'DEG' },
      { name: "Master's", code: 'MST' }
    ]);

    await Course.insertMany([
      { name: 'BCA', code: 'BCA', degreeLevel: 'Degree', description: 'Bachelor of Computer Applications' },
      { name: 'BBA', code: 'BBA', degreeLevel: 'Degree', description: 'Bachelor of Business Administration' },
      { name: 'BCom', code: 'BCOM', degreeLevel: 'Degree', description: 'Bachelor of Commerce' },
      { name: 'BA', code: 'BA', degreeLevel: 'Degree', description: 'Bachelor of Arts' },
      { name: 'BSc', code: 'BSC', degreeLevel: 'Degree', description: 'Bachelor of Science' },
      { name: 'BE/BTech', code: 'BTECH', degreeLevel: 'Degree', description: 'Bachelor of Technology' },
      { name: 'MCA', code: 'MCA', degreeLevel: "Master's", description: 'Master of Computer Applications' },
      { name: 'MBA', code: 'MBA', degreeLevel: "Master's", description: 'Master of Business Administration' },
      { name: 'MSc', code: 'MSC', degreeLevel: "Master's", description: 'Master of Science' },
      { name: 'MCom', code: 'MCOM', degreeLevel: "Master's", description: 'Master of Commerce' },
      { name: 'MA', code: 'MA', degreeLevel: "Master's", description: 'Master of Arts' }
    ]);

    await Department.insertMany([
      { name: 'Computer Applications', code: 'CS', courses: ['BCA', 'MCA'] },
      { name: 'Business Administration', code: 'MGMT', courses: ['BBA', 'MBA'] },
      { name: 'Commerce & Finance', code: 'COMM', courses: ['BCom', 'MCom'] },
      { name: 'Science & Tech', code: 'SCI', courses: ['BSc', 'MSc'] }
    ]);

    await AcademicYear.insertMany([
      { name: '1st Year', code: 'Y1' },
      { name: '2nd Year', code: 'Y2' },
      { name: '3rd Year', code: 'Y3' },
      { name: '4th Year', code: 'Y4' }
    ]);

    await Semester.insertMany([
      { name: '1st Semester', code: 'S1' },
      { name: '2nd Semester', code: 'S2' },
      { name: '3rd Semester', code: 'S3' },
      { name: '4th Semester', code: 'S4' },
      { name: '5th Semester', code: 'S5' },
      { name: '6th Semester', code: 'S6' }
    ]);

    await Section.insertMany([
      { name: 'Section A', code: 'SEC_A' },
      { name: 'Section B', code: 'SEC_B' }
    ]);

    const branches = await Branch.insertMany([
      { name: 'Main Canteen', code: 'MAIN', location: 'Central Academic Quad' },
      { name: 'Hostel Canteen', code: 'HOSTEL', location: 'Hostel Block A Ground Floor' },
      { name: 'Block B Canteen', code: 'BLOCK_B', location: 'Department Block B' },
      { name: 'Evening Snacks Counter', code: 'SNACKS', location: 'Sports Complex Pavilion' }
    ]);

    const allBranchIds = branches.map(b => b._id);
    const mainBranch = branches[0];
    const hostelBranch = branches[1];

    const categoryNames = ['Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Meals', 'Fast Food', 'Healthy Food', 'Special Items'];
    for (let i = 0; i < categoryNames.length; i++) {
      await MenuCategory.create({ name: categoryNames[i], displayOrder: i + 1 });
    }

    const itemsToSeed = [
      // BREAKFAST
      {
        name: 'Soft Steamed Idli (2 pcs)',
        description: 'Traditional steamed rice and lentil cakes served with coconut chutney and hot sambar.',
        price: 30,
        category: 'Breakfast',
        isVegetarian: true,
        image: '/images/food/idli.jpg',
        stockQuantity: 80,
        preparationTime: 10,
        popularity: 50,
        isTodaySpecial: false,
        ingredients: ['Rice', 'Urad Dal', 'Coconut', 'Spices'],
        allergyInfo: [],
        dietaryTags: ['Vegetarian', 'Gluten-Free'],
        branches: allBranchIds
      },
      {
        name: 'Crispy Medu Vada (2 pcs)',
        description: 'Golden crispy lentil donuts seasoned with black pepper, curry leaves, and ginger.',
        price: 35,
        category: 'Breakfast',
        isVegetarian: true,
        image: '/images/food/vada.jpg',
        stockQuantity: 60,
        preparationTime: 10,
        popularity: 42,
        isTodaySpecial: false,
        ingredients: ['Urad Dal', 'Black Pepper', 'Curry Leaves', 'Oil'],
        allergyInfo: [],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Butter Masala Dosa',
        description: 'Crispy golden rice crepe filled with spiced potato masala and topped with fresh butter.',
        price: 60,
        category: 'Breakfast',
        isVegetarian: true,
        image: '/images/food/masala-dosa.jpg',
        stockQuantity: 50,
        preparationTime: 12,
        popularity: 75,
        isTodaySpecial: true,
        ingredients: ['Rice Batter', 'Potato', 'Butter', 'Onion', 'Spices'],
        allergyInfo: ['Dairy'],
        dietaryTags: ['Vegetarian'],
        branches: [mainBranch._id, hostelBranch._id]
      },
      {
        name: 'Crispy Plain Dosa',
        description: 'Thin crispy crepe served with 3 varieties of chutneys and aromatic sambar.',
        price: 45,
        category: 'Breakfast',
        isVegetarian: true,
        image: '/images/food/plain-dosa.jpg',
        stockQuantity: 50,
        preparationTime: 8,
        popularity: 35,
        ingredients: ['Rice Batter', 'Oil', 'Coconut'],
        allergyInfo: [],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Poori Bhaji (3 pcs)',
        description: 'Deep-fried fluffy whole wheat pooris served with mild potato masala curry.',
        price: 50,
        category: 'Breakfast',
        isVegetarian: true,
        image: '/images/food/poori.jpg',
        stockQuantity: 45,
        preparationTime: 10,
        popularity: 40,
        ingredients: ['Wheat Flour', 'Potato', 'Spices'],
        allergyInfo: ['Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: [mainBranch._id, hostelBranch._id]
      },
      {
        name: 'Rava Upma & Chutney',
        description: 'Roasted semolina cooked with mustard seeds, green chillies, cashews, and veggies.',
        price: 35,
        category: 'Breakfast',
        isVegetarian: true,
        image: '/images/food/upma.jpg',
        stockQuantity: 40,
        preparationTime: 5,
        popularity: 20,
        ingredients: ['Semolina', 'Mustard', 'Veggies', 'Cashew'],
        allergyInfo: ['Gluten', 'Nuts'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },

      // LUNCH & MEALS
      {
        name: 'South Indian Rice Bath',
        description: 'Aromatic rice cooked with seasonal vegetables, coconut, and freshly ground spices.',
        price: 55,
        category: 'Lunch',
        isVegetarian: true,
        image: '/images/food/rice-bath.jpg',
        stockQuantity: 50,
        preparationTime: 10,
        popularity: 60,
        ingredients: ['Rice', 'Mixed Veggies', 'Spices'],
        allergyInfo: [],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'South Indian Veg Meals',
        description: 'Complete thali with steamed rice, sambar, rasam, curd, papad, pickle & 2 vegetable curries.',
        price: 90,
        category: 'Meals',
        isVegetarian: true,
        image: '/images/food/veg-meals.jpg',
        stockQuantity: 100,
        preparationTime: 12,
        popularity: 90,
        isTodaySpecial: true,
        ingredients: ['Rice', 'Lentils', 'Seasonal Vegetables', 'Curd', 'Papad'],
        allergyInfo: ['Dairy'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Executive Special Meal',
        description: 'Premium thali with Paneer Butter Masala, Dal Makhani, Jeera Rice, 2 Butter Roti, Gulab Jamun & Salad.',
        price: 130,
        category: 'Meals',
        isVegetarian: true,
        image: '/images/food/special-meal.jpg',
        stockQuantity: 50,
        preparationTime: 15,
        popularity: 85,
        isTodaySpecial: true,
        ingredients: ['Paneer', 'Butter', 'Basmati Rice', 'Roti', 'Sweets'],
        allergyInfo: ['Dairy', 'Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: [mainBranch._id, hostelBranch._id]
      },
      {
        name: 'Curd Rice & Pickle',
        description: 'Refreshing curd rice tempered with mustard seeds, curry leaves, and green chillies.',
        price: 50,
        category: 'Lunch',
        isVegetarian: true,
        image: '/images/food/curd-rice.jpg',
        stockQuantity: 60,
        preparationTime: 5,
        popularity: 65,
        ingredients: ['Rice', 'Fresh Curd', 'Mustard', 'Curry Leaves'],
        allergyInfo: ['Dairy'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Tangy Lemon Rice',
        description: 'Fragrant rice seasoned with fresh lemon juice, turmeric, roasted peanuts, and curry leaves.',
        price: 45,
        category: 'Lunch',
        isVegetarian: true,
        image: '/images/food/lemon-rice.jpg',
        stockQuantity: 50,
        preparationTime: 5,
        popularity: 45,
        ingredients: ['Rice', 'Lemon', 'Peanuts', 'Turmeric'],
        allergyInfo: ['Peanuts'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Karnataka Bisi Bele Bhath',
        description: 'Traditional Karnataka spicy lentil rice cooked with vegetables, tamarind, pure ghee, and topped with golden boondi.',
        price: 65,
        category: 'Lunch',
        isVegetarian: true,
        image: '/images/food/bisibele-bath.jpg',
        stockQuantity: 55,
        preparationTime: 8,
        popularity: 75,
        isTodaySpecial: true,
        ingredients: ['Rice', 'Toor Dal', 'Mixed Veggies', 'Ghee', 'Boondi'],
        allergyInfo: ['Dairy'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Authentic Sambar Rice',
        description: 'Comforting South Indian sambar rice simmered with shallots, drumsticks, tomatoes, and pure cow ghee.',
        price: 55,
        category: 'Lunch',
        isVegetarian: true,
        image: '/images/food/sambar-rice.jpg',
        stockQuantity: 50,
        preparationTime: 6,
        popularity: 70,
        isTodaySpecial: false,
        ingredients: ['Rice', 'Toor Dal', 'Shallots', 'Drumstick', 'Ghee'],
        allergyInfo: ['Dairy'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Whole Wheat Chapati Combo (3 pcs)',
        description: '3 soft whole wheat chapatis served with mixed veg curry.',
        price: 40,
        category: 'Lunch',
        isVegetarian: true,
        image: '/images/food/chapati.jpg',
        stockQuantity: 50,
        preparationTime: 10,
        popularity: 40,
        ingredients: ['Wheat Flour', 'Mixed Veg Curry'],
        allergyInfo: ['Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Aloo Paratha with Curd',
        description: 'North Indian flatbread stuffed with spiced mashed potatoes, served with fresh curd and pickle.',
        price: 50,
        category: 'Lunch',
        isVegetarian: true,
        image: '/images/food/paratha.jpg',
        stockQuantity: 40,
        preparationTime: 12,
        popularity: 60,
        isTodaySpecial: true,
        ingredients: ['Wheat Flour', 'Potato', 'Butter', 'Curd'],
        allergyInfo: ['Gluten', 'Dairy'],
        dietaryTags: ['Vegetarian'],
        branches: [mainBranch._id, hostelBranch._id]
      },

      // SNACKS
      {
        name: 'Crispy Veg Samosa (2 pcs)',
        description: 'Golden deep-fried pastries stuffed with spiced potatoes, green peas, and herbs.',
        price: 30,
        category: 'Snacks',
        isVegetarian: true,
        image: '/images/food/samosa.jpg',
        stockQuantity: 120,
        preparationTime: 5,
        popularity: 95,
        ingredients: ['Flour', 'Potato', 'Peas', 'Spices'],
        allergyInfo: ['Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Grilled Cheese Veg Sandwich',
        description: 'Toasted white bread filled with fresh cucumber, tomato, cheese, and green mint chutney.',
        price: 60,
        category: 'Snacks',
        isVegetarian: true,
        image: '/images/food/sandwich.jpg',
        stockQuantity: 50,
        preparationTime: 8,
        popularity: 70,
        ingredients: ['Bread', 'Process Cheese', 'Tomato', 'Cucumber'],
        allergyInfo: ['Dairy', 'Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Hot Masala Maggi Noodles',
        description: 'Classic campus favorite instant noodles cooked with butter, spices, and diced vegetables.',
        price: 40,
        category: 'Snacks',
        isVegetarian: true,
        image: '/images/food/maggi.jpg',
        stockQuantity: 80,
        preparationTime: 7,
        popularity: 90,
        ingredients: ['Maggi Noodles', 'Butter', 'Veggies', 'Maggi Masala'],
        allergyInfo: ['Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Cream Biscuits Packet',
        description: 'Pack of chocolate cream biscuits for quick snack cravings.',
        price: 20,
        category: 'Snacks',
        isVegetarian: true,
        image: '/images/food/biscuits.jpg',
        stockQuantity: 100,
        preparationTime: 1,
        popularity: 25,
        ingredients: ['Biscuits', 'Cocoa Cream'],
        allergyInfo: ['Gluten', 'Dairy'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },

      // BEVERAGES
      {
        name: 'Hot Masala Chai Tea',
        description: 'Freshly brewed milk tea infused with cardamom, ginger, and aromatic spices.',
        price: 15,
        category: 'Beverages',
        isVegetarian: true,
        image: '/images/food/tea.jpg',
        stockQuantity: 150,
        preparationTime: 4,
        popularity: 98,
        ingredients: ['Tea Leaves', 'Milk', 'Ginger', 'Cardamom', 'Sugar'],
        allergyInfo: ['Dairy'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'South Indian Filter Coffee',
        description: 'Strong piping hot South Indian filter coffee made with fresh cow milk.',
        price: 20,
        category: 'Beverages',
        isVegetarian: true,
        image: '/images/food/coffee.jpg',
        stockQuantity: 120,
        preparationTime: 4,
        popularity: 85,
        ingredients: ['Coffee Decoction', 'Milk', 'Sugar'],
        allergyInfo: ['Dairy'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Fresh Lime Juice',
        description: 'Refreshing sweet and salty fresh lemon juice with chilled sparkling soda.',
        price: 30,
        category: 'Beverages',
        isVegetarian: true,
        image: '/images/food/juice.jpg',
        stockQuantity: 80,
        preparationTime: 5,
        popularity: 60,
        ingredients: ['Lemon Juice', 'Soda', 'Mint', 'Sugar'],
        allergyInfo: [],
        dietaryTags: ['Vegetarian', 'Vegan'],
        branches: allBranchIds
      },

      // FAST FOOD
      {
        name: 'Crispy Veg Burger',
        description: 'Golden veggie patty inside a toasted sesame bun with lettuce, tomato, and mayo.',
        price: 80,
        category: 'Fast Food',
        isVegetarian: true,
        image: '/images/food/veg-burger.jpg',
        stockQuantity: 45,
        preparationTime: 12,
        popularity: 80,
        ingredients: ['Bun', 'Veg Patty', 'Mayo', 'Lettuce'],
        allergyInfo: ['Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },
      {
        name: 'Cheese Corn Pizza (8 inch)',
        description: 'Personal size thin-crust pizza loaded with mozzarella cheese and sweet corn.',
        price: 120,
        category: 'Fast Food',
        isVegetarian: true,
        image: '/images/food/pizza.jpg',
        stockQuantity: 30,
        preparationTime: 15,
        popularity: 85,
        isTodaySpecial: true,
        ingredients: ['Pizza Base', 'Mozzarella', 'Sweet Corn', 'Oregano'],
        allergyInfo: ['Dairy', 'Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: [mainBranch._id, hostelBranch._id]
      },
      {
        name: 'Veg Hakka Noodles',
        description: 'Wok-tossed noodles with shredded cabbage, capsicum, carrots, and soy sauce.',
        price: 70,
        category: 'Fast Food',
        isVegetarian: true,
        image: '/images/food/noodles.jpg',
        stockQuantity: 40,
        preparationTime: 12,
        popularity: 70,
        ingredients: ['Noodles', 'Soy Sauce', 'Cabbage', 'Capsicum'],
        allergyInfo: ['Gluten', 'Soy'],
        dietaryTags: ['Vegetarian'],
        branches: allBranchIds
      },

      // HEALTHY FOOD
      {
        name: 'Fresh Seasonal Fruit Bowl',
        description: 'Assorted fresh bowl of apple, banana, pomegranate, papaya, and watermelon.',
        price: 60,
        category: 'Healthy Food',
        isVegetarian: true,
        image: '/images/food/fruit-bowl.jpg',
        stockQuantity: 30,
        preparationTime: 5,
        popularity: 45,
        ingredients: ['Apple', 'Banana', 'Pomegranate', 'Papaya'],
        allergyInfo: [],
        dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
        branches: allBranchIds
      },
      {
        name: 'Protein Sprouts Salad',
        description: 'Sprouted mung beans and chana salad tossed with onion, tomato, lemon, and chaat masala.',
        price: 50,
        category: 'Healthy Food',
        isVegetarian: true,
        image: '/images/food/sprouts-salad.jpg',
        stockQuantity: 35,
        preparationTime: 5,
        popularity: 50,
        ingredients: ['Sprouted Mung', 'Chana', 'Lemon', 'Cucumber'],
        allergyInfo: [],
        dietaryTags: ['Vegetarian', 'Gluten-Free', 'High-Protein'],
        branches: allBranchIds
      },

      // SPECIAL ITEMS
      {
        name: 'Paneer Tikka Roll',
        description: 'Char-grilled cottage cheese cubes wrapped in a soft paratha with mint chutney and onions.',
        price: 90,
        category: 'Special Items',
        isVegetarian: true,
        image: '/images/food/paneer-roll.jpg',
        stockQuantity: 40,
        preparationTime: 12,
        popularity: 88,
        isTodaySpecial: true,
        ingredients: ['Paneer', 'Paratha', 'Mint Chutney', 'Onion'],
        allergyInfo: ['Dairy', 'Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: [mainBranch._id, hostelBranch._id]
      },
      {
        name: 'Special Hyderabadi Veg Biryani',
        description: 'Aromatic basmati rice dum cooked with marinated paneer, vegetables, mint, and saffron served with raita.',
        price: 140,
        category: 'Special Items',
        isVegetarian: true,
        image: '/images/food/biryani.jpg',
        stockQuantity: 40,
        preparationTime: 15,
        popularity: 95,
        isTodaySpecial: true,
        ingredients: ['Basmati Rice', 'Paneer', 'Biryani Spices', 'Raita'],
        allergyInfo: ['Dairy'],
        dietaryTags: ['Vegetarian'],
        branches: [mainBranch._id, hostelBranch._id]
      }
    ];

    const insertedItems = await MenuItem.insertMany(itemsToSeed);
    console.log(`Inserted: ${insertedItems.length} food items`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const usersToCreate = [
      { name: 'Admin User', email: 'admin@canteen.edu', role: 'Admin', phone: '9876543210' },
      { name: 'Kitchen Chef Ramu', email: 'kitchen@canteen.edu', role: 'Kitchen Staff', branch: mainBranch._id, phone: '9876543211' },
      { name: 'Operator Priya', email: 'operator@canteen.edu', role: 'Canteen Operator', branch: mainBranch._id, phone: '9876543212' },
      { name: 'Rider Suresh', email: 'delivery@canteen.edu', role: 'Delivery Staff', phone: '9876543213' },
      { name: 'Manager Rajesh', email: 'manager@canteen.edu', role: 'Branch Manager', branch: mainBranch._id, phone: '9876543214' },
      { name: 'Rahul Sharma (Student)', email: 'student@canteen.edu', role: 'Student', studentId: 'STU-2026-001', phone: '9876543215' },
      { name: 'Ananya Roy (Master Student)', email: 'mstudent@canteen.edu', role: "Master's Student", studentId: 'MST-2026-002', phone: '9876543216' }
    ];

    for (const u of usersToCreate) {
      const createdUser = await User.create({
        ...u,
        password: passwordHash
      });

      if (u.role === 'Student' || u.role === "Master's Student") {
        await StudentProfile.create({
          user: createdUser._id,
          studentId: u.studentId,
          degreeLevel: u.role === "Master's Student" ? "Master's" : 'Degree',
          programType: u.role === "Master's Student" ? 'MCA' : 'BCA',
          course: u.role === "Master's Student" ? 'MCA' : 'BCA',
          department: 'Computer Applications',
          year: '2nd Year',
          semester: '3rd Semester',
          section: 'Section A',
          hostelBuilding: 'Hostel A',
          roomNumber: '203',
          dietaryPreferences: ['Vegetarian'],
          allergies: ['Peanuts']
        });
      }
    }

    console.log('Seed completed successfully');
    return true;
  } catch (err) {
    console.error('Seed execution error:', err);
    throw err;
  }
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedData;

