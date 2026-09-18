import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingDown, 
  Wallet, 
  Users, 
  Zap, 
  ArrowUpRight, 
  ChevronDown,
  CheckCircle2,
  FileText,
  Plus,
  UserPlus,
  Search,
  X,
  RefreshCw,
  Printer,
  Briefcase,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
  Lock,
  ShieldCheck,
  AlertTriangle,
  CalendarPlus
} from 'lucide-react';
import PayslipModal from '../payslips/PayslipModal';
import FinalPayModal from '../offboarding/FinalPayModal';
import PayrollComputationReportModal from './PayrollComputationReportModal';
import NewPayrollPeriodModal from './NewPayrollPeriodModal';
import { useAuth } from '../../context/AuthContext';
import { usePrivacy, isPrivacyActive } from '../../context/PrivacyContext';
import { canPerformAction } from '../../utils/rbac';
import { api } from '../../services/api';
import { ACCENT, badgeStyle } from '../../theme';


function formatCurrency(val, rawVal) {
  if (isPrivacyActive()) return '₱••••••';
  if (rawVal !== undefined && rawVal !== null && !isNaN(Number(rawVal))) {
    return '₱' + Number(rawVal).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof val === 'number') {
    return '₱' + Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof val === 'string') {
    if (val.includes('M')) {
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        return '₱' + (num * 1000000).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    if (val.includes('K')) {
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        return '₱' + (num * 1000).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    const cleaned = parseFloat(val.replace(/[^0-9.-]/g, ''));
    if (!isNaN(cleaned)) {
      return '₱' + cleaned.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val;
  }
  return '₱0.00';
}

export default function PayrollComputationView({ searchFilter }) {
  const { user, switchRole } = useAuth();
  const { privacyMode, togglePrivacyMode, maskMoney } = usePrivacy();

  const fmtMoney = (val, rawVal, prefix = '₱') => {
    if (privacyMode) return prefix ? '₱••••••' : '••••••';
    if (rawVal !== undefined && rawVal !== null && !isNaN(Number(rawVal))) {
      return (prefix || '') + Number(rawVal).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (typeof val === 'number') {
      return (prefix || '') + Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (typeof val === 'string') {
      if (val.includes('M')) {
        const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) {
          return (prefix || '') + (num * 1000000).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
      if (val.includes('K')) {
        const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) {
          return (prefix || '') + (num * 1000).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
      const cleaned = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (!isNaN(cleaned)) {
        return (prefix || '') + cleaned.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return val;
    }
    return prefix ? '₱0.00' : '0.00';
  };

  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('September 16–30, 2026');
  const [isComputing, setIsComputing] = useState(false);
  const [isUpdatingPeriod, setIsUpdatingPeriod] = useState(false);
  const [selectedPayslipId, setSelectedPayslipId] = useState(null);
  const [selectedOffboardEmployee, setSelectedOffboardEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [customPeriods, setCustomPeriods] = useState([]);
  const [allPeriods, setAllPeriods] = useState([]);
  const [isSubmittingEmp, setIsSubmittingEmp] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // Helpers for dynamic period dropdown status & today badge
  const getPeriodMeta = (pName) => allPeriods.find(p => p.period_name === pName);

  const isCurrentCutOff = (pObj) => {
    if (!pObj?.cut_off_start || !pObj?.cut_off_end) return false;
    // Only regular semi-monthly cycles represent the official payroll cut-off window
    if (!pObj.is_semi_monthly) return false;
    const today = new Date().toISOString().split('T')[0];
    return today >= pObj.cut_off_start && today <= pObj.cut_off_end;
  };

  const renderPeriodOption = (periodName, cutOffLabel = '') => {
    const meta = getPeriodMeta(periodName);
    const status = meta?.status || 'Draft';
    const today = new Date().toISOString().split('T')[0];

    const isLiveCurrent = isCurrentCutOff(meta);
    const isHistorical = periodName.includes('2024') || periodName.includes('2025');
    const isClosedPaid = status === 'Paid' || status === 'Finalized';
    const isCutOffEnded = meta?.cut_off_end ? meta.cut_off_end < today : false;

    // Previous data: ended cut-offs or historical/closed periods (should be greyed out)
    const isPrevData = (isCutOffEnded && isClosedPaid) || (isHistorical && isClosedPaid) || (periodName === 'September 1–15, 2026' && isClosedPaid);

    // New computed payroll: current live cycle that is computed/paid, or newly active computed period
    const isNewComputed = (isLiveCurrent && ['Approved', 'Finalized', 'Paid'].includes(status)) ||
                          (periodName === selectedMonth && ['Approved', 'Finalized', 'Paid'].includes(period?.status || status) && !isPrevData);

    let emoji = '⚪';
    let statusTag = '';
    let optionStyle = {};

    if (isPrevData) {
      emoji = '🔘'; // Grey circle for previous closed cycles
      statusTag = ' [Closed]';
      optionStyle = { color: '#94a3b8', fontStyle: 'italic' };
    } else if (isNewComputed) {
      emoji = '🟢'; // Green strictly reserved for the new computed / active cycle!
      statusTag = isLiveCurrent ? ' ← TODAY [Paid]' : ' [Paid]';
      optionStyle = { color: '#15803d', fontWeight: 'bold' };
    } else if (status === 'Approved') {
      emoji = '🔵';
      statusTag = ' [Approved]';
      optionStyle = { color: '#2563eb' };
    } else if (status === 'For Review') {
      emoji = '🟡';
      statusTag = ' [For Review]';
      optionStyle = { color: '#d97706' };
    } else if (isLiveCurrent) {
      emoji = '🟢';
      statusTag = ' ← TODAY';
      optionStyle = { color: '#0f172a', fontWeight: '600' };
    } else {
      emoji = '⚪';
      statusTag = '';
      optionStyle = { color: '#334155' };
    }

    const label = `${emoji} ${periodName}${cutOffLabel ? ` (${cutOffLabel})` : ''}${statusTag}`;

    return (
      <option key={periodName} value={periodName} style={optionStyle}>
        {label}
      </option>
    );
  };


  // New Employee Form State
  const [newEmp, setNewEmp] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: 'Engineering',
    position: 'Software Developer',
    basic_pay: '65000',
    ot_pay: '2500',
    allowances: '4000',
    bank_name: 'BDO Unibank',
    bank_account: '1234-5678-9012-3456',
    tin: '123-456-789-000'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const loadComputation = async (monthToLoad = selectedMonth) => {
    try {
      setLoading(true);
      const data = await api.getPayrollComputation(monthToLoad);
      if (data.employees) setEmployees(data.employees);
      if (data.summary) setSummary(data.summary);
      if (data.period) {
        setPeriod(data.period);
      } else if (data.summary?.status) {
        setPeriod(prev => ({
          ...(prev || {}),
          status: data.summary.status,
          period_name: data.summary.month || monthToLoad
        }));
      }
    } catch (err) {
      console.error('Error loading payroll computation:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      const res = await api.getPayrollPeriods();
      if (Array.isArray(res)) {
        setAllPeriods(res);
        const standardNames = [
          'September 1–15, 2026', 'September 16–30, 2026', 'September 2026',
          'October 1–15, 2026', 'October 16–31, 2026', 'October 2026',
          'November 1–15, 2026', 'November 16–30, 2026', 'November 2026',
          'December 1–15, 2026', 'December 16–31, 2026', 'December 2026',
          'June 2024', 'July 2024', 'August 2024',
          'July 1–15, 2024', 'July 16–31, 2024', 'August 1–15, 2024', 'August 16–31, 2024', 'September 1–15, 2024'
        ];
        const custom = res.filter(p => !standardNames.includes(p.period_name));
        setCustomPeriods(custom);
      }
    } catch (err) {
      console.warn('Could not fetch payroll periods:', err.message);
    }
  };

  useEffect(() => {
    fetchAvailablePeriods();
  }, []);

  const handlePeriodCreated = (newPeriod) => {
    setCustomPeriods(prev => [newPeriod, ...prev]);
    setAllPeriods(prev => [newPeriod, ...prev]);
    setSelectedMonth(newPeriod.period_name);
    showToast(`✨ Custom payroll period "${newPeriod.period_name}" created & initialized in Draft mode!`);
    loadComputation(newPeriod.period_name);
  };

  useEffect(() => {
    loadComputation(selectedMonth);
  }, [selectedMonth]);

  const handleCompute = async () => {
    if (!canPerformAction(user?.role, 'COMPUTE_PAYROLL')) {
      showToast('⛔ Permission Denied: Only Payroll Officer, Finance Director, or System Admin can run payroll computation.');
      return;
    }

    // Enforce pipeline gate: period must be Approved (or past Approved) by Finance Director
    const currentStatus = period?.status || 'Draft';
    const approvedStatuses = ['Approved', 'Finalized', 'Paid'];
    if (!approvedStatuses.includes(currentStatus)) {
      showToast(`⚠️ Payroll computation requires Finance Director approval first. This period is currently "${currentStatus}". Complete: Draft → Submit For Review → Approve Payroll.`);
      return;
    }

    setIsComputing(true);
    try {
      // Brief visual processing delay so the user clearly sees the live engine running
      await new Promise(r => setTimeout(r, 600));
      const data = await api.computePayrollMonth(selectedMonth);
      if (data.employees) setEmployees(data.employees);
      if (data.summary) setSummary(data.summary);
      if (data.period) setPeriod(data.period);
      // Auto-open the computation report modal after successful compute
      setShowReport(true);
    } catch (err) {
      alert('Compute error: ' + err.message);
    } finally {
      setIsComputing(false);
    }
  };


  const handlePeriodStatusChange = async (newStatus) => {
    // RBAC validation
    if (newStatus === 'For Review' && !canPerformAction(user?.role, 'SUBMIT_FOR_REVIEW')) {
      showToast('⛔ Permission Denied: Only Payroll Officer or Admin can submit for review.');
      return;
    }
    if (newStatus === 'Approved' && !canPerformAction(user?.role, 'APPROVE_PAYROLL')) {
      showToast('⛔ Permission Denied: Only Finance Director or Admin can approve payroll.');
      return;
    }
    if (['Finalized', 'Paid'].includes(newStatus) && !canPerformAction(user?.role, 'FINALIZE_AND_LOCK')) {
      showToast('⛔ Permission Denied: Only Finance Director or Admin can finalize and disburse payroll.');
      return;
    }
    if (newStatus === 'Draft' && !['admin', 'director'].includes(user?.role)) {
      showToast('⛔ Permission Denied: Only Finance Director or Admin can reset to draft.');
      return;
    }

    setIsUpdatingPeriod(true);
    try {
      const data = await api.updatePayrollPeriodStatus(selectedMonth, newStatus);
      if (data.period) {
        setPeriod(data.period);
        if (data.rollover) {
          showToast(`🚀 Disbursed! Cut-off rollover completed: Next period "${data.rollover.next_period}" is now initialized in Draft mode.`);
        } else {
          showToast(`✅ Payroll period ${selectedMonth} marked as "${newStatus}"!`);
        }
        loadComputation(selectedMonth);
      } else {
        alert(data.error || 'Failed to update period status');
      }
    } catch (err) {
      alert('Status update error: ' + err.message);
    } finally {
      setIsUpdatingPeriod(false);
    }
  };

  const handleStatusToggle = async (e, emp) => {
    e.stopPropagation();
    if (period?.is_locked) {
      showToast('⚠️ Period is finalized and locked. Unlock or reset to change statuses.');
      return;
    }
    const nextStatus = emp.status === 'Processed' ? 'Pending' : emp.status === 'Pending' ? 'On Hold' : 'Processed';
    try {
      const data = await api.updateEmployeePayrollStatus(emp.id, nextStatus, selectedMonth);
      if (data && !data.error) {
        setEmployees(prev => prev.map(item => item.id === emp.id ? { ...item, status: nextStatus } : item));
        showToast(`Updated ${emp.first_name}'s status to "${nextStatus}".`);
      } else {
        showToast('⚠️ ' + (data?.error || 'Failed to update status'));
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmp.first_name || !newEmp.last_name) {
      showToast('⚠️ Please enter both First Name and Last Name.');
      return;
    }
    setIsSubmittingEmp(true);
    try {
      const data = await api.addEmployeeToPayroll(newEmp, selectedMonth);
      if (data && data.error) {
        showToast('❌ ' + data.error);
        setIsSubmittingEmp(false);
        return;
      }
      setShowAddModal(false);
      setNewEmp({
        first_name: '',
        last_name: '',
        email: '',
        department: 'Engineering',
        position: 'Software Developer',
        basic_pay: '65000',
        ot_pay: '2500',
        allowances: '4000',
        bank_name: 'BDO Unibank',
        bank_account: '1234-5678-9012-3456',
        tin: '123-456-789-000'
      });
      await loadComputation(selectedMonth);
      showToast(`✅ ${newEmp.first_name} ${newEmp.last_name} successfully enrolled into payroll!`);
    } catch (err) {
      showToast('❌ Error enrolling employee: ' + err.message);
    } finally {
      setIsSubmittingEmp(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const term = (localSearch || searchFilter || '').toLowerCase().trim();
    if (!term) return true;
    return (
      (emp.first_name && emp.first_name.toLowerCase().includes(term)) ||
      (emp.last_name && emp.last_name.toLowerCase().includes(term)) ||
      (emp.department && emp.department.toLowerCase().includes(term)) ||
      (emp.employee_code && emp.employee_code.toLowerCase().includes(term)) ||
      (emp.position && emp.position.toLowerCase().includes(term)) ||
      (emp.status && emp.status.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (emp) => {
    const status = emp.status;
    let bg = '#F1F5F9';
    let fg = '#64748B';
    if (status === 'Processed' || status === 'Active' || status === 'Approved') {
      bg = '#DCFCE7';
      fg = '#15803D';
    } else if (status === 'Pending') {
      bg = '#FEF3C7';
      fg = '#B45309';
    }

    return (
      <button
        type="button"
        title="Click to cycle status (Processed -> Pending -> On Hold)"
        onClick={(e) => handleStatusToggle(e, emp)}
        style={{
          background: bg,
          color: fg,
          fontSize: 11.5,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 20,
          border: 'none',
          cursor: 'pointer',
          transition: 'all .12s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        {status}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HR Manager View-Only Policy Notice */}
      {user?.role === 'manager' && (
        <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="font-bold shrink-0">🔒 View-Only Audit Mode:</span>
            <span>You have audit access to review computed salaries and statutory deductions. Modifying formulas or executing disbursements is restricted to Payroll Officers and Finance Directors.</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-200/80 text-amber-950 px-2.5 py-0.5 rounded-full shrink-0">
            HR Manager
          </span>
        </div>
      )}

      {/* Title & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-1.5 h-6 bg-[#2E6BE6] rounded-full" />
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="text-xl sm:text-2xl font-extrabold text-[#101828] tracking-tight">
              Payroll Computation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] font-normal pl-4 truncate">
            Calculate gross pay, statutory deductions, HMO, claims reimbursement & net payout — {selectedMonth}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          {/* Enroll Employee Button (Admin, Manager, Officer, Director) */}
          {canPerformAction(user?.role, 'ENROLL_EMPLOYEE') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 text-[#2E6BE6] font-semibold text-xs transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
              title="Enroll new employee into master roster and payroll sheet"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#2E6BE6]" />
              <span>Enroll Employee</span>
            </button>
          )}

          {/* New Custom Period Button (Payroll Officer / Admin) */}
          {canPerformAction(user?.role, 'COMPUTE_PAYROLL') && (
            <button
              type="button"
              onClick={() => setShowNewPeriodModal(true)}
              className="px-3 py-2 rounded-lg bg-white border border-[#D0D5DD] hover:border-[#2E6BE6] hover:bg-blue-50/50 text-xs font-bold text-[#2E6BE6] transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
              title="Create a new custom payroll period (e.g. 13th Month Pay, bonus, or custom cut-off)"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#2E6BE6]" />
              <span>+ New Period</span>
            </button>
          )}

          {/* Month / Cut-off Period Selector */}
          <div className="relative shrink-0">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-white border border-[#D0D5DD] hover:border-slate-400 text-xs font-semibold text-[#101828] px-3.5 py-2 pr-8 rounded-lg outline-none focus:border-[#2E6BE6] cursor-pointer shadow-xs whitespace-nowrap"
            >
              {customPeriods.length > 0 && (
                <optgroup label="── ✨ Custom / Ad-hoc Periods ──">
                  {customPeriods.map(cp => renderPeriodOption(cp.period_name, cp.cut_off_type || 'Custom'))}
                </optgroup>
              )}
              <optgroup label="── 📅 Current Live Periods (2026) ──">
                {renderPeriodOption('September 1–15, 2026', '1st Cut-off')}
                {renderPeriodOption('September 16–30, 2026', '2nd Cut-off')}
                {renderPeriodOption('September 2026', 'Monthly')}
                {renderPeriodOption('October 1–15, 2026', '1st Cut-off')}
                {renderPeriodOption('October 16–31, 2026', '2nd Cut-off')}
                {renderPeriodOption('October 2026', 'Monthly')}
                {renderPeriodOption('November 1–15, 2026', '1st Cut-off')}
                {renderPeriodOption('November 16–30, 2026', '2nd Cut-off')}
                {renderPeriodOption('November 2026', 'Monthly')}
                {renderPeriodOption('December 1–15, 2026', '1st Cut-off')}
                {renderPeriodOption('December 16–31, 2026', '2nd Cut-off')}
                {renderPeriodOption('December 2026', 'Monthly')}
              </optgroup>
              <optgroup label="── Demo / Historical (2024) ──">
                {renderPeriodOption('June 2024', 'Monthly')}
                {renderPeriodOption('July 2024', 'Monthly')}
                {renderPeriodOption('August 2024', 'Monthly')}
              </optgroup>
              <optgroup label="── Semi-Monthly Cut-offs 2024 ──">
                {renderPeriodOption('July 1–15, 2024', '1st Cut-off')}
                {renderPeriodOption('July 16–31, 2024', '2nd Cut-off')}
                {renderPeriodOption('August 1–15, 2024', '1st Cut-off')}
                {renderPeriodOption('August 16–31, 2024', '2nd Cut-off')}
                {renderPeriodOption('September 1–15, 2024', '1st Cut-off')}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Compute Payroll Button — Requires RBAC (officer/admin) AND Approved pipeline status */}
          {(() => {
            const periodStatus = period?.status || 'Draft';
            const hasRole = canPerformAction(user?.role, 'COMPUTE_PAYROLL');
            const approvedStatuses = ['Approved', 'Finalized', 'Paid'];
            const isApproved = approvedStatuses.includes(periodStatus);
            const canCompute = hasRole && isApproved && !isComputing;

            const getTitle = () => {
              if (!hasRole) return '⛔ Requires Payroll Officer, Finance Director, or System Administrator permission';
              if (!isApproved) return `⚠️ Period must be Approved by Finance Director first (current: "${periodStatus}"). Complete: Draft → For Review → Approve.`;
              return '⚡ Execute live cross-module payroll computation (RBAC: Officer / Director / Admin)';
            };

            return (
              <button
                onClick={handleCompute}
                disabled={!canCompute}
                title={getTitle()}
                className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all flex items-center space-x-1.5 shadow-xs shrink-0 whitespace-nowrap ${
                  canCompute
                    ? 'bg-[#2E6BE6] hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${canCompute ? 'fill-white' : 'text-slate-400'} ${isComputing ? 'animate-bounce' : ''}`} />
                <span>
                  {isComputing ? 'Computing Live...' : !hasRole ? 'Compute Payroll' : !isApproved ? `Compute Payroll (${periodStatus})` : 'Compute Payroll'}
                </span>
              </button>
            );
          })()}
        </div>
      </div>

      {/* Interactive 5-Stage Workflow Stepper & Governance Guidance */}
      {(() => {
        const currentLifecycle = period?.status || 'Draft';
        const lifecycleOrder = ['Draft', 'For Review', 'Approved', 'Finalized', 'Paid'];
        const currentIdx = lifecycleOrder.indexOf(currentLifecycle);

        const steps = [
          { key: 'Draft', number: 1, title: 'Draft Preparation', role: 'Payroll Officer', desc: 'Wages & deductions computed' },
          { key: 'For Review', number: 2, title: 'Executive Review', role: 'Finance Director', desc: 'Queued for audit & sign-off' },
          { key: 'Approved', number: 3, title: 'Finance Approval', role: 'Finance Director', desc: 'Approved for finalization' },
          { key: 'Finalized', number: 4, title: 'Finalized & Locked', role: 'Finance Director', desc: 'Tamper-proof lock & claims' },
          { key: 'Paid', number: 5, title: 'Disbursed / Paid', role: 'Finance Director', desc: 'Payout released & rollover' }
        ];

        return (
          <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-xs p-5 space-y-4">
            {/* Header & Cut-Off Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${period?.is_locked ? 'bg-amber-500 animate-pulse' : currentLifecycle === 'Paid' ? 'bg-[#15803D]' : 'bg-[#2E6BE6]'}`} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Payroll Lifecycle &amp; Approval Pipeline
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      currentLifecycle === 'Paid' ? 'bg-[#DCFCE7] text-[#15803D]' :
                      currentLifecycle === 'Finalized' ? 'bg-[#EFF6FF] text-[#2E6BE6]' :
                      currentLifecycle === 'Approved' ? 'bg-[#DCFCE7] text-[#15803D]' :
                      currentLifecycle === 'For Review' ? 'bg-[#FEF3C7] text-[#B45309]' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {period?.is_locked ? '🔒 ' : ''}Stage {currentIdx + 1} of 5: {currentLifecycle}
                    </span>
                    {period?.is_semi_monthly && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        period?.cut_off_type === '1st'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {period?.cut_off_type === '1st' ? '📅 1st Cut-off — BIR Only' : '📅 2nd Cut-off — Full Statutory'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Cut-off: <strong>{period?.cut_off_start || period?.start_date || '2026-09-01'} to {period?.cut_off_end || period?.end_date || '2026-09-15'}</strong> • Payout: <strong>{period?.payout_date || 'September 15, 2026'}</strong>
                  </p>
                </div>
              </div>

              {/* Reset to Draft for demo testing */}
              {['admin', 'director'].includes(user?.role) && currentLifecycle !== 'Draft' && (
                <button
                  type="button"
                  onClick={() => handlePeriodStatusChange('Draft')}
                  disabled={isUpdatingPeriod}
                  title="Reset to Draft (Unlocks historical editing for testing)"
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  ↺ Reset to Draft (Demo)
                </button>
              )}
            </div>

            {/* Visual 5-Stage Progression Track */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {steps.map((s, idx) => {
                const isCompleted = currentLifecycle === 'Paid' ? true : idx < currentIdx;
                const isActive = currentLifecycle === 'Paid' ? false : idx === currentIdx;

                return (
                  <div
                    key={s.key}
                    className={`p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isActive
                        ? 'bg-blue-50/70 border-[#2E6BE6] ring-1 ring-[#2E6BE6]/30 shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                        : 'bg-slate-50/60 border-slate-200/80 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-[#2E6BE6] text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        Stage {s.number}
                      </span>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isActive ? (
                        <span className="flex h-2.5 w-2.5 relative shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2E6BE6]"></span>
                        </span>
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className={`text-xs font-bold leading-tight ${isActive ? 'text-[#2E6BE6]' : isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                        {s.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Auth: <span className={isActive ? 'font-semibold text-slate-800' : ''}>{s.role}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contextual Governance Guidance & Next Action Banner */}
            {currentLifecycle === 'Draft' && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-[#2E6BE6] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Current Stage: Preparation &amp; Computation</div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Payroll Officer verifies gross wages, overtime, and statutory deductions. When ready, click <strong>"Submit For Review"</strong> to send this batch to the Finance Director.
                    </p>
                  </div>
                </div>
                {canPerformAction(user?.role, 'SUBMIT_FOR_REVIEW') ? (
                  <button
                    type="button"
                    onClick={() => handlePeriodStatusChange('For Review')}
                    disabled={isUpdatingPeriod}
                    title="Submit draft for Finance Director approval"
                    className="px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm shrink-0 bg-[#B45309] hover:bg-amber-800 text-white cursor-pointer active:scale-[0.98]"
                  >
                    <span>Submit For Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => switchRole('officer')}
                      className="px-3.5 py-2 rounded-lg bg-[#2E6BE6] hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                      title="Switch to Carlos Reyes (Payroll Officer) to submit this batch"
                    >
                      <span>Switch to Payroll Officer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentLifecycle === 'For Review' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span>Waiting for Executive Audit by Finance Director</span>
                      <span className="text-[10px] bg-amber-200/70 text-amber-900 font-bold px-1.5 py-0.2 rounded">Separation of Duties</span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      The payroll batch has been submitted and is currently in the <strong>Finance Director's approval queue</strong>. Under financial governance, the preparer cannot sign off on their own calculations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {canPerformAction(user?.role, 'APPROVE_PAYROLL') ? (
                    <button
                      type="button"
                      onClick={() => handlePeriodStatusChange('Approved')}
                      disabled={isUpdatingPeriod}
                      className="px-4 py-2 rounded-lg bg-[#2E6BE6] hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Payroll Batch</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchRole('director')}
                      className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                      title="Switch to Diana Sterling (Finance Director) to test the approval stage"
                    >
                      <span>Switch to Finance Director</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentLifecycle === 'Approved' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-950">Approved by Finance Director • Ready for Final Lock</div>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Payroll calculations are verified. Click <strong>"Finalize &amp; Lock Period"</strong> to freeze all deductions, lock the period against changes, and mark approved employee claims as reimbursed.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canPerformAction(user?.role, 'FINALIZE_AND_LOCK') ? (
                    <button
                      type="button"
                      onClick={() => handlePeriodStatusChange('Finalized')}
                      disabled={isUpdatingPeriod}
                      className="px-4 py-2 rounded-lg bg-[#2E6BE6] hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-[0.98]"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Finalize &amp; Lock Period</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchRole('director')}
                      className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Switch to Finance Director</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentLifecycle === 'Finalized' && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-[#2E6BE6] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-blue-950">Period Finalized &amp; Locked • Ready for Disbursement</div>
                    <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                      Records are tamper-proof and immutable. Approved expense claims and loan amortization deductions are stamped. Click <strong>"Disburse / Mark as Paid"</strong> to release payouts and roll over to the next pay cycle.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canPerformAction(user?.role, 'DISBURSE_PAYROLL') ? (
                    <button
                      type="button"
                      onClick={() => handlePeriodStatusChange('Paid')}
                      disabled={isUpdatingPeriod}
                      className="px-4 py-2 rounded-lg bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-[0.98]"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Disburse / Mark as Paid</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchRole('director')}
                      className="px-3.5 py-2 rounded-lg bg-[#2E6BE6] hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Switch to Finance Director</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentLifecycle === 'Paid' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-950">Payout Successfully Disbursed &amp; Completed</div>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Direct deposit advice generated. All employee payslips are released. Automated cut-off rollover to the next cycle has been queued.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const next = (selectedMonth === 'September 1–15, 2026' || period?.cut_off_type === '1st')
                        ? 'September 16–30, 2026'
                        : 'October 1–15, 2026';
                      setSelectedMonth(next);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                    title="Navigate to the newly rolled-over draft pay cycle"
                  >
                    <span>View Next Pay Cycle ({selectedMonth === 'September 1–15, 2026' ? 'Sep 16–30, 2026' : 'Next Cycle'})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Pay */}
        <div className="bg-white p-5 rounded-[14px] border border-[#E4E8F0] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#64748B]">
              Total Gross Pay
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2E6BE6] flex items-center justify-center font-bold text-sm">
              <DollarSign className="w-4 h-4 text-[#2E6BE6]" />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="text-2xl sm:text-[28px] font-extrabold text-[#101828] tracking-tight">
              {fmtMoney(summary?.total_gross, summary?.total_gross_raw)}
            </div>
            <div className="text-xs text-[#64748B] font-medium mt-0.5">
              {summary?.employees_count || employees.length || 160} employees
            </div>
          </div>
          <div className="flex items-center text-xs font-semibold text-[#15803D] pt-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>{summary?.gross_trend || '+3.4% vs last period'}</span>
          </div>
        </div>

        {/* Total Deductions */}
        <div className="bg-white p-5 rounded-[14px] border border-[#E4E8F0] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#64748B]">
              Total Deductions
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center font-bold text-sm">
              <TrendingDown className="w-4 h-4 text-[#DC2626]" />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="text-2xl sm:text-[28px] font-extrabold text-[#101828] tracking-tight">
              {fmtMoney(summary?.total_deductions, summary?.total_deductions_raw)}
            </div>
            <div className="text-xs text-[#64748B] font-medium mt-0.5">
              {summary?.deductions_label || 'Tax + statutory'}
            </div>
          </div>
          <div className="h-4" />
        </div>

        {/* Total Net Payout */}
        <div className="bg-white p-5 rounded-[14px] border border-[#E4E8F0] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold text-[#64748B]">
                Total Net Payout
              </span>
              <button
                type="button"
                onClick={togglePrivacyMode}
                title={privacyMode ? 'Privacy Mode ON — Click to reveal values' : 'Privacy Mode OFF — Click to hide values'}
                className="p-1 rounded-md text-slate-400 hover:text-[#2E6BE6] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-[#2E6BE6]" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2E6BE6] flex items-center justify-center font-bold text-sm">
              <Wallet className="w-4 h-4 text-[#2E6BE6]" />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="text-2xl sm:text-[28px] font-extrabold text-[#101828] tracking-tight">
              {fmtMoney(summary?.total_net, summary?.total_net_raw)}
            </div>
            <div className="text-xs text-[#64748B] font-medium mt-0.5">
              {summary?.payout_date || 'July 25, 2024'}
            </div>
          </div>
          <div className="flex items-center text-xs font-semibold text-[#15803D] pt-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>{summary?.net_trend || '+2.8% vs last period'}</span>
          </div>
        </div>

        {/* Employees Processed */}
        <div className="bg-white p-5 rounded-[14px] border border-[#E4E8F0] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#64748B]">
              Employees Processed
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#15803D] flex items-center justify-center font-bold text-sm">
              <Users className="w-4 h-4 text-[#15803D]" />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="text-2xl sm:text-[28px] font-extrabold text-[#101828] tracking-tight">
              {summary?.employees_processed || '142/160'}
            </div>
            <div className="text-xs text-[#64748B] font-medium mt-0.5">
              {summary?.processed_percentage || '88.75% complete'}
            </div>
          </div>
          <div className="h-4" />
        </div>
      </div>

      {/* Main Computation Sheet Table */}
      <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E4E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Payroll Computation Sheet — {selectedMonth}
            </h2>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              All amounts in Philippine Peso (₱) • Click any row to view & print official payslip
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap gap-2">
            {/* Table Search Bar */}
            <div className="relative w-44 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search employee, dept, code..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#2E6BE6] focus:ring-1 focus:ring-[#2E6BE6] outline-none transition-all shadow-xs"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {canPerformAction(user?.role, 'ENROLL_EMPLOYEE') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-blue-100 text-[#2E6BE6] border border-blue-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                title="Enroll a new employee into payroll"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Enroll Employee</span>
              </button>
            )}

            {/* Privacy Mode Table Toolbar Toggle */}
            <button
              type="button"
              onClick={togglePrivacyMode}
              title={privacyMode ? 'Privacy Mode ON — Click to reveal values' : 'Privacy Mode OFF — Click to hide values'}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                privacyMode
                  ? 'bg-blue-50 border-blue-200 text-[#2E6BE6]'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-[#2E6BE6]" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{privacyMode ? 'Masked' : 'Mask Pay'}</span>
            </button>

            <button
              onClick={() => loadComputation(selectedMonth)}
              title="Refresh live data"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Previous Period Adjustments (PPA) Alert Banner */}
        {employees.some(e => e.has_ppa) && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 mx-5 my-3 rounded-r-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🔄</span>
              <div>
                <span className="font-bold">Previous Period Adjustments (PPA) Active:</span>
                <span className="ml-1 text-amber-800">
                  This cut-off includes <strong>{fmtMoney(employees.reduce((s, e) => s + (e.ppa_earnings || 0), 0))}</strong> in late-approved overtime/claims from prior locked periods across {employees.filter(e => e.has_ppa).length} employee(s).
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full w-max shrink-0">
              Auto-Credited in Active Cut-Off
            </span>
          </div>
        )}

        {/* Semi-Monthly Statutory Schedule Info Banner (1st Cut-off Rule) */}
        {employees.some(e => e.is_semi_monthly && e.cut_off_type === '1st') && (
          <div className="bg-sky-50 border-l-4 border-sky-500 p-3.5 mx-5 mb-3 rounded-r-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-sky-900 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-base">ℹ️</span>
              <div>
                <span className="font-bold">1st Cut-off Statutory Schedule:</span>
                <span className="ml-1 text-sky-800">
                  Per Philippine payroll standard, monthly statutory contributions (<strong>SSS, PhilHealth, Pag-IBIG</strong>) are consolidated and deducted on the <strong>2nd Cut-off (16th–30th)</strong>. This 1st cut-off deducts BIR Withholding Tax only.
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold bg-sky-200/80 text-sky-900 px-2 py-0.5 rounded-full w-max shrink-0">
              Deducted on 2nd Cut-off
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E4E8F0] text-[#64748B] font-bold uppercase tracking-wider bg-[#F8FAFC]">
              <tr>
                <th className="py-3 px-4">EMPLOYEE</th>
                <th className="py-3 px-3">BASIC PAY</th>
                <th className="py-3 px-3">OT PAY</th>
                <th className="py-3 px-3 text-[#2E6BE6]">HOLIDAY / NSD</th>
                <th className="py-3 px-3 text-indigo-600">ALLOWANCES</th>
                <th className="py-3 px-3 text-emerald-600">CLAIMS / REIMB</th>
                <th className="py-3 px-3">GROSS</th>
                <th className="py-3 px-3 text-red-500">BIR TAX</th>
                <th className="py-3 px-3 text-red-500">SSS</th>
                <th className="py-3 px-3 text-red-500">PHILHEALTH</th>
                <th className="py-3 px-3 text-red-500">PAG-IBIG</th>
                <th className="py-3 px-3 text-pink-600">HMO DED.</th>
                <th className="py-3 px-3 text-amber-600">LOAN ADV.</th>
                <th className="py-3 px-3 text-[#2E6BE6] font-black">NET PAY</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr 
                  key={emp.id} 
                  onClick={() => setSelectedPayslipId(emp.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  {/* Employee Info */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#2E6BE6] font-bold flex items-center justify-center text-xs shrink-0">
                        {emp.initials || `${emp.first_name[0]}${emp.last_name[0]}`}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 leading-tight group-hover:text-[#2E6BE6] transition-colors">
                          {emp.first_name} {emp.last_name}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-tight flex items-center gap-1.5 mt-0.5">
                          <span>{emp.department}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-slate-500">{emp.employee_code}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Basic Pay + Attendance Deductions */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-800 font-mono">
                    <div>{fmtMoney(emp.basic_pay)}</div>
                    {emp.tardiness_deduction > 0 && (
                      <div className="text-[10px] text-amber-600 font-sans font-medium">
                        -{emp.late_minutes}m Late (-{fmtMoney(emp.tardiness_deduction)})
                      </div>
                    )}
                    {emp.absence_deduction > 0 && (
                      <div className="text-[10px] text-rose-600 font-sans font-medium">
                        -{emp.absent_days}d Absent (-{fmtMoney(emp.absence_deduction)})
                      </div>
                    )}
                  </td>

                  {/* OT Pay (From Timekeeping) */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-800 font-mono">
                    {Number(emp.ot_pay) > 0 ? (
                      <div>
                        <div>{fmtMoney(emp.ot_pay)}</div>
                        {emp.ot_hours > 0 && (
                          <div className="text-[10px] text-emerald-600 font-sans font-semibold">
                            +{emp.ot_hours} hrs OT
                          </div>
                        )}
                      </div>
                    ) : '—'}
                  </td>

                  {/* Holiday Pay & Night Shift Differential (DOLE Arts. 86 & 91-94) */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-medium font-mono text-purple-700">
                    {(Number(emp.holiday_pay) > 0 || Number(emp.night_diff_pay) > 0) ? (
                      <div>
                        <div>+{fmtMoney((emp.holiday_pay || 0) + (emp.night_diff_pay || 0))}</div>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {Number(emp.holiday_pay) > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              Holiday {emp.holiday_hours}h
                            </span>
                          )}
                          {Number(emp.night_diff_pay) > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              NSD {emp.night_diff_hours}h
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Allowances & Incentives */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-medium text-indigo-700 font-mono">
                    {Number(emp.allowances) > 0 ? (
                      <div>
                        <div>+{fmtMoney(emp.allowances)}</div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {emp.is_semi_monthly ? 'Cut-off Share' : 'Monthly'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Approved Claims Reimbursement */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold font-mono text-emerald-600">
                    {Number(emp.reimbursements) > 0 ? (
                      <div>
                        <div>+{fmtMoney(emp.reimbursements)}</div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Claims
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Gross */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono">
                    <div className="font-extrabold text-slate-900">{fmtMoney(emp.gross_pay)}</div>
                    {emp.has_ppa && (
                      <div 
                        title={emp.ppa_items?.map(p => `${p.label || p.description}: ${fmtMoney(p.amount)}`).join('\n')}
                        className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs cursor-help"
                      >
                        <span>🔄 PPA: +{fmtMoney(emp.ppa_earnings)}</span>
                      </div>
                    )}
                  </td>

                  {/* BIR Tax */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-red-500 font-mono">
                    {fmtMoney(emp.bir_tax)}
                  </td>

                  {/* SSS */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold font-mono">
                    {Number(emp.sss) > 0 ? (
                      <span className="text-red-500">{fmtMoney(emp.sss)}</span>
                    ) : emp.is_semi_monthly && emp.cut_off_type === '1st' ? (
                      <div>
                        <span className="text-slate-400">₱0</span>
                        <div className="text-[9px] text-slate-400 font-sans font-normal">2nd cut-off</div>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* PhilHealth */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold font-mono">
                    {Number(emp.philhealth) > 0 ? (
                      <span className="text-red-500">{fmtMoney(emp.philhealth)}</span>
                    ) : emp.is_semi_monthly && emp.cut_off_type === '1st' ? (
                      <div>
                        <span className="text-slate-400">₱0</span>
                        <div className="text-[9px] text-slate-400 font-sans font-normal">2nd cut-off</div>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Pag-IBIG */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold font-mono">
                    {Number(emp.pagibig) > 0 ? (
                      <span className="text-red-500">{fmtMoney(emp.pagibig)}</span>
                    ) : emp.is_semi_monthly && emp.cut_off_type === '1st' ? (
                      <div>
                        <span className="text-slate-400">₱0</span>
                        <div className="text-[9px] text-slate-400 font-sans font-normal">2nd cut-off</div>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* HMO Deduction */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-pink-600 font-mono">
                    {Number(emp.hmo_deduction) > 0 ? (
                      <div>
                        <div>-{fmtMoney(emp.hmo_deduction)}</div>
                        <div className="text-[9px] text-pink-500 font-sans flex items-center gap-1">
                          <span>{emp.hmo_plan || 'HMO'}</span>
                          {emp.hmo_is_prorated && (
                            <span className="px-1 py-0.2 text-[8px] rounded bg-pink-100 text-pink-700 font-bold uppercase">
                              Prorated
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Microloan Advance Deduction */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-amber-600 font-mono">
                    {Number(emp.microloan_deduction) > 0 ? (
                      <div>
                        <div>-{fmtMoney(emp.microloan_deduction)}</div>
                        <div className="text-[9px] text-amber-500 font-sans">
                          Bal: {fmtMoney(emp.loan_balance_remaining)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Net Pay */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-black text-[#2E6BE6] font-mono text-sm">
                    {fmtMoney(emp.net_pay)}
                  </td>

                  {/* Interactive Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(emp)}
                  </td>

                  {/* Action: View Official Payslip & Offboarding */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayslipId(emp.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#2E6BE6] text-slate-600 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Generate & View Official Payslip"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Payslip</span>
                      </button>

                      {canPerformAction(user?.role, 'OFFBOARD_EMPLOYEE') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOffboardEmployee(emp);
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border ${
                            emp.employment_status === 'Resigned' || emp.employment_status === 'Separated'
                              ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                              : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white'
                          }`}
                          title={emp.employment_status === 'Resigned' || emp.employment_status === 'Separated' ? 'View Final Pay Settlement & BIR 2316' : 'Initiate Offboarding & Backpay Computation'}
                        >
                          <Briefcase className="w-3 h-3" />
                          <span>{emp.employment_status === 'Resigned' || emp.employment_status === 'Separated' ? 'Backpay / 2316' : 'Offboard'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="16" className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">No employees found for {selectedMonth}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Click "Enroll Employee" or "Compute Payroll" to populate records.</p>
                    {canPerformAction(user?.role, 'ENROLL_EMPLOYEE') && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-3 px-3.5 py-1.5 rounded-xl bg-purple-50 text-[#7c3aed] border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition-colors inline-flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Enroll Employee</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7c3aed]" />
                Enroll Employee into {selectedMonth} Payroll
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">First Name</label>
                  <input
                    required
                    type="text"
                    value={newEmp.first_name}
                    onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#7c3aed]"
                    placeholder="e.g. Kenneth"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Last Name</label>
                  <input
                    required
                    type="text"
                    value={newEmp.last_name}
                    onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#7c3aed]"
                    placeholder="e.g. Morales"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#7c3aed] bg-white font-medium"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Position</label>
                  <input
                    required
                    type="text"
                    value={newEmp.position}
                    onChange={(e) => setNewEmp({ ...newEmp, position: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#7c3aed]"
                    placeholder="e.g. QA Automation Lead"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">
                    Monthly Basic (₱)
                  </label>
                  <input
                    required
                    type="number"
                    value={newEmp.basic_pay}
                    onChange={(e) => setNewEmp({ ...newEmp, basic_pay: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 font-semibold"
                    placeholder="e.g. 75000"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    Cut-off: ₱{(Number(newEmp.basic_pay || 0) / 2).toLocaleString()}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">
                    OT Pay (₱)
                  </label>
                  <input
                    type="number"
                    value={newEmp.ot_pay}
                    onChange={(e) => setNewEmp({ ...newEmp, ot_pay: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 font-semibold"
                    placeholder="e.g. 2500"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    Rendered this cycle
                  </span>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">
                    Monthly Allowances (₱)
                  </label>
                  <input
                    type="number"
                    value={newEmp.allowances}
                    onChange={(e) => setNewEmp({ ...newEmp, allowances: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 font-semibold"
                    placeholder="e.g. 4000"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    Cut-off: ₱{(Number(newEmp.allowances || 0) / 2).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEmp}
                  className={`px-4 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-md shadow-purple-600/20 flex items-center gap-1.5 ${
                    isSubmittingEmp ? 'opacity-70 cursor-wait' : 'cursor-pointer'
                  }`}
                >
                  {isSubmittingEmp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Enroll Employee into Payroll</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {selectedPayslipId && (
        <PayslipModal
          employeeId={selectedPayslipId}
          selectedMonth={selectedMonth}
          onClose={() => setSelectedPayslipId(null)}
        />
      )}

      {/* Offboarding & Final Pay Modal */}
      {selectedOffboardEmployee && (
        <FinalPayModal
          employee={selectedOffboardEmployee}
          onClose={() => setSelectedOffboardEmployee(null)}
          onOffboardSuccess={() => {
            loadComputation(selectedMonth);
            showToast('✅ Employee offboarded and backpay settlement recorded.');
          }}
        />
      )}

      {/* Payroll Computation Report Modal — pops out after clicking Compute Payroll */}
      {showReport && (
        <PayrollComputationReportModal
          employees={employees}
          summary={summary}
          period={period}
          selectedMonth={selectedMonth}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* New Custom Payroll Period Modal */}
      <NewPayrollPeriodModal
        isOpen={showNewPeriodModal}
        onClose={() => setShowNewPeriodModal(false)}
        onSuccess={handlePeriodCreated}
      />
    </div>
  );
}
