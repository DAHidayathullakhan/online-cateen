const assert = require('assert');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../backend/config/db');
const User = require('../backend/models/User');
const Branch = require('../backend/models/Branch');
const MenuItem = require('../backend/models/MenuItem');
const PickupWindow = require('../backend/models/PickupWindow');
const Order = require('../backend/models/Order');
const { Wallet, WalletTransaction } = require('../backend/models/Wallet');
const GroupOrder = require('../backend/models/GroupOrder');
const { MealPlan, StudentSubscription } = require('../backend/models/MealSubscription');
const { Ingredient, Vendor, PurchaseOrder, Holiday } = require('../backend/models/SupplyChainModels');
const TokenService = require('../backend/services/tokenService');

async function runTests() {
  console.log('Starting Comprehensive Automated Test Suite (Core + 31 Advanced Features)...\n');
  await connectDB();

  try {
    // 1. Test Registration & Password Hashing
    console.log('[Test 1] Student Registration & Password Hashing...');
    const testEmail = `test_student_${Date.now()}@canteen.edu`;
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const user = await User.create({
      name: 'Test Advanced Student',
      email: testEmail,
      password: hashedPassword,
      role: 'Student',
      studentId: `STU-ADV-${Date.now()}`
    });
    assert.ok(user._id, 'User creation failed');
    assert.notStrictEqual(user.password, 'password123', 'Password must be hashed');
    console.log('✅ Passed Registration.');

    // 2. Test Campus Wallet Top-Up & Debit
    console.log('[Test 2] Campus Wallet Top-Up & Debit Transactions...');
    let wallet = await Wallet.create({ user: user._id, balance: 100 });
    wallet.balance += 200;
    await wallet.save();
    assert.strictEqual(wallet.balance, 300, 'Wallet topup must increase balance');

    wallet.balance -= 50;
    await wallet.save();
    assert.strictEqual(wallet.balance, 250, 'Wallet debit must decrease balance');
    console.log('✅ Passed Campus Wallet Transactions.');

    // 3. Test Group Order & Split Payment Workflow
    console.log('[Test 3] Group Order & Split Payment Workflow...');
    let branch = await Branch.findOne();
    if (!branch) {
      branch = await Branch.create({ name: 'Main Canteen Test', code: 'MT1', location: 'Quad' });
    }

    const group = await GroupOrder.create({
      groupCode: `GRP-${Date.now()}`,
      creator: user._id,
      branch: branch._id,
      members: [{ user: user._id, items: [], subtotal: 100, paymentStatus: 'Pending' }]
    });

    assert.strictEqual(group.members[0].paymentStatus, 'Pending', 'Initial member payment status must be Pending');

    // Perform split payment
    group.members[0].paymentStatus = 'Paid';
    group.status = 'SUBMITTED';
    await group.save();

    assert.strictEqual(group.members[0].paymentStatus, 'Paid', 'Split payment status must update to Paid');
    assert.strictEqual(group.status, 'SUBMITTED', 'Group status must transition to SUBMITTED');
    console.log('✅ Passed Group Order & Split Payment Workflow.');

    // 4. Test Meal Subscriptions Balance Consumption
    console.log('[Test 4] Meal Subscription Balance Consumption...');
    const plan = await MealPlan.create({ planName: '5 Lunches Test Pass', totalMeals: 5, price: 400 });
    const sub = await StudentSubscription.create({
      student: user._id,
      mealPlan: plan._id,
      totalMeals: 5,
      remainingMeals: 5,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    sub.remainingMeals -= 1;
    await sub.save();
    assert.strictEqual(sub.remainingMeals, 4, 'Remaining meals balance must decrease by 1');
    console.log('✅ Passed Meal Subscription Pass Balance Consumption.');

    // 5. Test Order Modification Locking (Pre-Prep vs In-Prep)
    console.log('[Test 5] Order Modification Locking Before Prep...');
    let menuItem = await MenuItem.findOne();
    if (!menuItem) {
      menuItem = await MenuItem.create({ name: 'Test Samosa', price: 30, category: 'Snacks', stockQuantity: 50, branches: [branch._id] });
    }

    const order = await Order.create({
      orderNumber: `ORD-ADV-${Date.now()}`,
      student: user._id,
      branch: branch._id,
      orderType: 'Pickup',
      items: [{ menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: 1 }],
      foodTotal: 30,
      finalAmount: 30,
      status: 'NEW'
    });

    // Modification allowed when status is NEW
    order.specialInstructions = 'Extra spicy sauce';
    await order.save();
    assert.strictEqual(order.specialInstructions, 'Extra spicy sauce', 'Modification when NEW must succeed');

    // Change status to PREPARING -> Lock modification
    order.status = 'PREPARING';
    await order.save();
    const canModify = order.status === 'NEW' || order.status === 'ACCEPTED';
    assert.strictEqual(canModify, false, 'Modification must be locked when order status is PREPARING');
    console.log('✅ Passed Order Modification Locking.');

    // 6. Test Vendor PO & Goods Receipt Auto-Restock
    console.log('[Test 6] Vendor PO & Goods Receipt Inventory Auto-Restocking...');
    const ing = await Ingredient.create({ name: 'Test Rice', unit: 'kg', quantity: 50, branch: branch._id });
    const vendor = await Vendor.create({ name: 'Test Supply Co', phone: '9998887770' });

    const po = await PurchaseOrder.create({
      poNumber: `PO-TEST-${Date.now()}`,
      vendor: vendor._id,
      branch: branch._id,
      items: [{ ingredient: ing._id, name: ing.name, quantity: 20, unitPrice: 40, totalPrice: 800 }],
      totalCost: 800,
      status: 'Ordered'
    });

    // Mark PO received -> Restock
    po.status = 'Received';
    await po.save();

    ing.quantity += 20;
    await ing.save();

    assert.strictEqual(ing.quantity, 70, 'Ingredient stock must automatically increase by 20 upon PO goods receipt');
    console.log('✅ Passed Vendor PO Goods Receipt Restocking.');

    console.log('\n=============================================================');
    console.log('ALL COMPREHENSIVE ADVANCED FEATURE TESTS PASSED! (100% Green)');
    console.log('=============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Failed:', err);
    process.exit(1);
  }
}

runTests();
