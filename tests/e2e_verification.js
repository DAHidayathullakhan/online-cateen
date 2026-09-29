const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('STARTING END-TO-END VERIFICATION OF SMART CAMPUS CANTEEN');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('--- 1. Testing Server & Database Health ---');
    const health = await request({ hostname: 'localhost', port: 3000, path: '/api/health', method: 'GET' });
    assert(health.status === 200 && health.data?.database === 'connected', 'Server is healthy & database connected');

    // 2. Authentication: Student Login
    console.log('\n--- 2. Testing Authentication & Session Persistence ---');
    const studentLogin = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { loginKey: 'student@canteen.edu', password: 'password123' });

    assert(studentLogin.status === 200 && studentLogin.data.token, 'Student login returned JWT token');
    assert(studentLogin.data.data.role === 'Student', 'Student role correctly identified');
    assert(!studentLogin.data.data.password && !studentLogin.data.data.passwordHash, 'Password and hash safely omitted');

    const studentToken = studentLogin.data.token;

    // Check GET /api/auth/me (Simulating Page Refresh)
    const meRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(meRes.status === 200 && meRes.data.data.email === 'student@canteen.edu', 'GET /api/auth/me verifies session on page refresh');

    // 3. Operator & Admin Login
    console.log('\n--- 3. Testing Staff Authentication & Role Separation ---');
    const opLogin = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { loginKey: 'operator@canteen.edu', password: 'password123' });

    assert(opLogin.status === 200 && opLogin.data.data.role === 'Canteen Operator', 'Canteen Operator login successful');
    const operatorToken = opLogin.data.token;

    const adminLogin = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { loginKey: 'admin@canteen.edu', password: 'password123' });

    assert(adminLogin.status === 200 && adminLogin.data.data.role === 'Admin', 'Admin login successful');
    const adminToken = adminLogin.data.token;

    // 4. Role Protection: Student cannot add dish
    console.log('\n--- 4. Testing Role Protection on Backend ---');
    const unauthorizedDish = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/menu',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` }
    }, { name: 'Hacked Dish', price: 10, category: 'Meals' });
    assert(unauthorizedDish.status === 403, 'Student cannot add dishes (403 Forbidden)');

    // 5. Menu Listing
    console.log('\n--- 5. Testing Menu Catalog & Real Photographs ---');
    const menuRes = await request({ hostname: 'localhost', port: 3000, path: '/api/menu', method: 'GET' });
    assert(menuRes.status === 200 && menuRes.data.data.length > 0, `Fetched ${menuRes.data.data.length} dishes from MongoDB`);
    const sampleDish = menuRes.data.data[0];
    assert(sampleDish.image.endsWith('.jpg') || sampleDish.image.endsWith('.png') || sampleDish.image.endsWith('.webp'), `Dish "${sampleDish.name}" uses real photo: ${sampleDish.image}`);

    // 6. Online Payment Validation (when credentials not configured)
    console.log('\n--- 6. Testing Online Payment Validation ---');
    const onlineOrderAttempt = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` }
    }, {
      items: [{ id: sampleDish._id, quantity: 1 }],
      paymentMethod: 'ONLINE'
    });
    assert(onlineOrderAttempt.status === 400 && onlineOrderAttempt.data.message.includes('Online payment is not configured'), 'Unconfigured online payment gracefully returns error alert instead of fake success');

    // 7. Cash at Canteen Order Creation Flow
    console.log('\n--- 7. Testing Cash Payment Order Creation ---');
    const cashOrder = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` }
    }, {
      items: [{ id: sampleDish._id, quantity: 2 }],
      paymentMethod: 'CASH',
      orderType: 'Pickup',
      pickupWindow: '12:15 PM – 12:30 PM',
      branch: 'Main Canteen'
    });

    assert(cashOrder.status === 201 && cashOrder.data.data.tokenNumber, `Cash order created with Token: ${cashOrder.data.data.tokenNumber}`);
    assert(cashOrder.data.data.paymentStatus === 'PENDING', 'Payment status is PENDING for cash order');
    assert(cashOrder.data.data.totalAmount === sampleDish.price * 2, `Server calculated real amount: ₹${cashOrder.data.data.totalAmount}`);

    const createdOrder = cashOrder.data.data;

    // 8. My Orders (Student Only)
    console.log('\n--- 8. Testing My Orders for Student ---');
    const myOrdersRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders/my-orders',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(myOrdersRes.status === 200 && myOrdersRes.data.data.some(o => o.orderNumber === createdOrder.orderNumber), 'Newly created order appears in My Orders');

    // 9. Operator Marks Cash Received
    console.log('\n--- 9. Testing Operator "Mark Cash Received" ---');
    const markCashRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/orders/${createdOrder._id}/pay-cash`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    assert(markCashRes.status === 200 && markCashRes.data.data.paymentStatus === 'PAID', 'Operator marked cash payment as PAID');
    assert(markCashRes.data.data.paidBy !== undefined, 'Audit trail recorded who received cash');

    // 10. Kitchen Status Update
    console.log('\n--- 10. Testing Kitchen Status Lifecycle ---');
    const prepRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/orders/${createdOrder._id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${operatorToken}` }
    }, { status: 'Preparing' });
    assert(prepRes.status === 200 && prepRes.data.data.status === 'Preparing', 'Order status moved to Preparing');

    const readyRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/orders/${createdOrder._id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${operatorToken}` }
    }, { status: 'Ready' });
    assert(readyRes.status === 200 && readyRes.data.data.status === 'Ready', 'Order status moved to Ready');

    // 11. Token Verification by Operator
    console.log('\n--- 11. Testing Token Verification & Double-Collection Prevention ---');
    const verifyRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/tokens/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${operatorToken}` }
    }, { token: createdOrder.tokenNumber });

    assert(verifyRes.status === 200 && verifyRes.data.message === 'Order collected successfully.', 'Token verified and order completed');

    // Attempt double collection
    const doubleVerify = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/tokens/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${operatorToken}` }
    }, { token: createdOrder.tokenNumber });
    assert(doubleVerify.status === 400 && doubleVerify.data.message.includes('already been used'), 'Double collection prevented: Token already used');

    // 12. Add New Dish by Operator/Admin
    console.log('\n--- 12. Testing Add New Dish with Real Photograph ---');
    const newDishRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/menu',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${operatorToken}` }
    }, {
      name: 'Paneer Fried Rice',
      description: 'Freshly prepared vegetable fried rice with paneer cubes and herbs.',
      price: 80,
      category: 'Meals',
      isVegetarian: true,
      image: '/images/food/biryani.jpg',
      stockQuantity: 50,
      preparationTime: 12,
      isTodaySpecial: true
    });

    assert(newDishRes.status === 201 && newDishRes.data.data.name === 'Paneer Fried Rice', 'Operator added "Paneer Fried Rice" to MongoDB');
    const createdDishId = newDishRes.data.data._id;

    // Verify it appears in public menu
    const menuAfterAdd = await request({ hostname: 'localhost', port: 3000, path: '/api/menu', method: 'GET' });
    assert(menuAfterAdd.data.data.some(d => d.name === 'Paneer Fried Rice'), '"Paneer Fried Rice" immediately visible in student menu');

    // 14. Port 3838 Dual-Port Verification (Fixing ECONNREFUSED 127.0.0.1:3838)
    console.log('\n--- 14. Testing Port 3838 (Dual-Port Access) ---');
    const port3838Health = await request({ hostname: '127.0.0.1', port: 3838, path: '/api/health', method: 'GET' });
    assert(port3838Health.status === 200 && port3838Health.data?.database === 'connected', 'Port 3838 successfully reached without ECONNREFUSED');

    const port3838Menu = await request({ hostname: '127.0.0.1', port: 3838, path: '/api/menu', method: 'GET' });
    assert(port3838Menu.status === 200 && Array.isArray(port3838Menu.data?.data), 'Port 3838 serves menu catalog identically');

    // 15. Real Crowd Status & Queue Estimations
    console.log('\n--- 15. Testing Real Crowd Status & Smart Slot Prediction ---');
    const crowdRes = await request({ hostname: 'localhost', port: 3000, path: '/api/crowd/status', method: 'GET' });
    assert(crowdRes.status === 200 && crowdRes.data.data.crowdLevel, `Crowd level reported: ${crowdRes.data?.data?.crowdLevel}`);
    assert(crowdRes.data.data.recommendedSlot, `Smart recommended pickup slot: ${crowdRes.data?.data?.recommendedSlot}`);

    // 16. Real MongoDB Analytics Summary
    console.log('\n--- 16. Testing Real MongoDB Sales & Financial Analytics ---');
    const analyticsRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/analytics/summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(analyticsRes.status === 200 && analyticsRes.data.success, 'Analytics summary returned successfully');
    assert(analyticsRes.data.data.paymentBreakdown?.cash !== undefined, 'Payment breakdown contains Cash payments');
    assert(analyticsRes.data.data.paymentBreakdown?.online !== undefined, 'Payment breakdown contains Online payments');
    assert(analyticsRes.data.data.financialEstimates?.estimatedIngredientCosts !== undefined, 'Financial estimates include 45% ingredient cost benchmark');

    // 17. Cash Register Session Tracking (Open, Expense, Close, Variance)
    console.log('\n--- 17. Testing Cash Register Session & Variance Tracking ---');
    const openRegRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cash-register/open',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${operatorToken}` }
    }, { openingBalance: 1000, branch: 'Main Canteen', notes: 'Morning shift opening float' });
    assert(openRegRes.status === 200 && openRegRes.data.data.status === 'OPEN', 'Cash register opened with float ₹1000');

    // Record petty cash expense
    const expenseRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cash-register/transaction',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${operatorToken}` }
    }, { type: 'EXPENSE', amount: 150, reason: 'Fresh mint and coriander herbs' });
    assert(expenseRes.status === 200 && expenseRes.data.data.totalExpenses >= 150, 'Petty cash expense of ₹150 recorded');

    // Close register shift
    const closeRegRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cash-register/close',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${operatorToken}` }
    }, { closingBalance: 850, closingNotes: 'Shift end physical count' });
    assert(closeRegRes.status === 200 && closeRegRes.data.data.status === 'CLOSED', 'Cash register closed');
    assert(closeRegRes.data.data.variance === 0, 'Variance calculated correctly (0 variance: exact match)');

    console.log('\n========================================================');
    console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  }
}

runTests();
