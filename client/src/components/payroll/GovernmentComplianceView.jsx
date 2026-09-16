import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../utils/rbac';
import {
  Download,
  Printer,
  Search,
  BookOpen,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Building2,
  User,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { usePrivacy, isPrivacyActive, RAW_MASK } from '../../context/PrivacyContext';

function fmt(n) {
  if (isPrivacyActive()) return RAW_MASK;
  if (n === undefined || n === null || isNaN(Number(n))) return '0.00';
  return Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function exportTableToCSV(filename, headers, rows) {
  const content = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function GovernmentComplianceView() {
  const { user } = useAuth();
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const [data, setData] = useState(null);
  const [month, setMonth] = useState('July 2024');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sss_book'); // 'sss_book' | 'philhealth' | 'pagibig' | 'bir' | 'consolidated' | 'master_schedule'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCompliance = useCallback(async (selectedMonth) => {
    setLoading(true);
    try {
      const res = await api.getComplianceReports(selectedMonth);
      setData(res);
    } catch (err) {
      console.error('Error fetching compliance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompliance(month);
  }, [month, fetchCompliance]);

  const isEmployee = data?.is_employee_view || user?.role === 'employee';
  const employees = data?.employees || [];
  const employeeData = data?.employee || {};
  const currentPeriod = data?.current_period || {};
  const history = data?.period_history || [];
  const sssOfficialSchedule = data?.official_sss_schedule || [];

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(e => 
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      (e.employee_code && e.employee_code.toLowerCase().includes(q)) ||
      (e.department && e.department.toLowerCase().includes(q)) ||
      (e.tin && e.tin.toLowerCase().includes(q))
    );
  }, [employees, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (isEmployee) {
      const headers = ['Period', 'Basic Salary', 'Gross Pay', 'SSS EE', 'SSS ER', 'PhilHealth EE', 'PhilHealth ER', 'Pag-IBIG EE', 'Pag-IBIG ER', 'BIR Tax', 'Total Personal Deduction', 'Company Match'];
      const rows = history.map(h => [
        h.period,
        h.basic_pay,
        h.gross_pay,
        h.sss?.ee_total || 0,
        h.sss?.er_total || 0,
        h.philhealth?.ee_share || 0,
        h.philhealth?.er_share || 0,
        h.pagibig?.ee_share || 0,
        h.pagibig?.er_share || 0,
        h.bir_tax || 0,
        h.total_ee_deduction || 0,
        h.total_er_counterpart || 0
      ]);
      exportTableToCSV(`My_Statutory_Contributions_${employeeData.employee_code || 'EMP'}.csv`, headers, rows);
      return;
    }

    if (activeTab === 'sss_book') {
      const headers = ['Employee Name', 'SS Number', 'Range of Compensation', 'MSC SSS/EC', 'MSC MPF', 'MSC Total', 'ER SS', 'ER MPF', 'ER EC', 'ER Total', 'EE SS', 'EE MPF', 'EE Total', 'Total Contribution'];
      const rows = filteredEmployees.map(e => [
        `${e.first_name} ${e.last_name}`,
        e.sss_number || '34-8891240-1',
        e.sss_breakdown?.range_label || '₱34,750.00 - Over',
        e.sss_breakdown?.msc_regular || 20000,
        e.sss_breakdown?.msc_mpf || 0,
        e.sss_breakdown?.msc_total || 20000,
        e.sss_breakdown?.er_ss || 0,
        e.sss_breakdown?.er_mpf || 0,
        e.sss_breakdown?.er_ec || 30,
        e.sss_breakdown?.er_total || 0,
        e.sss_breakdown?.ee_ss || 0,
        e.sss_breakdown?.ee_mpf || 0,
        e.sss_breakdown?.ee_total || 0,
        e.sss_breakdown?.total_contribution || 0
      ]);
      exportTableToCSV(`SSS_Schedule_Contributions_${month.replace(/[\s–]/g, '_')}.csv`, headers, rows);
    } else if (activeTab === 'philhealth') {
      const headers = ['Employee Name', 'PhilHealth Number', 'Department', 'Monthly Basic Salary', 'Employee Share (2.5%)', 'Employer Share (2.5%)', 'Total Premium (5%)'];
      const rows = filteredEmployees.map(e => [
        `${e.first_name} ${e.last_name}`,
        e.philhealth_number || '12-098765432-1',
        e.department,
        e.basic_salary,
        e.philhealth_breakdown?.ee_share || 0,
        e.philhealth_breakdown?.er_share || 0,
        e.philhealth_breakdown?.total_contribution || 0
      ]);
      exportTableToCSV(`PhilHealth_RF1_Schedule_${month.replace(/[\s–]/g, '_')}.csv`, headers, rows);
    } else if (activeTab === 'pagibig') {
      const headers = ['Employee Name', 'Pag-IBIG Number', 'Department', 'Monthly Basic', 'Employee Share', 'Employer Share', 'Total Remittance'];
      const rows = filteredEmployees.map(e => [
        `${e.first_name} ${e.last_name}`,
        e.pagibig_number || '1210-9842-1102',
        e.department,
        e.basic_salary,
        e.pagibig_breakdown?.ee_share || 200,
        e.pagibig_breakdown?.er_share || 200,
        e.pagibig_breakdown?.total_contribution || 400
      ]);
      exportTableToCSV(`PagIBIG_MCRF_Schedule_${month.replace(/[\s–]/g, '_')}.csv`, headers, rows);
    } else if (activeTab === 'bir') {
      const headers = ['TIN', 'Employee Name', 'Department', 'Gross Compensation', 'Statutory Exemptions', 'Taxable Compensation', 'Tax Withheld'];
      const rows = filteredEmployees.map(e => [
        e.tin || '284-901-443-000',
        `${e.first_name} ${e.last_name}`,
        e.department,
        e.gross_pay || e.basic_salary,
        (e.sss_breakdown?.ee_total || 0) + (e.philhealth_breakdown?.ee_share || 0) + (e.pagibig_breakdown?.ee_share || 0),
        Math.max(0, (e.gross_pay || e.basic_salary) - ((e.sss_breakdown?.ee_total || 0) + (e.philhealth_breakdown?.ee_share || 0) + (e.pagibig_breakdown?.ee_share || 0))),
        e.bir_tax || 0
      ]);
      exportTableToCSV(`BIR_Form_1601C_Schedule_${month.replace(/[\s–]/g, '_')}.csv`, headers, rows);
    } else if (activeTab === 'consolidated') {
      const headers = ['Employee Code', 'Employee Name', 'Department', 'Basic Salary', 'SSS EE', 'SSS ER', 'PhilHealth EE', 'PhilHealth ER', 'Pag-IBIG EE', 'Pag-IBIG ER', 'BIR Tax', 'Total EE Deductions', 'Total ER Burden', 'Grand Remittance'];
      const rows = filteredEmployees.map(e => [
        e.employee_code,
        `${e.first_name} ${e.last_name}`,
        e.department,
        e.basic_salary,
        e.sss_breakdown?.ee_total || 0,
        e.sss_breakdown?.er_total || 0,
        e.philhealth_breakdown?.ee_share || 0,
        e.philhealth_breakdown?.er_share || 0,
        e.pagibig_breakdown?.ee_share || 0,
        e.pagibig_breakdown?.er_share || 0,
        e.bir_tax || 0,
        e.total_ee_deductions || 0,
        e.total_er_burden || 0,
        e.grand_total_remittance || 0
      ]);
      exportTableToCSV(`Consolidated_Statutory_${month.replace(/[\s–]/g, '_')}.csv`, headers, rows);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-semibold">Generating statutory compliance tables...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          PRINT-ONLY OFFICIAL FORM HEADER (Visible ONLY on Paper / Print)
         ───────────────────────────────────────────────────────────── */}
      <div className="print-only hidden print:block mb-4 text-center border-b-2 border-black pb-3">
        <div className="text-xs uppercase tracking-widest font-bold">Republic of the Philippines</div>
        <div className="text-base font-black uppercase tracking-tight">Microfinancial Management System (MMS)</div>
        <div className="text-sm font-bold uppercase underline mt-0.5">
          {isEmployee ? 'EMPLOYEE STATUTORY CONTRIBUTIONS & WITHHOLDING TAX STATEMENT' : 'SCHEDULE OF STATUTORY CONTRIBUTIONS & WITHHOLDING TAXES'}
        </div>
        <div className="text-xs text-slate-600 mt-0.5">
          Applicable Payroll Period: <span className="font-bold">{month}</span> • Social Security Act (RA 11199) • Universal Health Care (RA 11223) • HDMF Circular 460 • TRAIN Law
        </div>
        {isEmployee && (
          <div className="text-xs font-mono font-bold mt-1 text-slate-800">
            EMPLOYEE: {employeeData.full_name} ({employeeData.employee_code}) • SSS: {employeeData.sss_number} • PhilHealth: {employeeData.philhealth_number} • Pag-IBIG: {employeeData.pagibig_number} • TIN: {employeeData.tin}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ON-SCREEN WEB HEADER & CONTROLS (Hidden When Printing)
         ───────────────────────────────────────────────────────────── */}
      <div className="no-print flex flex-row items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-1.5 h-6 rounded-full bg-emerald-600 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {isEmployee ? 'My Statutory Contributions & Tax Statement' : 'Statutory Contributions & Tax Schedules'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 pl-4 font-normal mt-0.5">
            {isEmployee 
              ? 'Statement of your personal government contributions (SSS, PhilHealth, Pag-IBIG, BIR Tax) and employer counterpart match'
              : 'Overall employee schedules for SSS (Effective 2025 Schedule), PhilHealth RF-1, Pag-IBIG MCRF, and BIR Form 1601-C'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-nowrap shrink-0 ml-auto">
          {!isEmployee && (
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white shadow-sm outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="July 2024">July 2024</option>
              <option value="June 2024">June 2024</option>
              <option value="August 2024">August 2024</option>
              <option value="September 2026">September 2026</option>
            </select>
          )}

          <button
            type="button"
            onClick={togglePrivacyMode}
            title={privacyMode ? 'Privacy Mode ON — Click to reveal values' : 'Privacy Mode OFF — Click to hide values'}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-sm transition-colors cursor-pointer whitespace-nowrap ${
              privacyMode
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {privacyMode ? <EyeOff className="w-3.5 h-3.5 shrink-0 text-emerald-600" /> : <Eye className="w-3.5 h-3.5 shrink-0" />}
            <span>{privacyMode ? 'Masked' : 'Mask Figures'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>Print Official Table</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          EMPLOYEE DETAILS BANNER (EMPLOYEE ROLE ONLY)
         ───────────────────────────────────────────────────────────── */}
      {isEmployee && (
        <div className="no-print p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              {employeeData.employee_code || 'EMP'}
            </div>
            <div>
              <div className="text-base font-black text-slate-900">{employeeData.full_name}</div>
              <div className="text-xs text-slate-500">{employeeData.position} • {employeeData.department}</div>
              <div className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">
                Monthly Basic Salary: ₱{fmt(employeeData.base_salary)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs w-full md:w-auto">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">SSS Number</div>
              <div className="font-mono font-bold text-slate-800 text-xs">{employeeData.sss_number}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">PhilHealth ID</div>
              <div className="font-mono font-bold text-slate-800 text-xs">{employeeData.philhealth_number}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Pag-IBIG MID</div>
              <div className="font-mono font-bold text-slate-800 text-xs">{employeeData.pagibig_number}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">TIN</div>
              <div className="font-mono font-bold text-slate-800 text-xs">{employeeData.tin}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          HIGHER ROLES AGENCY TAB SELECTOR (HIGHER ROLES ONLY)
         ───────────────────────────────────────────────────────────── */}
      {!isEmployee && (
        <div className="no-print flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'sss_book', label: 'SSS Schedule Table' },
              { id: 'philhealth', label: 'PhilHealth Table' },
              { id: 'pagibig', label: 'Pag-IBIG Table' },
              { id: 'bir', label: 'BIR Tax Table' },
              { id: 'consolidated', label: 'All Agencies Consolidated' },
              { id: 'master_schedule', label: '2025 SSS Book Master Schedule' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search employee, dept, TIN..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          1. SSS CONTRIBUTIONS TABLE (REPLICATING BOOK PAGE 252 FORMAT)
          Works for both Higher Roles (All Staff) and Employee (Own Record)
         ═════════════════════════════════════════════════════════════════ */}
      {(isEmployee || activeTab === 'sss_book') && (
        <div className="bg-white rounded-2xl border-2 border-black overflow-hidden shadow-sm">
          {/* Official Book Table Header Title */}
          <div className="bg-white py-3 px-4 border-b-2 border-black text-center select-none">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-black">
              SCHEDULE OF SSS CONTRIBUTIONS
            </h2>
            <div className="text-xs font-bold uppercase tracking-widest text-black">
              EFFECTIVE JANUARY 2025
            </div>
            <div className="text-[11px] text-slate-600 italic mt-0.5">
              {isEmployee ? `Statement of Social Security Contributions for ${employeeData.full_name}` : `Republic Act No. 11199 • Monthly Remittance Schedule for ${month}`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="gov-table w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 text-black border-b border-black">
                  {!isEmployee && (
                    <th rowSpan="2" className="py-2.5 px-3 font-bold border-r border-black align-middle text-left">
                      Employee Name &amp; SSS No.
                    </th>
                  )}
                  <th rowSpan="2" className="py-2.5 px-3 font-bold border-r border-black align-middle text-center">
                    Range of Compensation
                  </th>
                  <th colSpan="3" className="py-1 px-2 font-bold text-center border-r border-black">
                    MONTHLY SALARY CREDIT
                  </th>
                  <th colSpan="8" className="py-1 px-2 font-bold text-center">
                    AMOUNT OF CONTRIBUTIONS
                  </th>
                </tr>
                <tr className="bg-slate-100 text-black border-b-2 border-black text-[11px]">
                  {/* MSC Columns */}
                  <th className="py-1.5 px-2 text-center border-r border-black font-bold">SSS/EC</th>
                  <th className="py-1.5 px-2 text-center border-r border-black font-bold">MPF</th>
                  <th className="py-1.5 px-2 text-center border-r-2 border-black font-black">TOTAL</th>

                  {/* EMPLOYER Columns */}
                  <th className="py-1.5 px-2 text-center border-r border-black font-semibold">SS</th>
                  <th className="py-1.5 px-2 text-center border-r border-black font-semibold">MPF</th>
                  <th className="py-1.5 px-2 text-center border-r border-black font-semibold">EC</th>
                  <th className="py-1.5 px-2 text-center border-r-2 border-black font-black bg-slate-200/60">TOTAL ER</th>

                  {/* EMPLOYEE Columns */}
                  <th className="py-1.5 px-2 text-center border-r border-black font-semibold">SS</th>
                  <th className="py-1.5 px-2 text-center border-r border-black font-semibold">MPF</th>
                  <th className="py-1.5 px-2 text-center border-r-2 border-black font-black bg-slate-200/60">TOTAL EE</th>

                  {/* GRAND TOTAL Column */}
                  <th className="py-1.5 px-3 text-center font-black bg-slate-300 text-black">TOTAL (ER + EE)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black font-mono text-xs">
                {isEmployee ? (
                  // Single Employee Statement Row
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-bold text-black border-r border-black text-center">
                      {currentPeriod.sss?.range_label || '₱34,750.00 - Over'}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-black text-black">{fmt(currentPeriod.sss?.msc_regular)}</td>
                    <td className="py-2 px-2 text-center border-r border-black text-black">{currentPeriod.sss?.msc_mpf > 0 ? fmt(currentPeriod.sss?.msc_mpf) : '-'}</td>
                    <td className="py-2 px-2 text-center font-bold border-r-2 border-black text-black">{fmt(currentPeriod.sss?.msc_total)}</td>

                    {/* ER */}
                    <td className="py-2 px-2 text-center border-r border-black text-black">{fmt(currentPeriod.sss?.er_ss)}</td>
                    <td className="py-2 px-2 text-center border-r border-black text-black">{currentPeriod.sss?.er_mpf > 0 ? fmt(currentPeriod.sss?.er_mpf) : '-'}</td>
                    <td className="py-2 px-2 text-center border-r border-black text-black">{fmt(currentPeriod.sss?.er_ec)}</td>
                    <td className="py-2 px-2 text-center font-bold border-r-2 border-black bg-slate-100 text-black">{fmt(currentPeriod.sss?.er_total)}</td>

                    {/* EE */}
                    <td className="py-2 px-2 text-center border-r border-black text-black">{fmt(currentPeriod.sss?.ee_ss)}</td>
                    <td className="py-2 px-2 text-center border-r border-black text-black">{currentPeriod.sss?.ee_mpf > 0 ? fmt(currentPeriod.sss?.ee_mpf) : '-'}</td>
                    <td className="py-2 px-2 text-center font-bold border-r-2 border-black bg-slate-100 text-black">{fmt(currentPeriod.sss?.ee_total)}</td>

                    {/* TOTAL */}
                    <td className="py-2 px-3 text-center font-black bg-slate-200 text-black">{fmt(currentPeriod.sss?.total_contribution)}</td>
                  </tr>
                ) : (
                  // Higher Roles: Overall Employees Rows
                  filteredEmployees.map(e => {
                    const s = e.sss_breakdown || {};
                    return (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-sans font-bold text-black border-r border-black">
                          <div>{e.first_name} {e.last_name}</div>
                          <div className="font-mono text-[10px] text-slate-500">{e.sss_number || '34-8891240-1'}</div>
                        </td>
                        <td className="py-2 px-3 font-sans text-center border-r border-black text-black">
                          {s.range_label}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-black text-black">{fmt(s.msc_regular)}</td>
                        <td className="py-2 px-2 text-center border-r border-black text-black">{s.msc_mpf > 0 ? fmt(s.msc_mpf) : '-'}</td>
                        <td className="py-2 px-2 text-center font-bold border-r-2 border-black text-black">{fmt(s.msc_total)}</td>

                        {/* ER */}
                        <td className="py-2 px-2 text-center border-r border-black text-black">{fmt(s.er_ss)}</td>
                        <td className="py-2 px-2 text-center border-r border-black text-black">{s.er_mpf > 0 ? fmt(s.er_mpf) : '-'}</td>
                        <td className="py-2 px-2 text-center border-r border-black text-black">{fmt(s.er_ec)}</td>
                        <td className="py-2 px-2 text-center font-bold border-r-2 border-black bg-slate-100 text-black">{fmt(s.er_total)}</td>

                        {/* EE */}
                        <td className="py-2 px-2 text-center border-r border-black text-black">{fmt(s.ee_ss)}</td>
                        <td className="py-2 px-2 text-center border-r border-black text-black">{s.ee_mpf > 0 ? fmt(s.ee_mpf) : '-'}</td>
                        <td className="py-2 px-2 text-center font-bold border-r-2 border-black bg-slate-100 text-black">{fmt(s.ee_total)}</td>

                        {/* TOTAL */}
                        <td className="py-2 px-3 text-center font-black bg-slate-200 text-black">{fmt(s.total_contribution)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Bottom Totals Row for Overall Employees */}
              {!isEmployee && (
                <tfoot className="bg-slate-200 font-mono font-black text-black border-t-2 border-black text-xs">
                  <tr>
                    <td colSpan="2" className="py-2.5 px-3 font-sans uppercase text-center border-r border-black">
                      TOTALS ({filteredEmployees.length} Staff)
                    </td>
                    <td className="py-2 px-2 text-center border-r border-black">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.msc_regular || 0), 0))}</td>
                    <td className="py-2 px-2 text-center border-r border-black">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.msc_mpf || 0), 0))}</td>
                    <td className="py-2 px-2 text-center border-r-2 border-black">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.msc_total || 0), 0))}</td>

                    <td className="py-2 px-2 text-center border-r border-black">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.er_ss || 0), 0))}</td>
                    <td className="py-2 px-2 text-center border-r border-black">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.er_mpf || 0), 0))}</td>
                    <td className="py-2 px-2 text-center border-r border-black">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.er_ec || 0), 0))}</td>
                    <td className="py-2 px-2 text-center border-r-2 border-black bg-slate-300">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.er_total || 0), 0))}</td>

                    <td className="py-2 px-2 text-center border-r border-black">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.ee_ss || 0), 0))}</td>
                    <td className="py-2 px-2 text-center border-r border-black">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.ee_mpf || 0), 0))}</td>
                    <td className="py-2 px-2 text-center border-r-2 border-black bg-slate-300">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.ee_total || 0), 0))}</td>

                    <td className="py-2 px-3 text-center bg-slate-300 text-black border-black">{fmt(filteredEmployees.reduce((sum, e) => sum + (e.sss_breakdown?.total_contribution || 0), 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-black text-[11px] text-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>*EC = Employees' Compensation (₱10 below ₱15k, ₱30 for ₱15k &amp; above); MPF = Mandatory Provident Fund (WISP)</span>
            <span className="font-bold">Republic of the Philippines • Social Security System</span>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          2. PHILHEALTH CONTRIBUTIONS TABLE
         ═════════════════════════════════════════════════════════════════ */}
      {(isEmployee || activeTab === 'philhealth') && (
        <div className="bg-white rounded-2xl border-2 border-black overflow-hidden shadow-sm">
          <div className="bg-white py-3 px-4 border-b-2 border-black text-center select-none">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-black">
              PHILHEALTH CONTRIBUTION REMITTANCE SCHEDULE
            </h2>
            <div className="text-xs font-bold uppercase tracking-widest text-black">
              REPUBLIC ACT NO. 11223 (UNIVERSAL HEALTH CARE ACT)
            </div>
            <div className="text-[11px] text-slate-600 italic mt-0.5">
              5.0% Premium Rate • Shared 50% Employee (2.5%) and 50% Employer (2.5%) • Minimum ₱10,000 / Maximum ₱100,000 Cap
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="gov-table w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 text-black border-b-2 border-black">
                  {!isEmployee && <th className="py-2.5 px-3 font-bold border-r border-black">Employee Name</th>}
                  {!isEmployee && <th className="py-2.5 px-3 font-bold border-r border-black">PhilHealth Identification No. (PIN)</th>}
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Monthly Basic Salary</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Premium Rate</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Employee Share (2.5%)</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Employer Share (2.5%)</th>
                  <th className="py-2.5 px-3 font-black text-center bg-slate-300 text-black">Total PhilHealth Remittance (5%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-mono text-xs">
                {isEmployee ? (
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center border-r border-black text-black">{fmt(currentPeriod.basic_pay)}</td>
                    <td className="py-2.5 px-3 text-center border-r border-black text-black">5.0%</td>
                    <td className="py-2.5 px-3 text-center font-bold border-r border-black text-black">{fmt(currentPeriod.philhealth?.ee_share)}</td>
                    <td className="py-2.5 px-3 text-center font-bold border-r border-black text-black">{fmt(currentPeriod.philhealth?.er_share)}</td>
                    <td className="py-2.5 px-3 text-center font-black bg-slate-200 text-black">{fmt(currentPeriod.philhealth?.total_contribution)}</td>
                  </tr>
                ) : (
                  filteredEmployees.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-sans font-bold text-black border-r border-black">{e.first_name} {e.last_name}</td>
                      <td className="py-2 px-3 border-r border-black text-slate-700">{e.philhealth_number || '12-098765432-1'}</td>
                      <td className="py-2 px-3 text-center border-r border-black text-black">{fmt(e.basic_salary)}</td>
                      <td className="py-2 px-3 text-center border-r border-black text-black">5.0%</td>
                      <td className="py-2 px-3 text-center font-bold border-r border-black text-black">{fmt(e.philhealth_breakdown?.ee_share)}</td>
                      <td className="py-2 px-3 text-center font-bold border-r border-black text-black">{fmt(e.philhealth_breakdown?.er_share)}</td>
                      <td className="py-2 px-3 text-center font-black bg-slate-200 text-black">{fmt(e.philhealth_breakdown?.total_contribution)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {!isEmployee && (
                <tfoot className="bg-slate-200 font-mono font-black text-black border-t-2 border-black text-xs">
                  <tr>
                    <td colSpan="3" className="py-2.5 px-3 font-sans uppercase text-center border-r border-black">
                      TOTAL PHILHEALTH REMITTANCES ({filteredEmployees.length} Staff)
                    </td>
                    <td className="py-2 px-3 text-center border-r border-black">-</td>
                    <td className="py-2 px-3 text-center border-r border-black">{fmt(filteredEmployees.reduce((s, e) => s + (e.philhealth_breakdown?.ee_share || 0), 0))}</td>
                    <td className="py-2 px-3 text-center border-r border-black">{fmt(filteredEmployees.reduce((s, e) => s + (e.philhealth_breakdown?.er_share || 0), 0))}</td>
                    <td className="py-2 px-3 text-center bg-slate-300">{fmt(filteredEmployees.reduce((s, e) => s + (e.philhealth_breakdown?.total_contribution || 0), 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          3. PAG-IBIG (HDMF) CONTRIBUTIONS TABLE
         ═════════════════════════════════════════════════════════════════ */}
      {(isEmployee || activeTab === 'pagibig') && (
        <div className="bg-white rounded-2xl border-2 border-black overflow-hidden shadow-sm">
          <div className="bg-white py-3 px-4 border-b-2 border-black text-center select-none">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-black">
              PAG-IBIG (HDMF) CONTRIBUTION REMITTANCE SCHEDULE
            </h2>
            <div className="text-xs font-bold uppercase tracking-widest text-black">
              CIRCULAR NO. 460 MANDATORY REMITTANCE SCHEDULE
            </div>
            <div className="text-[11px] text-slate-600 italic mt-0.5">
              Mandatory Monthly Contribution: ₱200.00 Employee Share + ₱200.00 Employer Counterpart = ₱400.00 Total Remittance
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="gov-table w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 text-black border-b-2 border-black">
                  {!isEmployee && <th className="py-2.5 px-3 font-bold border-r border-black">Employee Name</th>}
                  {!isEmployee && <th className="py-2.5 px-3 font-bold border-r border-black">Pag-IBIG MID Number</th>}
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Monthly Compensation</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Employee Share</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Employer Counterpart</th>
                  <th className="py-2.5 px-3 font-black text-center bg-slate-300 text-black">Total Pag-IBIG Remittance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-mono text-xs">
                {isEmployee ? (
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center border-r border-black text-black">{fmt(currentPeriod.basic_pay)}</td>
                    <td className="py-2.5 px-3 text-center font-bold border-r border-black text-black">{fmt(currentPeriod.pagibig?.ee_share)}</td>
                    <td className="py-2.5 px-3 text-center font-bold border-r border-black text-black">{fmt(currentPeriod.pagibig?.er_share)}</td>
                    <td className="py-2.5 px-3 text-center font-black bg-slate-200 text-black">{fmt(currentPeriod.pagibig?.total_contribution)}</td>
                  </tr>
                ) : (
                  filteredEmployees.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-sans font-bold text-black border-r border-black">{e.first_name} {e.last_name}</td>
                      <td className="py-2 px-3 border-r border-black text-slate-700">{e.pagibig_number || '1210-9842-1102'}</td>
                      <td className="py-2 px-3 text-center border-r border-black text-black">{fmt(e.basic_salary)}</td>
                      <td className="py-2 px-3 text-center font-bold border-r border-black text-black">{fmt(e.pagibig_breakdown?.ee_share)}</td>
                      <td className="py-2 px-3 text-center font-bold border-r border-black text-black">{fmt(e.pagibig_breakdown?.er_share)}</td>
                      <td className="py-2 px-3 text-center font-black bg-slate-200 text-black">{fmt(e.pagibig_breakdown?.total_contribution)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {!isEmployee && (
                <tfoot className="bg-slate-200 font-mono font-black text-black border-t-2 border-black text-xs">
                  <tr>
                    <td colSpan="3" className="py-2.5 px-3 font-sans uppercase text-center border-r border-black">
                      TOTAL PAG-IBIG REMITTANCES ({filteredEmployees.length} Staff)
                    </td>
                    <td className="py-2 px-3 text-center border-r border-black">{fmt(filteredEmployees.reduce((s, e) => s + (e.pagibig_breakdown?.ee_share || 0), 0))}</td>
                    <td className="py-2 px-3 text-center border-r border-black">{fmt(filteredEmployees.reduce((s, e) => s + (e.pagibig_breakdown?.er_share || 0), 0))}</td>
                    <td className="py-2 px-3 text-center bg-slate-300">{fmt(filteredEmployees.reduce((s, e) => s + (e.pagibig_breakdown?.total_contribution || 0), 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          4. BIR WITHHOLDING TAX TABLE (TRAIN LAW FORM 1601-C)
         ═════════════════════════════════════════════════════════════════ */}
      {(isEmployee || activeTab === 'bir') && (
        <div className="bg-white rounded-2xl border-2 border-black overflow-hidden shadow-sm">
          <div className="bg-white py-3 px-4 border-b-2 border-black text-center select-none">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-black">
              BIR WITHHOLDING TAX SCHEDULE (FORM 1601-C)
            </h2>
            <div className="text-xs font-bold uppercase tracking-widest text-black">
              REPUBLIC ACT NO. 10963 (TRAIN LAW) WITHHOLDING TAXES ON COMPENSATION
            </div>
            <div className="text-[11px] text-slate-600 italic mt-0.5">
              Taxable Compensation = Gross Compensation less Statutory Exemptions (SSS, PhilHealth, Pag-IBIG employee contributions)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="gov-table w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 text-black border-b-2 border-black">
                  {!isEmployee && <th className="py-2.5 px-3 font-bold border-r border-black">Employee Name</th>}
                  {!isEmployee && <th className="py-2.5 px-3 font-bold border-r border-black">Taxpayer Identification No. (TIN)</th>}
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Gross Compensation</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Statutory Deductions (Non-Taxable)</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Taxable Compensation</th>
                  <th className="py-2.5 px-3 font-black text-center bg-slate-300 text-black">Withholding Tax Remitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-mono text-xs">
                {isEmployee ? (
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center border-r border-black text-black">{fmt(currentPeriod.gross_pay)}</td>
                    <td className="py-2.5 px-3 text-center font-bold border-r border-black text-black">
                      {fmt(Number(currentPeriod.gross_pay) - Number(currentPeriod.taxable_income))}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold border-r border-black text-black">{fmt(currentPeriod.taxable_income)}</td>
                    <td className="py-2.5 px-3 text-center font-black bg-slate-200 text-black">{fmt(currentPeriod.bir_tax)}</td>
                  </tr>
                ) : (
                  filteredEmployees.map(e => {
                    const gross = e.gross_pay || e.basic_salary;
                    const exemptions = (e.sss_breakdown?.ee_total || 0) + (e.philhealth_breakdown?.ee_share || 0) + (e.pagibig_breakdown?.ee_share || 0);
                    const taxable = Math.max(0, gross - exemptions);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans font-bold text-black border-r border-black">{e.first_name} {e.last_name}</td>
                        <td className="py-2 px-3 border-r border-black text-slate-700">{e.tin || '284-901-443-000'}</td>
                        <td className="py-2 px-3 text-center border-r border-black text-black">{fmt(gross)}</td>
                        <td className="py-2 px-3 text-center font-bold border-r border-black text-black">{fmt(exemptions)}</td>
                        <td className="py-2 px-3 text-center font-bold border-r border-black text-black">{fmt(taxable)}</td>
                        <td className="py-2 px-3 text-center font-black bg-slate-200 text-black">{fmt(e.bir_tax)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {!isEmployee && (
                <tfoot className="bg-slate-200 font-mono font-black text-black border-t-2 border-black text-xs">
                  <tr>
                    <td colSpan="3" className="py-2.5 px-3 font-sans uppercase text-center border-r border-black">
                      TOTAL BIR TAX WITHHELD ({filteredEmployees.length} Staff)
                    </td>
                    <td className="py-2 px-3 text-center border-r border-black">
                      {fmt(filteredEmployees.reduce((s, e) => s + ((e.sss_breakdown?.ee_total || 0) + (e.philhealth_breakdown?.ee_share || 0) + (e.pagibig_breakdown?.ee_share || 0)), 0))}
                    </td>
                    <td className="py-2 px-3 text-center border-r border-black">
                      {fmt(filteredEmployees.reduce((s, e) => s + Math.max(0, (e.gross_pay || e.basic_salary) - ((e.sss_breakdown?.ee_total || 0) + (e.philhealth_breakdown?.ee_share || 0) + (e.pagibig_breakdown?.ee_share || 0))), 0))}
                    </td>
                    <td className="py-2 px-3 text-center bg-slate-300">{fmt(filteredEmployees.reduce((s, e) => s + (e.bir_tax || 0), 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          5. ALL AGENCIES CONSOLIDATED SUMMARY TABLE (HIGHER ROLES ONLY)
         ═════════════════════════════════════════════════════════════════ */}
      {!isEmployee && activeTab === 'consolidated' && (
        <div className="bg-white rounded-2xl border-2 border-black overflow-hidden shadow-sm">
          <div className="bg-white py-3 px-4 border-b-2 border-black text-center select-none">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-black">
              CONSOLIDATED STATUTORY CONTRIBUTIONS &amp; TAX SUMMARY
            </h2>
            <div className="text-xs font-bold uppercase tracking-widest text-black">
              MASTER SUMMARY FOR {month} • ALL EMPLOYEES
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="gov-table w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 text-black border-b-2 border-black">
                  <th className="py-2.5 px-3 font-bold border-r border-black">Employee</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Basic Pay</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">SSS (EE / ER)</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">PhilHealth (EE / ER)</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">Pag-IBIG (EE / ER)</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center">BIR Tax</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center bg-slate-200">Total EE Deduct</th>
                  <th className="py-2.5 px-3 font-bold border-r border-black text-center bg-slate-200">Total ER Cost</th>
                  <th className="py-2.5 px-3 font-black text-center bg-slate-300 text-black">Grand Remittance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-mono text-xs">
                {filteredEmployees.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-sans font-bold text-black border-r border-black">
                      <div>{e.first_name} {e.last_name}</div>
                      <div className="text-[10px] text-slate-500">{e.employee_code} • {e.department}</div>
                    </td>
                    <td className="py-2 px-3 text-center border-r border-black text-black">{fmt(e.basic_salary)}</td>
                    <td className="py-2 px-3 text-center border-r border-black">
                      <div className="font-bold text-black">{fmt(e.sss_breakdown?.ee_total)}</div>
                      <div className="text-[10px] text-slate-600">ER: {fmt(e.sss_breakdown?.er_total)}</div>
                    </td>
                    <td className="py-2 px-3 text-center border-r border-black">
                      <div className="font-bold text-black">{fmt(e.philhealth_breakdown?.ee_share)}</div>
                      <div className="text-[10px] text-slate-600">ER: {fmt(e.philhealth_breakdown?.er_share)}</div>
                    </td>
                    <td className="py-2 px-3 text-center border-r border-black">
                      <div className="font-bold text-black">{fmt(e.pagibig_breakdown?.ee_share)}</div>
                      <div className="text-[10px] text-slate-600">ER: {fmt(e.pagibig_breakdown?.er_share)}</div>
                    </td>
                    <td className="py-2 px-3 text-center border-r border-black font-bold text-black">{fmt(e.bir_tax)}</td>
                    <td className="py-2 px-3 text-center font-bold border-r border-black bg-slate-100 text-black">{fmt(e.total_ee_deductions)}</td>
                    <td className="py-2 px-3 text-center font-bold border-r border-black bg-slate-100 text-black">{fmt(e.total_er_burden)}</td>
                    <td className="py-2 px-3 text-center font-black bg-slate-200 text-black">{fmt(e.grand_total_remittance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-200 font-mono font-black text-black border-t-2 border-black text-xs">
                <tr>
                  <td className="py-2.5 px-3 font-sans uppercase text-center border-r border-black">GRAND TOTALS</td>
                  <td className="py-2 px-3 text-center border-r border-black">{fmt(filteredEmployees.reduce((s, e) => s + e.basic_salary, 0))}</td>
                  <td className="py-2 px-3 text-center border-r border-black">
                    <div>{fmt(filteredEmployees.reduce((s, e) => s + (e.sss_breakdown?.ee_total || 0), 0))}</div>
                    <div className="text-[10px]">ER: {fmt(filteredEmployees.reduce((s, e) => s + (e.sss_breakdown?.er_total || 0), 0))}</div>
                  </td>
                  <td className="py-2 px-3 text-center border-r border-black">
                    <div>{fmt(filteredEmployees.reduce((s, e) => s + (e.philhealth_breakdown?.ee_share || 0), 0))}</div>
                    <div className="text-[10px]">ER: {fmt(filteredEmployees.reduce((s, e) => s + (e.philhealth_breakdown?.er_share || 0), 0))}</div>
                  </td>
                  <td className="py-2 px-3 text-center border-r border-black">
                    <div>{fmt(filteredEmployees.reduce((s, e) => s + (e.pagibig_breakdown?.ee_share || 0), 0))}</div>
                    <div className="text-[10px]">ER: {fmt(filteredEmployees.reduce((s, e) => s + (e.pagibig_breakdown?.er_share || 0), 0))}</div>
                  </td>
                  <td className="py-2 px-3 text-center border-r border-black">{fmt(filteredEmployees.reduce((s, e) => s + (e.bir_tax || 0), 0))}</td>
                  <td className="py-2 px-3 text-center border-r border-black bg-slate-300">{fmt(filteredEmployees.reduce((s, e) => s + (e.total_ee_deductions || 0), 0))}</td>
                  <td className="py-2 px-3 text-center border-r border-black bg-slate-300">{fmt(filteredEmployees.reduce((s, e) => s + (e.total_er_burden || 0), 0))}</td>
                  <td className="py-2 px-3 text-center bg-slate-400 text-black">{fmt(filteredEmployees.reduce((s, e) => s + (e.grand_total_remittance || 0), 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          6. FULL 2025 SSS MASTER SCHEDULE TABLE (BOOK PAGE 252 TABLE)
         ═════════════════════════════════════════════════════════════════ */}
      {!isEmployee && activeTab === 'master_schedule' && (
        <div className="bg-white rounded-2xl border-2 border-black overflow-hidden shadow-sm">
          <div className="bg-white py-3 px-4 border-b-2 border-black text-center select-none">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-black">
              SCHEDULE OF SSS CONTRIBUTIONS (OFFICIAL STATUTORY TABLE)
            </h2>
            <div className="text-xs font-bold uppercase tracking-widest text-black">
              EFFECTIVE JANUARY 2025 (PAGE 252 REFERENCE)
            </div>
            <div className="text-[11px] text-slate-600 italic mt-0.5">
              Complete 61-Bracket Statutory Lookup Table for Social Security &amp; Mandatory Provident Fund
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="gov-table w-full text-left text-[11px] font-sans">
              <thead className="sticky top-0 z-10 bg-slate-100 text-black border-b-2 border-black">
                <tr className="border-b border-black">
                  <th rowSpan="2" className="py-2 px-3 font-bold border-r border-black align-middle text-center">Range of Compensation</th>
                  <th colSpan="3" className="py-1 px-2 font-bold text-center border-r border-black">MONTHLY SALARY CREDIT</th>
                  <th colSpan="8" className="py-1 px-2 font-bold text-center">AMOUNT OF CONTRIBUTIONS</th>
                </tr>
                <tr className="border-b-2 border-black">
                  <th className="py-1 px-2 text-center border-r border-black font-bold">SSS/EC</th>
                  <th className="py-1 px-2 text-center border-r border-black font-bold">MPF</th>
                  <th className="py-1 px-2 text-center border-r-2 border-black font-black">TOTAL</th>

                  <th className="py-1 px-2 text-center border-r border-black font-semibold">SS</th>
                  <th className="py-1 px-2 text-center border-r border-black font-semibold">MPF</th>
                  <th className="py-1 px-2 text-center border-r border-black font-semibold">EC</th>
                  <th className="py-1 px-2 text-center border-r-2 border-black font-black bg-slate-200">TOTAL ER</th>

                  <th className="py-1 px-2 text-center border-r border-black font-semibold">SS</th>
                  <th className="py-1 px-2 text-center border-r border-black font-semibold">MPF</th>
                  <th className="py-1 px-2 text-center border-r-2 border-black font-black bg-slate-200">TOTAL EE</th>

                  <th className="py-1 px-3 text-center font-black bg-slate-300 text-black">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-mono text-[11px]">
                {sssOfficialSchedule.map(b => (
                  <tr key={b.bracket_id} className="hover:bg-slate-50">
                    <td className="py-1 px-3 font-sans font-medium text-black border-r border-black">{b.range_label}</td>
                    <td className="py-1 px-2 text-center border-r border-black text-black">{b.msc_regular.toLocaleString()}</td>
                    <td className="py-1 px-2 text-center border-r border-black text-black">{b.msc_mpf > 0 ? b.msc_mpf.toLocaleString() : '-'}</td>
                    <td className="py-1 px-2 text-center font-bold border-r-2 border-black text-black">{b.msc_total.toLocaleString()}</td>

                    <td className="py-1 px-2 text-center border-r border-black text-black">{b.er_ss.toFixed(2)}</td>
                    <td className="py-1 px-2 text-center border-r border-black text-black">{b.er_mpf > 0 ? b.er_mpf.toFixed(2) : '-'}</td>
                    <td className="py-1 px-2 text-center border-r border-black text-black">{b.er_ec.toFixed(2)}</td>
                    <td className="py-1 px-2 text-center font-bold border-r-2 border-black bg-slate-100 text-black">{b.er_total.toFixed(2)}</td>

                    <td className="py-1 px-2 text-center border-r border-black text-black">{b.ee_ss.toFixed(2)}</td>
                    <td className="py-1 px-2 text-center border-r border-black text-black">{b.ee_mpf > 0 ? b.ee_mpf.toFixed(2) : '-'}</td>
                    <td className="py-1 px-2 text-center font-bold border-r-2 border-black bg-slate-100 text-black">{b.ee_total.toFixed(2)}</td>

                    <td className="py-1 px-3 text-center font-black bg-slate-200 text-black">{b.total_contribution.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL SIGNATURE BLOCKS (PRINT ONLY)
         ───────────────────────────────────────────────────────────── */}
      <div className="print-only hidden print:grid grid-cols-3 gap-6 pt-8 mt-8 border-t-2 border-black text-center text-xs font-sans">
        <div>
          <div className="border-b border-black pb-1 mb-1 font-bold">Liza Gomez</div>
          <div className="text-[10px] uppercase text-slate-600">Prepared By: HR Manager</div>
        </div>
        <div>
          <div className="border-b border-black pb-1 mb-1 font-bold">Payroll Officer</div>
          <div className="text-[10px] uppercase text-slate-600">Verified By: Payroll Department</div>
        </div>
        <div>
          <div className="border-b border-black pb-1 mb-1 font-bold">Jose Reyes</div>
          <div className="text-[10px] uppercase text-slate-600">Approved By: Finance Director</div>
        </div>
      </div>
    </div>
  );
}
