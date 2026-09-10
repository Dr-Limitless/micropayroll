/**
 * Republic of the Philippines Statutory Contributions Engine (Effective 2025)
 * - SSS: Republic Act No. 11199 (Social Security Act of 2018) January 2025 Schedule (Book Page 252)
 *   Regular SS Rate: 15% (Employer 10%, Employee 5%), Capped at ₱20,000 MSC
 *   Mandatory Provident Fund (MPF / WISP): Above ₱20,000 up to ₱35,000 MSC (Employer 10%, Employee 5%)
 *   Employees' Compensation (EC): ₱10.00 (< ₱15,000) or ₱30.00 (>= ₱15,000)
 * - PhilHealth: Republic Act No. 11223 (Universal Health Care Act) 5% Premium (2.5% EE, 2.5% ER, Floor ₱10,000, Ceiling ₱100,000)
 * - Pag-IBIG: HDMF Circular No. 460 (₱200 EE, ₱200 ER)
 * - BIR Tax: Republic Act No. 10963 (TRAIN Law) Withholding Tax Table
 */

// Generate the official 61-bracket 2025 SSS Contribution Table (Replicating Book Page 252)
function generateSSS2025Table() {
  const brackets = [];

  // Bracket 1: Below ₱5,250.00
  brackets.push({
    bracket_id: 1,
    min_comp: 0,
    max_comp: 5249.99,
    range_label: 'Below ₱5,250.00',
    msc_regular: 5000,
    msc_mpf: 0,
    msc_total: 5000,
    er_ss: 500.00,
    er_mpf: 0.00,
    er_ec: 10.00,
    er_total: 510.00,
    ee_ss: 250.00,
    ee_mpf: 0.00,
    ee_total: 250.00,
    total_contribution: 760.00
  });

  // Brackets 2 to 31: ₱5,250.00 up to ₱20,249.99 (₱500 step increments, Regular SS only)
  let curMin = 5250;
  let curMsc = 5500;
  let id = 2;

  while (curMsc <= 20000) {
    const curMax = curMin + 499.99;
    const ec = curMsc >= 15000 ? 30.00 : 10.00;
    const er_ss = curMsc * 0.10;
    const ee_ss = curMsc * 0.05;
    const er_total = er_ss + ec;
    const ee_total = ee_ss;

    brackets.push({
      bracket_id: id++,
      min_comp: curMin,
      max_comp: curMax,
      range_label: `₱${curMin.toLocaleString('en-US', { minimumFractionDigits: 2 })} - ₱${curMax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      msc_regular: curMsc,
      msc_mpf: 0,
      msc_total: curMsc,
      er_ss,
      er_mpf: 0.00,
      er_ec: ec,
      er_total,
      ee_ss,
      ee_mpf: 0.00,
      ee_total,
      total_contribution: er_total + ee_total
    });

    curMin += 500;
    curMsc += 500;
  }

  // Brackets 32 to 60: ₱20,250.00 up to ₱34,749.99 (Regular MSC fixed at ₱20,000; MPF increments by ₱500 up to ₱14,500)
  let curMpfMsc = 500;
  while (curMpfMsc < 15000) {
    const curMax = curMin + 499.99;
    const er_ss = 2000.00;
    const ee_ss = 1000.00;
    const er_mpf = curMpfMsc * 0.10;
    const ee_mpf = curMpfMsc * 0.05;
    const ec = 30.00;
    const er_total = er_ss + er_mpf + ec;
    const ee_total = ee_ss + ee_mpf;

    brackets.push({
      bracket_id: id++,
      min_comp: curMin,
      max_comp: curMax,
      range_label: `₱${curMin.toLocaleString('en-US', { minimumFractionDigits: 2 })} - ₱${curMax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      msc_regular: 20000,
      msc_mpf: curMpfMsc,
      msc_total: 20000 + curMpfMsc,
      er_ss,
      er_mpf,
      er_ec: ec,
      er_total,
      ee_ss,
      ee_mpf,
      ee_total,
      total_contribution: er_total + ee_total
    });

    curMin += 500;
    curMpfMsc += 500;
  }

  // Final Bracket 61: ₱34,750.00 - Over (Max Cap)
  brackets.push({
    bracket_id: id,
    min_comp: 34750,
    max_comp: Infinity,
    range_label: '₱34,750.00 - Over',
    msc_regular: 20000,
    msc_mpf: 15000,
    msc_total: 35000,
    er_ss: 2000.00,
    er_mpf: 1500.00,
    er_ec: 30.00,
    er_total: 3530.00,
    ee_ss: 1000.00,
    ee_mpf: 750.00,
    ee_total: 1750.00,
    total_contribution: 5280.00
  });

  return brackets;
}

const SSS_2025_TABLE = generateSSS2025Table();

/**
 * Calculate exact SSS 2025 Contribution breakdown given gross/basic compensation
 */
function getSSSContribution2025(compensation) {
  const comp = Number(compensation) || 0;
  const match = SSS_2025_TABLE.find(b => comp >= b.min_comp && comp <= b.max_comp);
  if (match) return { ...match };
  // Default to maximum cap bracket if above or fallback
  if (comp >= 34750) return { ...SSS_2025_TABLE[SSS_2025_TABLE.length - 1] };
  return { ...SSS_2025_TABLE[0] };
}

/**
 * Calculate PhilHealth 2025 Contribution (5% shared 50/50, ₱10,000 floor, ₱100,000 ceiling)
 */
function getPhilHealthContribution2025(basicSalary) {
  const basic = Number(basicSalary) || 0;
  const base = Math.min(100000, Math.max(10000, basic));
  const total = Math.round(base * 0.05);
  const ee_share = Math.round(total / 2);
  const er_share = total - ee_share;
  return {
    base_salary: basic,
    credited_base: base,
    rate_percent: 5.0,
    ee_share,
    er_share,
    total_contribution: total
  };
}

/**
 * Calculate Pag-IBIG (HDMF) Contribution (Circular 460: ₱200 EE, ₱200 ER)
 */
function getPagIBIGContribution2025(basicSalary) {
  const basic = Number(basicSalary) || 0;
  let ee_share = 200;
  let er_share = 200;
  if (basic < 1500) {
    ee_share = Math.round(basic * 0.01);
    er_share = Math.round(basic * 0.02);
  } else if (basic < 5000) {
    ee_share = Math.min(200, Math.round(basic * 0.02));
    er_share = Math.min(200, Math.round(basic * 0.02));
  }
  return {
    base_salary: basic,
    ee_share,
    er_share,
    total_contribution: ee_share + er_share
  };
}

/**
 * Calculate BIR TRAIN Law Semi-Monthly & Monthly Withholding Tax
 */
function getBIRWithholdingTax(taxableIncome, isSemiMonthly = false) {
  const income = Math.max(0, Number(taxableIncome) || 0);
  if (isSemiMonthly) {
    if (income <= 10417) return 0;
    if (income <= 16667) return Math.round((income - 10417) * 0.15);
    if (income <= 33333) return Math.round(937.50 + (income - 16667) * 0.20);
    if (income <= 83333) return Math.round(4270.83 + (income - 33333) * 0.25);
    if (income <= 333333) return Math.round(16770.83 + (income - 83333) * 0.30);
    return Math.round(91770.83 + (income - 333333) * 0.35);
  } else {
    if (income <= 20833) return 0;
    if (income <= 33333) return Math.round((income - 20833) * 0.15);
    if (income <= 66667) return Math.round(1875 + (income - 33333) * 0.20);
    if (income <= 166667) return Math.round(8541.80 + (income - 66667) * 0.25);
    if (income <= 666667) return Math.round(33541.80 + (income - 166667) * 0.30);
    return Math.round(183541.80 + (income - 666667) * 0.35);
  }
}

/**
 * Compute Complete Philippine Statutory Package for an Employee
 */
function computeEmployeeStatutoryPackage(emp, grossPay, taxableIncome, isSemiMonthly = false) {
  const sss = getSSSContribution2025(emp.base_salary);
  const philhealth = getPhilHealthContribution2025(emp.base_salary);
  const pagibig = getPagIBIGContribution2025(emp.base_salary);
  const birTax = getBIRWithholdingTax(taxableIncome, isSemiMonthly);

  // In semi-monthly payroll, statutory is typically deducted on the 2nd cut-off or halved
  const total_ee_statutory = sss.ee_total + philhealth.ee_share + pagibig.ee_share;
  const total_er_statutory = sss.er_total + philhealth.er_share + pagibig.er_share;

  return {
    employee_id: emp.id,
    employee_code: emp.employee_code,
    full_name: `${emp.first_name} ${emp.last_name}`,
    department: emp.department,
    position: emp.position,
    base_salary: emp.base_salary,
    tin: emp.tin || 'N/A',
    sss_number: emp.sss_number || 'N/A',
    philhealth_number: emp.philhealth_number || 'N/A',
    pagibig_number: emp.pagibig_number || 'N/A',
    gross_pay: grossPay,
    taxable_income: taxableIncome,
    bir_tax: birTax,
    sss,
    philhealth,
    pagibig,
    totals: {
      ee_deduction_total: total_ee_statutory + birTax,
      ee_statutory_only: total_ee_statutory,
      er_statutory_total: total_er_statutory,
      grand_government_remittance: total_ee_statutory + total_er_statutory + birTax
    }
  };
}

module.exports = {
  SSS_2025_TABLE,
  getSSSContribution2025,
  getPhilHealthContribution2025,
  getPagIBIGContribution2025,
  getBIRWithholdingTax,
  computeEmployeeStatutoryPackage
};
