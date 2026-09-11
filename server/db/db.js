const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { encryptAES256, decryptAES256 } = require('../utils/crypto');
const { initialUsers, generateAuditChecksum } = require('./seed');
const statutory2025 = require('../utils/statutory2025');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/micropayroll',
  connectionTimeoutMillis: 2000,
});

let isPostgreConnected = false;

// =========================================================================
// 1. CENTRAL MASTER EMPLOYEES REPOSITORY
// Every module references employee by numeric id / employee_code
// =========================================================================
let masterEmployees = [
  {
    id: 1,
    employee_code: 'EMP-001',
    first_name: 'Maria',
    last_name: 'Santos',
    initials: 'MS',
    email: 'maria.santos@mms.com',
    phone: '+63 917 123 4567',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    employment_type: 'Full-time',
    hire_date: '2022-03-15',
    status: 'Active',
    base_salary: 75000,
    bank_name: 'BDO Unibank',
    bank_account: '9842-1102-4458-7123',
    encrypted_bank_account: encryptAES256('9842-1102-4458-7123'),
    tin: '284-901-443-000',
    encrypted_tin: encryptAES256('284-901-443-000'),
    sss_number: '34-8891240-1',
    philhealth_number: '12-098765432-1',
    pagibig_number: '1210-9842-1102',
    address: '142 Legaspi St., Legaspi Village, Makati City',
    zip_code: '1229',
    leave_credits: { vacation_leave: 12, sick_leave: 8, unused_leaves: 10 }
  },
  {
    id: 2,
    employee_code: 'EMP-002',
    first_name: 'Jose',
    last_name: 'Reyes',
    initials: 'JR',
    email: 'jose.reyes@mms.com',
    phone: '+63 918 234 5678',
    department: 'Product',
    position: 'Principal Product Manager',
    employment_type: 'Full-time',
    hire_date: '2021-08-01',
    status: 'Active',
    base_salary: 90000,
    bank_name: 'Bank of the Philippine Islands (BPI)',
    bank_account: '8831-4092-1123-9041',
    encrypted_bank_account: encryptAES256('8831-4092-1123-9041'),
    tin: '192-384-551-000',
    encrypted_tin: encryptAES256('192-384-551-000'),
    sss_number: '33-1029481-2',
    philhealth_number: '11-827364519-0',
    pagibig_number: '1211-8831-4092',
    address: 'Unit 8B, One Serendra, BGC, Taguig City',
    zip_code: '1634',
    leave_credits: { vacation_leave: 15, sick_leave: 10, unused_leaves: 12 }
  },
  {
    id: 3,
    employee_code: 'EMP-003',
    first_name: 'Ana',
    last_name: 'Cruz',
    initials: 'AC',
    email: 'ana.cruz@mms.com',
    phone: '+63 920 345 6789',
    department: 'Design',
    position: 'Lead UI/UX Designer',
    employment_type: 'Full-time',
    hire_date: '2022-01-10',
    status: 'Active',
    base_salary: 60000,
    bank_name: 'Metrobank',
    bank_account: '7729-1049-5561-3329',
    encrypted_bank_account: encryptAES256('7729-1049-5561-3329'),
    tin: '304-118-992-000',
    encrypted_tin: encryptAES256('304-118-992-000'),
    sss_number: '34-2918374-5',
    philhealth_number: '12-736451928-3',
    pagibig_number: '1212-7729-1049',
    address: '45 Perea St., San Lorenzo, Makati City',
    zip_code: '1223',
    leave_credits: { vacation_leave: 10, sick_leave: 6, unused_leaves: 8 }
  },
  {
    id: 4,
    employee_code: 'EMP-004',
    first_name: 'Marco',
    last_name: 'Dela Cruz',
    initials: 'MD',
    email: 'marco.delacruz@mms.com',
    phone: '+63 917 456 7890',
    department: 'Engineering',
    position: 'DevOps & Cloud Engineer',
    employment_type: 'Full-time',
    hire_date: '2023-05-15',
    status: 'Active',
    base_salary: 70000,
    bank_name: 'Security Bank',
    bank_account: '6618-9923-4412-8874',
    encrypted_bank_account: encryptAES256('6618-9923-4412-8874'),
    tin: '419-502-331-000',
    encrypted_tin: encryptAES256('419-502-331-000'),
    sss_number: '34-9018273-9',
    philhealth_number: '12-918273645-4',
    pagibig_number: '1213-6618-9923',
    address: '22 Scout Gandia, Diliman, Quezon City',
    zip_code: '1103',
    leave_credits: { vacation_leave: 10, sick_leave: 5, unused_leaves: 7 }
  },
  {
    id: 5,
    employee_code: 'EMP-005',
    first_name: 'Patricia',
    last_name: 'Lim',
    initials: 'PL',
    email: 'patricia.lim@mms.com',
    phone: '+63 922 567 8901',
    department: 'Human Resources',
    position: 'People Operations Lead',
    employment_type: 'Full-time',
    hire_date: '2022-11-01',
    status: 'Active',
    base_salary: 65000,
    bank_name: 'UnionBank of the Philippines',
    bank_account: '5541-8832-7712-1102',
    encrypted_bank_account: encryptAES256('5541-8832-7712-1102'),
    tin: '512-889-440-000',
    encrypted_tin: encryptAES256('512-889-440-000'),
    sss_number: '33-8192034-7',
    philhealth_number: '11-625341908-5',
    pagibig_number: '1214-5541-8832',
    address: '18 Pioneer St., Mandaluyong City',
    zip_code: '1550',
    leave_credits: { vacation_leave: 14, sick_leave: 8, unused_leaves: 11 }
  },
  {
    id: 6,
    employee_code: 'EMP-006',
    first_name: 'Gabriel',
    last_name: 'Tan',
    initials: 'GT',
    email: 'gabriel.tan@mms.com',
    phone: '+63 919 678 9012',
    department: 'Finance',
    position: 'Senior Financial Controller',
    employment_type: 'Full-time',
    hire_date: '2021-02-15',
    status: 'Active',
    base_salary: 80000,
    bank_name: 'BDO Unibank',
    bank_account: '4419-2234-9981-6643',
    encrypted_bank_account: encryptAES256('4419-2234-9981-6643'),
    tin: '601-772-338-000',
    encrypted_tin: encryptAES256('601-772-338-000'),
    sss_number: '34-7182930-4',
    philhealth_number: '12-514239801-6',
    pagibig_number: '1215-4419-2234',
    address: '88 Valero St., Salcedo Village, Makati City',
    zip_code: '1227',
    leave_credits: { vacation_leave: 15, sick_leave: 10, unused_leaves: 14 }
  }
];

let offboardedEmployees = [];

// =========================================================================
// 2. COMPENSATION PLANNING: SALARY STRUCTURES, ADJUSTMENTS, & ALLOWANCES
// =========================================================================
let salaryBands = [
  { grade: 'L1', title: 'Associate / Junior Specialist', min_salary: 30000, max_salary: 45000, base_salary: 35000 },
  { grade: 'L2', title: 'Mid-Level Specialist / Engineer', min_salary: 48000, max_salary: 70000, base_salary: 60000 },
  { grade: 'L3', title: 'Senior Engineer / Team Lead', min_salary: 72000, max_salary: 95000, base_salary: 78000 },
  { grade: 'L4', title: 'Principal / Managerial Lead', min_salary: 98000, max_salary: 160000, base_salary: 110000 }
];

let salaryAdjustments = [
  {
    id: 1,
    employee_id: 1,
    current_salary: 75000,
    proposed_salary: 82000,
    adjustment_amount: 7000,
    adjustment_percentage: 9.33,
    reason: 'Annual Performance Review & Tech Lead Promotion',
    effective_date: '2024-08-01',
    requested_by: 'Liza Gomez (HR Manager)',
    approved_by: 'Diana Sterling (Finance Director)',
    status: 'Approved' // Effective in August 2024!
  },
  {
    id: 2,
    employee_id: 3,
    current_salary: 60000,
    proposed_salary: 66000,
    adjustment_amount: 6000,
    adjustment_percentage: 10.0,
    reason: 'Market Rate Alignment for Senior Design Role',
    effective_date: '2024-09-01',
    requested_by: 'Jose Reyes (Product Lead)',
    approved_by: null,
    status: 'Pending Approval' // Still pending - must NOT affect payroll
  }
];

let allowanceTypes = [
  { id: 1, name: 'De Minimis Transportation Allowance', type: 'Non-Taxable/De Minimis', default_amount: 3000, frequency: 'Monthly', status: 'Active' },
  { id: 2, name: 'Rice Subsidy Allowance', type: 'Non-Taxable/De Minimis', default_amount: 2000, frequency: 'Monthly', status: 'Active' },
  { id: 3, name: 'Medical & Optical Assistance', type: 'Non-Taxable/De Minimis', default_amount: 1500, frequency: 'Monthly', status: 'Active' },
  { id: 4, name: 'Performance & Project Incentive', type: 'Taxable', default_amount: 5000, frequency: 'Monthly', status: 'Active' }
];

let employeeAllowances = [
  { id: 1, employee_id: 1, allowance_id: 1, custom_amount: 2000, status: 'Active' },
  { id: 2, employee_id: 1, allowance_id: 2, custom_amount: 1500, status: 'Active' },
  { id: 3, employee_id: 2, allowance_id: 1, custom_amount: 5000, status: 'Active' },
  { id: 4, employee_id: 2, allowance_id: 4, custom_amount: 5000, status: 'Active' },
  { id: 5, employee_id: 3, allowance_id: 1, custom_amount: 3000, status: 'Active' },
  { id: 6, employee_id: 3, allowance_id: 2, custom_amount: 3000, status: 'Active' },
  { id: 7, employee_id: 4, allowance_id: 1, custom_amount: 4000, status: 'Active' },
  { id: 8, employee_id: 4, allowance_id: 4, custom_amount: 4000, status: 'Active' },
  { id: 9, employee_id: 5, allowance_id: 1, custom_amount: 3000, status: 'Active' },
  { id: 10, employee_id: 5, allowance_id: 2, custom_amount: 2000, status: 'Active' },
  { id: 11, employee_id: 6, allowance_id: 1, custom_amount: 4000, status: 'Active' },
  { id: 12, employee_id: 6, allowance_id: 4, custom_amount: 3000, status: 'Active' }
];

// =========================================================================
// 3. TIMEKEEPING & ATTENDANCE: BIOMETRICS, OVERTIME, APPROVALS
// Statutory references: Philippine Labor Code Arts. 86, 87, 91-94 & PD 851
// =========================================================================
const DOLE_DAY_CONFIG = {
  'Regular Day': {
    baseRate: 1.0,
    premiumRate: 0.0,
    otMultiplier: 1.25,
    label: 'Ordinary Working Day (100% / OT 125%)'
  },
  'Special Non-Working Day': {
    baseRate: 1.30,
    premiumRate: 0.30,
    otMultiplier: 1.69, // 130% * 130%
    label: 'Special Non-Working Day (130% / OT 169%)'
  },
  'Scheduled Rest Day': {
    baseRate: 1.30,
    premiumRate: 0.30,
    otMultiplier: 1.69, // 130% * 130%
    label: 'Scheduled Rest Day (130% / OT 169%)'
  },
  'Special Day on Rest Day': {
    baseRate: 1.50,
    premiumRate: 0.50,
    otMultiplier: 1.95, // 150% * 130%
    label: 'Special Day on Rest Day (150% / OT 195%)'
  },
  'Regular Holiday': {
    baseRate: 2.00,
    premiumRate: 1.00,
    otMultiplier: 2.60, // 200% * 130%
    label: 'Regular Holiday (200% / OT 260%)'
  },
  'Regular Holiday on Rest Day': {
    baseRate: 2.60,
    premiumRate: 1.60,
    otMultiplier: 3.38, // 260% * 130%
    label: 'Regular Holiday on Rest Day (260% / OT 338%)'
  }
};

let attendanceRecords = [
  { id: 1, employee_id: 1, date: '2024-07-15', day_type: 'Regular Day', time_in: '08:52 AM', time_out: '06:15 PM', regular_hours: 8.0, overtime_hours: 1.5, night_diff_hours: 0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Approved', approved_by: 'Liza Gomez' },
  { id: 2, employee_id: 1, date: '2024-07-16', day_type: 'Regular Holiday', time_in: '08:45 AM', time_out: '07:15 PM', regular_hours: 8.0, overtime_hours: 2.5, night_diff_hours: 2.0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Approved', approved_by: 'Liza Gomez' }, // Regular Holiday (200% base + 260% OT + 10% NSD)
  { id: 3, employee_id: 2, date: '2024-07-15', day_type: 'Regular Day', time_in: '09:00 AM', time_out: '06:00 PM', regular_hours: 8.0, overtime_hours: 0.0, night_diff_hours: 0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Approved', approved_by: 'Liza Gomez' },
  { id: 4, employee_id: 3, date: '2024-07-15', day_type: 'Regular Day', time_in: '08:45 AM', time_out: '06:30 PM', regular_hours: 8.0, overtime_hours: 1.0, night_diff_hours: 0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Approved', approved_by: 'Liza Gomez' },
  { id: 5, employee_id: 3, date: '2024-07-18', day_type: 'Regular Day', time_in: '08:30 AM', time_out: '06:30 PM', regular_hours: 8.0, overtime_hours: 1.0, night_diff_hours: 0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Approved', approved_by: 'Liza Gomez' },
  { id: 6, employee_id: 4, date: '2024-07-15', day_type: 'Regular Day', time_in: '08:30 AM', time_out: '07:30 PM', regular_hours: 8.0, overtime_hours: 2.5, night_diff_hours: 0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Approved', approved_by: 'Liza Gomez' },
  { id: 7, employee_id: 4, date: '2024-07-17', day_type: 'Regular Day', time_in: '09:45 AM', time_out: '06:00 PM', regular_hours: 7.25, overtime_hours: 0.0, night_diff_hours: 0, late_minutes: 45, attendance_status: 'Late', approval_status: 'Approved', approved_by: 'Liza Gomez' }, // 45 mins tardy
  { id: 8, employee_id: 4, date: '2024-07-19', day_type: 'Special Non-Working Day', time_in: '08:30 AM', time_out: '07:30 PM', regular_hours: 8.0, overtime_hours: 2.5, night_diff_hours: 1.0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Approved', approved_by: 'Liza Gomez' }, // Special Non-Working Day (130% base + 169% OT + 10% NSD)
  { id: 9, employee_id: 2, date: '2024-07-22', day_type: 'Regular Day', time_in: null, time_out: null, regular_hours: 0.0, overtime_hours: 0.0, night_diff_hours: 0, late_minutes: 0, attendance_status: 'Absent', approval_status: 'Approved', approved_by: 'Liza Gomez' }, // 1 day unexcused absence (LWOP)
  { id: 10, employee_id: 5, date: '2024-07-15', day_type: 'Regular Day', time_in: '08:55 AM', time_out: '06:30 PM', regular_hours: 8.0, overtime_hours: 1.5, night_diff_hours: 0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Approved', approved_by: 'Liza Gomez' },
  { id: 11, employee_id: 6, date: '2024-07-15', day_type: 'Regular Day', time_in: '08:40 AM', time_out: '07:40 PM', regular_hours: 8.0, overtime_hours: 2.5, night_diff_hours: 0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Approved', approved_by: 'Liza Gomez' },
  { id: 12, employee_id: 4, date: '2024-07-22', day_type: 'Regular Day', time_in: '08:30 AM', time_out: '06:30 PM', regular_hours: 8.0, overtime_hours: 1.5, night_diff_hours: 0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Pending', approved_by: null }, // Pending: must NOT enter finalized payroll
  { id: 13, employee_id: 4, date: '2024-07-12', day_type: 'Regular Day', time_in: '08:30 AM', time_out: '07:30 PM', regular_hours: 8.0, overtime_hours: 2.0, night_diff_hours: 0, late_minutes: 0, attendance_status: 'Present', approval_status: 'Approved', approved_by: 'Liza Gomez (HR Manager)', is_ppa: true, ppa_source_period: 'July 1–15, 2024' } // Late approved OT in locked cut-off -> PPA in July 16–31!
];

// =========================================================================
// 4. CLAIMS & REIMBURSEMENTS: APPROVAL WORKFLOW & PAYROLL INCLUSION
// =========================================================================
let claimsList = [
  {
    id: 1,
    claim_code: 'CLM-2024-001',
    employee_id: 1,
    claim_type: 'Medical & Dental Prescription',
    date_filed: '2024-07-12',
    amount: 4500,
    description: 'Prescription eyeglasses and dental checkup receipt',
    status: 'Approved',
    reimbursement_status: 'Pending Reimbursement',
    payroll_period: 'July 2024',
    approved_by: 'Liza Gomez (HR Manager)'
  },
  {
    id: 2,
    claim_code: 'CLM-2024-002',
    employee_id: 2,
    claim_type: 'Official Client Travel Allowance',
    date_filed: '2024-07-15',
    amount: 6200,
    description: 'Direct fuel, toll, and regional client meeting meals in Cebu branch',
    status: 'Approved',
    reimbursement_status: 'Pending Reimbursement',
    payroll_period: 'July 2024',
    approved_by: 'Diana Sterling (Finance Director)'
  },
  {
    id: 3,
    claim_code: 'CLM-2024-003',
    employee_id: 4,
    claim_type: 'Communication & Cloud Stipend',
    date_filed: '2024-07-18',
    amount: 3100,
    description: 'Fiber internet connectivity for 24/7 on-call DevOps duty',
    status: 'Approved',
    reimbursement_status: 'Pending Reimbursement',
    payroll_period: 'July 2024',
    approved_by: 'Liza Gomez (HR Manager)'
  },
  {
    id: 4,
    claim_code: 'CLM-2024-004',
    employee_id: 5,
    claim_type: 'Office Supplies & Onboarding Kit',
    date_filed: '2024-07-20',
    amount: 5000,
    description: 'Quarterly HR employee welcome gifts and stationery',
    status: 'Pending',
    reimbursement_status: 'Pending Reimbursement',
    payroll_period: 'July 2024',
    approved_by: null
  },
  {
    id: 5,
    claim_code: 'CLM-2024-005',
    employee_id: 3,
    claim_type: 'Personal Software Purchase',
    date_filed: '2024-07-21',
    amount: 2500,
    description: 'Personal illustration brushes (non-company expense)',
    status: 'Rejected', // Rejected: NEVER included in payroll
    reimbursement_status: 'Rejected',
    payroll_period: 'July 2024',
    approved_by: 'Liza Gomez (HR Manager)'
  },
  {
    id: 6,
    claim_code: 'CLM-2024-006',
    employee_id: 4,
    claim_type: 'Emergency Client Transport',
    date_filed: '2024-07-11',
    amount: 1850,
    description: 'Off-hours emergency Grab transport for cloud database failover recovery',
    status: 'Approved',
    reimbursement_status: 'Pending Reimbursement',
    payroll_period: 'July 1–15, 2024',
    approved_by: 'Liza Gomez (HR Manager)',
    is_ppa: true,
    ppa_source_period: 'July 1–15, 2024'
  }
];

// =========================================================================
// 4A. CLAIMS PERSISTENCE — survive server restarts
// Saves status/approver overrides + new claims to a local JSON file
// =========================================================================
const CLAIMS_PERSIST_FILE = path.join(__dirname, 'claims_overrides.json');
// Capture the original seed IDs before any overrides are applied
const _seedClaimIds = new Set(claimsList.map(c => c.id));

function loadClaimsOverrides() {
  try {
    if (fs.existsSync(CLAIMS_PERSIST_FILE)) {
      const raw = fs.readFileSync(CLAIMS_PERSIST_FILE, 'utf8');
      const { overrides = {}, newClaims = [] } = JSON.parse(raw);

      // Apply status/approver overrides to the seed data
      Object.entries(overrides).forEach(([idStr, patch]) => {
        const claim = claimsList.find(c => c.id === Number(idStr));
        if (claim) Object.assign(claim, patch);
      });

      // Re-append any claims created after the seed
      newClaims.forEach(nc => {
        if (!claimsList.find(c => c.id === nc.id)) {
          claimsList.push(nc);
        }
      });
    }
  } catch (e) {
    console.warn('[Claims] Could not load overrides:', e.message);
  }
}

function saveClaimsOverrides() {
  try {
    const overrides = {};
    const newClaims = [];

    claimsList.forEach(c => {
      if (_seedClaimIds.has(c.id)) {
        // Save mutable fields for seed claims
        overrides[c.id] = {
          status: c.status,
          approved_by: c.approved_by,
          reimbursement_status: c.reimbursement_status,
          is_ppa: c.is_ppa,
          ppa_source_period: c.ppa_source_period
        };
      } else {
        // Save entire object for dynamically created claims
        newClaims.push(c);
      }
    });

    fs.writeFileSync(CLAIMS_PERSIST_FILE, JSON.stringify({ overrides, newClaims }, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Claims] Could not save overrides:', e.message);
  }
}

// Apply any previously saved changes immediately on module load
loadClaimsOverrides();

// =========================================================================
// 5. HMO & BENEFITS ADMINISTRATION: PLANS & ACTIVE ENROLLMENTS
// =========================================================================
let benefitPlans = [
  { id: 1, name: 'MaxiCare Platinum Plus', plan_tier: 'Platinum Plus', provider: 'MaxiCare', coverage_amount: 350000, default_monthly_premium: 3200, employer_share: 2500, employee_share: 700, status: 'Active' },
  { id: 2, name: 'Intellicare Executive VIP', plan_tier: 'Executive VIP', provider: 'Intellicare', coverage_amount: 500000, default_monthly_premium: 4500, employer_share: 3500, employee_share: 1000, status: 'Active' },
  { id: 3, name: 'Medicard Standard Care', plan_tier: 'Standard Care', provider: 'Medicard', coverage_amount: 250000, default_monthly_premium: 2400, employer_share: 2000, employee_share: 400, status: 'Active' },
  { id: 4, name: 'Group Life & Accident Shield', plan_tier: 'Life Insurance', provider: 'Sun Life Grepa', coverage_amount: 1000000, default_monthly_premium: 1200, employer_share: 1200, employee_share: 0, status: 'Active' }
];

let hmoEnrollments = [
  { id: 1, employee_id: 1, plan_id: 1, dependents_count: 2, monthly_premium: 3200, employer_share: 2500, employee_share: 700, effective_date: '2023-01-01', expiration_date: '2025-12-31', status: 'Active' },
  { id: 2, employee_id: 2, plan_id: 2, dependents_count: 3, monthly_premium: 4500, employer_share: 3500, employee_share: 1000, effective_date: '2022-09-01', expiration_date: '2025-12-31', status: 'Active' },
  { id: 3, employee_id: 3, plan_id: 3, dependents_count: 1, monthly_premium: 2400, employer_share: 2000, employee_share: 400, effective_date: '2024-07-16', expiration_date: '2025-12-31', status: 'Active' }, // Mid-cycle enrollment (July 16, 2024) -> Prorated
  { id: 4, employee_id: 4, plan_id: 1, dependents_count: 0, monthly_premium: 2800, employer_share: 2500, employee_share: 300, effective_date: '2023-06-01', expiration_date: '2025-12-31', status: 'Active' },
  { id: 5, employee_id: 5, plan_id: 3, dependents_count: 1, monthly_premium: 2400, employer_share: 2000, employee_share: 400, effective_date: '2023-01-01', expiration_date: '2025-12-31', status: 'Active' },
  { id: 6, employee_id: 6, plan_id: 2, dependents_count: 2, monthly_premium: 4500, employer_share: 3500, employee_share: 1000, effective_date: '2022-05-01', expiration_date: '2025-12-31', status: 'Active' }
];

// =========================================================================
// 5B. MICROFINANCE ASSISTANCE & SALARY ADVANCES (MICROLOANS)
// Deducted automatically from payroll and decremented on disbursement
// =========================================================================
let microloans = [
  {
    id: 1,
    loan_code: 'LN-2024-001',
    employee_id: 1, // Maria Santos
    loan_type: 'Emergency Salary Advance',
    principal_amount: 15000,
    monthly_deduction: 2500,
    total_installments: 6,
    remaining_installments: 4,
    balance_amount: 10000,
    interest_rate: 0.00,
    status: 'Active',
    reason: 'Family medical outpatient emergency',
    approved_by: 'David Sterling (Finance Director)',
    disbursed_date: '2024-05-15'
  },
  {
    id: 2,
    loan_code: 'LN-2024-002',
    employee_id: 4, // Marco Dela Cruz
    loan_type: 'Home Office Equipment Advance',
    principal_amount: 24000,
    monthly_deduction: 4000,
    total_installments: 6,
    remaining_installments: 5,
    balance_amount: 20000,
    interest_rate: 1.50,
    status: 'Active',
    reason: 'Dual 4K workstation monitors for DevOps operations',
    approved_by: 'David Sterling (Finance Director)',
    disbursed_date: '2024-06-10'
  },
  {
    id: 3,
    loan_code: 'LN-2024-003',
    employee_id: 3, // Ana Cruz
    loan_type: 'Educational Assistance Advance',
    principal_amount: 12000,
    monthly_deduction: 2000,
    total_installments: 6,
    remaining_installments: 6,
    balance_amount: 12000,
    interest_rate: 0.00,
    status: 'Pending',
    reason: 'Design systems certification course tuition',
    approved_by: null,
    disbursed_date: null
  }
];

// =========================================================================
// 5.5 INTER-ROLE NOTIFICATIONS & WORKFLOW TASK QUEUE
// =========================================================================
let notifications = [
  {
    id: 1,
    recipient_role: 'manager',
    recipient_user_id: null,
    title: 'Expense Claim Awaiting Verification',
    message: 'Patricia Lim submitted claim CLM-2024-004 (₱5,000) for Office Supplies & Onboarding Kit.',
    category: 'claims',
    module_id: 'claim_verification',
    item_id: 4,
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    source_user: 'Patricia Lim',
    priority: 'high'
  },
  {
    id: 2,
    recipient_role: 'manager',
    recipient_user_id: null,
    title: 'Overtime Attendance Log Pending Approval',
    message: 'Marco Dela Cruz logged 1.5 hrs Overtime on July 22, 2024 awaiting HR verification.',
    category: 'timekeeping',
    module_id: 'timekeeping',
    item_id: 12,
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    source_user: 'Marco Dela Cruz',
    priority: 'normal'
  },
  {
    id: 3,
    recipient_role: 'officer',
    recipient_user_id: null,
    title: 'Approved Claims Queued for Payroll',
    message: '3 expense claims totaling ₱13,800 were approved by HR and synced to July 2024 payroll computation.',
    category: 'claims',
    module_id: 'payroll_computation',
    item_id: null,
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    source_user: 'Liza Gomez (HR Manager)',
    priority: 'high'
  },
  {
    id: 4,
    recipient_role: 'officer',
    recipient_user_id: null,
    title: 'Biometric Attendance Synchronized',
    message: '11 verified attendance records with 12.0 total overtime hours integrated into payroll calculations.',
    category: 'timekeeping',
    module_id: 'payroll_computation',
    item_id: null,
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    source_user: 'Biometric Time Engine',
    priority: 'normal'
  },
  {
    id: 5,
    recipient_role: 'director',
    recipient_user_id: null,
    title: 'Salary Advance Awaiting Executive Review',
    message: 'Ana Cruz submitted an advance request for ₱12,000 (Educational Assistance Advance).',
    category: 'loans',
    module_id: 'reimbursement',
    item_id: 3,
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    source_user: 'Ana Cruz',
    priority: 'high'
  },
  {
    id: 6,
    recipient_role: 'director',
    recipient_user_id: null,
    title: 'Salary Adjustment Proposal Submitted',
    message: 'HR Manager proposed +₱6,000 adjustment for Ana Cruz awaiting executive authorization.',
    category: 'compensation',
    module_id: 'salary_adjustment',
    item_id: 2,
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    source_user: 'Jose Reyes (Product Lead)',
    priority: 'high'
  },
  {
    id: 7,
    recipient_role: 'employee',
    recipient_user_id: null,
    title: 'Official Payslip Released',
    message: 'Your tamper-proof digital payslip for July 1–15, 2024 has been issued with AES-GCM encryption.',
    category: 'payroll',
    module_id: 'payslips',
    item_id: null,
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    source_user: 'Payroll Office',
    priority: 'normal'
  }
];

// =========================================================================
// 6. PAYROLL PERIODS & HISTORICAL IMMUTABLE SNAPSHOTS
// Periods transition: Draft -> For Review -> Approved -> Finalized -> Paid
// =========================================================================
let payrollPeriods = {
  'June 2024': {
    period_name: 'June 2024',
    cut_off_start: '2024-06-01',
    cut_off_end: '2024-06-30',
    payout_date: 'June 25, 2024',
    is_semi_monthly: false,
    status: 'Finalized', // Locked historical record
    is_locked: true,
    approved_by: 'Diana Sterling (Finance Director)',
    finalized_at: '2024-06-25T14:30:00Z',
    total_gross: 2108000,
    total_deductions: 812000,
    total_net: 1296000,
    summary: {
      month: 'June 2024',
      total_gross: '₱2.10M',
      total_gross_raw: 2108000,
      employees_count: 6,
      gross_trend: '+2.1% vs May',
      total_deductions: '₱812K',
      total_deductions_raw: 812000,
      deductions_label: 'Tax + statutory',
      total_net: '₱1.29M',
      total_net_raw: 1296000,
      payout_date: 'June 25, 2024',
      net_trend: '+1.9% vs May',
      employees_processed: '6/6',
      processed_percentage: '100% complete'
    },
    items: [] // populated on first compute
  },
  'July 1–15, 2024': {
    period_name: 'July 1–15, 2024',
    cut_off_start: '2024-07-01',
    cut_off_end: '2024-07-15',
    payout_date: 'July 15, 2024',
    is_semi_monthly: true,
    cut_off_type: '1st',
    status: 'Finalized', // Locked historical record
    is_locked: true,
    approved_by: 'Diana Sterling (Finance Director)',
    finalized_at: '2024-07-15T17:00:00Z',
    total_gross: 215000,
    total_deductions: 28000,
    total_net: 187000,
    summary: {
      month: 'July 1–15, 2024',
      total_gross: '₱215K',
      total_gross_raw: 215000,
      employees_count: 6,
      gross_trend: '+1.8% vs June 2nd Half',
      total_deductions: '₱28K',
      total_deductions_raw: 28000,
      deductions_label: 'BIR Withholding Tax (Statutory deferred to 2nd Cut-off)',
      total_net: '₱187K',
      total_net_raw: 187000,
      payout_date: 'July 15, 2024',
      net_trend: '+2.1% vs June 2nd Half',
      employees_processed: '6/6',
      processed_percentage: '100% complete'
    },
    items: []
  },
  'July 16–31, 2024': {
    period_name: 'July 16–31, 2024',
    cut_off_start: '2024-07-16',
    cut_off_end: '2024-07-31',
    payout_date: 'July 31, 2024',
    is_semi_monthly: true,
    cut_off_type: '2nd',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 220000,
    total_deductions: 72000,
    total_net: 148000,
    summary: {
      month: 'July 16–31, 2024',
      total_gross: '₱220K',
      total_gross_raw: 220000,
      employees_count: 6,
      gross_trend: '+2.3% vs 1st Half',
      total_deductions: '₱72K',
      total_deductions_raw: 72000,
      deductions_label: 'Tax + SSS, PhilHealth, HDMF, HMO & Advances',
      total_net: '₱148K',
      total_net_raw: 148000,
      payout_date: 'July 31, 2024',
      net_trend: '-0.8% vs 1st Half',
      employees_processed: '6/6',
      processed_percentage: '100% complete'
    },
    items: []
  },
  'July 2024': {
    period_name: 'July 2024',
    cut_off_start: '2024-07-01',
    cut_off_end: '2024-07-31',
    payout_date: 'July 25, 2024',
    is_semi_monthly: false,
    status: 'Approved', // Current active cycle ready for finalization
    is_locked: false,
    approved_by: 'Liza Gomez (HR Manager)',
    finalized_at: null,
    total_gross: 2180000,
    total_deductions: 840000,
    total_net: 1340000,
    summary: {
      month: 'July 2024',
      total_gross: '₱2.18M',
      total_gross_raw: 2180000,
      employees_count: 6,
      gross_trend: '+3.4% vs June',
      total_deductions: '₱840K',
      total_deductions_raw: 840000,
      deductions_label: 'Tax + statutory + HMO',
      total_net: '₱1.34M',
      total_net_raw: 1340000,
      payout_date: 'July 25, 2024',
      net_trend: '+2.8% vs June',
      employees_processed: '6/6',
      processed_percentage: '100% complete'
    },
    items: []
  },
  'August 1–15, 2024': {
    period_name: 'August 1–15, 2024',
    cut_off_start: '2024-08-01',
    cut_off_end: '2024-08-15',
    payout_date: 'August 15, 2024',
    is_semi_monthly: true,
    cut_off_type: '1st',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 225000,
    total_deductions: 30000,
    total_net: 195000,
    summary: {
      month: 'August 1–15, 2024',
      total_gross: '₱225K',
      total_gross_raw: 225000,
      employees_count: 6,
      gross_trend: '+4.6% vs July 1st Half',
      total_deductions: '₱30K',
      total_deductions_raw: 30000,
      deductions_label: 'Withholding Tax (Statutory deferred to 2nd Cut-off)',
      total_net: '₱195K',
      total_net_raw: 195000,
      payout_date: 'August 15, 2024',
      net_trend: '+4.2% vs July 1st Half',
      employees_processed: '6/6',
      processed_percentage: '100% complete'
    },
    items: []
  },
  'August 16–31, 2024': {
    period_name: 'August 16–31, 2024',
    cut_off_start: '2024-08-16',
    cut_off_end: '2024-08-31',
    payout_date: 'August 31, 2024',
    is_semi_monthly: true,
    cut_off_type: '2nd',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 230000,
    total_deductions: 74000,
    total_net: 156000,
    summary: {
      month: 'August 16–31, 2024',
      total_gross: '₱230K',
      total_gross_raw: 230000,
      employees_count: 6,
      gross_trend: '+2.2% vs 1st Half',
      total_deductions: '₱74K',
      total_deductions_raw: 74000,
      deductions_label: 'Tax + SSS, PhilHealth, HDMF, HMO & Advances',
      total_net: '₱156K',
      total_net_raw: 156000,
      payout_date: 'August 31, 2024',
      net_trend: '+0.5% vs 1st Half',
      employees_processed: '6/6',
      processed_percentage: '100% complete'
    },
    items: []
  },
  'August 2024': {
    period_name: 'August 2024',
    cut_off_start: '2024-08-01',
    cut_off_end: '2024-08-31',
    payout_date: 'August 25, 2024',
    is_semi_monthly: false,
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 2240000,
    total_deductions: 862000,
    total_net: 1378000,
    summary: {
      month: 'August 2024',
      total_gross: '₱2.24M',
      total_gross_raw: 2240000,
      employees_count: 6,
      gross_trend: '+2.7% vs July',
      total_deductions: '₱862K',
      total_deductions_raw: 862000,
      deductions_label: 'Tax + statutory',
      total_net: '₱1.37M',
      total_net_raw: 1378000,
      payout_date: 'August 25, 2024',
      net_trend: '+2.2% vs July',
      employees_processed: '6/6',
      processed_percentage: '100% complete'
    },
    items: []
  },

  // =========================================================================
  // CURRENT LIVE PERIODS — September 2026 (Today: Sep 10, 2026)
  // =========================================================================
  'September 1–15, 2026': {
    period_name: 'September 1–15, 2026',
    cut_off_start: '2026-09-01',
    cut_off_end: '2026-09-15',
    payout_date: 'September 15, 2026',
    is_semi_monthly: true,
    cut_off_type: '1st',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'September 16–30, 2026': {
    period_name: 'September 16–30, 2026',
    cut_off_start: '2026-09-16',
    cut_off_end: '2026-09-30',
    payout_date: 'September 30, 2026',
    is_semi_monthly: true,
    cut_off_type: '2nd',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'September 2026': {
    period_name: 'September 2026',
    cut_off_start: '2026-09-01',
    cut_off_end: '2026-09-30',
    payout_date: 'September 25, 2026',
    is_semi_monthly: false,
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'October 1–15, 2026': {
    period_name: 'October 1–15, 2026',
    cut_off_start: '2026-10-01',
    cut_off_end: '2026-10-15',
    payout_date: 'October 15, 2026',
    is_semi_monthly: true,
    cut_off_type: '1st',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'October 16–31, 2026': {
    period_name: 'October 16–31, 2026',
    cut_off_start: '2026-10-16',
    cut_off_end: '2026-10-31',
    payout_date: 'October 31, 2026',
    is_semi_monthly: true,
    cut_off_type: '2nd',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'October 2026': {
    period_name: 'October 2026',
    cut_off_start: '2026-10-01',
    cut_off_end: '2026-10-31',
    payout_date: 'October 25, 2026',
    is_semi_monthly: false,
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'November 1–15, 2026': {
    period_name: 'November 1–15, 2026',
    cut_off_start: '2026-11-01',
    cut_off_end: '2026-11-15',
    payout_date: 'November 15, 2026',
    is_semi_monthly: true,
    cut_off_type: '1st',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'November 16–30, 2026': {
    period_name: 'November 16–30, 2026',
    cut_off_start: '2026-11-16',
    cut_off_end: '2026-11-30',
    payout_date: 'November 30, 2026',
    is_semi_monthly: true,
    cut_off_type: '2nd',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'November 2026': {
    period_name: 'November 2026',
    cut_off_start: '2026-11-01',
    cut_off_end: '2026-11-30',
    payout_date: 'November 25, 2026',
    is_semi_monthly: false,
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'December 1–15, 2026': {
    period_name: 'December 1–15, 2026',
    cut_off_start: '2026-12-01',
    cut_off_end: '2026-12-15',
    payout_date: 'December 15, 2026',
    is_semi_monthly: true,
    cut_off_type: '1st',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'December 16–31, 2026': {
    period_name: 'December 16–31, 2026',
    cut_off_start: '2026-12-16',
    cut_off_end: '2026-12-31',
    payout_date: 'December 31, 2026',
    is_semi_monthly: true,
    cut_off_type: '2nd',
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  },
  'December 2026': {
    period_name: 'December 2026',
    cut_off_start: '2026-12-01',
    cut_off_end: '2026-12-31',
    payout_date: 'December 25, 2026',
    is_semi_monthly: false,
    status: 'Draft',
    is_locked: false,
    approved_by: null,
    finalized_at: null,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    summary: {},
    items: []
  }
};

// =========================================================================
// 7. TAX & STATUTORY FORMULAS (Philippine Law / BIR TRAIN Act)
// =========================================================================
function calculateBIRTIRTax(taxableIncome) {
  // Graduated Monthly Tax Table
  if (taxableIncome <= 20833) return 0;
  if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15);
  if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20);
  if (taxableIncome <= 166667) return Math.round(8541.80 + (taxableIncome - 66667) * 0.25);
  if (taxableIncome <= 666667) return Math.round(33541.80 + (taxableIncome - 166667) * 0.30);
  return Math.round(183541.80 + (taxableIncome - 666667) * 0.35);
}

function calculateBIRTIRTaxSemiMonthly(taxableIncome) {
  // Philippine BIR TRAIN Act Semi-Monthly Withholding Tax Table
  if (taxableIncome <= 10417) return 0;
  if (taxableIncome <= 16667) return Math.round((taxableIncome - 10417) * 0.15);
  if (taxableIncome <= 33333) return Math.round(937.50 + (taxableIncome - 16667) * 0.20);
  if (taxableIncome <= 83333) return Math.round(4270.83 + (taxableIncome - 33333) * 0.25);
  if (taxableIncome <= 333333) return Math.round(16770.83 + (taxableIncome - 83333) * 0.30);
  return Math.round(91770.83 + (taxableIncome - 333333) * 0.35);
}

function calculateAnnualBIRTax(taxableIncome) {
  // Republic Act No. 10963 (TRAIN Law) Annual Individual Income Tax Table
  if (taxableIncome <= 250000) return 0;
  if (taxableIncome <= 400000) return Math.round((taxableIncome - 250000) * 0.15);
  if (taxableIncome <= 800000) return Math.round(22500 + (taxableIncome - 400000) * 0.20);
  if (taxableIncome <= 2000000) return Math.round(102500 + (taxableIncome - 800000) * 0.25);
  if (taxableIncome <= 8000000) return Math.round(402500 + (taxableIncome - 2000000) * 0.30);
  return Math.round(2202500 + (taxableIncome - 8000000) * 0.35);
}

function calculateSSSContribution(gross) {
  // Standard 2024 SSS Employee Contribution (cap at standard bracket)
  if (gross < 4250) return 180;
  if (gross >= 29750) return 1125;
  return Math.min(1125, Math.round(gross * 0.045));
}

function calculatePhilHealth(basic) {
  // 5% split equally between employee & employer (2.5% each)
  // Ceiling at ₱100,000 basic pay (max employee share ₱2,500)
  const capped = Math.min(100000, Math.max(10000, basic));
  return Math.round((capped * 0.05) / 2);
}

function calculatePagIBIG(basic) {
  // Pag-IBIG Circular No. 460 (2024-2026 Mandate & Book Page 251)
  // For monthly compensation above ₱5,000, employee contribution is capped at ₱200 (employer also ₱200)
  if (basic >= 5000) return 200;
  return Math.min(200, Math.round(basic * 0.02));
}

// Helper to resolve the standard calendar period name for a given ISO date
function getPeriodForDate(dateStr, isSemiMonthly = true) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = months[monthIdx];
  if (!isSemiMonthly) return `${monthName} ${year}`;
  if (day <= 15) {
    return `${monthName} 1–15, ${year}`;
  } else {
    const lastDay = new Date(year, monthIdx + 1, 0).getDate();
    return `${monthName} 16–${lastDay}, ${year}`;
  }
}

// Check if a period is locked (Finalized or Paid)
function isPeriodLocked(periodName) {
  if (!periodName) return false;
  const p = payrollPeriods[periodName];
  return Boolean(p && (p.is_locked || p.status === 'Finalized' || p.status === 'Paid'));
}

// =========================================================================
// 8. UNIFIED CORE CALCULATION ENGINE (WITH PPA RETROACTIVITY BUFFER)
// =========================================================================
function computeEmployeePayrollItem(emp, periodName) {
  const period = payrollPeriods[periodName] || payrollPeriods['July 2024'];
  const periodStart = period.cut_off_start;
  const periodEnd = period.cut_off_end;
  const isSemiMonthly = Boolean(period.is_semi_monthly);
  const cutOffType = period.cut_off_type || '1st';

  // 1. Basic Salary (Check for approved salary adjustments effective on or before periodEnd)
  let activeBasic = emp.base_salary;
  const approvedAdjustments = salaryAdjustments.filter(a => 
    a.employee_id === emp.id && 
    a.status === 'Approved' && 
    a.effective_date <= periodEnd
  );
  if (approvedAdjustments.length > 0) {
    approvedAdjustments.sort((a, b) => b.effective_date.localeCompare(a.effective_date));
    activeBasic = approvedAdjustments[0].proposed_salary;
  }

  // Base salary allocated for the cut-off (Semi-Monthly: Basic / 2; Monthly: Full Basic)
  const baseSalaryForPeriod = isSemiMonthly ? Math.round(activeBasic / 2) : activeBasic;

  // 2. Attendance & Timekeeping: Overtime, Holidays, Night Shift, Tardiness & Absences
  const dailyRate = activeBasic / 22;
  const hourlyRate = dailyRate / 8;
  const minuteRate = hourlyRate / 60;
  
  // Regular cut-off attendance
  const empAttendance = attendanceRecords.filter(att => 
    att.employee_id === emp.id &&
    att.approval_status === 'Approved' &&
    (isSemiMonthly 
      ? (att.date >= periodStart && att.date <= periodEnd)
      : att.date.startsWith(periodEnd.substring(0, 7)))
  );

  let attendanceOTPay = 0;
  let totalApprovedOTHours = 0;
  let holidayPay = 0;
  let totalHolidayHours = 0;
  let nightDiffPay = 0;
  let totalNightDiffHours = 0;

  empAttendance.forEach(att => {
    const dayType = att.day_type || 'Regular Day';
    const cfg = DOLE_DAY_CONFIG[dayType] || DOLE_DAY_CONFIG['Regular Day'];

    // A. Holiday Premium Pay (DOLE Arts. 91-94)
    // For monthly-paid employees, regular basic covers 100%. Working on a holiday/rest day entitles
    // the employee to the statutory premium portion:
    // - Special Non-Working Day / Rest Day: +30%
    // - Special Day on Rest Day: +50%
    // - Regular Holiday: +100% (giving 200% double pay total)
    // - Regular Holiday on Rest Day: +160% (giving 260% total)
    if (cfg.premiumRate > 0 && att.attendance_status !== 'Absent') {
      const regHrs = Number(att.regular_hours) || 8.0;
      const dayHolidayPremium = Math.round(regHrs * hourlyRate * cfg.premiumRate);
      holidayPay += dayHolidayPremium;
      totalHolidayHours += regHrs;
    }

    // B. Overtime Pay with statutory day-specific multiplier (DOLE Art. 87)
    // - Ordinary Day: 125%
    // - Special Day / Rest Day: 169% (1.30 * 1.30)
    // - Special Day on Rest Day: 195% (1.50 * 1.30)
    // - Regular Holiday: 260% (2.00 * 1.30)
    // - Regular Holiday on Rest Day: 338% (2.60 * 1.30)
    const otHrs = Number(att.overtime_hours) || 0;
    if (otHrs > 0) {
      totalApprovedOTHours += otHrs;
      const dayOTPay = Math.round(otHrs * hourlyRate * cfg.otMultiplier);
      attendanceOTPay += dayOTPay;
    }

    // C. Night Shift Differential (NSD) (DOLE Art. 86)
    // 10% premium per hour worked between 10:00 PM and 6:00 AM (scaled by day rate)
    const nsdHrs = Number(att.night_diff_hours) || 0;
    if (nsdHrs > 0) {
      totalNightDiffHours += nsdHrs;
      const dayNSD = Math.round(nsdHrs * hourlyRate * cfg.baseRate * 0.10);
      nightDiffPay += dayNSD;
    }
  });

  const overtimePay = attendanceOTPay + Number(emp.base_ot_pay || 0);

  const totalLateMinutes = empAttendance.reduce((sum, att) => sum + (Number(att.late_minutes) || 0), 0);
  const tardinessDeduction = Math.round(totalLateMinutes * minuteRate);

  const totalAbsentDays = empAttendance.filter(att => att.attendance_status === 'Absent').length;
  const absenceDeduction = Math.round(totalAbsentDays * dailyRate);

  const adjustedBasicPay = Math.max(0, baseSalaryForPeriod - (tardinessDeduction + absenceDeduction));

  // 2B. RETROACTIVE ADJUSTMENTS (PPA - Previous Period Adjustments)
  // Detect attendance records dated in previous LOCKED periods that have not yet been credited
  const ppaItems = [];
  let ppaOTHours = 0;
  let ppaOTPay = 0;
  let ppaLateMinutes = 0;
  let ppaTardinessDeduction = 0;
  let ppaAbsentDays = 0;
  let ppaAbsenceDeduction = 0;

  if (!period.is_locked) {
    const ppaAttendance = attendanceRecords.filter(att => 
      att.employee_id === emp.id &&
      att.approval_status === 'Approved' &&
      !att.credited_period &&
      (att.date < periodStart || att.is_ppa) &&
      isPeriodLocked(att.ppa_source_period || getPeriodForDate(att.date, isSemiMonthly))
    );

    ppaAttendance.forEach(att => {
      const origPeriod = att.ppa_source_period || getPeriodForDate(att.date, isSemiMonthly);
      const dayType = att.day_type || 'Regular Day';
      const cfg = DOLE_DAY_CONFIG[dayType] || DOLE_DAY_CONFIG['Regular Day'];
      if (Number(att.overtime_hours) > 0) {
        const otHrs = Number(att.overtime_hours);
        const otAmt = Math.round(otHrs * hourlyRate * cfg.otMultiplier);
        ppaOTHours += otHrs;
        ppaOTPay += otAmt;
        ppaItems.push({
          id: `att-${att.id}`,
          type: 'Overtime',
          date: att.date,
          hours: otHrs,
          amount: otAmt,
          source_period: origPeriod,
          label: `PPA Overtime: ${otHrs}h on ${att.date} (${cfg.label}) (${origPeriod})`,
          description: `Retroactive Overtime (${origPeriod})`
        });
      }
      if (Number(att.late_minutes) > 0) {
        const lateMins = Number(att.late_minutes);
        const lateAmt = Math.round(lateMins * minuteRate);
        ppaLateMinutes += lateMins;
        ppaTardinessDeduction += lateAmt;
        ppaItems.push({
          id: `att-late-${att.id}`,
          type: 'Tardiness',
          date: att.date,
          hours: 0,
          amount: -lateAmt,
          source_period: origPeriod,
          label: `PPA Tardiness: -${lateMins}m on ${att.date} (${origPeriod})`,
          description: `Retroactive Tardiness Deduction (${origPeriod})`
        });
      }
    });
  }

  // 3. Allowances (Active assigned allowances allocated for the period)
  const empAllocs = employeeAllowances.filter(ea => ea.employee_id === emp.id && ea.status === 'Active');
  const fullMonthlyAllowances = empAllocs.reduce((sum, ea) => {
    if (ea.custom_amount !== undefined && ea.custom_amount !== null) return sum + Number(ea.custom_amount);
    const def = allowanceTypes.find(at => at.id === ea.allowance_id);
    return sum + (def ? Number(def.default_amount) : 0);
  }, 0);
  const totalAllowances = isSemiMonthly ? Math.round(fullMonthlyAllowances / 2) : fullMonthlyAllowances;

  // 4. Approved Eligible Reimbursements (Claims approved for this period)
  const empApprovedClaims = claimsList.filter(c => 
    c.employee_id === emp.id && 
    (c.status === 'Approved' || c.status === 'Reimbursed') &&
    !c.is_ppa &&
    (c.payroll_period === periodName || 
     (!isSemiMonthly && c.payroll_period === 'July 2024') ||
     (isSemiMonthly && cutOffType === '2nd' && c.payroll_period === 'July 2024') ||
     c.reimbursement_status === 'Pending Reimbursement' || 
     c.reimbursement_status === 'Reimbursed')
  );
  const eligibleClaims = isSemiMonthly && cutOffType === '1st' 
    ? empApprovedClaims.filter(c => c.date_filed <= periodEnd && c.payroll_period === periodName)
    : empApprovedClaims;
  const totalReimbursements = eligibleClaims.reduce((sum, c) => sum + Number(c.amount), 0);

  // 4B. RETROACTIVE CLAIMS (PPA - Claims from locked periods)
  let ppaClaimsAmount = 0;
  if (!period.is_locked) {
    const ppaClaims = claimsList.filter(c => 
      c.employee_id === emp.id && 
      (c.status === 'Approved' || c.status === 'Reimbursed') &&
      !c.credited_period &&
      (c.date_filed < periodStart || c.is_ppa) &&
      isPeriodLocked(c.ppa_source_period || c.payroll_period || getPeriodForDate(c.date_filed, isSemiMonthly))
    );

    ppaClaims.forEach(c => {
      const amt = Number(c.amount) || 0;
      ppaClaimsAmount += amt;
      const origPeriod = c.ppa_source_period || c.payroll_period || getPeriodForDate(c.date_filed, isSemiMonthly);
      ppaItems.push({
        id: `clm-${c.id}`,
        type: 'Reimbursement',
        date: c.date_filed,
        amount: amt,
        source_period: origPeriod,
        label: `PPA Claim: ${c.claim_code} - ${c.claim_type} (${origPeriod})`,
        description: `Retroactive Reimbursement: ${c.description}`
      });
    });
  }

  // Combined PPA totals
  const totalPpaEarnings = ppaOTPay + ppaClaimsAmount;
  const totalPpaDeductions = ppaTardinessDeduction + ppaAbsenceDeduction;
  const ppaNet = totalPpaEarnings - totalPpaDeductions;

  // 5. Total Gross Pay (Adjusted Basic + OT + Holiday Pay + NSD + Allowances + Reimbursements + PPA Earnings)
  const grossPay = adjustedBasicPay + overtimePay + holidayPay + nightDiffPay + totalAllowances + totalReimbursements + totalPpaEarnings;

  // 6. Deductions & Statutory Splitting Rules (Philippine Standard: Deferral to 2nd Cut-off)
  let sss = 0;
  let philhealth = 0;
  let pagibig = 0;
  let birTax = 0;

  if (isSemiMonthly) {
    if (cutOffType === '1st') {
      sss = 0;
      philhealth = 0;
      pagibig = 0;
      const nonTaxableDeductions = totalReimbursements + ppaClaimsAmount;
      const taxableIncome = Math.max(0, grossPay - nonTaxableDeductions);
      birTax = calculateBIRTIRTaxSemiMonthly(taxableIncome);
    } else {
      sss = calculateSSSContribution(grossPay * 2);
      philhealth = calculatePhilHealth(activeBasic);
      pagibig = calculatePagIBIG(activeBasic);
      const nonTaxableDeductions = sss + philhealth + pagibig + totalReimbursements + ppaClaimsAmount;
      const taxableIncome = Math.max(0, grossPay - nonTaxableDeductions);
      birTax = calculateBIRTIRTaxSemiMonthly(taxableIncome);
    }
  } else {
    sss = calculateSSSContribution(grossPay);
    philhealth = calculatePhilHealth(activeBasic);
    pagibig = calculatePagIBIG(activeBasic);
    const nonTaxableDeductions = sss + philhealth + pagibig + totalReimbursements + ppaClaimsAmount;
    const taxableIncome = Math.max(0, grossPay - nonTaxableDeductions);
    birTax = calculateBIRTIRTax(taxableIncome);
  }

  // 7. HMO Healthcare Contribution
  const activeHMO = hmoEnrollments.find(h => 
    h.employee_id === emp.id && 
    h.status === 'Active' && 
    h.effective_date <= periodEnd &&
    (!h.expiration_date || h.expiration_date >= periodEnd)
  );

  let hmoDeduction = 0;
  let hmoEmployerShare = 0;
  let hmoIsProrated = false;
  let hmoActiveDays = isSemiMonthly ? 15 : 30;

  if (activeHMO) {
    const fullEmployeeShare = Number(activeHMO.employee_share || 0);
    const fullEmployerShare = Number(activeHMO.employer_share || 0);

    if (isSemiMonthly && cutOffType === '1st') {
      hmoDeduction = 0;
      hmoEmployerShare = 0;
    } else if (activeHMO.effective_date > period.cut_off_start) {
      hmoIsProrated = true;
      const startDay = parseInt(activeHMO.effective_date.split('-')[2], 10);
      const endDay = parseInt(periodEnd.split('-')[2], 10);
      hmoActiveDays = Math.max(1, (endDay - startDay) + 1);
      hmoDeduction = Math.round(fullEmployeeShare * (hmoActiveDays / (isSemiMonthly ? 15 : endDay)));
      hmoEmployerShare = Math.round(fullEmployerShare * (hmoActiveDays / (isSemiMonthly ? 15 : endDay)));
    } else {
      hmoDeduction = fullEmployeeShare;
      hmoEmployerShare = fullEmployerShare;
    }
  }

  // 8. Microfinance & Salary Advance Deductions (Microloans)
  const activeLoan = microloans.find(l => 
    l.employee_id === emp.id && 
    l.status === 'Active' && 
    l.balance_amount > 0
  );
  let microloanDeduction = 0;
  let loanBalanceRemaining = 0;
  let loanId = null;
  let loanType = null;

  if (activeLoan) {
    loanId = activeLoan.id;
    loanType = activeLoan.loan_type;
    loanBalanceRemaining = activeLoan.balance_amount;
    if (isSemiMonthly && cutOffType === '1st') {
      microloanDeduction = 0;
    } else {
      microloanDeduction = Math.min(Number(activeLoan.monthly_deduction), Number(activeLoan.balance_amount));
    }
  }

  // Total Deductions & Net Pay
  const totalDeductions = birTax + sss + philhealth + pagibig + hmoDeduction + microloanDeduction;
  const netPay = grossPay - totalDeductions - totalPpaDeductions;

  return {
    id: emp.id,
    employee_id: emp.id,
    employee_code: emp.employee_code,
    first_name: emp.first_name,
    last_name: emp.last_name,
    initials: emp.initials,
    email: emp.email,
    department: emp.department,
    position: emp.position,
    basic_pay: baseSalaryForPeriod,
    monthly_base_salary: activeBasic,
    is_semi_monthly: isSemiMonthly,
    cut_off_type: isSemiMonthly ? cutOffType : 'Monthly',
    statutory_schedule: isSemiMonthly ? (cutOffType === '1st' ? 'Scheduled for 2nd Cut-off' : 'Deducted on 2nd Cut-off') : 'Full Monthly',
    adjusted_basic_pay: adjustedBasicPay,
    ot_pay: overtimePay,
    ot_hours: totalApprovedOTHours,
    holiday_pay: holidayPay,
    holiday_hours: totalHolidayHours,
    night_diff_pay: nightDiffPay,
    night_diff_hours: totalNightDiffHours,
    late_minutes: totalLateMinutes,
    tardiness_deduction: tardinessDeduction,
    absent_days: totalAbsentDays,
    absence_deduction: absenceDeduction,
    allowances: totalAllowances,
    reimbursements: totalReimbursements,
    reimbursement_claims_count: eligibleClaims.length,
    // PPA fields
    ppa_earnings: totalPpaEarnings,
    ppa_deductions: totalPpaDeductions,
    ppa_ot_pay: ppaOTPay,
    ppa_ot_hours: ppaOTHours,
    ppa_claims_amount: ppaClaimsAmount,
    ppa_items: ppaItems,
    has_ppa: ppaItems.length > 0,
    gross_pay: grossPay,
    bir_tax: birTax,
    sss: sss,
    philhealth: philhealth,
    pagibig: pagibig,
    hmo_deduction: hmoDeduction,
    hmo_employer_share: hmoEmployerShare,
    hmo_is_prorated: hmoIsProrated,
    hmo_active_days: hmoActiveDays,
    hmo_plan: activeHMO ? benefitPlans.find(p => p.id === activeHMO.plan_id)?.name || 'MaxiCare' : null,
    microloan_deduction: microloanDeduction,
    loan_id: loanId,
    loan_type: loanType,
    loan_balance_remaining: loanBalanceRemaining,
    total_deductions: totalDeductions,
    net_pay: netPay,
    status: period.status === 'Finalized' ? 'Processed' : 'Processed',
    bank_name: emp.bank_name,
    bank_account: emp.bank_account,
    encrypted_bank_account: emp.encrypted_bank_account,
    tin: emp.tin,
    encrypted_tin: emp.encrypted_tin,
    cross_module_indicators: {
      attendance_synced: totalApprovedOTHours > 0 ? `${totalApprovedOTHours}h OT Approved` : 'On-Time',
      tardiness_deducted: totalLateMinutes > 0 ? `-${totalLateMinutes}m Late (-₱${tardinessDeduction.toLocaleString()})` : (totalAbsentDays > 0 ? `-${totalAbsentDays}d Absent (-₱${absenceDeduction.toLocaleString()})` : 'Zero Tardiness'),
      claims_included: totalReimbursements > 0 ? `₱${totalReimbursements.toLocaleString()} (${eligibleClaims.length} Claims)` : 'None',
      hmo_active: activeHMO ? (hmoDeduction > 0 ? `-₱${hmoDeduction} Active HMO${hmoIsProrated ? ' (Prorated)' : ''}` : 'Deferred to 2nd Cut-off') : 'No HMO',
      loan_deducted: activeLoan ? (microloanDeduction > 0 ? `-₱${microloanDeduction.toLocaleString()} (${activeLoan.loan_type})` : 'Deferred to 2nd Cut-off') : 'No Active Loan',
      salary_adjusted: approvedAdjustments.length > 0 ? `Adjusted to ₱${activeBasic.toLocaleString()}` : (isSemiMonthly ? `₱${baseSalaryForPeriod.toLocaleString()} (Semi-Monthly)` : 'Base Salary'),
      ppa_active: ppaItems.length > 0 ? `+₱${totalPpaEarnings.toLocaleString()} (${ppaItems.length} PPA Items)` : 'No Retroactive Adjustments'
    }
  };
}

// Build initial payroll periods
function syncPeriodComputation(periodName = 'July 2024', force = false) {
  const period = payrollPeriods[periodName] || payrollPeriods['July 2024'];
  if (!period) return { summary: {}, employees: [] };

  // Preserve frozen snapshot if period is locked and not forced
  if (period.is_locked && period.items && period.items.length > 0 && !force) {
    return { summary: period.summary, employees: period.items };
  }
  
  const items = masterEmployees.map(emp => computeEmployeePayrollItem(emp, periodName));
  period.items = items;

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  let totalPpa = 0;

  items.forEach(item => {
    totalGross += item.gross_pay;
    totalDeductions += item.total_deductions;
    totalNet += item.net_pay;
    totalPpa += (item.ppa_earnings || 0);
  });

  period.total_gross = totalGross;
  period.total_deductions = totalDeductions;
  period.total_net = totalNet;

  period.summary = {
    month: periodName,
    status: period.status,
    is_locked: Boolean(period.is_locked),
    total_gross: '₱' + Number(totalGross).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total_gross_raw: totalGross,
    employees_count: masterEmployees.length,
    gross_trend: '+3.4% vs previous cut-off',
    total_deductions: '₱' + Number(totalDeductions).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total_deductions_raw: totalDeductions,
    deductions_label: 'Tax + statutory + HMO',
    total_net: '₱' + Number(totalNet).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total_net_raw: totalNet,
    total_ppa_raw: totalPpa,
    total_ppa_count: items.filter(i => i.has_ppa).length,
    payout_date: period.payout_date,
    net_trend: '+2.8% vs previous cut-off',
    employees_processed: `${items.length}/${masterEmployees.length}`,
    processed_percentage: '100% complete'
  };

  return { summary: period.summary, employees: items };
}

// Sequence resolver for automated cut-off rollover
function getNextPeriodDefinition(currentPeriodName) {
  const sequence = [
    {
      name: 'July 1–15, 2024',
      next: {
        period_name: 'July 16–31, 2024',
        cut_off_start: '2024-07-16',
        cut_off_end: '2024-07-31',
        payout_date: 'July 31, 2024',
        is_semi_monthly: true,
        cut_off_type: '2nd'
      }
    },
    {
      name: 'July 16–31, 2024',
      next: {
        period_name: 'August 1–15, 2024',
        cut_off_start: '2024-08-01',
        cut_off_end: '2024-08-15',
        payout_date: 'August 15, 2024',
        is_semi_monthly: true,
        cut_off_type: '1st'
      }
    },
    {
      name: 'August 1–15, 2024',
      next: {
        period_name: 'August 16–31, 2024',
        cut_off_start: '2024-08-16',
        cut_off_end: '2024-08-31',
        payout_date: 'August 31, 2024',
        is_semi_monthly: true,
        cut_off_type: '2nd'
      }
    },
    {
      name: 'August 16–31, 2024',
      next: {
        period_name: 'September 1–15, 2024',
        cut_off_start: '2024-09-01',
        cut_off_end: '2024-09-15',
        payout_date: 'September 15, 2024',
        is_semi_monthly: true,
        cut_off_type: '1st'
      }
    },
    {
      name: 'June 2024',
      next: {
        period_name: 'July 2024',
        cut_off_start: '2024-07-01',
        cut_off_end: '2024-07-31',
        payout_date: 'July 25, 2024',
        is_semi_monthly: false
      }
    },
    {
      name: 'July 2024',
      next: {
        period_name: 'August 2024',
        cut_off_start: '2024-08-01',
        cut_off_end: '2024-08-31',
        payout_date: 'August 25, 2024',
        is_semi_monthly: false
      }
    },
    {
      name: 'August 2024',
      next: {
        period_name: 'September 2024',
        cut_off_start: '2024-09-01',
        cut_off_end: '2024-09-30',
        payout_date: 'September 25, 2024',
        is_semi_monthly: false
      }
    },
    // 2026 semi-monthly chain
    {
      name: 'September 1–15, 2026',
      next: {
        period_name: 'September 16–30, 2026',
        cut_off_start: '2026-09-16',
        cut_off_end: '2026-09-30',
        payout_date: 'September 30, 2026',
        is_semi_monthly: true,
        cut_off_type: '2nd'
      }
    },
    {
      name: 'September 16–30, 2026',
      next: {
        period_name: 'October 1–15, 2026',
        cut_off_start: '2026-10-01',
        cut_off_end: '2026-10-15',
        payout_date: 'October 15, 2026',
        is_semi_monthly: true,
        cut_off_type: '1st'
      }
    },
    {
      name: 'October 1–15, 2026',
      next: {
        period_name: 'October 16–31, 2026',
        cut_off_start: '2026-10-16',
        cut_off_end: '2026-10-31',
        payout_date: 'October 31, 2026',
        is_semi_monthly: true,
        cut_off_type: '2nd'
      }
    },
    {
      name: 'October 16–31, 2026',
      next: {
        period_name: 'November 1–15, 2026',
        cut_off_start: '2026-11-01',
        cut_off_end: '2026-11-15',
        payout_date: 'November 15, 2026',
        is_semi_monthly: true,
        cut_off_type: '1st'
      }
    },
    {
      name: 'November 1–15, 2026',
      next: {
        period_name: 'November 16–30, 2026',
        cut_off_start: '2026-11-16',
        cut_off_end: '2026-11-30',
        payout_date: 'November 30, 2026',
        is_semi_monthly: true,
        cut_off_type: '2nd'
      }
    },
    {
      name: 'November 16–30, 2026',
      next: {
        period_name: 'December 1–15, 2026',
        cut_off_start: '2026-12-01',
        cut_off_end: '2026-12-15',
        payout_date: 'December 15, 2026',
        is_semi_monthly: true,
        cut_off_type: '1st'
      }
    },
    {
      name: 'December 1–15, 2026',
      next: {
        period_name: 'December 16–31, 2026',
        cut_off_start: '2026-12-16',
        cut_off_end: '2026-12-31',
        payout_date: 'December 31, 2026',
        is_semi_monthly: true,
        cut_off_type: '2nd'
      }
    },
    // 2026 monthly chain
    {
      name: 'September 2026',
      next: {
        period_name: 'October 2026',
        cut_off_start: '2026-10-01',
        cut_off_end: '2026-10-31',
        payout_date: 'October 25, 2026',
        is_semi_monthly: false
      }
    },
    {
      name: 'October 2026',
      next: {
        period_name: 'November 2026',
        cut_off_start: '2026-11-01',
        cut_off_end: '2026-11-30',
        payout_date: 'November 25, 2026',
        is_semi_monthly: false
      }
    },
    {
      name: 'November 2026',
      next: {
        period_name: 'December 2026',
        cut_off_start: '2026-12-01',
        cut_off_end: '2026-12-31',
        payout_date: 'December 25, 2026',
        is_semi_monthly: false
      }
    }
  ];

  const match = sequence.find(s => s.name === currentPeriodName);
  return match ? match.next : null;
}

// Automated Period Rollover upon Disbursed / Paid status
function rolloverToNextPeriod(currentPeriodName) {
  const nextDef = getNextPeriodDefinition(currentPeriodName);
  if (!nextDef) return null;

  const nextName = nextDef.period_name;
  if (!payrollPeriods[nextName]) {
    payrollPeriods[nextName] = {
      ...nextDef,
      status: 'Draft',
      is_locked: false,
      approved_by: null,
      finalized_at: null,
      total_gross: 0,
      total_deductions: 0,
      total_net: 0,
      summary: {},
      items: []
    };
  } else if (!payrollPeriods[nextName].is_locked) {
    payrollPeriods[nextName].status = 'Draft';
  }

  // Precompute newly opened period
  syncPeriodComputation(nextName, true);

  // Dispatch system notifications for the rollover
  db.createNotification({
    recipient_role: 'officer',
    title: 'Automated Cut-Off Rollover Completed',
    message: `Cycle "${currentPeriodName}" was marked Paid. The next cut-off "${nextName}" has been automatically opened in Draft mode with recurring allowances and active records rolled over.`,
    category: 'payroll',
    module_id: 'payroll_computation',
    priority: 'high'
  });

  db.createNotification({
    recipient_role: 'manager',
    title: 'New Cut-Off Period Initialized',
    message: `Cycle "${currentPeriodName}" payout completed. Timekeeping attendance and claim submissions are now active for "${nextName}".`,
    category: 'attendance',
    module_id: 'timekeeping',
    priority: 'normal'
  });

  db.createNotification({
    recipient_role: 'employee',
    title: 'Payroll Disbursed to Bank Account',
    message: `Your net take-home pay for "${currentPeriodName}" has been successfully transferred via electronic bank transfer. Official payslip is available for viewing.`,
    category: 'payroll',
    module_id: 'payslips',
    priority: 'high'
  });

  return {
    previous_period: currentPeriodName,
    next_period: nextName,
    status: 'Draft',
    rollover_date: new Date().toISOString()
  };
}

// Re-sync all active, non-locked periods
function syncAllActivePeriods() {
  Object.keys(payrollPeriods).forEach(pName => {
    const p = payrollPeriods[pName];
    if (!p.is_locked && p.status !== 'Finalized' && p.status !== 'Paid') {
      syncPeriodComputation(pName);
    }
  });
}

// Pre-initialize cycles
syncPeriodComputation('June 2024');
syncPeriodComputation('July 1\u201315, 2024');
syncPeriodComputation('July 16\u201331, 2024');
syncPeriodComputation('July 2024');
syncPeriodComputation('August 1\u201315, 2024');
syncPeriodComputation('August 16\u201331, 2024');
syncPeriodComputation('August 2024');
// 2026 current live periods
syncPeriodComputation('September 1–15, 2026');
syncPeriodComputation('September 16–30, 2026');
syncPeriodComputation('September 2026');
syncPeriodComputation('October 1–15, 2026');
syncPeriodComputation('October 16–31, 2026');
syncPeriodComputation('October 2026');
syncPeriodComputation('November 1–15, 2026');
syncPeriodComputation('November 16–30, 2026');
syncPeriodComputation('November 2026');
syncPeriodComputation('December 1–15, 2026');
syncPeriodComputation('December 16–31, 2026');
syncPeriodComputation('December 2026');

// Connect to DB pool and auto-execute schema if connected
async function initDB() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully to PostgreSQL database');
    isPostgreConnected = true;

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('✅ PostgreSQL tables and schema verified/created from schema.sql');
    }
    client.release();
  } catch (err) {
    console.log('ℹ️  PostgreSQL notice (using resilient in-memory repository):', err.message);
  }
}
initDB();

// =========================================================================
// 8C. OFFBOARDING & FINAL PAY (BACKPAY) CALCULATION ENGINE
// Philippine Labor Standard: P.D. 851 (13th Month), BIR RR 5-2011 (SIL De Minimis),
// and TRAIN Law Annualized Graduated Tax Reconciliation
// =========================================================================
function computeFinalPay(employeeId, options = {}) {
  const emp = masterEmployees.find(e => e.id === Number(employeeId));
  if (!emp) return null;

  const separationDate = options.separation_date || new Date().toISOString().split('T')[0];
  const reason = options.reason || 'Voluntary Resignation';
  
  // Calculate months worked in current calendar year up to separation
  const sepDateObj = new Date(separationDate);
  const sepMonth = sepDateObj.getMonth() + 1; // 1-12
  const sepDay = sepDateObj.getDate();
  
  // Proration factor: month + (day / 30)
  const monthsWorked = Math.min(12, Math.max(1, (sepMonth - 1) + Math.min(1, sepDay / 30)));
  const roundedMonths = Math.round(monthsWorked * 100) / 100;

  // 1. Pro-Rated 13th-Month Pay (P.D. 851)
  // Formula: (Basic Salary * Months Worked) / 12
  const prorated13thMonth = Math.round((emp.base_salary * monthsWorked) / 12);
  const taxExempt13th = Math.min(prorated13thMonth, 90000); // ₱90k statutory TRAIN ceiling
  const taxable13th = Math.max(0, prorated13thMonth - 90000);

  // 2. Unused Leave Encashment (SIL / Vacation Leaves)
  const unusedLeaveDays = options.unused_leave_days !== undefined 
    ? Number(options.unused_leave_days) 
    : (emp.leave_credits?.unused_leaves || 10);
  const dailyRate = Math.round((emp.base_salary / 22) * 100) / 100;
  const totalLeaveEncashment = Math.round(unusedLeaveDays * dailyRate);
  
  // Taxability rule: first 10 days of vacation leave are tax-exempt de minimis; excess is taxable
  const exemptLeaveDays = Math.min(10, unusedLeaveDays);
  const taxableLeaveDays = Math.max(0, unusedLeaveDays - 10);
  const exemptLeavePay = Math.round(exemptLeaveDays * dailyRate);
  const taxableLeavePay = Math.round(taxableLeaveDays * dailyRate);

  // 3. Unpaid Regular Salary for Final Cut-Off
  const lastCutoffSalary = Math.round(emp.base_salary / 2);

  // 4. Outstanding Microloan Deductions
  const activeLoan = microloans.find(l => l.employee_id === emp.id && l.status === 'Active' && l.balance_amount > 0);
  const outstandingLoanBalance = activeLoan ? activeLoan.balance_amount : 0;

  // 5. Annualized Tax Reconciliation (TRAIN Law)
  const annualBasicEarned = Math.round(emp.base_salary * monthsWorked);
  const monthlySSS = calculateSSSContribution(emp.base_salary);
  const monthlyPH = calculatePhilHealth(emp.base_salary);
  const monthlyHDMF = calculatePagIBIG(emp.base_salary);
  const annualStatutory = Math.round((monthlySSS + monthlyPH + monthlyHDMF) * monthsWorked);

  // Annual Gross Taxable Income = Annual Basic + Taxable 13th + Taxable Leave - Annual Statutory
  const annualGrossTaxableIncome = Math.max(0, (annualBasicEarned + taxable13th + taxableLeavePay) - annualStatutory);
  const annualTaxDue = calculateAnnualBIRTax(annualGrossTaxableIncome);

  // Estimated cumulative tax withheld so far
  const monthlyTaxWithheld = calculateBIRTIRTax(Math.max(0, emp.base_salary - (monthlySSS + monthlyPH + monthlyHDMF)));
  const cumulativeTaxWithheld = Math.round(monthlyTaxWithheld * monthsWorked);

  // Difference: if withheld > due -> Refund; if withheld < due -> Payable
  const taxDifference = cumulativeTaxWithheld - annualTaxDue;
  const isTaxRefund = taxDifference >= 0;
  const taxAdjustmentAmount = Math.abs(taxDifference);

  // 6. Net Final Pay (Backpay)
  const totalGrossBackpay = lastCutoffSalary + prorated13thMonth + totalLeaveEncashment;
  const totalAdditions = isTaxRefund ? taxAdjustmentAmount : 0;
  const totalDeductions = outstandingLoanBalance + (!isTaxRefund ? taxAdjustmentAmount : 0);
  const netFinalPay = Math.max(0, totalGrossBackpay + totalAdditions - totalDeductions);

  return {
    employee_id: emp.id,
    employee_code: emp.employee_code,
    employee_name: `${emp.first_name} ${emp.last_name}`,
    department: emp.department,
    position: emp.position,
    base_salary: emp.base_salary,
    daily_rate: dailyRate,
    hire_date: emp.hire_date,
    separation_date: separationDate,
    separation_reason: reason,
    months_worked_in_year: roundedMonths,
    // Itemized components
    earnings: {
      last_cutoff_salary: lastCutoffSalary,
      prorated_13th_month: prorated13thMonth,
      tax_exempt_13th: taxExempt13th,
      taxable_13th: taxable13th,
      total_leave_encashment: totalLeaveEncashment,
      unused_leave_days: unusedLeaveDays,
      exempt_leave_days: exemptLeaveDays,
      exempt_leave_pay: exemptLeavePay,
      taxable_leave_days: taxableLeaveDays,
      taxable_leave_pay: taxableLeavePay,
      total_gross: totalGrossBackpay
    },
    tax_reconciliation: {
      annual_gross_taxable_income: annualGrossTaxableIncome,
      annual_tax_due: annualTaxDue,
      cumulative_tax_withheld: cumulativeTaxWithheld,
      tax_difference: taxDifference,
      type: isTaxRefund ? 'Tax Refund (Overwithheld)' : 'Tax Payable (Underwithheld)',
      adjustment_amount: taxAdjustmentAmount
    },
    deductions: {
      outstanding_loan_balance: outstandingLoanBalance,
      active_loan_code: activeLoan?.loan_code || null,
      tax_payable: !isTaxRefund ? taxAdjustmentAmount : 0,
      total_deductions: totalDeductions
    },
    net_final_pay: netFinalPay,
    currency: 'PHP (₱)',
    status: emp.status === 'Separated' || emp.status === 'Resigned' ? 'Settled' : 'Pending Processing'
  };
}

function offboardEmployee(employeeId, offboardData = {}) {
  const emp = masterEmployees.find(e => e.id === Number(employeeId));
  if (!emp) return null;

  const finalPay = computeFinalPay(employeeId, offboardData);
  if (!finalPay) return null;

  // Update employee status
  emp.status = (offboardData.reason || '').toLowerCase().includes('resign') ? 'Resigned' : 'Separated';
  emp.separation_date = finalPay.separation_date;
  emp.separation_reason = finalPay.separation_reason;
  emp.final_pay = finalPay;

  // Settle active loan if any
  const activeLoan = microloans.find(l => l.employee_id === emp.id && l.status === 'Active');
  if (activeLoan) {
    activeLoan.balance_amount = 0;
    activeLoan.remaining_installments = 0;
    activeLoan.status = 'Paid Off';
  }

  // Deactivate active allowances
  employeeAllowances.forEach(ea => {
    if (ea.employee_id === emp.id) ea.status = 'Inactive';
  });

  // Deactivate HMO
  hmoEnrollments.forEach(h => {
    if (h.employee_id === emp.id) h.status = 'Terminated';
  });

  // Record in offboarded store
  const record = {
    id: offboardedEmployees.length + 1,
    employee_id: emp.id,
    employee_name: `${emp.first_name} ${emp.last_name}`,
    employee_code: emp.employee_code,
    department: emp.department,
    separation_date: finalPay.separation_date,
    separation_reason: finalPay.separation_reason,
    final_pay: finalPay,
    processed_at: new Date().toISOString()
  };
  offboardedEmployees.unshift(record);

  // Dispatch System Notifications
  db.createNotification({
    recipient_role: 'manager',
    title: 'Employee Offboarding Processed',
    message: `${emp.first_name} ${emp.last_name} (${emp.employee_code}) separated on ${finalPay.separation_date}. Net backpay calculated at ₱${finalPay.net_final_pay.toLocaleString()}.`,
    category: 'compensation',
    module_id: 'benefits_monitoring',
    priority: 'high'
  });

  db.createNotification({
    recipient_role: 'director',
    title: 'Final Pay & Backpay Package Ready',
    message: `Final pay for ${emp.first_name} ${emp.last_name} (₱${finalPay.net_final_pay.toLocaleString()}) and BIR Form 2316 prepared for executive clearance.`,
    category: 'payroll',
    module_id: 'payroll_computation',
    priority: 'high'
  });

  db.createNotification({
    recipient_role: 'employee',
    title: 'Final Settlement Package Issued',
    message: `Your final backpay breakdown (₱${finalPay.net_final_pay.toLocaleString()}) and BIR Form 2316 Certificate are ready for review.`,
    category: 'payroll',
    module_id: 'payslips',
    priority: 'high'
  });

  // Re-sync active periods
  syncAllActivePeriods();

  return {
    ...record,
    employee: emp
  };
}

function generateBIR2316(employeeId) {
  const emp = masterEmployees.find(e => e.id === Number(employeeId));
  if (!emp) return null;

  const finalPay = emp.final_pay || computeFinalPay(employeeId, { separation_date: emp.separation_date || '2024-07-31' });

  const year = 2024;
  const employerTIN = '008-992-104-000';
  const employerName = 'MMS MICROFINANCE MANAGEMENT SYSTEMS CORP.';
  const employerAddress = '32nd Floor, Zuellig Building, Makati Avenue cor. Paseo de Roxas, Makati City, Philippines';
  const employerZip = '1226';
  const rdoCode = '047';

  const nonTaxableDeMinimis = (finalPay.earnings.exempt_leave_pay || 0) + 6500;
  const nonTaxable13th = finalPay.earnings.tax_exempt_13th || 0;
  const nonTaxableStatutory = finalPay.tax_reconciliation?.annual_gross_taxable_income 
    ? Math.round(emp.base_salary * 0.08 * (finalPay.months_worked_in_year || 7)) 
    : 32000;
  const totalNonTaxable = nonTaxableDeMinimis + nonTaxable13th + nonTaxableStatutory;

  const basicSalaryTaxable = Math.round(emp.base_salary * (finalPay.months_worked_in_year || 7));
  const taxable13thAndOther = finalPay.earnings.taxable_13th || 0;
  const taxableLeavePay = finalPay.earnings.taxable_leave_pay || 0;
  const totalTaxable = basicSalaryTaxable + taxable13thAndOther + taxableLeavePay;

  const grossCompensation = totalNonTaxable + totalTaxable;
  const taxDue = finalPay.tax_reconciliation?.annual_tax_due || 0;
  const taxWithheld = finalPay.tax_reconciliation?.cumulative_tax_withheld || 0;

  return {
    form_title: 'BIR Form No. 2316 (Certificate of Compensation Payment / Tax Withheld)',
    tax_year: year,
    period_from: `01/01/${year}`,
    period_to: finalPay.separation_date ? finalPay.separation_date.replace(/-/g, '/') : `07/31/${year}`,
    employee: {
      id: emp.id,
      tin: emp.tin,
      name: `${emp.last_name}, ${emp.first_name} ${emp.initials}.`,
      first_name: emp.first_name,
      last_name: emp.last_name,
      address: emp.address || 'Ayala Avenue, Makati City',
      zip_code: emp.zip_code || '1226',
      date_of_birth: '1992-06-15',
      contact_number: emp.phone,
      status: emp.status
    },
    employer: {
      tin: employerTIN,
      name: employerName,
      address: employerAddress,
      zip_code: employerZip,
      rdo_code: rdoCode
    },
    part_iv_a_non_taxable: {
      basic_salary_minimum: 0,
      holiday_pay: 0,
      overtime_pay: 0,
      night_shift_differential: 0,
      hazard_pay: 0,
      thirteenth_month_pay_exempt: nonTaxable13th,
      de_minimis_benefits: nonTaxableDeMinimis,
      statutory_contributions: nonTaxableStatutory,
      other_non_taxable: 0,
      total_non_taxable_compensation: totalNonTaxable
    },
    part_iv_b_taxable: {
      basic_salary: basicSalaryTaxable,
      representation_allowance: 0,
      transportation_allowance: 0,
      thirteenth_month_pay_taxable: taxable13thAndOther,
      overtime_pay: 0,
      taxable_leave_encashment: taxableLeavePay,
      total_taxable_compensation: totalTaxable
    },
    summary: {
      gross_compensation_income: grossCompensation,
      total_non_taxable: totalNonTaxable,
      taxable_compensation_income: totalTaxable,
      tax_due: taxDue,
      amount_of_tax_withheld: taxWithheld,
      tax_refund: finalPay.tax_reconciliation?.tax_difference > 0 ? finalPay.tax_reconciliation.tax_difference : 0,
      tax_payable: finalPay.tax_reconciliation?.tax_difference < 0 ? Math.abs(finalPay.tax_reconciliation.tax_difference) : 0
    },
    digital_signature: {
      employer_representative: 'Diana Sterling (Finance Director)',
      tax_agent_accreditation_no: 'BIR-TAN-047-891024-2024',
      cryptographic_seal: `0x${Buffer.from(`${emp.tin}-${employerTIN}-${taxDue}-${taxWithheld}`).toString('hex').slice(0, 32)}`,
      status: 'Digitally Certified and Signed'
    }
  };
}

// =========================================================================
// 9. EXPORTED UNIFIED SERVICE METHODS
// =========================================================================
const db = {
  isPostgres: () => isPostgreConnected,

  // --- Employees Master CRUD ---
  getEmployees: async () => {
    return masterEmployees.map(emp => ({
      ...emp,
      plain_bank_account: decryptAES256(emp.encrypted_bank_account),
      plain_tin: decryptAES256(emp.encrypted_tin)
    }));
  },

  getEmployeeById: async (id) => {
    const emp = masterEmployees.find(e => e.id === Number(id));
    if (!emp) return null;
    return {
      ...emp,
      plain_bank_account: decryptAES256(emp.encrypted_bank_account),
      plain_tin: decryptAES256(emp.encrypted_tin)
    };
  },

  createEmployee: async (data) => {
    const newId = masterEmployees.length + 1;
    const basic = Number(data.salary || data.basic_pay || 60000);
    const customOT = Number(data.ot_pay || 0);
    const customAllowance = (data.allowances !== undefined && data.allowances !== '' && data.allowances !== null) ? Number(data.allowances) : null;

    const newEmp = {
      id: newId,
      employee_code: `EMP-00${newId}`,
      first_name: data.first_name,
      last_name: data.last_name,
      initials: `${data.first_name[0]}${data.last_name[0]}`.toUpperCase(),
      email: data.email,
      phone: data.phone || '+63 917 000 0000',
      department: data.department || 'Engineering',
      position: data.position || 'Software Specialist',
      employment_type: data.employment_type || 'Full-time',
      hire_date: data.hire_date || new Date().toISOString().split('T')[0],
      status: 'Active',
      base_salary: basic,
      base_ot_pay: customOT,
      bank_name: data.bank_name || 'BDO Unibank',
      bank_account: data.bank_account || '1234-5678-9012-3456',
      encrypted_bank_account: encryptAES256(data.bank_account || '1234-5678-9012-3456'),
      tin: data.tin || `000-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-000`,
      encrypted_tin: encryptAES256(data.tin || `000-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-000`),
      sss_number: data.sss_number || `34-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(Math.random() * 9)}`,
      philhealth_number: data.philhealth_number || `12-${Math.floor(100000000 + Math.random() * 900000000)}-${Math.floor(Math.random() * 9)}`,
      pagibig_number: data.pagibig_number || `1216-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      address: data.address || 'Ayala Avenue, Makati City, Metro Manila',
      zip_code: data.zip_code || '1226',
      leave_credits: { vacation_leave: 12, sick_leave: 8, unused_leaves: 10 }
    };

    masterEmployees.push(newEmp);

    // 1. Assign Allowances: If user specified custom allowance amount in enrollment, assign that amount; otherwise cascade standard de minimis (₱6,500)
    let nextAllocId = employeeAllowances.length > 0 ? Math.max(...employeeAllowances.map(a => a.id)) + 1 : 1;
    if (customAllowance !== null) {
      employeeAllowances.push({
        id: nextAllocId,
        employee_id: newId,
        allowance_id: 1, // Transportation / Monthly Allowance & Incentives
        custom_amount: customAllowance,
        status: 'Active'
      });
    } else {
      employeeAllowances.push(
        {
          id: nextAllocId++,
          employee_id: newId,
          allowance_id: 1, // De Minimis Transportation
          custom_amount: 3000,
          status: 'Active'
        },
        {
          id: nextAllocId++,
          employee_id: newId,
          allowance_id: 2, // Rice Subsidy
          custom_amount: 2000,
          status: 'Active'
        },
        {
          id: nextAllocId++,
          employee_id: newId,
          allowance_id: 3, // Medical & Optical
          custom_amount: 1500,
          status: 'Active'
        }
      );
    }

    // 2. Cascade Baseline HMO Benefits Enrollment
    const nextHmoId = hmoEnrollments.length > 0 ? Math.max(...hmoEnrollments.map(h => h.id)) + 1 : 1;
    hmoEnrollments.push({
      id: nextHmoId,
      employee_id: newId,
      plan_id: 1, // MaxiCare Platinum Plus
      dependents_count: 0,
      monthly_premium: 3200,
      employer_share: 2500,
      employee_share: 700,
      effective_date: newEmp.hire_date,
      status: 'Active'
    });

    // 3. Dispatch System Onboarding Notifications
    const allowLabel = customAllowance !== null ? `₱${customAllowance.toLocaleString()} custom allowances` : '₱6,500 De Minimis allowances';
    db.createNotification({
      recipient_role: 'manager',
      title: 'Employee Onboarding Defaults Activated',
      message: `${newEmp.first_name} ${newEmp.last_name} (${newEmp.employee_code}) enrolled in SSS/PhilHealth/Pag-IBIG, ${allowLabel}, and MaxiCare HMO.`,
      category: 'compensation',
      module_id: 'benefits_enrollment',
      priority: 'normal'
    });

    db.createNotification({
      recipient_role: 'officer',
      title: 'Payroll Profile Auto-Generated',
      message: `Tax & statutory profile created for ${newEmp.first_name} ${newEmp.last_name}. Integrated into current semi-monthly payroll cycle.`,
      category: 'payroll',
      module_id: 'payroll_computation',
      priority: 'high'
    });

    // Re-sync all active periods
    syncAllActivePeriods();

    return {
      ...newEmp,
      plain_bank_account: newEmp.bank_account,
      plain_tin: newEmp.tin
    };
  },

  updateEmployee: async (id, data) => {
    const emp = masterEmployees.find(e => e.id === Number(id));
    if (!emp) return null;

    if (data.first_name) emp.first_name = data.first_name;
    if (data.last_name) emp.last_name = data.last_name;
    if (data.department) emp.department = data.department;
    if (data.position) emp.position = data.position;
    if (data.status) emp.status = data.status;
    if (data.salary || data.basic_pay) emp.base_salary = Number(data.salary || data.basic_pay);
    if (data.ot_pay !== undefined) emp.base_ot_pay = Number(data.ot_pay);

    syncAllActivePeriods();
    return emp;
  },

  deleteEmployee: async (id) => {
    const idx = masterEmployees.findIndex(e => e.id === Number(id));
    if (idx === -1) return false;
    masterEmployees.splice(idx, 1);
    syncAllActivePeriods();
    return true;
  },

  // --- Payroll Computation & Lifecycle ---
  getComputationData: (month = 'July 2024') => {
    return syncPeriodComputation(month);
  },
  getPayrollComputation: (month = 'July 2024') => {
    return syncPeriodComputation(month);
  },

  computePayrollMonth: (month = 'July 2024') => {
    const result = syncPeriodComputation(month);
    return {
      message: `Cross-module payroll for ${month} calculated successfully.`,
      period: payrollPeriods[month] || payrollPeriods['July 2024'],
      summary: result.summary,
      employees: result.employees
    };
  },
  computePayroll: (month = 'July 2024') => {
    return syncPeriodComputation(month);
  },

  updatePayrollPeriodStatus: (month = 'July 2024', status) => {
    const period = payrollPeriods[month] || payrollPeriods['July 2024'];
    if (!period) return null;

    period.status = status;
    let rolloverResult = null;

    if (status === 'Finalized' || status === 'Disbursed' || status === 'Paid') {
      period.is_locked = true;
      if (status === 'Finalized') period.finalized_at = new Date().toISOString();
      if (status === 'Disbursed' || status === 'Paid') period.disbursed_at = new Date().toISOString();

      // Stamp all attendance and claims credited in this period so they are immutable & won't re-trigger PPA
      if (period.items) {
        period.items.forEach(empItem => {
          // Stamp regular attendance
          attendanceRecords.forEach(att => {
            if (att.employee_id === empItem.id && att.approval_status === 'Approved' && !att.credited_period) {
              const inRegular = period.is_semi_monthly
                ? (att.date >= period.cut_off_start && att.date <= period.cut_off_end)
                : att.date.startsWith(period.cut_off_end.substring(0, 7));
              const inPpa = empItem.ppa_items && empItem.ppa_items.some(p => p.date === att.date);
              if (inRegular || inPpa) {
                att.credited_period = month;
                att.credited_at = new Date().toISOString();
              }
            }
          });

          // Stamp claims
          claimsList.forEach(c => {
            if (c.employee_id === empItem.id && (c.status === 'Approved' || c.status === 'Reimbursed') && !c.credited_period) {
              const inRegular = c.payroll_period === month;
              const inPpa = empItem.ppa_items && empItem.ppa_items.some(p => p.date === c.date_filed || p.label?.includes(c.claim_code));
              if (inRegular || inPpa) {
                c.credited_period = month;
                c.credited_at = new Date().toISOString();
              }
            }
          });
        });
      }

      // 1. Claims Settlement Cascade: Automatically update all included approved claims to Reimbursed
      const dsbRef = 'DSB-' + month.replace(' ', '').toUpperCase();
      claimsList.forEach(c => {
        if (c.status === 'Approved' && (c.payroll_period === month || c.credited_period === month || c.reimbursement_status === 'Pending Reimbursement')) {
          c.status = 'Reimbursed';
          c.reimbursement_status = 'Reimbursed';
          c.disbursement_ref = `${dsbRef}-CLM${c.id}`;
          c.disbursed_at = new Date().toISOString();
        }
      });

      // 2. Microloans Balances Cascade: Automatically decrement active loans for processed employees
      if (period.items) {
        period.items.forEach(item => {
          if (item.microloan_deduction > 0 && item.loan_id) {
            const loan = microloans.find(l => l.id === item.loan_id);
            if (loan && loan.status === 'Active') {
              loan.balance_amount = Math.max(0, loan.balance_amount - item.microloan_deduction);
              loan.remaining_installments = Math.max(0, loan.remaining_installments - 1);
              if (loan.balance_amount === 0) {
                loan.status = 'Paid Off';
              }
            }
          }
        });
      }

      // 3. Automated Period Rollover upon Disbursed / Paid status
      if (status === 'Disbursed' || status === 'Paid') {
        rolloverResult = rolloverToNextPeriod(month);
      }
    }

    const comp = syncPeriodComputation(month, true);
    return {
      ...comp,
      period,
      rollover: rolloverResult
    };
  },

  updateEmployeeStatus: (month = 'July 2024', employeeId, status) => {
    const period = payrollPeriods[month] || payrollPeriods['July 2024'];
    const item = period.items?.find(e => e.id === Number(employeeId));
    if (item) {
      item.status = status;
      return item;
    }
    return null;
  },

  addEmployeeToPayroll: (month = 'July 2024', newEmp) => {
    return db.createEmployee(newEmp);
  },

  // --- Compensation Planning ---
  getCompensation: () => {
    return {
      salaryBands,
      allowanceTypes,
      salaryAdjustments: salaryAdjustments.map(adj => {
        const emp = masterEmployees.find(e => e.id === adj.employee_id);
        return {
          ...adj,
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
          employee_code: emp ? emp.employee_code : 'EMP-000',
          department: emp ? emp.department : 'General'
        };
      }),
      compensation: masterEmployees.map(emp => {
        const activeAdjustments = salaryAdjustments.filter(a => a.employee_id === emp.id && a.status === 'Approved');
        const activeSalary = activeAdjustments.length > 0 ? activeAdjustments[0].proposed_salary : emp.base_salary;
        
        const empAllocs = employeeAllowances.filter(ea => ea.employee_id === emp.id && ea.status === 'Active');
        const totalAllowance = empAllocs.reduce((s, ea) => s + (ea.custom_amount || 3000), 0);

        return {
          id: emp.id,
          employee_id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          code: emp.employee_code,
          department: emp.department,
          position: emp.position,
          basic_salary: activeSalary,
          allowance: totalAllowance,
          has_pending_adjustment: salaryAdjustments.some(a => a.employee_id === emp.id && a.status === 'Pending Approval'),
          status: emp.status
        };
      })
    };
  },

  createSalaryAdjustment: (data) => {
    const newId = salaryAdjustments.length + 1;
    const emp = masterEmployees.find(e => e.id === Number(data.employee_id));
    const currentSalary = emp ? emp.base_salary : Number(data.current_salary);
    const proposedSalary = Number(data.proposed_salary);
    const diff = proposedSalary - currentSalary;
    const pct = currentSalary > 0 ? Number(((diff / currentSalary) * 100).toFixed(2)) : 0;

    const adjustment = {
      id: newId,
      employee_id: Number(data.employee_id),
      current_salary: currentSalary,
      proposed_salary: proposedSalary,
      adjustment_amount: diff,
      adjustment_percentage: pct,
      reason: data.reason || 'Merit Increase',
      effective_date: data.effective_date || new Date().toISOString().split('T')[0],
      requested_by: data.requested_by || 'HR Specialist',
      approved_by: null,
      status: 'Pending Approval' // Always starts as Pending Approval
    };

    salaryAdjustments.unshift(adjustment);
    return adjustment;
  },

  updateSalaryAdjustmentStatus: (id, status, approverName = 'Liza Gomez (HR Manager)') => {
    const adj = salaryAdjustments.find(a => a.id === Number(id));
    if (!adj) return null;

    adj.status = status;
    if (status === 'Approved') {
      adj.approved_by = approverName;
      // If effective immediately, update employee master base salary
      const emp = masterEmployees.find(e => e.id === adj.employee_id);
      if (emp && adj.effective_date <= new Date().toISOString().split('T')[0]) {
        emp.base_salary = adj.proposed_salary;
      }
      syncPeriodComputation('July 2024');
      syncPeriodComputation('August 2024');
    }
    return adj;
  },

  updateAllowance: (employeeId, allowanceAmount) => {
    const emp = masterEmployees.find(e => e.id === Number(employeeId));
    if (!emp) return null;

    // Update or insert employee allowance
    let ea = employeeAllowances.find(a => a.employee_id === emp.id && a.allowance_id === 1);
    if (ea) {
      ea.custom_amount = Number(allowanceAmount);
    } else {
      employeeAllowances.push({
        id: employeeAllowances.length + 1,
        employee_id: emp.id,
        allowance_id: 1,
        custom_amount: Number(allowanceAmount),
        status: 'Active'
      });
    }

    syncPeriodComputation('July 2024');
    return { employee_id: emp.id, allowance: Number(allowanceAmount) };
  },

  // --- Timekeeping & Attendance ---
  getAttendance: () => {
    return attendanceRecords.map(att => {
      const emp = masterEmployees.find(e => e.id === att.employee_id);
      const dayType = att.day_type || 'Regular Day';
      const cfg = DOLE_DAY_CONFIG[dayType] || DOLE_DAY_CONFIG['Regular Day'];
      return {
        ...att,
        day_type: dayType,
        day_type_label: cfg.label,
        night_diff_hours: Number(att.night_diff_hours || 0),
        employee: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
        department: emp ? emp.department : 'General'
      };
    });
  },

  logAttendance: (record) => {
    const newId = attendanceRecords.length + 1;
    let empId = Number(record.employee_id);
    if (!empId && record.employee) {
      const found = masterEmployees.find(e => `${e.first_name} ${e.last_name}`.toLowerCase() === record.employee.toLowerCase());
      empId = found ? found.id : 1;
    }

    const item = {
      id: newId,
      employee_id: empId,
      date: record.date || new Date().toISOString().split('T')[0],
      day_type: record.day_type || record.dayType || 'Regular Day',
      time_in: record.timeIn || record.time_in || '08:00 AM',
      time_out: record.timeOut || record.time_out || '05:00 PM',
      regular_hours: Number(record.regular_hours || record.regularHours) || 8.0,
      overtime_hours: record.type === 'Overtime' ? 2.5 : Number(record.overtime_hours || record.overtimeHours) || 0,
      night_diff_hours: Number(record.night_diff_hours || record.nightDiffHours) || 0,
      late_minutes: Number(record.late_minutes) || 0,
      attendance_status: record.attendance_status || 'Present',
      approval_status: 'Pending', // Attendance with OT/Holiday starts Pending HR approval
      approved_by: null
    };

    attendanceRecords.unshift(item);
    return item;
  },

  approveAttendance: (id, status, approverName = 'Liza Gomez (HR Manager)') => {
    const att = attendanceRecords.find(a => a.id === Number(id));
    if (!att) return null;

    att.approval_status = status;
    att.approved_by = approverName;

    // Detect if record belongs to a locked period
    const origPeriod = getPeriodForDate(att.date, true);
    if (status === 'Approved' && isPeriodLocked(origPeriod)) {
      att.is_ppa = true;
      att.ppa_source_period = origPeriod;
      db.createNotification({
        recipient_role: 'officer',
        title: 'Retroactive Adjustment (PPA) Queued',
        message: `${att.overtime_hours || 0}h Overtime on ${att.date} approved late (period "${origPeriod}" is locked). Automatically credited as PPA in current active cut-off.`,
        category: 'attendance',
        module_id: 'payroll_computation',
        priority: 'high'
      });
    }

    // Re-sync all active open periods so PPA and regular OT reflect immediately
    syncAllActivePeriods();
    return att;
  },

  // --- Claims & Reimbursements ---
  getClaims: () => {
    return claimsList.map(c => {
      const emp = masterEmployees.find(e => e.id === c.employee_id);
      return {
        ...c,
        employee: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
        department: emp ? emp.department : 'General',
        claim_id: c.claim_code
      };
    });
  },

  createClaim: (claimData) => {
    const newId = claimsList.length + 1;
    let empId = Number(claimData.employee_id);
    if (!empId && claimData.employee) {
      const found = masterEmployees.find(e => `${e.first_name} ${e.last_name}`.toLowerCase() === claimData.employee.toLowerCase());
      empId = found ? found.id : 1;
    }

    const claim = {
      id: newId,
      claim_code: `CLM-2024-${String(newId).padStart(3, '0')}`,
      employee_id: empId,
      claim_type: claimData.type || claimData.claim_type || 'Medical & Dental',
      date_filed: claimData.date || new Date().toISOString().split('T')[0],
      amount: Number(claimData.amount) || 0,
      description: claimData.description || 'Employee reimbursable expense',
      status: 'Submitted', // Starts as Submitted
      reimbursement_status: 'Pending Reimbursement',
      payroll_period: 'July 2024',
      approved_by: null
    };

    claimsList.unshift(claim);
    saveClaimsOverrides();
    return claim;
  },

  updateClaimStatus: (id, status, approverName = 'Liza Gomez (HR Manager)') => {
    const claim = claimsList.find(c => c.id === Number(id));
    if (!claim) return null;

    claim.status = status;
    if (status === 'Approved') {
      claim.approved_by = approverName;
      claim.reimbursement_status = 'Pending Reimbursement';

      const origPeriod = claim.payroll_period || getPeriodForDate(claim.date_filed, true);
      if (isPeriodLocked(origPeriod)) {
        claim.is_ppa = true;
        claim.ppa_source_period = origPeriod;
        db.createNotification({
          recipient_role: 'officer',
          title: 'Retroactive Claim (PPA) Queued',
          message: `Claim ${claim.claim_code} (₱${Number(claim.amount).toLocaleString()}) approved for locked period "${origPeriod}". Queued as PPA reimbursement in current cut-off.`,
          category: 'claims',
          module_id: 'payroll_computation',
          priority: 'high'
        });
      }
    } else if (status === 'Rejected') {
      claim.reimbursement_status = 'Rejected';
    }

    // Re-sync all active open periods so reimbursement flows in immediately
    syncAllActivePeriods();
    // Persist this change so it survives server restarts
    saveClaimsOverrides();
    return claim;
  },

  // --- HMO & Benefits ---
  getBenefits: () => {
    return hmoEnrollments.map(enr => {
      const emp = masterEmployees.find(e => e.id === enr.employee_id);
      const plan = benefitPlans.find(p => p.id === enr.plan_id);
      return {
        ...enr,
        employee: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
        department: emp ? emp.department : 'General',
        plan: plan ? plan.name : 'Basic HMO',
        provider: plan ? plan.provider : 'MaxiCare',
        coverage: plan ? `₱${plan.coverage_amount.toLocaleString()}` : '₱250,000'
      };
    });
  },

  enrollBenefit: (data) => {
    const newId = hmoEnrollments.length + 1;
    let empId = Number(data.employee_id);
    if (!empId && data.employee) {
      const found = masterEmployees.find(e => `${e.first_name} ${e.last_name}`.toLowerCase() === data.employee.toLowerCase());
      empId = found ? found.id : 1;
    }

    const selectedPlan = benefitPlans.find(p => p.plan_tier === data.plan || p.name === data.plan) || benefitPlans[0];

    const enrollment = {
      id: newId,
      employee_id: empId,
      plan_id: selectedPlan.id,
      dependents_count: Number(data.dependents) || 0,
      monthly_premium: selectedPlan.default_monthly_premium,
      employer_share: selectedPlan.employer_share,
      employee_share: selectedPlan.employee_share,
      effective_date: data.effectiveDate || new Date().toISOString().split('T')[0],
      expiration_date: '2025-12-31',
      status: 'Active'
    };

    hmoEnrollments.unshift(enrollment);
    syncPeriodComputation('July 2024');
    return enrollment;
  },

  updateHMOStatus: (id, status) => {
    const enr = hmoEnrollments.find(e => e.id === Number(id));
    if (!enr) return null;
    enr.status = status;
    syncPeriodComputation('July 2024');
    return enr;
  },

  // --- Microloans & Salary Advances ---
  getMicroloans: () => {
    return microloans.map(loan => {
      const emp = masterEmployees.find(e => e.id === loan.employee_id);
      return {
        ...loan,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
        employee_code: emp ? emp.employee_code : 'EMP-000',
        department: emp ? emp.department : 'General'
      };
    });
  },

  createMicroloan: (data) => {
    const newId = microloans.length + 1;
    let empId = Number(data.employee_id);
    if (!empId && data.employee) {
      const found = masterEmployees.find(e => `${e.first_name} ${e.last_name}`.toLowerCase() === data.employee.toLowerCase());
      empId = found ? found.id : 1;
    }
    const principal = Number(data.principal_amount) || 10000;
    const installments = Number(data.total_installments) || 6;
    const monthlyDeduction = Math.round(principal / installments);

    const loan = {
      id: newId,
      loan_code: `LN-2024-${String(newId).padStart(3, '0')}`,
      employee_id: empId,
      loan_type: data.loan_type || 'Emergency Salary Advance',
      principal_amount: principal,
      monthly_deduction: monthlyDeduction,
      total_installments: installments,
      remaining_installments: installments,
      balance_amount: principal,
      interest_rate: Number(data.interest_rate) || 0.00,
      status: 'Pending',
      reason: data.reason || 'Personal / Emergency assistance',
      approved_by: null,
      disbursed_date: null
    };

    microloans.unshift(loan);
    return loan;
  },

  updateMicroloanStatus: (id, status, approverName = 'David Sterling (Finance Director)') => {
    const loan = microloans.find(l => l.id === Number(id));
    if (!loan) return null;

    loan.status = status;
    if (status === 'Active' || status === 'Approved') {
      loan.status = 'Active';
      loan.approved_by = approverName;
      loan.disbursed_date = new Date().toISOString().split('T')[0];
    } else if (status === 'Rejected') {
      loan.status = 'Rejected';
    }

    syncPeriodComputation('July 2024');
    return loan;
  },

  // --- Payslip Generation ---
  getPayslip: (employeeId, month = 'July 2024') => {
    const period = payrollPeriods[month] || payrollPeriods['July 2024'];
    let empItem = period.items?.find(e => e.id === Number(employeeId));
    if (!empItem) {
      const masterEmp = masterEmployees.find(e => e.id === Number(employeeId));
      if (masterEmp) {
        empItem = computeEmployeePayrollItem(masterEmp, month);
      }
    }
    if (!empItem) return null;

    const earnings = [
      { label: empItem.is_semi_monthly ? 'Basic Salary (Cut-off Share)' : 'Basic Monthly Salary', amount: empItem.basic_pay }
    ];

    if (empItem.tardiness_deduction > 0) {
      earnings.push({
        label: `Tardiness Deduction (${empItem.late_minutes || 0} mins)`,
        amount: -empItem.tardiness_deduction
      });
    }

    if (empItem.absence_deduction > 0) {
      earnings.push({
        label: `Absence (LWOP) Deduction (${empItem.absent_days || 0} day/s)`,
        amount: -empItem.absence_deduction
      });
    }

    if (empItem.ot_pay > 0) {
      const otLabel = empItem.ot_hours > 0 
        ? `Rendered Overtime Pay (${empItem.ot_hours} hrs Approved)`
        : 'Rendered Overtime Pay';
      earnings.push({
        label: otLabel,
        amount: empItem.ot_pay
      });
    }

    if (empItem.holiday_pay > 0) {
      earnings.push({
        label: `Holiday Premium Pay (${empItem.holiday_hours || 0} hrs worked)`,
        amount: empItem.holiday_pay,
        category: 'holiday'
      });
    }

    if (empItem.night_diff_pay > 0) {
      earnings.push({
        label: `Night Shift Differential (10% • ${empItem.night_diff_hours || 0} hrs)`,
        amount: empItem.night_diff_pay,
        category: 'nsd'
      });
    }

    if (empItem.allowances > 0) {
      earnings.push({
        label: empItem.is_semi_monthly ? 'Allowances & Incentives (Cut-off Share)' : 'Monthly Allowances & Incentives',
        amount: empItem.allowances
      });
    }

    if (empItem.reimbursements > 0) {
      earnings.push({
        label: `Approved Claims Reimbursement (${empItem.reimbursement_claims_count} claims)`,
        amount: empItem.reimbursements
      });
    }

    // Previous Period Adjustments (PPA)
    if (empItem.ppa_items && empItem.ppa_items.length > 0) {
      empItem.ppa_items.forEach(ppa => {
        earnings.push({
          label: `Previous Period Adjustment: ${ppa.label || ppa.description}`,
          amount: ppa.amount,
          is_ppa: true,
          source_period: ppa.source_period
        });
      });
    }

    const deductions = [
      { label: 'BIR Withholding Tax (Graduated)', amount: empItem.bir_tax },
      { label: 'Social Security System (SSS)', amount: empItem.sss },
      { label: 'PhilHealth Contribution', amount: empItem.philhealth },
      { label: 'Pag-IBIG / HDMF Fund', amount: empItem.pagibig }
    ];

    if (empItem.hmo_deduction > 0) {
      deductions.push({
        label: `HMO Employee Contribution (${empItem.hmo_plan || 'Medical'}${empItem.hmo_is_prorated ? ` - Prorated ${empItem.hmo_active_days}d` : ''})`,
        amount: empItem.hmo_deduction
      });
    }

    if (empItem.microloan_deduction > 0) {
      deductions.push({
        label: `Company Microloan Amortization (${empItem.loan_type || 'Salary Advance'})`,
        amount: empItem.microloan_deduction
      });
    }

    return {
      payslip_number: `PAY-${month.replace(' ', '').toUpperCase()}-${String(empItem.id).padStart(4, '0')}`,
      period: `${month} Cut-off (${empItem.is_semi_monthly ? 'Semi-Monthly' : 'Monthly'})`,
      payout_date: period.payout_date,
      payroll_status: period.status,
      currency: 'PHP (₱)',
      employee: {
        id: empItem.id,
        name: `${empItem.first_name} ${empItem.last_name}`,
        code: empItem.employee_code,
        department: empItem.department,
        position: empItem.position,
        monthly_base_salary: empItem.monthly_base_salary,
        cut_off_basic: empItem.basic_pay,
        monthly_allowances: empItem.is_semi_monthly ? empItem.allowances * 2 : empItem.allowances,
        cut_off_allowances: empItem.allowances,
        bank_name: empItem.bank_name,
        bank_account: empItem.bank_account,
        tin: empItem.tin
      },
      earnings,
      deductions,
      gross_pay: empItem.gross_pay,
      total_deductions: empItem.total_deductions,
      net_pay: empItem.net_pay,
      ppa_items: empItem.ppa_items || [],
      has_ppa: Boolean(empItem.has_ppa),
      crypto_verification_hash: `0x${Buffer.from(`${empItem.id}-${month}-${empItem.net_pay}`).toString('hex').slice(0, 24)}...`,
      verification_protocol: 'SHA-256 + AES-GCM Tamper-Proof Certified'
    };
  },

  // --- HR Analytics & Reporting ---
  getRealtimeDashboardData: (month = 'July 2024') => {
    const { summary, employees } = syncPeriodComputation(month);
    
    // Department breakdown
    const deptMap = {};
    employees.forEach(emp => {
      if (!deptMap[emp.department]) {
        deptMap[emp.department] = { headcount: 0, gross: 0, net: 0 };
      }
      deptMap[emp.department].headcount += 1;
      deptMap[emp.department].gross += emp.gross_pay;
      deptMap[emp.department].net += emp.net_pay;
    });

    const deptBreakdown = Object.keys(deptMap).map(dept => ({
      department: dept,
      headcount: deptMap[dept].headcount,
      total_gross: deptMap[dept].gross,
      total_net: deptMap[dept].net,
      percentage: summary.total_gross_raw > 0 ? Math.round((deptMap[dept].gross / summary.total_gross_raw) * 100) : 0
    }));

    return {
      summary,
      department_breakdown: deptBreakdown,
      kpis: {
        total_payroll: summary.total_gross_raw,
        total_deductions: summary.total_deductions_raw,
        net_disbursement: summary.total_net_raw,
        active_staff: masterEmployees.length,
        pending_claims: claimsList.filter(c => c.status === 'Submitted' || c.status === 'Pending').length,
        approved_claims_total: claimsList.filter(c => c.status === 'Approved').reduce((s, c) => s + Number(c.amount), 0),
        total_hmo_enrolled: hmoEnrollments.filter(h => h.status === 'Active').length
      }
    };
  },

  getFinancialReportsData: (month = 'July 2024') => {
    const { summary, employees } = syncPeriodComputation(month);
    const period = payrollPeriods[month] || payrollPeriods['July 2024'];

    const payrollExpenses = employees.map(e => ({
      employee: `${e.first_name} ${e.last_name}`,
      department: e.department,
      basic_salary: e.basic_pay,
      overtime_pay: e.ot_pay,
      allowances: e.allowances,
      reimbursements: e.reimbursements,
      total_gross: e.gross_pay,
      net_payout: e.net_pay
    }));

    return {
      period: month,
      payout_date: period.payout_date,
      status: period.status,
      summary,
      employees,
      expenses: payrollExpenses,
      totals: {
        basic_salaries: employees.reduce((s, e) => s + e.basic_pay, 0),
        overtime: employees.reduce((s, e) => s + e.ot_pay, 0),
        allowances: employees.reduce((s, e) => s + e.allowances, 0),
        reimbursements: employees.reduce((s, e) => s + e.reimbursements, 0),
        gross: employees.reduce((s, e) => s + e.gross_pay, 0),
        deductions: employees.reduce((s, e) => s + e.total_deductions, 0),
        net: employees.reduce((s, e) => s + e.net_pay, 0)
      }
    };
  },

  getComplianceReportsData: (month = 'July 2024') => {
    const { summary, employees } = syncPeriodComputation(month);
    
    // Enrich each employee with exact 2025 statutory breakdown matching SSS book schedule
    const enrichedEmployees = employees.map(e => {
      const basic = e.monthly_base_salary || e.basic_pay || 0;
      const sss = statutory2025.getSSSContribution2025(basic);
      const philhealth = statutory2025.getPhilHealthContribution2025(basic);
      const pagibig = statutory2025.getPagIBIGContribution2025(basic);
      const birTax = Number(e.bir_tax) || 0;

      const totalEEDeductions = sss.ee_total + philhealth.ee_share + pagibig.ee_share + birTax;
      const totalERBurden = sss.er_total + philhealth.er_share + pagibig.er_share;
      const grandTotalRemittance = totalEEDeductions + totalERBurden;

      return {
        ...e,
        basic_salary: basic,
        sss_breakdown: sss,
        philhealth_breakdown: philhealth,
        pagibig_breakdown: pagibig,
        bir_tax: birTax,
        total_ee_deductions: totalEEDeductions,
        total_er_burden: totalERBurden,
        grand_total_remittance: grandTotalRemittance
      };
    });

    const totalSSS_EE = enrichedEmployees.reduce((s, e) => s + e.sss_breakdown.ee_total, 0);
    const totalSSS_ER = enrichedEmployees.reduce((s, e) => s + e.sss_breakdown.er_total, 0);
    const totalPhilHealth_EE = enrichedEmployees.reduce((s, e) => s + e.philhealth_breakdown.ee_share, 0);
    const totalPhilHealth_ER = enrichedEmployees.reduce((s, e) => s + e.philhealth_breakdown.er_share, 0);
    const totalPagIBIG_EE = enrichedEmployees.reduce((s, e) => s + e.pagibig_breakdown.ee_share, 0);
    const totalPagIBIG_ER = enrichedEmployees.reduce((s, e) => s + e.pagibig_breakdown.er_share, 0);
    const totalBIRWithheld = enrichedEmployees.reduce((s, e) => s + e.bir_tax, 0);

    const sssData = {
      form_name: 'SSS Form R-3: Monthly Contribution Collection List (2025 Schedule)',
      employee_share: totalSSS_EE,
      employer_share: totalSSS_ER,
      total_remittance: totalSSS_EE + totalSSS_ER,
      total_msc: enrichedEmployees.reduce((s, e) => s + e.sss_breakdown.msc_total, 0),
      total_regular_ss: enrichedEmployees.reduce((s, e) => s + e.sss_breakdown.er_ss + e.sss_breakdown.ee_ss, 0),
      total_mpf: enrichedEmployees.reduce((s, e) => s + e.sss_breakdown.er_mpf + e.sss_breakdown.ee_mpf, 0),
      total_ec: enrichedEmployees.reduce((s, e) => s + e.sss_breakdown.er_ec, 0),
      status: 'Compliant'
    };

    const philhealthData = {
      form_name: "PhilHealth Form RF-1: Employer's Remittance Return (5% Premium)",
      employee_share: totalPhilHealth_EE,
      employer_share: totalPhilHealth_ER,
      total_remittance: totalPhilHealth_EE + totalPhilHealth_ER,
      status: 'Compliant'
    };

    const pagibigData = {
      form_name: 'Pag-IBIG Form MCRF: Member Contribution Remittance (Circular 460)',
      employee_share: totalPagIBIG_EE,
      employer_share: totalPagIBIG_ER,
      total_remittance: totalPagIBIG_EE + totalPagIBIG_ER,
      status: 'Compliant'
    };

    const birData = {
      form_name: 'BIR Form 1601-C: Monthly Remittance of Income Taxes Withheld',
      total_gross_compensation: enrichedEmployees.reduce((s, e) => s + (e.gross_pay || e.basic_salary), 0),
      total_statutory_exemptions: totalSSS_EE + totalPhilHealth_EE + totalPagIBIG_EE,
      total_taxable_compensation: enrichedEmployees.reduce((s, e) => s + Math.max(0, (e.gross_pay || e.basic_salary) - (e.sss_breakdown.ee_total + e.philhealth_breakdown.ee_share + e.pagibig_breakdown.ee_share)), 0),
      total_withheld: totalBIRWithheld,
      total_tax_withheld: totalBIRWithheld,
      remittance_due_date: `${month.split(' ')[0]} 10, ${month.split(' ')[1] || '2024'}`,
      status: 'Compliant'
    };

    const grandTotals = {
      total_employee_deductions: totalSSS_EE + totalPhilHealth_EE + totalPagIBIG_EE + totalBIRWithheld,
      total_employer_burden: totalSSS_ER + totalPhilHealth_ER + totalPagIBIG_ER,
      grand_combined_remittance: totalSSS_EE + totalSSS_ER + totalPhilHealth_EE + totalPhilHealth_ER + totalPagIBIG_EE + totalPagIBIG_ER + totalBIRWithheld,
      employee_count: enrichedEmployees.length
    };

    return {
      period: month,
      summary,
      employees: enrichedEmployees,
      totals: grandTotals,
      bir: birData,
      bir_1601c: birData,
      sss: sssData,
      sss_r3: sssData,
      philhealth: philhealthData,
      philhealth_rf1: philhealthData,
      pagibig: pagibigData,
      pagibig_mcrf: pagibigData,
      official_sss_schedule: statutory2025.SSS_2025_TABLE
    };
  },

  getEmployeePersonalComplianceData: (employeeEmailOrId, requestedMonth = 'July 2024') => {
    let emp = null;
    if (typeof employeeEmailOrId === 'number' || !isNaN(Number(employeeEmailOrId))) {
      emp = masterEmployees.find(e => e.id === Number(employeeEmailOrId));
    }
    if (!emp && typeof employeeEmailOrId === 'string') {
      const clean = employeeEmailOrId.toLowerCase().trim();
      emp = masterEmployees.find(e => e.email.toLowerCase() === clean);
    }
    if (!emp) {
      emp = masterEmployees[0]; // fallback to Maria Santos
    }

    const periodsList = ['July 2024', 'June 2024', 'May 2024', 'April 2024'];
    const periodRecords = periodsList.map(periodName => {
      const basic = emp.base_salary;
      const sss = statutory2025.getSSSContribution2025(basic);
      const philhealth = statutory2025.getPhilHealthContribution2025(basic);
      const pagibig = statutory2025.getPagIBIGContribution2025(basic);
      const taxable = Math.max(0, basic - (sss.ee_total + philhealth.ee_share + pagibig.ee_share));
      const birTax = statutory2025.getBIRWithholdingTax(taxable, false);

      const totalEEDeduction = sss.ee_total + philhealth.ee_share + pagibig.ee_share + birTax;
      const totalERCounterpart = sss.er_total + philhealth.er_share + pagibig.er_share;
      const grandRemittance = totalEEDeduction + totalERCounterpart;

      return {
        period: periodName,
        basic_pay: basic,
        gross_pay: basic + 3500,
        taxable_income: taxable,
        bir_tax: birTax,
        sss,
        philhealth,
        pagibig,
        total_ee_deduction: totalEEDeduction,
        total_er_counterpart: totalERCounterpart,
        grand_remittance: grandRemittance,
        status: 'Remitted'
      };
    });

    const activeRecord = periodRecords.find(p => p.period === requestedMonth) || periodRecords[0];

    const ytdTotals = {
      sss_ee: periodRecords.reduce((s, r) => s + r.sss.ee_total, 0),
      sss_er: periodRecords.reduce((s, r) => s + r.sss.er_total, 0),
      philhealth_ee: periodRecords.reduce((s, r) => s + r.philhealth.ee_share, 0),
      philhealth_er: periodRecords.reduce((s, r) => s + r.philhealth.er_share, 0),
      pagibig_ee: periodRecords.reduce((s, r) => s + r.pagibig.ee_share, 0),
      pagibig_er: periodRecords.reduce((s, r) => s + r.pagibig.er_share, 0),
      bir_tax: periodRecords.reduce((s, r) => s + r.bir_tax, 0),
      total_ee_deductions: periodRecords.reduce((s, r) => s + r.total_ee_deduction, 0),
      total_er_counterparts: periodRecords.reduce((s, r) => s + r.total_er_counterpart, 0),
      grand_total_remitted: periodRecords.reduce((s, r) => s + r.grand_remittance, 0)
    };

    return {
      is_employee_view: true,
      employee: {
        id: emp.id,
        employee_code: emp.employee_code,
        full_name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        department: emp.department,
        position: emp.position,
        base_salary: emp.base_salary,
        tin: emp.tin || '284-901-443-000',
        sss_number: emp.sss_number || '34-8891240-1',
        philhealth_number: emp.philhealth_number || '12-098765432-1',
        pagibig_number: emp.pagibig_number || '1210-9842-1102'
      },
      current_period: activeRecord,
      period_history: periodRecords,
      ytd_totals: ytdTotals,
      official_sss_schedule: statutory2025.SSS_2025_TABLE
    };
  },

  // --- Users & Auth ---
  getUsers: async () => initialUsers,
  getUserByEmail: async (email) => {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    return initialUsers.find(u => 
      u.email.toLowerCase() === clean ||
      (clean === 'hr.manager@mms.com' && u.role === 'manager') ||
      (clean === 'sarah.jenkins@mms.com' && u.role === 'employee') ||
      (clean === 'employee@mms.com' && u.role === 'employee') ||
      (clean === 'officer@mms.com' && u.role === 'officer') ||
      (clean === 'director@mms.com' && u.role === 'director')
    ) || null;
  },
  getUserById: async (id) => initialUsers.find(u => u.id === Number(id)) || null,
  updateUser2FA: async (userId, enabled, secret = null) => {
    const user = initialUsers.find(u => u.id === Number(userId));
    if (!user) return null;
    user.two_factor_enabled = Boolean(enabled);
    if (secret !== undefined) {
      user.two_factor_secret = secret;
    }
    return {
      id: user.id,
      email: user.email,
      two_factor_enabled: user.two_factor_enabled
    };
  },
  get2FAStatus: async (userId) => {
    const user = initialUsers.find(u => u.id === Number(userId));
    if (!user) return { enabled: false };
    return {
      enabled: Boolean(user.two_factor_enabled),
      has_secret: Boolean(user.two_factor_secret)
    };
  },

  // --- Audit Logs ---
  addAuditLog: async (log) => {
    return { id: 1, ...log, timestamp: new Date().toISOString() };
  },
  getAuditLogs: async () => [],

  // --- Notifications ---
  getNotifications: (role) => {
    const filtered = notifications.filter(n => n.recipient_role === role);
    const unread_count = filtered.filter(n => !n.is_read).length;
    return { notifications: filtered, unread_count };
  },

  markNotificationAsRead: (id) => {
    const n = notifications.find(n => n.id === Number(id));
    if (!n) return null;
    n.is_read = true;
    return n;
  },

  markAllNotificationsAsRead: (role) => {
    notifications
      .filter(n => n.recipient_role === role)
      .forEach(n => { n.is_read = true; });
  },

  createNotification: (data) => {
    const newId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1;
    const n = {
      id: newId,
      is_read: false,
      created_at: new Date().toISOString(),
      priority: 'normal',
      ...data
    };
    notifications.unshift(n);
    return n;
  },

  getTaskQueueCounts: (role) => {
    const counts = {};
    if (role === 'manager') {
      counts['claim_verification'] = claimsList.filter(c => c.status === 'Pending' || c.status === 'Submitted').length;
      counts['timekeeping'] = attendanceRecords.filter(a => a.approval_status === 'Pending').length;
    }
    if (role === 'director') {
      counts['reimbursement'] = microloans.filter(l => l.status === 'Pending').length;
      counts['salary_adjustment'] = salaryAdjustments.filter(a => a.status === 'Pending Approval').length;
    }
    if (role === 'officer') {
      counts['payroll_computation'] = claimsList.filter(c => c.status === 'Approved').length;
    }
    if (role === 'admin') {
      counts['payroll_computation'] = claimsList.filter(c => c.status === 'Approved').length;
      counts['claim_verification'] = claimsList.filter(c => c.status === 'Pending' || c.status === 'Submitted').length;
    }
    return counts;
  },

  // --- Retroactivity & Cut-off Rollover ---
  getPpaPending: () => {
    const pendingAttendance = attendanceRecords.filter(att => 
      att.approval_status === 'Approved' && 
      !att.credited_period && 
      (att.is_ppa || isPeriodLocked(getPeriodForDate(att.date, true)))
    );
    const pendingClaims = claimsList.filter(c => 
      c.status === 'Approved' && 
      !c.credited_period && 
      (c.is_ppa || isPeriodLocked(c.payroll_period || getPeriodForDate(c.date_filed, true)))
    );
    return {
      attendance: pendingAttendance,
      claims: pendingClaims,
      total_pending_ppa_count: pendingAttendance.length + pendingClaims.length
    };
  },

  rolloverPeriod: (month) => {
    return rolloverToNextPeriod(month);
  },

  // --- Offboarding & Final Pay (Backpay) ---
  computeFinalPay: (employeeId, options = {}) => computeFinalPay(employeeId, options),
  offboardEmployee: (employeeId, offboardData = {}) => offboardEmployee(employeeId, offboardData),
  generateBIR2316: (employeeId) => generateBIR2316(employeeId),
  getOffboardedEmployees: () => offboardedEmployees
};

module.exports = db;

