import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, LogOut, ChevronDown, Shield, ShieldCheck, CheckCheck, Clock, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import TwoFactorModal from '../security/TwoFactorModal';


const CATEGORY_META = {
  claim:      { icon: '📑', color: 'text-orange-500 bg-orange-50 border-orange-100' },
  payroll:    { icon: '💰', color: 'text-purple-600 bg-purple-50 border-purple-100' },
  attendance: { icon: '📋', color: 'text-blue-500 bg-blue-50 border-blue-100' },
  loan:       { icon: '💳', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  salary:     { icon: '📈', color: 'text-teal-600 bg-teal-50 border-teal-100' },
  system:     { icon: '🔔', color: 'text-slate-500 bg-slate-50 border-slate-100' },
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Navbar({ activeModule, categoryLabel, moduleLabel, onNavigate, taskCounts = {} }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);

  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const initials = user?.initials || (user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'LG');
  const displayName = user?.full_name || 'Liza Gomez';
  const displayRole = user?.role_label || 'HR Manager';
  const displayEmail = user?.email || 'hr.manager@mms.com';

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getNotifications();
      if (data?.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (_) { /* silent */ } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Instant Event Dispatcher: refresh notifications immediately (0ms) when any action occurs
    const handleInstantRefresh = () => {
      fetchNotifications();
    };
    window.addEventListener('mms:refresh-tasks', handleInstantRefresh);

    const interval = setInterval(fetchNotifications, 8000);
    return () => {
      window.removeEventListener('mms:refresh-tasks', handleInstantRefresh);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (bellOpen) fetchNotifications();
  }, [bellOpen, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) handleMarkRead(notif.id);
    if (notif.module_id && onNavigate) {
      onNavigate(notif.module_id);
      setBellOpen(false);
    }
  };

  const getCategoryMeta = (cat) => CATEGORY_META[cat] || CATEGORY_META['system'];

  return (
    <>
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
      {/* Left Breadcrumb & Module indicator */}
      <div key={activeModule} className="flex items-center space-x-3 animate-header-fade">
        <div className="w-1 h-5 bg-[#7c3aed] rounded-full shrink-0" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
            {categoryLabel || 'PAYROLL MANAGEMENT'}
          </span>
          <span className="text-sm font-bold text-slate-900 leading-tight">
            {moduleLabel || 'Payroll Computation'}
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#f3e8ff] text-[#7c3aed] text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
          {categoryLabel || 'Payroll Management'}
        </span>
      </div>

      {/* Right: Search, Bell, Logout, Avatar */}
      <div className="flex items-center space-x-3">
        {/* Search Bar */}
        <div className="relative hidden md:block w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employees, claims..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none transition-all"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(prev => !prev)}
            className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <Bell className="w-3.5 h-3.5 text-[#7c3aed]" />
                  <span className="text-sm font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center space-x-1 text-[10px] font-semibold text-[#7c3aed] hover:text-purple-800 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center space-y-1">
                    <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const meta = getCategoryMeta(notif.category);
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full text-left px-4 py-3 flex items-start space-x-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer ${!notif.is_read ? 'bg-purple-50/40' : ''}`}
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 border ${meta.color} mt-0.5`}>
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs leading-snug ${notif.is_read ? 'text-slate-600 font-medium' : 'text-slate-900 font-bold'}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="w-2.5 h-2.5 text-slate-300" />
                            <span className="text-[9px] text-slate-400">{timeAgo(notif.created_at)}</span>
                            {notif.priority === 'high' && (
                              <>
                                <span className="text-slate-200">•</span>
                                <AlertCircle className="w-2.5 h-2.5 text-red-400" />
                                <span className="text-[9px] text-red-500 font-semibold">Priority</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Info className="w-2.5 h-2.5" />
                  <span>Click a notification to jump to the related module</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out of MMS"
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="User Profile Menu"
            className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#7c3aed] text-white font-bold flex items-center justify-center text-xs shadow-sm hover:ring-2 hover:ring-purple-300 transition-all">
              {initials}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-bold text-slate-900 text-sm">{displayName}</div>
                <div className="text-xs text-slate-500 truncate">{displayEmail}</div>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-purple-50 text-[#7c3aed] font-semibold text-[10px] border border-purple-100">
                  {displayRole}
                </span>
              </div>
              <div className="px-4 py-2 border-b border-slate-100 text-[11px] text-slate-500 flex items-center space-x-1.5">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span>Session Active • OAuth 2.0 / JWT</span>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { setDropdownOpen(false); setShow2FAModal(true); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center justify-between space-x-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Two-Factor Authentication</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${twoFactorEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {twoFactorEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    {show2FAModal && (
      <TwoFactorModal
        onClose={() => setShow2FAModal(false)}
        onStatusChange={(enabled) => setTwoFactorEnabled(enabled)}
      />
    )}
    </>
  );
}
