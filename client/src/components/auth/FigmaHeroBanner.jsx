import React from 'react';
import { 
  CreditCard, 
  Users, 
  Layers, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';
import { ACCENT } from '../../theme';

export default function FigmaHeroBanner() {
  const features = [
    {
      title: 'Automated Payroll & Tax Settlement',
      desc: 'Real-time DOLE statutory computations, TRAIN Law withholding & digital payslips',
      icon: CreditCard
    },
    {
      title: 'Workforce Directory & Management',
      desc: 'Centralized employee profiles, compensation history & department structures',
      icon: Users
    },
    {
      title: 'Statutory Compliance & Benefits',
      desc: 'SSS, PhilHealth, Pag-IBIG Circular No. 460 & HMO contribution management',
      icon: Layers
    },
    {
      title: 'Bank-Grade Cryptographic Security',
      desc: 'OAuth 2.0 authentication, AES-256 encrypted storage & tamper-proof audit trails',
      icon: Lock
    },
    {
      title: 'Executive Financial Auditing',
      desc: 'Comprehensive disbursement controls, ledger verification & compliance reporting',
      icon: ShieldCheck
    }
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0B1F3A', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 48px', overflow: 'hidden' }}>
      {/* Ambient background glow effects ported from microfin-os */}
      <div 
        style={{ 
          position: 'absolute', 
          top: -120, 
          right: -120, 
          width: 420, 
          height: 420, 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(46,107,230,.35), transparent 70%)', 
          animation: 'pulseGlow 5s ease-in-out infinite' 
        }} 
      />
      <div 
        style={{ 
          position: 'absolute', 
          bottom: -160, 
          left: -100, 
          width: 360, 
          height: 360, 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(14,124,97,.28), transparent 70%)', 
          animation: 'pulseGlow 6s ease-in-out infinite 1s' 
        }} 
      />

      {/* Header & Brand */}
      <div style={{ position: 'relative', zIndex: 1, animation: 'loginBrandIn .6s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div 
            style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 14, 
              background: ACCENT, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontFamily: "'Plus Jakarta Sans',sans-serif", 
              fontWeight: 800, 
              fontSize: 18, 
              color: '#fff',
              boxShadow: '0 8px 24px rgba(46,107,230,0.35)'
            }}
          >
            MF
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 24, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.1 }}>
              MicroFin OS
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 500, marginTop: 2 }}>
              Enterprise HR &amp; Philippine Payroll
            </div>
          </div>
        </div>

        <div style={{ fontSize: 14.5, color: 'rgba(255,255,255,.68)', lineHeight: 1.6, maxWidth: 460, marginBottom: 24 }}>
          Unified operations platform for microfinance institutions — Philippine statutory compliance, automated payroll computation, and workforce administration.
        </div>

        {/* Feature List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                <Icon style={{ width: 14, height: 14, color: 'rgba(255,255,255,.4)', flexShrink: 0, marginLeft: 10 }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Row matching microfin-os */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 32, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 20 }}>
        {[
          ['42', 'Branches'],
          ['3,920', 'Active employees'],
          ['100%', 'DOLE & BIR Compliant']
        ].map(([v, l]) => (
          <div key={l}>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 20, color: '#fff' }}>
              {v}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
              {l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
