import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Clock, MapPin, CheckCircle2, AlertCircle, Loader2, Banknote, CreditCard } from 'lucide-react';
import { CartItem, Order, User } from '../types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
}

const PICKUP_SLOTS = [
  '11:45 AM – 12:00 PM',
  '12:00 PM – 12:15 PM',
  '12:15 PM – 12:30 PM',
  '12:30 PM – 12:45 PM',
  '12:45 PM – 01:00 PM',
  '01:00 PM – 01:15 PM',
  '01:15 PM – 01:30 PM'
];

const CAMPUS_BUILDINGS = [
  'Hostel Block A',
  'Hostel Block B',
  'Central Academic Quad',
  'Department Block B',
  'Library Complex',
  'Sports Pavilion'
];

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  onOpenAuth,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced
}) => {
  const [orderType, setOrderType] = useState<'Pickup' | 'Room Delivery'>('Pickup');
  const [selectedSlot, setSelectedSlot] = useState(PICKUP_SLOTS[0]);
  const [selectedBuilding, setSelectedBuilding] = useState(CAMPUS_BUILDINGS[0]);
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Main Canteen');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');

  // API submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = orderType === 'Room Delivery' ? 20 : 0;
  const totalAmount = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    if (!currentUser) {
      setErrorMsg('Please log in with your campus account before placing an order.');
      onOpenAuth();
      return;
    }

    if (orderType === 'Room Delivery' && !roomNumber.trim()) {
      setErrorMsg('Please enter your room or office number for room delivery.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const orderPayload = {
        items: cartItems.map(i => ({ id: i.id, quantity: i.quantity })),
        orderType,
        pickupWindow: orderType === 'Pickup' ? selectedSlot : undefined,
        deliveryLocation: orderType === 'Room Delivery' ? selectedBuilding : undefined,
        roomNumber: orderType === 'Room Delivery' ? roomNumber.trim() : undefined,
        branch: selectedBranch,
        paymentMethod
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to place order.');
      }

      const createdOrder: Order = {
        id: data.data._id || data.data.id,
        orderNumber: data.data.orderNumber,
        tokenNumber: data.data.tokenNumber,
        studentName: data.data.studentName || currentUser.name,
        studentId: data.data.studentId || currentUser.studentId || 'STU-2026-001',
        items: data.data.items.map((i: any) => ({
          item: {
            id: i.item,
            name: i.name,
            description: '',
            price: i.price,
            category: 'Meals',
            image: i.image,
            vegetarian: true,
            available: true,
            stock: 50,
            preparationTime: i.preparationTime || 10,
            isPopular: false,
            isSpecial: false
          },
          quantity: i.quantity
        })),
        totalAmount: data.data.totalAmount,
        status: data.data.status,
        orderType: data.data.orderType,
        pickupWindow: data.data.pickupWindow,
        deliveryLocation: data.data.deliveryLocation,
        roomNumber: data.data.roomNumber,
        branch: data.data.branch,
        paymentMethod: data.data.paymentMethod,
        paymentStatus: data.data.paymentStatus,
        tokenStatus: data.data.tokenStatus,
        qrCodeData: data.data.qrCodeData,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      onOrderPlaced(createdOrder);
      onClearCart();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col relative animate-slide-left">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              🛒 Your Order Cart
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} selected
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-3xl mx-auto mb-3">
                🍽️
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-1">Your cart is empty</h3>
              <p className="text-slate-400 text-xs max-w-xs mx-auto">
                Explore our campus delicacies and add items to your cart to schedule lunch or room delivery.
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-white transition-all shadow-sm"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/food/placeholder.jpg';
                      }}
                      className="w-16 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
                      <span className="text-xs font-black text-blue-600">₹{item.price}</span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black text-slate-800 px-1">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Options: Pickup vs Delivery */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Delivery Mode
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderType('Pickup')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      orderType === 'Pickup'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Scheduled Pickup
                  </button>

                  <button
                    onClick={() => setOrderType('Room Delivery')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      orderType === 'Room Delivery'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Room Delivery (+₹20)
                  </button>
                </div>

                {/* Pickup Window Slots */}
                {orderType === 'Pickup' ? (
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
                      Choose Lunch / Snack Pickup Slot:
                    </label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {PICKUP_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          ⏱️ {slot} (Available)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Select Campus Building:
                      </label>
                      <select
                        value={selectedBuilding}
                        onChange={(e) => setSelectedBuilding(e.target.value)}
                        className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {CAMPUS_BUILDINGS.map((b) => (
                          <option key={b} value={b}>
                            🏢 {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Room / Lab / Floor Number:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Room 204, 2nd Floor"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PAYMENT METHOD SELECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Payment Method
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all text-center ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Cash at Canteen</span>
                    <span className="text-[10px] opacity-80 font-normal">Pay at counter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all text-center ${
                      paymentMethod === 'ONLINE'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Online Payment</span>
                    <span className="text-[10px] opacity-80 font-normal">UPI / NetBanking / Cards</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 font-medium">
                  {paymentMethod === 'CASH'
                    ? '💡 Pay cash at the canteen collection counter. Order status will be confirmed with payment pending.'
                    : '🔒 Secure payment gateway verification via configured payment provider.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3">
            <div className="space-y-1.5 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-900">₹{subtotal}</span>
              </div>
              {orderType === 'Room Delivery' && (
                <div className="flex justify-between text-blue-600">
                  <span>Room Delivery Fee:</span>
                  <span className="font-bold">₹{deliveryFee}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Grand Total:</span>
                <span className="text-blue-600">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'CASH'
                      ? 'Place Order (Pay Cash at Counter)'
                      : 'Proceed with Online Payment'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
