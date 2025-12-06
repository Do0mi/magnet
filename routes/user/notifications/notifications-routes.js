const express = require('express');
const router = express.Router();
const NotificationsController = require('../../../controllers/user/notifications/notifications-controller');
const verifyToken = require('../../../middleware/auth-middleware');

// All notification routes require authentication
router.use(verifyToken);

// POST /api/v1/user/notifications/token - Register/update FCM token
router.post('/token', NotificationsController.registerToken);

// GET /api/v1/user/notifications - Get all notifications with pagination
router.get('/', NotificationsController.getNotifications);

// PATCH /api/v1/user/notifications/:id/read - Mark notification as read
router.patch('/:id/read', NotificationsController.markAsRead);

// PATCH /api/v1/user/notifications/read-all - Mark all notifications as read
router.patch('/read-all', NotificationsController.markAllAsRead);

// DELETE /api/v1/user/notifications/:id - Delete a specific notification
router.delete('/:id', NotificationsController.deleteNotification);

// DELETE /api/v1/user/notifications - Delete all notifications
router.delete('/', NotificationsController.deleteAllNotifications);

module.exports = router;
