const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// =========================================================================
// 1. PAYROLL COMPUTATION & LIFECYCLE
// =========================================================================
router.get('/computation', (req, res) => {
  try {
    const month = req.query.month || 'July 2024';
    const data = db.getComputationData(month);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/compute', authenticateToken, requireRole(['admin', 'officer']), async (req, res) => {
  try {
    const { month } = req.body;
    const periodName = month || 'July 2024';

    // Enforce pipeline gate: period must be in Approved status before computation
    const periods = await db.getPayrollPeriods();
    const targetPeriod = Array.isArray(periods)
      ? periods.find(p => p.period_name === periodName)
      : null;

    if (targetPeriod && !['Approved', 'Finalized', 'Paid'].includes(targetPeriod.status)) {
      return res.status(403).json({
        error: `Payroll computation requires Finance Director approval first. ` +
               `"${periodName}" is currently "${targetPeriod.status}". ` +
               `Please complete the pipeline: Draft → For Review → Approved.`
      });
    }

    const result = db.computePayrollMonth(periodName);
    res.json({ message: 'Live cross-module payroll computation executed successfully.', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/periods', async (req, res) => {
  try {
    const periods = await db.getPayrollPeriods();
    res.json(periods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/period', authenticateToken, requireRole(['admin', 'officer']), async (req, res) => {
  try {
    const result = await db.createPayrollPeriod(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/period/:month/status', authenticateToken, requireRole(['admin', 'officer', 'director']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    // Role permissions (enforcing operational role defaults with admin superuser capability):
    // 1. Preparation & Submit for review: Payroll Officer or Admin
    if (status === 'For Review' && !['admin', 'officer'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Separation of Duties: Submitting payroll for review requires Payroll Officer authorization.' });
    }

    // 2. Executive approvals & disbursements: Finance Director or Admin
    if (['Approved', 'Finalized', 'Disbursed', 'Paid'].includes(status) && !['admin', 'director'].includes(req.user.role)) {
      return res.status(403).json({ error: `Separation of Duties: Advancing payroll period to '${status}' requires Finance Director approval.` });
    }

    const updated = await db.updatePayrollPeriodStatus(req.params.month, status, req.user?.full_name || req.user?.role_label);
    if (!updated) return res.status(404).json({ error: 'Payroll period not found.' });
    res.json({ message: `Payroll period status advanced to ${status}.`, ...updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ppa/pending', authenticateToken, (req, res) => {
  try {
    const ppa = db.getPpaPending();
    res.json(ppa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/period/rollover', authenticateToken, requireRole(['admin', 'director']), (req, res) => {
  try {
    const { month } = req.body;
    const result = db.rolloverPeriod(month || 'July 16–31, 2024');
    if (!result) return res.status(400).json({ error: 'Could not determine next cycle for rollover.' });
    res.json({ message: 'Automated period rollover executed.', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/employee/:id/status', (req, res) => {
  try {
    const { month, status } = req.body;
    const updated = db.updateEmployeeStatus(month || 'July 2024', req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Employee item not found.' });
    res.json({ message: 'Employee status updated.', employee: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employee', authenticateToken, requireRole(['admin', 'manager', 'officer', 'director']), async (req, res) => {
  try {
    const { employee, month } = req.body;
    if (!employee || !employee.first_name || !employee.last_name) {
      return res.status(400).json({ error: 'First name and last name are required.' });
    }
    const created = await db.createEmployee(employee);
    if (month && db.syncPeriodComputation) {
      db.syncPeriodComputation(month, true);
    }
    res.status(201).json({ message: 'Employee registered into master record & payroll.', employee: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 2. TIMEKEEPING & ATTENDANCE INTEGRATION
// =========================================================================
router.get('/attendance', async (req, res) => {
  try {
    const attendance = await db.getAttendance();
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/attendance', async (req, res) => {
  try {
    const logged = await db.logAttendance(req.body);
    res.status(201).json({ message: 'Attendance recorded successfully.', log: logged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/attendance/:id/approve', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { status, approver } = req.body;
    const approverName = approver || req.user?.name || 'HR Manager';
    const approved = await db.approveAttendance(req.params.id, status || 'Approved', approverName);
    if (!approved) return res.status(404).json({ error: 'Attendance record not found.' });
    res.json({ message: `Attendance ${status || 'Approved'}. Overtime synced to payroll.`, log: approved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 3. COMPENSATION PLANNING: STRUCTURE, ADJUSTMENTS, ALLOWANCES
// =========================================================================
router.get('/compensation', async (req, res) => {
  try {
    const compensation = await db.getCompensation();
    res.json(compensation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/compensation/adjustments', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const adjustment = await db.createSalaryAdjustment(req.body);
    res.status(201).json({ message: 'Salary adjustment submitted for review.', adjustment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/compensation/adjustments/:id/status', authenticateToken, requireRole(['admin', 'director']), async (req, res) => {
  try {
    const { status, approver } = req.body;
    const approverName = approver || req.user?.name || 'Finance Director';
    const updated = await db.updateSalaryAdjustmentStatus(req.params.id, status, approverName);
    if (!updated) return res.status(404).json({ error: 'Salary adjustment record not found.' });
    res.json({ message: `Salary adjustment updated to ${status}.`, adjustment: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/compensation/allowance/:id', authenticateToken, requireRole(['admin', 'manager', 'officer']), async (req, res) => {
  try {
    const allowanceVal = req.body.allowance !== undefined ? req.body.allowance : req.body.amount;
    const updated = await db.updateAllowance(req.params.id, allowanceVal);
    res.json({ message: 'Employee allowance updated and synced to payroll.', allowance: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 4. CLAIMS & REIMBURSEMENTS
// =========================================================================
router.get('/claims', async (req, res) => {
  try {
    const claims = await db.getClaims();
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/claims', async (req, res) => {
  try {
    const claim = await db.createClaim(req.body);
    res.status(201).json({ message: 'Claim submitted successfully.', claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/claims/:id/status', authenticateToken, requireRole(['admin', 'manager', 'officer']), async (req, res) => {
  try {
    const { status, approver } = req.body;
    const approverName = approver || req.user?.name || 'Authorized Approver';
    const updated = await db.updateClaimStatus(req.params.id, status, approverName);
    if (!updated) return res.status(404).json({ error: 'Claim not found.' });
    res.json({
      message: `Claim status changed to ${status}. ${status === 'Approved' ? 'Included in payroll reimbursement.' : ''}`,
      claim: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 5. HMO & BENEFITS ADMINISTRATION
// =========================================================================
router.get('/benefits', async (req, res) => {
  try {
    const benefits = await db.getBenefits();
    res.json({ benefits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/benefits/enroll', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const enrolled = await db.enrollBenefit(req.body);
    res.status(201).json({ message: 'Employee enrolled in HMO. Deduction active in payroll.', benefit: enrolled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/benefits/:id/status', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await db.updateHMOStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Benefit enrollment record not found.' });
    res.json({ message: `Benefit enrollment status updated to ${status}.`, benefit: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 6. SINGLE PAYSLIP ENDPOINT (Full Cross-Module Advice)
// =========================================================================
router.get('/payslip/:id', (req, res) => {
  try {
    const month = req.query.month || 'July 2024';
    const payslip = db.getPayslip(req.params.id, month);
    if (!payslip) return res.status(404).json({ error: 'Payslip not found.' });
    res.json({ payslip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 7. HR ANALYTICS & REPORTING
// =========================================================================
router.get('/dashboard/realtime', (req, res) => {
  try {
    const month = req.query.month || 'July 2024';
    const data = db.getRealtimeDashboardData(month);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/financial', authenticateToken, requireRole(['admin', 'officer', 'director']), (req, res) => {
  try {
    const month = req.query.month || 'July 2024';
    const data = db.getFinancialReportsData(month);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/compliance', authenticateToken, requireRole(['admin', 'manager', 'officer', 'director', 'employee']), (req, res) => {
  try {
    const month = req.query.month || 'July 2024';
    const userRole = req.user?.role;
    
    // If the caller is an employee, only return their personal statutory contributions statement!
    if (userRole === 'employee') {
      const userIdentifier = req.user.email || req.user.sub || req.user.id;
      const data = db.getEmployeePersonalComplianceData(userIdentifier, month);
      return res.json(data);
    }

    // For higher roles (admin, manager, officer, director): return full overall company compliance data
    const data = db.getComplianceReportsData(month);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/sss-schedule', authenticateToken, (req, res) => {
  try {
    const data = db.getComplianceReportsData();
    res.json({ schedule: data.official_sss_schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
