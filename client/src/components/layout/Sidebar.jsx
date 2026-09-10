import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Heart, 
  BarChart3, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasModuleAccess } from '../../utils/rbac';

export default function Sidebar({ activeModule, setActiveModule, taskCounts = {} }) {
  const { user } = useAuth();

  const initials = user?.initials || (user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'LG');
  const displayName = user?.full_name || 'Liza Gomez';
  const displayRole = user?.role_label || 'HR Manager';

  // Keep track of which accordion categories are expanded
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
      icon: DollarSign,
      iconColor: 'bg-[#8b5cf6] text-white',
      badgeColor: 'text-[#a78bfa]',
      submodules: [
        { id: 'payroll_computation', label: 'Payroll Computation' },
        { id: 'timekeeping', label: 'Timekeeping & Attendance Integration' },
        { id: 'payslips', label: 'Payslip Generation & Payroll Records' }
      ]
    },
    {
      category: 'Compensation Planning',
      icon: TrendingUp,
      iconColor: 'bg-[#10b981] text-white',
      badgeColor: 'text-[#34d399]',
      submodules: [
        { id: 'salary_structure', label: 'Salary Structure Configuration' },
        { id: 'allowances', label: 'Allowances & Incentive Management' },
        { id: 'salary_adjustment', label: 'Salary Adjustment Management' }
      ]
    },
    {
      category: 'Claims & Reimbursement',
      icon: Receipt,
      iconColor: 'bg-[#f97316] text-white',
      badgeColor: 'text-[#fb923c]',
      submodules: [
        { id: 'claim_filing', label: 'Employee Claim Filing' },
        { id: 'claim_verification', label: 'Claim Verification & Approval' },
        { id: 'reimbursement', label: 'Reimbursement Processing & Monitoring' }
      ]
    },
    {
      category: 'HMO & Benefits Administration',
      icon: Heart,
      iconColor: 'bg-[#06b6d4] text-white',
      badgeColor: 'text-[#22d3ee]',
      submodules: [
        { id: 'benefits_enrollment', label: 'Benefits Enrollment & Management' },
        { id: 'hmo_contribution', label: 'HMO Contribution Management' },
        { id: 'benefits_monitoring', label: 'Employee Benefits Monitoring' }
      ]
    },
    {
      category: 'HR Analytics Dashboard',
      icon: BarChart3,
      iconColor: 'bg-[#14b8a6] text-white',
      badgeColor: 'text-[#2dd4bf]',
      submodules: [
        { id: 'realtime_dashboard', label: 'Real-Time Payroll Dashboard' },
        { id: 'financial_reporting', label: 'Financial Reporting' },
        { id: 'government_compliance', label: 'Government Compliance Reports' }
      ]
    }
  ];

  // RBAC filter: only display submodules permitted for user role, and omit empty categories
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
    <aside className="w-72 bg-[#0c1024] text-slate-300 shrink-0 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800/80 select-none overflow-y-auto overflow-x-hidden sidebar-scroll z-40">
      <div className="p-4 space-y-4">
        {/* Top MMS Logo Section */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-indigo-600/30">
              MMS
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight leading-none">
                Microfinancial
              </div>
              <div className="text-[11px] text-slate-400 font-medium tracking-normal mt-0.5">
                Management System
              </div>
            </div>
          </div>

          {/* 4 Colored Status Dots */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2 py-1 rounded-full border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
        </div>

        {/* User Card with Role Badge */}
        <div className="mx-1 p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center space-x-3">
          <div className="w-9 h-9 shrink-0 rounded-full bg-[#7c3aed] text-white font-bold flex items-center justify-center text-xs shadow-sm">
            {initials}
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="text-xs font-bold text-white truncate">{displayName}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-400 truncate">{displayRole}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {user?.role || 'user'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Accordion Sections */}
        <div className="space-y-3 pt-0.5">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedCategories[section.category];

            return (
              <div key={section.category} className="space-y-1">
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(section.category)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white transition-colors group cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-5 h-5 rounded-md ${section.iconColor} flex items-center justify-center p-0.5 shadow-sm`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[12px] font-semibold tracking-tight">{section.category}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  )}
                </button>

                {/* Submodules List */}
                {isExpanded && (
                  <div className="space-y-1 pl-3 pr-1 pt-0.5">
                    {section.submodules.map((sub) => {
                      const isActive = activeModule === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setActiveModule(sub.id)}
                          className={`w-full text-left text-xs px-3.5 py-1.5 rounded-xl transition-all duration-200 ease-out flex items-center justify-between cursor-pointer active:scale-[0.97] ${
                            isActive
                              ? 'bg-[#7c3aed] text-white font-semibold shadow-md shadow-purple-900/40 ring-1 ring-purple-400/30 translate-x-1'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] hover:translate-x-0.5'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm shrink-0 animate-pulse" />
                            )}
                            <span className="truncate">{getSubmoduleLabel(sub)}</span>
                          </div>
                          {taskCounts[sub.id] > 0 && (
                            <span className={`ml-1.5 shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center leading-none transition-transform duration-200 ${
                              isActive ? 'bg-white/25 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {taskCounts[sub.id] > 99 ? '99+' : taskCounts[sub.id]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Notice */}
      <div className="p-3 border-t border-slate-800/80 shrink-0">
        <div className="text-[10px] text-slate-500 hover:text-slate-400 cursor-pointer text-center">
          Do not sell or share my personal info
        </div>
      </div>
    </aside>
  );
}
