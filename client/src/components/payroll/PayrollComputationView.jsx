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
  Briefcase
} from 'lucide-react';
import PayslipModal from '../payslips/PayslipModal';
import FinalPayModal from '../offboarding/FinalPayModal';
import PayrollComputationReportModal from './PayrollComputationReportModal';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../utils/rbac';
import { api } from '../../services/api';
import { ACCENT, badgeStyle } from '../../theme';


function formatCurrency(val, rawVal) {
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
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('September 1\u201315, 2026');
  const [isComputing, setIsComputing] = useState(false);
  const [isUpdatingPeriod, setIsUpdatingPeriod] = useState(false);
  const [selectedPayslipId, setSelectedPayslipId] = useState(null);
  const [selectedOffboardEmployee, setSelectedOffboardEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmittingEmp, setIsSubmittingEmp] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [localSearch, setLocalSearch] = useState('');


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
      if (data.period) setPeriod(data.period);
    } catch (err) {
      console.error('Error loading payroll computation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComputation(selectedMonth);
  }, [selectedMonth]);

  const handleCompute = async () => {
    if (!canPerformAction(user?.role, 'COMPUTE_PAYROLL')) {
      showToast('⛔ Permission Denied: Only Payroll Officer or System Admin can run payroll computation.');
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

          {/* Month / Cut-off Period Selector */}
          <div className="relative shrink-0">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-white border border-[#D0D5DD] hover:border-slate-400 text-xs font-semibold text-[#101828] px-3.5 py-2 pr-8 rounded-lg outline-none focus:border-[#2E6BE6] cursor-pointer shadow-xs whitespace-nowrap"
            >
              <optgroup label="── 📅 Current Live Periods (2026) ──">
                <option value="September 1–15, 2026">🟢 Sep 1–15, 2026 (1st Cut-off) ← TODAY</option>
                <option value="September 16–30, 2026">September 16–30, 2026 (2nd Cut-off)</option>
                <option value="September 2026">September 2026 (Monthly)</option>
                <option value="October 1–15, 2026">October 1–15, 2026 (1st Cut-off)</option>
                <option value="October 16–31, 2026">October 16–31, 2026 (2nd Cut-off)</option>
                <option value="October 2026">October 2026 (Monthly)</option>
                <option value="November 1–15, 2026">November 1–15, 2026 (1st Cut-off)</option>
                <option value="November 16–30, 2026">November 16–30, 2026 (2nd Cut-off)</option>
                <option value="November 2026">November 2026 (Monthly)</option>
                <option value="December 1–15, 2026">December 1–15, 2026 (1st Cut-off)</option>
                <option value="December 16–31, 2026">December 16–31, 2026 (2nd Cut-off)</option>
                <option value="December 2026">December 2026 (Monthly)</option>
              </optgroup>
              <optgroup label="── Demo / Historical (2024) ──">
                <option value="June 2024">June 2024 (Monthly)</option>
                <option value="July 2024">July 2024 (Monthly)</option>
                <option value="August 2024">August 2024 (Monthly)</option>
              </optgroup>
              <optgroup label="── Semi-Monthly Cut-offs 2024 ──">
                <option value="July 1–15, 2024">July 1–15, 2024 (1st Cut-off)</option>
                <option value="July 16–31, 2024">July 16–31, 2024 (2nd Cut-off)</option>
                <option value="August 1–15, 2024">August 1–15, 2024 (1st Cut-off)</option>
                <option value="August 16–31, 2024">August 16–31, 2024 (2nd Cut-off)</option>
                <option value="September 1–15, 2024">September 1–15, 2024 (1st Cut-off)</option>
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Compute Payroll Button (Live Calculation - Officer / Admin) */}
          <button
            onClick={handleCompute}
            disabled={isComputing || !canPerformAction(user?.role, 'COMPUTE_PAYROLL')}
            title={!canPerformAction(user?.role, 'COMPUTE_PAYROLL') ? 'Requires Payroll Officer or System Administrator permission' : 'Execute live cross-module payroll computation'}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all flex items-center space-x-1.5 shadow-xs shrink-0 whitespace-nowrap ${
              canPerformAction(user?.role, 'COMPUTE_PAYROLL')
                ? 'bg-[#2E6BE6] hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${canPerformAction(user?.role, 'COMPUTE_PAYROLL') ? 'fill-white' : 'text-slate-400'} ${isComputing ? 'animate-bounce' : ''}`} />
            <span>{isComputing ? 'Computing Live...' : 'Compute Payroll'}</span>
          </button>
        </div>
      </div>

      {/* Cross-Module Period Status & Lifecycle Bar */}
      <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-xs p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${period?.is_locked ? 'bg-amber-500 animate-pulse' : period?.status === 'Paid' ? 'bg-[#15803D]' : 'bg-[#2E6BE6]'}`} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#101828]">Period Lifecycle:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                period?.status === 'Paid' ? 'bg-[#DCFCE7] text-[#15803D]' :
                period?.status === 'Finalized' ? 'bg-[#EFF6FF] text-[#2E6BE6]' :
                period?.status === 'Approved' ? 'bg-[#DCFCE7] text-[#15803D]' :
                period?.status === 'For Review' ? 'bg-[#FEF3C7] text-[#B45309]' :
                'bg-slate-100 text-slate-700'
              }`}>
                {period?.is_locked ? '🔒 ' : ''}{period?.status || 'Draft'}
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
              {period?.is_locked && (
                <span className="text-[11px] text-[#B45309] font-semibold bg-[#FEF3C7] px-2 py-0.5 rounded border border-amber-200">
                  Locked &amp; Claims Reimbursed
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Cut-off: {period?.start_date || '2024-07-01'} to {period?.end_date || '2024-07-31'} • Payout: {period?.payout_date || 'July 25, 2024'}
              {period?.is_semi_monthly && (
                <span className="ml-2 text-slate-500 font-medium">
                  {period?.cut_off_type === '1st'
                    ? '• SSS/PhilHealth/Pag-IBIG deferred to 2nd cut-off'
                    : '• Full statutory deductions applied this cut-off'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Lifecycle Progression Action Buttons with RBAC Gates */}
        <div className="flex items-center gap-2 flex-wrap">
          {(!period || period?.status === 'Draft') && (
            <button
              onClick={() => handlePeriodStatusChange('For Review')}
              disabled={isUpdatingPeriod || !canPerformAction(user?.role, 'SUBMIT_FOR_REVIEW')}
              title={!canPerformAction(user?.role, 'SUBMIT_FOR_REVIEW') ? 'Restricted to Payroll Officer or System Admin' : 'Submit draft for Finance Director approval'}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs ${
                canPerformAction(user?.role, 'SUBMIT_FOR_REVIEW')
                  ? 'bg-[#B45309] hover:bg-amber-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Submit For Review</span>
            </button>
          )}

          {period?.status === 'For Review' && (
            <button
              onClick={() => handlePeriodStatusChange('Approved')}
              disabled={isUpdatingPeriod || !canPerformAction(user?.role, 'APPROVE_PAYROLL')}
              title={!canPerformAction(user?.role, 'APPROVE_PAYROLL') ? 'Restricted to Finance Director or System Admin' : 'Approve payroll figures for lock and disbursement'}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs ${
                canPerformAction(user?.role, 'APPROVE_PAYROLL')
                  ? 'bg-[#2E6BE6] hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Payroll</span>
            </button>
          )}

          {period?.status === 'Approved' && (
            <button
              onClick={() => handlePeriodStatusChange('Finalized')}
              disabled={isUpdatingPeriod || !canPerformAction(user?.role, 'FINALIZE_AND_LOCK')}
              title={!canPerformAction(user?.role, 'FINALIZE_AND_LOCK') ? 'Restricted to Finance Director or System Admin' : 'Finalize period, lock from editing, and reimburse approved claims'}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs ${
                canPerformAction(user?.role, 'FINALIZE_AND_LOCK')
                  ? 'bg-[#2E6BE6] hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Finalize &amp; Lock Period</span>
            </button>
          )}

          {period?.status === 'Finalized' && (
            <button
              onClick={() => handlePeriodStatusChange('Paid')}
              disabled={isUpdatingPeriod || !canPerformAction(user?.role, 'DISBURSE_PAYROLL')}
              title={!canPerformAction(user?.role, 'DISBURSE_PAYROLL') ? 'Restricted to Finance Director or System Admin' : 'Mark direct deposit as completed and paid'}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs ${
                canPerformAction(user?.role, 'DISBURSE_PAYROLL')
                  ? 'bg-[#15803D] hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Disburse / Mark as Paid</span>
            </button>
          )}

          {/* Reset button for testing and demonstration */}
          {(period?.status === 'Finalized' || period?.status === 'Paid' || period?.status === 'Approved') && ['admin', 'director'].includes(user?.role) && (
            <button
              onClick={() => handlePeriodStatusChange('Draft')}
              disabled={isUpdatingPeriod}
              title="Reset to Draft (Unlocks historical editing for testing)"
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
            >
              Reset to Draft
            </button>
          )}
        </div>
      </div>

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
              {formatCurrency(summary?.total_gross, summary?.total_gross_raw)}
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
              {formatCurrency(summary?.total_deductions, summary?.total_deductions_raw)}
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
            <span className="text-[12px] font-semibold text-[#64748B]">
              Total Net Payout
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2E6BE6] flex items-center justify-center font-bold text-sm">
              <Wallet className="w-4 h-4 text-[#2E6BE6]" />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="text-2xl sm:text-[28px] font-extrabold text-[#101828] tracking-tight">
              {formatCurrency(summary?.total_net, summary?.total_net_raw)}
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
                  This cut-off includes <strong>₱{Number(employees.reduce((s, e) => s + (e.ppa_earnings || 0), 0)).toLocaleString()}</strong> in late-approved overtime/claims from prior locked periods across {employees.filter(e => e.has_ppa).length} employee(s).
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
                    <div>₱{Number(emp.basic_pay).toLocaleString()}</div>
                    {emp.tardiness_deduction > 0 && (
                      <div className="text-[10px] text-amber-600 font-sans font-medium">
                        -{emp.late_minutes}m Late (-₱{Number(emp.tardiness_deduction).toLocaleString()})
                      </div>
                    )}
                    {emp.absence_deduction > 0 && (
                      <div className="text-[10px] text-rose-600 font-sans font-medium">
                        -{emp.absent_days}d Absent (-₱{Number(emp.absence_deduction).toLocaleString()})
                      </div>
                    )}
                  </td>

                  {/* OT Pay (From Timekeeping) */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-800 font-mono">
                    {Number(emp.ot_pay) > 0 ? (
                      <div>
                        <div>₱{Number(emp.ot_pay).toLocaleString()}</div>
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
                        <div>+₱{Number((emp.holiday_pay || 0) + (emp.night_diff_pay || 0)).toLocaleString()}</div>
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
                        <div>+₱{Number(emp.allowances).toLocaleString()}</div>
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
                        <div>+₱{Number(emp.reimbursements).toLocaleString()}</div>
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
                    <div className="font-extrabold text-slate-900">₱{Number(emp.gross_pay).toLocaleString()}</div>
                    {emp.has_ppa && (
                      <div 
                        title={emp.ppa_items?.map(p => `${p.label || p.description}: ₱${Number(p.amount).toLocaleString()}`).join('\n')}
                        className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs cursor-help"
                      >
                        <span>🔄 PPA: +₱{Number(emp.ppa_earnings).toLocaleString()}</span>
                      </div>
                    )}
                  </td>

                  {/* BIR Tax */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-red-500 font-mono">
                    ₱{Number(emp.bir_tax).toLocaleString()}
                  </td>

                  {/* SSS */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold font-mono">
                    {Number(emp.sss) > 0 ? (
                      <span className="text-red-500">₱{Number(emp.sss).toLocaleString()}</span>
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
                      <span className="text-red-500">₱{Number(emp.philhealth).toLocaleString()}</span>
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
                      <span className="text-red-500">₱{Number(emp.pagibig).toLocaleString()}</span>
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
                        <div>-₱{Number(emp.hmo_deduction).toLocaleString()}</div>
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
                        <div>-₱{Number(emp.microloan_deduction).toLocaleString()}</div>
                        <div className="text-[9px] text-amber-500 font-sans">
                          Bal: ₱{Number(emp.loan_balance_remaining).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Net Pay */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-black text-[#2E6BE6] font-mono text-sm">
                    ₱{Number(emp.net_pay).toLocaleString()}
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
    </div>
  );
}
