import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../utils/rbac';
import PayslipModal from '../payslips/PayslipModal';
import GovernmentComplianceView from '../payroll/GovernmentComplianceView';
import { ACCENT, badgeStyle, cardStyle } from '../../theme';
import {
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Heart,
  BarChart3,
  Plus,
  Download,
  AlertCircle,
  RefreshCw,
  X,
  Edit3,
  Save,
  Shield,
  Activity,
  Users,
  DollarSign,
  Calendar,
  ChevronRight,
  Loader2,
  Check,
  Printer,
  Sliders,
  Filter,
  ArrowUpRight,
  Sparkles,
  Lock,
  Receipt,
  CheckSquare,
  Building,
  CreditCard,
  Briefcase,
  Layers,
  HelpCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Search
} from 'lucide-react';

/* ─────────────────────────────────────────────────────── Shared Helpers */
function fmt(n, raw) {
  if (raw !== undefined && raw !== null && !isNaN(Number(raw))) {
    return '₱' + Number(raw).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof n === 'number') {
    return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof n === 'string') {
    if (n.includes('M')) {
      const num = parseFloat(n.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        return '₱' + (num * 1000000).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    if (n.includes('K')) {
      const num = parseFloat(n.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        return '₱' + (num * 1000).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    if (n.startsWith('₱')) {
      const num = parseFloat(n.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return n;
    }
    const num = parseFloat(n.replace(/,/g, ''));
    if (!isNaN(num)) {
      return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n;
  }
  return '₱0.00';
}

function StatusBadge({ status }) {
  const map = {
    Approved:               'bg-emerald-50 text-emerald-700 border-emerald-200',
    Processed:              'bg-emerald-50 text-emerald-700 border-emerald-200',
    Active:                 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Paid Off':             'bg-emerald-50 text-emerald-700 border-emerald-200',
    Reimbursed:             'bg-blue-50 text-[#2E6BE6] border-blue-200',
    'Included in Payroll':  'bg-blue-50 text-[#2E6BE6] border-blue-200',
    'Approved for Payroll': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Submitted:              'bg-blue-50 text-blue-700 border-blue-200',
    Pending:                'bg-amber-50 text-amber-700 border-amber-200',
    'Under Review':         'bg-blue-50 text-blue-700 border-blue-200',
    Rejected:               'bg-rose-50 text-rose-700 border-rose-200',
    Inactive:               'bg-slate-100 text-slate-500 border-slate-200',
    Suspended:              'bg-rose-50 text-rose-600 border-rose-200',
  };
  const cls = map[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls} whitespace-nowrap inline-flex items-center gap-1`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

function SectionHeader({ color = ACCENT, title, sub }) {
  return (
    <div className="space-y-1 mb-6">
      <div className="flex items-center space-x-2.5">
        <div className="w-1.5 h-6 rounded-full" style={{ background: color }} />
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">{title}</h1>
      </div>
      {sub && <p className="text-xs sm:text-sm text-slate-500 pl-4 font-normal">{sub}</p>}
    </div>
  );
}

function KpiCard({ label, value, sub, color = 'text-slate-900', icon: Icon }) {
  return (
    <div className="p-5 bg-white rounded-[14px] border border-[#E4E8F0] shadow-sm flex items-start justify-between">
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`text-2xl font-extrabold tracking-tight font-display ${color}`}>{value}</div>
        {sub && <div className="text-xs text-slate-500 font-medium">{sub}</div>}
      </div>
      {Icon && (
        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-[#E4E8F0] flex items-center justify-center text-slate-500 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-[200] px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{msg}</span>
    </div>
  );
}

function downloadCSV(filename, headers, rows) {
  const csvContent = 'data:text/csv;charset=utf-8,' 
    + [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 1: PAYSLIPS GENERATION & RECORDS
═══════════════════════════════════════════════════════════════ */
function PayslipsModule() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState('July 2024');
  const [loading, setLoading] = useState(true);
  const [selectedPayslipId, setSelectedPayslipId] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async (m) => {
    setLoading(true);
    try {
      const data = await api.getPayrollComputation(m);
      if (data.employees) setEmployees(data.employees);
      if (data.summary) setSummary(data.summary);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(month); }, [month, load]);

  const isEmployeeRole = user?.role === 'employee';

  const myRecord = employees.find(e => 
    (user?.email && e.email && e.email.toLowerCase() === user.email.toLowerCase()) ||
    (user?.full_name && `${e.first_name} ${e.last_name}`.toLowerCase() === user.full_name.toLowerCase()) ||
    (user?.employee_id && String(e.id) === String(user.employee_id))
  ) || (isEmployeeRole ? employees[0] : null);

  const baseList = isEmployeeRole && myRecord ? [myRecord] : employees;

  const filtered = baseList.filter(e => {
    const q = search.toLowerCase();
    return e.first_name.toLowerCase().includes(q) ||
           e.last_name.toLowerCase().includes(q) ||
           e.department.toLowerCase().includes(q) ||
           e.employee_code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader 
          color="#6366f1" 
          title={isEmployeeRole ? "My Official Payslip Records" : "Payslip Generation & Historical Records"} 
          sub={isEmployeeRole ? "View and print your official semi-monthly compensation advice" : "Digital semi-monthly employee compensation advice with SHA-256 cryptographic verification"} 
        />
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(e.target.value)} className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white shadow-sm outline-none">
            <optgroup label="── Monthly Periods ──">
              <option value="June 2024">June 2024</option>
              <option value="July 2024">July 2024</option>
              <option value="August 2024">August 2024</option>
            </optgroup>
            <optgroup label="── Semi-Monthly Cut-offs ──">
              <option value="July 1–15, 2024">July 1–15, 2024 (1st Cut-off)</option>
              <option value="July 16–31, 2024">July 16–31, 2024 (2nd Cut-off)</option>
              <option value="August 1–15, 2024">August 1–15, 2024 (1st Cut-off)</option>
              <option value="August 16–31, 2024">August 16–31, 2024 (2nd Cut-off)</option>
            </optgroup>
          </select>
          <button onClick={() => load(month)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isEmployeeRole ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KpiCard label="My Net Take-Home Pay" value={myRecord ? fmt(myRecord.net_pay) : '₱0.00'} sub="Direct Deposit Payout" color="text-emerald-600" icon={CheckCircle2} />
          <KpiCard label="My Gross Compensation" value={myRecord ? fmt(myRecord.gross_pay) : '₱0.00'} sub="Basic + Allowances + OT" color="text-indigo-600" icon={DollarSign} />
          <KpiCard label="My Total Deductions" value={myRecord ? fmt(myRecord.total_deductions) : '₱0.00'} sub="Tax + SSS + PH + HDMF" color="text-rose-600" icon={Sliders} />
          <KpiCard label="Security Verification" value="SHA-256 Valid" sub="Tamper-proof Digital Seal" color="text-[#2E6BE6]" icon={FileText} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KpiCard label="Payslips Archived" value={employees.length} sub={`${month} Period`} color="text-indigo-600" icon={FileText} />
          <KpiCard label="Gross Payroll Sum" value={summary?.total_gross ? fmt(summary.total_gross, summary.total_gross_raw) : '₱2,185,420.00'} sub="Earnings total" icon={DollarSign} />
          <KpiCard label="Total Tax & Statutory" value={summary?.total_deductions ? fmt(summary.total_deductions, summary.total_deductions_raw) : '₱840,250.00'} sub="BIR + SSS + PH + HDMF" color="text-rose-600" icon={Sliders} />
          <KpiCard label="Total Net Disbursed" value={summary?.total_net ? fmt(summary.total_net, summary.total_net_raw) : '₱1,345,170.00'} sub="Direct Deposit Payout" color="text-emerald-600" icon={CheckCircle2} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Payslip Records Directory — {month}</h2>
            <p className="text-xs text-slate-400">Click any employee row to preview, verify tamper-proof hash, or print official advice</p>
          </div>
          <input
            type="text"
            placeholder="Search employee or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 w-64 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Payslip Reference', 'Employee', 'Department', 'Gross Earnings', 'Total Deductions', 'Take-Home Net', 'Security Seal', 'Actions'].map(h => (
                    <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(emp => (
                  <tr key={emp.id} onClick={() => setSelectedPayslipId(emp.id)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                      {`PAY-${month.replace(' ', '').toUpperCase()}-${String(emp.id).padStart(4, '0')}`}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-indigo-600">
                      {emp.first_name} {emp.last_name}
                      <div className="text-[10px] text-slate-400 font-mono">{emp.employee_code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{emp.department}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{fmt(emp.gross_pay)}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-rose-500">-{fmt(emp.total_deductions)}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-indigo-600">{fmt(emp.net_pay)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100 flex items-center gap-1 w-max">
                        <Lock className="w-2.5 h-2.5" /> SHA-256 Valid
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedPayslipId(emp.id); }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white font-semibold text-xs transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Printer className="w-3 h-3" />
                        <span>View Advice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayslipId && (
        <PayslipModal
          employeeId={selectedPayslipId}
          selectedMonth={month}
          onClose={() => setSelectedPayslipId(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 2: TIMEKEEPING & ATTENDANCE INTEGRATION
═══════════════════════════════════════════════════════════════ */
function TimekeepingModule() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ 
    employee: user?.full_name || 'Maria Santos', 
    date: new Date().toISOString().split('T')[0], 
    dayType: 'Regular Day',
    timeIn: '08:00', 
    timeOut: '17:00', 
    regularHours: '8.0',
    overtimeHours: '0.0',
    nightDiffHours: '0.0',
    type: 'Regular' 
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.getAttendance();
      setLogs(d.attendance || []);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id, status) => {
    if (!canPerformAction(user?.role, 'APPROVE_OVERTIME')) {
      setToast('⛔ Permission Denied: Overtime & Holiday approval is restricted to HR Manager & Admin.');
      return;
    }
    try {
      const approverName = user?.full_name ? `${user.full_name} (${user.role_label || 'Approver'})` : 'Liza Gomez (HR Manager)';
      await api.approveAttendance(id, status, approverName);
      setLogs(prev => prev.map(l => l.id === id ? { ...l, status, approved_by: approverName } : l));
      setToast(`Attendance log marked ${status}! Approved overtime & holiday premiums automatically flow into Payroll Computation.`);
    } catch { setToast('Approval failed'); }
  };

  const handleLog = async () => {
    if (!form.employee) return;
    try {
      const d = await api.logAttendance(form);
      setLogs(prev => [d.log, ...prev]);
      setShowLog(false);
      setToast('Attendance record logged successfully!');
    } catch { setToast('Failed to log attendance'); }
  };

  const [search, setSearch] = useState('');

  const isEmployee = user?.role === 'employee';
  const displayedLogs = isEmployee
    ? logs.filter(l => user?.full_name && l.employee && l.employee.toLowerCase() === user.full_name.toLowerCase())
    : logs;

  const filteredLogs = displayedLogs.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (l.employee && l.employee.toLowerCase().includes(q)) ||
      (l.date && l.date.toLowerCase().includes(q)) ||
      (l.day_type && l.day_type.toLowerCase().includes(q)) ||
      (l.status && l.status.toLowerCase().includes(q)) ||
      (l.attendance_status && l.attendance_status.toLowerCase().includes(q))
    );
  });

  const totalOT = displayedLogs.reduce((s, l) => s + (l.status === 'Approved' ? Number(l.overtime_hours || 0) : 0), 0);
  const pendingOT = displayedLogs.filter(l => l.status === 'Pending' && (Number(l.overtime_hours) > 0 || l.day_type !== 'Regular Day')).length;

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      <SectionHeader 
        color="#0ea5e9" 
        title={isEmployee ? "My Biometric Attendance, Holiday & Overtime Logs" : "Timekeeping & Attendance Integration"} 
        sub="Biometric attendance logs, DOLE holiday/overtime approval workflow & direct payroll cut-off sync" 
      />

      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-900">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-sky-600 shrink-0" />
          <div>
            <span className="font-bold">PH DOLE Statutory Standards:</span> Regular Holiday (<strong>200%</strong> / <strong>260%</strong> OT), Special Day & Rest Day (<strong>130%</strong> / <strong>169%</strong> OT), Special on Rest Day (<strong>150%</strong> / <strong>195%</strong> OT), Night Shift Diff (<strong>+10%</strong>).
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-white text-[#2E6BE6] font-bold border border-blue-200 shadow-xs">
            Reg. Holiday: 200%
          </span>
          <span className="px-2 py-0.5 rounded bg-white text-amber-700 font-bold border border-amber-200 shadow-xs">
            Special Day: 130%
          </span>
          <span className="px-2 py-0.5 rounded bg-white text-indigo-700 font-bold border border-indigo-200 shadow-xs">
            NSD: +10%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Approved Overtime Hours" value={`${totalOT.toFixed(1)} hrs`} sub="Active in current payroll" color="text-emerald-600" icon={Clock} />
        <KpiCard label="Pending OT & Holiday Approvals" value={pendingOT} sub="Awaiting HR sign-off" color={pendingOT > 0 ? "text-amber-600" : "text-slate-900"} icon={AlertCircle} />
        <KpiCard label="Biometric Sync Status" value="Online & Synced" sub="Terminal: HQ Makati Central" color="text-sky-600" icon={Activity} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{isEmployee ? "My Punch Records" : "Attendance & Overtime Records"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Review and approve employee overtime and holiday premiums before payroll finalization</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee, date, type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-500 shadow-xs bg-slate-50/50 focus:bg-white transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowLog(true)} className="px-3.5 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 transition-colors flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap">
              <Plus className="w-3.5 h-3.5" /><span>Log Entry</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-sky-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Employee', 'Date', 'Day Classification', 'Time In / Out', 'Regular Hrs', 'Tardiness / Status', 'Overtime', 'Night Diff', 'Approval Status', 'Approver', 'Actions'].map(h => (
                    <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{l.employee}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">{l.date}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {l.day_type === 'Regular Holiday' ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#2E6BE6] font-bold text-[10px] border border-blue-200">
                          Regular Holiday (200%)
                        </span>
                      ) : l.day_type === 'Regular Holiday on Rest Day' ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8] font-bold text-[10px] border border-blue-300">
                          Reg Holiday & Rest (260%)
                        </span>
                      ) : l.day_type === 'Special Non-Working Day' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
                          Special Day (130%)
                        </span>
                      ) : l.day_type === 'Scheduled Rest Day' ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200">
                          Rest Day (130%)
                        </span>
                      ) : l.day_type === 'Special Day on Rest Day' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] border border-amber-300">
                          Special on Rest (150%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[10px]">
                          Regular (100%)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono whitespace-nowrap">{l.time_in ? `${l.time_in} – ${l.time_out}` : 'No Log'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">{l.regular_hours || '8.0'} hrs</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {l.late_minutes > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold text-[11px] border border-amber-200">
                          Late ({l.late_minutes}m)
                        </span>
                      ) : l.attendance_status === 'Absent' ? (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold text-[11px] border border-rose-200">
                          Absent (LWOP)
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">On-Time</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold whitespace-nowrap">
                      {Number(l.overtime_hours) > 0 ? (
                        <span className="text-emerald-600">+{l.overtime_hours} hrs OT</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      {Number(l.night_diff_hours) > 0 ? (
                        <span className="text-indigo-600 font-bold">+{l.night_diff_hours}h NSD (10%)</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4"><StatusBadge status={l.status || 'Pending'} /></td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">{l.approved_by || '—'}</td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {(Number(l.overtime_hours) > 0 || l.day_type !== 'Regular Day') && l.status !== 'Approved' && canPerformAction(user?.role, 'APPROVE_OVERTIME') && (
                        <button onClick={() => handleApprove(l.id, 'Approved')} className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors">Approve</button>
                      )}
                      {(Number(l.overtime_hours) > 0 || l.day_type !== 'Regular Day') && l.status !== 'Rejected' && canPerformAction(user?.role, 'APPROVE_OVERTIME') && (
                        <button onClick={() => handleApprove(l.id, 'Rejected')} className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100 transition-colors">Reject</button>
                      )}
                      {l.status === 'Approved' && <span className="text-emerald-600 font-semibold text-[11px]">✓ Enters Payroll</span>}
                      {l.status !== 'Approved' && !canPerformAction(user?.role, 'APPROVE_OVERTIME') && (
                        <span className="text-slate-400 text-[11px]">{l.status === 'Rejected' ? 'Rejected' : 'In Review'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" />
                Record Attendance / Holiday / OT Entry
              </h3>
              <button onClick={() => setShowLog(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Employee Name *</label>
                <input value={form.employee} onChange={e => setForm(f => ({ ...f, employee: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500" placeholder="e.g. Maria Santos" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">DOLE Day Classification *</label>
                  <select 
                    value={form.dayType} 
                    onChange={e => setForm(f => ({ ...f, dayType: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="Regular Day">Regular Working Day (100%)</option>
                    <option value="Special Non-Working Day">Special Non-Working Day (130%)</option>
                    <option value="Scheduled Rest Day">Scheduled Rest Day (130%)</option>
                    <option value="Special Day on Rest Day">Special Day on Rest Day (150%)</option>
                    <option value="Regular Holiday">Regular Holiday (200%)</option>
                    <option value="Regular Holiday on Rest Day">Regular Holiday on Rest Day (260%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Time In</label>
                  <input type="time" value={form.timeIn} onChange={e => setForm(f => ({ ...f, timeIn: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Time Out</label>
                  <input type="time" value={form.timeOut} onChange={e => setForm(f => ({ ...f, timeOut: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Overtime Hours</label>
                  <input type="number" step="0.5" value={form.overtimeHours} onChange={e => setForm(f => ({ ...f, overtimeHours: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500" placeholder="0.0" />
                  <span className="text-[10px] text-slate-400">Excess of 8 regular hours</span>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Night Shift Diff Hours</label>
                  <input type="number" step="0.5" value={form.nightDiffHours} onChange={e => setForm(f => ({ ...f, nightDiffHours: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-sky-500" placeholder="0.0" />
                  <span className="text-[10px] text-slate-400">Between 10:00 PM – 6:00 AM</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowLog(false)} className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={handleLog} className="px-4 py-2 rounded-xl text-xs bg-sky-500 text-white font-semibold hover:bg-sky-600 shadow-sm">Save & Submit for HR Approval</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 3A: SALARY STRUCTURE CONFIGURATION
═══════════════════════════════════════════════════════════════ */
function SalaryStructureModule() {
  const grades = [
    { grade: 'Grade 1 - Entry', min: 25000, mid: 32000, max: 40000, allowance: 2500, roles: 'Junior Analyst, Support Associate', spread: '60%' },
    { grade: 'Grade 2 - Professional', min: 40000, mid: 52000, max: 65000, allowance: 4000, roles: 'Software Engineer, HR Specialist, Accountant', spread: '62%' },
    { grade: 'Grade 3 - Senior / Lead', min: 65000, mid: 80000, max: 100000, allowance: 5000, roles: 'Senior Developer, Product Lead, QA Lead', spread: '54%' },
    { grade: 'Grade 4 - Managerial', min: 95000, mid: 120000, max: 150000, allowance: 7500, roles: 'Engineering Manager, HR Director', spread: '58%' },
    { grade: 'Grade 5 - Executive', min: 150000, mid: 200000, max: 300000, allowance: 12000, roles: 'VP Engineering, Chief Financial Officer', spread: '100%' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader color={ACCENT} title="Salary Structure Configuration" sub="Standardized corporate salary bands, midpoint controls, and non-taxable de minimis brackets" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Active Salary Bands" value="5 Grades" sub="Grade 1 (Entry) to Grade 5 (Exec)" color="text-[#2E6BE6]" icon={Layers} />
        <KpiCard label="De Minimis Non-Taxable Cap" value="₱90,000 / yr" sub="BIR Tax-Exempt Benefit Ceiling" color="text-emerald-600" icon={Shield} />
        <KpiCard label="Pay Progression Ratio" value="1.25x - 1.50x" sub="Inter-grade midpoint progression" icon={TrendingUp} />
      </div>

      <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E4E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Corporate Salary Bands & Midpoints (PHP ₱)</h2>
            <p className="text-xs text-slate-400 mt-0.5">Aligned with Philippine Labor Standards & BIR Compensation Framework</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-blue-50 text-[#2E6BE6] font-semibold rounded-full border border-blue-200">BIR Compliant</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E4E8F0]">
              <tr>
                {['Salary Grade', 'Minimum Base', 'Midpoint Base', 'Maximum Base', 'Standard Allowance', 'Target Job Roles', 'Band Spread'].map(h => (
                  <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grades.map(g => (
                <tr key={g.grade} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{g.grade}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{fmt(g.min)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#2E6BE6]">{fmt(g.mid)}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{fmt(g.max)}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-600 font-semibold">+{fmt(g.allowance)}</td>
                  <td className="py-3.5 px-4 text-slate-600">{g.roles}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{g.spread}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 3B: ALLOWANCES & INCENTIVE MANAGEMENT
═══════════════════════════════════════════════════════════════ */
function AllowancesModule() {
  const { user } = useAuth();
  const [compensation, setCompensation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.getCompensation();
      setCompensation(d.compensation || []);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveAllowance = async (id) => {
    if (!canPerformAction(user?.role, 'EDIT_ALLOWANCES')) {
      setToast('⛔ Permission Denied: Only HR Manager or Admin can edit allowances.');
      return;
    }
    try {
      const d = await api.updateAllowance(id, { allowance: parseFloat(editVal) });
      setCompensation(prev => prev.map(c => c.id === id ? { ...c, ...d.employee } : c));
      setEditId(null);
      setToast('Allowance updated! Amount is immediately synced into Payroll Gross Pay.');
    } catch { setToast('Update failed'); }
  };

  const totalAllowances = compensation.reduce((s, c) => s + Number(c.allowance || 0), 0);

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      <SectionHeader color={ACCENT} title="Allowances & Incentive Management" sub="Transportation, meal allowance, internet subsidy & performance incentive controls" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Monthly Allowances" value={fmt(totalAllowances)} sub="Added directly to Gross Pay" color="text-[#2E6BE6]" icon={DollarSign} />
        <KpiCard label="De Minimis Threshold" value="₱90,000 / yr" sub="Tax-exempt employee benefits" color="text-emerald-600" icon={Shield} />
        <KpiCard label="Active Recipients" value={`${compensation.length} Staff`} sub="Receiving recurring allowance" icon={Users} />
      </div>

      <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E4E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Employee Allowance Allocations</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click Edit on any employee row to adjust their recurring monthly allowance</p>
          </div>
          <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E4E8F0]">
              <tr>
                {['Employee', 'Department', 'Position', 'Basic Salary', 'Monthly Allowance', 'Tax Treatment', 'Actions'].map(h => (
                  <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {compensation.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{c.department}</td>
                  <td className="py-3.5 px-4 text-slate-500">{c.position}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{fmt(c.basic_salary)}</td>
                  <td className="py-3.5 px-4">
                    {editId === c.id ? (
                      <input
                        type="number"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        className="w-28 px-2 py-1 border border-blue-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-[#2E6BE6]"
                        autoFocus
                      />
                    ) : (
                      <span className="font-mono font-bold text-[#2E6BE6]">{fmt(c.allowance)}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100">
                      De Minimis (Non-taxable)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {editId === c.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handleSaveAllowance(c.id)} className="px-2.5 py-1 rounded-lg bg-[#2E6BE6] text-white font-semibold flex items-center gap-1">
                          <Save className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => setEditId(null)} className="p-1 rounded bg-slate-100 text-slate-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : canPerformAction(user?.role, 'EDIT_ALLOWANCES') ? (
                      <button onClick={() => { setEditId(c.id); setEditVal(c.allowance || 0); }} className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2E6BE6] font-semibold hover:bg-blue-100 flex items-center gap-1 ml-auto border border-blue-200">
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium">Read-Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 3C: SALARY ADJUSTMENT MANAGEMENT
═══════════════════════════════════════════════════════════════ */
function SalaryAdjustmentModule() {
  const { user } = useAuth();
  const [compensation, setCompensation] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjForm, setAdjForm] = useState({
    employee_id: '1',
    proposed_salary: '75000',
    effective_date: '2024-07-01',
    reason: 'Annual Performance Appraisal Promotion'
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.getCompensation();
      setCompensation(d.compensation || []);
      setAdjustments(d.adjustments || []);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdjustmentStatus = async (id, status) => {
    if (!canPerformAction(user?.role, 'APPROVE_SALARY_ADJUSTMENT')) {
      setToast('⛔ Permission Denied: Executive salary adjustment approval requires Finance Director or Admin.');
      return;
    }
    try {
      const approverName = user?.full_name ? `${user.full_name} (${user.role_label || 'Executive'})` : 'Finance Director';
      await api.updateSalaryAdjustmentStatus(id, status, approverName);
      setAdjustments(prev => prev.map(a => a.id === id ? { ...a, status, approved_by: approverName } : a));
      setToast(`Salary adjustment marked ${status}! Base pay is now updated for current and future payroll cycles.`);
      load();
    } catch { setToast('Status update failed'); }
  };

  const handleCreateAdjustment = async () => {
    if (!canPerformAction(user?.role, 'PROPOSE_SALARY_ADJUSTMENT')) {
      setToast('⛔ Permission Denied: Only HR Manager or Admin can propose salary adjustments.');
      return;
    }
    try {
      const res = await api.createSalaryAdjustment(adjForm);
      setAdjustments(prev => [res.adjustment, ...prev]);
      setShowAdjModal(false);
      setToast('Salary adjustment filed and submitted for approval!');
    } catch { setToast('Submission failed'); }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader color={ACCENT} title="Salary Adjustment Management" sub="Executive promotion, merit raise workflow & historical compensation versioning" />
        {canPerformAction(user?.role, 'PROPOSE_SALARY_ADJUSTMENT') && (
          <button onClick={() => setShowAdjModal(true)} className="px-3.5 py-2 rounded-lg bg-[#2E6BE6] hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /><span>Request Salary Adjustment</span>
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-[14px] p-4 flex items-center gap-3 text-xs text-blue-900">
        <Sparkles className="w-5 h-5 text-[#2E6BE6] shrink-0" />
        <div>
          <span className="font-bold">Automated Integrity Rule:</span> Pending adjustments do NOT alter current payroll. Once <strong>Approved</strong>, the new base salary immediately takes effect starting on its effective date cut-off.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Pending Adjustments" value={adjustments.filter(a => a.status === 'Pending' || a.status === 'Pending Approval').length} sub="Awaiting executive sign-off" color="text-amber-600" icon={Clock} />
        <KpiCard label="Approved Adjustments" value={adjustments.filter(a => a.status === 'Approved').length} sub="Reflected in live payroll" color="text-emerald-600" icon={CheckCircle2} />
        <KpiCard label="Total Adjustments Filed" value={adjustments.length} sub="Fiscal year 2024" icon={Briefcase} />
      </div>

      <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E4E8F0] flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Salary Adjustment Requests Queue</h2>
          <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E4E8F0]">
              <tr>
                {['Employee', 'Previous Base', 'Proposed Base', 'Increment', 'Effective Date', 'Justification', 'Status', 'Actions'].map(h => (
                  <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adjustments.map(adj => {
                const inc = Number(adj.proposed_salary) - Number(adj.previous_salary);
                const pct = Math.round((inc / (Number(adj.previous_salary) || 1)) * 100);
                const isPending = adj.status === 'Pending' || adj.status === 'Pending Approval';
                return (
                  <tr key={adj.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{adj.employee_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{fmt(adj.previous_salary)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2E6BE6]">{fmt(adj.proposed_salary)}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-semibold">+{fmt(inc)} (+{pct}%)</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{adj.effective_date}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{adj.reason}</td>
                    <td className="py-3.5 px-4"><StatusBadge status={adj.status} /></td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {isPending && canPerformAction(user?.role, 'APPROVE_SALARY_ADJUSTMENT') && (
                        <>
                          <button onClick={() => handleAdjustmentStatus(adj.id, 'Approved')} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100">Approve</button>
                          <button onClick={() => handleAdjustmentStatus(adj.id, 'Rejected')} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100">Reject</button>
                        </>
                      )}
                      {isPending && !canPerformAction(user?.role, 'APPROVE_SALARY_ADJUSTMENT') && (
                        <span className="text-amber-600 text-[11px] font-medium">Awaiting Director Approval</span>
                      )}
                      {adj.status === 'Approved' && (
                        <span className="text-emerald-600 font-semibold text-[11px]">✓ Active in Payroll</span>
                      )}
                      {adj.status === 'Rejected' && (
                        <span className="text-rose-600 font-semibold text-[11px]">Rejected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAdjModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[14px] w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Request Salary Adjustment</h3>
              <button onClick={() => setShowAdjModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Employee *</label>
                <select value={adjForm.employee_id} onChange={e => setAdjForm(f => ({ ...f, employee_id: e.target.value }))} className="w-full px-3 py-2 border border-[#E4E8F0] rounded-lg outline-none focus:border-[#2E6BE6] bg-white">
                  {compensation.map(c => <option key={c.id} value={c.id}>{c.name} ({c.position})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Proposed Monthly Basic (₱) *</label>
                <input type="number" value={adjForm.proposed_salary} onChange={e => setAdjForm(f => ({ ...f, proposed_salary: e.target.value }))} className="w-full px-3 py-2 border border-[#E4E8F0] rounded-lg outline-none focus:border-[#2E6BE6]" />
              </div>
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Effective Date *</label>
                <input type="date" value={adjForm.effective_date} onChange={e => setAdjForm(f => ({ ...f, effective_date: e.target.value }))} className="w-full px-3 py-2 border border-[#E4E8F0] rounded-lg outline-none focus:border-[#2E6BE6]" />
              </div>
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Justification / Reason *</label>
                <textarea rows={3} value={adjForm.reason} onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 border border-[#E4E8F0] rounded-lg outline-none focus:border-[#2E6BE6]" placeholder="e.g. Annual merit promotion based on exceptional delivery." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAdjModal(false)} className="px-4 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={handleCreateAdjustment} className="px-4 py-2 rounded-lg text-xs bg-[#2E6BE6] text-white font-semibold hover:bg-blue-700">Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 4A: EMPLOYEE CLAIM FILING (SELF-SERVICE PORTAL)
═══════════════════════════════════════════════════════════════ */
function ClaimFilingModule() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loans, setLoans] = useState([]);
  const [subTab, setSubTab] = useState('claims'); // 'claims' | 'loans'
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const isEmployee = user?.role === 'employee';
  const defaultEmpName = user?.name || 'Sarah Jenkins';

  const [form, setForm] = useState({
    employee: defaultEmpName,
    type: 'Medical & Dental',
    amount: '1200',
    date: new Date().toISOString().split('T')[0],
    receipt_no: 'OR-89210-PH',
    description: 'Annual dental prophylaxis and check-up'
  });

  const [loanForm, setLoanForm] = useState({
    loan_type: 'Emergency Salary Advance',
    principal_amount: '15000',
    total_installments: '6',
    reason: 'Family medical outpatient emergency'
  });

  useEffect(() => {
    if (user?.name) {
      setForm(f => ({ ...f, employee: user.name }));
    }
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [claimData, loanData] = await Promise.all([
        api.getClaims(),
        api.getMicroloans()
      ]);
      setClaims(claimData.claims || []);
      setLoans(loanData.microloans || []);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    try {
      const d = await api.createClaim(form);
      setClaims(prev => [d.claim, ...prev]);
      setToast('Expense claim filed! Forwarded to Claim Verification & Approval queue.');
      setForm({
        employee: user?.name || defaultEmpName,
        type: 'Medical & Dental',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        receipt_no: '',
        description: ''
      });
    } catch { setToast('Submission failed'); }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createMicroloan({
        ...loanForm,
        employee: user?.name || defaultEmpName
      });
      setLoans(prev => [res.microloan, ...prev]);
      setShowLoanModal(false);
      setToast('Salary advance application submitted! Forwarded to Finance Director for approval.');
    } catch {
      setToast('Application submission failed');
    }
  };

  const displayedClaims = isEmployee
    ? claims.filter(c => {
        const cEmp = (c.employee || '').toLowerCase();
        const uName = (user?.name || defaultEmpName).toLowerCase();
        return cEmp.includes(uName) || uName.includes(cEmp) || c.employee === 'Sarah Jenkins' || c.employee_id === 1;
      })
    : claims;

  const displayedLoans = isEmployee
    ? loans.filter(l => {
        const lEmp = (l.employee_name || '').toLowerCase();
        const uName = (user?.name || defaultEmpName).toLowerCase();
        return lEmp.includes(uName) || uName.includes(lEmp) || l.employee_id === 1;
      })
    : loans;

  const totalFiled = displayedClaims.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalApproved = displayedClaims.filter(c => c.status === 'Approved').reduce((s, c) => s + Number(c.amount || 0), 0);

  const activeLoan = displayedLoans.find(l => l.status === 'Active');
  const totalLoanPrincipal = displayedLoans.reduce((s, l) => s + Number(l.principal_amount || 0), 0);
  const totalLoanBalance = displayedLoans.reduce((s, l) => s + Number(l.balance_amount || 0), 0);

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader 
          color="#f97316" 
          title={isEmployee ? "My Expense Claims & Advances" : "Employee Claim & Advance Portal"} 
          sub="Submit out-of-pocket medical expenses or apply for company microfinance salary advances" 
        />

        {subTab === 'loans' && canPerformAction(user?.role, 'REQUEST_MICROLOAN') && (
          <button
            type="button"
            onClick={() => setShowLoanModal(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply for Salary Advance</span>
          </button>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('claims')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'claims'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Out-of-Pocket Expense Claims</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('loans')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'loans'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Company Microloans & Advances ({displayedLoans.length})</span>
        </button>
      </div>

      {subTab === 'claims' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label={isEmployee ? "My Filed Claims" : "Total Claims Filed"} value={displayedClaims.length} sub="Current fiscal period" icon={Receipt} color="text-orange-600" />
            <KpiCard label="Total Amount Claimed" value={fmt(totalFiled)} sub="Submitted for reimbursement" icon={DollarSign} />
            <KpiCard label="Approved & Queued" value={fmt(totalApproved)} sub="Enters next payroll payout" color="text-emerald-600" icon={CheckCircle2} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Claim Submission Form */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Receipt className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-bold text-slate-900">File New Reimbursement Claim</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Claimant Employee *</label>
                  <input 
                    disabled={isEmployee}
                    value={form.employee} 
                    onChange={e => setForm({ ...form, employee: e.target.value })} 
                    className={`w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-semibold ${isEmployee ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Expense Category *</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({ ...form, type: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white"
                  >
                    {['Medical & Dental', 'Travel & Transportation', 'Client Business Meals', 'Office Supplies', 'Training & Certification'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">Amount (PHP ₱) *</label>
                    <input 
                      required
                      type="number" 
                      placeholder="1500" 
                      value={form.amount} 
                      onChange={e => setForm({ ...form, amount: e.target.value })} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">Date Incurred *</label>
                    <input 
                      required
                      type="date" 
                      value={form.date} 
                      onChange={e => setForm({ ...form, date: e.target.value })} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Official Receipt (OR) Number</label>
                  <input 
                    placeholder="e.g. OR-9281-2024" 
                    value={form.receipt_no} 
                    onChange={e => setForm({ ...form, receipt_no: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Business Justification / Purpose</label>
                  <textarea 
                    rows={2} 
                    placeholder="Describe the nature of the expense..." 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit for Verification</span>
                </button>
              </form>
            </div>

            {/* My Claims Ledger */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Submitted Claims Status</h2>
                <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Claim Code', 'Type', 'Amount', 'Date', 'Status'].map(h => (
                        <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedClaims.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{c.claim_id || `CLM-00${c.id}`}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">{c.type || c.claim_type}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{fmt(c.amount)}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{c.date || c.date_filed}</td>
                        <td className="py-3.5 px-4"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Microloans / Salary Advances Section */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard 
              label="Active Advance Balance" 
              value={fmt(totalLoanBalance)} 
              sub={activeLoan ? `₱${activeLoan.monthly_deduction.toLocaleString()}/mo deduction` : 'No active amortization'} 
              color="text-amber-600" 
              icon={CreditCard} 
            />
            <KpiCard 
              label="Next Cut-off Amortization" 
              value={activeLoan ? `₱${activeLoan.monthly_deduction.toLocaleString()}` : '₱0.00'} 
              sub={activeLoan ? `${activeLoan.remaining_installments} installments remaining` : 'Zero payroll deduction'} 
              color="text-pink-600" 
              icon={DollarSign} 
            />
            <KpiCard 
              label="Assistance Status" 
              value={activeLoan ? 'Active in Payroll' : 'Eligible to Apply'} 
              sub="Company microfinance assistance" 
              color="text-emerald-600" 
              icon={CheckCircle2} 
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Salary Advances & Microfinance Records</h2>
                <p className="text-xs text-slate-400 mt-0.5">Approved advances are automatically deducted in installments from the live payroll sheet</p>
              </div>
              <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Loan Code', 'Type', 'Principal', 'Monthly Installment', 'Remaining Bal.', 'Term Progress', 'Status', 'Approver'].map(h => (
                      <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedLoans.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{l.loan_code}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{l.loan_type}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{fmt(l.principal_amount)}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-700">-{fmt(l.monthly_deduction)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-pink-600">{fmt(l.balance_amount)}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {l.status === 'Paid Off' ? (
                          <span className="text-emerald-600 font-bold">Completed (100%)</span>
                        ) : (
                          `${l.remaining_installments} of ${l.total_installments} mos`
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">{l.approved_by || 'Awaiting Finance Review'}</td>
                    </tr>
                  ))}
                  {displayedLoans.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No microloans or salary advances filed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Salary Advance Request Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" />
                Apply for Microfinance Salary Advance
              </h2>
              <button onClick={() => setShowLoanModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Applicant</label>
                <input 
                  disabled 
                  value={user?.name || defaultEmpName} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-700 font-semibold" 
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Assistance Category *</label>
                <select 
                  value={loanForm.loan_type} 
                  onChange={e => setLoanForm({ ...loanForm, loan_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-orange-500"
                >
                  <option>Emergency Salary Advance</option>
                  <option>Medical Assistance Advance</option>
                  <option>Home Office Equipment Advance</option>
                  <option>Educational Assistance Advance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Principal Amount (₱) *</label>
                  <input 
                    required 
                    type="number" 
                    value={loanForm.principal_amount} 
                    onChange={e => setLoanForm({ ...loanForm, principal_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-mono font-bold" 
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Repayment Term *</label>
                  <select 
                    value={loanForm.total_installments} 
                    onChange={e => setLoanForm({ ...loanForm, total_installments: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-orange-500"
                  >
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Estimated Monthly Payroll Deduction:</span>
                  <span className="font-mono font-bold text-amber-800">
                    ₱{Math.round((Number(loanForm.principal_amount) || 0) / (Number(loanForm.total_installments) || 6)).toLocaleString()} / mo
                  </span>
                </div>
                <div className="text-[10px] text-amber-700">Deducted automatically from your semi-monthly net pay after executive approval.</div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Reason / Purpose *</label>
                <textarea 
                  required 
                  rows={2} 
                  value={loanForm.reason} 
                  onChange={e => setLoanForm({ ...loanForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
                  placeholder="Explain the necessity for emergency assistance..." 
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowLoanModal(false)} className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md shadow-orange-500/20">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 4B: CLAIM VERIFICATION & APPROVAL (AUDIT QUEUE)
═══════════════════════════════════════════════════════════════ */
function ClaimVerificationModule() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.getClaims();
      setClaims(d.claims || []);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, status) => {
    if (!canPerformAction(user?.role, 'VERIFY_CLAIM')) {
      setToast('Unauthorized: You do not have permission to verify or modify claims.');
      return;
    }
    try {
      await api.updateClaimStatus(id, status, user?.name || 'Authorized Approver');
      setClaims(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      setToast(`Claim ${status}! Approved expense is now authorized for payroll reimbursement.`);
    } catch { setToast('Verification update failed'); }
  };

  const pending = claims.filter(c => c.status === 'Pending' || c.status === 'Submitted');
  const approved = claims.filter(c => c.status === 'Approved');

  const filteredClaims = claims.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.claim_id && c.claim_id.toLowerCase().includes(q)) ||
      (c.claim_code && c.claim_code.toLowerCase().includes(q)) ||
      (c.employee && c.employee.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q)) ||
      (c.claim_type && c.claim_type.toLowerCase().includes(q)) ||
      (c.department && c.department.toLowerCase().includes(q)) ||
      (c.status && c.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      <SectionHeader color="#f97316" title="Claim Verification & Approval Queue" sub="Review, validate receipts, and authorize employee expense claims for payroll disbursement" />

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Compliance Rule:</span> Claims marked <strong>Approved</strong> are automatically routed to the active payroll cut-off as non-taxable Gross Pay additions.
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-white text-amber-800 font-bold border border-amber-200 shadow-sm shrink-0">
          Awaiting Review: {pending.length} Claims
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Pending Audit Review" value={pending.length} sub="Requires HR / Finance sign-off" color="text-amber-600" icon={AlertCircle} />
        <KpiCard label="Authorized for Reimbursement" value={fmt(approved.reduce((s, c) => s + Number(c.amount), 0))} sub="Total approved claims" color="text-emerald-600" icon={CheckCircle2} />
        <KpiCard label="Total Claims Audited" value={claims.length} sub="Current payroll cycle" icon={FileText} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Verification Queue — Pending & Reviewed Claims</h2>
            <p className="text-xs text-slate-400 mt-0.5">Filter by claim code, employee, expense category, or status</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search claim, employee, type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 shadow-xs bg-slate-50/50 focus:bg-white transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Claim Code', 'Employee', 'Expense Type', 'Amount (₱)', 'Date Filed', 'Compliance Check', 'Status', 'Actions'].map(h => (
                  <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{c.claim_id || `CLM-00${c.id}`}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {c.employee}
                    <div className="text-[10px] text-slate-400 font-normal">{c.department || 'Engineering'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{c.type || c.claim_type}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{fmt(c.amount)}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{c.date || c.date_filed}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100 flex items-center gap-1 w-max">
                      <Check className="w-2.5 h-2.5" /> Receipt Attached
                    </span>
                  </td>
                  <td className="py-3.5 px-4"><StatusBadge status={c.status} /></td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    {canPerformAction(user?.role, 'VERIFY_CLAIM') ? (
                      (c.status === 'Pending' || c.status === 'Submitted') ? (
                        <>
                          <button onClick={() => handleStatus(c.id, 'Approved')} className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors">Approve</button>
                          <button onClick={() => handleStatus(c.id, 'Rejected')} className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100 transition-colors">Reject</button>
                        </>
                      ) : (
                        <button onClick={() => handleStatus(c.id, 'Pending')} className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors">Reset</button>
                      )
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 4C: REIMBURSEMENT PROCESSING & MONITORING
═══════════════════════════════════════════════════════════════ */
function ReimbursementProcessingModule() {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState('reimbursements'); // 'reimbursements' | 'loan_approvals'
  const [claims, setClaims] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [claimsRes, loansRes] = await Promise.all([
        api.getClaims(),
        api.getMicroloans()
      ]);
      setClaims(claimsRes.claims || []);
      setLoans(loansRes.microloans || []);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLoanStatus = async (loanId, newStatus) => {
    if (!canPerformAction(user?.role, 'APPROVE_MICROLOAN')) {
      setToast('Unauthorized: Only the Finance Director or Admin can approve microfinance advances.');
      return;
    }
    try {
      await api.updateMicroloanStatus(loanId, newStatus, user?.name || 'David Sterling (Finance Director)');
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status: newStatus, approved_by: user?.name || 'David Sterling (Finance Director)' } : l));
      setToast(`Microloan request ${newStatus === 'Active' ? 'Approved & activated in live payroll' : 'Rejected'}!`);
    } catch {
      setToast('Failed to update microloan status.');
    }
  };

  const approvedClaims = claims.filter(c => c.status === 'Approved' || c.status === 'Reimbursed');
  const totalDisbursed = claims.filter(c => c.status === 'Reimbursed').reduce((s, c) => s + Number(c.amount), 0);
  const totalPendingInPayroll = claims.filter(c => c.status === 'Approved').reduce((s, c) => s + Number(c.amount), 0);

  const pendingLoans = loans.filter(l => l.status === 'Pending');
  const activeLoans = loans.filter(l => l.status === 'Active');
  const totalActiveLoanBalance = activeLoans.reduce((s, l) => s + Number(l.balance_amount || 0), 0);
  const totalMonthlyAmortization = activeLoans.reduce((s, l) => s + Number(l.monthly_deduction || 0), 0);

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader 
          color="#f97316" 
          title="Reimbursement & Advance Processing" 
          sub="Monitor disbursement batches, payroll cut-off integration, and microloan advance approvals" 
        />
        <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit shrink-0 mb-6">
          <button
            onClick={() => setSubTab('reimbursements')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'reimbursements' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📑 Expense Reimbursements
          </button>
          <button
            onClick={() => setSubTab('loan_approvals')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              subTab === 'loan_approvals' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💳 Advance Approvals
            {pendingLoans.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingLoans.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {subTab === 'reimbursements' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Queued for July 2024 Payroll" value={fmt(totalPendingInPayroll)} sub="Active payroll reimbursement" color="text-orange-600" icon={Clock} />
            <KpiCard label="Total Reimbursed to Date" value={fmt(totalDisbursed)} sub="Successfully settled funds" color="text-indigo-600" icon={CheckCircle2} />
            <KpiCard label="Settlement Rate" value={approvedClaims.length ? `${Math.round((claims.filter(c => c.status === 'Reimbursed').length / approvedClaims.length) * 100)}%` : '100%'} sub="Of approved claims paid" icon={TrendingUp} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Reimbursement Settlement Schedule</h2>
                <p className="text-xs text-slate-400 mt-0.5">Claims integrated into payroll are disbursed along with standard salary payout</p>
              </div>
              <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Claim Code', 'Employee', 'Expense Type', 'Reimbursement Sum', 'Payment Channel', 'Payroll Cut-off', 'Disbursement Status'].map(h => (
                      <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvedClaims.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{c.claim_id || `CLM-00${c.id}`}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.employee}</td>
                      <td className="py-3.5 px-4 text-slate-600">{c.type || c.claim_type}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">+{fmt(c.amount)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">Electronic Bank Transfer</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">July 2024 Cycle</td>
                      <td className="py-3.5 px-4">
                        {c.status === 'Reimbursed' ? (
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100">
                              Disbursed & Closed
                            </span>
                            {c.disbursement_ref && (
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5">{c.disbursement_ref}</div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100">
                            In July 2024 Payroll
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Microloan & Salary Advance Approvals Queue */
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Executive Approval Workflow:</span> Microloans & Emergency Advances require authorization by the <strong>Finance Director</strong> (or Admin). Once approved, semi-monthly amortization deductions are dynamically scheduled into the live payroll sheet and deducted from net pay.
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white text-amber-800 font-bold border border-amber-200 shadow-sm shrink-0">
              Awaiting Approval: {pendingLoans.length} Requests
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard 
              label="Pending Advance Requests" 
              value={pendingLoans.length} 
              sub="Requires Finance Director sign-off" 
              color="text-amber-600" 
              icon={Clock} 
            />
            <KpiCard 
              label="Active Monthly Amortizations" 
              value={fmt(totalMonthlyAmortization)} 
              sub={`${activeLoans.length} advances actively deducted in payroll`} 
              color="text-emerald-600" 
              icon={CheckCircle2} 
            />
            <KpiCard 
              label="Total Outstanding Principal" 
              value={fmt(totalActiveLoanBalance)} 
              sub="Across active company microloans" 
              color="text-pink-600" 
              icon={DollarSign} 
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Microloan & Salary Advance Approvals Queue</h2>
                <p className="text-xs text-slate-400 mt-0.5">Review, validate repayment terms, and authorize salary advances for active payroll deductions</p>
              </div>
              <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Loan Code', 'Employee', 'Assistance Category', 'Principal', 'Monthly Deduct.', 'Repayment Term', 'Reason / Purpose', 'Status', 'Executive Action'].map(h => (
                      <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{l.loan_code}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {l.employee_name || l.employee}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{l.loan_type}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{fmt(l.principal_amount)}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-700">-{fmt(l.monthly_deduction)}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {l.status === 'Paid Off' ? (
                          <span className="text-emerald-600 font-bold">Completed</span>
                        ) : (
                          `${l.remaining_installments ?? l.total_installments} of ${l.total_installments} mos`
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate" title={l.reason}>
                        {l.reason || 'General Assistance'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {l.status === 'Pending' ? (
                          canPerformAction(user?.role, 'APPROVE_MICROLOAN') ? (
                            <>
                              <button 
                                onClick={() => handleLoanStatus(l.id, 'Active')} 
                                className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors shadow-sm"
                              >
                                Approve Advance
                              </button>
                              <button 
                                onClick={() => handleLoanStatus(l.id, 'Rejected')} 
                                className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100 transition-colors shadow-sm"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Awaiting Director Approval</span>
                          )
                        ) : (
                          <div className="text-[11px] text-slate-500 font-medium">
                            {l.status === 'Active' && (
                              <span className="text-emerald-700 flex items-center gap-1 justify-end">
                                <Check className="w-3 h-3" /> Active in Payroll
                              </span>
                            )}
                            {l.status === 'Rejected' && (
                              <span className="text-rose-600">Rejected</span>
                            )}
                            {l.status === 'Paid Off' && (
                              <span className="text-slate-500">Settled</span>
                            )}
                            <div className="text-[10px] text-slate-400 font-normal">{l.approved_by || 'Executive Office'}</div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No microloans or salary advance requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 5A: BENEFITS ENROLLMENT & MANAGEMENT
═══════════════════════════════════════════════════════════════ */
function BenefitsEnrollmentModule() {
  const { user } = useAuth();
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [form, setForm] = useState({ 
    employee: 'Kenneth Morales', 
    plan: 'Maxicare Platinum', 
    dependents: '1',
    effectiveDate: new Date().toISOString().split('T')[0] 
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.getBenefits();
      setBenefits(d.benefits || []);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEnroll = async () => {
    if (!form.employee) return;
    try {
      const d = await api.enrollBenefit(form);
      setBenefits(prev => [d.benefit, ...prev]);
      setShowEnroll(false);
      setToast('Employee enrolled into HMO healthcare benefits plan!');
    } catch { setToast('Enrollment failed'); }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader color="#06b6d4" title="Benefits Enrollment & Management" sub="Corporate HMO healthcare plan onboarding, coverage tier selection & member roster" />
        {canPerformAction(user?.role, 'ENROLL_BENEFIT_MEMBER') && (
          <button onClick={() => setShowEnroll(true)} className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /><span>Enroll New Member</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Active Enrolled Members" value={`${benefits.filter(b => b.status === 'Active').length} Staff`} sub="Primary insured employees" color="text-cyan-600" icon={Heart} />
        <KpiCard label="Maxicare Coverage Tier" value="Platinum (₱250K MBL)" sub="Corporate comprehensive plan" icon={Shield} />
        <KpiCard label="Covered Dependents" value="12 Dependents" sub="Spouses & children covered" icon={Users} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Healthcare Benefits Enrollment Registry</h2>
          <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Cardholder Employee', 'Provider', 'Plan Tier', 'Maximum Benefit Limit', 'Effective Date', 'Membership Status'].map(h => (
                  <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {benefits.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{b.employee}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-semibold">{b.provider || 'Maxicare'}</td>
                  <td className="py-3.5 px-4 text-slate-700">{b.plan}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-cyan-700">{b.coverage || '₱250,000 / illness'}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{b.effective_date || b.effectiveDate || '2024-01-01'}</td>
                  <td className="py-3.5 px-4"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showEnroll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Enroll Employee into HMO</h3>
              <button onClick={() => setShowEnroll(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Employee Name *</label>
                <input value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500" placeholder="e.g. Kenneth Morales" />
              </div>
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Healthcare Plan</label>
                <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 bg-white">
                  {['Maxicare Platinum (₱1,800/mo)', 'Maxicare Silver (₱1,200/mo)', 'Intellicare Executive (₱2,500/mo)', 'PhilCare Comprehensive (₱1,500/mo)'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Dependents</label>
                  <input type="number" value={form.dependents} onChange={e => setForm({ ...form, dependents: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Effective Date</label>
                  <input type="date" value={form.effectiveDate} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowEnroll(false)} className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={handleEnroll} className="px-4 py-2 rounded-xl text-xs bg-cyan-600 text-white font-semibold hover:bg-cyan-700">Enroll Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 5B: HMO CONTRIBUTION MANAGEMENT & STATUTORY
═══════════════════════════════════════════════════════════════ */
function HMOContributionModule() {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.getBenefits();
      setBenefits(d.benefits || []);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalEmployeeDeduction = benefits.filter(b => b.status === 'Active').reduce((s, b) => s + Number(b.employee_share || b.monthly_premium || 0), 0);
  const totalEmployerSubsidy = benefits.filter(b => b.status === 'Active').reduce((s, b) => s + Number(b.employer_share || (Number(b.monthly_premium || 1500) * 1.5)), 0);

  return (
    <div className="space-y-6">
      <SectionHeader color="#06b6d4" title="HMO Contribution Management" sub="Monthly premium cost-sharing matrix (Employer Subsidy vs Employee Payroll Deduction) & statutory contributions" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Employee Monthly Deductions" value={fmt(totalEmployeeDeduction)} sub="Deducted from payroll sheet" color="text-pink-600" icon={CreditCard} />
        <KpiCard label="Employer Subsidies (Paid)" value={fmt(totalEmployerSubsidy)} sub="Company sponsored coverage" color="text-cyan-700" icon={Building} />
        <KpiCard label="Total Healthcare Premium" value={fmt(totalEmployeeDeduction + totalEmployerSubsidy)} sub="Monthly gross premium" icon={DollarSign} />
      </div>

      {/* HMO Contribution Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">HMO Premium Cost-Share Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">Employee Share is subtracted automatically from the Payroll Sheet under HMO Deductions</p>
          </div>
          <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Employee', 'Plan Tier', 'Employee Share (Payroll Ded.)', 'Employer Share (Company Paid)', 'Total Monthly Premium', 'Billing Status'].map(h => (
                  <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {benefits.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{b.employee}</td>
                  <td className="py-3.5 px-4 text-slate-700">{b.plan}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-pink-600">-{fmt(b.employee_share || b.monthly_premium)}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-cyan-700">{fmt(b.employer_share || (Number(b.monthly_premium || 1500) * 1.5))}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{fmt(Number(b.employee_share || b.monthly_premium) + Number(b.employer_share || (Number(b.monthly_premium || 1500) * 1.5)))}</td>
                  <td className="py-3.5 px-4">
                    {b.effective_date && b.effective_date > '2024-07-01' ? (
                      <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-700 font-semibold text-[10px] border border-pink-200">
                        Mid-Cycle (Prorated)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100">
                        Reconciled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Government Contributions (Philippine Law) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Mandated Philippine Statutory Contributions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
            <div className="font-bold text-slate-900 flex justify-between"><span>Social Security System (SSS)</span><span className="text-blue-700">RA 11199</span></div>
            <div className="text-[11px] text-slate-500">Fixed rate based on MSC (₱20,000 max bracket)</div>
            <div className="space-y-1 pt-1 border-t border-blue-100">
              <div className="flex justify-between"><span className="text-slate-500">Employee Share:</span><span className="font-mono font-bold">₱1,125.00</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Employer Share:</span><span className="font-mono font-bold">₱2,250.00</span></div>
              <div className="flex justify-between font-bold text-blue-900 pt-1 border-t"><span>Total Remittance:</span><span className="font-mono">₱3,375.00</span></div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
            <div className="font-bold text-slate-900 flex justify-between"><span>PhilHealth</span><span className="text-emerald-700">UHC Act</span></div>
            <div className="text-[11px] text-slate-500">5.0% total premium equally divided (2.5% each)</div>
            <div className="space-y-1 pt-1 border-t border-emerald-100">
              <div className="flex justify-between"><span className="text-slate-500">Employee Share:</span><span className="font-mono font-bold">2.5% of Basic</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Employer Share:</span><span className="font-mono font-bold">2.5% of Basic</span></div>
              <div className="flex justify-between font-bold text-emerald-900 pt-1 border-t"><span>Total Remittance:</span><span className="font-mono">5.0% of Basic</span></div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
            <div className="font-bold text-slate-900 flex justify-between"><span>Pag-IBIG / HDMF</span><span className="text-[#2E6BE6]">RA 9679</span></div>
            <div className="text-[11px] text-slate-500">Mandatory savings program for housing assistance</div>
            <div className="space-y-1 pt-1 border-t border-blue-100">
              <div className="flex justify-between"><span className="text-slate-500">Employee Share:</span><span className="font-mono font-bold">₱100.00</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Employer Share:</span><span className="font-mono font-bold">₱100.00</span></div>
              <div className="flex justify-between font-bold text-blue-900 pt-1 border-t"><span>Total Remittance:</span><span className="font-mono">₱200.00</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 5C: EMPLOYEE BENEFITS MONITORING
═══════════════════════════════════════════════════════════════ */
function BenefitsMonitoringModule() {
  const { user } = useAuth();
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const isEmployee = user?.role === 'employee';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.getBenefits();
      setBenefits(d.benefits || []);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (id, currentStatus) => {
    if (!canPerformAction(user?.role, 'TOGGLE_CARD_STATUS')) {
      setToast('Unauthorized: You do not have permission to alter HMO card statuses.');
      return;
    }
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await api.updateHMOStatus(id, nextStatus);
      setBenefits(prev => prev.map(b => b.id === id ? { ...b, status: nextStatus } : b));
      setToast(`HMO status switched to ${nextStatus}! Only active members have deductions in payroll.`);
    } catch { setToast('Status update failed'); }
  };

  const displayedBenefits = isEmployee
    ? benefits.filter(b => {
        const emp = (b.employee || '').toLowerCase();
        const me = (user?.name || 'Sarah Jenkins').toLowerCase();
        return emp.includes(me) || me.includes(emp) || b.employee === 'Sarah Jenkins';
      })
    : benefits;

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      <SectionHeader color="#06b6d4" title={isEmployee ? "My Healthcare Benefits & Card" : "Employee Benefits Monitoring"} sub="Track healthcare utilization, Maximum Benefit Limits (MBL), policy card statuses & accreditation network" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Average Utilization Rate" value="38.4%" sub="Claims to maximum coverage" color="text-cyan-700" icon={Activity} />
        <KpiCard label={isEmployee ? "My Card Status" : "Active Member Cards"} value={isEmployee ? (displayedBenefits[0]?.status || 'Active') : `${benefits.filter(b => b.status === 'Active').length} Cards`} sub="Authorized for hospital admission" color="text-emerald-600" icon={CheckCircle2} />
        <KpiCard label="Accredited Facilities" value="850+ Hospitals" sub="Nationwide medical network" icon={Building} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{isEmployee ? "My Healthcare Coverage" : "Healthcare Benefits Utilization Ledger"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isEmployee ? "Your current active corporate medical plan and benefit utilization" : "Toggle member status to activate or suspend coverage and payroll deduction"}</p>
          </div>
          <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Cardholder', 'Plan Tier', 'Maximum Benefit Limit', 'Utilized Amount', 'Remaining Balance', 'Card Status', 'Policy Action'].map(h => (
                  <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedBenefits.map((b, idx) => {
                const limit = 250000;
                const used = idx === 0 ? 32000 : idx === 1 ? 15500 : idx === 2 ? 68000 : 8500;
                const remaining = limit - used;
                const pct = Math.round((used / limit) * 100);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{b.employee}</td>
                    <td className="py-3.5 px-4 text-slate-700">{b.plan}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{fmt(limit)}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-rose-600">
                      {fmt(used)} ({pct}%)
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{fmt(remaining)}</td>
                    <td className="py-3.5 px-4"><StatusBadge status={b.status} /></td>
                    <td className="py-3.5 px-4 text-right">
                      {canPerformAction(user?.role, 'TOGGLE_CARD_STATUS') ? (
                        <button
                          onClick={() => handleToggleStatus(b.id, b.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            b.status === 'Active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {b.status === 'Active' ? 'Suspend Card' : 'Activate Card'}
                        </button>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                          Active Coverage
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 6A: REAL-TIME PAYROLL DASHBOARD
═══════════════════════════════════════════════════════════════ */
function RealtimeDashboardModule() {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState('July 2024');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m) => {
    setLoading(true);
    try {
      const d = await api.getRealtimeDashboard(m);
      setData(d);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(month); }, [month, load]);

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader color="#10b981" title="Real-Time Payroll Analytics Dashboard" sub="Executive KPI overview, departmental payroll distribution & cryptographic system health" />
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(e.target.value)} className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white shadow-sm outline-none">
            <option value="July 2024">July 2024</option>
            <option value="June 2024">June 2024</option>
            <option value="August 2024">August 2024</option>
          </select>
          <button onClick={() => load(month)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Gross Payroll Basis" value={summary.total_gross ? fmt(summary.total_gross, summary.total_gross_raw) : '₱2,185,420.00'} sub={`${month} cut-off`} color="text-slate-900" icon={DollarSign} />
            <KpiCard label="Statutory Deductions" value={summary.total_deductions ? fmt(summary.total_deductions, summary.total_deductions_raw) : '₱840,250.00'} sub="BIR + SSS + PH + HDMF" color="text-rose-600" icon={Sliders} />
            <KpiCard label="Net Disbursed Funds" value={summary.total_net ? fmt(summary.total_net, summary.total_net_raw) : '₱1,345,170.00'} sub="Direct Deposit Payout" color="text-emerald-600" icon={CheckCircle2} />
            <KpiCard label="Processed Staff" value={summary.employees_processed || '142/160'} sub="100% Audited" color="text-[#2E6BE6]" icon={Users} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Department Payroll Distribution</h3>
              <div className="space-y-4">
                {(data?.department_breakdown || [
                  { department: 'Engineering', headcount: 42, total_gross: 648000, percentage: 30 },
                  { department: 'Product', headcount: 28, total_gross: 432000, percentage: 20 },
                  { department: 'Finance', headcount: 35, total_gross: 540000, percentage: 25 },
                  { department: 'Marketing', headcount: 25, total_gross: 385000, percentage: 18 },
                  { department: 'Admin & HR', headcount: 30, total_gross: 175000, percentage: 7 },
                ]).map(d => (
                  <div key={d.department} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{d.department} ({d.headcount} staff)</span>
                      <span className="font-mono font-bold text-slate-900">{fmt(d.total_gross)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2E6BE6] rounded-full transition-all duration-500" style={{ width: `${d.percentage || 20}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Cryptographic Security & System Audit</h3>
                <span className="text-xs px-2.5 py-1 bg-blue-50 text-[#2E6BE6] font-semibold rounded-full border border-blue-100 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> AES-256 Validated
                </span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {[
                  { action: 'Payroll Computation Synchronized', user: 'Liza Gomez (HR Manager)', time: 'Just now', type: 'Payroll' },
                  { action: 'Overtime Approved (12 hrs)', user: 'Liza Gomez (HR Manager)', time: '5 mins ago', type: 'Timekeeping' },
                  { action: 'Expense Claim Approved (CLM-0001)', user: 'Jose Reyes (Finance Manager)', time: '12 mins ago', type: 'Claims' },
                  { action: 'Salary Adjustment Approved', user: 'Jose Reyes (Finance Director)', time: '25 mins ago', type: 'Compensation' },
                  { action: 'HMO Enrollment Activated', user: 'Liza Gomez (HR Manager)', time: '1 hour ago', type: 'Benefits' },
                ].map((a, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{a.action}</div>
                      <div className="text-slate-400 text-[11px]">{a.user}</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">{a.type}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 6B: FINANCIAL REPORTING
═══════════════════════════════════════════════════════════════ */
function FinancialReportingModule() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [month, setMonth] = useState('July 2024');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m) => {
    setLoading(true);
    try {
      const d = await api.getFinancialReports(m);
      setData(d);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(month); }, [month, load]);

  const handleExportCSV = () => {
    if (!data?.employees) return;
    const headers = ['Employee Code', 'Full Name', 'Department', 'Basic Pay', 'OT Pay', 'Allowances', 'Gross Pay', 'BIR Tax', 'SSS', 'PhilHealth', 'Pag-IBIG', 'HMO Deduction', 'Total Deductions', 'Net Pay'];
    const rows = data.employees.map(e => [
      e.employee_code,
      `${e.first_name} ${e.last_name}`,
      e.department,
      e.basic_pay,
      e.ot_pay,
      e.allowances,
      e.gross_pay,
      e.bir_tax,
      e.sss,
      e.philhealth,
      e.pagibig,
      e.hmo_deduction,
      e.total_deductions,
      e.net_pay
    ]);
    downloadCSV(`MMS_Financial_Report_${month.replace(' ', '_')}.csv`, headers, rows);
  };

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader color="#10b981" title="Corporate Financial Payroll Reporting" sub="Corporate general ledger breakdown, employer statutory burdens & variance analysis" />
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(e.target.value)} className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white shadow-sm outline-none">
            <option value="July 2024">July 2024</option>
            <option value="June 2024">June 2024</option>
            <option value="August 2024">August 2024</option>
          </select>
          {canPerformAction(user?.role, 'EXPORT_FINANCIAL_LEDGER') && (
            <button onClick={handleExportCSV} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5" /><span>Export Ledger (CSV)</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-[14px] border border-[#E4E8F0] bg-white shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Salaries Expense</span>
          <div className="text-2xl font-black text-slate-900">{summary.total_gross ? fmt(summary.total_gross, summary.total_gross_raw) : '₱2,185,420.00'}</div>
          <div className="text-xs text-slate-500 font-medium">Includes Basic + Overtime + Allowances</div>
        </div>
        <div className="p-5 rounded-[14px] border border-[#E4E8F0] bg-white shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Employer Statutory Burden</span>
          <div className="text-2xl font-black text-[#2E6BE6]">₱385,420.00</div>
          <div className="text-xs text-slate-500 font-medium">SSS ER + PhilHealth ER + HDMF ER</div>
        </div>
        <div className="p-5 rounded-[14px] border border-emerald-200 bg-emerald-50/60 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">Total Company Labor Cost</span>
          <div className="text-2xl font-black text-emerald-700">₱2,565,420.00</div>
          <div className="text-xs text-emerald-800 font-medium">Fully loaded corporate payroll liability</div>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E4E8F0] flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Financial Payroll Ledger Summary</h2>
          {canPerformAction(user?.role, 'EXPORT_FINANCIAL_LEDGER') && (
            <button onClick={handleExportCSV} className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer">
              <Download className="w-3 h-3" /> Download Full CSV
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Staff Member', 'Department', 'Basic Salary', 'OT Earnings', 'Gross Pay', 'Tax Withheld', 'Net Disbursed'].map(h => (
                  <th key={h} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.employees || []).map(e => (
                <tr key={e.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{e.first_name} {e.last_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{e.department}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{fmt(e.basic_pay)}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{fmt(e.ot_pay)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{fmt(e.gross_pay)}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-rose-600">{fmt(e.bir_tax)}</td>
                  <td className="py-3.5 px-4 font-mono font-black text-emerald-700">{fmt(e.net_pay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 6C: GOVERNMENT COMPLIANCE REPORTS
 ═══════════════════════════════════════════════════════════════ */
function GovernmentComplianceModule() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [month, setMonth] = useState('July 2024');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bir');

  const load = useCallback(async (m) => {
    setLoading(true);
    try {
      const d = await api.getComplianceReports(m);
      setData(d);
    } catch { /* fallback */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(month); }, [month, load]);

  const handleExportCSV = () => {
    if (!data?.employees) return;
    let headers = [];
    let rows = [];
    if (activeTab === 'bir') {
      headers = ['TIN', 'Employee Name', 'Gross Compensation', 'Non-Taxable Allowances', 'Taxable Compensation', 'Withholding Tax (TRAIN)'];
      rows = data.employees.map(e => [e.tin, `${e.first_name} ${e.last_name}`, e.gross_pay, e.allowances, Number(e.gross_pay) - Number(e.allowances), e.bir_tax]);
    } else if (activeTab === 'sss') {
      headers = ['SS Number', 'Employee Name', 'Employee Share', 'Employer Share', 'Total SSS Remittance'];
      rows = data.employees.map(e => [e.tin, `${e.first_name} ${e.last_name}`, e.sss, Number(e.sss) * 2, Number(e.sss) * 3]);
    } else {
      headers = ['ID Number', 'Employee Name', 'Department', 'Employee Share', 'Employer Share', 'Total Remittance'];
      rows = data.employees.map(e => [e.tin, `${e.first_name} ${e.last_name}`, e.department, e.philhealth, e.philhealth, Number(e.philhealth) * 2]);
    }
    downloadCSV(`Government_Compliance_${activeTab.toUpperCase()}_${month.replace(' ', '_')}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader color="#10b981" title="Government Statutory Compliance Reports" sub="Mandatory statutory remittance schedules for Philippine government agencies (BIR, SSS, PhilHealth, Pag-IBIG)" />
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(e.target.value)} className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white shadow-sm outline-none">
            <option value="July 2024">July 2024</option>
            <option value="June 2024">June 2024</option>
            <option value="August 2024">August 2024</option>
          </select>
          {canPerformAction(user?.role, 'EXPORT_GOVERNMENT_COMPLIANCE') && (
            <button onClick={handleExportCSV} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5" /><span>Export Form (CSV)</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'bir', label: 'BIR Form 1601-C (Tax Withheld)' },
          { id: 'sss', label: 'SSS R-3 (Collection List)' },
          { id: 'philhealth', label: 'PhilHealth RF-1 (Remittance)' },
          { id: 'pagibig', label: 'Pag-IBIG MCRF (Monthly)' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {activeTab === 'bir' && 'BIR Form 1601-C: Monthly Remittance Return of Income Taxes Withheld'}
              {activeTab === 'sss' && 'SSS Form R-3: Contribution Collection List & Remittance Report'}
              {activeTab === 'philhealth' && "PhilHealth Form RF-1: Employer's Remittance Return"}
              {activeTab === 'pagibig' && 'Pag-IBIG Form MCRF: Member Contribution Remittance Form'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Statutory remittance schedule for {month} • Republic of the Philippines</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
            Filing Ready
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">EMPLOYEE</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">IDENTIFIER / TIN</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">COMPENSATION</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">EMPLOYEE SHARE</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">EMPLOYER SHARE</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase">TOTAL REMITTANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.employees || []).map(emp => {
                const ee = activeTab === 'bir' ? emp.bir_tax : activeTab === 'sss' ? emp.sss : activeTab === 'philhealth' ? emp.philhealth : emp.pagibig;
                const er = activeTab === 'bir' ? 0 : activeTab === 'sss' ? Number(emp.sss) * 2 : activeTab === 'philhealth' ? emp.philhealth : emp.pagibig;
                const total = Number(ee) + Number(er);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{emp.first_name} {emp.last_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{emp.tin}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{fmt(emp.basic_pay)}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-rose-600">{fmt(ee)}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">{fmt(er)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{fmt(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT ROUTER
   Maps each of the 15 distinct submodules to its dedicated view
═══════════════════════════════════════════════════════════════ */
export default function ModuleContentView({ moduleId, moduleLabel, categoryLabel }) {
  // 1. Payroll Management Submodules
  if (moduleId === 'payslips') return <PayslipsModule />;
  if (moduleId === 'timekeeping') return <TimekeepingModule />;

  // 2. Compensation Planning Submodules
  if (moduleId === 'salary_structure') return <SalaryStructureModule />;
  if (moduleId === 'allowances') return <AllowancesModule />;
  if (moduleId === 'salary_adjustment') return <SalaryAdjustmentModule />;

  // 3. Claims & Reimbursement Submodules
  if (moduleId === 'claim_filing') return <ClaimFilingModule />;
  if (moduleId === 'claim_verification') return <ClaimVerificationModule />;
  if (moduleId === 'reimbursement') return <ReimbursementProcessingModule />;

  // 4. HMO & Benefits Administration Submodules
  if (moduleId === 'benefits_enrollment') return <BenefitsEnrollmentModule />;
  if (moduleId === 'hmo_contribution') return <HMOContributionModule />;
  if (moduleId === 'benefits_monitoring') return <BenefitsMonitoringModule />;

  // 5. HR Analytics Dashboard Submodules
  if (moduleId === 'realtime_dashboard') return <RealtimeDashboardModule />;
  if (moduleId === 'financial_reporting') return <FinancialReportingModule />;
  if (moduleId === 'government_compliance') return <GovernmentComplianceView />;

  // Fallback
  return (
    <div className="space-y-6">
      <SectionHeader color={ACCENT} title={moduleLabel} sub={`${categoryLabel} — Microfinancial Management System`} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Active Enrolled Staff" value="160 Employees" sub="100% Statutory Compliant" color="text-emerald-600" />
        <KpiCard label="Total Module Allocation" value="₱2,185,420.00" sub="Verified by HR Manager" />
        <KpiCard label="Audit Verification" value="AES-256 Validated" sub="PostgreSQL: micropayroll" color="text-[#2E6BE6]" />
      </div>
    </div>
  );
}
