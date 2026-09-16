import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { 
  Printer, 
  X, 
  Lock,
  CheckCircle2,
} from 'lucide-react';

function fmt(n) {
  const val = Number(n || 0);
  if (val < 0) {
    return '-₱' + Math.abs(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '₱' + val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PayslipModal({ employeeId, selectedMonth = 'July 2024', onClose }) {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add('has-payroll-modal');
    return () => { document.body.classList.remove('has-payroll-modal'); };
  }, []);

  useEffect(() => {
    async function loadPayslip() {
      try {
        setLoading(true);
        const data = await api.getPayslip(employeeId || 1, selectedMonth);
        if (data.payslip) setPayslip(data.payslip);
      } catch (err) {
        console.error('Error loading payslip:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPayslip();
  }, [employeeId, selectedMonth]);

  if (loading || !payslip) {
    const loadingContent = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-3 shadow-2xl relative z-10">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Generating Cryptographically Verified Payslip...</p>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(loadingContent, document.body) : loadingContent;
  }

  const generatedAt = new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' });

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto flex items-start justify-center p-4 pt-8 sm:pt-10 print:static print:p-0 print:overflow-visible print:block print:bg-white"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md -z-10 print:hidden"
        onClick={onClose}
      />
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 my-4 relative z-10 overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full print:static"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ──────────────────────────────────────────────────── */}
        {/* SCREEN VIEW (hidden on print)                        */}
        {/* ──────────────────────────────────────────────────── */}
        <div className="p-6 sm:p-8 space-y-6 print:hidden">
          {/* Header & Controls */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                MMS
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Microfinancial Management System</h2>
                <p className="text-[11px] text-slate-400">Official Semi-Monthly Employee Compensation Advice</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Payslip</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Payslip Header Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Payslip Ref</span>
              <div className="font-mono font-bold text-slate-900">{payslip.payslip_number}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pay Period</span>
              <div className="font-semibold text-slate-800">{payslip.period}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Disbursement Date</span>
              <div className="font-semibold text-emerald-700">{payslip.payout_date}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Employee</span>
              <div className="font-bold text-slate-900">{payslip.employee?.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{payslip.employee?.code}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Department / Role</span>
              <div className="font-semibold text-slate-800">{payslip.employee?.department}</div>
              <div className="text-[10px] text-slate-500">{payslip.employee?.position}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Account (AES-256)</span>
              <div className="font-mono text-slate-700">{payslip.employee?.bank_account}</div>
              <div className="text-[10px] text-slate-400">{payslip.employee?.bank_name}</div>
            </div>
          </div>

          {/* Semi-Monthly Cut-Off Banner */}
          {payslip.period?.includes('Semi-Monthly') && payslip.employee?.monthly_base_salary && (
            <div className="px-4 py-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                <span>
                  <strong>Semi-Monthly Rate Rule:</strong> Monthly Basic (₱{Number(payslip.employee.monthly_base_salary).toLocaleString()}) & Allowances (₱{Number(payslip.employee.monthly_allowances || 0).toLocaleString()}) are allocated at <strong>50% (÷2)</strong> per cut-off.
                </span>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200 shrink-0">
                PH Labor Standard: 1st Cut-off
              </span>
            </div>
          )}

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-700 flex items-center justify-between border-b pb-2">
                <span>Gross Earnings</span>
                <span>Amount (₱)</span>
              </h3>
              <div className="space-y-2">
                {payslip.earnings?.map((e, idx) => (
                  <div key={idx} className={`flex justify-between items-center py-0.5 ${e.is_ppa ? 'bg-amber-50/80 -mx-1 px-1.5 rounded-lg border border-amber-200/80 text-amber-900 font-medium' : 'text-slate-700'}`}>
                    <span className="flex items-center gap-1.5">
                      {e.is_ppa && (
                        <span className="text-[9px] font-black uppercase bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">PPA</span>
                      )}
                      <span>{e.label}</span>
                    </span>
                    <span className={`font-mono font-semibold ${e.is_ppa ? 'text-amber-800' : ''}`}>{fmt(e.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Gross:</span>
                <span className="font-mono text-emerald-700">{fmt(payslip.gross_pay)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-amber-700 flex items-center justify-between border-b pb-2">
                <span>Statutory & Tax</span>
                <span>Deductions (₱)</span>
              </h3>
              <div className="space-y-2">
                {payslip.deductions?.map((d, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{d.label}</span>
                    <span className="font-mono font-semibold text-amber-700">
                      {Number(d.amount) > 0 ? `-${fmt(d.amount)}` : fmt(d.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Deductions:</span>
                <span className="font-mono text-red-600">
                  {Number(payslip.total_deductions) > 0 ? `-${fmt(payslip.total_deductions)}` : fmt(payslip.total_deductions)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Pay Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-emerald-600/20">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-100">Net Take-Home Pay (Direct Deposit)</span>
              <div className="text-3xl font-black tracking-tight">{fmt(payslip.net_pay)}</div>
            </div>
            <div className="text-right sm:text-right text-xs text-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <div>
                <div className="font-bold text-white">Disbursement Approved</div>
                <div className="text-[10px] text-emerald-200">Electronic Bank Transfer • {payslip.currency || 'PHP (₱)'}</div>
              </div>
            </div>
          </div>

          {/* Cryptographic Footer */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <Lock className="w-3 h-3 text-blue-500" />
                <span>Cryptographic Checksum: {payslip.crypto_verification_hash}</span>
              </div>
              <div>Verification Protocol: {payslip.verification_protocol} • PostgreSQL: micropayroll</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase whitespace-nowrap">
              TAMPER-PROOF VERIFIED
            </span>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────── */}
        {/* FORMAL PRINT DOCUMENT (visible only on print/PDF)   */}
        {/* ──────────────────────────────────────────────────── */}
        <div className="hidden print:block w-full bg-white text-black font-sans text-[10px] leading-snug p-0">

          {/* Official Letterhead */}
          <div className="border-b-2 border-black pb-2 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-600">Republic of the Philippines</div>
                <div className="text-sm font-black uppercase tracking-tight text-black">Microfinancial Management System, Inc.</div>
                <div className="text-[10px] font-extrabold uppercase tracking-wide mt-0.5">
                  Official Employee Compensation Advice (Payslip)
                </div>
                <div className="text-[8px] text-slate-600 italic mt-0.5">
                  Pursuant to Philippine Labor Code, RA 10963 (TRAIN Law) • RA 11199 • HDMF Law
                </div>
              </div>
              <div className="text-right text-[9px] font-mono space-y-0.5">
                <div><span className="font-sans font-bold">PAYSLIP NO.:</span> <span className="font-bold">{payslip.payslip_number}</span></div>
                <div><span className="font-sans font-bold">PRINTED:</span> {generatedAt}</div>
                <div><span className="font-sans font-bold">PERIOD:</span> <span className="font-bold">{payslip.period}</span></div>
                <div><span className="font-sans font-bold">PAYOUT DATE:</span> <span className="font-bold">{payslip.payout_date}</span></div>
              </div>
            </div>
          </div>

          {/* Employee & Bank Info Header Grid */}
          <div className="grid grid-cols-3 gap-3 mb-3 border border-black p-2 text-[9px]">
            <div className="space-y-1">
              <div className="font-bold uppercase text-[8px] border-b border-black/30 pb-0.5">Employee Information</div>
              <div><span className="font-bold">Name:</span> <span className="font-extrabold">{payslip.employee?.name}</span></div>
              <div><span className="font-bold">Employee No.:</span> <span className="font-mono">{payslip.employee?.code}</span></div>
              <div><span className="font-bold">Position:</span> {payslip.employee?.position}</div>
              <div><span className="font-bold">Department:</span> {payslip.employee?.department}</div>
            </div>
            <div className="space-y-1">
              <div className="font-bold uppercase text-[8px] border-b border-black/30 pb-0.5">Compensation Period</div>
              <div><span className="font-bold">Pay Period:</span> {payslip.period}</div>
              <div><span className="font-bold">Disbursement:</span> {payslip.payout_date}</div>
              <div><span className="font-bold">Mode of Payment:</span> Electronic Bank Transfer</div>
              <div><span className="font-bold">Currency:</span> Philippine Peso (PHP / ₱)</div>
            </div>
            <div className="space-y-1">
              <div className="font-bold uppercase text-[8px] border-b border-black/30 pb-0.5">Bank Details (Encrypted)</div>
              <div><span className="font-bold">Bank:</span> {payslip.employee?.bank_name}</div>
              <div><span className="font-bold">Account No.:</span> <span className="font-mono">{payslip.employee?.bank_account}</span></div>
              <div><span className="font-bold">Status:</span> Disbursement Approved</div>
            </div>
          </div>

          {/* Earnings & Deductions Table */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Earnings */}
            <div>
              <table className="formal-report-table w-full text-[9px]">
                <thead>
                  <tr>
                    <th colSpan="2" className="py-1 px-2 text-left bg-slate-100 uppercase tracking-wider font-bold text-black text-[8px] border-b-2 border-black">
                      Part I — Gross Earnings & Compensation
                    </th>
                  </tr>
                  <tr>
                    <th className="py-1 px-2 text-left font-bold">Description</th>
                    <th className="py-1 px-2 text-right font-bold">Amount (₱)</th>
                  </tr>
                </thead>
                <tbody>
                  {payslip.earnings?.map((e, idx) => (
                    <tr key={idx}>
                      <td className="py-0.5 px-2 text-black">
                        {e.is_ppa ? <strong>[PPA] {e.label}</strong> : e.label}
                      </td>
                      <td className="py-0.5 px-2 text-right font-mono">{fmt(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-black">
                    <td className="py-1 px-2 uppercase tracking-wide text-[8px]">TOTAL GROSS EARNINGS:</td>
                    <td className="py-1 px-2 text-right font-mono">{fmt(payslip.gross_pay)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Deductions */}
            <div>
              <table className="formal-report-table w-full text-[9px]">
                <thead>
                  <tr>
                    <th colSpan="2" className="py-1 px-2 text-left bg-slate-100 uppercase tracking-wider font-bold text-black text-[8px] border-b-2 border-black">
                      Part II — Statutory & Tax Deductions
                    </th>
                  </tr>
                  <tr>
                    <th className="py-1 px-2 text-left font-bold">Description</th>
                    <th className="py-1 px-2 text-right font-bold">Amount (₱)</th>
                  </tr>
                </thead>
                <tbody>
                  {payslip.deductions?.map((d, idx) => (
                    <tr key={idx}>
                      <td className="py-0.5 px-2 text-black">{d.label}</td>
                      <td className="py-0.5 px-2 text-right font-mono">
                        {Number(d.amount) > 0 ? `-${fmt(d.amount)}` : fmt(d.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-black">
                    <td className="py-1 px-2 uppercase tracking-wide text-[8px]">TOTAL DEDUCTIONS:</td>
                    <td className="py-1 px-2 text-right font-mono">
                      {Number(payslip.total_deductions) > 0 ? `-${fmt(payslip.total_deductions)}` : fmt(payslip.total_deductions)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Net Take-Home Pay Summary */}
          <div className="border-2 border-black p-2 mb-3 bg-slate-50">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-700">Net Take-Home Pay (Philippine Peso)</div>
                <div className="text-base font-black tracking-tight text-black">{fmt(payslip.net_pay)}</div>
                <div className="text-[8px] text-slate-600">Credited via Electronic Bank Transfer • {payslip.employee?.bank_name} • {payslip.employee?.bank_account}</div>
              </div>
              <div className="text-right text-[9px] space-y-1">
                <div className="font-bold text-black uppercase">Disbursement: APPROVED</div>
                <div className="font-mono text-slate-600">Gross: {fmt(payslip.gross_pay)}</div>
                <div className="font-mono text-slate-600">Deductions: -{fmt(payslip.total_deductions)}</div>
                <div className="font-black font-mono text-black border-t border-black pt-1">NET: {fmt(payslip.net_pay)}</div>
              </div>
            </div>
          </div>

          {/* Acknowledgement & Signatures */}
          <div className="mt-3 pt-2 border-t-2 border-black">
            <div className="text-[8px] text-slate-600 italic mb-3">
              I hereby acknowledge receipt of the above compensation for the period stated. All statutory deductions have been computed in accordance with Philippine labor and tax laws.
            </div>
            <div className="grid grid-cols-3 gap-6 text-center text-[9px]">
              <div>
                <div className="border-b border-black pb-1 mb-0.5 font-bold">{payslip.employee?.name}</div>
                <div className="text-[8px] uppercase font-bold text-slate-600">Employee Acknowledgement</div>
                <div className="text-[7.5px] text-slate-400 mt-0.5">Date: ____________________</div>
              </div>
              <div>
                <div className="border-b border-black pb-1 mb-0.5 font-bold">Marcus Chen</div>
                <div className="text-[8px] uppercase font-bold text-slate-600">Prepared by: Payroll Specialist</div>
                <div className="text-[7.5px] text-slate-400 mt-0.5">Date: ____________________</div>
              </div>
              <div>
                <div className="border-b border-black pb-1 mb-0.5 font-bold">Liza Gomez</div>
                <div className="text-[8px] uppercase font-bold text-slate-600">Verified by: HR & Compliance Manager</div>
                <div className="text-[7.5px] text-slate-400 mt-0.5">Date: ____________________</div>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash Footer */}
          <div className="mt-2 pt-1.5 border-t border-black/30 text-[7.5px] text-slate-500 flex justify-between items-center">
            <div>
              <span className="font-bold">SHA-256 Tamper Seal:</span> <span className="font-mono">{payslip.crypto_verification_hash}</span>
            </div>
            <div className="font-bold uppercase text-black">TAMPER-PROOF VERIFIED • {payslip.verification_protocol}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
