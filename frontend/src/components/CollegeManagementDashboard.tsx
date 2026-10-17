import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  UtensilsCrossed, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  CheckCircle2, 
  AlertTriangle, 
  PauseCircle, 
  PlayCircle, 
  Upload, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Calendar, 
  Search, 
  Filter, 
  Loader2,
  ChevronRight,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { College, FoodItem, Order, User } from '../types';

interface CollegeManagementDashboardProps {
  currentUser: User | null;
  colleges: College[];
  selectedCollegeId: string;
  onSelectCollege: (id: string) => void;
  onOpenOnboarding: () => void;
  onRefreshMenu: () => void;
}

export const CollegeManagementDashboard: React.FC<CollegeManagementDashboardProps> = ({
  currentUser,
  colleges,
  selectedCollegeId,
  onSelectCollege,
  onOpenOnboarding,
  onRefreshMenu
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'menu' | 'schedule' | 'orders'>('analytics');
  
  // Active college details
  const activeCollege = colleges.find(c => c.id === selectedCollegeId) || colleges[0] || null;

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Menu items state
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('All');

  // Food Item Modal state
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishPrice, setDishPrice] = useState('60');
  const [dishCategory, setDishCategory] = useState('Meals');
  const [dishStock, setDishStock] = useState('50');
  const [dishPrepTime, setDishPrepTime] = useState('10');
  const [dishDailyLimit, setDishDailyLimit] = useState('100');
  const [dishDiscount, setDishDiscount] = useState('0');
  const [dishImage, setDishImage] = useState('/images/food/placeholder.jpg');
  const [dishIsSpecial, setDishIsSpecial] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingDish, setSavingDish] = useState(false);

  // Schedule state
  const [openTime, setOpenTime] = useState('08:00 AM');
  const [closeTime, setCloseTime] = useState('08:00 PM');
  const [ordersPaused, setOrdersPaused] = useState(false);
  const [pauseMessage, setPauseMessage] = useState('Kitchen restock in progress. Online ordering resumes shortly.');
  const [onlineOrderingEnabled, setOnlineOrderingEnabled] = useState(true);
  const [breakfastStart, setBreakfastStart] = useState('08:00 AM');
  const [breakfastEnd, setBreakfastEnd] = useState('11:00 AM');
  const [lunchStart, setLunchStart] = useState('12:00 PM');
  const [lunchEnd, setLunchEnd] = useState('03:00 PM');
  const [snacksStart, setSnacksStart] = useState('04:00 PM');
  const [snacksEnd, setSnacksEnd] = useState('06:30 PM');
  const [dinnerStart, setDinnerStart] = useState('07:30 PM');
  const [dinnerEnd, setDinnerEnd] = useState('10:00 PM');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  // Orders pipeline state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // Sync active college schedule into state
  useEffect(() => {
    if (activeCollege?.schedule) {
      setOpenTime(activeCollege.schedule.openTime || '08:00 AM');
      setCloseTime(activeCollege.schedule.closeTime || '08:00 PM');
      setOrdersPaused(activeCollege.schedule.ordersPaused ?? false);
      setPauseMessage(activeCollege.schedule.pauseMessage || 'Kitchen restock in progress. Online ordering resumes shortly.');
      setOnlineOrderingEnabled(activeCollege.schedule.onlineOrderingEnabled ?? true);
      if (activeCollege.schedule.breakfastWindow) {
        setBreakfastStart(activeCollege.schedule.breakfastWindow.start || '08:00 AM');
        setBreakfastEnd(activeCollege.schedule.breakfastWindow.end || '11:00 AM');
      }
      if (activeCollege.schedule.lunchWindow) {
        setLunchStart(activeCollege.schedule.lunchWindow.start || '12:00 PM');
        setLunchEnd(activeCollege.schedule.lunchWindow.end || '03:00 PM');
      }
      if (activeCollege.schedule.snacksWindow) {
        setSnacksStart(activeCollege.schedule.snacksWindow.start || '04:00 PM');
        setSnacksEnd(activeCollege.schedule.snacksWindow.end || '06:30 PM');
      }
      if (activeCollege.schedule.dinnerWindow) {
        setDinnerStart(activeCollege.schedule.dinnerWindow.start || '07:30 PM');
        setDinnerEnd(activeCollege.schedule.dinnerWindow.end || '10:00 PM');
      }
    }
  }, [activeCollege]);

  // Fetch Analytics
  const fetchAnalytics = async () => {
    if (!activeCollege) return;
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/colleges/${activeCollege.id}/analytics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('smart_campus_jwt') || ''}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (e) {
      console.warn('Analytics fetch error:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch College Dishes
  const fetchCollegeMenu = async () => {
    if (!activeCollege) return;
    setLoadingMenu(true);
    try {
      const res = await fetch(`/api/colleges/${activeCollege.id}/menu`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMenuItems(data.data.map((m: any) => ({
          id: m.id || m._id,
          _id: m._id,
          name: m.name,
          description: m.description,
          price: m.price,
          category: m.category,
          image: m.image || m.imageUrl || '/images/food/placeholder.jpg',
          vegetarian: true,
          available: m.isAvailable ?? true,
          stock: m.stockQuantity ?? 50,
          preparationTime: m.preparationTime ?? 10,
          isPopular: m.popularity > 50,
          isSpecial: m.isTodaySpecial ?? false,
          dailyLimit: m.dailyLimit ?? 100,
          discountPercentage: m.discountPercentage ?? 0,
          collegeId: m.collegeId
        })));
      }
    } catch (e) {
      console.warn('College menu fetch error:', e);
    } finally {
      setLoadingMenu(false);
    }
  };

  // Fetch Orders Pipeline
  const fetchCollegeOrders = async () => {
    if (!activeCollege) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/colleges/${activeCollege.id}/orders?status=${orderStatusFilter}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('smart_campus_jwt') || ''}`
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      }
    } catch (e) {
      console.warn('College orders fetch error:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeCollege) {
      fetchAnalytics();
      fetchCollegeMenu();
      fetchCollegeOrders();
    }
  }, [selectedCollegeId]);

  // Handle dish photo upload to Supabase Storage
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setDishImage(data.imageUrl);
      } else {
        alert(data.message || 'Image upload failed.');
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Dish (Add or Update)
  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollege) return;
    setSavingDish(true);

    const payload = {
      name: dishName.trim(),
      description: dishDescription.trim(),
      price: parseFloat(dishPrice),
      category: dishCategory,
      stockQuantity: parseInt(dishStock, 10),
      preparationTime: parseInt(dishPrepTime, 10),
      dailyLimit: parseInt(dishDailyLimit, 10),
      discountPercentage: parseFloat(dishDiscount),
      image: dishImage,
      isAvailable: true,
      isTodaySpecial: dishIsSpecial
    };

    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const url = editingItem
        ? `/api/colleges/${activeCollege.id}/menu/${editingItem.id}`
        : `/api/colleges/${activeCollege.id}/menu`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setIsDishModalOpen(false);
        setEditingItem(null);
        fetchCollegeMenu();
        onRefreshMenu();
      } else {
        alert(data.message || 'Failed to save food item.');
      }
    } catch (err: any) {
      alert('Save error: ' + err.message);
    } finally {
      setSavingDish(false);
    }
  };

  // Delete Dish
  const handleDeleteDish = async (id: string, name: string) => {
    if (!activeCollege) return;
    if (!confirm(`Are you sure you want to delete "${name}" from this college menu?`)) return;

    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch(`/api/colleges/${activeCollege.id}/menu/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || ''}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchCollegeMenu();
        onRefreshMenu();
      } else {
        alert(data.message || 'Failed to delete dish.');
      }
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async (item: FoodItem) => {
    if (!activeCollege) return;
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch(`/api/colleges/${activeCollege.id}/menu/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ isAvailable: !item.available })
      });
      const data = await res.json();
      if (data.success) {
        fetchCollegeMenu();
        onRefreshMenu();
      }
    } catch (err: any) {
      console.warn('Toggle error:', err);
    }
  };

  // Open Edit Dish Modal
  const openEditModal = (item: FoodItem) => {
    setEditingItem(item);
    setDishName(item.name);
    setDishDescription(item.description || '');
    setDishPrice(item.price.toString());
    setDishCategory(item.category);
    setDishStock(item.stock.toString());
    setDishPrepTime(item.preparationTime.toString());
    setDishDailyLimit(item.dailyLimit?.toString() || '100');
    setDishDiscount(item.discountPercentage?.toString() || '0');
    setDishImage(item.image);
    setDishIsSpecial(item.isSpecial);
    setIsDishModalOpen(true);
  };

  // Open Add Dish Modal
  const openAddModal = () => {
    setEditingItem(null);
    setDishName('');
    setDishDescription('');
    setDishPrice('60');
    setDishCategory('Meals');
    setDishStock('50');
    setDishPrepTime('10');
    setDishDailyLimit('100');
    setDishDiscount('0');
    setDishImage('/images/food/placeholder.jpg');
    setDishIsSpecial(false);
    setIsDishModalOpen(true);
  };

  // Save Schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollege) return;
    setSavingSchedule(true);
    setScheduleNotice(null);

    const payload = {
      openTime,
      closeTime,
      onlineOrderingEnabled,
      ordersPaused,
      pauseMessage,
      breakfastWindow: { start: breakfastStart, end: breakfastEnd, enabled: true },
      lunchWindow: { start: lunchStart, end: lunchEnd, enabled: true },
      snacksWindow: { start: snacksStart, end: snacksEnd, enabled: true },
      dinnerWindow: { start: dinnerStart, end: dinnerEnd, enabled: true },
      weeklyOffDays: ['Sunday'],
      specialHolidays: []
    };

    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch(`/api/colleges/${activeCollege.id}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setScheduleNotice('Timings & operating schedule saved and synced successfully.');
        setTimeout(() => setScheduleNotice(null), 3500);
      } else {
        alert(data.message || 'Failed to update schedule.');
      }
    } catch (err: any) {
      alert('Schedule error: ' + err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  // Advance Order Pipeline Status
  const handleUpdateOrderStatus = async (orderId: string, targetStatus: string) => {
    if (!activeCollege) return;
    try {
      const token = localStorage.getItem('smart_campus_jwt');
      const res = await fetch(`/api/colleges/${activeCollege.id}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchCollegeOrders();
        fetchAnalytics();
      }
    } catch (err: any) {
      alert('Order status update error: ' + err.message);
    }
  };

  const filteredDishes = menuItems.filter(item => {
    const matchCategory = menuCategoryFilter === 'All' || item.category === menuCategoryFilter;
    const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* College Switcher & Title Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Multi-College Control Center
            </span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              🟢 100% PURE VEG PLATFORM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <span>{activeCollege ? activeCollege.name : 'College Management'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {activeCollege?.address || 'Independent campus canteen operating hours, menus, pipelines & analytics'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active College Switcher */}
          <div className="relative">
            <select
              value={selectedCollegeId}
              onChange={(e) => onSelectCollege(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold rounded-2xl px-4 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              {colleges.map(c => (
                <option key={c.id} value={c.id}>
                  🏛️ {c.name} ({c.code})
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 rotate-90 pointer-events-none" />
          </div>

          {/* Onboard New College Button */}
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard College</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Overview & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'menu'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Food Item Manager</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
            {menuItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'schedule'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Timings & Schedules</span>
          {ordersPaused && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Live Order Pipeline</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-black">
            {orders.length}
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW & REAL-TIME ANALYTICS */}
      {/* ==================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Quick Status Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${
                ordersPaused ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {ordersPaused ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black">
                    {ordersPaused ? 'Online Ordering Paused' : 'Canteen Online Ordering Active'}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    ordersPaused ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {ordersPaused ? 'Paused' : 'Open'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Operating Hours: {openTime} – {closeTime} • Campus Code: {activeCollege?.code}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setOrdersPaused(!ordersPaused);
                  handleSaveSchedule({ preventDefault: () => {} } as any);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  ordersPaused
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                    : 'bg-rose-500 hover:bg-rose-600 text-white'
                }`}
              >
                {ordersPaused ? 'Resume Online Orders' : 'Emergency Pause Orders'}
              </button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
                <span>Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                ₹{analytics ? analytics.totalRevenue.toLocaleString('en-IN') : '0'}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
                100% Verified Canteen Sales
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
                <span>Orders Placed</span>
                <ShoppingBag className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {analytics ? analytics.totalOrders : '0'}
              </div>
              <span className="text-[11px] font-semibold text-blue-600 mt-1 block">
                Completed: {analytics ? analytics.completedOrders : '0'}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
                <span>Active Queue</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">
                {analytics ? analytics.activeQueueLength : '0'}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                Pending & Preparing
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
                <span>Gross Margin (Est)</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                ₹{analytics ? analytics.estimatedMargin.toLocaleString('en-IN') : '0'}
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 mt-1 block">
                55% Standard Food Margin
              </span>
            </div>
          </div>

          {/* Top Selling Dishes */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-blue-600" />
              <span>Top Selling Pure-Veg Dishes ({activeCollege?.code})</span>
            </h2>

            {analytics?.topDishes && analytics.topDishes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {analytics.topDishes.map((dish: any, index: number) => (
                  <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                          🟢 VEG
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{dish.name}</h4>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">{dish.count} sold</span>
                      <span className="font-black text-slate-900">₹{dish.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                No orders recorded for this college yet. Placed orders will populate live dish rankings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: FOOD ITEM MANAGEMENT */}
      {/* ==================================================================== */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <select
                value={menuCategoryFilter}
                onChange={(e) => setMenuCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-extrabold rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Meals">Meals</option>
                <option value="Snacks">Snacks</option>
                <option value="Beverages">Beverages</option>
                <option value="Fast Food">Fast Food</option>
                <option value="Healthy Food">Healthy Food</option>
                <option value="Specials">Specials</option>
              </select>
            </div>

            <button
              onClick={openAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Food Item</span>
            </button>
          </div>

          {/* Dishes Grid */}
          {loadingMenu ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Loading college menu items...</p>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-800">No dishes found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No food items match the filter for {activeCollege?.name}. Click "+ Add Food Item" to add delicious Pure Veg options.
              </p>
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold"
              >
                Add First Dish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className={`bg-white rounded-2xl overflow-hidden border transition-all ${
                    dish.available ? 'border-slate-200 shadow-sm' : 'border-rose-200 bg-rose-50/20 opacity-80'
                  }`}
                >
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.src = '/images/food/placeholder.jpg'; }}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-emerald-800 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md shadow-sm border border-emerald-200">
                        🟢 PURE VEG
                      </span>
                      {dish.isSpecial && (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-400 px-2 py-0.5 rounded-md shadow-sm">
                          ⭐ SPECIAL
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => handleToggleAvailability(dish)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm transition-all ${
                          dish.available
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-rose-600 text-white hover:bg-rose-700'
                        }`}
                      >
                        {dish.available ? 'AVAILABLE' : 'SOLD OUT'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                      <span>{dish.category}</span>
                      <span>⏱️ {dish.preparationTime} mins</span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 line-clamp-1">{dish.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 min-h-[32px]">
                      {dish.description || 'Delicious freshly prepared campus canteen meal.'}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-slate-900">₹{dish.price}</span>
                        {dish.discountPercentage ? (
                          <span className="text-[10px] text-emerald-600 font-bold ml-1.5">
                            {dish.discountPercentage}% OFF
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(dish)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Dish"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish.id, dish.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: CANTEEN TIMINGS & SCHEDULES */}
      {/* ==================================================================== */}
      {activeTab === 'schedule' && (
        <form onSubmit={handleSaveSchedule} className="space-y-6 max-w-4xl">
          {scheduleNotice && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{scheduleNotice}</span>
            </div>
          )}

          {/* Operating Hours Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Canteen Operating Hours</h3>
                <p className="text-xs text-slate-500 font-medium">Standard daily opening & closing times for {activeCollege?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Open Time</label>
                <input
                  type="text"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  placeholder="08:00 AM"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Close Time</label>
                <input
                  type="text"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  placeholder="08:00 PM"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Meal Windows Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <UtensilsCrossed className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Meal Service Windows</h3>
                <p className="text-xs text-slate-500 font-medium">Pre-ordering slot windows per meal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-black text-slate-900 block mb-2">🍳 Breakfast Window</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={breakfastStart}
                    onChange={(e) => setBreakfastStart(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 font-bold"
                  />
                  <input
                    type="text"
                    value={breakfastEnd}
                    onChange={(e) => setBreakfastEnd(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-black text-slate-900 block mb-2">🍛 Lunch Window</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={lunchStart}
                    onChange={(e) => setLunchStart(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 font-bold"
                  />
                  <input
                    type="text"
                    value={lunchEnd}
                    onChange={(e) => setLunchEnd(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-black text-slate-900 block mb-2">☕ Snacks & Tea Window</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={snacksStart}
                    onChange={(e) => setSnacksStart(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 font-bold"
                  />
                  <input
                    type="text"
                    value={snacksEnd}
                    onChange={(e) => setSnacksEnd(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-black text-slate-900 block mb-2">🍲 Dinner Window</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={dinnerStart}
                    onChange={(e) => setDinnerStart(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 font-bold"
                  />
                  <input
                    type="text"
                    value={dinnerEnd}
                    onChange={(e) => setDinnerEnd(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Kitchen Pause Switch */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className={`w-5 h-5 ${ordersPaused ? 'text-rose-500' : 'text-amber-500'}`} />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Emergency Kitchen Order Pause</h3>
                  <p className="text-xs text-slate-500 font-medium">Temporarily stop students from checking out during heavy crowd / kitchen restocking</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ordersPaused}
                  onChange={(e) => setOrdersPaused(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student Notice Message</label>
              <input
                type="text"
                value={pauseMessage}
                onChange={(e) => setPauseMessage(e.target.value)}
                placeholder="Kitchen restock in progress. Online ordering resumes shortly."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSchedule}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save Schedule & Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: LIVE ORDER PIPELINE */}
      {/* ==================================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Status Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['All', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    orderStatusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={fetchCollegeOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Orders</span>
            </button>
          </div>

          {/* Orders Cards */}
          {loadingOrders ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Fetching live orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-800">No active orders</h3>
              <p className="text-xs text-slate-500 mt-1">
                No orders match status "{orderStatusFilter}" for {activeCollege?.name}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400">TOKEN</span>
                      <h4 className="text-base font-black text-blue-600 leading-none">{ord.tokenNumber}</h4>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      ord.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      ord.status === 'Ready' ? 'bg-blue-100 text-blue-800' :
                      ord.status === 'Preparing' ? 'bg-amber-100 text-amber-800' :
                      ord.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {ord.status}
                    </span>
                  </div>

                  <div className="text-xs">
                    <span className="font-bold text-slate-800">{ord.studentName}</span>
                    <span className="text-slate-400 ml-1.5 font-mono">({ord.studentId})</span>
                  </div>

                  {/* Order items */}
                  <div className="p-2.5 rounded-xl bg-slate-50 space-y-1 text-xs">
                    {(ord.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between font-semibold text-slate-700">
                        <span>{it.quantity}x {it.item?.name || 'Dish'}</span>
                        <span>₹{it.item?.price ? it.item.price * it.quantity : 0}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-200/60 flex justify-between font-black text-slate-900">
                      <span>Total</span>
                      <span>₹{ord.totalAmount}</span>
                    </div>
                  </div>

                  {/* Payment & Action buttons */}
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-extrabold text-slate-500">
                      {ord.paymentMethod === 'ONLINE' ? '💳 Online Paid' : '💵 Pay at Canteen'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {ord.status === 'Confirmed' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'Preparing')}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px]"
                        >
                          Start Prep
                        </button>
                      )}
                      {ord.status === 'Preparing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'Ready')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px]"
                        >
                          Ready Pickup
                        </button>
                      )}
                      {ord.status === 'Ready' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'Completed')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px]"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADD / EDIT DISH MODAL (SUPABASE STORAGE SUPPORT) */}
      {/* ==================================================================== */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative my-8 animate-scale-up">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5" />
                <h3 className="text-base font-black">
                  {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
                </h3>
              </div>
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa with Sambar & Chutney"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Crispy fermented crepe made from rice batter and black lentils..."
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (INR ₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-extrabold bg-slate-50 focus:outline-none"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Meals">Meals</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Healthy Food">Healthy Food</option>
                    <option value="Specials">Specials</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={dishPrepTime}
                    onChange={(e) => setDishPrepTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={dishStock}
                    onChange={(e) => setDishStock(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={dishDiscount}
                    onChange={(e) => setDishDiscount(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* Photo Upload with Supabase Storage 'food-images' */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dish Photograph</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                    <img
                      src={dishImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.src = '/images/food/placeholder.jpg'; }}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="dish-photo-input"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="dish-photo-input"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>{uploadingImage ? 'Uploading to Supabase Storage...' : 'Upload Real Photo'}</span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">Saved directly to Supabase Storage `food-images` bucket</p>
                  </div>
                </div>
              </div>

              {/* Pure Veg Badge Notification */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                  <span className="text-xs font-black text-emerald-900">100% Pure Vegetarian</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  Enforced
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishIsSpecial}
                    onChange={(e) => setDishIsSpecial(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Mark as Today's Special ⭐</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDishModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDish}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    {savingDish ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{editingItem ? 'Update Dish' : 'Add Dish'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
