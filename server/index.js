require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const payrollRoutes = require('./routes/payroll');
const microloanRoutes = require('./routes/microloans');
const securityRoutes = require('./routes/security');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'X-User-Role']
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/microloans', microloanRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Microfinancial Management System (MMS) HR & Payroll API',
    version: '2.4.0',
    timestamp: new Date().toISOString()
  });
});

// Global process resilience guards
const fs = require('fs');
const path = require('path');
const exitLog = path.join(__dirname, 'exit.log');

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err.stack || err.message);
  try { fs.appendFileSync(exitLog, `[${new Date().toISOString()}] Uncaught Exception: ${err.stack || err.message}\n`); } catch {}
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
  try { fs.appendFileSync(exitLog, `[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n`); } catch {}
});

process.on('exit', (code) => {
  console.log(`🔴 Process exited with code ${code}`);
  try { fs.appendFileSync(exitLog, `[${new Date().toISOString()}] Process exit with code: ${code}\n`); } catch {}
});

process.on('SIGINT', () => {
  try { fs.appendFileSync(exitLog, `[${new Date().toISOString()}] Received SIGINT\n`); } catch {}
  process.exit(0);
});

process.on('SIGTERM', () => {
  try { fs.appendFileSync(exitLog, `[${new Date().toISOString()}] Received SIGTERM\n`); } catch {}
  process.exit(0);
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 MMS API Server running on http://localhost:${PORT}`);
  console.log(`🔐 Cryptography Engine: AES-256-GCM & OAuth 2.0 / JWT Enabled`);
  console.log(`📊 Target Database: PostgreSQL "micropayroll"`);
});
