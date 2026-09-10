import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function FigmaSignInForm({ onLoginSuccess }) {
  const { login, verify2FA, loading: authLoading } = useAuth();

  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('hr.manager@mms.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successUser, setSuccessUser] = useState(null);

  // 2FA step state
  const [totpCode, setTotpCode] = useState('');
  const totpRef = useRef(null);

  useEffect(() => {
    if (step === '2fa' && totpRef.current) {
      totpRef.current.focus();
    }
  }, [step]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await login({ email: email.trim(), password });

    if (res.success) {
      setSuccessUser(res.user);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onLoginSuccess) onLoginSuccess(res.user);
      }, 500);
    } else if (res.require_2fa) {
      setIsSubmitting(false);
      setStep('2fa');
      setErrorMsg('');
    } else {
      setIsSubmitting(false);
      setErrorMsg(res.error || 'Invalid corporate email. Please check your credentials.');
    }
  };

  const handleTotpSubmit = async (e) => {
    e.preventDefault();
    const code = totpCode.replace(/\s/g, '');
    if (code.length !== 6) {
      setErrorMsg('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await verify2FA({ email: email.trim(), totp_code: code });

    if (res.success) {
      setSuccessUser(res.user);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onLoginSuccess) onLoginSuccess(res.user);
      }, 500);
    } else {
      setIsSubmitting(false);
      setErrorMsg(res.error || 'Invalid verification code. Please try again.');
      setTotpCode('');
    }
  };

  const handleBackToLogin = () => {
    setStep('credentials');
    setTotpCode('');
    setErrorMsg('');
  };

  // --- Success Splash Animation ---
  if (successUser) {
    return (
      <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center items-center py-10 text-center animate-pulse-success">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/20 mb-5">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full mb-3">
          Session Authenticated
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          Welcome back, {successUser.full_name || 'User'}!
        </h2>
        <p className="text-xs text-slate-500 font-medium mb-6">
          Initializing your enterprise dashboard &amp; permissions...
        </p>
        <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // --- Step 2: 2FA Verification UI ---
  if (step === '2fa') {
    return (
      <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center py-6 sm:py-8 animate-step-slide">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <div className="flex items-baseline space-x-1.5">
              <span className="font-black text-slate-900 text-lg tracking-tight">MICROFINANCIAL</span>
              <span className="font-black text-emerald-600 text-lg tracking-tight">MMS</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              HR &amp; Payroll Platform
            </span>
          </div>
        </div>

        {/* 2FA Heading */}
        <div className="space-y-1.5 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            VERIFY 2FA
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Enter the 6-digit code from Google Authenticator for <span className="font-semibold text-slate-700">{email}</span>
          </p>
        </div>

        {/* 2FA Form */}
        <form onSubmit={handleTotpSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-2xl bg-red-50 text-red-700 border border-red-200 flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Authentication Code
            </label>
            <input
              ref={totpRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={totpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setTotpCode(val);
              }}
              placeholder="000000"
              className="w-full px-5 py-4 text-2xl font-black tracking-[0.4em] text-center rounded-2xl bg-[#f0f4f9] border border-transparent focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-300"
            />
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Enter the rotating 6-digit code from your app
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || authLoading || totpCode.length < 6}
            className="w-full mt-2 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
          >
            {isSubmitting || authLoading ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Verifying...</span>
              </span>
            ) : (
              <span>Verify &amp; Continue</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleBackToLogin}
            className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </button>
        </form>
      </div>
    );
  }


  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center py-6 sm:py-8 animate-login-enter">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 mb-7">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 shrink-0">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
          <div className="flex items-baseline space-x-1.5">
            <span className="font-black text-slate-900 text-lg tracking-tight">MICROFINANCIAL</span>
            <span className="font-black text-emerald-600 text-lg tracking-tight">MMS</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
            HR & Payroll Platform
          </span>
        </div>
      </div>

      {/* Main Heading */}
      <div className="space-y-1.5 mb-7">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
          SIGN IN NOW
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Sign in to your Microfinancial Management System account
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs rounded-2xl bg-red-50 text-red-700 border border-red-200 flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2">
            E-mail
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full pl-11 pr-4 py-3.5 text-sm rounded-2xl bg-[#f0f4f9] border border-transparent focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-11 pr-24 py-3.5 text-sm rounded-2xl bg-[#f0f4f9] border border-transparent focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
            >
              {showPassword ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => alert('Password reset link has been dispatched to your corporate email.')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Primary Emerald Green Login Button */}
        <button
          type="submit"
          disabled={isSubmitting || authLoading}
          className="w-full mt-3 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] group"
        >
          {isSubmitting || authLoading ? (
            <span className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Signing in...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <span>Login</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
