const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications - Get role-specific notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const role = req.user?.role || 'employee';
    const result = db.getNotifications(role);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const updated = db.markNotificationAsRead(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification marked as read', notification: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read for current user role
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    const role = req.user?.role || 'employee';
    db.markAllNotificationsAsRead(role);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications/task-queue - Get active task queue counter badges
router.get('/task-queue', authenticateToken, async (req, res) => {
  try {
    const role = req.user?.role || 'employee';
    const counts = db.getTaskQueueCounts(role);
    res.json(counts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
