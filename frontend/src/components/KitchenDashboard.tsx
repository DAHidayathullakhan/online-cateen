import React, { useState } from 'react';
import { ChefHat, Clock, CheckCircle2, Play, Flame, Bell } from 'lucide-react';
import { Order } from '../types';

interface KitchenDashboardProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  orders,
  onUpdateOrderStatus
}) => {
  const [selectedBranch, setSelectedBranch] = useState('All Branches');

  const filteredOrders = orders.filter(
    (o) => selectedBranch === 'All Branches' || o.branch === selectedBranch
  );

  const getOrdersByStatus = (status: Order['status']) => {
    return filteredOrders.filter((o) => o.status === status);
  };

  const columns: { label: string; status: Order['status']; color: string }[] = [
    { label: 'New / Confirmed', status: 'Confirmed', color: 'border-blue-500 bg-blue-50/40' },
    { label: '🔥 Preparing', status: 'Preparing', color: 'border-amber-500 bg-amber-50/40' },
    { label: '✅ Ready for Pickup', status: 'Ready', color: 'border-emerald-500 bg-emerald-50/40' },
    { label: '🏁 Completed', status: 'Completed', color: 'border-slate-400 bg-slate-50/40' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <ChefHat className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900">
              Kitchen Preparation Board
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Real-time campus order tickets, chef preparation timers, and ready queues
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
          >
            <option value="All Branches">All Campus Branches</option>
            <option value="Main Canteen">Main Canteen</option>
            <option value="Hostel Canteen">Hostel Canteen</option>
            <option value="Block B Canteen">Block B Canteen</option>
          </select>

          <button
            onClick={() => alert('Kitchen notification sound enabled! 🔔')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-sm hover:bg-amber-600"
          >
            <Bell className="w-3.5 h-3.5" /> Sound Alerts
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colOrders = getOrdersByStatus(col.status);
          return (
            <div
              key={col.status}
              className={`rounded-2xl border-t-4 p-4 border border-slate-200 flex flex-col h-[700px] bg-white shadow-sm ${col.color}`}
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
                <h3 className="font-extrabold text-sm text-slate-800">{col.label}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-white text-slate-700 border border-slate-200 shadow-sm">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                {colOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-bold">
                    No orders in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {order.tokenNumber}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {order.createdAt}
                        </span>
                      </div>

                      <div>
                        <strong className="text-sm font-black text-slate-900 block">
                          {order.studentName}
                        </strong>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {order.orderType === 'Pickup' ? `Pickup: ${order.pickupWindow}` : `Room: ${order.deliveryLocation} ${order.roomNumber}`}
                        </span>
                      </div>

                      {/* Item list */}
                      <div className="p-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-700 space-y-1">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{i.quantity}x {i.item.name}</span>
                            <span className="text-slate-400">{i.item.preparationTime}m</span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-1">
                        {order.status === 'Confirmed' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'Preparing')}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Preparing
                          </button>
                        )}
                        {order.status === 'Preparing' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'Ready')}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready
                          </button>
                        )}
                        {order.status === 'Ready' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'Completed')}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            Complete Order
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
