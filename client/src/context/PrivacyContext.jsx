import React, { createContext, useContext, useState, useEffect } from 'react';

const PrivacyContext = createContext({
  privacyMode: false,
  togglePrivacyMode: () => {},
  setPrivacyMode: () => {},
  maskMoney: (val) => val
});

export const PRIVACY_MASK = '₱••••••';
export const RAW_MASK = '••••••';

let _globalPrivacyMode = false;
try {
  _globalPrivacyMode = localStorage.getItem('mms_privacy_mode') === 'true';
} catch {}

export function isPrivacyActive() {
  return _globalPrivacyMode;
}

export function maskMoneyGlobal(formattedVal, includeSymbol = true) {
  if (!_globalPrivacyMode) return formattedVal;
  return includeSymbol ? PRIVACY_MASK : RAW_MASK;
}

export function PrivacyProvider({ children }) {
  const [privacyMode, setPrivacyModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('mms_privacy_mode') === 'true';
      _globalPrivacyMode = saved;
      return saved;
    } catch {
      return false;
    }
  });

  const setPrivacyMode = (val) => {
    _globalPrivacyMode = val;
    setPrivacyModeState(val);
    try {
      localStorage.setItem('mms_privacy_mode', String(val));
      window.dispatchEvent(new CustomEvent('mms-privacy-toggle', { detail: { privacyMode: val } }));
    } catch (e) {
      console.error('Failed to save privacy mode state', e);
    }
  };

  const togglePrivacyMode = () => {
    setPrivacyMode(!privacyMode);
  };

  // Listen to cross-window or manual events
  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail?.privacyMode !== undefined && e.detail.privacyMode !== privacyMode) {
        _globalPrivacyMode = e.detail.privacyMode;
        setPrivacyModeState(e.detail.privacyMode);
      }
    };
    window.addEventListener('mms-privacy-toggle', handleSync);
    return () => window.removeEventListener('mms-privacy-toggle', handleSync);
  }, [privacyMode]);

  /**
   * Helper to mask a money string or value if privacyMode is active
   * @param {string|number} formattedVal - The already formatted currency string (e.g. "₱25,000.00")
   * @param {boolean} [includeSymbol=true] - Whether to prepend "₱" in the mask
   */
  const maskMoney = (formattedVal, includeSymbol = true) => {
    if (!privacyMode) return formattedVal;
    return includeSymbol ? PRIVACY_MASK : RAW_MASK;
  };

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacyMode, setPrivacyMode, maskMoney }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}

