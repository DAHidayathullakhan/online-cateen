import React from 'react';
import { X, CheckCircle, Clock, MapPin, Receipt, Banknote, CreditCard, AlertCircle } from 'lucide-react';
import { Order } from '../types';

interface TokenModalProps {
  order: Order | null;
  onClose: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const isCash = order.paymentMethod === 'CASH';
  const isPaid = order.paymentStatus === 'PAID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card Header Banner */}
        <div className="bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-blue-200">
            Order Confirmed & Placed
          </span>
          <h2 className="text-2xl font-black mt-1">Smart Digital Food Token</h2>
          <p className="text-xs text-blue-100/90 mt-1">
            Show this token number or Order ID at the canteen counter
          </p>
        </div>

        {/* Token Pass Body */}
        <div className="p-6 space-y-4">
          {/* Main Token Display Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-blue-200 text-center relative">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Unique Token Number
            </span>
            <span className="text-3xl font-black text-blue-700 tracking-wider font-mono block my-1">
              {order.tokenNumber}
            </span>
            <span className="text-xs font-bold text-slate-500">
              Order #{order.orderNumber} • {order.branch}
            </span>
          </div>

          {/* Payment Status & Instructions Banner */}
          {isCash && !isPaid ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <Banknote className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-amber-700">
                  Pay at the Canteen
                </div>
                <div className="text-xs font-semibold mt-0.5">
                  Payment is <strong>PENDING (Cash)</strong>. Please pay <strong className="text-amber-800">₹{order.totalAmount}</strong> at the canteen counter when collecting your food.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Payment Verified (Online)
                </div>
                <div className="text-xs font-semibold">
                  Amount ₹{order.totalAmount} has been paid successfully.
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold block mb-1">Pickup / Delivery:</span>
              <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                {order.orderType === 'Pickup' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>{order.pickupWindow}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{order.deliveryLocation} - {order.roomNumber}</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold block mb-1">Total Paid Amount:</span>
              <span className="text-base font-black text-emerald-600">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

          {/* Ordered Items summary */}
          <div className="border-t border-slate-100 pt-3">
            <span className="text-xs font-bold text-slate-500 block mb-2">Ordered Delicacies:</span>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{i.quantity}x {i.item.name}</span>
                  <span>₹{i.item.price * i.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Print / Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5"
            >
              <Receipt className="w-4 h-4" /> Print Token
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
