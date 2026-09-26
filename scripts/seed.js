const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../backend/models/User');
const StudentProfile = require('../backend/models/StudentProfile');
const { ProgramType, Course, Department, AcademicYear, Semester, Section } = require('../backend/models/Academic');
const Branch = require('../backend/models/Branch');
const MenuCategory = require('../backend/models/MenuCategory');
const MenuItem = require('../backend/models/MenuItem');
const PickupWindow = require('../backend/models/PickupWindow');
const { Inventory } = require('../backend/models/Inventory');
const { DeliveryLocation } = require('../backend/models/Delivery');
const Coupon = require('../backend/models/Coupon');
const { Wallet } = require('../backend/models/Wallet');
const { MealPlan } = require('../backend/models/MealSubscription');
const { Ingredient, Vendor, Holiday } = require('../backend/models/SupplyChainModels');
const connectDB = require('../backend/config/db');

const seedData = async () => {
  try {
    await connectDB();
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
    await PickupWindow.deleteMany({});
    await Inventory.deleteMany({});
    await DeliveryLocation.deleteMany({});
    await Coupon.deleteMany({});
    await Wallet.deleteMany({});
    await MealPlan.deleteMany({});
    await Ingredient.deleteMany({});
    await Vendor.deleteMany({});
    await Holiday.deleteMany({});

    console.log('Seeding Academic Structure...');
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

    console.log('Seeding Canteen Branches...');
    const branches = await Branch.insertMany([
      { name: 'Main Canteen', code: 'MAIN', location: 'Central Academic Quad' },
      { name: 'Hostel Canteen', code: 'HOSTEL', location: 'Hostel Block A Ground Floor' },
      { name: 'Block B Canteen', code: 'BLOCK_B', location: 'Department Block B' },
      { name: 'Evening Snacks Counter', code: 'SNACKS', location: 'Sports Complex Pavilion' }
    ]);

    const mainBranch = branches[0];
    const hostelBranch = branches[1];

    console.log('Seeding Menu Categories & Food Items...');
    const categories = ['Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Meals', 'Fast Food', 'Healthy Food', 'Special Items'];
    for (let i = 0; i < categories.length; i++) {
      await MenuCategory.create({ name: categories[i], displayOrder: i + 1 });
    }

    const menuItems = await MenuItem.insertMany([
      {
        name: 'South Indian Veg Meals',
        description: 'Complete meal with rice, sambar, rasam, curd, papad, and 2 vegetable curries.',
        price: 90,
        category: 'Meals',
        isVegetarian: true,
        isAvailable: true,
        stockQuantity: 60,
        preparationTime: 12,
        isTodaySpecial: true,
        ingredients: ['Rice', 'Lentils', 'Vegetables', 'Curd'],
        allergyInfo: [],
        dietaryTags: ['Vegetarian'],
        branches: [mainBranch._id, hostelBranch._id]
      },
      {
        name: 'Curd Rice & Pickle',
        description: 'Refreshing curd rice tempered with mustard seeds and curry leaves.',
        price: 50,
        category: 'Meals',
        isVegetarian: true,
        isAvailable: true,
        stockQuantity: 40,
        preparationTime: 5,
        popularity: 15,
        ingredients: ['Rice', 'Curd', 'Mustard', 'Curry Leaves'],
        allergyInfo: ['Dairy'],
        dietaryTags: ['Vegetarian', 'No Onion', 'No Garlic'],
        branches: [mainBranch._id, hostelBranch._id]
      },
      {
        name: 'Paneer Butter Masala Chapati Combo',
        description: '3 soft whole wheat chapatis served with rich paneer butter masala gravy.',
        price: 110,
        category: 'Lunch',
        isVegetarian: true,
        isAvailable: true,
        stockQuantity: 30,
        preparationTime: 15,
        isTodaySpecial: true,
        ingredients: ['Paneer', 'Butter', 'Whole Wheat', 'Tomato Gravy'],
        allergyInfo: ['Dairy', 'Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: [mainBranch._id]
      },
      {
        name: 'Crispy Veg Samosa (2 pcs)',
        description: 'Deep fried crispy pastry filled with spiced potato and pea stuffing.',
        price: 30,
        category: 'Snacks',
        isVegetarian: true,
        isAvailable: true,
        stockQuantity: 100,
        preparationTime: 5,
        popularity: 45,
        ingredients: ['Potato', 'Peas', 'Flour', 'Spices'],
        allergyInfo: ['Gluten'],
        dietaryTags: ['Vegetarian', 'Jain'],
        branches: [mainBranch._id, hostelBranch._id]
      },
      {
        name: 'Grilled Cheese Veg Sandwich',
        description: 'Toasted white bread filled with fresh cucumber, tomato, cheese, and mint chutney.',
        price: 60,
        category: 'Snacks',
        isVegetarian: true,
        isAvailable: true,
        stockQuantity: 45,
        preparationTime: 10,
        popularity: 30,
        ingredients: ['Bread', 'Cheese', 'Tomato', 'Cucumber'],
        allergyInfo: ['Dairy', 'Gluten'],
        dietaryTags: ['Vegetarian'],
        branches: [mainBranch._id, hostelBranch._id]
      }
    ]);

    console.log('Seeding Multi-Branch Inventory...');
    for (const b of branches) {
      for (const item of menuItems) {
        await Inventory.create({
          menuItem: item._id,
          branch: b._id,
          quantity: Math.floor(25 + Math.random() * 40),
          minStock: 10,
          maxStock: 100
        });
      }
    }

    console.log('Seeding Raw Ingredients & Vendors...');
    await Ingredient.insertMany([
      { name: 'Basmati Rice', unit: 'kg', quantity: 150, minStock: 30, branch: mainBranch._id, supplier: 'Fresh Grain Co' },
      { name: 'Toor Dal', unit: 'kg', quantity: 80, minStock: 20, branch: mainBranch._id, supplier: 'Fresh Grain Co' },
      { name: 'Fresh Milk', unit: 'L', quantity: 100, minStock: 25, branch: mainBranch._id, supplier: 'Campus Dairy Ltd' },
      { name: 'Refined Oil', unit: 'L', quantity: 60, minStock: 15, branch: mainBranch._id, supplier: 'SunOil Dist' }
    ]);

    await Vendor.insertMany([
      { name: 'Fresh Grain Co', contactPerson: 'Mr. Gupta', phone: '9876500001', suppliedIngredients: ['Rice', 'Dal', 'Flour'] },
      { name: 'Campus Dairy Ltd', contactPerson: 'Mr. Milkman', phone: '9876500002', suppliedIngredients: ['Milk', 'Paneer', 'Butter', 'Curd'] }
    ]);

    console.log('Seeding Meal Plans...');
    await MealPlan.insertMany([
      { planName: '5 Lunches Express Pass', totalMeals: 5, price: 400, validityDays: 14, eligibleBranches: [mainBranch._id] },
      { planName: '10 Lunches Monthly Plan', totalMeals: 10, price: 750, validityDays: 30, eligibleBranches: [mainBranch._id, hostelBranch._id] },
      { planName: '20 Meals Unlimited Pass', totalMeals: 20, price: 1400, validityDays: 30, eligibleBranches: [mainBranch._id, hostelBranch._id] }
    ]);

    console.log('Seeding Lunch Pickup Windows for Today...');
    const todayStr = new Date().toISOString().split('T')[0];
    const timeSlots = [
      { start: '11:45 AM', end: '12:00 PM' },
      { start: '12:00 PM', end: '12:15 PM' },
      { start: '12:15 PM', end: '12:30 PM' },
      { start: '12:30 PM', end: '12:45 PM' },
      { start: '12:45 PM', end: '01:00 PM' },
      { start: '01:00 PM', end: '01:15 PM' }
    ];

    for (const slot of timeSlots) {
      await PickupWindow.create({
        branch: mainBranch._id,
        date: todayStr,
        startTime: slot.start,
        endTime: slot.end,
        maxOrders: 15,
        currentOrders: 2
      });
    }

    console.log('Seeding Delivery Locations...');
    await DeliveryLocation.insertMany([
      { buildingName: 'Hostel A', floors: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'] },
      { buildingName: 'Hostel B', floors: ['Ground Floor', '1st Floor', '2nd Floor'] },
      { buildingName: 'Department Block B', floors: ['1st Floor', '2nd Floor', '3rd Floor'] }
    ]);

    console.log('Seeding Offers & Coupons...');
    await Coupon.create({
      code: 'BCA10',
      title: 'BCA Student Special 10% Off',
      description: 'Exclusive 10% discount on snacks for BCA computer application students.',
      discountType: 'percentage',
      discountValue: 10,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      eligibleCourses: ['BCA']
    });

    console.log('Seeding Demo Users & Wallets...');
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

      // Initialize ₹500 Campus Wallet
      await Wallet.create({ user: createdUser._id, balance: 500 });

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

    console.log('\n=============================================================');
    console.log('Advanced Smart Canteen Seed Completed Successfully!');
    console.log('Demo Credentials for Testing (Password for all accounts: password123):');
    console.log('1. Admin: admin@canteen.edu');
    console.log('2. Kitchen Staff: kitchen@canteen.edu');
    console.log('3. Canteen Operator: operator@canteen.edu');
    console.log('4. Delivery Staff: delivery@canteen.edu');
    console.log('5. Branch Manager: manager@canteen.edu');
    console.log('6. Student: student@canteen.edu');
    console.log('7. Master\'s Student: mstudent@canteen.edu');
    console.log('=============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Seed execution error:', err);
    process.exit(1);
  }
};

seedData();
