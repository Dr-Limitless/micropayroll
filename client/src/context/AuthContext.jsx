import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mms_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('mms_access_token') || null);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [securityInfo, setSecurityInfo] = useState(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(() => {
    return sessionStorage.getItem('mms_session_expired') === 'true';
  });

  useEffect(() => {
    async function loadPersonas() {
      try {
        const data = await api.getPersonas();
        if (data && data.personas) {
          setPersonas(data.personas);
        }
      } catch (err) {
        console.error('Error fetching personas:', err);
      }
    }
    loadPersonas();
  }, []);

  const clearSessionExpiredNotice = useCallback(() => {
    sessionStorage.removeItem('mms_session_expired');
    setSessionExpiredNotice(false);
  }, []);

  const logout = useCallback((reason = null) => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mms_access_token');
    localStorage.removeItem('mms_user');
    if (reason === 'inactivity') {
      sessionStorage.setItem('mms_session_expired', 'true');
      setSessionExpiredNotice(true);
    } else {
      sessionStorage.removeItem('mms_session_expired');
      setSessionExpiredNotice(false);
    }
  }, []);

  // 5-minute inactivity timer
  useEffect(() => {
    if (!token || !user) return;

    let timeoutId = null;

    const handleTimeout = () => {
      logout('inactivity');
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleTimeout, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });

    // Initialize timer
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, resetTimer);
      });
    };
  }, [token, user, logout]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await api.login(credentials);
      if (res.access_token) {
        setToken(res.access_token);
        setUser(res.user);
        setSecurityInfo(res.security_info);
        localStorage.setItem('mms_access_token', res.access_token);
        localStorage.setItem('mms_user', JSON.stringify(res.user));
        clearSessionExpiredNotice();
        return { success: true, user: res.user };
      } else if (res.require_2fa) {
        return { success: false, require_2fa: true, email: res.email, message: res.message };
      } else {
        return { success: false, error: res.error || 'Authentication failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async ({ email, totp_code }) => {
    setLoading(true);
    try {
      const res = await api.verify2FALogin({ email, totp_code });
      if (res.access_token) {
        setToken(res.access_token);
        setUser(res.user);
        setSecurityInfo(res.security_info);
        localStorage.setItem('mms_access_token', res.access_token);
        localStorage.setItem('mms_user', JSON.stringify(res.user));
        clearSessionExpiredNotice();
        return { success: true, user: res.user };
      } else {
        return { success: false, error: res.error || 'Verification failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (roleName) => {
    return login({ role: roleName });
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('mms_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      personas,
      loading,
      securityInfo,
      sessionExpiredNotice,
      clearSessionExpiredNotice,
      login,
      verify2FA,
      logout,
      switchRole,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
