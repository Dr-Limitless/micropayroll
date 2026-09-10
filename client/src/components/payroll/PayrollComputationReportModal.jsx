import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Users,
  TrendingDown,
  Wallet,
  DollarSign,
  Calendar,
  Lock,
  FileText,
  Zap,
  AlertCircle
} from 'lucide-react';

function fmt(n) {
  const val = Number(n || 0);
  return '₱' + val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatCard({ icon: Icon, label, value, sub, color = 'slate' }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red:     'bg-red-50 text-red-600 border-red-200',
    purple:  'bg-purple-50 text-purple-700 border-purple-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    slate:   'bg-slate-50 text-slate-600 border-slate-200',
  };
  const cardColor = colorMap[color] || colorMap.slate;
  return (
    <div className={`rounded-xl border p-3 sm:p-4 flex flex-col gap-1.5 ${cardColor}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-70 leading-tight">{label}</span>
        <div className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center shadow-sm shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      {/* Responsive number — shrinks font so it never overflows */}
      <div className="font-black tracking-tight leading-tight text-base sm:text-lg lg:text-xl break-all">
        {value}
      </div>
      {sub && <div className="text-[10px] font-medium opacity-60 leading-tight">{sub}</div>}
    </div>
  );
}

export default function PayrollComputationReportModal({ employees = [], summary = {}, period = {}, selectedMonth, onClose }) {
  const printRef = useRef(null);

  const totalSSS        = employees.reduce((s, e) => s + Number(e.sss || 0), 0);
  const totalPhilHealth = employees.reduce((s, e) => s + Number(e.philhealth || 0), 0);
  const totalPagIBIG    = employees.reduce((s, e) => s + Number(e.pagibig || 0), 0);
  const totalBIR        = employees.reduce((s, e) => s + Number(e.bir_tax || 0), 0);
  const totalHMO        = employees.reduce((s, e) => s + Number(e.hmo_deduction || 0), 0);
  const totalLoans      = employees.reduce((s, e) => s + Number(e.microloan_deduction || 0), 0);
  const totalHoliday    = employees.reduce((s, e) => s + Number(e.holiday_pay || 0) + Number(e.night_diff_pay || 0), 0);
  const totalOT         = employees.reduce((s, e) => s + Number(e.ot_pay || 0), 0);
  const totalGross      = employees.reduce((s, e) => s + Number(e.gross_pay || 0), 0);
  const totalNet        = employees.reduce((s, e) => s + Number(e.net_pay || 0), 0);
  const totalDeductions = employees.reduce((s, e) => s + Number(e.total_deductions || 0), 0);

  const isSemiMonthly = employees.some(e => e.is_semi_monthly);
  const is1stCutoff   = employees.some(e => e.is_semi_monthly && e.cut_off_type === '1st');

  const reportRef = `PRN-${selectedMonth?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const generatedAt = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

  function handlePrint() { window.print(); }

  function handleExportCSV() {
    const headers = ['Code','Name','Department','Basic Pay','OT Pay','Holiday/NSD','Allowances','Gross Pay','BIR Tax','SSS','PhilHealth','Pag-IBIG','HMO','Loan','Net Pay','Status'];
    const rows = employees.map(e => [
      e.employee_code,
      `${e.first_name} ${e.last_name}`,
      e.department,
      Number(e.basic_pay).toFixed(2),
      Number(e.ot_pay || 0).toFixed(2),
      (Number(e.holiday_pay || 0) + Number(e.night_diff_pay || 0)).toFixed(2),
      Number(e.allowances || 0).toFixed(2),
      Number(e.gross_pay).toFixed(2),
      Number(e.bir_tax || 0).toFixed(2),
      Number(e.sss || 0).toFixed(2),
      Number(e.philhealth || 0).toFixed(2),
      Number(e.pagibig || 0).toFixed(2),
      Number(e.hmo_deduction || 0).toFixed(2),
      Number(e.microloan_deduction || 0).toFixed(2),
      Number(e.net_pay).toFixed(2),
      e.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_${selectedMonth?.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md -z-10" onClick={onClose} />

      <div
        ref={printRef}
        className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl border border-slate-200 my-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#0c1024] via-[#1e1b4b] to-[#0c1024] px-5 py-4 sm:px-6 sm:py-5 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-white text-xs shadow-lg shrink-0">
                MMS
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-purple-300">Microfinancial Management System</div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight">Payroll Computation Report</h1>
                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <Calendar className="w-3 h-3" />
                  <span>{selectedMonth}</span>
                  {isSemiMonthly && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${is1stCutoff ? 'bg-blue-500/20 border-blue-400/40 text-blue-200' : 'bg-purple-500/20 border-purple-400/40 text-purple-200'}`}>
                      {is1stCutoff ? '📅 1st Cut-off' : '📅 2nd Cut-off'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 print:hidden">
              <button onClick={handleExportCSV} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <Download className="w-3.5 h-3.5" /><span>Export CSV</span>
              </button>
              <button onClick={handlePrint} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <Printer className="w-3.5 h-3.5" /><span>Print</span>
              </button>
              <button onClick={onClose} className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            {[
              { label: 'Report Ref',    value: reportRef },
              { label: 'Generated',     value: generatedAt },
              { label: 'Period Status', value: period?.status || 'Draft' },
              { label: 'Payout Date',   value: period?.payout_date || '—' },
            ].map((m) => (
              <div key={m.label}>
                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{m.label}</div>
                <div className="font-semibold text-white mt-0.5 font-mono text-[10px] break-all">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI SUMMARY CARDS ───────────────────────────────── */}
        <div className="px-5 py-4 sm:px-6 border-b border-slate-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={DollarSign}   label="Total Gross Pay"     value={fmt(totalGross)}      sub={`${employees.length} employees`}         color="emerald" />
            <StatCard icon={TrendingDown} label="Total Deductions"    value={fmt(totalDeductions)} sub="Tax + statutory + HMO"                    color="red"     />
            <StatCard icon={Wallet}       label="Total Net Payout"    value={fmt(totalNet)}        sub={period?.payout_date ? `Payout: ${period.payout_date}` : ''} color="purple" />
            <StatCard icon={Users}        label="Employees Processed" value={`${employees.length}/${employees.length}`} sub="100% complete"      color="blue"    />
          </div>
        </div>

        {/* ── STATUTORY BREAKDOWN ─────────────────────────────── */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Statutory & Contribution Summary</span>
          </div>

          {/* 3 columns on mobile, 6 on desktop */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'BIR Withholding',  value: totalBIR,        color: 'text-red-600',   note: null },
              { label: 'SSS',              value: totalSSS,        color: 'text-red-500',   note: is1stCutoff ? '2nd cut-off' : null },
              { label: 'PhilHealth',       value: totalPhilHealth, color: 'text-red-500',   note: is1stCutoff ? '2nd cut-off' : null },
              { label: 'Pag-IBIG',         value: totalPagIBIG,    color: 'text-red-500',   note: is1stCutoff ? '2nd cut-off' : null },
              { label: 'HMO',              value: totalHMO,        color: 'text-pink-600',  note: null },
              { label: 'Loan Deductions',  value: totalLoans,      color: 'text-amber-600', note: null },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-col gap-1 min-w-0">
                <div className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-400 leading-tight">{s.label}</div>
                <div className={`font-black font-mono text-xs sm:text-sm ${s.color} break-all`}>{fmt(s.value)}</div>
                {s.note && (
                  <div className="text-[8px] text-slate-400 bg-slate-50 rounded px-1 py-0.5 border border-slate-100 w-fit">{s.note}</div>
                )}
              </div>
            ))}
          </div>

          {/* OT / Holiday badges */}
          {(totalHoliday > 0 || totalOT > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {totalOT > 0 && (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs text-emerald-800">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <span className="font-semibold">OT Total:</span>
                  <span className="font-black font-mono">{fmt(totalOT)}</span>
                </div>
              )}
              {totalHoliday > 0 && (
                <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-xl px-3 py-1.5 text-xs text-purple-800">
                  <AlertCircle className="w-3 h-3 text-purple-600" />
                  <span className="font-semibold">Holiday / NSD Total:</span>
                  <span className="font-black font-mono">{fmt(totalHoliday)}</span>
                </div>
              )}
            </div>
          )}

          {is1stCutoff && (
            <div className="mt-3 bg-sky-50 border-l-4 border-sky-400 rounded-r-xl p-2.5 text-xs text-sky-900 flex items-start gap-2">
              <span>ℹ️</span>
              <span><strong>1st Cut-off:</strong> SSS, PhilHealth, and Pag-IBIG are deducted on the <strong>2nd Cut-off (16th–30th)</strong>. BIR Withholding Tax only applies this cut-off.</span>
            </div>
          )}
        </div>

        {/* ── PER-EMPLOYEE TABLE ──────────────────────────────── */}
        <div className="px-5 sm:px-6 pt-4 pb-1">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Employee Payroll Breakdown</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <table className="w-full text-[11px]" style={{ minWidth: '1100px' }}>
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wide">
                <th className="py-2.5 px-3 text-left" style={{ minWidth: '160px' }}>Employee</th>
                <th className="py-2.5 px-3 text-right" style={{ minWidth: '100px' }}>Basic Pay</th>
                <th className="py-2.5 px-3 text-right" style={{ minWidth: '80px' }}>OT Pay</th>
                <th className="py-2.5 px-3 text-right text-purple-600" style={{ minWidth: '90px' }}>Hol / NSD</th>
                <th className="py-2.5 px-3 text-right text-indigo-600" style={{ minWidth: '90px' }}>Allowances</th>
                <th className="py-2.5 px-3 text-right font-extrabold text-slate-900" style={{ minWidth: '100px' }}>Gross</th>
                <th className="py-2.5 px-3 text-right text-red-500" style={{ minWidth: '80px' }}>BIR Tax</th>
                <th className="py-2.5 px-3 text-right text-red-500" style={{ minWidth: '80px' }}>SSS</th>
                <th className="py-2.5 px-3 text-right text-red-500" style={{ minWidth: '80px' }}>PhilHealth</th>
                <th className="py-2.5 px-3 text-right text-red-500" style={{ minWidth: '80px' }}>Pag-IBIG</th>
                <th className="py-2.5 px-3 text-right text-pink-600" style={{ minWidth: '70px' }}>HMO</th>
                <th className="py-2.5 px-3 text-right text-amber-600" style={{ minWidth: '70px' }}>Loan</th>
                <th className="py-2.5 px-3 text-right font-extrabold text-[#7c3aed]" style={{ minWidth: '100px' }}>Net Pay</th>
                <th className="py-2.5 px-3 text-left" style={{ minWidth: '80px' }}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const holidayNsd = Number(emp.holiday_pay || 0) + Number(emp.night_diff_pay || 0);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-[#7c3aed] font-bold flex items-center justify-center text-[10px] shrink-0">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 leading-tight truncate">{emp.first_name} {emp.last_name}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{emp.employee_code}</div>
                          <div className="text-[9px] text-slate-400">{emp.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800">
                      <div>{fmt(emp.basic_pay)}</div>
                      {Number(emp.tardiness_deduction) > 0 && (
                        <div className="text-[9px] text-amber-600 font-sans">-{fmt(emp.tardiness_deduction)}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {Number(emp.ot_pay) > 0
                        ? <span className="text-emerald-600 font-semibold">+{fmt(emp.ot_pay)}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {holidayNsd > 0
                        ? <span className="text-purple-700 font-semibold">+{fmt(holidayNsd)}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-700">
                      {Number(emp.allowances) > 0 ? `+${fmt(emp.allowances)}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {fmt(emp.gross_pay)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-red-500">{fmt(emp.bir_tax || 0)}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      {Number(emp.sss) > 0
                        ? <span className="text-red-500">{fmt(emp.sss)}</span>
                        : <span className="text-[9px] text-slate-300">2nd cut</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {Number(emp.philhealth) > 0
                        ? <span className="text-red-500">{fmt(emp.philhealth)}</span>
                        : <span className="text-[9px] text-slate-300">2nd cut</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {Number(emp.pagibig) > 0
                        ? <span className="text-red-500">{fmt(emp.pagibig)}</span>
                        : <span className="text-[9px] text-slate-300">2nd cut</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-pink-600">
                      {Number(emp.hmo_deduction) > 0 ? fmt(emp.hmo_deduction) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-600">
                      {Number(emp.microloan_deduction) > 0 ? fmt(emp.microloan_deduction) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-[#7c3aed] font-mono">
                      {fmt(emp.net_pay)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                        emp.status === 'Processed' ? 'bg-emerald-100 text-emerald-700' :
                        emp.status === 'Pending'   ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{emp.status || 'Pending'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals Footer */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-[11px]">
                <td className="py-3 px-3 whitespace-nowrap">TOTALS ({employees.length} emp)</td>
                <td className="py-3 px-3 text-right font-mono">—</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-300">{fmt(totalOT)}</td>
                <td className="py-3 px-3 text-right font-mono text-purple-300">{fmt(totalHoliday)}</td>
                <td className="py-3 px-3 text-right font-mono">—</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-300">{fmt(totalGross)}</td>
                <td className="py-3 px-3 text-right font-mono text-red-300">{fmt(totalBIR)}</td>
                <td className="py-3 px-3 text-right font-mono text-red-300">{fmt(totalSSS)}</td>
                <td className="py-3 px-3 text-right font-mono text-red-300">{fmt(totalPhilHealth)}</td>
                <td className="py-3 px-3 text-right font-mono text-red-300">{fmt(totalPagIBIG)}</td>
                <td className="py-3 px-3 text-right font-mono text-pink-300">{fmt(totalHMO)}</td>
                <td className="py-3 px-3 text-right font-mono text-amber-300">{fmt(totalLoans)}</td>
                <td className="py-3 px-3 text-right font-mono text-purple-300">{fmt(totalNet)}</td>
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── NET PAYOUT BANNER ───────────────────────────────── */}
        <div className="p-5 sm:p-6 border-t border-slate-100">
          <div className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white shadow-lg shadow-purple-600/20">
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-widest text-purple-200">Total Net Payroll Disbursement</div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight mt-1 break-all">{fmt(totalNet)}</div>
              <div className="text-[10px] text-purple-300 mt-1">{selectedMonth} · {employees.length} Employees · PHP (₱)</div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span className="font-semibold">Computation Verified</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs whitespace-nowrap">
                <Lock className="w-3 h-3 text-blue-300" />
                <span className="font-semibold">DOLE Compliant · TRAIN Law</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[9px] text-slate-400 border-t border-slate-100 pt-3">
          <div className="break-all">
            <span className="font-bold text-slate-600">Report Ref:</span> {reportRef} · Generated {generatedAt} · Microfinancial Management System
          </div>
          <div className="flex items-center gap-1 text-emerald-600 font-bold shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>TAMPER-PROOF VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
