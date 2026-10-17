import React, { useState } from 'react';
import { ShoppingBag, User as UserIcon, ChefHat, Truck, Shield, Store, LogOut, Bell, Menu, X, Calendar, MapPin, Building2 } from 'lucide-react';
import { User, College } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  openCart: () => void;
  currentUser: User | null;
  openAuth: () => void;
  onLogout: () => void;
  colleges?: College[];
  selectedCollegeId?: string;
  onSelectCollege?: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  currentUser,
  openAuth,
  onLogout,
  colleges = [],
  selectedCollegeId,
  onSelectCollege
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Lunch Window Open', desc: 'Pre-order for 12:15 PM – 12:30 PM slot to skip queue.', time: '10m ago' },
    { id: 2, title: "Today's Special Live", desc: 'Karnataka Bisi Bele Bhath with golden boondi & ghee ready.', time: '25m ago' },
    { id: 3, title: 'Room Delivery Available', desc: 'Hostel Blocks A & B delivery runners are on standby.', time: '1h ago' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => { setActiveTab('menu'); setMobileMenuOpen(false); }}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            🍔
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
                Smart<span className="text-blue-600">Canteen</span>
              </span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                🟢 PURE VEG
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              Campus Food Platform
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              activeTab === 'menu'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🍽️ Food Menu
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📦 My Orders
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'tracking'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>📍 Live Tracking</span>
          </button>

          <button
            onClick={() => setActiveTab('staff-desk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'staff-desk'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-600" />
            Kitchen Desk
          </button>

          <button
            onClick={() => setActiveTab('kitchen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'kitchen'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-500" />
            KDS Board
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'delivery'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-emerald-500" />
            Runner
          </button>

          <button
            onClick={() => setActiveTab('operator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'operator'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-purple-500" />
            Operator
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Admin
          </button>

          <button
            onClick={() => setActiveTab('college-management')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'college-management'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 hover:text-indigo-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>College Management</span>
          </button>
        </nav>

        {/* Right Actions: Notifications, Cart, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all border border-slate-200/80 relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-scale-up">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Campus Alerts</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">3 New</span>
                </div>
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                        <span>{n.title}</span>
                        <span className="text-[10px] font-medium text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-600 mt-0.5 leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs sm:text-sm transition-all border border-blue-200/60 shadow-sm active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] sm:text-xs font-black text-white bg-blue-600 rounded-full shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile / Auth Button */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileModal(!showProfileModal)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all border border-slate-200"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <span className="text-xs font-black text-slate-900 block truncate max-w-[110px] leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-600 block uppercase leading-none">
                    {currentUser.role}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileModal && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                  <div className="pb-3 border-b border-slate-100 mb-3">
                    <p className="text-sm font-black text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      ID: {currentUser.studentId || 'FAC-2026'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-bold text-slate-700">
                    <button
                      onClick={() => { setActiveTab('orders'); setShowProfileModal(false); }}
                      className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>📦 My Order History</span>
                    </button>
                    <button
                      onClick={() => { onLogout(); setShowProfileModal(false); }}
                      className="w-full text-left py-2 px-3 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-between"
                    >
                      <span>Log Out</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2 animate-slide-down">
          <button
            onClick={() => { setActiveTab('menu'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-black ${
              activeTab === 'menu' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            🍽️ Food Menu
          </button>
          <button
            onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-black ${
              activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            📦 My Orders & Digital Tokens
          </button>
          <button
            onClick={() => { setActiveTab('tracking'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-black flex items-center gap-2 ${
              activeTab === 'tracking' ? 'bg-emerald-600 text-white' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>📍 Live Order Tracking</span>
          </button>
          <button
            onClick={() => { setActiveTab('staff-desk'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-black ${
              activeTab === 'staff-desk' ? 'bg-amber-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            👨‍🍳 Canteen Staff Live Desk
          </button>
          <button
            onClick={() => { setActiveTab('kitchen'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-black ${
              activeTab === 'kitchen' ? 'bg-amber-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            👨‍🍳 Kitchen KDS Display
          </button>
          <button
            onClick={() => { setActiveTab('delivery'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-black ${
              activeTab === 'delivery' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            🚚 Delivery Runner Queue
          </button>
          <button
            onClick={() => { setActiveTab('operator'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-black ${
              activeTab === 'operator' ? 'bg-purple-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            🏪 Counter Operator Desk
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-black ${
              activeTab === 'admin' ? 'bg-rose-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            🛡️ Admin Management Portal
          </button>
          <button
            onClick={() => { setActiveTab('college-management'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-black ${
              activeTab === 'college-management' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            🏛️ College Management Platform
          </button>
        </div>
      )}
    </header>
  );
};
