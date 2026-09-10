import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  KeyRound,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TwoFactorModal({ onClose, onStatusChange }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.get2FAStatus();
      setTwoFactorEnabled(Boolean(data.two_factor_enabled));
    } catch (_) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    setIsSettingUp(true);
    setErrorMsg('');
    setSuccessMsg('');
    setTotpCode('');
    try {
      const data = await api.setup2FA();
      setSetupData(data);
    } catch (err) {
      setErrorMsg('Failed to initialize 2FA setup. Please try again.');
    }
  };

  const copySecret = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!totpCode.trim() || totpCode.trim().length !== 6) {
      setErrorMsg('Please enter the complete 6-digit code from Google Authenticator.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.activate2FA(setupData.secret, totpCode.trim());
      if (res.success) {
        setTwoFactorEnabled(true);
        setIsSettingUp(false);
        setSetupData(null);
        setSuccessMsg('✅ Google Authenticator 2FA is now active on your account!');
        if (onStatusChange) onStatusChange(true);
      } else {
        setErrorMsg(res.error || 'Invalid code. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error verifying code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication? Your account will only be protected by your password.')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.disable2FA();
      if (res.success) {
        setTwoFactorEnabled(false);
        setIsSettingUp(false);
        setSetupData(null);
        setSuccessMsg('Two-Factor Authentication has been disabled.');
        if (onStatusChange) onStatusChange(false);
      } else {
        setErrorMsg(res.error || 'Failed to disable 2FA.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error disabling 2FA.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Full-screen Backdrop with Blur */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md -z-10" onClick={onClose} />

      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0c1024] via-[#1a203c] to-[#0c1024] p-5 sm:p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-md shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Two-Factor Authentication
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Google Authenticator (RFC 6238 TOTP)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-start space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              <span className="text-xs">Checking security status...</span>
            </div>
          ) : twoFactorEnabled && !isSettingUp ? (
            /* --- STATE 1: 2FA IS CURRENTLY ACTIVE --- */
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>2FA IS ACTIVELY ENFORCED</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 pt-2">
                  Account Protected by Google Authenticator
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Every sign-in to this corporate account requires both your password and a live 6-digit TOTP code generated on your authenticator device.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Protected Account:</span>
                  <span className="font-mono font-medium text-slate-600">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Algorithm:</span>
                  <span className="text-slate-600">HMAC-SHA1 (RFC 6238 standard)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Time-step Window:</span>
                  <span className="text-slate-600">30 seconds</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDisable}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : isSettingUp && setupData ? (
            /* --- STATE 2: SETUP IN PROGRESS (SCAN QR CODE) --- */
            <form onSubmit={handleActivate} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Scan QR Code with Google Authenticator
                </h3>
                <p className="text-xs text-slate-500">
                  Open Google Authenticator, tap <strong>+</strong>, and scan the QR code below.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                {setupData.qr_code ? (
                  <img
                    src={setupData.qr_code}
                    alt="Google Authenticator QR Code"
                    className="w-48 h-48 rounded-xl shadow-sm border border-slate-200 bg-white p-1"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Generating QR Code...
                  </div>
                )}

                {/* Manual Secret Key */}
                <div className="mt-3 text-center w-full max-w-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Can't scan? Enter key manually:
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800">
                    <span className="truncate mr-2">{setupData.secret}</span>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Copy Key"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 6-Digit Verification Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 text-center">
                  Enter 6-digit confirmation code from your app
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  pattern="\d{6}"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsSettingUp(false); setSetupData(null); }}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || totpCode.length !== 6}
                  className="w-2/3 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Activate 2FA'}
                </button>
              </div>
            </form>
          ) : (
            /* --- STATE 3: 2FA IS DISABLED --- */
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  <span>STATUS: DISABLED</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 pt-2">
                  Enable Google Authenticator 2FA
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Add an extra layer of protection to your corporate account. You'll need your password and an authenticator code to sign in.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 text-slate-600">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Works with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>Authy</strong></span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Prevents unauthorized access even if your password is compromised</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>You can disable or reconfigure it anytime from this menu</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={startSetup}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Set Up Google Authenticator</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
