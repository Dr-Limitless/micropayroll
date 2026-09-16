import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, Bell, LogOut, ChevronDown, Shield, ShieldCheck, CheckCheck, Clock, AlertCircle, Info, X, ArrowRight, Settings, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePrivacy } from '../../context/PrivacyContext';
import { api } from '../../services/api';
import TwoFactorModal from '../security/TwoFactorModal';
import { ACCENT } from '../../theme';

const SEARCHABLE_MODULES = [
  { id: 'payroll_computation', label: 'Payroll Computation', category: 'Payroll Management', keywords: 'salary pay net gross computation formula tax sss philhealth pagibig' },
  { id: 'timekeeping', label: 'Timekeeping & Attendance Integration', category: 'Payroll Management', keywords: 'overtime holiday attendance biometric punch shift tardy' },
  { id: 'payslips', label: 'Payslip Generation & Payroll Records', category: 'Payroll Management', keywords: 'payslip download print compensation advice sha256' },
  { id: 'salary_structure', label: 'Salary Structure Configuration', category: 'Compensation Planning', keywords: 'grade band l1 l2 l3 l4 base pay min max' },
  { id: 'allowances', label: 'Allowances & Incentive Management', category: 'Compensation Planning', keywords: 'de minimis rice laundry clothing transportation stipend' },
  { id: 'salary_adjustment', label: 'Salary Adjustment Management', category: 'Compensation Planning', keywords: 'raise promotion merit increase effective date' },
  { id: 'claim_filing', label: 'Employee Claim Filing', category: 'Claims & Reimbursement', keywords: 'expense receipt reimburse medical prescription travel' },
  { id: 'claim_verification', label: 'Claim Verification & Approval', category: 'Claims & Reimbursement', keywords: 'audit approve reject clm reimbursement queue' },
  { id: 'reimbursement', label: 'Reimbursement Processing & Monitoring', category: 'Claims & Reimbursement', keywords: 'disbursement payout microfinance microloan advance' },
  { id: 'benefits_enrollment', label: 'Benefits Enrollment & Management', category: 'HMO & Benefits Administration', keywords: 'hmo maxicare intellicare medicard life insurance' },
  { id: 'hmo_contribution', label: 'HMO Contribution Management', category: 'HMO & Benefits Administration', keywords: 'premium employer employee share dependent' },
  { id: 'benefits_monitoring', label: 'Employee Benefits Monitoring', category: 'HMO & Benefits Administration', keywords: 'utilization coverage cardholder tier' },
  { id: 'realtime_dashboard', label: 'Real-Time Payroll Dashboard', category: 'HR Analytics Dashboard', keywords: 'analytics gross deductions net chart kpi' },
  { id: 'financial_reporting', label: 'Financial Reporting', category: 'HR Analytics Dashboard', keywords: 'journal ledger voucher debit credit audit' },
  { id: 'government_compliance', label: 'Government Compliance Reports', category: 'HR Analytics Dashboard', keywords: 'sss philhealth pagibig bir 1601c 2316 schedule book table' },
  { id: 'audit_logs', label: 'Audit Logs', category: 'HR Analytics Dashboard', keywords: 'audit logs security trail event sha256 checksum activity history tamper' },
  { id: 'settings', label: 'Settings & Preferences', category: 'Account Preferences', keywords: 'settings profile password email username dark light mode notifications theme appearance font' }
];

const SEARCHABLE_EMPLOYEES = [
  { code: 'EMP-001', name: 'Maria Santos', dept: 'Engineering', pos: 'Senior Software Engineer', moduleId: 'payslips' },
  { code: 'EMP-002', name: 'Jose Reyes', dept: 'Product', pos: 'Principal Product Manager', moduleId: 'payslips' },
  { code: 'EMP-003', name: 'Marco Dela Cruz', dept: 'Engineering', pos: 'Lead DevOps & Cloud Engineer', moduleId: 'payslips' },
  { code: 'EMP-004', name: 'Ana Cruz', dept: 'Design', pos: 'Lead Product Designer', moduleId: 'payslips' },
  { code: 'EMP-005', name: 'Patricia Lim', dept: 'Human Resources', pos: 'Senior HR Generalist', moduleId: 'payslips' },
  { code: 'EMP-006', name: 'Roberto Diaz', dept: 'Operations', pos: 'Operations Specialist', moduleId: 'payslips' }
];

const SEARCHABLE_CLAIMS = [
  { code: 'CLM-2024-001', employee: 'Maria Santos', type: 'Medical & Dental Prescription', amount: '₱4,500.00', moduleId: 'claim_verification' },
  { code: 'CLM-2024-002', employee: 'Jose Reyes', type: 'Official Client Travel Allowance', amount: '₱6,200.00', moduleId: 'claim_verification' },
  { code: 'CLM-2024-003', employee: 'Marco Dela Cruz', type: 'Communication & Cloud Stipend', amount: '₱3,100.00', moduleId: 'claim_verification' },
  { code: 'CLM-2024-004', employee: 'Patricia Lim', type: 'Office Supplies & Onboarding Kit', amount: '₱5,000.00', moduleId: 'claim_verification' },
  { code: 'CLM-2024-005', employee: 'Ana Cruz', type: 'Personal Software Purchase', amount: '₱2,500.00', moduleId: 'claim_verification' },
  { code: 'CLM-2024-006', employee: 'Marco Dela Cruz', type: 'Emergency Client Transport', amount: '₱1,850.00', moduleId: 'claim_verification' }
];


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
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { modules: [], employees: [], claims: [] };

    const modules = SEARCHABLE_MODULES.filter(m => 
      m.label.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.keywords.toLowerCase().includes(q)
    ).slice(0, 4);

    const employees = SEARCHABLE_EMPLOYEES.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.code.toLowerCase().includes(q) ||
      e.dept.toLowerCase().includes(q) ||
      e.pos.toLowerCase().includes(q)
    ).slice(0, 4);

    const claims = SEARCHABLE_CLAIMS.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.employee.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q)
    ).slice(0, 4);

    return { modules, employees, claims };
  }, [searchQuery]);

  const handleSelectSearchResult = (targetModuleId) => {
    if (onNavigate) {
      onNavigate(targetModuleId);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

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
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
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
      <header className="bg-white dark:bg-[#0F172A] border-b border-[#E4E8F0] dark:border-[#1E293B] sticky top-0 z-30 px-6 sm:px-8 h-16 flex items-center justify-between transition-colors duration-200">
      {/* Left Breadcrumb & Module indicator */}
      <div key={activeModule} className="flex items-center space-x-3 animate-header-fade">
        <div className="w-1.5 h-6 rounded-full shrink-0 transition-colors" style={{ background: 'var(--mf-accent, #2E6BE6)' }} />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider leading-none">
            {categoryLabel || 'PAYROLL MANAGEMENT'}
          </span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="text-[17px] font-bold text-[#101828] dark:text-white leading-tight">
            {moduleLabel || 'Payroll Computation'}
          </span>
        </div>
        <span 
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all"
          style={{ 
            background: 'color-mix(in srgb, var(--mf-accent, #2E6BE6) 12%, transparent)', 
            color: 'var(--mf-accent, #2E6BE6)', 
            borderColor: 'color-mix(in srgb, var(--mf-accent, #2E6BE6) 25%, transparent)' 
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--mf-accent, #2E6BE6)' }} />
          {categoryLabel || 'Payroll Management'}
        </span>
      </div>

      {/* Right: Search, Bell, Avatar */}
      <div className="flex items-center space-x-3">
        {/* Global Search Bar */}
        <div className="relative hidden md:block w-64 sm:w-72" ref={searchRef}>
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setSearchOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchOpen(false);
            }}
            placeholder="Search employees, claims, modules..."
            className="w-full pl-9 pr-7 py-2 text-[13px] rounded-lg border border-[#E4E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B]/70 text-[#101828] dark:text-white placeholder:text-[#94A3B8] focus:bg-white dark:focus:bg-[#1E293B] focus:border-[#2E6BE6] focus:ring-1 focus:ring-[#2E6BE6] outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="absolute right-2.5 top-2.5 p-0.5 text-[#94A3B8] hover:text-[#475467] rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Search Autocomplete Dropdown */}
          {searchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl bg-white border border-[#E4E8F0] shadow-xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">
              {/* Modules Results */}
              {searchResults.modules.length > 0 && (
                <div className="p-2 border-b border-[#F1F5F9]">
                  <div className="text-[10px] uppercase font-bold text-[#64748B] px-2 py-1 tracking-wider">
                    Modules &amp; Tools
                  </div>
                  {searchResults.modules.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectSearchResult(m.id)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50/60 text-xs flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-[#2E6BE6]">{m.label}</div>
                        <div className="text-[10px] text-slate-400">{m.category}</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-[#2E6BE6] transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Employees Results */}
              {searchResults.employees.length > 0 && (
                <div className="p-2 border-b border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider">
                    Staff &amp; Employees
                  </div>
                  {searchResults.employees.map(e => (
                    <button
                      key={e.code}
                      onClick={() => handleSelectSearchResult(e.moduleId)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-xs flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center">
                          {e.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-emerald-700">{e.name}</div>
                          <div className="text-[10px] text-slate-400">{e.code} • {e.dept}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{e.pos}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Claims Results */}
              {searchResults.claims.length > 0 && (
                <div className="p-2 border-b border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider">
                    Claims &amp; Reimbursements
                  </div>
                  {searchResults.claims.map(c => (
                    <button
                      key={c.code}
                      onClick={() => handleSelectSearchResult(c.moduleId)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 text-xs flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-amber-700">{c.code} — {c.type}</div>
                        <div className="text-[10px] text-slate-400">{c.employee} • {c.amount}</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-amber-600 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {searchResults.modules.length === 0 && searchResults.employees.length === 0 && searchResults.claims.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No matching employees, claims, or modules found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Privacy Mode Toggle */}
        <button
          type="button"
          onClick={togglePrivacyMode}
          title={privacyMode ? 'Privacy Mode ON — Click to reveal values' : 'Privacy Mode OFF — Click to hide values'}
          className={`relative w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
            privacyMode
              ? 'text-white ring-2'
              : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-slate-300 hover:text-[#101828] dark:hover:text-white hover:bg-[#E2E8F0] dark:hover:bg-[#334155]'
          }`}
          style={privacyMode ? {
            background: 'var(--mf-accent, #2E6BE6)',
            boxShadow: '0 0 10px color-mix(in srgb, var(--mf-accent, #2E6BE6) 40%, transparent)',
            ringColor: 'var(--mf-accent, #2E6BE6)'
          } : {}}
        >
          {privacyMode
            ? <EyeOff className="w-4 h-4" />
            : <Eye className="w-4 h-4" />
          }
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(prev => !prev)}
            className="relative w-[34px] h-[34px] rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center text-[#64748B] dark:text-slate-300 hover:text-[#101828] dark:hover:text-white hover:bg-[#E2E8F0] dark:hover:bg-[#334155] cursor-pointer transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2E6BE6]" />
            )}
          </button>

          {/* Notifications Flyout */}
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#1E293B] shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B1426]">
                <div className="flex items-center space-x-2">
                  <Bell className="w-3.5 h-3.5 text-[#2E6BE6]" />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="text-sm font-bold text-[#101828] dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#2E6BE6] dark:text-blue-300 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center space-x-1 text-[11px] font-semibold text-[#2E6BE6] hover:text-blue-800 transition-colors cursor-pointer"
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

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="User Profile Menu"
            className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <div 
              className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-sm hover:ring-2 transition-all"
              style={{ background: 'var(--mf-accent, #2E6BE6)', '--tw-ring-color': 'var(--mf-accent, #2E6BE6)' }}
            >
              {initials}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1E293B]">
                <div className="font-bold text-slate-900 dark:text-white text-sm">{displayName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayEmail}</div>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#7c3aed] dark:text-purple-300 font-semibold text-[10px] border border-purple-100 dark:border-purple-800/40">
                  {displayRole}
                </span>
              </div>
              <div className="px-4 py-2 border-b border-slate-100 dark:border-[#1E293B] text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span>Session Active • OAuth 2.0 / JWT</span>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { setDropdownOpen(false); setShow2FAModal(true); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162238] rounded-xl flex items-center justify-between space-x-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Two-Factor Authentication</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${twoFactorEnabled ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    {twoFactorEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); onNavigate('settings'); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162238] rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Settings &amp; Preferences</span>
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
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
