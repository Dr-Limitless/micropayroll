import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Landmark, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  Percent, 
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MicroloanManager() {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Loan Form State
  const [newLoan, setNewLoan] = useState({
    employee_id: '1',
    loan_type: 'Emergency Salary Advance',
    principal_amount: '10000',
    total_installments: '6',
    interest_rate: '1.0',
    reason: 'Emergency home repair assistance'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [loanData, empData] = await Promise.all([
        api.getMicroloans(),
        api.getEmployees()
      ]);
      if (loanData.microloans) setLoans(loanData.microloans);
      if (empData.employees) setEmployees(empData.employees);
    } catch (err) {
      console.error('Error fetching microloans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createMicroloan(newLoan);
      if (res.microloan) {
        setShowApplyModal(false);
        loadData();
      }
    } catch (err) {
      alert('Error applying for microloan: ' + err.message);
    }
  };

  const handleStatusChange = async (loanId, newStatus) => {
    try {
      await api.updateMicroloanStatus(loanId, newStatus, user?.full_name || 'Approver');
      loadData();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const totalOutstanding = loans.reduce((acc, l) => acc + Number(l.balance_amount || 0), 0);
  const pendingCount = loans.filter(l => l.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-purple-600" />
            Microfinancial Assistance & Salary Advances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Emergency microloans, educational grants, and automated payroll amortization schedules.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Request Microloan / Advance</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Active Loan Pool</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₱{totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-0.5">Automated cut-off deduction linked</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Applications</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {pendingCount} Requests
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Requires Manager / Director Approval</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Default Rate</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            0.00%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">100% Repayment Guarantee via Payroll Hold</div>
        </div>
      </div>

      {/* Microloans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            All Assistance Records ({loans.length})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Assistance Type</th>
                <th className="py-3 px-4">Principal</th>
                <th className="py-3 px-4">Monthly Amort.</th>
                <th className="py-3 px-4">Term</th>
                <th className="py-3 px-4">Remaining Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{loan.employee_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{loan.employee_code}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{loan.loan_type}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{loan.reason}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                    ₱{Number(loan.principal_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-purple-700 font-semibold">
                    ₱{Number(loan.monthly_deduction).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    {loan.remaining_installments} of {loan.total_installments} mos
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-slate-900">
                    ₱{Number(loan.balance_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      loan.status === 'Active' || loan.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : loan.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1">
                    {loan.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => handleStatusChange(loan.id, 'Active')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(loan.id, 'Rejected')}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-[11px]"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Approved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-purple-600" />
                Apply for Microfinance Assistance
              </h2>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Beneficiary Employee</label>
                <select
                  value={newLoan.employee_id}
                  onChange={(e) => setNewLoan({ ...newLoan, employee_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-500 bg-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Loan / Advance Program</label>
                <select
                  value={newLoan.loan_type}
                  onChange={(e) => setNewLoan({ ...newLoan, loan_type: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-500 bg-white"
                >
                  <option value="Emergency Salary Advance">Emergency Salary Advance (1.0% interest)</option>
                  <option value="Educational Aid Advance">Educational Aid Advance (1.25% interest)</option>
                  <option value="Health & Medical Assistance">Health & Medical Assistance (0.5% interest)</option>
                  <option value="Micro Business Assistance">Micro Business Assistance (1.5% interest)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Principal Amount (₱)</label>
                  <input
                    required
                    type="number"
                    value={newLoan.principal_amount}
                    onChange={(e) => setNewLoan({ ...newLoan, principal_amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Installment Term (Months)</label>
                  <select
                    value={newLoan.total_installments}
                    onChange={(e) => setNewLoan({ ...newLoan, total_installments: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-500 bg-white"
                  >
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="10">10 Months</option>
                    <option value="12">12 Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Purpose / Reason</label>
                <textarea
                  rows="2"
                  value={newLoan.reason}
                  onChange={(e) => setNewLoan({ ...newLoan, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-900 space-y-1">
                <div className="flex justify-between">
                  <span>Estimated Monthly Cut-off Deduction:</span>
                  <strong className="font-mono">₱{(Math.round(Number(newLoan.principal_amount) / Number(newLoan.total_installments)) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo</strong>
                </div>
                <div className="text-[10px] text-purple-700">Deducted 50% automatically on each semi-monthly payroll run.</div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md shadow-purple-600/20"
                >
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
