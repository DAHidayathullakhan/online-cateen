import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  ShoppingBag,
  Bell,
  RefreshCw,
  ArrowLeft,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Volume2,
  VolumeX,
  CreditCard,
  Building2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { OrderTrackingData, TrackingStage } from '../types';
import { subscribeToOrderRealtime } from '../lib/supabaseClient';

interface LiveOrderTrackingProps {
  orderId: string;
  onBackToMenu: () => void;
  onViewOrders: () => void;
  token?: string;
}

export const LiveOrderTracking: React.FC<LiveOrderTrackingProps> = ({
  orderId,
  onBackToMenu,
  onViewOrders,
  token
}) => {
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'POLLING' | 'CONNECTING' | 'ERROR'>('CONNECTING');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastNotifiedStatus, setLastNotifiedStatus] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const prevStatusRef = useRef<string>('');

  // Audio chime helper using Web Audio API (cross-browser, no external audio file dependency)
  const playChime = (type: 'ready' | 'update' | 'alert' = 'update') => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'ready') {
        // High pleasant two-tone chime for "Ready for Pickup"
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880.00, now + 0.15); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880.00, now);
        osc2.frequency.setValueAtTime(1174.66, now + 0.15); // D6

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
      } else {
        // Subtle soft blip for state advancement
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn('Could not play audio cue:', e);
    }
  };

  const fetchTracking = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const headers: Record<string, string> = {};
      const authToken = token || localStorage.getItem('token');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/orders/${orderId}/track`, { headers });
      const data = await res.json();

      if (data.success && data.data) {
        const newData: OrderTrackingData = data.data;
        const currentStatus = newData.timeline.currentStatus;

        // Check if status changed
        if (prevStatusRef.current && prevStatusRef.current !== currentStatus) {
          if (currentStatus === 'Ready' || currentStatus === 'READY') {
            playChime('ready');
            showToast('🎉 Your food is READY for pickup! Proceed to the counter.');
            sendBrowserNotification('Order Ready for Pickup!', `Your order #${newData.order.orderNumber} is ready at the counter.`);
          } else if (currentStatus === 'Preparing') {
            playChime('update');
            showToast('👨‍🍳 The kitchen has started preparing your fresh food!');
          } else if (currentStatus === 'Completed') {
            playChime('update');
            showToast('✅ Order collected. Thank you and enjoy your meal!');
          }
        }

        prevStatusRef.current = currentStatus;
        setTrackingData(newData);
        setError(null);
      } else {
        setError(data.message || 'Unable to load live tracking details.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching tracking status.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico'
        });
      } catch (e) {
        // Ignored
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Initial fetch and subscription setup
  useEffect(() => {
    fetchTracking(false);
    requestNotificationPermission();

    const unsubscribe = subscribeToOrderRealtime(orderId, {
      onStatusChange: (payload) => {
        // Re-fetch tracking data to get updated queue metrics and timestamps
        fetchTracking(true);
      },
      onConnectionChange: (status) => {
        setConnectionStatus(status);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orderId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  if (loading && !trackingData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <ChefHat className="w-8 h-8 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Connecting to Live Kitchen Stream...</h3>
        <p className="text-gray-500 text-sm mt-1">Retrieving real-time order position & queue metrics</p>
      </div>
    );
  }

  if (error && !trackingData) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-2xl shadow-sm border border-red-100 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Tracking Unavailable</h2>
        <p className="text-gray-600 mb-6 text-sm">{error}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => fetchTracking(false)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={onViewOrders}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  const { order, queue, timeline } = trackingData!;
  const currentStatus = timeline.currentStatus;
  const isCancelled = timeline.isCancelled;
  const isReady = ['Ready', 'READY'].includes(currentStatus);
  const isPreparing = ['Preparing', 'PREPARING'].includes(currentStatus);
  const isCompleted = ['Completed', 'COMPLETED'].includes(currentStatus);

  // Status-specific banner configuration
  const getBannerInfo = () => {
    if (isCancelled) {
      return {
        bg: 'bg-red-50 border-red-200 text-red-800',
        badgeBg: 'bg-red-100 text-red-700',
        title: 'Order Cancelled / Rejected',
        desc: timeline.rejectionReason || 'This order was cancelled by the canteen desk.',
        icon: XCircle,
        pulse: false
      };
    }
    if (isCompleted) {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        badgeBg: 'bg-emerald-100 text-emerald-800',
        title: 'Order Completed & Handed Over',
        desc: 'Your token was redeemed at the canteen counter. Enjoy your meal!',
        icon: CheckCircle2,
        pulse: false
      };
    }
    if (isReady) {
      return {
        bg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/20',
        badgeBg: 'bg-white/20 text-white backdrop-blur-sm',
        title: '🎉 YOUR FOOD IS READY FOR PICKUP!',
        desc: 'Please proceed to Counter 1 with your digital token to collect your food.',
        icon: Bell,
        pulse: true
      };
    }
    if (isPreparing) {
      return {
        bg: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900',
        badgeBg: 'bg-amber-100 text-amber-800',
        title: 'Freshly Preparing Your Food',
        desc: 'The kitchen is currently cooking your hot vegetarian dishes.',
        icon: ChefHat,
        pulse: true
      };
    }
    return {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      badgeBg: 'bg-blue-100 text-blue-800',
      title: 'Order Confirmed by Canteen',
      desc: 'Your order is verified and assigned to the kitchen queue.',
      icon: Clock,
      pulse: false
    };
  };

  const banner = getBannerInfo();
  const BannerIcon = banner.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-emerald-500/30">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Live Connection Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={onViewOrders}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </button>

        <div className="flex items-center gap-3">
          {/* Audio toggle button */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Sound alert enabled' : 'Sound alert muted'}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              audioEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{audioEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Connection status indicator */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : connectionStatus === 'POLLING'
                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-500 animate-ping'
                  : connectionStatus === 'POLLING'
                  ? 'bg-amber-500'
                  : 'bg-gray-400'
              }`}
            />
            <span>
              {connectionStatus === 'CONNECTED'
                ? 'Live Realtime Active'
                : connectionStatus === 'POLLING'
                ? 'Auto-Syncing'
                : 'Connecting...'}
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchTracking(false)}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-50"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Status Hero Banner */}
      <div className={`p-6 rounded-3xl border transition-all ${banner.bg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl shrink-0 ${
                isReady
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'bg-white/80 text-gray-800 shadow-sm'
              } ${banner.pulse ? 'animate-pulse' : ''}`}
            >
              <BannerIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${banner.badgeBg}`}>
                  {currentStatus}
                </span>
                <span className="text-xs opacity-75">#{order.orderNumber}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{banner.title}</h1>
              <p className="text-sm opacity-90 mt-1 max-w-xl">{banner.desc}</p>
            </div>
          </div>

          {/* Token Box */}
          <div className="bg-white/95 text-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 shrink-0 text-center md:min-w-[180px]">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Digital Token</span>
            <div className="text-2xl font-black text-emerald-600 tracking-wider my-0.5">
              {order.tokenNumber}
            </div>
            <button
              onClick={() => copyToClipboard(order.tokenNumber)}
              className="text-xs text-gray-500 hover:text-emerald-700 flex items-center justify-center gap-1 mx-auto mt-1 transition-colors"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Queue & Preparation Estimate Card (Hidden if cancelled or completed) */}
      {!isCancelled && !isCompleted && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Orders Ahead */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
              {queue.ordersAhead}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Orders Ahead In Queue</p>
              <h4 className="text-lg font-bold text-gray-900">
                {queue.ordersAhead === 0 ? 'You are Next!' : `${queue.ordersAhead} orders ahead`}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {queue.totalActiveInCanteen} active tickets in kitchen
              </p>
            </div>
          </div>

          {/* Wait Time Countdown */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
              <Clock className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Preparation Time</p>
              <h4 className="text-lg font-bold text-gray-900">
                ~{queue.estimatedWaitMinutes} mins
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Expected ready:{' '}
                <span className="font-semibold text-gray-700">
                  {new Date(queue.expectedReadyTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            </div>
          </div>

          {/* Dynamic Kitchen Load */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                queue.loadLevel === 'LOW'
                  ? 'bg-emerald-50 text-emerald-600'
                  : queue.loadLevel === 'NORMAL'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-orange-50 text-orange-600'
              }`}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Kitchen Queue Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    queue.loadLevel === 'LOW'
                      ? 'bg-emerald-100 text-emerald-800'
                      : queue.loadLevel === 'NORMAL'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {queue.loadLevel === 'LOW'
                    ? 'Low Queue'
                    : queue.loadLevel === 'NORMAL'
                    ? 'Normal Load'
                    : 'High Demand'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Calculated from live orders</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Visual Progress Timeline */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Live Order Progress</h3>
            <p className="text-xs text-gray-500 mt-0.5">Updates automatically in real time without refreshing</p>
          </div>
          <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Vertical/Horizontal Timeline */}
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
          {timeline.stages.map((stage: TrackingStage, idx: number) => {
            const isStageActive = stage.current;
            const isStageDone = stage.completed;

            return (
              <div key={stage.key} className="relative flex items-start gap-4 group">
                {/* Stage Bullet Node */}
                <div
                  className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isStageDone
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-4 ring-emerald-50'
                      : isStageActive
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-4 ring-amber-50 animate-pulse'
                      : 'bg-gray-100 text-gray-400 border border-gray-300'
                  }`}
                >
                  {isStageDone ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Stage Content */}
                <div className="flex-1 bg-gray-50/70 p-4 rounded-2xl border border-gray-100/80 transition-colors hover:bg-gray-50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4
                      className={`text-sm sm:text-base font-bold ${
                        isStageDone
                          ? 'text-gray-900'
                          : isStageActive
                          ? 'text-amber-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {stage.label}
                    </h4>

                    {stage.timestamp && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {new Date(stage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details & Summary Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-600" />
          Order Items & Payment Summary
        </h3>

        {/* Location & Canteen Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
          <div className="flex items-center gap-2 text-gray-700">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <span className="text-gray-400 block font-medium">Campus Canteen</span>
              <span className="font-bold text-gray-900">{order.branch || 'Main Canteen'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <span className="text-gray-400 block font-medium">
                {order.orderType === 'Room Delivery' ? 'Delivery Location' : 'Pickup Window'}
              </span>
              <span className="font-bold text-gray-900">
                {order.orderType === 'Room Delivery'
                  ? `${order.deliveryLocation || 'Campus Hostel'} - Room ${order.roomNumber || 'N/A'}`
                  : order.pickupWindow || 'Standard Counter Pickup'}
              </span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="divide-y divide-gray-100">
          {(order.items || []).map((entry: any, i: number) => {
            const item = entry.item || entry;
            return (
              <div key={i} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    <img
                      src={item.image || '/images/food/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-900">{item.name}</h5>
                    <span className="text-xs text-gray-500">
                      ₹{item.price} × {entry.quantity || 1}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">
                  ₹{(item.price * (entry.quantity || 1)).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing & Payment Status Footer */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                order.paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              {order.paymentMethod === 'ONLINE' ? 'Online Paid' : 'Cash at Canteen'} — {order.paymentStatus || 'PENDING'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-400 block">Total Paid / Payable</span>
            <span className="text-2xl font-black text-emerald-700">₹{order.totalAmount?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-wrap gap-4 justify-between items-center pt-2">
        <button
          onClick={onBackToMenu}
          className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Order More Food
        </button>

        <button
          onClick={onViewOrders}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
        >
          View All Order History
        </button>
      </div>
    </div>
  );
};
