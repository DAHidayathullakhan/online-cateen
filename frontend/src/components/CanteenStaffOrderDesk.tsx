import React, { useState, useEffect, useRef } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Play,
  Bell,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  Building2,
  Check,
  CreditCard,
  User,
  Timer
} from 'lucide-react';
import { Order } from '../types';

interface CanteenStaffOrderDeskProps {
  orders: Order[];
  onRefreshOrders?: () => void;
  staffCollegeId?: string;
  staffBranch?: string;
}

export const CanteenStaffOrderDesk: React.FC<CanteenStaffOrderDeskProps> = ({
  orders,
  onRefreshOrders,
  staffCollegeId,
  staffBranch
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(staffBranch || 'All Branches');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Item currently out of stock');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [prepTimeAdjustments, setPrepTimeAdjustments] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  const prevOrdersCountRef = useRef<number>(orders.length);

  // Live timer tick every second for waiting counters
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio chime for new incoming orders
  const playNewOrderAudio = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  };

  // Monitor incoming orders count
  useEffect(() => {
    if (orders.length > prevOrdersCountRef.current) {
      playNewOrderAudio();
      setToast('🔔 New incoming order placed!');
      setTimeout(() => setToast(null), 5000);
    }
    prevOrdersCountRef.current = orders.length;
  }, [orders.length]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const getElapsedTime = (createdAt: string) => {
    const diffMs = currentTime - new Date(createdAt).getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const getElapsedTimeBadge = (createdAt: string) => {
    const diffMins = Math.floor((currentTime - new Date(createdAt).getTime()) / 60000);
    if (diffMins >= 15) {
      return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
    } else if (diffMins >= 8) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  // Update order status with tracking endpoint
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: string,
    prepMinutes?: number,
    note?: string,
    reason?: string
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('smart_campus_jwt');
      const res = await fetch(`/api/orders/${orderId}/tracking-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          prepMinutes,
          note,
          reason
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`✅ Order status updated to "${newStatus}"!`);
        if (onRefreshOrders) onRefreshOrders();
      } else {
        alert(data.message || 'Failed to update order tracking status.');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    const finalReason = rejectReason === 'Other' ? (customRejectReason || 'Rejected by staff') : rejectReason;
    await handleUpdateStatus(rejectingOrder.id, 'Cancelled', undefined, 'Order rejected by kitchen staff', finalReason);
    setRejectingOrder(null);
    setCustomRejectReason('');
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    // Branch filter
    if (selectedBranch !== 'All Branches' && o.branch !== selectedBranch) {
      return false;
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = o.orderNumber?.toLowerCase().includes(q);
      const matchToken = o.tokenNumber?.toLowerCase().includes(q);
      const matchStudent = o.studentName?.toLowerCase().includes(q);
      if (!matchNumber && !matchToken && !matchStudent) return false;
    }
    // Tab filter
    if (activeTab === 'ACTIVE') {
      return ['Received', 'Confirmed', 'Preparing', 'Ready'].includes(o.status);
    }
    if (activeTab === 'CONFIRMED') {
      return ['Received', 'Confirmed'].includes(o.status);
    }
    if (activeTab === 'PREPARING') {
      return o.status === 'Preparing';
    }
    if (activeTab === 'READY') {
      return o.status === 'Ready' || o.status === 'Ready for Pickup';
    }
    if (activeTab === 'COMPLETED') {
      return o.status === 'Completed' || o.status === 'Cancelled';
    }
    return true;
  });

  const activeCount = orders.filter((o) => ['Received', 'Confirmed', 'Preparing', 'Ready'].includes(o.status)).length;
  const cookingCount = orders.filter((o) => o.status === 'Preparing').length;
  const readyCount = orders.filter((o) => o.status === 'Ready' || o.status === 'Ready for Pickup').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/30 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* Header Desk Controls */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Canteen Staff Live Order Desk</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time kitchen display with live duration timers, queue controls & instant status synchronization
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Audio Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Order Chime ON' : 'Chime Muted'}</span>
          </button>

          {/* Branch filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
          >
            <option value="All Branches">All Campus Branches</option>
            <option value="Main Canteen">Main Canteen</option>
            <option value="Hostel Canteen">Hostel Canteen</option>
            <option value="Block B Canteen">Block B Canteen</option>
          </select>

          {/* Refresh Button */}
          {onRefreshOrders && (
            <button
              onClick={onRefreshOrders}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Total Active Tickets</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{activeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Currently Cooking</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{cookingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Ready at Pickup Counter</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{readyCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'ACTIVE', label: 'All Active', count: activeCount },
            { key: 'CONFIRMED', label: 'Queued / Confirmed', count: orders.filter((o) => ['Received', 'Confirmed'].includes(o.status)).length },
            { key: 'PREPARING', label: 'Preparing', count: cookingCount },
            { key: 'READY', label: 'Ready for Pickup', count: readyCount },
            { key: 'COMPLETED', label: 'Completed / Past', count: orders.filter((o) => ['Completed', 'Cancelled'].includes(o.status)).length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, token, or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700">No Orders in this Section</h3>
          <p className="text-xs text-gray-400 mt-1">
            New orders placed by students will automatically stream here in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isUpdating = updatingOrderId === order.id;
            const currentPrepAdjustment = prepTimeAdjustments[order.id] || 15;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header: Token, Order #, Waiting Duration */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-mono text-base font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl tracking-wider">
                        {order.tokenNumber}
                      </span>
                      <div className="text-xs text-gray-400 font-medium mt-1">#{order.orderNumber}</div>
                    </div>

                    {/* Live Duration Waiting Timer */}
                    <div
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border ${getElapsedTimeBadge(
                        order.createdAt
                      )}`}
                      title="Time elapsed since order was placed"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>{getElapsedTime(order.createdAt)}</span>
                    </div>
                  </div>

                  {/* Student & Delivery Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-600 pb-2 border-b border-gray-100">
                    <span className="font-bold text-gray-900 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {order.studentName}
                    </span>
                    <span className="text-gray-500">
                      {order.orderType === 'Pickup' ? `Pickup: ${order.pickupWindow || 'Standard'}` : `Room: ${order.roomNumber}`}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="py-2.5 space-y-1.5 max-h-44 overflow-y-auto">
                    {(order.items || []).map((entry: any, i: number) => {
                      const item = entry.item || entry;
                      return (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-800">
                            {entry.quantity}x {item.name}
                          </span>
                          <span className="text-gray-400 font-semibold">₹{item.price * entry.quantity}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment & Total */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {order.paymentMethod === 'ONLINE' ? 'ONLINE PAID' : 'CASH AT COUNTER'}
                    </span>
                    <span className="text-sm font-black text-gray-900">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Preparation Time Adjuster (Available when in Confirmed or Preparing status) */}
                {['Confirmed', 'Preparing', 'Received'].includes(order.status) && (
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                      <span>Adjust Prep Estimate:</span>
                      <span className="text-emerald-700 font-bold">~{currentPrepAdjustment} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[10, 15, 20, 30].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => {
                            setPrepTimeAdjustments((prev) => ({ ...prev, [order.id]: mins }));
                            handleUpdateStatus(order.id, order.status, mins, `Prep time estimated to ${mins}m`);
                          }}
                          className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            currentPrepAdjustment === mins
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workflow Actions */}
                <div className="space-y-2 pt-1">
                  {/* Status-specific action buttons */}
                  {['Received', 'Confirmed'].includes(order.status) && (
                    <div className="flex gap-2">
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'Preparing', currentPrepAdjustment, 'Started cooking in kitchen')}
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Cooking</span>
                      </button>

                      <button
                        disabled={isUpdating}
                        onClick={() => setRejectingOrder(order)}
                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                        title="Reject Order"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {order.status === 'Preparing' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(order.id, 'Ready', undefined, 'Order ready for pickup at counter')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Ready for Pickup</span>
                    </button>
                  )}

                  {(order.status === 'Ready' || order.status === 'Ready for Pickup') && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(order.id, 'Completed', undefined, 'Token verified and meal handed over')}
                      className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Complete & Handover Meal</span>
                    </button>
                  )}

                  {order.status === 'Completed' && (
                    <div className="text-center py-1.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-500 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Completed & Verified</span>
                    </div>
                  )}

                  {order.status === 'Cancelled' && (
                    <div className="text-center py-1.5 bg-red-50 rounded-xl text-xs font-bold text-red-600 flex items-center justify-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      <span>Cancelled / Rejected</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Order Reason Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">Reject Order #{rejectingOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setRejectingOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Please choose a reason for rejecting this order. The student will see this reason in real time on their tracking screen.
            </p>

            <div className="space-y-2">
              {[
                'Item currently out of stock',
                'Kitchen is closed for shift transition',
                'Ingredients restock in progress',
                'High queue capacity exceeded',
                'Other'
              ].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    rejectReason === r
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                    className="accent-red-600"
                  />
                  <span>{r}</span>
                </label>
              ))}

              {rejectReason === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter specific rejection reason..."
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  className="w-full mt-2 px-3.5 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-red-500"
                />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRejectingOrder(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
