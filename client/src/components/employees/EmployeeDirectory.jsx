import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, 
  Search, 
  Plus, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2, 
  X,
  Check,
  Building,
  Briefcase,
  CreditCard,
  Hash
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeDirectory() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [revealSensitive, setRevealSensitive] = useState({});
  const [loading, setLoading] = useState(true);

  // New Employee Form State
  const [newEmp, setNewEmp] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    position: '',
    salary: '65000',
    bank_account: '1234-5678-9012-3456',
    tin: '123-456-789-000',
    bank_name: 'Metro Micro Bank'
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployees();
      if (data.employees) setEmployees(data.employees);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createEmployee(newEmp);
      if (res.employee) {
        setShowAddModal(false);
        setNewEmp({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          department: 'Engineering',
          position: '',
          salary: '65000',
          bank_account: '1234-5678-9012-3456',
          tin: '123-456-789-000',
          bank_name: 'Metro Micro Bank'
        });
        loadEmployees();
      }
    } catch (err) {
      alert('Error creating employee: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this employee record?')) {
      await api.deleteEmployee(id);
      loadEmployees();
    }
  };

  const toggleReveal = (empId) => {
    setRevealSensitive(prev => ({ ...prev, [empId]: !prev[empId] }));
  };

  const departments = ['All', 'Engineering', 'Finance', 'Human Resources', 'Operations', 'Marketing & Sales'];

  const filtered = employees.filter(emp => {
    const matchSearch = `${emp.first_name} ${emp.last_name} ${emp.employee_code} ${emp.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchDept = selectedDept === 'All' || emp.department === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Employee Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Directory of staff profiles, salary structures, and AES-256 encrypted banking accounts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, employee code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:border-emerald-500 outline-none"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Role & Dept</th>
                <th className="py-3.5 px-4">Annual Base</th>
                <th className="py-3.5 px-4">Bank Account (AES-256)</th>
                <th className="py-3.5 px-4">Tax ID (TIN)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => {
                const isRevealed = revealSensitive[emp.id];
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{emp.first_name} {emp.last_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{emp.employee_code} • {emp.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{emp.position}</div>
                      <div className="text-[11px] text-slate-500">{emp.department}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                      ${Number(emp.salary).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                        <Lock className="w-3 h-3 text-blue-500" />
                        <span className={isRevealed ? 'text-slate-900 font-bold' : 'text-slate-500'}>
                          {isRevealed ? emp.plain_bank_account : emp.masked_bank_account}
                        </span>
                        <button
                          onClick={() => toggleReveal(emp.id)}
                          title={isRevealed ? 'Mask' : 'Decrypt & Reveal'}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                      {isRevealed ? emp.plain_tin : emp.masked_tin}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {emp.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1">
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title="View Full Profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Remove Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Register New Employee
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">First Name</label>
                  <input
                    required
                    type="text"
                    value={newEmp.first_name}
                    onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Last Name</label>
                  <input
                    required
                    type="text"
                    value={newEmp.last_name}
                    onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Work Email</label>
                  <input
                    required
                    type="email"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Phone</label>
                  <input
                    type="text"
                    value={newEmp.phone}
                    onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing & Sales">Marketing & Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Position / Job Title</label>
                  <input
                    required
                    type="text"
                    value={newEmp.position}
                    onChange={(e) => setNewEmp({ ...newEmp, position: e.target.value })}
                    placeholder="e.g. Lead Developer"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    AES-256 Protected Financial Data
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">Encrypted at Rest</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-800 font-bold uppercase text-[10px] mb-1">Monthly Base Salary (₱)</label>
                    <input
                      required
                      type="number"
                      value={newEmp.salary}
                      onChange={(e) => setNewEmp({ ...newEmp, salary: e.target.value })}
                      className="w-full p-2 rounded-lg border border-emerald-300 bg-white font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-800 font-bold uppercase text-[10px] mb-1">Bank Account Number</label>
                    <input
                      required
                      type="text"
                      value={newEmp.bank_account}
                      onChange={(e) => setNewEmp({ ...newEmp, bank_account: e.target.value })}
                      className="w-full p-2 rounded-lg border border-emerald-300 bg-white font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
                >
                  Save & Encrypt Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Detail Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedEmployee.first_name} {selectedEmployee.last_name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedEmployee.employee_code}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between"><span className="text-slate-400">Position:</span><span className="font-semibold text-slate-800">{selectedEmployee.position}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Department:</span><span className="font-semibold text-slate-800">{selectedEmployee.department}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="font-semibold text-slate-800">{selectedEmployee.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Hire Date:</span><span className="font-semibold text-slate-800">{selectedEmployee.hire_date}</span></div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between font-bold text-blue-900 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    AES-256 Storage Verification
                  </span>
                  <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Encrypted</span>
                </div>
                <div className="space-y-1 pt-1 font-mono text-[11px] text-slate-700">
                  <div>Bank: <strong>{selectedEmployee.bank_name || 'Metro Micro Bank'}</strong></div>
                  <div>Account: <strong>{selectedEmployee.plain_bank_account}</strong></div>
                  <div>TIN: <strong>{selectedEmployee.plain_tin}</strong></div>
                  <div>Salary: <strong>₱{Number(selectedEmployee.salary).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
