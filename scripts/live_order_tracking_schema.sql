-- ============================================================================
-- SMART CAMPUS CANTEEN — LIVE ORDER TRACKING SCHEMA MIGRATION
-- Real-time order progress, timestamp history, queue metrics, and staff notes
-- ============================================================================

-- 1. Add tracking timestamp and queue columns to orders table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN accepted_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'preparing_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN preparing_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'ready_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN ready_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'estimated_prep_minutes'
  ) THEN
    ALTER TABLE orders ADD COLUMN estimated_prep_minutes INT DEFAULT 15;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE orders ADD COLUMN rejection_reason TEXT DEFAULT '';
  END IF;
END $$;

-- 2. Create order_status_history table for auditing lifecycle transitions
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy timeline lookups by order_id
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_college_created ON orders(college_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 3. Enable Supabase Realtime Publication for orders and order_status_history
-- This broadcasts postgres changes to frontend websocket subscribers
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE order_status_history;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;

-- 4. Enable Row Level Security (RLS) policies
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_status_history' AND policyname = 'Public order status history read'
  ) THEN
    CREATE POLICY "Public order status history read" ON order_status_history FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_status_history' AND policyname = 'Service role full access order status history'
  ) THEN
    CREATE POLICY "Service role full access order status history" ON order_status_history FOR ALL USING (true);
  END IF;
END $$;
