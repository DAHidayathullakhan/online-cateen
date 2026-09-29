import React, { useState, useEffect } from 'react';
import { Store, QrCode, CheckCircle, Search, ToggleLeft, ToggleRight, DollarSign, Plus, Banknote, AlertCircle, Loader2, Lock, Unlock, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Order, FoodItem } from '../types';
import { AddDishModal } from './AddDishModal';

interface OperatorDashboardProps {
  orders: Order[];
  foodItems: FoodItem[];
  onToggleAvailability: (foodId: string) => void;
  onRefreshOrders?: () => void;
  onDishCreated?: (dish: FoodItem) => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  orders,
  foodItems,
  onToggleAvailability,
  onRefreshOrders,
  onDishCreated
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [markingCashId, setMarkingCashId] = useState<string | null>(null);

  // Cash Register State
  const [registerSession, setRegisterSession] = useState<any>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [openAmount, setOpenAmount] = useState<number | string>(1000);
  const [expenseAmount, setExpenseAmount] = useState<number | string>('');
  const [expenseReason, setExpenseReason] = useState<string>('');
  const [closeAmount, setCloseAmount] = useState<number | string>('');
  const [regMessage, setRegMessage] = useState<{ text: string; success: boolean } | null>(null);

  const fetchRegister = async () => {
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch('/api/cash-register/current', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setRegisterSession(data.data);
      } else {
        setRegisterSession(null);
      }
    } catch (e) {
      setRegisterSession(null);
    }
  };

  useEffect(() => {
    fetchRegister();
  }, []);

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegMessage(null);
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch('/api/cash-register/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          openingBalance: Number(openAmount) || 0,
          branch: 'Main Canteen',
          notes: 'Standard morning float'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to open register.');
      setRegisterSession(data.data);
      setRegMessage({ text: `Register shift opened with float ₹${openAmount}!`, success: true });
    } catch (err: any) {
      setRegMessage({ text: err.message, success: false });
    } finally {
      setRegLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseReason.trim()) return;
    setRegLoading(true);
    setRegMessage(null);
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch('/api/cash-register/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'EXPENSE',
          amount: Number(expenseAmount),
          reason: expenseReason.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to record expense.');
      setRegisterSession(data.data);
      setExpenseAmount('');
      setExpenseReason('');
      setRegMessage({ text: 'Petty cash expense recorded successfully!', success: true });
    } catch (err: any) {
      setRegMessage({ text: err.message, success: false });
    } finally {
      setRegLoading(false);
    }
  };

  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (closeAmount === '') return;
    setRegLoading(true);
    setRegMessage(null);
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch('/api/cash-register/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          closingBalance: Number(closeAmount),
          closingNotes: 'Shift ended'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to close register.');
      const variance = data.data.variance;
      const varText = variance === 0 ? 'Exact match (₹0 variance)!' : variance > 0 ? `Surplus +₹${variance}` : `Shortage -₹${Math.abs(variance)}`;
      setRegisterSession(data.data);
      setRegMessage({ text: `Register closed! ${varText}`, success: true });
      setCloseAmount('');
    } catch (err: any) {
      setRegMessage({ text: err.message, success: false });
    } finally {
      setRegLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setVerifying(true);
    setVerificationResult(null);

    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch('/api/tokens/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: tokenInput.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Token verification failed.');
      }

      setVerificationResult({
        success: true,
        message: `Token #${data.data.tokenNumber} verified! Order marked COMPLETED for ${data.data.studentName}.`
      });
      setTokenInput('');
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: err.message || 'Invalid, duplicate, or unready token.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleMarkCashReceived = async (orderId: string) => {
    setMarkingCashId(orderId);
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch(`/api/orders/${orderId}/pay-cash`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update payment status.');
      }
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      alert(err.message || 'Error marking cash payment.');
    } finally {
      setMarkingCashId(null);
    }
  };

  const totalSales = orders
    .filter(o => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCashOrders = orders.filter(
    o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900">
              Canteen Operator Control Desk
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Token & QR verification, counter cash register, live food availability, and menu additions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-black text-purple-900">Paid Sales: ₹{totalSales}</span>
          </div>

          <button
            onClick={() => setIsAddDishOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Dish</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Verification Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <QrCode className="w-5 h-5 text-purple-600" />
            <h3 className="font-extrabold text-base text-slate-900">Counter Token & QR Scanner</h3>
          </div>

          <p className="text-xs font-semibold text-slate-500">
            Scan or enter the student's digital token number (e.g. CAN-2026-XXXXX) to verify and mark the order completed.
          </p>

          <form onSubmit={handleVerify} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Enter Token (e.g. CAN-2026-A1B2C)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full text-sm font-mono font-bold uppercase tracking-wider px-3.5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 active:scale-[0.98] transition-all"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>{verifying ? 'Verifying...' : 'Verify & Complete Order'}</span>
            </button>
          </form>

          {verificationResult && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold ${
                verificationResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {verificationResult.message}
            </div>
          )}
        </div>

        {/* Counter Cash Payments Register */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base text-slate-900">Cash Counter Register</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
              {pendingCashOrders.length} Pending
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-500">
            Collect cash from students when they arrive at the counter, then click to mark payment paid.
          </p>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {pendingCashOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-bold">
                No pending cash payments right now.
              </div>
            ) : (
              pendingCashOrders.map((o) => (
                <div
                  key={o.id}
                  className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-700">{o.tokenNumber}</span>
                    <strong className="text-emerald-700 font-black">₹{o.totalAmount}</strong>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">
                    {o.studentName} ({o.studentId})
                  </div>
                  <button
                    onClick={() => handleMarkCashReceived(o.id)}
                    disabled={markingCashId === o.id}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {markingCashId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    <span>Mark Cash Received</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Food Availability Switcher */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Dish Availability
            </h3>
            <span className="text-xs font-bold text-slate-400">
              One-click Sold-Out
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {foodItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/60"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover bg-white flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-slate-900 truncate block">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      ₹{item.price} • Stock: {item.stock}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onToggleAvailability(item.id)}
                  className={`p-1 text-2xl transition-colors ${
                    item.available ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-400'
                  }`}
                  title={item.available ? 'Click to mark Sold Out' : 'Click to mark Available'}
                >
                  {item.available ? (
                    <ToggleRight className="w-7 h-7" />
                  ) : (
                    <ToggleLeft className="w-7 h-7" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cash Register Shift & Session Tracking */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Banknote className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Cash Register & Daily Shift Ledger
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Opening float, counter cash collections, petty expenses, and end-of-shift variance calculation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
              registerSession?.status === 'OPEN'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {registerSession?.status === 'OPEN' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {registerSession?.status === 'OPEN' ? 'SHIFT OPEN' : 'SHIFT CLOSED'}
            </span>
            <button
              onClick={fetchRegister}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-slate-200"
            >
              Refresh
            </button>
          </div>
        </div>

        {regMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
            regMessage.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{regMessage.text}</span>
          </div>
        )}

        {/* Register Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Opening Float</span>
            <span className="text-lg font-black text-slate-900">₹{registerSession?.openingBalance || 0}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-700 block mb-1">Cash Food Sales</span>
            <span className="text-lg font-black text-emerald-800">+₹{registerSession?.cashSales || 0}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
            <span className="text-[11px] font-bold text-rose-700 block mb-1">Petty Expenses / Refunds</span>
            <span className="text-lg font-black text-rose-800">-₹{(registerSession?.totalExpenses || 0) + (registerSession?.totalRefunds || 0)}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="text-[11px] font-bold text-blue-700 block mb-1">Expected In Drawer</span>
            <span className="text-lg font-black text-blue-900">₹{registerSession?.currentCashBalance ?? (registerSession?.openingBalance || 0)}</span>
          </div>
        </div>

        {/* Action Controls: Open / Record Expense / Close */}
        {(!registerSession || registerSession.status === 'CLOSED') ? (
          <form onSubmit={handleOpenRegister} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Enter Opening Cash Float (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={openAmount}
                onChange={(e) => setOpenAmount(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:self-end">
              <button
                type="submit"
                disabled={regLoading}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {regLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>Open Counter Shift</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Record Petty Cash Expense Form */}
            <form onSubmit={handleAddExpense} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                Record Petty Cash Expense / Payout
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Amount (₹)"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Reason (e.g. Milk, Gas, Ice)"
                  value={expenseReason}
                  onChange={(e) => setExpenseReason(e.target.value)}
                  className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                {regLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Record Payout</span>
              </button>
            </form>

            {/* Close Shift & Counted Cash Variance Form */}
            <form onSubmit={handleCloseRegister} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-purple-600" />
                End Shift & Count Physical Cash
              </h4>
              <div>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Actual Counted Cash in Register (₹)"
                  value={closeAmount}
                  onChange={(e) => setCloseAmount(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                {regLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Close Shift & Reconcile Variance</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Add New Dish Modal */}
      <AddDishModal
        isOpen={isAddDishOpen}
        onClose={() => setIsAddDishOpen(false)}
        onDishCreated={(dish) => {
          if (onDishCreated) onDishCreated(dish);
        }}
      />
    </div>
  );
};
