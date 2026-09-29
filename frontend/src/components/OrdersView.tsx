import React from 'react';
import { Package, Clock, QrCode, RefreshCw, CheckCircle2, AlertCircle, Banknote, CreditCard } from 'lucide-react';
import { Order } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onViewToken: (order: Order) => void;
  onReorder: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, onViewToken, onReorder }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900">My Campus Orders & Tokens</h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Real-time status updates from MongoDB, payment receipts, and digital QR tokens
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs">
          {orders.length} Total Orders
        </span>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="font-extrabold text-slate-700 text-base">No Orders Found</h3>
            <p className="text-slate-400 text-xs mt-1">
              Browse our food menu, choose dishes, and place your order with Cash or Online payment!
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const isCashPending = order.paymentMethod === 'CASH' && order.paymentStatus === 'PENDING';
            const isPaid = order.paymentStatus === 'PAID';

            return (
              <div
                key={order.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Order Info */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                      {order.tokenNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Order #{order.orderNumber} • {order.createdAt}
                    </span>

                    {/* Order Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                      order.status === 'Completed'
                        ? 'bg-slate-100 text-slate-800'
                        : order.status === 'Ready'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'Preparing'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>

                    {/* Payment Method & Status Badges */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      order.paymentMethod === 'CASH' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-purple-50 text-purple-800 border border-purple-200'
                    }`}>
                      {order.paymentMethod === 'CASH' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                      <span>{order.paymentMethod === 'CASH' ? 'Cash at Counter' : 'Online Payment'}</span>
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      isPaid ? 'bg-emerald-100 text-emerald-800' : isCashPending ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {order.paymentStatus || 'PENDING'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      {order.orderType === 'Pickup'
                        ? `Pickup Slot: ${order.pickupWindow || 'Standard'} (${order.branch})`
                        : `Room Delivery: ${order.deliveryLocation} - ${order.roomNumber}`}
                    </span>
                  </div>

                  {/* Items breakdown */}
                  <div className="text-xs text-slate-600 font-semibold flex items-center gap-2 flex-wrap">
                    {order.items.map((i, idx) => (
                      <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold">
                        {i.quantity}x {i.item.name} (₹{i.item.price})
                      </span>
                    ))}
                  </div>

                  {isCashPending && (
                    <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Please pay ₹{order.totalAmount} in cash at the counter upon pickup.</span>
                    </div>
                  )}
                </div>

                {/* Price & Action Buttons */}
                <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block -mb-0.5">
                      {isPaid ? 'Amount Paid' : 'Amount Due'}
                    </span>
                    <span className="text-lg font-black text-slate-900">₹{order.totalAmount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewToken(order)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Digital Token / QR</span>
                    </button>

                    <button
                      onClick={() => onReorder(order)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      title="Reorder these items"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
