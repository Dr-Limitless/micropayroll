import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasModuleAccess } from '../../utils/rbac';
import { ACCENT } from '../../theme';
import { CARET } from '../../glyphs';

export default function Sidebar({ activeModule, setActiveModule, taskCounts = {} }) {
  const { user, logout } = useAuth();
  const [logoutHover, setLogoutHover] = useState(false);

  const initials = user?.initials || (user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'LG');
  const displayName = user?.full_name || 'Liza Gomez';
  const displayRole = user?.role_label || 'HR Manager';

  // Category expansion states
  const [expandedCategories, setExpandedCategories] = useState({
    'Payroll Management': true,
    'Compensation Planning': true,
    'Claims & Reimbursement': true,
    'HMO & Benefits Administration': true,
    'HR Analytics Dashboard': true
  });

  const toggleCategory = (catName) => {
    setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  const menuSections = [
    {
      category: 'Payroll Management',
      mono: 'PM',
      submodules: [
        { id: 'payroll_computation', mono: 'PC', label: 'Payroll Computation' },
        { id: 'timekeeping', mono: 'TK', label: 'Timekeeping & Attendance' },
        { id: 'payslips', mono: 'PS', label: 'Payslips & Records' }
      ]
    },
    {
      category: 'Compensation Planning',
      mono: 'CP',
      submodules: [
        { id: 'salary_structure', mono: 'SC', label: 'Salary Structure' },
        { id: 'allowances', mono: 'AL', label: 'Allowances & Incentives' },
        { id: 'salary_adjustment', mono: 'SA', label: 'Salary Adjustment' }
      ]
    },
    {
      category: 'Claims & Reimbursement',
      mono: 'CR',
      submodules: [
        { id: 'claim_filing', mono: 'CF', label: 'Employee Claim Filing' },
        { id: 'claim_verification', mono: 'CV', label: 'Claim Verification' },
        { id: 'reimbursement', mono: 'RP', label: 'Reimbursement Processing' },
        { id: 'microloans', mono: 'ML', label: 'Microloans & Cash Advances' }
      ]
    },
    {
      category: 'HMO & Benefits Administration',
      mono: 'HB',
      submodules: [
        { id: 'benefits_enrollment', mono: 'BE', label: 'Benefits Enrollment' },
        { id: 'hmo_contribution', mono: 'HC', label: 'HMO Contribution' },
        { id: 'benefits_monitoring', mono: 'BM', label: 'Benefits Monitoring' }
      ]
    },
    {
      category: 'HR Analytics Dashboard',
      mono: 'HA',
      submodules: [
        { id: 'realtime_dashboard', mono: 'RD', label: 'Real-Time Dashboard' },
        { id: 'financial_reporting', mono: 'FR', label: 'Financial Reporting' },
        { id: 'government_compliance', mono: 'GC', label: 'Government Compliance' },
        { id: 'audit_logs', mono: 'AL', label: 'Audit Logs' }
      ]
    }
  ];

  // Filter sections by role
  const filteredSections = menuSections
    .map(section => ({
      ...section,
      submodules: section.submodules.filter(sub => hasModuleAccess(user?.role, sub.id))
    }))
    .filter(section => section.submodules.length > 0);

  const getSubmoduleLabel = (sub) => {
    if (user?.role === 'employee') {
      if (sub.id === 'payslips') return 'My Payslips & Records';
      if (sub.id === 'timekeeping') return 'My Attendance Logs';
      if (sub.id === 'claim_filing') return 'My Expense Claims';
      if (sub.id === 'benefits_monitoring') return 'My HMO Card & Benefits';
      if (sub.id === 'microloans') return 'My Microloans & Advances';
      if (sub.id === 'government_compliance') return 'My Statutory Contributions';
    }
    return sub.label;
  };

  return (
    <aside
      className="sidebar-root select-none shrink-0 sticky top-0 h-screen flex flex-col z-40 transition-colors duration-200"
      style={{ width: 260 }}
    >
      {/* Brand Header */}
      <div className="sidebar-header" style={{ padding: '20px 18px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              background: ACCENT,
              boxShadow: '0 0 14px color-mix(in srgb, var(--mf-accent, #2E6BE6) 50%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 800,
              fontSize: 13.5,
              color: '#fff',
              flex: 'none',
              letterSpacing: '.04em'
            }}
          >
            MF
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.15 }}>
              MicroFin OS
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.4)', fontWeight: 500, marginTop: 2 }}>
              HR &amp; Payroll Management
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '0 16px 8px' }} />

      {/* Navigation List */}
      <div className="mf-scroll sidebar-nav" style={{ flex: 1, overflowY: 'auto', paddingBottom: 12, paddingTop: 4 }}>
        {filteredSections.map((section) => {
          const isExpanded = !!expandedCategories[section.category];
          const hasActiveChild = section.submodules.some(s => s.id === activeModule);

          return (
            <div key={section.category} style={{ marginBottom: 2 }}>
              {/* Category Header Row */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleCategory(section.category)}
                onKeyDown={(e) => e.key === 'Enter' && toggleCategory(section.category)}
                className="sidebar-category-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 12px',
                  margin: '1px 8px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: hasActiveChild ? '#fff' : 'rgba(255,255,255,.65)',
                  background: hasActiveChild ? 'color-mix(in srgb, var(--mf-accent, #2E6BE6) 18%, transparent)' : 'transparent',
                  fontWeight: hasActiveChild ? 700 : 600,
                  fontSize: 12,
                  transition: 'background .15s, color .15s',
                  borderLeft: hasActiveChild ? '2.5px solid var(--mf-accent, #2E6BE6)' : '2.5px solid transparent',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    flex: 'none',
                    background: hasActiveChild ? 'color-mix(in srgb, var(--mf-accent, #2E6BE6) 35%, transparent)' : 'rgba(255,255,255,.09)',
                    color: hasActiveChild ? 'var(--mf-accent, #2E6BE6)' : 'rgba(255,255,255,.7)',
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '.04em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {section.mono}
                </div>
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {section.category}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,.4)',
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform .2s',
                    flexShrink: 0
                  }}
                >
                  {CARET}
                </div>
              </div>

              {/* Submodules Rows */}
              {isExpanded && (
                <div style={{ paddingTop: 2, paddingBottom: 4 }}>
                  {section.submodules.map((sub) => {
                    const isActive = activeModule === sub.id;
                    const count = taskCounts[sub.id] || 0;

                    return (
                      <div
                        key={sub.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveModule(sub.id)}
                        onKeyDown={(e) => e.key === 'Enter' && setActiveModule(sub.id)}
                        className={isActive ? 'sidebar-sub-active' : 'sidebar-sub-inactive'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          padding: '6.5px 12px 6.5px 32px',
                          margin: '1px 8px',
                          borderRadius: 7,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 450,
                          color: isActive ? '#fff' : 'rgba(255,255,255,.58)',
                          background: isActive ? ACCENT : 'transparent',
                          boxShadow: isActive ? '0 2px 14px color-mix(in srgb, var(--mf-accent, #2E6BE6) 45%, transparent)' : 'none',
                          transition: 'background .15s, color .15s, box-shadow .15s',
                          letterSpacing: isActive ? '.01em' : 'normal'
                        }}
                      >
                        <div
                          style={{
                            width: 17,
                            height: 17,
                            borderRadius: 4,
                            background: isActive ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.07)',
                            fontSize: 8,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 'none',
                            color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
                            letterSpacing: '.03em'
                          }}
                        >
                          {sub.mono}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getSubmoduleLabel(sub)}
                        </div>
                        {count > 0 && (
                          <div
                            style={{
                              padding: '1px 5px',
                              borderRadius: 10,
                              fontSize: 9,
                              fontWeight: 700,
                              background: isActive ? 'rgba(255,255,255,.28)' : '#EF4444',
                              color: '#fff',
                              flexShrink: 0,
                              minWidth: 16,
                              textAlign: 'center'
                            }}
                          >
                            {count > 99 ? '99+' : count}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Subtle section divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,.04)', margin: '4px 16px 2px' }} />
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div
        className="sidebar-footer"
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,.07)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(0,0,0,.14)',
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: ACCENT,
            boxShadow: '0 0 10px color-mix(in srgb, var(--mf-accent, #2E6BE6) 45%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            flex: 'none'
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {displayName}
          </div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayRole}
          </div>
        </div>
        <button
          type="button"
          onClick={() => { if (logout) logout(); }}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            fontSize: 11,
            color: logoutHover ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.45)',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            background: logoutHover ? 'rgba(255,255,255,.1)' : 'transparent',
            border: 'none',
            transition: 'background .15s, color .15s',
            flexShrink: 0
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
