const { supabase, isSupabaseConfigured } = require('../config/supabase');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');

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
  'College Administrator': 'COLLEGE_ADMIN',
  'Platform Super Administrator': 'SUPER_ADMIN',
  'Admin': 'ADMIN'
};

const ROLE_MAP_FROM_DB = {
  'STUDENT': 'Student',
  'MASTER_STUDENT': "Master's Student",
  'CANTEEN_OPERATOR': 'Canteen Operator',
  'KITCHEN_STAFF': 'Kitchen Staff',
  'DELIVERY_STAFF': 'Delivery Staff',
  'BRANCH_MANAGER': 'Branch Manager',
  'COLLEGE_ADMIN': 'College Administrator',
  'SUPER_ADMIN': 'Platform Super Administrator',
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
    dailyLimit: row.daily_limit ?? 100,
    daily_limit: row.daily_limit ?? 100,
    discountPercentage: row.discount_percentage ? parseFloat(row.discount_percentage) : 0,
    discount_percentage: row.discount_percentage ? parseFloat(row.discount_percentage) : 0,
    popularity: row.popularity ?? 0,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    allergyInfo: Array.isArray(row.allergy_info) ? row.allergy_info : [],
    dietaryTags: Array.isArray(row.dietary_tags) ? row.dietary_tags : ['Pure Veg'],
    collegeId: row.college_id || row.branch_id || '00000000-0000-0000-0000-000000000001',
    college_id: row.college_id || row.branch_id || '00000000-0000-0000-0000-000000000001',
    branch: row.branch_id || 'Main Canteen',
    branches: row.branch_id ? [row.branch_id] : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Memory cache for tracking timestamps and notes when migration hasn't been run yet
const orderTrackingMemory = new Map();

// Convert Supabase order row to frontend expected shape
function formatOrder(row, orderItems = []) {
  if (!row) return null;
  const mem = orderTrackingMemory.get(row.id) || {};
  const items = (orderItems.length > 0 ? orderItems : (row.items_summary || [])).map(i => ({
    _id: i.id || i.menu_item_id,
    item: i.menu_item_id || i.id,
    name: i.name,
    price: parseFloat(i.price),
    quantity: parseInt(i.quantity, 10),
    image: i.image_url || i.image || '/images/food/placeholder.jpg',
    preparationTime: i.preparation_time || 10
  }));

  const orderStatus = fromDbStatus(row.status);

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
    collegeId: row.college_id || row.branch_id || '00000000-0000-0000-0000-000000000001',
    college_id: row.college_id || row.branch_id || '00000000-0000-0000-0000-000000000001',
    branch: row.branch || 'Main Canteen',
    status: orderStatus,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    tokenStatus: row.token_status || 'ACTIVE',
    tokenUsedAt: row.token_used_at,
    paidAt: row.paid_at,
    paidBy: row.paid_by,
    qrCodeData: row.qr_code_data || '',
    acceptedAt: row.accepted_at || mem.acceptedAt || (['Confirmed', 'Preparing', 'Ready', 'Completed'].includes(orderStatus) ? row.created_at : null),
    preparingAt: row.preparing_at || mem.preparingAt || (['Preparing', 'Ready', 'Completed'].includes(orderStatus) ? row.updated_at : null),
    readyAt: row.ready_at || mem.readyAt || (['Ready', 'Completed'].includes(orderStatus) ? row.updated_at : null),
    completedAt: row.completed_at || mem.completedAt || (orderStatus === 'Completed' ? (row.token_used_at || row.updated_at) : null),
    cancelledAt: row.cancelled_at || mem.cancelledAt || (orderStatus === 'Cancelled' ? row.updated_at : null),
    estimatedPrepMinutes: row.estimated_prep_minutes || mem.estimatedPrepMinutes || 15,
    rejectionReason: row.rejection_reason || mem.rejectionReason || '',
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
      phone: row.phone,
      collegeId: row.college_id,
      branch: row.branch_id
    };
  },

  async registerStudent({ name, email, password, phone, role, studentId, degreeLevel, programType, course, department, collegeId }) {
    if (!supabase) throw new Error('Database service is currently unavailable. Please verify connection.');

    const cleanEmail = email.toLowerCase().trim();
    const cleanStudentId = studentId ? studentId.toUpperCase().trim() : null;

    // Check duplicate email
    const existing = await this.findUserByLogin(cleanEmail);
    if (existing) {
      const err = new Error('An account with this college email already exists. Please sign in instead.');
      err.status = 400;
      throw err;
    }

    // Check duplicate studentId
    if (cleanStudentId) {
      const { data: idCheck } = await supabase.from('profiles').select('id').eq('student_id', cleanStudentId).limit(1);
      if (idCheck && idCheck.length > 0) {
        const err = new Error(`Student ID "${cleanStudentId}" is already registered.`);
        err.status = 400;
        throw err;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in Supabase Auth if admin API is available
    let authUserId = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: { name: name.trim(), role: role || 'Student' }
      });
      if (!authError && authData?.user?.id) {
        authUserId = authData.user.id;
      }
    } catch (e) {
      // Fallback: profile UUID will be generated by Supabase
    }

    const insertPayload = {
      name: name.trim(),
      email: cleanEmail,
      password_hash: passwordHash,
      phone: phone || '',
      role: toDbRole(role || 'Student'),
      student_id: cleanStudentId,
      degree_level: degreeLevel || 'Degree',
      program_type: programType || 'BCA',
      course: course || 'BCA',
      department: department || 'Computer Applications'
    };

    if (authUserId) {
      insertPayload.id = authUserId;
    }

    const { data, error } = await supabase.from('profiles').insert([insertPayload]).select();
    if (error) {
      if (error.code === '23505' || error.message.includes('unique constraint') || error.message.includes('profiles_email_key')) {
        const err = new Error('An account with this college email already exists.');
        err.status = 400;
        throw err;
      }
      throw new Error(`Profile creation failed: ${error.message}`);
    }

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
      department: row.department
    };
  },

  async createUser({ name, email, passwordHash, phone, role, studentId, degreeLevel, programType, course, department, collegeId }) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const dbRole = toDbRole(role);
    const insertPayload = {
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
    };

    const { data, error } = await supabase.from('profiles').insert([insertPayload]).select();

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
  },

  async getOrderTrackingDetails(orderId, requesterId) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    // 1. Calculate real live queue metrics for this order's college/branch
    let queueQuery = supabase
      .from('orders')
      .select('id, created_at, status, estimated_prep_minutes')
      .in('status', ['RECEIVED', 'CONFIRMED', 'PREPARING']);

    if (order.collegeId && order.collegeId !== '00000000-0000-0000-0000-000000000001') {
      queueQuery = queueQuery.eq('college_id', order.collegeId);
    } else if (order.branch) {
      queueQuery = queueQuery.eq('branch', order.branch);
    }

    const { data: activeOrders, error: queueErr } = await queueQuery;
    let ordersAhead = 0;
    let totalActiveInCanteen = 0;

    if (!queueErr && activeOrders) {
      totalActiveInCanteen = activeOrders.length;
      const orderCreatedTime = new Date(order.createdAt).getTime();
      ordersAhead = activeOrders.filter(o => {
        if (o.id === order.id) return false;
        return new Date(o.created_at).getTime() < orderCreatedTime;
      }).length;
    }

    // Determine dynamic canteen queue load
    let loadLevel = 'LOW';
    if (totalActiveInCanteen > 8) {
      loadLevel = 'BUSY';
    } else if (totalActiveInCanteen >= 4) {
      loadLevel = 'NORMAL';
    }

    // Dynamic wait time estimate
    const basePrepMinutes = parseInt(order.estimatedPrepMinutes || 15, 10);
    const estimatedWaitMinutes = basePrepMinutes + (ordersAhead * 3);
    const expectedReadyTime = new Date(new Date(order.createdAt).getTime() + (estimatedWaitMinutes * 60000)).toISOString();

    // 2. Fetch order status timeline history from table or fallback
    let historyRows = [];
    try {
      const { data: histData, error: histErr } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (!histErr && histData) {
        historyRows = histData;
      }
    } catch (e) {
      // Table might not exist yet before migration
    }

    const mem = orderTrackingMemory.get(orderId) || {};
    if (historyRows.length === 0 && mem.history && mem.history.length > 0) {
      historyRows = mem.history;
    }

    // 3. Build comprehensive timeline stages
    const isCancelled = ['Cancelled', 'CANCELLED'].includes(order.status);
    const isCompleted = ['Completed', 'COMPLETED'].includes(order.status);
    const isReady = isCompleted || ['Ready', 'READY'].includes(order.status);
    const isPreparing = isReady || ['Preparing', 'PREPARING'].includes(order.status);
    const isConfirmed = isPreparing || ['Confirmed', 'CONFIRMED'].includes(order.status);

    const stages = [
      {
        key: 'RECEIVED',
        label: 'Order Placed',
        description: 'Order placed & received by canteen',
        timestamp: order.createdAt,
        completed: true,
        current: order.status === 'Received'
      },
      {
        key: 'CONFIRMED',
        label: 'Order Accepted',
        description: 'Canteen accepted the order and queued for kitchen',
        timestamp: order.acceptedAt || (isConfirmed ? order.createdAt : null),
        completed: !isCancelled && isConfirmed,
        current: !isCancelled && order.status === 'Confirmed'
      },
      {
        key: 'PREPARING',
        label: 'Preparing Your Food',
        description: 'Chef is preparing your meal in the kitchen',
        timestamp: order.preparingAt || (isPreparing ? order.updatedAt : null),
        completed: !isCancelled && isPreparing,
        current: !isCancelled && order.status === 'Preparing'
      },
      {
        key: 'READY',
        label: 'Ready for Pickup',
        description: 'Food is freshly prepared and ready at pickup counter',
        timestamp: order.readyAt || (isReady ? order.updatedAt : null),
        completed: !isCancelled && isReady,
        current: !isCancelled && order.status === 'Ready'
      },
      {
        key: 'COMPLETED',
        label: 'Picked Up / Completed',
        description: 'Token verified & order handed over. Enjoy!',
        timestamp: order.completedAt || order.tokenUsedAt || (isCompleted ? order.updatedAt : null),
        completed: isCompleted,
        current: isCompleted
      }
    ];

    return {
      order,
      queue: {
        ordersAhead,
        totalActiveInCanteen,
        loadLevel,
        estimatedWaitMinutes,
        expectedReadyTime,
        isApproximate: true
      },
      timeline: {
        currentStatus: order.status,
        isCancelled,
        cancelledAt: order.cancelledAt,
        rejectionReason: order.rejectionReason || '',
        stages
      },
      history: historyRows
    };
  },

  async updateOrderStatusWithTracking(orderId, newStatus, { changedBy, prepMinutes, note, reason } = {}) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const existing = await this.getOrderById(orderId);
    if (!existing) throw new Error('Order not found.');

    const now = new Date().toISOString();
    const dbStatus = toDbStatus(newStatus);
    const updatePayload = {
      status: dbStatus,
      updated_at: now
    };

    const trackingUpdates = {};
    if (prepMinutes) {
      trackingUpdates.estimated_prep_minutes = parseInt(prepMinutes, 10);
    }

    if (dbStatus === 'CONFIRMED' || newStatus === 'Confirmed') {
      trackingUpdates.accepted_at = now;
    } else if (dbStatus === 'PREPARING' || newStatus === 'Preparing') {
      trackingUpdates.preparing_at = now;
    } else if (dbStatus === 'READY' || newStatus === 'Ready') {
      trackingUpdates.ready_at = now;
    } else if (dbStatus === 'COMPLETED' || newStatus === 'Completed') {
      trackingUpdates.completed_at = now;
      updatePayload.token_status = 'USED';
      updatePayload.token_used_at = now;
    } else if (dbStatus === 'CANCELLED' || newStatus === 'Cancelled' || newStatus === 'Rejected') {
      trackingUpdates.cancelled_at = now;
      trackingUpdates.rejection_reason = reason || note || 'Cancelled by staff';
    }

    // Update in-memory tracking cache as immediate resilient store
    const mem = orderTrackingMemory.get(orderId) || { history: [] };
    if (trackingUpdates.accepted_at) mem.acceptedAt = trackingUpdates.accepted_at;
    if (trackingUpdates.preparing_at) mem.preparingAt = trackingUpdates.preparing_at;
    if (trackingUpdates.ready_at) mem.readyAt = trackingUpdates.ready_at;
    if (trackingUpdates.completed_at) mem.completedAt = trackingUpdates.completed_at;
    if (trackingUpdates.cancelled_at) mem.cancelledAt = trackingUpdates.cancelled_at;
    if (trackingUpdates.estimated_prep_minutes) mem.estimatedPrepMinutes = trackingUpdates.estimated_prep_minutes;
    if (trackingUpdates.rejection_reason) mem.rejectionReason = trackingUpdates.rejection_reason;

    const historyRecord = {
      order_id: orderId,
      old_status: existing.status,
      new_status: newStatus,
      changed_by: changedBy,
      note: note || reason || '',
      created_at: now
    };
    if (!mem.history) mem.history = [];
    mem.history.push(historyRecord);
    orderTrackingMemory.set(orderId, mem);

    // Try updating orders table with tracking columns
    let updatedRow = null;
    try {
      const fullPayload = { ...updatePayload, ...trackingUpdates };
      const { data, error } = await supabase
        .from('orders')
        .update(fullPayload)
        .eq('id', orderId)
        .select();

      if (!error && data && data.length > 0) {
        updatedRow = data[0];
      }
    } catch (colErr) {
      console.warn('[Tracking Column Update Warning]', colErr.message);
    }

    // Fallback update without new schema columns if schema cache lacks them
    if (!updatedRow) {
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId)
        .select();

      if (fallbackErr) throw new Error(`Supabase update error: ${fallbackErr.message}`);
      updatedRow = fallbackData[0];
    }

    // Handle token used update if completed
    if (newStatus === 'Completed' || dbStatus === 'COMPLETED') {
      try {
        await supabase
          .from('digital_tokens')
          .update({ status: 'USED', verified_at: now, verified_by: changedBy })
          .eq('order_id', orderId);
      } catch (tokErr) {
        console.warn('[Token Update Warning]', tokErr.message);
      }
    }

    // Record in order_status_history table if available
    try {
      await supabase.from('order_status_history').insert([historyRecord]);
    } catch (histInsertErr) {
      // Table might not exist yet
    }

    return formatOrder(updatedRow);
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

// ============================================================================
// MULTI-COLLEGE SERVICE (ISOLATION, SCHEDULES, MENUS, ORDERS, ANALYTICS)
// ============================================================================
const collegeService = {
  async getColleges() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*, college_schedules(*)')
        .order('name');
      if (!error && data && data.length > 0) {
        return data.map(col => ({
          id: col.id,
          name: col.name,
          code: col.code,
          email: col.email,
          phone: col.phone || '',
          address: col.address || '',
          logoUrl: col.logo_url || '/images/college_logo.png',
          isActive: col.is_active ?? true,
          schedule: col.college_schedules?.[0] ? {
            openTime: col.college_schedules[0].open_time,
            closeTime: col.college_schedules[0].close_time,
            breakfastWindow: col.college_schedules[0].breakfast_window,
            lunchWindow: col.college_schedules[0].lunch_window,
            snacksWindow: col.college_schedules[0].snacks_window,
            dinnerWindow: col.college_schedules[0].dinner_window,
            onlineOrderingEnabled: col.college_schedules[0].online_ordering_enabled,
            ordersPaused: col.college_schedules[0].orders_paused,
            pauseMessage: col.college_schedules[0].pause_message,
            weeklyOffDays: col.college_schedules[0].weekly_off_days,
            specialHolidays: col.college_schedules[0].special_holidays
          } : null
        }));
      }
    } catch (e) {
      // Fallback: branch table
    }

    // Fallback: query branches table as colleges
    const { data: branchData } = await supabase.from('branches').select('*');
    if (!branchData || branchData.length === 0) {
      return [{
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Main Campus Central Canteen',
        code: 'MCC',
        email: 'admin@centralcanteen.edu',
        phone: '+91 98765 43210',
        address: 'Central Academic Block, Campus Plaza',
        logoUrl: '/images/college_logo.png',
        isActive: true,
        schedule: {
          openTime: '08:00 AM',
          closeTime: '08:00 PM',
          onlineOrderingEnabled: true,
          ordersPaused: false,
          pauseMessage: ''
        }
      }];
    }

    return branchData.map(b => ({
      id: b.id,
      name: b.name,
      code: b.code || 'MCC',
      email: `admin@${(b.code || 'campus').toLowerCase()}.edu`,
      phone: '+91 98765 43210',
      address: b.location || 'Campus Canteen Block',
      logoUrl: '/images/college_logo.png',
      isActive: b.is_active ?? true,
      schedule: {
        openTime: b.operating_hours?.open || '08:00 AM',
        closeTime: b.operating_hours?.close || '08:00 PM',
        onlineOrderingEnabled: true,
        ordersPaused: b.is_closed ?? false,
        pauseMessage: b.closure_message || ''
      }
    }));
  },

  async getCollegeById(id) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*, college_schedules(*)')
        .eq('id', id)
        .limit(1);
      if (!error && data && data.length > 0) {
        const col = data[0];
        return {
          id: col.id,
          name: col.name,
          code: col.code,
          email: col.email,
          phone: col.phone || '',
          address: col.address || '',
          logoUrl: col.logo_url || '/images/college_logo.png',
          isActive: col.is_active ?? true,
          schedule: col.college_schedules?.[0] ? {
            openTime: col.college_schedules[0].open_time,
            closeTime: col.college_schedules[0].close_time,
            breakfastWindow: col.college_schedules[0].breakfast_window,
            lunchWindow: col.college_schedules[0].lunch_window,
            snacksWindow: col.college_schedules[0].snacks_window,
            dinnerWindow: col.college_schedules[0].dinner_window,
            onlineOrderingEnabled: col.college_schedules[0].online_ordering_enabled,
            ordersPaused: col.college_schedules[0].orders_paused,
            pauseMessage: col.college_schedules[0].pause_message,
            weeklyOffDays: col.college_schedules[0].weekly_off_days,
            specialHolidays: col.college_schedules[0].special_holidays
          } : null
        };
      }
    } catch (e) {}

    // Fallback: check branches table
    const { data: bData } = await supabase.from('branches').select('*').eq('id', id).limit(1);
    if (bData && bData.length > 0) {
      const b = bData[0];
      return {
        id: b.id,
        name: b.name,
        code: b.code || 'MCC',
        email: `admin@${(b.code || 'campus').toLowerCase()}.edu`,
        phone: '+91 98765 43210',
        address: b.location || '',
        logoUrl: '/images/college_logo.png',
        isActive: b.is_active ?? true,
        schedule: {
          openTime: b.operating_hours?.open || '08:00 AM',
          closeTime: b.operating_hours?.close || '08:00 PM',
          onlineOrderingEnabled: true,
          ordersPaused: b.is_closed ?? false,
          pauseMessage: b.closure_message || ''
        }
      };
    }

    return null;
  },

  async registerCollege({ name, code, email, phone, address, logoUrl, adminName, adminPassword }) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const cleanCode = code.toUpperCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    // Check if code or email exists
    try {
      const { data: existing } = await supabase
        .from('colleges')
        .select('id')
        .or(`code.eq.${cleanCode},email.eq.${cleanEmail}`)
        .limit(1);
      if (existing && existing.length > 0) {
        const err = new Error('A college with this code or email already exists.');
        err.status = 400;
        throw err;
      }
    } catch (e) {
      if (e.status === 400) throw e;
    }

    let collegeId = null;
    try {
      const { data: newCol, error: colErr } = await supabase.from('colleges').insert([{
        name: name.trim(),
        code: cleanCode,
        email: cleanEmail,
        phone: phone || '',
        address: address || '',
        logo_url: logoUrl || '/images/college_logo.png',
        is_active: true
      }]).select();

      if (!colErr && newCol && newCol.length > 0) {
        collegeId = newCol[0].id;
        // Create default schedule
        await supabase.from('college_schedules').insert([{
          college_id: collegeId,
          open_time: '08:00 AM',
          close_time: '08:00 PM',
          online_ordering_enabled: true,
          orders_paused: false
        }]);
      }
    } catch (e) {}

    // Fallback if colleges table not yet created
    if (!collegeId) {
      const { data: newBranch, error: bErr } = await supabase.from('branches').insert([{
        name: name.trim(),
        code: cleanCode,
        location: address || '',
        operating_hours: { open: '08:00 AM', close: '08:00 PM' },
        is_active: true
      }]).select();
      if (bErr) throw new Error(`Failed to create college: ${bErr.message}`);
      collegeId = newBranch[0].id;
    }

    // Register College Administrator
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword || 'Admin@123', salt);

    let authUserId = null;
    try {
      const { data: authData } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: adminPassword || 'Admin@123',
        email_confirm: true,
        user_metadata: { name: adminName.trim(), role: 'College Administrator' }
      });
      if (authData?.user?.id) authUserId = authData.user.id;
    } catch (e) {}

    const adminProfilePayload = {
      name: adminName.trim(),
      email: cleanEmail,
      password_hash: passwordHash,
      phone: phone || '',
      role: 'COLLEGE_ADMIN',
      branch_id: collegeId
    };
    if (authUserId) adminProfilePayload.id = authUserId;

    let adminProfile = null;
    try {
      // First try inserting with college_id
      const { data: pData, error: pErr } = await supabase
        .from('profiles')
        .insert([{ ...adminProfilePayload, college_id: collegeId }])
        .select();
      if (!pErr && pData) adminProfile = pData[0];
    } catch (e) {}

    if (!adminProfile) {
      // Fallback without college_id column
      const { data: pData2, error: pErr2 } = await supabase
        .from('profiles')
        .insert([{ ...adminProfilePayload, role: 'ADMIN' }])
        .select();
      if (pErr2 && !pErr2.message.includes('unique')) {
        console.warn('Admin profile creation notice:', pErr2.message);
      }
      if (pData2) adminProfile = pData2[0];
    }

    // Try linking to college_members
    if (adminProfile) {
      try {
        await supabase.from('college_members').insert([{
          college_id: collegeId,
          profile_id: adminProfile.id,
          role: 'COLLEGE_ADMIN'
        }]);
      } catch (e) {}
    }

    return {
      id: collegeId,
      name,
      code: cleanCode,
      email: cleanEmail,
      adminEmail: cleanEmail,
      message: 'College and College Administrator registered successfully.'
    };
  },

  async updateSchedule(collegeId, scheduleData) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const {
      openTime,
      closeTime,
      breakfastWindow,
      lunchWindow,
      snacksWindow,
      dinnerWindow,
      onlineOrderingEnabled,
      ordersPaused,
      pauseMessage,
      weeklyOffDays,
      specialHolidays
    } = scheduleData;

    try {
      const schedulePayload = {
        college_id: collegeId,
        open_time: openTime || '08:00 AM',
        close_time: closeTime || '08:00 PM',
        breakfast_window: breakfastWindow || { start: '08:00 AM', end: '11:00 AM', enabled: true },
        lunch_window: lunchWindow || { start: '12:00 PM', end: '03:00 PM', enabled: true },
        snacks_window: snacksWindow || { start: '04:00 PM', end: '06:30 PM', enabled: true },
        dinner_window: dinnerWindow || { start: '07:30 PM', end: '10:00 PM', enabled: true },
        online_ordering_enabled: onlineOrderingEnabled ?? true,
        orders_paused: ordersPaused ?? false,
        pause_message: pauseMessage || '',
        weekly_off_days: weeklyOffDays || ['Sunday'],
        special_holidays: specialHolidays || [],
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('college_schedules')
        .upsert(schedulePayload, { onConflict: 'college_id' })
        .select();
      if (!error && data && data.length > 0) return data[0];
    } catch (e) {}

    // Also sync to branches if present
    try {
      await supabase
        .from('branches')
        .update({
          is_closed: ordersPaused ?? false,
          closure_message: pauseMessage || '',
          operating_hours: { open: openTime || '08:00 AM', close: closeTime || '08:00 PM' }
        })
        .eq('id', collegeId);
    } catch (e) {}

    return { success: true, message: 'Schedule updated successfully.' };
  },

  async getCollegeMenu(collegeId, category) {
    if (!supabase) return [];
    let query = supabase.from('menu_items').select('*');
    if (collegeId && collegeId !== 'all') {
      try {
        query = query.or(`college_id.eq.${collegeId},branch_id.eq.${collegeId}`);
      } catch (e) {
        query = query.eq('branch_id', collegeId);
      }
    }
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    query = query.order('name');
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      // Fallback: fetch all menu items if filter column had issues
      const { data: allData } = await supabase.from('menu_items').select('*');
      return (allData || []).map(formatMenuItem);
    }
    return (data || []).map(formatMenuItem);
  },

  async createCollegeMenuItem(collegeId, itemData) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const payload = {
      name: itemData.name.trim(),
      description: itemData.description || '',
      price: parseFloat(itemData.price),
      category: itemData.category || 'Meals',
      image_url: itemData.image || itemData.imageUrl || '/images/food/placeholder.jpg',
      is_vegetarian: true, // STRICTLY 100% PURE VEGETARIAN
      is_available: itemData.isAvailable ?? true,
      stock_quantity: parseInt(itemData.stockQuantity || 50, 10),
      preparation_time: parseInt(itemData.preparationTime || 10, 10),
      is_today_special: Boolean(itemData.isTodaySpecial),
      daily_limit: parseInt(itemData.dailyLimit || 100, 10),
      discount_percentage: parseFloat(itemData.discountPercentage || 0),
      branch_id: collegeId,
      college_id: collegeId
    };

    let result = null;
    try {
      const { data, error } = await supabase.from('menu_items').insert([payload]).select();
      if (!error && data) result = data[0];
    } catch (e) {}

    if (!result) {
      // Fallback without college_id, daily_limit, discount_percentage if columns not yet added
      const cleanPayload = {
        name: payload.name,
        description: payload.description,
        price: payload.price,
        category: payload.category,
        image_url: payload.image_url,
        is_vegetarian: true,
        is_available: payload.is_available,
        stock_quantity: payload.stock_quantity,
        preparation_time: payload.preparation_time,
        is_today_special: payload.is_today_special,
        branch_id: collegeId
      };
      const { data: d2, error: err2 } = await supabase.from('menu_items').insert([cleanPayload]).select();
      if (err2) throw new Error(`Failed to create food item: ${err2.message}`);
      result = d2[0];
    }

    return formatMenuItem(result);
  },

  async updateCollegeMenuItem(itemId, updates) {
    return await menuService.updateMenuItem(itemId, updates);
  },

  async deleteCollegeMenuItem(itemId) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (error) throw new Error(`Failed to delete food item: ${error.message}`);
    return { success: true, message: 'Item deleted successfully.' };
  },

  async getCollegeOrders(collegeId, statusFilter) {
    if (!supabase) return [];
    let data = null;

    if (collegeId && collegeId !== 'all') {
      try {
        let q1 = supabase.from('orders').select('*').or(`college_id.eq.${collegeId},branch.eq.${collegeId}`).order('created_at', { ascending: false });
        if (statusFilter && statusFilter !== 'All') {
          q1 = q1.eq('status', toDbStatus(statusFilter));
        }
        const res1 = await q1.limit(100);
        if (!res1.error && res1.data) {
          data = res1.data;
        }
      } catch (e) {}
    }

    if (!data) {
      // Fallback: fetch orders without college_id filter for complete backward-compatibility
      let q2 = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'All') {
        q2 = q2.eq('status', toDbStatus(statusFilter));
      }
      const res2 = await q2.limit(100);
      if (!res2.error && res2.data) {
        data = res2.data;
      }
    }

    return (data || []).map(row => formatOrder(row));
  },

  async updateCollegeOrderStatus(orderId, status) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const dbStatus = toDbStatus(status);
    const updates = {
      status: dbStatus,
      updated_at: new Date().toISOString()
    };
    if (status === 'Completed' || status === 'Delivered') {
      updates.token_status = 'REDEEMED';
      updates.token_used_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from('orders').update(updates).eq('id', orderId).select();
    if (error) throw new Error(`Order update error: ${error.message}`);
    return formatOrder(data[0]);
  },

  async getCollegeAnalytics(collegeId) {
    const orders = await this.getCollegeOrders(collegeId);
    let totalRevenue = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let preparingCount = 0;
    let cancelledCount = 0;
    const itemMap = {};

    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        totalRevenue += o.totalAmount || 0;
      }
      if (o.status === 'Completed' || o.status === 'Delivered') completedCount++;
      else if (o.status === 'Preparing') preparingCount++;
      else if (o.status === 'Cancelled') cancelledCount++;
      else pendingCount++;

      (o.items || []).forEach(item => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, count: 0, revenue: 0 };
        }
        itemMap[item.name].count += item.quantity || 1;
        itemMap[item.name].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    const topDishes = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      completedOrders: completedCount,
      pendingOrders: pendingCount,
      preparingOrders: preparingCount,
      cancelledOrders: cancelledCount,
      topDishes,
      estimatedMargin: Math.round(totalRevenue * 0.55),
      activeQueueLength: pendingCount + preparingCount
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
  collegeService,
  formatMenuItem,
  formatOrder
};
