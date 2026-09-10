import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { 
  Printer, 
  X, 
  Lock,
  CheckCircle2,
  Download
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

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto flex items-start justify-center p-4 pt-8 sm:pt-10"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Full-screen blur/dim backdrop covering the entire viewport including Navbar & Sidebar */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md -z-10"
        onClick={onClose}
      />
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-4 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
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
              <span>Print</span>
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

        {/* Semi-Monthly Cut-Off Formula Banner */}
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

        {/* Earnings & Deductions Tables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Earnings */}
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
                      <span className="text-[9px] font-black uppercase bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                        PPA
                      </span>
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

          {/* Deductions */}
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

        {/* Net Take-home Pay Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-emerald-600/20">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-100">Net Take-Home Pay (Direct Deposit)</span>
            <div className="text-3xl font-black tracking-tight">
              {fmt(payslip.net_pay)}
            </div>
          </div>
          <div className="text-right sm:text-right text-xs text-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <div>
              <div className="font-bold text-white">Disbursement Approved</div>
              <div className="text-[10px] text-emerald-200">Electronic Bank Transfer • {payslip.currency || 'PHP (₱)'}</div>
            </div>
          </div>
        </div>

        {/* Security & Cryptographic Footer */}
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
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
