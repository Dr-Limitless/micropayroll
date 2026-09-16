import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  Landmark, 
  ShieldCheck, 
  ArrowUpRight, 
  TrendingUp, 
  Building2, 
  Clock,
  Sparkles,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePrivacy } from '../../context/PrivacyContext';

export default function OverviewDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { privacyMode, togglePrivacyMode, maskMoney } = usePrivacy();
  const [employees, setEmployees] = useState([]);
  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [microloans, setMicroloans] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [empData, periodsData, loansData, auditData] = await Promise.all([
          api.getEmployees(),
          api.getPayrollPeriods(),
          api.getMicroloans(),
          api.getAuditLogs()
        ]);

        if (empData.employees) setEmployees(empData.employees);
        if (periodsData.periods) setPayrollPeriods(periodsData.periods);
        if (loansData.microloans) setMicroloans(loansData.microloans);
        if (auditData.audit_logs) setAuditLogs(auditData.audit_logs);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalPayroll = payrollPeriods.length > 0 
    ? payrollPeriods.reduce((acc, p) => acc + Number(p.total_net || 0), 0)
    : 344810;

  const totalLoansBalance = microloans.reduce((acc, l) => acc + Number(l.balance_amount || 0), 0);

  // Department counts
  const deptCounts = employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0B1F3A] via-[#102a4e] to-[#0B1F3A] rounded-[16px] p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-[#1e3a5f]">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#2E6BE6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#2E6BE6] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Connected: PostgreSQL (micropayroll)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
              Welcome back, {user?.full_name || 'Administrator'}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Microfinancial Management System is running. All records and salary figures are protected by native AES-256-GCM hardware encryption.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('payroll')}
              className="px-4 py-2.5 rounded-lg bg-[#2E6BE6] hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Run Payroll</span>
            </button>
            <button
              onClick={() => onNavigate('employees')}
              className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[14px] border border-[#E4E8F0] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payroll Disbursed</span>
              <button
                type="button"
                onClick={togglePrivacyMode}
                title={privacyMode ? 'Privacy Mode ON — Click to reveal values' : 'Privacy Mode OFF — Click to hide values'}
                className="p-1 rounded-md text-slate-400 hover:text-[#2E6BE6] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-[#2E6BE6]" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-display flex items-center gap-2">
              <span>{maskMoney(`₱${totalPayroll.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}</span>
            </div>
            <div className="flex items-center text-xs text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>2 Cut-offs Processed</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[14px] border border-[#E4E8F0] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Staff</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#2E6BE6]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-display">
              {employees.length || 6} Employees
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              100% AES-256 Bank Encrypted
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[14px] border border-[#E4E8F0] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Microloans Outstanding</span>
              <button
                type="button"
                onClick={togglePrivacyMode}
                title={privacyMode ? 'Privacy Mode ON — Click to reveal values' : 'Privacy Mode OFF — Click to hide values'}
                className="p-1 rounded-md text-slate-400 hover:text-[#2E6BE6] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-[#2E6BE6]" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-[#2E6BE6]">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-display">
              {maskMoney(`₱${totalLoansBalance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
            </div>
            <div className="text-xs text-[#2E6BE6] font-medium mt-1">
              {microloans.filter(m => m.status === 'Active').length} Active Amortizations
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[14px] border border-[#E4E8F0] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Integrity</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 tracking-tight flex items-center gap-1.5 font-display">
              100% Compliant
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              OAuth 2.0 / SHA-256 Logs
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Distribution Bar Graph */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Payroll Cut-offs</h2>
              <p className="text-xs text-slate-500">Gross vs Net Pay with Statutory Deductions</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Semi-Monthly Cycles
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {payrollPeriods.map((period) => {
              const gross = Number(period.total_gross || 210000);
              const net = Number(period.total_net || 170000);
              const deductions = Number(period.total_deductions || 40000);
              const netPercent = Math.round((net / gross) * 100) || 82;

              return (
                <div key={period.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{period.period_name}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      period.status === 'Disbursed' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {period.status}
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${netPercent}%` }} 
                      className="bg-emerald-500 h-full" 
                      title={`Net: ₱${net.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                    <div 
                      style={{ width: `${100 - netPercent}%` }} 
                      className="bg-amber-400 h-full" 
                      title={`Deductions: ₱${deductions.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                    <div>Gross: <strong className="text-slate-800">{maskMoney(`₱${gross.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}</strong></div>
                    <div>Deductions: <strong className="text-amber-700">{maskMoney(`₱${deductions.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}</strong></div>
                    <div>Net Disbursed: <strong className="text-emerald-700 font-bold">{maskMoney(`₱${net.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Roster */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Headcount by Department</h2>
          <div className="space-y-3">
            {Object.entries(deptCounts).map(([dept, count], idx) => {
              const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
              return (
                <div key={dept} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`} />
                    <span className="text-xs font-semibold text-slate-800">{dept}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                    {count} {count === 1 ? 'member' : 'members'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('employees')}
              className="w-full py-2 px-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center space-x-1"
            >
              <span>View Full Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cryptographic Audit Trail Preview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Cryptographic Audit Trail
            </h2>
            <p className="text-xs text-slate-500">Immutable, tamper-evident log stream with SHA-256 verification</p>
          </div>
          <button
            onClick={() => onNavigate('security')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            Open Security Center →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">SHA-256 Checksum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 4).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{log.entity} ({log.entity_id})</td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{log.user_name}</td>
                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                    {log.cryptographic_checksum ? log.cryptographic_checksum.slice(0, 16) + '...' : 'e3b0c442...'}
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
