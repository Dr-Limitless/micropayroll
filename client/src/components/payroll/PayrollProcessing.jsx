import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  CreditCard, 
  Play, 
  CheckCircle, 
  Calendar, 
  DollarSign, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import PayslipModal from '../payslips/PayslipModal';

export default function PayrollProcessing() {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [payrollItems, setPayrollItems] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPayslipEmpId, setSelectedPayslipEmpId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const data = await api.getPayrollPeriods();
      if (data.periods) {
        setPeriods(data.periods);
        if (data.periods.length > 0 && !selectedPeriod) {
          setSelectedPeriod(data.periods[0]);
          // Calculate/load items
          const comp = await api.calculateCutOff(data.periods[0].id);
          if (comp.items) setPayrollItems(comp.items);
        }
      }
    } catch (err) {
      console.error('Error loading payroll periods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const handleSelectPeriod = async (p) => {
    setSelectedPeriod(p);
    setIsCalculating(true);
    try {
      const res = await api.calculateCutOff(p.id);
      if (res.items) setPayrollItems(res.items);
    } catch (err) {
      console.error('Error calculating for period:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRunBatchCalculation = async () => {
    if (!selectedPeriod) return;
    setIsCalculating(true);
    try {
      const res = await api.calculateCutOff(selectedPeriod.id);
      if (res.items) {
        setPayrollItems(res.items);
        loadPeriods();
      }
    } catch (err) {
      alert('Calculation error: ' + err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const totalGross = payrollItems.reduce((acc, item) => acc + Number(item.gross_pay || 0), 0);
  const totalDeductions = payrollItems.reduce((acc, item) => acc + Number(item.total_deductions || 0), 0);
  const totalNet = payrollItems.reduce((acc, item) => acc + Number(item.net_pay || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Payroll Computation Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Semi-monthly wage calculations, automated statutory contributions, and microloan deductions.
          </p>
        </div>

        <button
          onClick={handleRunBatchCalculation}
          disabled={isCalculating}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {isCalculating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{isCalculating ? 'Computing Formulas...' : 'Run Batch Computation'}</span>
        </button>
      </div>

      {/* Cut-off Period Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {periods.map((p) => {
          const isSelected = selectedPeriod?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPeriod(p)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 border ${
                isSelected 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{p.period_name}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                p.status === 'Disbursed' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {p.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Computation Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Payroll Pool</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Base + Allowances + Overtime</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statutory & Loan Deductions</span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            ${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Withholding Tax, SSS, PhilHealth, Loans</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Net Disbursement</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Disbursement Ready • AES-256 Validated</div>
        </div>
      </div>

      {/* Detailed Calculation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Cut-off Line Items ({payrollItems.length} Enrolled Employees)
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Tax tables computed automatically
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Base Pay</th>
                <th className="py-3 px-3">Allowances</th>
                <th className="py-3 px-3">Gross</th>
                <th className="py-3 px-3">Tax (12%)</th>
                <th className="py-3 px-3">SSS/Health</th>
                <th className="py-3 px-3">Microloan</th>
                <th className="py-3 px-3">Total Ded.</th>
                <th className="py-3 px-3 font-extrabold text-slate-900">Net Pay</th>
                <th className="py-3 px-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollItems.map((item) => (
                <tr key={item.employee_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.employee_code} • {item.department}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-700">
                    ${Number(item.basic_pay).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-700">
                    ${Number(item.allowances + item.overtime_pay).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-slate-900">
                    ${Number(item.gross_pay).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-amber-700">
                    -${Number(item.withholding_tax).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-amber-700">
                    -${Number(item.sss_contribution + item.philhealth + item.pagibig).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono">
                    {Number(item.microloan_deduction) > 0 ? (
                      <span className="text-purple-700 font-bold">-${Number(item.microloan_deduction).toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-300">$0.00</span>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono font-semibold text-red-600">
                    -${Number(item.total_deductions).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono font-black text-emerald-700 text-sm">
                    ${Number(item.net_pay).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => setSelectedPayslipEmpId(item.employee_id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors flex items-center space-x-1 ml-auto"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Payslip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Payslip Modal */}
      {selectedPayslipEmpId && (
        <PayslipModal
          employeeId={selectedPayslipEmpId}
          onClose={() => setSelectedPayslipEmpId(null)}
        />
      )}
    </div>
  );
}
