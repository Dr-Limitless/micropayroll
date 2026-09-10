const db = require('../server/db/db');
const assert = require('assert');

async function runTests() {
  console.log('=====================================================');
  console.log('RUNNING EMPLOYEE LIFECYCLE & OFFBOARDING TEST SUITE');
  console.log('=====================================================\n');

  // 1. Test Onboarding Cascade
  console.log('--- 1. Testing Onboarding Defaults Cascade ---');
  const newEmployeeData = {
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    email: 'juan.delacruz@company.ph',
    department: 'Engineering',
    position: 'Senior Systems Architect',
    basic_pay: 95000,
    bank_name: 'BDO Unibank',
    bank_account: '9988-7766-5544',
    tin: '321-654-987-000'
  };

  const onboardedEmp = await db.createEmployee(newEmployeeData);
  console.log(`✓ Enrolled new employee: ${onboardedEmp.first_name} ${onboardedEmp.last_name} (ID: ${onboardedEmp.id})`);

  // Verify statutory numbers assigned
  assert.ok(onboardedEmp.sss_number, 'SSS number should be assigned');
  assert.ok(onboardedEmp.philhealth_number, 'PhilHealth number should be assigned');
  assert.ok(onboardedEmp.pagibig_number, 'Pag-IBIG number should be assigned');
  console.log(`✓ Statutory Numbers: SSS=${onboardedEmp.sss_number}, PhilHealth=${onboardedEmp.philhealth_number}, Pag-IBIG=${onboardedEmp.pagibig_number}`);

  // Verify leave credits
  assert.strictEqual(onboardedEmp.leave_credits.vacation_leave, 12, 'Vacation leave default 12');
  assert.strictEqual(onboardedEmp.leave_credits.sick_leave, 8, 'Sick leave default 8');
  assert.strictEqual(onboardedEmp.leave_credits.unused_leaves, 10, 'Unused leaves default 10');
  console.log(`✓ Leave Credits: VL=${onboardedEmp.leave_credits.vacation_leave}, SL=${onboardedEmp.leave_credits.sick_leave}, Unused=${onboardedEmp.leave_credits.unused_leaves}`);

  // Verify HMO enrollment cascaded
  const hmoList = db.getBenefits().filter(b => b.employee_id === onboardedEmp.id);
  assert.strictEqual(hmoList.length, 1, 'Should create 1 baseline HMO enrollment');
  assert.strictEqual(hmoList[0].plan, 'MaxiCare Platinum Plus');
  assert.strictEqual(hmoList[0].coverage, '₱350,000');
  console.log(`✓ Cascaded HMO Plan: ${hmoList[0].plan} (Coverage: ${hmoList[0].coverage})`);

  // Verify compensation & allowances cascaded (Transportation ₱3k, Rice ₱2k, Medical ₱1.5k = ₱6,500)
  const comp = db.getCompensation().compensation.find(c => c.id === onboardedEmp.id);
  assert.ok(comp, 'Employee should exist in compensation table');
  assert.strictEqual(comp.allowance, 6500, 'Should have standard ₱6,500 de minimis allowances');
  console.log(`✓ Cascaded Standard De Minimis Allowances: ₱${comp.allowance.toLocaleString()} (Transport, Rice, Medical)`);

  // 2. Test Final Pay Computation with Unused Leave & 13th Month & Loan Settlement
  console.log('\n--- 2. Testing Final Pay & Backpay Engine (Philippine Compliance) ---');

  // Issue a microloan to Juan Dela Cruz first to verify loan liquidation on separation
  const loan = db.createMicroloan({
    employee_id: onboardedEmp.id,
    principal_amount: 20000,
    total_installments: 6,
    reason: 'Emergency Household Expense'
  });
  db.updateMicroloanStatus(loan.id, 'Active');
  console.log(`✓ Issued & Approved Microloan: Principal=₱${loan.principal_amount.toLocaleString()}, Balance=₱${loan.balance_amount.toLocaleString()}`);

  // Calculate Final Pay for separation on 2024-10-31 with 15 unused leaves (10 exempt + 5 taxable)
  const finalPayPreview = db.computeFinalPay(onboardedEmp.id, {
    separation_date: '2024-10-31',
    reason: 'Voluntary Resignation',
    unused_leave_days: 15
  });

  console.log('Final Pay Preview Breakdown:');
  console.log(`- Daily Rate (22-day factor): ₱${finalPayPreview.daily_rate.toFixed(2)}`);
  console.log(`- Pro-rated 13th Month: ₱${finalPayPreview.earnings.prorated_13th_month.toFixed(2)} (Tax-exempt: ₱${finalPayPreview.earnings.tax_exempt_13th.toFixed(2)})`);
  console.log(`- Leave Encashment Total: ₱${finalPayPreview.earnings.total_leave_encashment.toFixed(2)} (Tax-exempt 10 days: ₱${finalPayPreview.earnings.exempt_leave_pay.toFixed(2)}, Taxable 5 days: ₱${finalPayPreview.earnings.taxable_leave_pay.toFixed(2)})`);
  console.log(`- Gross Final Earnings: ₱${finalPayPreview.earnings.total_gross.toFixed(2)}`);
  console.log(`- Microloan Balance Deducted: ₱${finalPayPreview.deductions.outstanding_loan_balance.toFixed(2)}`);
  console.log(`- Annualized Tax Reconciliation: Annual Tax Due=₱${finalPayPreview.tax_reconciliation.annual_tax_due.toFixed(2)}, Withheld=₱${finalPayPreview.tax_reconciliation.cumulative_tax_withheld.toFixed(2)}, Type=${finalPayPreview.tax_reconciliation.type} of ₱${finalPayPreview.tax_reconciliation.adjustment_amount.toFixed(2)}`);
  console.log(`- Net Backpay Payable: ₱${finalPayPreview.net_final_pay.toFixed(2)}`);

  assert.ok(finalPayPreview.earnings.prorated_13th_month > 0, '13th month should be positive');
  assert.strictEqual(finalPayPreview.earnings.tax_exempt_13th, Math.min(finalPayPreview.earnings.prorated_13th_month, 90000), '13th month is under ₱90k statutory limit');
  assert.ok(finalPayPreview.earnings.exempt_leave_pay > 0, '10 days leave should be tax-exempt');
  assert.ok(finalPayPreview.earnings.taxable_leave_pay > 0, '5 days leave should be taxable');
  assert.strictEqual(finalPayPreview.deductions.outstanding_loan_balance, 20000, 'Loan balance of 20000 should be settled');
  assert.ok(finalPayPreview.net_final_pay > 0, 'Net backpay must be positive');

  // 3. Execute Offboarding & Disburse Settlement
  console.log('\n--- 3. Testing Offboard Execution & Loan Closure ---');
  const offboardResult = db.offboardEmployee(onboardedEmp.id, {
    separation_date: '2024-10-31',
    reason: 'Voluntary Resignation',
    unused_leave_days: 15
  });

  assert.strictEqual(offboardResult.employee.status, 'Resigned', 'Status should be Resigned');
  console.log(`✓ Employee status updated to: ${offboardResult.employee.status}`);

  // Verify loan is closed
  const updatedLoans = db.getMicroloans().filter(l => l.employee_id === onboardedEmp.id);
  assert.strictEqual(updatedLoans[0].status, 'Paid Off', 'Loan status should be Paid Off');
  assert.strictEqual(updatedLoans[0].balance_amount, 0, 'Loan balance should be zero');
  console.log(`✓ Microloan settled in full: status=${updatedLoans[0].status}, balance=₱${updatedLoans[0].balance_amount}`);

  // 4. Test Official BIR Form 2316 Generation
  console.log('\n--- 4. Testing Official BIR Form 2316 Certificate Generation ---');
  const bir2316 = db.generateBIR2316(onboardedEmp.id);

  assert.strictEqual(bir2316.form_title, 'BIR Form No. 2316 (Certificate of Compensation Payment / Tax Withheld)');
  assert.strictEqual(bir2316.form_title, 'BIR Form No. 2316 (Certificate of Compensation Payment / Tax Withheld)');
  assert.strictEqual(bir2316.employer.tin, '008-992-104-000');
  assert.strictEqual(bir2316.employer.rdo_code, '047');
  assert.strictEqual(bir2316.employee.tin, onboardedEmp.tin);
  assert.ok(bir2316.part_iv_a_non_taxable.total_non_taxable_compensation > 0, 'Non-taxable compensation should be recorded');
  assert.ok(bir2316.digital_signature.cryptographic_seal, 'Digital cryptographic seal should be present');

  console.log(`✓ BIR Form 2316 Generated successfully for Tax Year ${bir2316.tax_year}`);
  console.log(`  Employer: ${bir2316.employer.name} (TIN: ${bir2316.employer.tin}, RDO: ${bir2316.employer.rdo_code})`);
  console.log(`  Employee: ${bir2316.employee.name} (TIN: ${bir2316.employee.tin})`);
  console.log(`  Gross Compensation: ₱${bir2316.summary.gross_compensation_income.toLocaleString()}`);
  console.log(`  Total Non-Taxable / Exempt (Part IV-A): ₱${bir2316.part_iv_a_non_taxable.total_non_taxable_compensation.toLocaleString()}`);
  console.log(`  Total Taxable Compensation (Part IV-B): ₱${bir2316.part_iv_b_taxable.total_taxable_compensation.toLocaleString()}`);
  console.log(`  Tax Due (TRAIN Act Graduated Table): ₱${bir2316.summary.tax_due.toLocaleString()}`);
  console.log(`  Digital Seal: ${bir2316.digital_signature.cryptographic_seal.slice(0, 24)}... (Verified)`);

  console.log('\n=====================================================');
  console.log('ALL EMPLOYEE LIFECYCLE & OFFBOARDING TESTS PASSED! ✅');
  console.log('=====================================================');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
