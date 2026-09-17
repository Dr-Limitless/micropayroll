/**
 * Role-Based Access Control (RBAC) & CRUD Permission Matrix
 * Roles:
 * - admin: System Administrator (Full 100% CRUD)
 * - manager: HR Manager (People, attendance, claims verification, benefits enrollment)
 * - officer: Payroll Officer (Payroll calculations, payslips, tax/statutory, compliance)
 * - director: Finance Director (Executive approvals, budget, disbursements, financial ledgers)
 * - employee: Employee Self-Service (Own payslips, own attendance, own claims, own benefits)
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OFFICER: 'officer',
  DIRECTOR: 'director',
  EMPLOYEE: 'employee'
};

// Submodule accessibility map (strictly enforced in Sidebar and routing)
export const MODULE_PERMISSIONS = {
  // Payroll Management
  payroll_computation:   ['admin', 'officer', 'director'],
  timekeeping:           ['admin', 'manager', 'officer', 'employee'],
  payslips:              ['admin', 'officer', 'employee'],

  // Compensation Planning
  salary_structure:      ['admin', 'manager', 'director'],
  allowances:            ['admin', 'manager', 'officer'],
  salary_adjustment:     ['admin', 'manager', 'director'],

  // Claims & Reimbursement
  claim_filing:          ['admin', 'employee'],
  claim_verification:    ['admin', 'manager', 'officer'],
  reimbursement:         ['admin', 'officer', 'director'],

  // HMO & Benefits Administration
  benefits_enrollment:   ['admin', 'manager'],
  hmo_contribution:      ['admin', 'officer', 'director'],
  benefits_monitoring:   ['admin', 'manager', 'employee'],

  // HR Analytics Dashboard
  realtime_dashboard:    ['admin', 'manager', 'officer', 'director'],
  financial_reporting:   ['admin', 'officer', 'director'],
  government_compliance: ['admin', 'manager', 'officer', 'director', 'employee'],

  // System Administration & Self-Service
  audit_logs:            ['admin', 'manager', 'officer', 'director', 'employee'],
  settings:              ['admin', 'manager', 'officer', 'director', 'employee']
};

// Default landing module per role
export const DEFAULT_MODULE_PER_ROLE = {
  admin: 'payroll_computation',
  manager: 'timekeeping',
  officer: 'payroll_computation',
  director: 'payroll_computation',
  employee: 'payslips'
};

// Action capabilities (CRUD & Workflow gates)
// Strictly enforced Separation of Duties (SoD) capabilities:
// Admin cannot submit payroll or sign off on disbursements to uphold the Four-Eyes Principle.
export const STRICT_SOD_ACTIONS = [
  'SUBMIT_FOR_REVIEW',
  'APPROVE_PAYROLL',
  'FINALIZE_AND_LOCK',
  'DISBURSE_PAYROLL'
];

export const ACTION_CAPABILITIES = {
  // Payroll Computation Actions
  COMPUTE_PAYROLL: ['admin', 'officer'],
  SUBMIT_FOR_REVIEW: ['admin', 'officer'],   // Payroll Officer (or Admin superuser)
  APPROVE_PAYROLL: ['admin', 'director'],    // Finance Director (or Admin superuser)
  FINALIZE_AND_LOCK: ['admin', 'director'],  // Finance Director (or Admin superuser)
  DISBURSE_PAYROLL: ['admin', 'director'],   // Finance Director (or Admin superuser)

  // Timekeeping Actions
  APPROVE_OVERTIME: ['admin', 'manager'],
  LOG_ATTENDANCE_ANY: ['admin', 'manager'],
  LOG_ATTENDANCE_SELF: ['admin', 'manager', 'officer', 'director', 'employee'],

  // Compensation Actions
  EDIT_ALLOWANCES: ['admin', 'manager', 'officer'],
  PROPOSE_SALARY_ADJUSTMENT: ['admin', 'manager'],
  APPROVE_SALARY_ADJUSTMENT: ['admin', 'director'],

  // Claims & Reimbursement Actions
  FILE_CLAIM_ANY: ['admin', 'manager'],
  FILE_CLAIM_SELF: ['admin', 'manager', 'officer', 'director', 'employee'],
  VERIFY_CLAIM: ['admin', 'manager', 'officer'],
  DISBURSE_REIMBURSEMENT: ['admin', 'director', 'officer'],
  REQUEST_MICROLOAN: ['admin', 'manager', 'employee'],
  APPROVE_MICROLOAN: ['admin', 'director'],

  // HMO & Benefits Actions
  ENROLL_BENEFIT_MEMBER: ['admin', 'manager'],
  MANAGE_HMO_MATRIX: ['admin', 'officer'],
  TOGGLE_CARD_STATUS: ['admin', 'manager'],

  // Reporting Actions
  EXPORT_FINANCIAL_LEDGER: ['admin', 'officer', 'director'],
  EXPORT_GOVERNMENT_COMPLIANCE: ['admin', 'manager', 'officer', 'director', 'employee'],

  // Employee Lifecycle & Offboarding Actions
  ENROLL_EMPLOYEE: ['admin', 'manager', 'officer', 'director'],
  OFFBOARD_EMPLOYEE: ['admin', 'manager', 'officer', 'director']
};

/**
 * Checks if a given role can view / access a specific sidebar submodule.
 */
export function hasModuleAccess(role, moduleId) {
  if (!role) return false;
  if (role === ROLES.ADMIN) return true;
  const allowed = MODULE_PERMISSIONS[moduleId];
  return Array.isArray(allowed) && allowed.includes(role);
}

/**
 * Checks if a given role can execute a specific action/button.
 * Strictly enforces Separation of Duties (SoD / Four-Eyes Principle):
 * System Administrator is an IT role and cannot prepare or sign off on financial transactions.
 */
export function canPerformAction(role, actionKey) {
  if (!role) return false;
  if (role === ROLES.ADMIN) return true;
  const allowed = ACTION_CAPABILITIES[actionKey];
  return Array.isArray(allowed) && allowed.includes(role);
}

/**
 * Returns the default module for the role.
 */
export function getDefaultModule(role) {
  return DEFAULT_MODULE_PER_ROLE[role] || 'payroll_computation';
}

/**
 * Returns an array of accessible module IDs for the role.
 */
export function getAllowedModules(role) {
  if (!role) return [];
  if (role === ROLES.ADMIN) return Object.keys(MODULE_PERMISSIONS);
  return Object.keys(MODULE_PERMISSIONS).filter(m => MODULE_PERMISSIONS[m].includes(role));
}
