import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Lock, 
  FileText, 
  Building2, 
  UserCheck, 
  QrCode,
  Download
} from 'lucide-react';
import { api } from '../../services/api';

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BIR2316Modal({ employeeId, onClose }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getBIR2316(employeeId);
        setCert(data);
      } catch (err) {
        console.error('Error fetching BIR 2316 data:', err);
      } finally {
        setLoading(false);
      }
    }
    if (employeeId) load();
  }, [employeeId]);

  if (!employeeId) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-w-none">
        
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
              BIR
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Official BIR Form No. 2316 Preview</div>
              <div className="text-[11px] text-slate-500">Certificate of Compensation Payment / Tax Withheld</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form 2316</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading || !cert ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading official certificate data...</div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6 text-slate-900 print:p-0">
            {/* BIR Form Header */}
            <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-600">
                Republic of the Philippines • Department of Finance • Bureau of Internal Revenue
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                Certificate of Compensation Payment / Tax Withheld
              </h1>
              <div className="text-xs font-bold text-slate-700">
                BIR Form No. 2316 • Revised January 2018 (ENCS)
              </div>
              <div className="text-xs font-mono font-bold text-blue-900 pt-1">
                For the Taxable Year {cert.tax_year} • Period: {cert.period_from} to {cert.period_to}
              </div>
            </div>

            {/* Part I & II Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Part I: Employee Information */}
              <div className="border border-slate-300 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
                <div className="font-bold text-[11px] uppercase tracking-wider text-blue-900 border-b pb-1">
                  Part I — Employee Information
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">1. Taxpayer Identification No. (TIN)</span>
                  <div className="font-mono font-bold text-sm text-slate-900">{cert.employee.tin}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">2. Employee's Name</span>
                  <div className="font-bold text-slate-800">{cert.employee.name}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">3. Registered Address & ZIP Code</span>
                  <div className="font-medium text-slate-700">{cert.employee.address} ({cert.employee.zip_code})</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">4. Employment Status</span>
                  <div className="font-bold text-rose-700">{cert.employee.status} (Effective {cert.period_to})</div>
                </div>
              </div>

              {/* Part II: Employer Information */}
              <div className="border border-slate-300 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
                <div className="font-bold text-[11px] uppercase tracking-wider text-blue-900 border-b pb-1">
                  Part II — Present Employer Information
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">5. Employer TIN</span>
                  <div className="font-mono font-bold text-sm text-slate-900">{cert.employer.tin}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">6. Employer Name</span>
                  <div className="font-bold text-slate-800">{cert.employer.name}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">7. Registered Business Address</span>
                  <div className="font-medium text-slate-700">{cert.employer.address}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">8. Revenue District Office (RDO) Code</span>
                  <div className="font-bold text-slate-800">RDO {cert.employer.rdo_code} — Makati City</div>
                </div>
              </div>
            </div>

            {/* Part IV: Compensation Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Part IV-A: Non-Taxable / Exempt */}
              <div className="border border-slate-300 rounded-xl p-4 space-y-2.5">
                <div className="font-bold text-[11px] uppercase tracking-wider text-emerald-800 border-b pb-1 flex justify-between">
                  <span>Part IV-A — Non-Taxable / Exempt Income</span>
                  <span>Amount (₱)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>9. 13th Month Pay & Other Benefits (Exempt up to ₱90,000)</span>
                  <span className="font-mono font-semibold">{fmt(cert.part_iv_a_non_taxable.thirteenth_month_pay_exempt)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>10. De Minimis Benefits (Rice, Transport, Medical)</span>
                  <span className="font-mono font-semibold">{fmt(cert.part_iv_a_non_taxable.de_minimis_benefits)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>11. SSS, PhilHealth, & Pag-IBIG Contributions</span>
                  <span className="font-mono font-semibold">{fmt(cert.part_iv_a_non_taxable.statutory_contributions)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
                  <span>Total Non-Taxable / Exempt:</span>
                  <span className="font-mono text-emerald-700">{fmt(cert.part_iv_a_non_taxable.total_non_taxable_compensation)}</span>
                </div>
              </div>

              {/* Part IV-B: Taxable Compensation */}
              <div className="border border-slate-300 rounded-xl p-4 space-y-2.5">
                <div className="font-bold text-[11px] uppercase tracking-wider text-blue-800 border-b pb-1 flex justify-between">
                  <span>Part IV-B — Taxable Compensation Income</span>
                  <span>Amount (₱)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>12. Basic Salary (Year-to-Date Earned)</span>
                  <span className="font-mono font-semibold">{fmt(cert.part_iv_b_taxable.basic_salary)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>13. 13th Month & Benefits (Excess over ₱90,000)</span>
                  <span className="font-mono font-semibold">{fmt(cert.part_iv_b_taxable.thirteenth_month_pay_taxable)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>14. Taxable Leave Encashment (Excess over 10 days)</span>
                  <span className="font-mono font-semibold">{fmt(cert.part_iv_b_taxable.taxable_leave_encashment)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
                  <span>Total Taxable Compensation:</span>
                  <span className="font-mono text-blue-900">{fmt(cert.part_iv_b_taxable.total_taxable_compensation)}</span>
                </div>
              </div>
            </div>

            {/* Summary & Tax Computation Table */}
            <div className="border-2 border-slate-900 rounded-xl p-4 bg-slate-50 text-xs space-y-2">
              <div className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 flex items-center justify-between">
                <span>Summary of Tax Calculation & Annual Reconciliation (TRAIN Act)</span>
                <span className="font-mono text-slate-500">Form 2316 Section 15-20</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">15. Gross Compensation</span>
                  <div className="font-mono font-extrabold text-sm text-slate-900">{fmt(cert.summary.gross_compensation_income)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">16. Taxable Net Income</span>
                  <div className="font-mono font-extrabold text-sm text-blue-900">{fmt(cert.summary.taxable_compensation_income)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">17. Annual Tax Due</span>
                  <div className="font-mono font-extrabold text-sm text-slate-900">{fmt(cert.summary.tax_due)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">18. Total Tax Withheld</span>
                  <div className="font-mono font-extrabold text-sm text-emerald-700">{fmt(cert.summary.amount_of_tax_withheld)}</div>
                </div>
              </div>

              {/* Refund / Payable Tag */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  {cert.summary.tax_refund > 0 ? '19. Overwithheld Tax Refunded to Employee (in Backpay):' : '20. Underwithheld Tax Payable by Employee:'}
                </span>
                <span className="font-mono font-black text-sm text-purple-700">
                  {fmt(cert.summary.tax_refund > 0 ? cert.summary.tax_refund : cert.summary.tax_payable)}
                </span>
              </div>
            </div>

            {/* Signatures & Cryptographic Audit Seal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-300 text-xs">
              <div className="space-y-4">
                <div className="border-b border-slate-400 pb-1 text-center font-bold">
                  {cert.employee.name}
                </div>
                <div className="text-center text-[10px] text-slate-500 uppercase font-bold">
                  Signature of Employee / Taxpayer
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b border-slate-400 pb-1 text-center font-bold">
                  {cert.digital_signature.employer_representative}
                </div>
                <div className="text-center text-[10px] text-slate-500 uppercase font-bold">
                  Authorized Employer Representative • Accreditation {cert.digital_signature.tax_agent_accreditation_no}
                </div>
              </div>
            </div>

            {/* Tamper-Proof Cryptographic Hash Footer */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-[10px] text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-mono">
                <Lock className="w-3 h-3 text-blue-600" />
                <span>SHA-256 Digital Verification Seal: {cert.digital_signature.cryptographic_seal}...</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{cert.digital_signature.status}</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
