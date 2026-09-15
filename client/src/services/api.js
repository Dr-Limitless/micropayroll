const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = rawApiUrl ? `${rawApiUrl}/api` : '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('mms_access_token');
  let userRole = 'admin';
  try {
    const user = JSON.parse(localStorage.getItem('mms_user') || '{}');
    if (user && user.role) userRole = user.role;
  } catch {}
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'x-user-role': userRole
  };
}

export function dispatchTaskRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mms:refresh-tasks'));
  }
}

async function requestWithRefresh(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!data?.error) {
    dispatchTaskRefresh();
  }
  return data;
}

export const api = {
  // Auth
  async getPersonas() {
    const res = await fetch(`${BASE_URL}/auth/personas`);
    return res.json();
  },

  async login(payload) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async verify2FALogin(payload) {
    const res = await fetch(`${BASE_URL}/auth/login/2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async get2FAStatus() {
    const res = await fetch(`${BASE_URL}/auth/2fa/status`, { headers: getAuthHeaders() });
    return res.json();
  },

  async setup2FA() {
    const res = await fetch(`${BASE_URL}/auth/2fa/setup`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async activate2FA(secret, totp_code) {
    const res = await fetch(`${BASE_URL}/auth/2fa/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ secret, totp_code })
    });
    return res.json();
  },

  async disable2FA() {
    const res = await fetch(`${BASE_URL}/auth/2fa/disable`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateProfile(data) {
    return requestWithRefresh(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },

  async changePassword(data) {
    return requestWithRefresh(`${BASE_URL}/auth/password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },

  // Employees Master CRUD
  async getEmployees() {
    const res = await fetch(`${BASE_URL}/employees`, { headers: getAuthHeaders() });
    return res.json();
  },
  async getEmployeeById(id) {
    const res = await fetch(`${BASE_URL}/employees/${id}`, { headers: getAuthHeaders() });
    return res.json();
  },
  async createEmployee(data) {
    return requestWithRefresh(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },
  async updateEmployee(id, data) {
    return requestWithRefresh(`${BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },
  async deleteEmployee(id) {
    return requestWithRefresh(`${BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // Payroll Computation & Lifecycle
  async getPayrollPeriods() {
    const res = await fetch(`${BASE_URL}/payroll/periods`, { headers: getAuthHeaders() });
    return res.json();
  },
  async getPayrollComputation(month = 'July 2024') {
    const res = await fetch(`${BASE_URL}/payroll/computation?month=${encodeURIComponent(month)}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  async computePayrollMonth(month = 'July 2024') {
    return requestWithRefresh(`${BASE_URL}/payroll/compute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ month })
    });
  },
  async updatePayrollPeriodStatus(month = 'July 2024', status) {
    return requestWithRefresh(`${BASE_URL}/payroll/period/${encodeURIComponent(month)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
  },
  async updateEmployeePayrollStatus(employeeId, status, month = 'July 2024') {
    return requestWithRefresh(`${BASE_URL}/payroll/employee/${employeeId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, month })
    });
  },
  async addEmployeeToPayroll(employee, month = 'July 2024') {
    return requestWithRefresh(`${BASE_URL}/payroll/employee`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employee, month })
    });
  },
  async getPayslip(employeeId, month = 'July 2024') {
    const res = await fetch(`${BASE_URL}/payroll/payslip/${employeeId}?month=${encodeURIComponent(month)}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Timekeeping & Attendance Integration
  async getAttendance() {
    const res = await fetch(`${BASE_URL}/payroll/attendance`, { headers: getAuthHeaders() });
    return res.json();
  },
  async logAttendance(data) {
    return requestWithRefresh(`${BASE_URL}/payroll/attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },
  async approveAttendance(id, status = 'Approved', approver) {
    return requestWithRefresh(`${BASE_URL}/payroll/attendance/${id}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, approver })
    });
  },

  // Compensation Planning & Adjustments
  async getCompensation() {
    const res = await fetch(`${BASE_URL}/payroll/compensation`, { headers: getAuthHeaders() });
    return res.json();
  },
  async updateAllowance(id, data) {
    return requestWithRefresh(`${BASE_URL}/payroll/compensation/allowance/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },
  async createSalaryAdjustment(data) {
    return requestWithRefresh(`${BASE_URL}/payroll/compensation/adjustments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },
  async updateSalaryAdjustmentStatus(id, status, approver) {
    return requestWithRefresh(`${BASE_URL}/payroll/compensation/adjustments/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, approver })
    });
  },

  // Claims & Reimbursement
  async getClaims() {
    const res = await fetch(`${BASE_URL}/payroll/claims`, { headers: getAuthHeaders() });
    return res.json();
  },
  async createClaim(data) {
    return requestWithRefresh(`${BASE_URL}/payroll/claims`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },
  async updateClaimStatus(id, status, approver) {
    return requestWithRefresh(`${BASE_URL}/payroll/claims/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, approver })
    });
  },

  // HMO & Benefits Administration
  async getBenefits() {
    const res = await fetch(`${BASE_URL}/payroll/benefits`, { headers: getAuthHeaders() });
    return res.json();
  },
  async enrollBenefit(data) {
    return requestWithRefresh(`${BASE_URL}/payroll/benefits/enroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },
  async updateHMOStatus(id, status) {
    return requestWithRefresh(`${BASE_URL}/payroll/benefits/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
  },

  // HR Analytics, Financial & Compliance Reports
  async getRealtimeDashboard(month = 'July 2024') {
    const res = await fetch(`${BASE_URL}/payroll/dashboard/realtime?month=${encodeURIComponent(month)}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  async getFinancialReports(month = 'July 2024') {
    const res = await fetch(`${BASE_URL}/payroll/reports/financial?month=${encodeURIComponent(month)}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  async getComplianceReports(month = 'July 2024') {
    const res = await fetch(`${BASE_URL}/payroll/reports/compliance?month=${encodeURIComponent(month)}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Microloans
  async getMicroloans() {
    const res = await fetch(`${BASE_URL}/microloans`, { headers: getAuthHeaders() });
    return res.json();
  },
  async createMicroloan(data) {
    return requestWithRefresh(`${BASE_URL}/microloans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },
  async updateMicroloanStatus(id, status, approverName) {
    return requestWithRefresh(`${BASE_URL}/microloans/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, approver_name: approverName })
    });
  },

  // Security
  async encryptText(text) {
    const res = await fetch(`${BASE_URL}/security/encrypt`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    return res.json();
  },
  async decryptPayload(encrypted_payload) {
    const res = await fetch(`${BASE_URL}/security/decrypt`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ encrypted_payload })
    });
    return res.json();
  },
  async getAuditLogs(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        cleanParams[k] = params[k];
      }
    });
    const q = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${BASE_URL}/security/audit-logs${q ? `?${q}` : ''}`, { headers: getAuthHeaders() });
    return res.json();
  },
  async getSecurityStatus() {
    const res = await fetch(`${BASE_URL}/security/status`, { headers: getAuthHeaders() });
    return res.json();
  },

  // --- Notifications ---
  async getNotifications() {
    const res = await fetch(`${BASE_URL}/notifications`, { headers: getAuthHeaders() });
    return res.json();
  },
  async markNotificationRead(id) {
    return requestWithRefresh(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
  },
  async markAllNotificationsRead() {
    return requestWithRefresh(`${BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  },
  async getTaskQueueCounts() {
    const res = await fetch(`${BASE_URL}/notifications/task-queue`, { headers: getAuthHeaders() });
    return res.json();
  },

  // --- Retroactivity & Period Rollover ---
  async getPpaPending() {
    const res = await fetch(`${BASE_URL}/payroll/ppa/pending`, { headers: getAuthHeaders() });
    return res.json();
  },
  async rolloverPeriod(month) {
    return requestWithRefresh(`${BASE_URL}/payroll/period/rollover`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ month })
    });
  },

  // --- Employee Lifecycle & Offboarding ---
  async getFinalPay(employeeId, params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/employees/${employeeId}/final-pay${q ? `?${q}` : ''}`, { headers: getAuthHeaders() });
    return res.json();
  },
  async offboardEmployee(employeeId, data) {
    return requestWithRefresh(`${BASE_URL}/employees/${employeeId}/offboard`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },
  async getBIR2316(employeeId) {
    const res = await fetch(`${BASE_URL}/employees/${employeeId}/bir-2316`, { headers: getAuthHeaders() });
    return res.json();
  }
};

