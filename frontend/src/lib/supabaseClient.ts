import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let clientConfig: { url: string; anonKey: string } | null = null;

export async function getSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient;

  // Try Vite environment variables first
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    clientConfig = { url: envUrl, anonKey: envKey };
  } else {
    // Fetch safe public keys from backend endpoint
    try {
      const res = await fetch('/api/orders/config/realtime');
      if (res.ok) {
        const data = await res.json();
        if (data.supabaseUrl && data.supabaseAnonKey) {
          clientConfig = {
            url: data.supabaseUrl,
            anonKey: data.supabaseAnonKey
          };
        }
      }
    } catch (e) {
      console.warn('[Supabase Realtime] Could not fetch public config from backend:', e);
    }
  }

  if (!clientConfig?.url || !clientConfig?.anonKey) {
    // Default fallback to configured campus credentials
    clientConfig = {
      url: 'https://ldopzehaticltnpntctm.supabase.co',
      anonKey: 'sb_publishable_oLudAsJR3JIcIK9agc-mXA_jpvFbUQj'
    };
  }

  try {
    cachedClient = createClient(clientConfig.url, clientConfig.anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    return cachedClient;
  } catch (err) {
    console.error('[Supabase Realtime] Client initialization error:', err);
    return null;
  }
}

/**
 * Subscribes to live database updates for a specific order.
 * Implements dual-channel reliability: Supabase Realtime WebSocket + smart fallback polling.
 */
export function subscribeToOrderRealtime(
  orderId: string,
  callbacks: {
    onStatusChange: (payload: any) => void;
    onConnectionChange?: (status: 'CONNECTED' | 'POLLING' | 'CONNECTING' | 'ERROR') => void;
  }
): () => void {
  let isCleanedUp = false;
  let activeChannel: RealtimeChannel | null = null;
  let pollTimer: any = null;

  callbacks.onConnectionChange?.('CONNECTING');

  // 1. Initialize Realtime WebSocket channel
  getSupabaseBrowserClient().then((client) => {
    if (isCleanedUp || !client) {
      callbacks.onConnectionChange?.('POLLING');
      return;
    }

    try {
      const channel = client.channel(`order-track-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`
          },
          (payload) => {
            if (!isCleanedUp) {
              callbacks.onStatusChange(payload);
            }
          }
        )
        .subscribe((status) => {
          if (isCleanedUp) return;
          if (status === 'SUBSCRIBED') {
            callbacks.onConnectionChange?.('CONNECTED');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            callbacks.onConnectionChange?.('POLLING');
          }
        });

      activeChannel = channel;
    } catch (err) {
      console.warn('[Supabase Realtime] Channel setup failed, falling back to smart polling:', err);
      callbacks.onConnectionChange?.('POLLING');
    }
  });

  // 2. Continuous fallback polling (every 5 seconds) to guarantee zero-miss updates
  pollTimer = setInterval(() => {
    if (isCleanedUp) return;
    callbacks.onStatusChange({ source: 'poll' });
  }, 5000);

  // Return cleanup function
  return () => {
    isCleanedUp = true;
    if (pollTimer) clearInterval(pollTimer);
    if (activeChannel) {
      activeChannel.unsubscribe();
    }
  };
}
