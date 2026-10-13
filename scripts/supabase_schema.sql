-- ============================================================================
-- SMART CAMPUS CANTEEN — SUPABASE POSTGRESQL SCHEMA
-- 100% PURE VEGETARIAN COLLEGE FOOD ORDERING SYSTEM
-- ============================================================================

-- 1. Create Enums if they do not exist
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'STUDENT',
    'MASTER_STUDENT',
    'CANTEEN_OPERATOR',
    'KITCHEN_STAFF',
    'DELIVERY_STAFF',
    'BRANCH_MANAGER',
    'ADMIN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'RECEIVED',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'CASH',
    'ONLINE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Branches Table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  location TEXT,
  operating_hours JSONB DEFAULT '{"open": "08:00 AM", "close": "08:00 PM"}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_closed BOOLEAN DEFAULT false,
  closure_message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profiles / Users Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role user_role DEFAULT 'STUDENT',
  student_id TEXT UNIQUE,
  degree_level TEXT DEFAULT 'Degree',
  program_type TEXT DEFAULT 'BCA',
  course TEXT DEFAULT 'BCA',
  department TEXT DEFAULT 'Computer Applications',
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'Utensils',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Menu Items (STRICTLY 100% PURE VEGETARIAN)
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL DEFAULT '/images/food/placeholder.jpg',
  is_vegetarian BOOLEAN NOT NULL DEFAULT true CHECK (is_vegetarian = true),
  is_available BOOLEAN DEFAULT true,
  stock_quantity INT DEFAULT 50 CHECK (stock_quantity >= 0),
  preparation_time INT DEFAULT 10 CHECK (preparation_time >= 1),
  is_today_special BOOLEAN DEFAULT false,
  popularity INT DEFAULT 0,
  ingredients JSONB DEFAULT '[]'::jsonb,
  allergy_info JSONB DEFAULT '[]'::jsonb,
  dietary_tags JSONB DEFAULT '["Pure Veg"]'::jsonb,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Pickup Windows
CREATE TABLE IF NOT EXISTS pickup_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  max_capacity INT DEFAULT 30,
  current_load INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Delivery Locations
CREATE TABLE IF NOT EXISTS delivery_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  building_name TEXT NOT NULL,
  floor TEXT,
  room_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  token_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_id TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  order_type TEXT DEFAULT 'Pickup',
  pickup_window TEXT,
  delivery_location TEXT,
  room_number TEXT,
  branch TEXT DEFAULT 'Main Canteen',
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  status order_status DEFAULT 'CONFIRMED',
  payment_method payment_method DEFAULT 'CASH',
  payment_status payment_status DEFAULT 'PENDING',
  token_status TEXT DEFAULT 'ACTIVE',
  token_used_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  qr_code_data TEXT DEFAULT '',
  items_summary JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  image_url TEXT,
  preparation_time INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'PENDING',
  transaction_reference TEXT,
  collected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Digital Tokens Table
CREATE TABLE IF NOT EXISTS digital_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  token_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, USED, EXPIRED, CANCELLED
  qr_payload TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Cash Registers Table
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT DEFAULT 'Main Canteen',
  opened_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opened_by_name TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  closed_by_name TEXT,
  opening_balance NUMERIC(10, 2) DEFAULT 0,
  cash_sales NUMERIC(10, 2) DEFAULT 0,
  cash_refunds NUMERIC(10, 2) DEFAULT 0,
  cash_expenses NUMERIC(10, 2) DEFAULT 0,
  expected_closing_cash NUMERIC(10, 2) DEFAULT 0,
  actual_closing_cash NUMERIC(10, 2),
  variance NUMERIC(10, 2) DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'OPEN', -- OPEN, CLOSED
  transactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  current_stock NUMERIC(10, 2) DEFAULT 0,
  min_stock NUMERIC(10, 2) DEFAULT 10,
  max_stock NUMERIC(10, 2) DEFAULT 100,
  unit TEXT DEFAULT 'kg',
  expiry_date DATE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- ADD, CONSUME, WASTE, ADJUST
  quantity NUMERIC(10, 2) NOT NULL,
  reason TEXT,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Food Waste Records
CREATE TABLE IF NOT EXISTS food_waste_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit TEXT DEFAULT 'portions',
  reason TEXT NOT NULL,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  branch TEXT DEFAULT 'Main Canteen',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_entity TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(token_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_tokens_number ON digital_tokens(token_number);
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status, branch);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

-- Public can read menu items and categories
DO $$ BEGIN
  CREATE POLICY "Public read menu items" ON menu_items FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read categories" ON menu_categories FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read branches" ON branches FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Service Role Key retains full privileged access for all backend server routes
