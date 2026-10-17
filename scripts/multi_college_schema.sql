-- ============================================================================
-- SMART CAMPUS CANTEEN — MULTI-COLLEGE ARCHITECTURE MIGRATION SCHEMA
-- ============================================================================

-- 1. Extend user_role enum if not already present
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'COLLEGE_ADMIN';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Colleges Table
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create College Members Table (Linking Profiles to Colleges)
CREATE TABLE IF NOT EXISTS college_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_id, profile_id)
);

-- 4. Create College Schedules Table (Operating hours, meal windows, holidays, pause toggle)
CREATE TABLE IF NOT EXISTS college_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID UNIQUE NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  open_time TEXT DEFAULT '08:00 AM',
  close_time TEXT DEFAULT '08:00 PM',
  breakfast_window JSONB DEFAULT '{"start": "08:00 AM", "end": "11:00 AM", "enabled": true}'::jsonb,
  lunch_window JSONB DEFAULT '{"start": "12:00 PM", "end": "03:00 PM", "enabled": true}'::jsonb,
  snacks_window JSONB DEFAULT '{"start": "04:00 PM", "end": "06:30 PM", "enabled": true}'::jsonb,
  dinner_window JSONB DEFAULT '{"start": "07:30 PM", "end": "10:00 PM", "enabled": true}'::jsonb,
  online_ordering_enabled BOOLEAN DEFAULT true,
  orders_paused BOOLEAN DEFAULT false,
  pause_message TEXT DEFAULT 'Online ordering is temporarily paused for kitchen restock.',
  weekly_off_days JSONB DEFAULT '["Sunday"]'::jsonb,
  special_holidays JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add college_id columns to profiles, menu_items, and orders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'college_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN college_id UUID REFERENCES colleges(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'college_id'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN college_id UUID REFERENCES colleges(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'college_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN college_id UUID REFERENCES colleges(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Add daily_limit and discount_percentage columns to menu_items if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'daily_limit'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN daily_limit INT DEFAULT 100;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'discount_percentage'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_percentage NUMERIC(5, 2) DEFAULT 0.00;
  END IF;
END $$;

-- 7. Insert Default Main College to guarantee seamless backward-compatibility
INSERT INTO colleges (id, name, code, email, phone, address, logo_url, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Main Campus Central Canteen',
  'MCC',
  'admin@centralcanteen.edu',
  '+91 98765 43210',
  'Central Academic Block, Campus Plaza',
  '/images/college_logo.png',
  true
)
ON CONFLICT (code) DO NOTHING;

-- Seed Default Schedule for Main College
INSERT INTO college_schedules (college_id, open_time, close_time, online_ordering_enabled, orders_paused)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '08:00 AM',
  '08:00 PM',
  true,
  false
)
ON CONFLICT (college_id) DO NOTHING;

-- Link existing menu items and orders without college_id to the default college
UPDATE menu_items SET college_id = '00000000-0000-0000-0000-000000000001' WHERE college_id IS NULL;
UPDATE orders SET college_id = '00000000-0000-0000-0000-000000000001' WHERE college_id IS NULL;
UPDATE profiles SET college_id = '00000000-0000-0000-0000-000000000001' WHERE college_id IS NULL;

-- 8. Enable RLS and public policies for colleges & schedules
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view active colleges" ON colleges;
  CREATE POLICY "Public can view active colleges" ON colleges FOR SELECT USING (is_active = true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view college schedules" ON college_schedules;
  CREATE POLICY "Public can view college schedules" ON college_schedules FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Enable service role full access
DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role full access colleges" ON colleges;
  CREATE POLICY "Service role full access colleges" ON colleges TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role full access schedules" ON college_schedules;
  CREATE POLICY "Service role full access schedules" ON college_schedules TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
