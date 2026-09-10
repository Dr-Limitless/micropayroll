const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all microloans & advances
router.get('/', authenticateToken, async (req, res) => {
  try {
    const loans = await db.getMicroloans();
    // If employee role, filter to own loans
    if (req.user && req.user.role === 'employee') {
      const ownLoans = loans.filter(l => l.employee_name && l.employee_name.toLowerCase().includes(req.user.name.toLowerCase()));
      return res.json({ microloans: ownLoans, count: ownLoans.length });
    }
    res.json({ microloans: loans, count: loans.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a new advance/loan request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { employee_id, loan_type, principal_amount, total_installments, reason } = req.body;
    if (!principal_amount) {
      return res.status(400).json({ error: 'Principal amount is required.' });
    }

    const payload = {
      ...req.body,
      employee: req.user.role === 'employee' ? req.user.name : req.body.employee
    };

    const newLoan = await db.createMicroloan(payload);
    res.status(201).json({ message: 'Microfinance assistance request submitted.', microloan: newLoan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve or Reject loan request (Finance Director or Admin only)
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'director']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required.' });

    const approverName = req.user?.name || req.body.approver_name || 'David Sterling (Finance Director)';
    const updated = await db.updateMicroloanStatus(req.params.id, status, approverName);
    if (!updated) return res.status(404).json({ error: 'Microloan request not found.' });

    res.json({ message: `Microloan status updated to ${status}.`, microloan: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
