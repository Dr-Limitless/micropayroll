-- Microfinancial Management System (HR & Payroll Platform)
-- PostgreSQL Database Schema: micropayroll

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'admin', 'manager', 'officer', 'director', 'employee'
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) DEFAULT 'Full-time', -- 'Full-time', 'Part-time', 'Contract'
    hire_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'On-Leave', 'Terminated'
    -- Sensitive fields stored with AES-256-GCM encryption
    encrypted_salary TEXT NOT NULL,
    encrypted_bank_account TEXT NOT NULL,
    encrypted_tin TEXT NOT NULL, -- Tax Identification Number
    bank_name VARCHAR(100) DEFAULT 'Metro Micro Bank',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compensation: Salary Structures & Salary Adjustments
CREATE TABLE IF NOT EXISTS salary_structures (
    id SERIAL PRIMARY KEY,
    grade VARCHAR(20) NOT NULL, -- 'L1', 'L2', 'L3', 'L4'
    title VARCHAR(100) NOT NULL,
    min_salary NUMERIC(12, 2) NOT NULL,
    max_salary NUMERIC(12, 2) NOT NULL,
    base_salary NUMERIC(12, 2) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS salary_adjustments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    current_salary NUMERIC(12, 2) NOT NULL,
    proposed_salary NUMERIC(12, 2) NOT NULL,
    adjustment_amount NUMERIC(12, 2) NOT NULL,
    adjustment_percentage NUMERIC(5, 2) NOT NULL,
    reason TEXT NOT NULL,
    effective_date DATE NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    approved_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending Approval', -- 'Draft', 'Pending Approval', 'Approved', 'Rejected', 'Applied'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compensation: Allowances & Employee Allowance Assignments
CREATE TABLE IF NOT EXISTS allowances (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Non-Taxable/De Minimis', 'Taxable'
    amount NUMERIC(12, 2) NOT NULL,
    frequency VARCHAR(50) DEFAULT 'Monthly', -- 'Monthly', 'Semi-Monthly'
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS employee_allowances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    allowance_id INTEGER REFERENCES allowances(id) ON DELETE CASCADE,
    custom_amount NUMERIC(12, 2),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Active'
);

-- Timekeeping & Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_in VARCHAR(20),
    time_out VARCHAR(20),
    regular_hours NUMERIC(4, 2) DEFAULT 8.00,
    overtime_hours NUMERIC(4, 2) DEFAULT 0.00,
    late_minutes INTEGER DEFAULT 0,
    undertime_minutes INTEGER DEFAULT 0,
    attendance_status VARCHAR(50) DEFAULT 'Present', -- 'Present', 'Late', 'Absent', 'On Leave'
    approval_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    approved_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Claims & Reimbursement
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    claim_code VARCHAR(50) UNIQUE NOT NULL,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    claim_type VARCHAR(100) NOT NULL, -- 'Medical & Dental', 'Official Travel', 'Meal & Entertainment', 'Communication', 'Office Supplies'
    date_filed DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    supporting_document VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Submitted', -- 'Draft', 'Submitted', 'Under Verification', 'Approved', 'Rejected', 'Reimbursed'
    payroll_period_id INTEGER,
    reimbursement_status VARCHAR(50) DEFAULT 'Pending Reimbursement', -- 'Pending Reimbursement', 'Included in Payroll', 'Reimbursed'
    approved_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HMO & Benefits Administration
CREATE TABLE IF NOT EXISTS benefit_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    plan_tier VARCHAR(50) NOT NULL, -- 'Basic HMO', 'Platinum Plus', 'Executive VIP', 'Life Insurance'
    provider VARCHAR(100) NOT NULL, -- 'MaxiCare', 'Intellicare', 'Medicard'
    coverage_amount NUMERIC(12, 2) NOT NULL,
    default_monthly_premium NUMERIC(12, 2) NOT NULL,
    employer_share NUMERIC(12, 2) NOT NULL,
    employee_share NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS hmo_enrollments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES benefit_plans(id) ON DELETE CASCADE,
    dependents_count INTEGER DEFAULT 0,
    monthly_premium NUMERIC(12, 2) NOT NULL,
    employer_share NUMERIC(12, 2) NOT NULL,
    employee_share NUMERIC(12, 2) NOT NULL,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Pending Verification', 'Inactive', 'Expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Lifecycle & Items
CREATE TABLE IF NOT EXISTS payroll_periods (
    id SERIAL PRIMARY KEY,
    period_name VARCHAR(100) UNIQUE NOT NULL, -- 'June 2024', 'July 2024', 'August 2024'
    cut_off_start DATE NOT NULL,
    cut_off_end DATE NOT NULL,
    payout_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'For Review', 'Approved', 'Finalized', 'Paid'
    total_gross NUMERIC(15, 2) DEFAULT 0.00,
    total_deductions NUMERIC(15, 2) DEFAULT 0.00,
    total_net NUMERIC(15, 2) DEFAULT 0.00,
    approved_by VARCHAR(255),
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_items (
    id SERIAL PRIMARY KEY,
    payroll_period_id INTEGER REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    basic_pay NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    overtime_pay NUMERIC(12, 2) DEFAULT 0.00,
    allowances NUMERIC(12, 2) DEFAULT 0.00,
    incentives NUMERIC(12, 2) DEFAULT 0.00,
    reimbursement_pay NUMERIC(12, 2) DEFAULT 0.00,
    gross_pay NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    withholding_tax NUMERIC(12, 2) DEFAULT 0.00,
    sss_contribution NUMERIC(12, 2) DEFAULT 0.00,
    philhealth NUMERIC(12, 2) DEFAULT 0.00,
    pagibig NUMERIC(12, 2) DEFAULT 0.00,
    hmo_deduction NUMERIC(12, 2) DEFAULT 0.00,
    microloan_deduction NUMERIC(12, 2) DEFAULT 0.00,
    total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Pending', 'Processed', 'On Hold'
    payslip_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS microloans (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    loan_type VARCHAR(100) NOT NULL,
    principal_amount NUMERIC(12, 2) NOT NULL,
    monthly_deduction NUMERIC(12, 2) NOT NULL,
    total_installments INTEGER NOT NULL DEFAULT 6,
    remaining_installments INTEGER NOT NULL DEFAULT 6,
    balance_amount NUMERIC(12, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) DEFAULT 1.50,
    status VARCHAR(50) DEFAULT 'Pending',
    reason TEXT,
    approved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(50),
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    cryptographic_checksum VARCHAR(64),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll_items(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_emp ON payroll_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_emp ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_claims_emp ON claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_hmo_emp ON hmo_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
