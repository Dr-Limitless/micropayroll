const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { maskString } = require('../utils/crypto');

// List all employees
router.get('/', async (req, res) => {
  try {
    const employees = await db.getEmployees();
    // Return with masked bank accounts for standard view
    const formatted = employees.map(emp => ({
      ...emp,
      masked_bank_account: maskString(emp.plain_bank_account || '00000000', 4),
      masked_tin: maskString(emp.plain_tin || '000000000', 3)
    }));
    res.json({ employees: formatted, count: formatted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single employee with decrypted details
router.get('/:id', async (req, res) => {
  try {
    const emp = await db.getEmployeeById(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    
    res.json({
      employee: {
        ...emp,
        masked_bank_account: maskString(emp.plain_bank_account, 4),
        masked_tin: maskString(emp.plain_tin, 3)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create employee (with AES-256 encryption)
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, department, position, salary, bank_account, tin } = req.body;
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    const newEmp = await db.createEmployee(req.body);
    res.status(201).json({ message: 'Employee created successfully with AES-256 protection.', employee: newEmp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const updated = await db.updateEmployee(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Employee not found.' });
    res.json({ message: 'Employee updated successfully.', employee: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const success = await db.deleteEmployee(req.params.id);
    if (!success) return res.status(404).json({ error: 'Employee not found.' });
    res.json({ message: 'Employee record removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate / Preview Final Pay (Backpay)
router.get('/:id/final-pay', (req, res) => {
  try {
    const { separation_date, reason, unused_leave_days } = req.query;
    const finalPay = db.computeFinalPay(req.params.id, {
      separation_date,
      reason,
      unused_leave_days: unused_leave_days !== undefined ? Number(unused_leave_days) : undefined
    });
    if (!finalPay) return res.status(404).json({ error: 'Employee not found for final pay calculation.' });
    res.json(finalPay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Execute Employee Offboarding & Backpay Settlement
router.post('/:id/offboard', (req, res) => {
  try {
    const { separation_date, reason, unused_leave_days } = req.body;
    const record = db.offboardEmployee(req.params.id, {
      separation_date,
      reason,
      unused_leave_days: unused_leave_days !== undefined ? Number(unused_leave_days) : undefined
    });
    if (!record) return res.status(404).json({ error: 'Failed to process employee offboarding.' });
    res.json({
      message: `Employee ${record.employee_name} successfully offboarded. Backpay settlement recorded.`,
      offboarding_record: record
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate BIR Form No. 2316 Certificate
router.get('/:id/bir-2316', (req, res) => {
  try {
    const cert = db.generateBIR2316(req.params.id);
    if (!cert) return res.status(404).json({ error: 'Employee not found for BIR Form 2316 generation.' });
    res.json(cert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
