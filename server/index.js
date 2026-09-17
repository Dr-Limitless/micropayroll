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
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 MMS API Server running on http://localhost:${PORT}`);
  console.log(`🔐 Cryptography Engine: AES-256-GCM & OAuth 2.0 / JWT Enabled`);
  console.log(`📊 Target Database: PostgreSQL "micropayroll"`);
});
