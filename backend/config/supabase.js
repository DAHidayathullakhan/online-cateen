const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '';
// Support standard naming as well as publishable / secret key naming
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim();

// Prefer the secret/service role key for trusted backend operations, falling back to publishable/anon key
const activeKey = supabaseServiceRoleKey || supabaseAnonKey;

function isSupabaseConfigured() {
  if (!supabaseUrl || !activeKey) return false;
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) return false;
  if (supabaseUrl.includes('your-project-id')) return false;
  return true;
}

let supabase = null;

if (isSupabaseConfigured()) {
  try {
    supabase = createClient(supabaseUrl, activeKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log(`[Supabase] Initialized client for ${new URL(supabaseUrl).hostname}`);
    if (supabaseServiceRoleKey) {
      console.log(`[Supabase] Using Secret/Service Role Key for trusted server operations`);
    } else {
      console.log(`[Supabase] Using Publishable/Anon Key`);
    }
  } catch (err) {
    console.error('[Supabase] Client initialization failed:', err.message);
  }
} else {
  console.warn('========================================================================');
  console.warn('[Supabase Warning] Supabase credentials not configured or incomplete in .env.');
  console.warn('Please add the following to your .env file:');
  console.warn('SUPABASE_URL=https://<your-project-ref>.supabase.co');
  console.warn('SUPABASE_ANON_KEY=<your-anon-public-key>');
  console.warn('SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>');
  console.warn('========================================================================');
}

/**
 * Health check helper to verify Supabase database connectivity
 */
async function checkSupabaseConnection() {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      configured: false,
      message: 'Supabase credentials missing or incomplete in environment'
    };
  }

  try {
    // Attempt a lightweight probe against the branches or menu_items table
    const { data, error } = await supabase.from('branches').select('id').limit(1);
    if (error) {
      // Try probing menu_items if branches isn't yet queried
      const { data: menuData, error: menuError } = await supabase.from('menu_items').select('id').limit(1);
      if (menuError) {
        return {
          connected: false,
          configured: true,
          message: error.message || menuError.message
        };
      }
      return {
        connected: true,
        configured: true,
        message: 'Supabase PostgreSQL connection active'
      };
    }
    return {
      connected: true,
      configured: true,
      message: 'Supabase PostgreSQL connection active'
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      message: err.message
    };
  }
}

module.exports = {
  supabase,
  isSupabaseConfigured,
  checkSupabaseConnection,
  supabaseUrl
};
