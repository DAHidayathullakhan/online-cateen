import React from 'react';
import { Truck, MapPin, CheckCircle2, Navigation, PackageCheck } from 'lucide-react';
import { Order } from '../types';

interface DeliveryDashboardProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  orders,
  onUpdateOrderStatus
}) => {
  const deliveryOrders = orders.filter((o) => o.orderType === 'Room Delivery');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900">
              Campus Room Delivery Dashboard
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Active campus runner dispatches, hostel deliveries, and location manifests
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
          🚴 {deliveryOrders.length} Room Orders
        </span>
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveryOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="font-extrabold text-slate-700 text-base">No Active Room Deliveries</h3>
            <p className="text-slate-400 text-xs mt-1">
              When students select room delivery during checkout, delivery orders appear here.
            </p>
          </div>
        ) : (
          deliveryOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono font-black text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  #{order.tokenNumber}
                </span>
                <span
                  className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                    order.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'Out for Delivery'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* Student & Room Location */}
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-base">{order.studentName}</h4>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>
                    <strong>{order.deliveryLocation}</strong> • Room {order.roomNumber}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="text-xs font-semibold text-slate-600 space-y-1 flex-grow">
                <span className="font-bold text-slate-400 block mb-1">Package Items:</span>
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between font-bold text-slate-800">
                    <span>{i.quantity}x {i.item.name}</span>
                    <span className="text-slate-500">₹{i.item.price * i.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100">
                {order.status !== 'Out for Delivery' && order.status !== 'Delivered' && (
                  <button
                    onClick={() => onUpdateOrderStatus(order.id, 'Out for Delivery')}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Start Room Delivery
                  </button>
                )}
                {order.status === 'Out for Delivery' && (
                  <button
                    onClick={() => onUpdateOrderStatus(order.id, 'Delivered')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <PackageCheck className="w-4 h-4" /> Mark Delivered
                  </button>
                )}
                {order.status === 'Delivered' && (
                  <div className="text-center py-1 text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Delivered to Student
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
