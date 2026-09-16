import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  Printer,
  Briefcase,
} from 'lucide-react';
import { api } from '../../services/api';
import BIR2316Modal from './BIR2316Modal';

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FinalPayModal({ employee, onClose, onOffboardSuccess }) {
  const [separationDate, setSeparationDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('Voluntary Resignation');
  const [unusedLeaves, setUnusedLeaves] = useState(employee?.leave_credits?.unused_leaves || 10);
  const [finalPay, setFinalPay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBIRModal, setShowBIRModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.body.classList.add('has-payroll-modal');
    return () => { document.body.classList.remove('has-payroll-modal'); };
  }, []);

  const loadCalculation = async () => {
    if (!employee) return;
    try {
      setLoading(true);
      const data = await api.getFinalPay(employee.id, {
        separation_date: separationDate,
        reason,
        unused_leave_days: unusedLeaves
      });
      setFinalPay(data);
    } catch (err) {
      console.error('Error computing final pay:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalculation();
  }, [separationDate, reason, unusedLeaves, employee]);

  const handleProcessOffboarding = async () => {
    if (!window.confirm(`Confirm separation and finalize backpay of ${fmt(finalPay?.net_final_pay)} for ${employee.first_name} ${employee.last_name}?`)) {
      return;
    }
    try {
      setIsProcessing(true);
      const res = await api.offboardEmployee(employee.id, {
        separation_date: separationDate,
        reason,
        unused_leave_days: unusedLeaves
      });
      setSuccessMessage(`Separation processed! Backpay of ${fmt(finalPay?.net_final_pay)} settled and official BIR Form 2316 generated.`);
      if (onOffboardSuccess) {
        onOffboardSuccess(res.offboarding_record);
      }
    } catch (err) {
      alert('Offboarding failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!employee) return null;

  const generatedAt = new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:static print:p-0 print:overflow-visible print:bg-white print:block">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 print:m-0 print:border-none print:shadow-none print:rounded-none print:max-w-none">

        {/* ──────────────────────────────────────────────────────── */}
        {/* SCREEN VIEW (Hidden on Print)                           */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="print:hidden">
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7c3aed] flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Offboarding & Final Pay (Backpay) Computation
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Philippine Labor Standards: P.D. 851 (13th Month), BIR RR 5-2011, and TRAIN Act Annual Tax Reconciliation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                onClick={() => setShowBIRModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm ml-3 shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View BIR Form 2316</span>
              </button>
            </div>
          )}

          <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Employee Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Employee</span>
                <div className="font-bold text-slate-800">{employee.first_name} {employee.last_name}</div>
                <div className="text-[10px] font-mono text-slate-500">{employee.employee_code}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Department / Role</span>
                <div className="font-semibold text-slate-700">{employee.department}</div>
                <div className="text-[10px] text-slate-500">{employee.position}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Base Salary</span>
                <div className="font-mono font-bold text-slate-900">{fmt(employee.base_salary)}</div>
                <div className="text-[10px] text-slate-400">Daily: {fmt(employee.base_salary / 22)} (22d basis)</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Date of Hire</span>
                <div className="font-medium text-slate-700">{employee.hire_date}</div>
                <div className="text-[10px] text-emerald-600 font-semibold">{employee.status}</div>
              </div>
            </div>

            {/* Separation Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Effective Separation Date</label>
                <input
                  type="date"
                  value={separationDate}
                  onChange={e => setSeparationDate(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-purple-600 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Separation Reason</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-purple-600 shadow-xs"
                >
                  <option value="Voluntary Resignation">Voluntary Resignation</option>
                  <option value="End of Employment Contract">End of Employment Contract</option>
                  <option value="Mutual Separation Agreement">Mutual Separation Agreement</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Authorized Separation / Redundancy">Authorized Separation / Redundancy</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Unused Leave Balance (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={unusedLeaves}
                  onChange={e => setUnusedLeaves(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full text-xs font-semibold text-slate-800 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-purple-600 shadow-xs"
                />
              </div>
            </div>

            {/* Final Pay Breakdown */}
            {finalPay && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Earnings & Entitlements */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-700 flex items-center justify-between border-b pb-2">
                      <span>Final Earnings & Entitlements</span>
                      <span>Amount (₱)</span>
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-700">
                        <div>
                          <div>Unpaid Regular Salary</div>
                          <div className="text-[10px] text-slate-400">Final cut-off pro-rated salary</div>
                        </div>
                        <span className="font-mono font-semibold">{fmt(finalPay.earnings.last_cutoff_salary)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                        <div>
                          <div className="font-bold text-emerald-950">Pro-Rated 13th-Month Pay (P.D. 851)</div>
                          <div className="text-[10px] text-emerald-700">
                            {finalPay.months_worked_in_year} months rendered in 2024 • 100% Tax-Exempt (₱90k Cap)
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-800">{fmt(finalPay.earnings.prorated_13th_month)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <div>
                          <div>Unused Leave Encashment (SIL)</div>
                          <div className="text-[10px] text-slate-400">
                            {finalPay.earnings.unused_leave_days} days × {fmt(finalPay.daily_rate)}/day
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            • {finalPay.earnings.exempt_leave_days} days Tax-Exempt De Minimis: {fmt(finalPay.earnings.exempt_leave_pay)}
                            {finalPay.earnings.taxable_leave_days > 0 && (
                              <span className="ml-1 text-amber-700 font-semibold">• {finalPay.earnings.taxable_leave_days} days Taxable: {fmt(finalPay.earnings.taxable_leave_pay)}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-mono font-semibold">{fmt(finalPay.earnings.total_leave_encashment)}</span>
                      </div>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-slate-900 text-sm">
                      <span>Total Gross Backpay:</span>
                      <span className="font-mono text-emerald-700">{fmt(finalPay.earnings.total_gross)}</span>
                    </div>
                  </div>

                  {/* Deductions & Tax Reconciliation */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-amber-700 flex items-center justify-between border-b pb-2">
                      <span>Deductions & Tax Reconciliation</span>
                      <span>Adjustment (₱)</span>
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-700">
                        <div>
                          <div className="font-semibold text-slate-800">Company Microloan Settlement</div>
                          <div className="text-[10px] text-slate-400">
                            {finalPay.deductions.active_loan_code
                              ? `Full balance settlement for ${finalPay.deductions.active_loan_code}`
                              : 'No active salary advance balances'}
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-rose-600">
                          {finalPay.deductions.outstanding_loan_balance > 0
                            ? `-${fmt(finalPay.deductions.outstanding_loan_balance)}`
                            : '₱0.00'}
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${
                        finalPay.tax_reconciliation.tax_difference >= 0
                          ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>⚖️ Annual Tax Reconciliation (TRAIN Act)</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                              <div>Cumulative Withheld: {fmt(finalPay.tax_reconciliation.cumulative_tax_withheld)}</div>
                              <div>Annualized Tax Due: {fmt(finalPay.tax_reconciliation.annual_tax_due)}</div>
                            </div>
                          </div>
                          <span className={`font-mono font-bold text-xs ${
                            finalPay.tax_reconciliation.tax_difference >= 0 ? 'text-blue-700' : 'text-rose-600'
                          }`}>
                            {finalPay.tax_reconciliation.tax_difference >= 0 ? '+' : '-'}
                            {fmt(finalPay.tax_reconciliation.adjustment_amount)}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] font-semibold text-slate-600">
                          {finalPay.tax_reconciliation.type}
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-slate-900 text-sm">
                      <span>Total Net Deductions:</span>
                      <span className="font-mono text-rose-600">-{fmt(finalPay.deductions.total_deductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Backpay Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-purple-700/20">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">
                      NET FINAL PAYABLE TO EMPLOYEE (BACKPAY)
                    </span>
                    <div className="text-3xl font-black tracking-tight mt-0.5">
                      {fmt(finalPay.net_final_pay)}
                    </div>
                    <div className="text-xs text-purple-200 mt-1 flex items-center gap-2">
                      <span>Direct Deposit via {employee.bank_name}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">{employee.bank_account}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowBIRModal(true)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 backdrop-blur-xs border border-white/20 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View BIR 2316</span>
                    </button>
                    <button
                      onClick={handleProcessOffboarding}
                      disabled={isProcessing || employee.status === 'Separated' || employee.status === 'Resigned'}
                      className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg ${
                        employee.status === 'Separated' || employee.status === 'Resigned'
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 cursor-pointer'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isProcessing ? 'Processing...' : employee.status === 'Separated' || employee.status === 'Resigned' ? 'Settlement Finalized' : 'Execute Offboarding & Disburse'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* FORMAL PRINT DOCUMENT (visible only during print/PDF)   */}
        {/* ──────────────────────────────────────────────────────── */}
        {finalPay && (
          <div className="hidden print:block w-full bg-white text-black font-sans text-[9px] leading-snug p-4">

            {/* Official Letterhead */}
            <div className="border-b-2 border-black pb-2 mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-slate-600">Republic of the Philippines</div>
                  <div className="text-sm font-black uppercase tracking-tight text-black">Microfinancial Management System, Inc.</div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wide mt-0.5">
                    Official Final Pay (Backpay) Computation & Separation Notice
                  </div>
                  <div className="text-[8px] text-slate-600 italic mt-0.5">
                    Pursuant to Philippine Labor Code Art. 113, P.D. 851 (13th Month), BIR RR 5-2011, and RA 10963 (TRAIN Act)
                  </div>
                </div>
                <div className="text-right text-[9px] font-mono space-y-0.5">
                  <div><span className="font-sans font-bold">DOCUMENT NO.:</span> <span className="font-bold">FP-{employee.employee_code}-{separationDate?.replace(/-/g,'')}</span></div>
                  <div><span className="font-sans font-bold">PRINTED:</span> {generatedAt}</div>
                  <div><span className="font-sans font-bold">EFFECTIVE DATE:</span> <span className="font-bold">{separationDate}</span></div>
                  <div><span className="font-sans font-bold">SEPARATION TYPE:</span> <span className="font-bold">{reason}</span></div>
                </div>
              </div>
            </div>

            {/* Employee & Employment Details */}
            <div className="grid grid-cols-3 gap-3 mb-3 border border-black p-2">
              <div className="space-y-1">
                <div className="font-bold uppercase text-[8px] border-b border-black/30 pb-0.5">Employee Information</div>
                <div><span className="font-bold">Full Name:</span> <span className="font-extrabold">{employee.first_name} {employee.last_name}</span></div>
                <div><span className="font-bold">Employee No.:</span> <span className="font-mono">{employee.employee_code}</span></div>
                <div><span className="font-bold">Department:</span> {employee.department}</div>
                <div><span className="font-bold">Position:</span> {employee.position}</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold uppercase text-[8px] border-b border-black/30 pb-0.5">Employment Record</div>
                <div><span className="font-bold">Date Hired:</span> {employee.hire_date}</div>
                <div><span className="font-bold">Effective Separation:</span> <span className="font-bold">{separationDate}</span></div>
                <div><span className="font-bold">Reason:</span> {reason}</div>
                <div><span className="font-bold">Monthly Salary:</span> <span className="font-mono">{fmt(employee.base_salary)}</span></div>
              </div>
              <div className="space-y-1">
                <div className="font-bold uppercase text-[8px] border-b border-black/30 pb-0.5">Bank Disbursement Details</div>
                <div><span className="font-bold">Bank:</span> {employee.bank_name}</div>
                <div><span className="font-bold">Account No.:</span> <span className="font-mono">{employee.bank_account}</span></div>
                <div><span className="font-bold">Daily Rate (22d):</span> <span className="font-mono">{fmt(finalPay.daily_rate)}</span></div>
                <div><span className="font-bold">Months Rendered:</span> {finalPay.months_worked_in_year} mos. (current year)</div>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Earnings */}
              <table className="formal-report-table w-full text-[9px]">
                <thead>
                  <tr>
                    <th colSpan="2" className="py-1 px-2 text-left bg-slate-100 font-black uppercase text-[8px] border-b-2 border-black">
                      Part I — Final Earnings & Statutory Entitlements
                    </th>
                  </tr>
                  <tr>
                    <th className="py-0.5 px-2 text-left font-bold">Description</th>
                    <th className="py-0.5 px-2 text-right font-bold">Amount (₱)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 px-2">
                      <div className="font-bold">Unpaid Regular Salary (Pro-Rated)</div>
                      <div className="text-[8px] text-slate-600">Final cut-off period salary</div>
                    </td>
                    <td className="py-1 px-2 text-right font-mono">{fmt(finalPay.earnings.last_cutoff_salary)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-2">
                      <div className="font-bold">Pro-Rated 13th-Month Pay (P.D. 851)</div>
                      <div className="text-[8px] text-slate-600">{finalPay.months_worked_in_year} months rendered • 100% Tax-Exempt (₱90,000 Cap)</div>
                    </td>
                    <td className="py-1 px-2 text-right font-mono">{fmt(finalPay.earnings.prorated_13th_month)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-2">
                      <div className="font-bold">Unused Leave Encashment / SIL</div>
                      <div className="text-[8px] text-slate-600">
                        {finalPay.earnings.unused_leave_days} days × {fmt(finalPay.daily_rate)}/day
                      </div>
                      <div className="text-[8px] text-slate-500">
                        Tax-Exempt ({finalPay.earnings.exempt_leave_days} days): {fmt(finalPay.earnings.exempt_leave_pay)}
                        {finalPay.earnings.taxable_leave_days > 0 && ` | Taxable (${finalPay.earnings.taxable_leave_days} days): ${fmt(finalPay.earnings.taxable_leave_pay)}`}
                      </div>
                    </td>
                    <td className="py-1 px-2 text-right font-mono">{fmt(finalPay.earnings.total_leave_encashment)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-black">
                    <td className="py-1 px-2 uppercase text-[8px]">TOTAL GROSS BACKPAY:</td>
                    <td className="py-1 px-2 text-right font-mono">{fmt(finalPay.earnings.total_gross)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Deductions */}
              <table className="formal-report-table w-full text-[9px]">
                <thead>
                  <tr>
                    <th colSpan="2" className="py-1 px-2 text-left bg-slate-100 font-black uppercase text-[8px] border-b-2 border-black">
                      Part II — Deductions & Annual Tax Reconciliation
                    </th>
                  </tr>
                  <tr>
                    <th className="py-0.5 px-2 text-left font-bold">Description</th>
                    <th className="py-0.5 px-2 text-right font-bold">Amount (₱)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 px-2">
                      <div className="font-bold">Company Microloan Settlement</div>
                      <div className="text-[8px] text-slate-600">
                        {finalPay.deductions.active_loan_code
                          ? `Full outstanding balance: ${finalPay.deductions.active_loan_code}`
                          : 'No active salary advance balances'}
                      </div>
                    </td>
                    <td className="py-1 px-2 text-right font-mono">
                      {finalPay.deductions.outstanding_loan_balance > 0
                        ? `-${fmt(finalPay.deductions.outstanding_loan_balance)}`
                        : '₱0.00'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 px-2">
                      <div className="font-bold">Annual Tax Reconciliation (TRAIN Act, RA 10963)</div>
                      <div className="text-[8px] text-slate-600">
                        Cumulative Withheld: {fmt(finalPay.tax_reconciliation.cumulative_tax_withheld)} | Annualized Due: {fmt(finalPay.tax_reconciliation.annual_tax_due)}
                      </div>
                      <div className="text-[8px] font-bold text-slate-700">{finalPay.tax_reconciliation.type}</div>
                    </td>
                    <td className="py-1 px-2 text-right font-mono">
                      {finalPay.tax_reconciliation.tax_difference >= 0 ? '+' : '-'}
                      {fmt(finalPay.tax_reconciliation.adjustment_amount)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-black">
                    <td className="py-1 px-2 uppercase text-[8px]">TOTAL NET DEDUCTIONS:</td>
                    <td className="py-1 px-2 text-right font-mono">-{fmt(finalPay.deductions.total_deductions)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Net Payable Summary */}
            <div className="border-2 border-black p-2 mb-3 bg-slate-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-slate-700">Net Final Pay Payable to Employee (Backpay)</div>
                  <div className="text-base font-black tracking-tight text-black">{fmt(finalPay.net_final_pay)}</div>
                  <div className="text-[8px] text-slate-600">Via Electronic Direct Deposit • {employee.bank_name} • Acct: {employee.bank_account}</div>
                </div>
                <div className="text-right text-[9px] space-y-0.5 font-mono">
                  <div>Gross Backpay: {fmt(finalPay.earnings.total_gross)}</div>
                  <div>Less Deductions: -{fmt(finalPay.deductions.total_deductions)}</div>
                  <div className="font-black border-t border-black pt-0.5">NET PAYABLE: {fmt(finalPay.net_final_pay)}</div>
                </div>
              </div>
            </div>

            {/* Certification & Signatures */}
            <div className="pt-2 border-t-2 border-black" style={{ pageBreakInside: 'avoid' }}>
              <div className="text-[8px] text-slate-700 italic mb-3 leading-relaxed text-justify">
                <strong>OFFICIAL CERTIFICATION:</strong> I hereby certify, under penalties of perjury, that this Final Pay Computation contains a true, accurate, and complete record of all monetary obligations of the company to the above-named separated employee, computed in strict compliance with the Philippine Labor Code, Presidential Decree No. 851 (13th Month Pay Law), BIR Revenue Regulations No. 5-2011, and the provisions of Republic Act No. 10963 (TRAIN Law). The net amount stated herein shall be released within thirty (30) days from the effective date of separation pursuant to DOLE Department Order No. 147-15.
              </div>
              <div className="grid grid-cols-3 gap-6 text-center text-[9px]">
                <div>
                  <div className="border-b border-black pb-1 mb-0.5 font-bold text-[11px]">{employee.first_name} {employee.last_name}</div>
                  <div className="text-[8px] uppercase font-bold text-slate-700">Received & Acknowledged By</div>
                  <div className="text-[8px] text-slate-500">{employee.employee_code} • {employee.position}</div>
                  <div className="text-[7.5px] text-slate-400 mt-1">Date: ____________________</div>
                </div>
                <div>
                  <div className="border-b border-black pb-1 mb-0.5 font-bold text-[11px]">MARCUS CHEN</div>
                  <div className="text-[8px] uppercase font-bold text-slate-700">Computed & Prepared By</div>
                  <div className="text-[8px] text-slate-500">Payroll Specialist</div>
                  <div className="text-[7.5px] text-slate-400 mt-1">Date: ____________________</div>
                </div>
                <div>
                  <div className="border-b border-black pb-1 mb-0.5 font-bold text-[11px]">DIANA STERLING</div>
                  <div className="text-[8px] uppercase font-bold text-slate-700">Approved for Disbursement</div>
                  <div className="text-[8px] text-slate-500">Finance Director / Comptroller</div>
                  <div className="text-[7.5px] text-slate-400 mt-1">Date: ____________________</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded BIR Form 2316 Certificate Modal */}
      {showBIRModal && (
        <BIR2316Modal
          employeeId={employee.id}
          onClose={() => setShowBIRModal(false)}
        />
      )}
    </div>
  );
}
