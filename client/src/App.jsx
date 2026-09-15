import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import PayrollComputationView from './components/payroll/PayrollComputationView';
import ModuleContentView from './components/modules/ModuleContentView';
import FigmaHeroBanner from './components/auth/FigmaHeroBanner';
import FigmaSignInForm from './components/auth/FigmaSignInForm';
import AuditLogView from './components/audit/AuditLogView';
import SettingsView from './components/settings/SettingsView';
import { hasModuleAccess, getDefaultModule } from './utils/rbac';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { api } from './services/api';

const moduleMeta = {
  // Payroll Management
  payroll_computation: { label: 'Payroll Computation', category: 'Payroll Management' },
  timekeeping: { label: 'Timekeeping & Attendance Integration', category: 'Payroll Management' },
  payslips: { label: 'Payslip Generation & Payroll Records', category: 'Payroll Management' },
  
  // Compensation Planning
  salary_structure: { label: 'Salary Structure Configuration', category: 'Compensation Planning' },
  allowances: { label: 'Allowances & Incentive Management', category: 'Compensation Planning' },
  salary_adjustment: { label: 'Salary Adjustment Management', category: 'Compensation Planning' },

  // Claims & Reimbursement
  claim_filing: { label: 'Employee Claim Filing', category: 'Claims & Reimbursement' },
  claim_verification: { label: 'Claim Verification & Approval', category: 'Claims & Reimbursement' },
  reimbursement: { label: 'Reimbursement Processing & Monitoring', category: 'Claims & Reimbursement' },

  // HMO & Benefits Administration
  benefits_enrollment: { label: 'Benefits Enrollment & Management', category: 'HMO & Benefits Administration' },
  hmo_contribution: { label: 'HMO Contribution Management', category: 'HMO & Benefits Administration' },
  benefits_monitoring: { label: 'Employee Benefits Monitoring', category: 'HMO & Benefits Administration' },

  // HR Analytics Dashboard
  realtime_dashboard: { label: 'Real-Time Payroll Dashboard', category: 'HR Analytics Dashboard' },
  financial_reporting: { label: 'Financial Reporting', category: 'HR Analytics Dashboard' },
  government_compliance: { label: 'Government Compliance Reports', category: 'HR Analytics Dashboard' },

  // System Administration & Self-Service
  audit_logs: { label: 'System Audit Logs', category: 'System Administration' },
  settings: { label: 'Account Settings & Preferences', category: 'Account Preferences' }
};

function MainApp() {
  const { user, token } = useAuth();
  const [activeModule, setActiveModule] = useState(() => getDefaultModule(user?.role));
  const [taskCounts, setTaskCounts] = useState({});

  // Initialize UI configuration (dark/light mode, accent color, font size) from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('mms_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const savedAccent = localStorage.getItem('mms_accent_color');
    if (savedAccent) {
      document.documentElement.style.setProperty('--mf-accent', savedAccent);
    }
    const savedSize = localStorage.getItem('mms_font_size');
    if (savedSize === 'compact') {
      document.documentElement.style.fontSize = '13px';
    } else if (savedSize === 'comfortable') {
      document.documentElement.style.fontSize = '15px';
    } else {
      document.documentElement.style.fontSize = '14px';
    }
  }, []);

  // Role validation & automatic redirect to user's authorized landing submodule
  React.useEffect(() => {
    if (user?.role && !hasModuleAccess(user.role, activeModule)) {
      setActiveModule(getDefaultModule(user.role));
    }
  }, [user?.role, activeModule]);

  // Instant Event Dispatcher + background fallback polling for sidebar badges
  const refreshTaskCounts = useCallback(async () => {
    if (!token || !user) return;
    try {
      const data = await api.getTaskQueueCounts();
      if (data && !data.error) setTaskCounts(data);
    } catch (_) { /* silent */ }
  }, [token, user]);

  useEffect(() => {
    refreshTaskCounts();

    // Instant Event Dispatcher: reacts immediately (0ms) when any action is approved/submitted
    const handleInstantRefresh = () => {
      refreshTaskCounts();
    };
    window.addEventListener('mms:refresh-tasks', handleInstantRefresh);

    // Background fallback polling (reduced from 30s to 8s)
    const interval = setInterval(refreshTaskCounts, 8000);

    return () => {
      window.removeEventListener('mms:refresh-tasks', handleInstantRefresh);
      clearInterval(interval);
    };
  }, [refreshTaskCounts]);

  // Proper Login Gate: Full-screen 50/50 split authentication view matching MicroFin OS
  if (!token || !user) {
    return (
      <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-[#2E6BE6] selection:text-white animate-login-enter">
        {/* Left Half: MicroFin OS Brand & Architecture Banner (50vw, 100vh fitted) */}
        <div className="w-full lg:w-1/2 h-full bg-[#0B1F3A] flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
          <FigmaHeroBanner />
        </div>

        {/* Right Half: Clean, Professional Sign-In Form (50vw, 100vh fitted) */}
        <div className="w-full lg:w-1/2 h-full bg-white flex flex-col justify-between px-6 sm:px-10 lg:px-12 py-6 overflow-y-auto">
          <div className="w-full max-w-md mx-auto my-auto">
            <FigmaSignInForm />
          </div>

          <div className="text-center py-1 text-[11px] text-[#94A3B8] font-medium tracking-tight">
            MicroFin OS • Microfinancial Management System (MMS) • DOLE &amp; BIR TRAIN Law Compliant
          </div>
        </div>
      </div>
    );
  }

  const currentMeta = moduleMeta[activeModule] || {
    label: 'Payroll Computation',
    category: 'Payroll Management'
  };

  return (
    <div className="h-screen bg-[#F5F7FA] flex font-sans antialiased text-[#101828] overflow-hidden animate-app-enter">
      {/* MicroFin OS Deep Navy Sidebar with Mono Badges & Dynamic User Profile */}
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        taskCounts={taskCounts}
      />

      {/* Main Content Area — Topbar on top, scrollable content below */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar 
          activeModule={activeModule}
          categoryLabel={currentMeta.category}
          moduleLabel={currentMeta.label}
          onNavigate={setActiveModule}
          taskCounts={taskCounts}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden mf-scroll p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <div key={activeModule} className="animate-module-fade">
            {!hasModuleAccess(user?.role, activeModule) ? (
              <div className="bg-white rounded-2xl border border-red-200/80 shadow-sm p-8 sm:p-12 text-center max-w-xl mx-auto my-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold tracking-wider text-red-600 uppercase bg-red-100/70 px-2.5 py-0.5 rounded-full">
                    403 Forbidden • Access Restricted
                  </span>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="text-xl font-bold text-slate-900 tracking-tight pt-2">
                    Module Not Accessible for {user?.role_label || 'Your Role'}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                    Your current account role <strong className="text-slate-800 uppercase">({user?.role})</strong> is not authorized to access <strong className="text-slate-800">{currentMeta.label}</strong> under the system's Role-Based Access Control (RBAC) security policies.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModule(getDefaultModule(user?.role))}
                    className="px-4 py-2.5 rounded-lg bg-[#2E6BE6] hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Authorized Workspace</span>
                  </button>
                </div>
              </div>
            ) : activeModule === 'payroll_computation' ? (
              <PayrollComputationView />
            ) : activeModule === 'audit_logs' ? (
              <AuditLogView />
            ) : activeModule === 'settings' ? (
              <SettingsView />
            ) : (
              <ModuleContentView 
                moduleId={activeModule}
                moduleLabel={currentMeta.label}
                categoryLabel={currentMeta.category}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
