import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ACCENT } from '../../theme';
import { 
  User, 
  ShieldCheck, 
  Palette, 
  Bell, 
  Lock, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Moon, 
  Sun, 
  Type, 
  Save, 
  RefreshCw,
  Eye,
  EyeOff,
  Sliders
} from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';

const ACCENT_PRESETS = [
  { name: 'Royal Blue (Default)', hex: '#2E6BE6', bg: 'bg-[#2E6BE6]' },
  { name: 'Emerald Forest', hex: '#059669', bg: 'bg-[#059669]' },
  { name: 'Indigo Violet', hex: '#6366F1', bg: 'bg-[#6366F1]' },
  { name: 'Amber Gold', hex: '#D97706', bg: 'bg-[#D97706]' },
  { name: 'Slate Steel', hex: '#475569', bg: 'bg-[#475569]' }
];

export default function SettingsView() {
  const { user, updateUser } = useAuth();
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Username / Email Form State
  const [email, setEmail] = useState(user?.email || '');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // UI Config State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('mms_theme') === 'dark';
  });
  const [selectedAccent, setSelectedAccent] = useState(() => {
    return localStorage.getItem('mms_accent_color') || '#2E6BE6';
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('mms_font_size') || 'normal';
  });
  const [uiSavedFeedback, setUiSavedFeedback] = useState(false);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('mms_notif_preferences');
      return saved ? JSON.parse(saved) : {
        all_enabled: true,
        payroll: true,
        attendance: true,
        microloans: true,
        compensation: true,
        claims: true,
        security: true,
        frequency: 'instant'
      };
    } catch {
      return {
        all_enabled: true,
        payroll: true,
        attendance: true,
        microloans: true,
        compensation: true,
        claims: true,
        security: true,
        frequency: 'instant'
      };
    }
  });
  const [notifSavedFeedback, setNotifSavedFeedback] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Apply UI Dark Mode
  const toggleDarkMode = (enableDark) => {
    setIsDarkMode(enableDark);
    if (enableDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('mms_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('mms_theme', 'light');
    }
    setUiSavedFeedback(true);
    setTimeout(() => setUiSavedFeedback(false), 2000);
  };

  // Apply Accent Color
  const handleAccentChange = (hex) => {
    setSelectedAccent(hex);
    document.documentElement.style.setProperty('--mf-accent', hex);
    localStorage.setItem('mms_accent_color', hex);
    setUiSavedFeedback(true);
    setTimeout(() => setUiSavedFeedback(false), 2000);
  };

  // Apply Font Size
  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('mms_font_size', size);
    if (size === 'compact') {
      document.documentElement.style.fontSize = '13px';
    } else if (size === 'comfortable') {
      document.documentElement.style.fontSize = '15px';
    } else {
      document.documentElement.style.fontSize = '14px';
    }
    setUiSavedFeedback(true);
    setTimeout(() => setUiSavedFeedback(false), 2000);
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const res = await api.updateProfile({ full_name: fullName.trim() });
      if (res && res.success) {
        updateUser(res.user);
        setProfileMessage({ type: 'success', text: 'Profile name successfully updated!' });
      } else {
        setProfileMessage({ type: 'error', text: res?.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Email / Username Update
  const handleSaveEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const res = await api.updateProfile({ email: email.trim() });
      if (res && res.success) {
        updateUser(res.user);
        setEmailMessage({ type: 'success', text: 'Username / Email address updated successfully!' });
      } else {
        setEmailMessage({ type: 'error', text: res?.error || 'Failed to update email address.' });
      }
    } catch (err) {
      setEmailMessage({ type: 'error', text: err.message });
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill out all password fields.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      if (res && res.success) {
        setPasswordMessage({ type: 'success', text: 'Password successfully updated! Use your new password on next login.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: res?.error || 'Password update failed. Verify current password.' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Notifications Save
  const toggleNotification = (key) => {
    setNotifPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('mms_notif_preferences', JSON.stringify(updated));
      return updated;
    });
    setNotifSavedFeedback(true);
    setTimeout(() => setNotifSavedFeedback(false), 2000);
  };

  const handleToggleAllNotifs = () => {
    setNotifPrefs(prev => {
      const target = !prev.all_enabled;
      const updated = {
        ...prev,
        all_enabled: target,
        payroll: target,
        attendance: target,
        microloans: target,
        compensation: target,
        claims: target,
        security: target
      };
      localStorage.setItem('mms_notif_preferences', JSON.stringify(updated));
      return updated;
    });
    setNotifSavedFeedback(true);
    setTimeout(() => setNotifSavedFeedback(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'security', label: 'Account & Password', icon: Lock },
    { id: 'ui_config', label: 'UI & Theme Preferences', icon: Palette },
    { id: 'notifications', label: 'Notification Settings', icon: Bell }
  ];

  const initials = user?.initials || (user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'LG');

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#2E6BE6]">
            <Sliders className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold font-display text-slate-900">
            Account Settings &amp; Preferences
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal profile, credentials, appearance themes, and notification triggers
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E4E8F0] pb-px overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={isActive ? {
                borderBottomColor: 'var(--mf-accent, #2E6BE6)',
                color: 'var(--mf-accent, #2E6BE6)',
                background: 'color-mix(in srgb, var(--mf-accent, #2E6BE6) 12%, transparent)'
              } : {}}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap rounded-t-lg ${
                !isActive 
                  ? 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300' 
                  : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-[14px] border border-[#E4E8F0] p-6 shadow-xs space-y-6 animate-module-fade">
          <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center text-lg font-extrabold font-display shadow-md">
              {initials}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{user?.full_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#2E6BE6] border border-blue-200">
                  {user?.role_label || 'User'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{user?.email}</span>
              </div>
            </div>
          </div>

          {profileMessage && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              profileMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-xs outline-none focus:border-[#2E6BE6] bg-slate-50/50 focus:bg-white transition-all font-medium"
                placeholder="e.g. Liza Gomez"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This name will appear across approval flows, payslips, and official BIR statutory compliance filings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned System Role
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.role_label || user?.role || ''}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Scope
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.description || 'Active MMS Member'}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-5 py-2 bg-[#2E6BE6] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {profileLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Account & Password Security */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-module-fade">
          {/* Change Email / Username Card */}
          <div className="bg-white rounded-[14px] border border-[#E4E8F0] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Mail className="w-4 h-4 text-[#2E6BE6]" />
              <h2 className="text-sm font-bold text-slate-900">Change Account Username &amp; Email</h2>
            </div>

            {emailMessage && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                emailMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {emailMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{emailMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmail} className="max-w-xl space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Email (Login Identifier)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-xs outline-none focus:border-[#2E6BE6] bg-slate-50/50 focus:bg-white transition-all font-mono"
                  placeholder="user@mms.com"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  You will use this email address to sign into the Microfinancial Management System.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={emailLoading || email === user?.email}
                  className="px-4 py-2 bg-[#2E6BE6] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {emailLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Email Address</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-[14px] border border-[#E4E8F0] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="w-4 h-4 text-[#2E6BE6]" />
              <h2 className="text-sm font-bold text-slate-900">Change Account Password</h2>
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                passwordMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="max-w-xl space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password (Default: Password123!)"
                    className="w-full pl-3.5 pr-10 py-2 border border-[#E4E8F0] rounded-lg text-xs outline-none focus:border-[#2E6BE6] bg-slate-50/50 focus:bg-white transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full pl-3.5 pr-10 py-2 border border-[#E4E8F0] rounded-lg text-xs outline-none focus:border-[#2E6BE6] bg-slate-50/50 focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-xs outline-none focus:border-[#2E6BE6] bg-slate-50/50 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 bg-[#2E6BE6] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {passwordLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: UI & Theme Preferences */}
      {activeTab === 'ui_config' && (
        <div className="bg-white rounded-[14px] border border-[#E4E8F0] p-6 shadow-xs space-y-6 animate-module-fade">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">User Interface &amp; Appearance</h2>
              <p className="text-xs text-slate-400">Configure theme mode, primary accent colors, and font scaling</p>
            </div>
            {uiSavedFeedback && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
          </div>

          {/* Dark / Light Mode Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              Theme Mode (Full Application)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <button
                type="button"
                onClick={() => toggleDarkMode(false)}
                className={`p-4 rounded-xl border-2 flex items-center gap-3 text-left transition-all cursor-pointer ${
                  !isDarkMode 
                    ? 'border-[#2E6BE6] bg-blue-50/50 shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Light Mode (Default)</div>
                  <div className="text-[11px] text-slate-500">Crisp, clean MicroFin OS canvas (#F5F7FA)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleDarkMode(true)}
                className={`p-4 rounded-xl border-2 flex items-center gap-3 text-left transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'border-[#2E6BE6] bg-blue-50/50 shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-slate-900 text-sky-400">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Dark Mode</div>
                  <div className="text-[11px] text-slate-500">High-contrast deep navy theme (#0B1F3A)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Accent Color Presets */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Primary Accent &amp; Button Color
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Customizes primary action buttons, active navigation badges, tabs, and indicator bars throughout the system.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {ACCENT_PRESETS.map(preset => {
                const isSelected = selectedAccent === preset.hex;
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handleAccentChange(preset.hex)}
                    style={isSelected ? {
                      borderColor: preset.hex,
                      boxShadow: `0 0 0 2px ${preset.hex}33`,
                      background: `color-mix(in srgb, ${preset.hex} 8%, transparent)`
                    } : {}}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected 
                        ? 'font-bold' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span 
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs" 
                      style={{ background: preset.hex }} 
                    />
                    <span>{preset.name}</span>
                    {isSelected && (
                      <CheckCircle2 
                        className="w-4 h-4 ml-1 shrink-0" 
                        style={{ color: preset.hex }} 
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Visual Feedback Showcase */}
            <div className="mt-4 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Live System Theme Preview
                </span>
                <span 
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                  style={{
                    background: 'color-mix(in srgb, var(--mf-accent, #2E6BE6) 15%, transparent)',
                    color: 'var(--mf-accent, #2E6BE6)'
                  }}
                >
                  Active Color
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Primary Action Button Preview */}
                <button
                  type="button"
                  style={{ background: 'var(--mf-accent, #2E6BE6)' }}
                  className="px-4 py-2 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-default"
                >
                  <span>Primary Action Button</span>
                </button>

                {/* Soft Tag / Pill Preview */}
                <span
                  style={{
                    background: 'color-mix(in srgb, var(--mf-accent, #2E6BE6) 12%, transparent)',
                    color: 'var(--mf-accent, #2E6BE6)',
                    borderColor: 'color-mix(in srgb, var(--mf-accent, #2E6BE6) 25%, transparent)'
                  }}
                  className="px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--mf-accent, #2E6BE6)' }} />
                  System Tag &amp; Badge
                </span>

                {/* Highlight Text Preview */}
                <span 
                  style={{ color: 'var(--mf-accent, #2E6BE6)' }} 
                  className="text-xs font-black tracking-tight"
                >
                  {privacyMode ? '₱•••••• (Net Metric)' : '₱250,749.00 (Net Metric)'}
                </span>
              </div>
            </div>
          </div>

          {/* Font Size Scaling */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Interface Font Size
            </label>
            <div className="flex items-center gap-3 max-w-md">
              {[
                { id: 'compact', label: 'Compact (13px)' },
                { id: 'normal', label: 'Default (14px)' },
                { id: 'comfortable', label: 'Comfortable (15px)' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleFontSizeChange(opt.id)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                    fontSize === opt.id 
                      ? 'border-[#2E6BE6] bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2E6BE6]' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Financial Privacy Mode Setting */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Financial Privacy Mode (GCash-Style Masking)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg">
                  When enabled, all sensitive monetary values across payroll sheets, compensation packages, loan balances, and dashboards are masked by default (e.g. ₱••••••). You can still reveal figures on demand via quick eye toggles.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={togglePrivacyMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  privacyMode ? 'bg-[#2E6BE6]' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    privacyMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${privacyMode ? 'bg-blue-100 dark:bg-blue-900/40 text-[#2E6BE6]' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Current Privacy Status: {privacyMode ? 'Masked (Privacy Mode Active)' : 'Revealed (Standard Numbers Visible)'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sample Value Display: <span className="font-mono font-bold text-slate-800 dark:text-white">{privacyMode ? '₱••••••' : '₱250,749.00'}</span>
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                privacyMode 
                  ? 'bg-blue-100 text-[#2E6BE6] border border-blue-200' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {privacyMode ? 'PROTECTED' : 'VISIBLE'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-[14px] border border-[#E4E8F0] p-6 shadow-xs space-y-6 animate-module-fade">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Notification Triggers &amp; Channels</h2>
              <p className="text-xs text-slate-400">Control real-time notifications for payroll milestones and approval queues</p>
            </div>
            {notifSavedFeedback && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> Preferences Updated!
              </span>
            )}
          </div>

          {/* Master Toggle */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Enable In-App Notifications</div>
              <div className="text-[11px] text-slate-500">Master switch for topbar notifications flyout &amp; sound alerts</div>
            </div>
            <button
              type="button"
              onClick={handleToggleAllNotifs}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                notifPrefs.all_enabled ? 'bg-[#2E6BE6]' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                notifPrefs.all_enabled ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Granular Toggles */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Module Categories</h3>

            {[
              { key: 'payroll', label: 'Payroll Approvals & Disbursals', desc: 'Alerts when payroll periods are computed, approved by Finance Director, or finalized' },
              { key: 'attendance', label: 'Overtime & Timekeeping Approvals', desc: 'Sign-off notifications for employee overtime, night diff, and holiday premiums' },
              { key: 'microloans', label: 'Microloan Application Events', desc: 'Notifies when emergency loans are requested or amortization schedules are updated' },
              { key: 'compensation', label: 'Salary Structure & Adjustment Requests', desc: 'Notifies on merit increases, pay grade promotions, and allowance adjustments' },
              { key: 'claims', label: 'Expense Claim Reimbursements', desc: 'Status updates when employee expense claims are verified or included in payroll' },
              { key: 'security', label: 'Security & Integrity Alerts', desc: 'Critical alerts on 2FA activation, failed login attempts, or password resets' }
            ].map(item => (
              <div 
                key={item.key} 
                className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">{item.label}</div>
                  <div className="text-[11px] text-slate-400 max-w-lg">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification(item.key)}
                  disabled={!notifPrefs.all_enabled}
                  className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0 ml-4 ${
                    !notifPrefs.all_enabled ? 'opacity-40 cursor-not-allowed bg-slate-300' :
                    notifPrefs[item.key] ? 'bg-[#2E6BE6]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                    notifPrefs[item.key] && notifPrefs.all_enabled ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
