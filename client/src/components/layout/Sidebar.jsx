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
        { id: 'reimbursement', mono: 'RP', label: 'Reimbursement Processing' }
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
      if (sub.id === 'government_compliance') return 'My Statutory Contributions';
    }
    return sub.label;
  };

  return (
    <aside 
      className="mf-scroll select-none shrink-0 sticky top-0 h-screen flex flex-col justify-between z-40"
      style={{
        width: 260,
        background: '#0B1F3A',
        borderRight: '1px solid rgba(255,255,255,.08)'
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '20px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div 
            style={{ 
              width: 34, 
              height: 34, 
              borderRadius: 10, 
              background: ACCENT, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontFamily: "'Plus Jakarta Sans',sans-serif", 
              fontWeight: 800, 
              fontSize: 13, 
              color: '#fff', 
              flex: 'none' 
            }}
          >
            MF
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.15 }}>
              MicroFin OS
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.45)', fontWeight: 500, marginTop: 2 }}>
              HR &amp; Payroll Management
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '0 18px 10px' }} />

      {/* Navigation List */}
      <div className="mf-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {filteredSections.map((section) => {
          const isExpanded = !!expandedCategories[section.category];
          const hasActiveChild = section.submodules.some(s => s.id === activeModule);

          return (
            <div key={section.category} style={{ marginBottom: 4 }}>
              {/* Category Header Row */}
              <div
                onClick={() => toggleCategory(section.category)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 14px',
                  margin: '2px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: hasActiveChild ? '#fff' : 'rgba(255,255,255,.72)',
                  background: 'transparent',
                  fontWeight: 600,
                  fontSize: 12.5,
                  transition: 'background .15s, color .15s'
                }}
                className="hover:bg-white/[0.05]"
              >
                <div 
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    flex: 'none',
                    background: hasActiveChild ? 'rgba(46,107,230,.35)' : 'rgba(255,255,255,.08)',
                    color: hasActiveChild ? '#93C5FD' : 'rgba(255,255,255,.8)',
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '.02em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {section.mono}
                </div>
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {section.category}
                </div>
                <div 
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,.5)',
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform .15s'
                  }}
                >
                  {CARET}
                </div>
              </div>

              {/* Submodules Rows */}
              {isExpanded && (
                <div style={{ paddingTop: 2, paddingBottom: 2 }}>
                  {section.submodules.map((sub) => {
                    const isActive = activeModule === sub.id;
                    const count = taskCounts[sub.id] || 0;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => setActiveModule(sub.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '7px 14px 7px 34px',
                          margin: '1px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 12.5,
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#fff' : 'rgba(255,255,255,.65)',
                          background: isActive ? ACCENT : 'transparent',
                          transition: 'background .15s, color .15s'
                        }}
                        className={!isActive ? 'hover:bg-white/[0.06] hover:text-white' : ''}
                      >
                        <div 
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            background: isActive ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.06)',
                            fontSize: 8.5,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 'none'
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
                              padding: '1px 6px',
                              borderRadius: 10,
                              fontSize: 9.5,
                              fontWeight: 700,
                              background: isActive ? 'rgba(255,255,255,.25)' : '#EF4444',
                              color: '#fff'
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
            </div>
          );
        })}
      </div>

      {/* User Footer matching MicroFin OS */}
      <div 
        style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(255,255,255,.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(0,0,0,.1)'
        }}
      >
        <div 
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,.12)',
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
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayRole}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (logout) logout();
          }}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            fontSize: 11,
            color: logoutHover ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.5)',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            background: logoutHover ? 'rgba(255,255,255,.1)' : 'transparent',
            border: 'none',
            transition: 'background .15s, color .15s'
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
