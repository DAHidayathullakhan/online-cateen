import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FoodCard } from './components/FoodCard';
import { CategoryFilter } from './components/CategoryFilter';
import { CartModal } from './components/CartModal';
import { TokenModal } from './components/TokenModal';
import { KitchenDashboard } from './components/KitchenDashboard';
import { DeliveryDashboard } from './components/DeliveryDashboard';
import { OperatorDashboard } from './components/OperatorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { OrdersView } from './components/OrdersView';
import { AuthModal } from './components/AuthModal';
import { mockFoods } from './data/mockFoods';
import { FoodItem, CartItem, Order, User } from './types';
import { Search, SlidersHorizontal, Sparkles, AlertCircle, RefreshCw, ChefHat, Truck, Store, Shield, User as UserIcon, Clock, MapPin, Zap } from 'lucide-react';

const CATEGORIES = [
  'All Items',
  'Specials',
  'Meals',
  'Breakfast',
  'Beverages',
  'Snacks',
  'Fast Food',
  'Healthy Food'
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_101',
    orderNumber: 'ORD-784210',
    tokenNumber: 'CAN-2026-78421',
    studentName: 'Rahul Sharma',
    studentId: 'STU-2026-001',
    items: [
      { item: mockFoods[0], quantity: 2 },
      { item: mockFoods[17] || mockFoods[1], quantity: 1 }
    ],
    totalAmount: 80,
    orderType: 'Pickup',
    pickupWindow: '12:15 PM – 12:30 PM',
    status: 'Preparing',
    createdAt: '11:45 AM',
    branch: 'Main Canteen'
  },
  {
    id: 'ord_102',
    orderNumber: 'ORD-912440',
    tokenNumber: 'CAN-2026-91244',
    studentName: 'Priya Patel',
    studentId: 'STU-2026-042',
    items: [
      { item: mockFoods[2] || mockFoods[0], quantity: 1 }
    ],
    totalAmount: 70,
    orderType: 'Room Delivery',
    deliveryLocation: 'Hostel Block A',
    roomNumber: 'Room 304',
    status: 'Confirmed',
    createdAt: '12:00 PM',
    branch: 'Main Canteen'
  },
  {
    id: 'ord_103',
    orderNumber: 'ORD-348120',
    tokenNumber: 'CAN-2026-34812',
    studentName: 'Prof. S. K. Gupta',
    studentId: 'FAC-2026-015',
    items: [
      { item: mockFoods[8] || mockFoods[0], quantity: 1 },
      { item: mockFoods[16] || mockFoods[1], quantity: 2 }
    ],
    totalAmount: 110,
    orderType: 'Room Delivery',
    deliveryLocation: 'Department Block B',
    roomNumber: 'Faculty Room 201',
    status: 'Out for Delivery',
    createdAt: '11:30 AM',
    branch: 'Hostel Canteen'
  }
];

export const App: React.FC = () => {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState<string>('menu');

  // Persistent User Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('smart_campus_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Food Menu state (Defaults per prompt: All Items, Search='', Specials=OFF)
  const [foods, setFoods] = useState<FoodItem[]>(mockFoods);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'time'>('popular');
  const [specialOnly, setSpecialOnly] = useState<boolean>(false);

  // Real crowd management & pickup slot recommendations
  const [crowdData, setCrowdData] = useState<{
    crowdLevel: string;
    avgWaitMinutes: number;
    recommendedSlot: string;
    totalActive: number;
  }>({
    crowdLevel: 'LOW CROWD',
    avgWaitMinutes: 8,
    recommendedSlot: '12:15 PM – 12:30 PM',
    totalActive: 3
  });

  // Cart & Order states
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [selectedOrderForToken, setSelectedOrderForToken] = useState<Order | null>(null);

  // Notification Toast state
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // 1. Session verification & persistence on page refresh
  useEffect(() => {
    const token = localStorage.getItem('smart_campus_jwt');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setCurrentUser(data.data);
            localStorage.setItem('smart_campus_user', JSON.stringify(data.data));
            // Route to appropriate view based on role
            const role = data.data.role;
            if (role === 'Kitchen Staff') setActiveTab('kitchen');
            else if (role === 'Delivery Staff') setActiveTab('delivery');
            else if (role === 'Canteen Operator') setActiveTab('operator');
            else if (role === 'Admin') setActiveTab('admin');
          } else {
            // Token expired or invalid
            localStorage.removeItem('smart_campus_jwt');
            localStorage.removeItem('smart_campus_user');
            setCurrentUser(null);
          }
        })
        .catch(() => {
          // Keep offline state if connection interrupted
        });
    }
  }, []);

  // 2. Fetch dishes from backend
  const fetchMenu = () => {
    fetch('/api/menu?isAvailable=all')
      .then(res => res.json())
      .then(data => {
        const rawItems = data?.data || data?.items;
        if (rawItems && Array.isArray(rawItems) && rawItems.length > 0) {
          const mapped: FoodItem[] = rawItems.map((m: any) => ({
            id: m._id || m.id,
            _id: m._id,
            name: m.name,
            description: m.description,
            price: m.price,
            category: m.category,
            image: m.image || m.imageUrl || '/images/food/placeholder.jpg',
            vegetarian: m.isVegetarian !== undefined ? m.isVegetarian : true,
            available: m.isAvailable !== undefined ? m.isAvailable : true,
            stock: m.stockQuantity !== undefined ? m.stockQuantity : (m.stock || 50),
            preparationTime: m.preparationTime !== undefined ? m.preparationTime : (m.preparationTimeMinutes || 10),
            isPopular: m.popularity > 80 || m.isPopular,
            isSpecial: m.isTodaySpecial || m.isSpecial
          }));
          setFoods(mapped);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchMenu();

    const fetchCrowd = () => {
      fetch('/api/crowd/status')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setCrowdData({
              crowdLevel: data.data.crowdLevel,
              avgWaitMinutes: data.data.avgWaitMinutes,
              recommendedSlot: data.data.recommendedSlot,
              totalActive: data.data.activeOrdersCount || 0
            });
          }
        })
        .catch(() => {});
    };
    fetchCrowd();
    const interval = setInterval(fetchCrowd, 20000);
    return () => clearInterval(interval);
  }, []);

  // 3. Fetch real orders from MongoDB
  const fetchOrders = () => {
    const token = localStorage.getItem('smart_campus_jwt');
    if (!token || !currentUser) return;

    const endpoint = (currentUser.role === 'Student' || currentUser.role === "Master's Student")
      ? '/api/orders/my-orders'
      : '/api/orders';

    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const mapped: Order[] = data.data.map((o: any) => ({
            id: o._id || o.id,
            orderNumber: o.orderNumber,
            tokenNumber: o.tokenNumber,
            studentName: o.studentName,
            studentId: o.studentId,
            items: o.items.map((i: any) => ({
              item: {
                id: i.item?._id || i.item || `item_${Math.random()}`,
                name: i.name,
                description: '',
                price: i.price,
                category: 'Meals',
                image: i.image || '/images/food/placeholder.jpg',
                vegetarian: true,
                available: true,
                stock: 50,
                preparationTime: i.preparationTime || 10,
                isPopular: false,
                isSpecial: false
              },
              quantity: i.quantity
            })),
            totalAmount: o.totalAmount,
            status: o.status,
            orderType: o.orderType || 'Pickup',
            pickupWindow: o.pickupWindow,
            deliveryLocation: o.deliveryLocation,
            roomNumber: o.roomNumber,
            branch: o.branch || 'Main Canteen',
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            tokenStatus: o.tokenStatus,
            tokenUsedAt: o.tokenUsedAt,
            qrCodeData: o.qrCodeData,
            createdAt: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
          }));
          setOrders(mapped);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  // Cart operations
  const handleAddToCart = (item: FoodItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    showToast(`Added ${item.name} to cart!`);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems(prev => {
      return prev
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
    showToast('Item removed from cart', 'info');
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderPlaced = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    setCartItems([]);
    setIsCartOpen(false);
    setSelectedOrderForToken(newOrder);
    fetchMenu();
    showToast(`Order Placed! Token #${newOrder.tokenNumber}`, 'success');
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Status update failed.');
      }
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`Order status updated to "${newStatus}"`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const handleToggleAvailability = async (foodId: string) => {
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch(`/api/menu/${foodId}/toggle-availability`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFoods(prev =>
          prev.map(f => (f.id === foodId ? { ...f, available: data.data.isAvailable } : f))
        );
        showToast(data.message || 'Food item availability updated', 'info');
      }
    } catch (err: any) {
      setFoods(prev =>
        prev.map(f => (f.id === foodId ? { ...f, available: !f.available } : f))
      );
      showToast('Food item availability updated', 'info');
    }
  };

  const handleDishCreated = (newDish: FoodItem) => {
    setFoods(prev => [newDish, ...prev]);
    showToast(`"${newDish.name}" added to menu catalog!`, 'success');
  };

  const handleReorder = (order: Order) => {
    const newItems: CartItem[] = order.items.map(i => ({
      ...i.item,
      quantity: i.quantity
    }));
    setCartItems(newItems);
    setIsCartOpen(true);
    showToast('Items reloaded into your cart!', 'success');
  };

  // Quick switch role helper using real backend authentication
  const handleQuickRoleSwitch = async (role: User['role'], label: string) => {
    let email = 'student@canteen.edu';
    if (role === 'Kitchen Staff') email = 'kitchen@canteen.edu';
    else if (role === 'Delivery Staff') email = 'delivery@canteen.edu';
    else if (role === 'Canteen Operator') email = 'operator@canteen.edu';
    else if (role === 'Admin') email = 'admin@canteen.edu';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginKey: email, password: 'password123' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('smart_campus_jwt', data.token);
        localStorage.setItem('smart_campus_user', JSON.stringify(data.data));
        setCurrentUser(data.data);
      }
    } catch (e) {
      const userObj: User = {
        id: `usr_${role.toLowerCase().replace(/[^a-z0-9]/g, '_')}_demo`,
        name: label,
        email,
        role
      };
      setCurrentUser(userObj);
    }

    if (role === 'Kitchen Staff') setActiveTab('kitchen');
    else if (role === 'Delivery Staff') setActiveTab('delivery');
    else if (role === 'Canteen Operator') setActiveTab('operator');
    else if (role === 'Admin') setActiveTab('admin');
    else setActiveTab('menu');
    showToast(`Switched active view to ${role}`, 'info');
  };

  // Filtered food list computation
  const filteredFoods = foods.filter(item => {
    let matchesCategory = true;
    if (selectedCategory === 'All Items') {
      matchesCategory = true;
    } else if (selectedCategory === 'Specials') {
      matchesCategory = item.isSpecial;
    } else {
      matchesCategory = item.category.toLowerCase() === selectedCategory.toLowerCase();
    }

    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Application is 100% PURE VEG
    const matchesDiet = item.vegetarian !== false;

    const matchesSpecial = !specialOnly || item.isSpecial;

    return matchesCategory && matchesSearch && matchesDiet && matchesSpecial;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'time') return a.preparationTime - b.preparationTime;
    return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
  });

  const cartTotalCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-slide-up">
          <span className={`w-2.5 h-2.5 rounded-full ${
            toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'error' ? 'bg-rose-400' : 'bg-blue-400'
          }`} />
          <span className="text-sm font-bold tracking-tight">{toast.text}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartTotalCount}
        openCart={() => setIsCartOpen(true)}
        currentUser={currentUser}
        openAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          try {
            localStorage.removeItem('smart_campus_user');
            localStorage.removeItem('smart_campus_token');
          } catch (e) {}
          showToast('Logged out successfully', 'info');
        }}
      />

      {/* Campus Operational Roles Switcher Bar */}
      <div className="bg-slate-900 text-slate-300 border-b border-slate-800 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Campus Operational Roles Switcher:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleQuickRoleSwitch('Student', 'Rahul Sharma (Student)')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                currentUser?.role === 'Student' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" /> Student
            </button>
            <button
              onClick={() => handleQuickRoleSwitch('Kitchen Staff', 'Chef Vikram (Kitchen Staff)')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                currentUser?.role === 'Kitchen Staff' ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" /> Kitchen KDS
            </button>
            <button
              onClick={() => handleQuickRoleSwitch('Delivery Staff', 'Arun Kumar (Campus Runner)')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                currentUser?.role === 'Delivery Staff' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Delivery Runner
            </button>
            <button
              onClick={() => handleQuickRoleSwitch('Canteen Operator', 'Deepak Verma (Counter Operator)')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                currentUser?.role === 'Canteen Operator' ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Store className="w-3.5 h-3.5" /> Counter Operator
            </button>
            <button
              onClick={() => handleQuickRoleSwitch('Admin', 'Dr. S. K. Rao (Dean Admin)')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                currentUser?.role === 'Admin' ? 'bg-rose-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Admin Portal
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full">
        {activeTab === 'menu' && (
          <div className="space-y-4 sm:space-y-6">
            {/* HERO SECTION: Student Greeting + Lunch Pickup Slot Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Student Greeting Banner */}
              <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 sm:p-7 shadow-xl shadow-blue-900/10 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-blue-100">
                      ⚡ SMART CAMPUS CANTEEN
                    </span>
                    <span className="text-xs text-blue-200 font-semibold hidden sm:inline">
                      • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                    Hello, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Campus Student'}! 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100/90 font-medium max-w-xl leading-relaxed">
                    Skip long queues at the counter. Pre-order freshly cooked meals, pick a lunch window, and collect via your digital QR token!
                  </p>
                </div>
                <div className="relative z-10 pt-4 flex items-center gap-2 text-xs font-bold text-blue-200">
                  <span className="bg-white/10 px-2.5 py-1 rounded-lg">🎓 {currentUser?.course || 'Degree / Masters'}</span>
                  <span className="bg-white/10 px-2.5 py-1 rounded-lg">🆔 {currentUser?.studentId || 'STU-2026-001'}</span>
                </div>
                <div className="absolute right-3 bottom-0 opacity-15 text-8xl pointer-events-none select-none hidden sm:block">
                  🍛
                </div>
              </div>

              {/* Scheduled Lunch-Slot Card with Live Crowd Level */}
              <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-blue-600" /> LIVE CROWD & PICKUP
                    </span>
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                      crowdData.crowdLevel.includes('LOW')
                        ? 'text-emerald-700 bg-emerald-100 border border-emerald-300'
                        : crowdData.crowdLevel.includes('MEDIUM')
                        ? 'text-amber-700 bg-amber-100 border border-amber-300'
                        : 'text-rose-700 bg-rose-100 border border-rose-300'
                    }`}>
                      {crowdData.crowdLevel}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1">
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {crowdData.recommendedSlot}
                      </h4>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        Recommended Express Slot • ~{crowdData.avgWaitMinutes}m wait time
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    Real-time crowd intelligence. {crowdData.totalActive} active orders in preparation queue.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Room Delivery:</span>
                  <span className="font-black text-emerald-600">Available</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dishes (e.g. Masala Dosa, Meals, Coffee, Maggi)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-medium transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Dietary Filter Buttons & Sort */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* 100% Pure Veg Permanent Badge */}
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-black text-emerald-800 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>🟢 100% PURE VEG</span>
                  </div>

                  {/* Special Toggle */}
                  <button
                    onClick={() => setSpecialOnly(!specialOnly)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                      specialOnly
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Specials
                  </button>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="popular">Most Popular</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="time">Quickest Prep</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category Horizontal Filter Chips (All Items, Specials, Meals, Breakfast, Beverages, Snacks, Fast Food, Healthy Food) */}
              <CategoryFilter
                categories={CATEGORIES}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>

            {/* Food Grid / Results Section */}
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {selectedCategory === 'All Items' ? 'All Canteen Dishes' : `${selectedCategory}`}
                  <span className="ml-2 text-xs font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                    {filteredFoods.length} items
                  </span>
                </h2>
                {specialOnly && (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Filtered to Today's Specials
                  </span>
                )}
              </div>

              {filteredFoods.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto my-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">No Food Items Found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      No dishes matched your current search and dietary filters.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory('All Items');
                      setSearchQuery('');
                      setDietaryFilter('all');
                      setSpecialOnly(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                  >
                    <RefreshCw className="w-4 h-4" /> Reset All Filters
                  </button>
                </div>
              ) : (
                /* 2-column on mobile, 3-column on tablet, 4-column on desktop */
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {filteredFoods.map(item => {
                    const cartEntry = cartItems.find(c => c.id === item.id);
                    return (
                      <FoodCard
                        key={item.id}
                        item={item}
                        quantityInCart={cartEntry ? cartEntry.quantity : 0}
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateCartQuantity}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders & Digital Tokens View */}
        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            onViewToken={order => setSelectedOrderForToken(order)}
            onReorder={handleReorder}
          />
        )}

        {/* Kitchen KDS Live Kanban */}
        {activeTab === 'kitchen' && (
          <KitchenDashboard
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {/* Delivery Runner View */}
        {activeTab === 'delivery' && (
          <DeliveryDashboard
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {/* Counter Operator View */}
        {activeTab === 'operator' && (
          <OperatorDashboard
            orders={orders}
            foodItems={foods}
            onToggleAvailability={handleToggleAvailability}
            onRefreshOrders={fetchOrders}
            onDishCreated={handleDishCreated}
          />
        )}

        {/* Admin Portal */}
        {activeTab === 'admin' && (
          <AdminDashboard
            orders={orders}
            foodItems={foods}
            onDishCreated={handleDishCreated}
          />
        )}
      </main>

      {/* Floating Bottom Cart Bar for Quick Checkout on Mobile/Desktop */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="sticky bottom-4 z-40 max-w-xl mx-auto px-4 w-full">
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm">
                {cartTotalCount}
              </span>
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-400">Total in Cart</p>
                <p className="text-sm sm:text-base font-black text-white">
                  ₹{cartItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-extrabold text-xs sm:text-sm text-white transition-all shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
            >
              Review & Place Order →
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Digital Token & QR Modal */}
      <TokenModal
        order={selectedOrderForToken}
        onClose={() => setSelectedOrderForToken(null)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={user => {
          setCurrentUser(user);
          setIsAuthOpen(false);
          const role = user.role;
          if (role === 'Kitchen Staff') setActiveTab('kitchen');
          else if (role === 'Delivery Staff') setActiveTab('delivery');
          else if (role === 'Canteen Operator') setActiveTab('operator');
          else if (role === 'Admin') setActiveTab('admin');
          else setActiveTab('menu');
          showToast(`Welcome back, ${user.name}!`, 'success');
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold">
            Smart Campus Canteen Platform © 2026. High-Reliability Architecture.
          </p>
          <div className="flex items-center gap-4 font-bold text-slate-600">
            <span>⚡ Zero Queue Delay</span>
            <span>📱 Digital QR Tokens</span>
            <span>🍲 Multi-Branch Ops</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
