import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { ACCENT } from '../../theme';
import { api } from '../../services/api';

export default function FigmaSignInForm({ onLoginSuccess }) {
  const { login, verify2FA, loading: authLoading } = useAuth();

  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('hr.manager@mms.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successUser, setSuccessUser] = useState(null);
  const [personas, setPersonas] = useState([]);

  // 2FA step state
  const [totpCode, setTotpCode] = useState('');
  const totpRef = useRef(null);

  useEffect(() => {
    // Load available test personas
    api.getPersonas().then(data => {
      if (data && data.personas) {
        setPersonas(data.personas);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (step === '2fa' && totpRef.current) {
      totpRef.current.focus();
    }
  }, [step]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your work email.');
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
      setErrorMsg(res.error || 'Invalid corporate credentials. Please try again.');
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

  const selectPersona = (pEmail) => {
    setEmail(pEmail);
    setPassword('password123');
    setErrorMsg('');
  };

  // --- Success Splash Animation ---
  if (successUser) {
    return (
      <div style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center', animation: 'fadeInUp .4s ease both', padding: '40px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'popIn .5s ease both' }}>
          <CheckCircle2 style={{ width: 32, height: 32, color: '#15803D' }} />
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 24, color: '#101828', marginBottom: 6 }}>
          Welcome back, {successUser.full_name || 'User'}!
        </div>
        <div style={{ fontSize: 13.5, color: '#64748B', marginBottom: 24 }}>
          Initializing your operations dashboard &amp; permissions...
        </div>
        <div style={{ width: 180, height: 4, background: '#E4E8F0', borderRadius: 10, margin: '0 auto', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: ACCENT, animation: 'shimmer 1.5s infinite' }} />
        </div>
      </div>
    );
  }

  // --- Step 2: 2FA Verification UI ---
  if (step === '2fa') {
    return (
      <div style={{ maxWidth: 420, margin: '0 auto', animation: 'fadeInUp .35s ease both' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <ShieldCheck style={{ width: 22, height: 22, color: ACCENT }} />
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 24, color: '#101828' }}>
          Two-Factor Authentication
        </div>
        <div style={{ fontSize: 13.5, color: '#64748B', marginTop: 4, marginBottom: 28 }}>
          Enter the 6-digit code for <strong style={{ color: '#344054' }}>{email}</strong>
        </div>

        <form onSubmit={handleTotpSubmit}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#DC2626', fontSize: 13, marginBottom: 16 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#344054', marginBottom: 6, display: 'block' }}>
              6-Digit Authenticator Code
            </label>
            <input
              ref={totpRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              style={{
                width: '100%',
                padding: '13px 14px',
                border: '1px solid #D0D5DD',
                borderRadius: 9,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '0.3em',
                textAlign: 'center',
                color: '#101828',
                background: '#fff',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || authLoading || totpCode.length < 6}
            style={{
              width: '100%',
              padding: 13,
              border: 'none',
              borderRadius: 9,
              background: ACCENT,
              color: '#fff',
              fontSize: 14.5,
              fontWeight: 600,
              cursor: isSubmitting || authLoading || totpCode.length < 6 ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || totpCode.length < 6 ? 0.75 : 1,
              transition: 'opacity .15s'
            }}
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
          </button>

          <button
            type="button"
            onClick={() => { setStep('credentials'); setTotpCode(''); setErrorMsg(''); }}
            style={{
              width: '100%',
              marginTop: 14,
              padding: 8,
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            <span>Back to sign in</span>
          </button>
        </form>
      </div>
    );
  }

  // --- Step 1: Credentials UI matching microfin-os-main ---
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', animation: 'loginSlideIn .5s ease both' }}>
      {/* Title matching microfin-os-main */}
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 26, color: '#101828', letterSpacing: '-.02em' }}>
        Welcome back
      </div>
      <div style={{ fontSize: 14, color: '#64748B', marginTop: 6, marginBottom: 28 }}>
        Sign in to your operations dashboard
      </div>

      {errorMsg && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#DC2626', fontSize: 13, marginBottom: 18 }}>
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#344054', marginBottom: 6, display: 'block' }}>
            Work email
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@microfin.io"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #D0D5DD',
                borderRadius: 9,
                fontSize: 14,
                color: '#101828',
                background: '#fff',
                outline: 'none'
              }}
              className="focus:border-[#2E6BE6] focus:ring-1 focus:ring-[#2E6BE6]"
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#344054', marginBottom: 6, display: 'block' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 14px',
                paddingRight: 64,
                border: '1px solid #D0D5DD',
                borderRadius: 9,
                fontSize: 14,
                color: '#101828',
                background: '#fff',
                outline: 'none'
              }}
              className="focus:border-[#2E6BE6] focus:ring-1 focus:ring-[#2E6BE6]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                fontSize: 12,
                color: '#64748B',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => alert('Password reset link has been dispatched to your corporate email.')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12.5,
              fontWeight: 600,
              color: ACCENT,
              cursor: 'pointer'
            }}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || authLoading}
          style={{
            width: '100%',
            padding: 13,
            border: 'none',
            borderRadius: 9,
            background: ACCENT,
            color: '#fff',
            fontSize: 14.5,
            fontWeight: 600,
            cursor: isSubmitting || authLoading ? 'wait' : 'pointer',
            opacity: isSubmitting ? 0.8 : 1,
            transition: 'opacity .15s, transform .1s',
            boxShadow: '0 2px 8px rgba(46,107,230,0.25)'
          }}
          className="hover:opacity-95 active:scale-[0.99]"
        >
          {isSubmitting || authLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Signing in...</span>
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Quick Switch Test Personas matching MicroFin OS */}
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E4E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 10 }}>
          <Users style={{ width: 13, height: 13 }} />
          <span>Quick Demo Personas</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { label: 'HR Manager', email: 'hr.manager@mms.com' },
            { label: 'Maria Santos (Employee)', email: 'maria.santos@mms.com' },
            { label: 'Finance Officer', email: 'officer@mms.com' },
            { label: 'Director', email: 'director@mms.com' },
            { label: 'Admin', email: 'admin@mms.com' },
          ].map((item) => (
            <button
              key={item.email}
              type="button"
              onClick={() => selectPersona(item.email)}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                padding: '5px 10px',
                borderRadius: 6,
                border: email === item.email ? `1px solid ${ACCENT}` : '1px solid #E4E8F0',
                background: email === item.email ? '#EFF6FF' : '#F8FAFC',
                color: email === item.email ? ACCENT : '#475467',
                cursor: 'pointer',
                transition: 'all .12s'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
