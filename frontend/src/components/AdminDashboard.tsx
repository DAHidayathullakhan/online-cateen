import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, Users, Package, RefreshCw, Trash2, ArrowRightLeft, FileText, CheckCircle2, BarChart2, DollarSign, CreditCard, Banknote, PieChart } from 'lucide-react';
import { Order, InventoryItem, StockTransfer, FoodWasteLog, FoodItem } from '../types';
import { AddDishModal } from './AddDishModal';
import { Plus } from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
  foodItems?: FoodItem[];
  onDishCreated?: (dish: FoodItem) => void;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv_1', name: 'Basmati Rice', quantity: 150, unit: 'kg', minStock: 30, branch: 'Main Canteen', costPerUnit: 60, lastRestocked: 'Today' },
  { id: 'inv_2', name: 'Toor Dal', quantity: 80, unit: 'kg', minStock: 20, branch: 'Main Canteen', costPerUnit: 140, lastRestocked: 'Yesterday' },
  { id: 'inv_3', name: 'Fresh Milk', quantity: 100, unit: 'L', minStock: 25, branch: 'Main Canteen', costPerUnit: 35, lastRestocked: 'Today' },
  { id: 'inv_4', name: 'Refined Oil', quantity: 50, unit: 'L', minStock: 15, branch: 'Hostel Canteen', costPerUnit: 120, lastRestocked: '3 days ago' },
  { id: 'inv_5', name: 'Fresh Paneer', quantity: 35, unit: 'kg', minStock: 10, branch: 'Main Canteen', costPerUnit: 320, lastRestocked: 'Today' }
];

const INITIAL_TRANSFERS: StockTransfer[] = [
  { id: 'trans_1', item: 'Basmati Rice (25 kg)', quantity: 25, sourceBranch: 'Main Canteen', destBranch: 'Hostel Canteen', status: 'Dispatched', requestedAt: '10:30 AM' },
  { id: 'trans_2', item: 'Fresh Milk (20 L)', quantity: 20, sourceBranch: 'Main Canteen', destBranch: 'Evening Snacks Counter', status: 'Approved', requestedAt: '11:15 AM' }
];

const INITIAL_WASTE_LOGS: FoodWasteLog[] = [
  { id: 'w_1', foodName: 'Vegetable Samosa', wastedQuantity: 6, reason: 'Overproduction', cost: 90, date: 'Today', branch: 'Main Canteen' },
  { id: 'w_2', foodName: 'Steamed Rice', wastedQuantity: 4, reason: 'Expired', cost: 120, date: 'Yesterday', branch: 'Hostel Canteen' }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, foodItems = [], onDishCreated }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'analytics' | 'inventory' | 'transfers' | 'waste' | 'audit'>('overview');
  const [transfers, setTransfers] = useState<StockTransfer[]>(INITIAL_TRANSFERS);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch('/api/analytics/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAnalyticsData(json.data);
      }
    } catch (e) {
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalRevenue = analyticsData?.sales?.totalRevenue ?? orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handleApproveTransfer = (id: string) => {
    setTransfers(transfers.map(t => t.id === id ? { ...t, status: 'Received' } : t));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900">
              Campus Administration & Analytics Hub
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Complete multi-branch analytics, recipe inventory, inter-branch stock transfers, and audit logs
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddDishOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Dish</span>
          </button>

          {/* Sub-navigation tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => { setActiveSubTab('analytics'); fetchAnalytics(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeSubTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Real Analytics</span>
            </button>
            <button
              onClick={() => setActiveSubTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveSubTab('transfers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'transfers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transfers
            </button>
            <button
              onClick={() => setActiveSubTab('waste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'waste' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Waste Logs
            </button>
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Total System Revenue</span>
              <span className="text-2xl font-black text-slate-900">₹{totalRevenue}</span>
              <span className="text-[11px] font-bold text-emerald-600 block mt-1">↑ +14% vs yesterday</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Orders Processed</span>
              <span className="text-2xl font-black text-slate-900">{orders.length}</span>
              <span className="text-[11px] font-bold text-blue-600 block mt-1">Live synchronized</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Active Campus Branches</span>
              <span className="text-2xl font-black text-slate-900">4</span>
              <span className="text-[11px] font-bold text-slate-500 block mt-1">Main, Hostel, Block B, Snacks</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Registered Campus Users</span>
              <span className="text-2xl font-black text-slate-900">1,420</span>
              <span className="text-[11px] font-bold text-emerald-600 block mt-1">Degree & Master's Students</span>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Recent Campus Food Orders</h3>
              <span className="text-xs font-bold text-slate-400">Real-time ledger</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Token #</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 6).map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60 font-semibold text-slate-700">
                      <td className="p-3 font-mono font-bold text-blue-600">{o.tokenNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{o.studentName}</td>
                      <td className="p-3">{o.orderType}</td>
                      <td className="p-3">{o.branch}</td>
                      <td className="p-3 font-bold text-emerald-600">₹{o.totalAmount}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REAL ANALYTICS & FINANCIALS TAB */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Live Database Financials & Aggregations</h3>
              <p className="text-xs text-slate-500 font-semibold">Directly calculated from MongoDB Order collection</p>
            </div>
            <button
              onClick={fetchAnalytics}
              disabled={loadingAnalytics}
              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition-colors border border-blue-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* Revenue & Margin Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Total System Revenue</span>
              <span className="text-2xl font-black text-slate-900">₹{analyticsData?.sales?.totalRevenue || 0}</span>
              <span className="text-[11px] font-bold text-slate-500 block mt-1">Paid: ₹{analyticsData?.sales?.paidRevenue || 0}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Est. Ingredient Cost (45%)</span>
              <span className="text-2xl font-black text-amber-600">₹{analyticsData?.financialEstimates?.estimatedIngredientCosts || 0}</span>
              <span className="text-[11px] font-bold text-slate-500 block mt-1">45% Industry Benchmark</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Estimated Gross Margin (55%)</span>
              <span className="text-2xl font-black text-emerald-600">₹{analyticsData?.financialEstimates?.estimatedGrossMargin || 0}</span>
              <span className="text-[11px] font-bold text-emerald-600 block mt-1">Profitable Operations</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Today's Order Count</span>
              <span className="text-2xl font-black text-blue-600">{analyticsData?.dailySummary?.ordersToday || 0}</span>
              <span className="text-[11px] font-bold text-slate-500 block mt-1">Today's Sales: ₹{analyticsData?.dailySummary?.salesToday || 0}</span>
            </div>
          </div>

          {/* Payment Method Split & Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Method Breakdown Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">Payment Channel Breakdown</h3>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Banknote className="w-5 h-5 text-emerald-700" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-900">Cash at Canteen Counter</h4>
                      <p className="text-[11px] font-bold text-emerald-700">
                        {analyticsData?.paymentBreakdown?.cash?.count || 0} Paid Orders
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-900">
                    ₹{analyticsData?.paymentBreakdown?.cash?.total || 0}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-blue-700" />
                    <div>
                      <h4 className="text-xs font-black text-blue-900">Online UPI / Card / NetBanking</h4>
                      <p className="text-[11px] font-bold text-blue-700">
                        {analyticsData?.paymentBreakdown?.online?.count || 0} Paid Orders
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-black text-blue-900">
                    ₹{analyticsData?.paymentBreakdown?.online?.total || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Kitchen & Order Workflow Statuses */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-base text-slate-900">Order Lifecycle Metrics</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block">Confirmed Waiting</span>
                  <span className="text-lg font-black text-blue-600">{analyticsData?.orderStatusCounts?.Confirmed || 0}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block">Kitchen Preparing</span>
                  <span className="text-lg font-black text-amber-600">{analyticsData?.orderStatusCounts?.Preparing || 0}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block">Ready for Pickup</span>
                  <span className="text-lg font-black text-emerald-600">{analyticsData?.orderStatusCounts?.Ready || 0}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block">Tokens Completed</span>
                  <span className="text-lg font-black text-purple-600">{analyticsData?.orderStatusCounts?.Completed || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Ingredients & Raw Material Stock</h3>
            <span className="text-xs font-bold text-slate-400">Recipe consumption tracking</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-3">Ingredient</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3">Min Safe Stock</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Unit Cost</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {INITIAL_INVENTORY.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-bold text-slate-900">{inv.name}</td>
                  <td className="p-3 font-bold">{inv.quantity} {inv.unit}</td>
                  <td className="p-3">{inv.minStock} {inv.unit}</td>
                  <td className="p-3">{inv.branch}</td>
                  <td className="p-3">₹{inv.costPerUnit}/{inv.unit}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      inv.quantity > inv.minStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {inv.quantity > inv.minStock ? 'Adequate' : 'Low Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TRANSFERS TAB */}
      {activeSubTab === 'transfers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Inter-Branch Stock Transfers</h3>
            <span className="text-xs font-bold text-slate-400">Branch supply balancing</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-3">Item & Quantity</th>
                <th className="p-3">Source Branch</th>
                <th className="p-3">Destination Branch</th>
                <th className="p-3">Requested Time</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-bold text-slate-900">{t.item}</td>
                  <td className="p-3">{t.sourceBranch}</td>
                  <td className="p-3">{t.destBranch}</td>
                  <td className="p-3">{t.requestedAt}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {t.status !== 'Received' ? (
                      <button
                        onClick={() => handleApproveTransfer(t.id)}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700"
                      >
                        Confirm Receipt
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Transferred
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* WASTE LOGS TAB */}
      {activeSubTab === 'waste' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Food Waste & Loss Register</h3>
            <span className="text-xs font-bold text-rose-500">Total Wasted Cost: ₹210</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-3">Food Item</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Est. Cost</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {INITIAL_WASTE_LOGS.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-bold text-slate-900">{w.foodName}</td>
                  <td className="p-3">{w.wastedQuantity} units</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700">
                      {w.reason}
                    </span>
                  </td>
                  <td className="p-3">{w.branch}</td>
                  <td className="p-3 font-bold text-rose-600">₹{w.cost}</td>
                  <td className="p-3">{w.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
