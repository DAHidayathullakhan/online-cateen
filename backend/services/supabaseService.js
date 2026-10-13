const { supabase, isSupabaseConfigured } = require('../config/supabase');
const QRCode = require('qrcode');

// ============================================================================
// ROLE & STATUS MAPPING HELPERS
// Ensures 100% interoperability between Supabase PostgreSQL Enums and Frontend
// ============================================================================
const ROLE_MAP_TO_DB = {
  'Student': 'STUDENT',
  "Master's Student": 'MASTER_STUDENT',
  'Canteen Operator': 'CANTEEN_OPERATOR',
  'Kitchen Staff': 'KITCHEN_STAFF',
  'Delivery Staff': 'DELIVERY_STAFF',
  'Branch Manager': 'BRANCH_MANAGER',
  'Admin': 'ADMIN'
};

const ROLE_MAP_FROM_DB = {
  'STUDENT': 'Student',
  'MASTER_STUDENT': "Master's Student",
  'CANTEEN_OPERATOR': 'Canteen Operator',
  'KITCHEN_STAFF': 'Kitchen Staff',
  'DELIVERY_STAFF': 'Delivery Staff',
  'BRANCH_MANAGER': 'Branch Manager',
  'ADMIN': 'Admin'
};

function toDbRole(role) {
  if (!role) return 'STUDENT';
  return ROLE_MAP_TO_DB[role] || (Object.values(ROLE_MAP_TO_DB).includes(role.toUpperCase()) ? role.toUpperCase() : 'STUDENT');
}

function fromDbRole(role) {
  if (!role) return 'Student';
  return ROLE_MAP_FROM_DB[role] || role;
}

const STATUS_MAP_TO_DB = {
  'Confirmed': 'CONFIRMED',
  'Preparing': 'PREPARING',
  'Ready': 'READY',
  'Completed': 'COMPLETED',
  'Cancelled': 'CANCELLED',
  'Received': 'RECEIVED',
  'Out for Delivery': 'OUT_FOR_DELIVERY',
  'Delivered': 'DELIVERED'
};

const STATUS_MAP_FROM_DB = {
  'CONFIRMED': 'Confirmed',
  'PREPARING': 'Preparing',
  'READY': 'Ready',
  'COMPLETED': 'Completed',
  'CANCELLED': 'Cancelled',
  'RECEIVED': 'Received',
  'OUT_FOR_DELIVERY': 'Out for Delivery',
  'DELIVERED': 'Delivered'
};

function toDbStatus(status) {
  if (!status) return 'CONFIRMED';
  return STATUS_MAP_TO_DB[status] || status.toUpperCase();
}

function fromDbStatus(status) {
  if (!status) return 'Confirmed';
  return STATUS_MAP_FROM_DB[status] || status;
}

// Convert Supabase menu_item row to frontend expected shape
function formatMenuItem(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: parseFloat(row.price),
    category: row.category,
    image: row.image_url || row.image || '/images/food/placeholder.jpg',
    image_url: row.image_url || row.image || '/images/food/placeholder.jpg',
    isVegetarian: true, // STRICTLY 100% PURE VEGETARIAN
    is_vegetarian: true,
    isAvailable: row.is_available ?? true,
    is_available: row.is_available ?? true,
    stockQuantity: row.stock_quantity ?? 50,
    stock_quantity: row.stock_quantity ?? 50,
    preparationTime: row.preparation_time ?? 10,
    preparation_time: row.preparation_time ?? 10,
    isTodaySpecial: row.is_today_special ?? false,
    is_today_special: row.is_today_special ?? false,
    popularity: row.popularity ?? 0,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    allergyInfo: Array.isArray(row.allergy_info) ? row.allergy_info : [],
    dietaryTags: Array.isArray(row.dietary_tags) ? row.dietary_tags : ['Pure Veg'],
    branch: row.branch_id || 'Main Canteen',
    branches: row.branch_id ? [row.branch_id] : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Convert Supabase order row to frontend expected shape
function formatOrder(row, orderItems = []) {
  if (!row) return null;
  const items = (orderItems.length > 0 ? orderItems : (row.items_summary || [])).map(i => ({
    _id: i.id || i.menu_item_id,
    item: i.menu_item_id || i.id,
    name: i.name,
    price: parseFloat(i.price),
    quantity: parseInt(i.quantity, 10),
    image: i.image_url || i.image || '/images/food/placeholder.jpg',
    preparationTime: i.preparation_time || 10
  }));

  return {
    _id: row.id,
    id: row.id,
    orderNumber: row.order_number,
    tokenNumber: row.token_number,
    user: row.user_id,
    studentName: row.student_name,
    studentId: row.student_id,
    items,
    subtotal: parseFloat(row.subtotal || 0),
    deliveryFee: parseFloat(row.delivery_fee || 0),
    totalAmount: parseFloat(row.total_amount || 0),
    orderType: row.order_type || 'Pickup',
    pickupWindow: row.pickup_window,
    deliveryLocation: row.delivery_location,
    roomNumber: row.room_number,
    branch: row.branch || 'Main Canteen',
    status: fromDbStatus(row.status),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    tokenStatus: row.token_status || 'ACTIVE',
    tokenUsedAt: row.token_used_at,
    paidAt: row.paid_at,
    paidBy: row.paid_by,
    qrCodeData: row.qr_code_data || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ============================================================================
// AUTHENTICATION & PROFILES SERVICE
// ============================================================================
const authService = {
  async findUserByLogin(loginKey) {
    if (!supabase) return null;
    const cleanKey = loginKey.trim();
    const isEmail = cleanKey.includes('@');

    let query = supabase.from('profiles').select('*');
    if (isEmail) {
      query = query.ilike('email', cleanKey);
    } else {
      query = query.or(`email.ilike.${cleanKey},student_id.ilike.${cleanKey}`);
    }

    const { data, error } = await query.limit(1);
    if (error || !data || data.length === 0) return null;

    const row = data[0];
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password_hash,
      phone: row.phone,
      role: fromDbRole(row.role),
      studentId: row.student_id,
      degreeLevel: row.degree_level,
      programType: row.program_type,
      course: row.course,
      department: row.department,
      branch: row.branch_id
    };
  },

  async findUserById(id) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).limit(1);
    if (error || !data || data.length === 0) return null;
    const row = data[0];
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      email: row.email,
      role: fromDbRole(row.role),
      studentId: row.student_id,
      degreeLevel: row.degree_level,
      programType: row.program_type,
      course: row.course,
      department: row.department,
      phone: row.phone
    };
  },

  async createUser({ name, email, passwordHash, phone, role, studentId, degreeLevel, programType, course, department }) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const dbRole = toDbRole(role);
    const { data, error } = await supabase.from('profiles').insert([{
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      phone: phone || '',
      role: dbRole,
      student_id: studentId ? studentId.toUpperCase().trim() : null,
      degree_level: degreeLevel || 'Degree',
      program_type: programType || 'BCA',
      course: course || 'BCA',
      department: department || 'Computer Applications'
    }]).select();

    if (error) throw new Error(`Supabase profile creation error: ${error.message}`);
    const row = data[0];
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      email: row.email,
      role: fromDbRole(row.role),
      studentId: row.student_id
    };
  }
};

// ============================================================================
// MENU ITEMS & CATEGORIES SERVICE (STRICTLY 100% PURE VEGETARIAN)
// ============================================================================
const menuService = {
  async getMenuItems(queryParams = {}) {
    if (!supabase) return [];
    const { category, isTodaySpecial, search, sort, isAvailable } = queryParams;

    let query = supabase.from('menu_items').select('*');

    // Strict Vegetarian enforcement: only fetch pure vegetarian
    query = query.eq('is_vegetarian', true);

    if (isAvailable !== 'all') {
      query = query.eq('is_available', true);
    }

    if (category && category !== 'all' && category !== 'All Categories' && category !== 'All Items' && category !== 'All Food' && category.trim() !== '') {
      query = query.ilike('category', category.trim());
    }

    if (isTodaySpecial === 'true') {
      query = query.eq('is_today_special', true);
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term},category.ilike.${term}`);
    }

    if (sort === 'price-low') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price-high') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'popularity') {
      query = query.order('popularity', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase Menu Error]', error.message);
      return [];
    }
    return (data || []).map(formatMenuItem);
  },

  async getMenuItemById(id) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('menu_items').select('*').eq('id', id).limit(1);
    if (error || !data || data.length === 0) return null;
    return formatMenuItem(data[0]);
  },

  async createMenuItem(data) {
    if (!supabase) throw new Error('Supabase client not initialized');

    // STRICT PURE VEG ENFORCEMENT: Reject non-vegetarian dish creations
    if (data.isVegetarian === false || data.is_vegetarian === false) {
      throw new Error('STRICT PURE VEG POLICY: Non-vegetarian dishes are strictly prohibited in Smart Campus Canteen.');
    }

    const rowToInsert = {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : '',
      price: parseFloat(data.price),
      category: data.category,
      image_url: data.image || data.image_url || '/images/food/placeholder.jpg',
      is_vegetarian: true, // Always true
      is_available: data.isAvailable ?? true,
      stock_quantity: parseInt(data.stockQuantity ?? 50, 10),
      preparation_time: parseInt(data.preparationTime ?? 10, 10),
      is_today_special: Boolean(data.isTodaySpecial),
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      allergy_info: Array.isArray(data.allergyInfo) ? data.allergyInfo : [],
      dietary_tags: Array.isArray(data.dietaryTags) ? data.dietaryTags : ['Pure Veg']
    };

    const { data: created, error } = await supabase.from('menu_items').insert([rowToInsert]).select();
    if (error) throw new Error(`Supabase create dish error: ${error.message}`);
    return formatMenuItem(created[0]);
  },

  async updateMenuItem(id, updates) {
    if (!supabase) throw new Error('Supabase client not initialized');

    if (updates.isVegetarian === false || updates.is_vegetarian === false) {
      throw new Error('STRICT PURE VEG POLICY: Cannot change dish to non-vegetarian.');
    }

    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.price !== undefined) payload.price = parseFloat(updates.price);
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.image !== undefined || updates.image_url !== undefined) {
      payload.image_url = updates.image || updates.image_url;
    }
    if (updates.stockQuantity !== undefined || updates.stock_quantity !== undefined) {
      payload.stock_quantity = parseInt(updates.stockQuantity ?? updates.stock_quantity, 10);
    }
    if (updates.preparationTime !== undefined || updates.preparation_time !== undefined) {
      payload.preparation_time = parseInt(updates.preparationTime ?? updates.preparation_time, 10);
    }
    if (updates.isAvailable !== undefined || updates.is_available !== undefined) {
      payload.is_available = Boolean(updates.isAvailable ?? updates.is_available);
    }
    if (updates.isTodaySpecial !== undefined || updates.is_today_special !== undefined) {
      payload.is_today_special = Boolean(updates.isTodaySpecial ?? updates.is_today_special);
    }
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('menu_items').update(payload).eq('id', id).select();
    if (error) throw new Error(`Supabase update dish error: ${error.message}`);
    return formatMenuItem(data[0]);
  },

  async toggleAvailability(id) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const existing = await this.getMenuItemById(id);
    if (!existing) throw new Error('Food item not found.');

    const newStatus = !existing.isAvailable;
    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw new Error(`Supabase toggle error: ${error.message}`);
    return formatMenuItem(data[0]);
  }
};

// ============================================================================
// ORDERS & DIGITAL TOKEN SERVICE
// ============================================================================
const orderService = {
  async createOrder({ user, items, orderType, pickupWindow, deliveryLocation, roomNumber, branch, paymentMethod }) {
    if (!supabase) throw new Error('Supabase client not initialized');

    // 1. Verify items and calculate total in Supabase
    let calculatedSubtotal = 0;
    const verifiedOrderItems = [];

    for (const entry of items) {
      const itemId = entry.id || entry.item?.id || entry.item?._id || entry.itemId;
      const quantity = parseInt(entry.quantity, 10);

      const food = await menuService.getMenuItemById(itemId);
      if (!food) {
        throw new Error(`Food item not found for ID: ${itemId}`);
      }
      if (!food.isAvailable) {
        throw new Error(`"${food.name}" is currently SOLD OUT / unavailable.`);
      }
      if (food.stockQuantity < quantity) {
        throw new Error(`Insufficient stock for "${food.name}". Available: ${food.stockQuantity}, Requested: ${quantity}`);
      }

      // Decrement stock in menu_items
      await supabase
        .from('menu_items')
        .update({ stock_quantity: food.stockQuantity - quantity, updated_at: new Date().toISOString() })
        .eq('id', food.id);

      const itemTotal = food.price * quantity;
      calculatedSubtotal += itemTotal;

      verifiedOrderItems.push({
        menu_item_id: food.id,
        name: food.name,
        price: food.price,
        quantity,
        image_url: food.image,
        preparation_time: food.preparationTime
      });
    }

    const deliveryFee = orderType === 'Room Delivery' ? 20 : 0;
    const totalAmount = calculatedSubtotal + deliveryFee;

    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const tokenNumber = `CAN-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const qrPayload = JSON.stringify({
      orderNumber,
      tokenNumber,
      studentId: user.studentId || user.email,
      totalAmount,
      branch: branch || 'Main Canteen'
    });

    let qrCodeData = '';
    try {
      qrCodeData = await QRCode.toDataURL(qrPayload);
    } catch (e) {
      qrCodeData = '';
    }

    // Insert order record
    const { data: orderData, error: orderErr } = await supabase.from('orders').insert([{
      order_number: orderNumber,
      token_number: tokenNumber,
      user_id: user.id || user._id,
      student_name: user.name,
      student_id: user.studentId || user.email,
      subtotal: calculatedSubtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      order_type: orderType || 'Pickup',
      pickup_window: orderType === 'Pickup' ? pickupWindow : null,
      delivery_location: orderType === 'Room Delivery' ? deliveryLocation : null,
      room_number: orderType === 'Room Delivery' ? roomNumber : null,
      branch: branch || 'Main Canteen',
      status: toDbStatus('Confirmed'),
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
      token_status: 'ACTIVE',
      qr_code_data: qrCodeData,
      items_summary: verifiedOrderItems
    }]).select();

    if (orderErr) throw new Error(`Supabase order insert error: ${orderErr.message}`);
    const createdOrder = orderData[0];

    // Insert order items
    const orderItemsRows = verifiedOrderItems.map(item => ({
      order_id: createdOrder.id,
      menu_item_id: item.menu_item_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url,
      preparation_time: item.preparation_time
    }));

    await supabase.from('order_items').insert(orderItemsRows);

    // Insert digital token record
    await supabase.from('digital_tokens').insert([{
      order_id: createdOrder.id,
      token_number: tokenNumber,
      status: 'ACTIVE',
      qr_payload: qrPayload
    }]);

    return formatOrder(createdOrder, verifiedOrderItems);
  },

  async getMyOrders(userId) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Orders Error]', error.message);
      return [];
    }
    return (data || []).map(row => formatOrder(row));
  },

  async getAllOrders({ branch, status } = {}) {
    if (!supabase) return [];
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (branch && branch !== 'All Branches') {
      query = query.eq('branch', branch);
    }
    if (status && status !== 'All') {
      query = query.eq('status', toDbStatus(status));
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase All Orders Error]', error.message);
      return [];
    }
    return (data || []).map(row => formatOrder(row));
  },

  async getOrderById(id) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).limit(1);
    if (error || !data || data.length === 0) return null;
    return formatOrder(data[0]);
  },

  async updateOrderStatus(id, newStatus) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const dbStatus = toDbStatus(newStatus);
    const updatePayload = {
      status: dbStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'Completed') {
      updatePayload.token_status = 'USED';
      updatePayload.token_used_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) throw new Error(`Supabase update order error: ${error.message}`);

    if (newStatus === 'Completed') {
      await supabase
        .from('digital_tokens')
        .update({ status: 'USED', verified_at: new Date().toISOString() })
        .eq('order_id', id);
    }

    return formatOrder(data[0]);
  },

  async markCashReceived(id, staffId) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const existing = await this.getOrderById(id);
    if (!existing) throw new Error('Order not found.');
    if (existing.paymentStatus === 'PAID') throw new Error('Payment has already been marked as PAID.');

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'PAID',
        paid_at: new Date().toISOString(),
        paid_by: staffId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw new Error(`Supabase mark paid error: ${error.message}`);
    return formatOrder(data[0]);
  }
};

// ============================================================================
// TOKEN VERIFICATION SERVICE
// ============================================================================
const tokenService = {
  async verifyToken(rawToken, staffId) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const tokenStr = rawToken.trim();

    // Look up by token_number or order_number
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`token_number.ilike.${tokenStr},order_number.ilike.${tokenStr}`)
      .limit(1);

    if (error || !data || data.length === 0) {
      throw new Error(`Token "${tokenStr}" not found in canteen database.`);
    }

    const orderRow = data[0];

    // Double collection prevention check
    if (orderRow.token_status === 'USED') {
      const usedTime = orderRow.token_used_at ? new Date(orderRow.token_used_at).toLocaleTimeString() : 'earlier';
      const err = new Error(`Token #${orderRow.token_number} has already been used and collected at ${usedTime}. Double collection prevented.`);
      err.data = formatOrder(orderRow);
      err.alreadyUsed = true;
      throw err;
    }

    if (orderRow.status === 'CANCELLED') {
      throw new Error(`Order #${orderRow.order_number} was cancelled and cannot be collected.`);
    }

    // Mark as collected & Completed
    const now = new Date().toISOString();
    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({
        token_status: 'USED',
        token_used_at: now,
        status: 'COMPLETED',
        updated_at: now
      })
      .eq('id', orderRow.id)
      .select();

    if (updateErr) throw new Error(`Supabase token update error: ${updateErr.message}`);

    await supabase
      .from('digital_tokens')
      .update({ status: 'USED', verified_at: now, verified_by: staffId })
      .eq('order_id', orderRow.id);

    const formatted = formatOrder(updated[0]);
    return {
      orderId: formatted._id,
      orderNumber: formatted.orderNumber,
      tokenNumber: formatted.tokenNumber,
      studentName: formatted.studentName,
      studentId: formatted.studentId,
      items: formatted.items,
      totalAmount: formatted.totalAmount,
      status: formatted.status,
      paymentStatus: formatted.paymentStatus,
      paymentMethod: formatted.paymentMethod,
      collectedAt: formatted.tokenUsedAt
    };
  }
};

// ============================================================================
// CASH REGISTERS SERVICE
// ============================================================================
const cashRegisterService = {
  async getCurrentRegister(branch, staff) {
    if (!supabase) return null;
    const branchName = branch || 'Main Canteen';

    let { data, error } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('status', 'OPEN')
      .eq('branch', branchName)
      .order('created_at', { ascending: false })
      .limit(1);

    let register = data && data.length > 0 ? data[0] : null;

    if (!register) {
      const { data: created, error: createErr } = await supabase.from('cash_registers').insert([{
        branch: branchName,
        opened_by: staff.id || staff._id,
        opened_by_name: staff.name,
        opening_balance: 5000,
        expected_closing_cash: 5000,
        status: 'OPEN',
        transactions: []
      }]).select();

      if (createErr) throw new Error(`Supabase create register error: ${createErr.message}`);
      register = created[0];
    }

    // Calculate cash sales from orders since opened
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('branch', branchName)
      .eq('payment_method', 'CASH')
      .eq('payment_status', 'PAID')
      .gte('paid_at', register.opened_at);

    const cashSales = (paidOrders || []).reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
    const opening = parseFloat(register.opening_balance || 0);
    const refunds = parseFloat(register.cash_refunds || 0);
    const expenses = parseFloat(register.cash_expenses || 0);
    const expected = opening + cashSales - refunds - expenses;

    // Update in Supabase
    await supabase
      .from('cash_registers')
      .update({ cash_sales: cashSales, expected_closing_cash: expected })
      .eq('id', register.id);

    return {
      _id: register.id,
      id: register.id,
      branch: register.branch,
      openedBy: register.opened_by,
      openedByName: register.opened_by_name,
      openedAt: register.opened_at,
      openingBalance: opening,
      cashSales,
      cashRefunds: refunds,
      cashExpenses: expenses,
      expectedClosingCash: expected,
      actualClosingCash: register.actual_closing_cash,
      variance: register.variance,
      status: register.status,
      transactions: register.transactions || []
    };
  },

  async openRegister({ branch, openingBalance, notes }, staff) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const branchName = branch || 'Main Canteen';

    // Auto-archive any previous open register
    await supabase
      .from('cash_registers')
      .update({ status: 'CLOSED', closed_at: new Date().toISOString() })
      .eq('status', 'OPEN')
      .eq('branch', branchName);

    const validOpening = parseFloat(openingBalance) >= 0 ? parseFloat(openingBalance) : 0;

    const { data, error } = await supabase.from('cash_registers').insert([{
      branch: branchName,
      opened_by: staff.id || staff._id,
      opened_by_name: staff.name,
      opening_balance: validOpening,
      expected_closing_cash: validOpening,
      cash_sales: 0,
      cash_expenses: 0,
      cash_refunds: 0,
      notes: notes || '',
      status: 'OPEN',
      transactions: []
    }]).select();

    if (error) throw new Error(`Supabase open register error: ${error.message}`);
    const reg = data[0];
    return {
      _id: reg.id,
      id: reg.id,
      branch: reg.branch,
      openingBalance: validOpening,
      status: 'OPEN'
    };
  },

  async addTransaction({ type, amount, reason, branch }, staff) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const branchName = branch || 'Main Canteen';

    const { data, error } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('status', 'OPEN')
      .eq('branch', branchName)
      .limit(1);

    if (error || !data || data.length === 0) {
      throw new Error('No active cash register found to record transaction.');
    }

    const reg = data[0];
    const numAmount = parseFloat(amount);
    let cashExpenses = parseFloat(reg.cash_expenses || 0);
    let cashRefunds = parseFloat(reg.cash_refunds || 0);

    if (type === 'EXPENSE') cashExpenses += numAmount;
    if (type === 'REFUND') cashRefunds += numAmount;

    const existingTransactions = Array.isArray(reg.transactions) ? reg.transactions : [];
    existingTransactions.push({
      type,
      amount: numAmount,
      reason: reason || '',
      performedBy: staff.id || staff._id,
      performedByName: staff.name,
      timestamp: new Date().toISOString()
    });

    const opening = parseFloat(reg.opening_balance || 0);
    const sales = parseFloat(reg.cash_sales || 0);
    const expected = opening + sales - cashRefunds - cashExpenses;

    const { data: updated, error: updateErr } = await supabase
      .from('cash_registers')
      .update({
        cash_expenses: cashExpenses,
        cash_refunds: cashRefunds,
        expected_closing_cash: expected,
        transactions: existingTransactions
      })
      .eq('id', reg.id)
      .select();

    if (updateErr) throw new Error(`Supabase update transaction error: ${updateErr.message}`);
    return updated[0];
  },

  async closeRegister({ actualClosingCash, closingBalance, notes, branch }, staff) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const branchName = branch || 'Main Canteen';

    const { data, error } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('status', 'OPEN')
      .eq('branch', branchName)
      .limit(1);

    if (error || !data || data.length === 0) {
      throw new Error('No active cash register session is currently open.');
    }

    const reg = data[0];
    const actual = parseFloat(actualClosingCash !== undefined ? actualClosingCash : closingBalance);

    // Refresh cash sales from orders
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('branch', branchName)
      .eq('payment_method', 'CASH')
      .eq('payment_status', 'PAID')
      .gte('paid_at', reg.opened_at);

    const cashSales = (paidOrders || []).reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
    const opening = parseFloat(reg.opening_balance || 0);
    const refunds = parseFloat(reg.cash_refunds || 0);
    const expenses = parseFloat(reg.cash_expenses || 0);
    const expected = opening + cashSales - refunds - expenses;
    const variance = actual - expected;

    const { data: closed, error: closeErr } = await supabase
      .from('cash_registers')
      .update({
        cash_sales: cashSales,
        expected_closing_cash: expected,
        actual_closing_cash: actual,
        variance,
        status: 'CLOSED',
        closed_at: new Date().toISOString(),
        closed_by: staff.id || staff._id,
        closed_by_name: staff.name,
        notes: notes ? `${reg.notes || ''} | Closing: ${notes}` : reg.notes
      })
      .eq('id', reg.id)
      .select();

    if (closeErr) throw new Error(`Supabase close register error: ${closeErr.message}`);
    const row = closed[0];
    return {
      _id: row.id,
      id: row.id,
      expectedClosingCash: expected,
      actualClosingCash: actual,
      variance,
      status: 'CLOSED'
    };
  },

  async getHistory() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('cash_registers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return [];
    return data.map(r => ({
      _id: r.id,
      id: r.id,
      branch: r.branch,
      openedBy: r.opened_by,
      openedByName: r.opened_by_name,
      openedAt: r.opened_at,
      closedAt: r.closed_at,
      openingBalance: r.opening_balance,
      cashSales: r.cash_sales,
      expectedClosingCash: r.expected_closing_cash,
      actualClosingCash: r.actual_closing_cash,
      variance: r.variance,
      status: r.status
    }));
  }
};

// ============================================================================
// BRANCHES SERVICE
// ============================================================================
const branchService = {
  async getBranches() {
    if (!supabase) return [];
    const { data, error } = await supabase.from('branches').select('*').eq('is_active', true);
    if (error) return [];
    return data.map(b => ({
      _id: b.id,
      id: b.id,
      name: b.name,
      code: b.code,
      location: b.location,
      operatingHours: b.operating_hours,
      isClosed: b.is_closed,
      closureMessage: b.closure_message
    }));
  },

  async getBranchById(id) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('branches').select('*').eq('id', id).limit(1);
    if (error || !data || data.length === 0) return null;
    const b = data[0];
    return {
      _id: b.id,
      id: b.id,
      name: b.name,
      code: b.code,
      location: b.location,
      operatingHours: b.operating_hours,
      isClosed: b.is_closed,
      closureMessage: b.closure_message
    };
  }
};

// ============================================================================
// ANALYTICS & SUMMARY SERVICE
// ============================================================================
const analyticsService = {
  async getSummary() {
    if (!supabase) return null;
    const { data: orders, error } = await supabase.from('orders').select('*');
    if (error || !orders) return null;

    const formattedOrders = orders.map(row => formatOrder(row));

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const paidOrders = formattedOrders.filter(o => o.paymentStatus === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const todayPaidOrders = paidOrders.filter(o => new Date(o.createdAt) >= startOfToday);
    const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const cashPaid = paidOrders.filter(o => o.paymentMethod === 'CASH');
    const onlinePaid = paidOrders.filter(o => o.paymentMethod === 'ONLINE');
    const cashSales = cashPaid.reduce((sum, o) => sum + o.totalAmount, 0);
    const onlineSales = onlinePaid.reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingRevenue = formattedOrders
      .filter(o => o.paymentStatus === 'PENDING')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const activeQueue = formattedOrders.filter(o => ['Confirmed', 'Preparing'].includes(o.status)).length;
    let crowdLevel = 'LOW';
    if (activeQueue > 25) crowdLevel = 'VERY HIGH';
    else if (activeQueue > 12) crowdLevel = 'HIGH';
    else if (activeQueue > 5) crowdLevel = 'MEDIUM';

    // Item popularity aggregation
    const itemCounts = {};
    const itemRevenue = {};
    formattedOrders.forEach(o => {
      (o.items || []).forEach(i => {
        itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
        itemRevenue[i.name] = (itemRevenue[i.name] || 0) + (i.price * i.quantity);
      });
    });

    const sortedDishes = Object.keys(itemCounts)
      .map(name => ({ name, quantity: itemCounts[name], revenue: itemRevenue[name] }))
      .sort((a, b) => b.quantity - a.quantity);

    const topFood = sortedDishes.length > 0 ? sortedDishes[0].name : 'Masala Dosa';

    return {
      paymentBreakdown: {
        cash: { total: cashSales, count: cashPaid.length },
        online: { total: onlineSales, count: onlinePaid.length }
      },
      financialEstimates: {
        totalRevenue,
        estimatedIngredientCosts: Math.round(totalRevenue * 0.45),
        estimatedGrossMargin: totalRevenue - Math.round(totalRevenue * 0.45),
        benchmarkRate: '45%'
      },
      sales: {
        totalRevenue,
        paidRevenue: totalRevenue,
        pendingRevenue
      },
      orderStatusCounts: {
        Confirmed: formattedOrders.filter(o => o.status === 'Confirmed').length,
        Preparing: formattedOrders.filter(o => o.status === 'Preparing').length,
        Ready: formattedOrders.filter(o => o.status === 'Ready').length,
        Completed: formattedOrders.filter(o => o.status === 'Completed').length,
        Cancelled: formattedOrders.filter(o => o.status === 'Cancelled').length
      },
      crowdMetrics: {
        activeQueueLength: activeQueue,
        crowdLevel,
        avgWaitMinutes: activeQueue * 4 + 5
      },
      topSellingItem: topFood,
      topDishes: sortedDishes.slice(0, 5)
    };
  }
};

module.exports = {
  isSupabaseConfigured,
  authService,
  menuService,
  orderService,
  tokenService,
  cashRegisterService,
  branchService,
  analyticsService,
  formatMenuItem,
  formatOrder
};
