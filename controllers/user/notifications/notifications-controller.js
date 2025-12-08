// Notifications Controller - User Notifications Management
const Notification = require('../../../models/notification-model');
const FCMToken = require('../../../models/fcm-token-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { convertOldNotificationToBilingual } = require('../../../utils/notification-messages');

/**
 * Transform notification data URL from old format (path params) to new format (query params)
 * Converts: /orders/123 -> /orders?orderId=123
 *          /products/456 -> /products?productId=456
 *          /special-orders/789 -> /special-orders?specialOrderId=789
 */
function transformNotificationData(data) {
  if (!data || !data.url) {
    return data || {};
  }

  const transformedData = { ...data };
  const url = data.url;

  // Transform orders URLs: /orders/123 -> /orders?orderId=123
  const ordersMatch = url.match(/^\/orders\/([^\/\?]+)$/);
  if (ordersMatch) {
    const orderId = data.orderId || ordersMatch[1];
    transformedData.url = `/orders?orderId=${orderId}`;
    if (!transformedData.orderId) {
      transformedData.orderId = orderId;
    }
  }

  // Transform products URLs: /products/123 -> /products?productId=123
  const productsMatch = url.match(/^\/products\/([^\/\?]+)$/);
  if (productsMatch) {
    const productId = data.productId || productsMatch[1];
    transformedData.url = `/products?productId=${productId}`;
    if (!transformedData.productId) {
      transformedData.productId = productId;
    }
  }

  // Transform special-orders URLs: /special-orders/123 -> /special-orders?specialOrderId=123
  const specialOrdersMatch = url.match(/^\/special-orders\/([^\/\?]+)$/);
  if (specialOrdersMatch) {
    const specialOrderId = data.specialOrderId || specialOrdersMatch[1];
    transformedData.url = `/special-orders?specialOrderId=${specialOrderId}`;
    if (!transformedData.specialOrderId) {
      transformedData.specialOrderId = specialOrderId;
    }
  }

  return transformedData;
}

/**
 * POST /api/v1/user/notifications/token
 * Register or update FCM token for authenticated user
 */
exports.registerToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    // Validate token
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: {
          en: 'FCM token is required',
          ar: 'رمز FCM مطلوب'
        }
      });
    }

    // Get device info from request (optional)
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || null,
      platform: req.headers['platform'] || null
    };

    // Update or create FCM token (unique per user)
    const tokenDoc = await FCMToken.findOneAndUpdate(
      { userId },
      {
        userId,
        token: token.trim(),
        deviceInfo,
        updatedAt: new Date()
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({
      success: true,
      message: {
        en: 'Token registered successfully',
        ar: 'تم تسجيل الرمز بنجاح'
      },
      data: {
        token: tokenDoc.token
      }
    });
  } catch (error) {
    console.error('Register token error:', error);
    res.status(500).json({
      success: false,
      message: {
        en: 'Failed to register token',
        ar: 'فشل تسجيل الرمز'
      },
      error: error.message
    });
  }
};

/**
 * GET /api/v1/user/notifications
 * Fetch all notifications for authenticated user with pagination
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const read = req.query.read !== undefined ? req.query.read === 'true' : undefined;

    // Validate pagination
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: {
          en: 'Page must be greater than 0',
          ar: 'يجب أن يكون رقم الصفحة أكبر من 0'
        }
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: {
          en: 'Limit must be between 1 and 100',
          ar: 'يجب أن يكون الحد بين 1 و 100'
        }
      });
    }

    // Build query
    const query = { userId };
    if (read !== undefined) {
      query.read = read;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get notifications and total count
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query)
    ]);

    // Get unread count
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    // Format notifications - handle bilingual title and message
    const formattedNotifications = notifications.map(notif => {
      let title, message;
      
      // Check if title/message are objects but have same value for en and ar (old format stored as object)
      const titleIsSame = typeof notif.title === 'object' && notif.title !== null && 
                         notif.title.en === notif.title.ar && notif.title.en;
      const messageIsSame = typeof notif.message === 'object' && notif.message !== null && 
                           notif.message.en === notif.message.ar && notif.message.en;
      
      // If both title and message have same en/ar values, try to convert them
      if (titleIsSame && messageIsSame) {
        const converted = convertOldNotificationToBilingual(notif.title.en, notif.message.en, notif.data || {});
        title = converted.title;
        message = converted.message;
      } else if (typeof notif.title === 'object' && notif.title !== null && notif.title.en && notif.title.ar && 
                 typeof notif.message === 'object' && notif.message !== null && notif.message.en && notif.message.ar) {
        // Already in proper bilingual format
        title = notif.title;
        message = notif.message;
      } else if (typeof notif.title === 'string' || typeof notif.message === 'string') {
        // Old format (string) - try to convert to bilingual
        const titleStr = typeof notif.title === 'string' ? notif.title : (notif.title?.en || notif.title || '');
        const messageStr = typeof notif.message === 'string' ? notif.message : (notif.message?.en || notif.message || '');
        const converted = convertOldNotificationToBilingual(titleStr, messageStr, notif.data || {});
        title = converted.title;
        message = converted.message;
      } else {
        // Fallback
        title = { 
          en: notif.title?.en || (typeof notif.title === 'string' ? notif.title : '') || '', 
          ar: notif.title?.ar || (typeof notif.title === 'string' ? notif.title : '') || '' 
        };
        message = { 
          en: notif.message?.en || (typeof notif.message === 'string' ? notif.message : '') || '', 
          ar: notif.message?.ar || (typeof notif.message === 'string' ? notif.message : '') || '' 
        };
      }
      
      return {
        id: notif._id.toString(),
        title,
        message,
        read: notif.read,
        createdAt: notif.createdAt.toISOString(),
        data: transformNotificationData(notif.data || {})
      };
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page,
          limit,
          total,
          totalPages
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: {
        en: 'Failed to fetch notifications',
        ar: 'فشل جلب الإشعارات'
      },
      error: error.message
    });
  }
};

/**
 * PATCH /api/v1/user/notifications/:id/read
 * Mark a specific notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Find and update notification (verify ownership)
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true, updatedAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: {
          en: 'Notification not found',
          ar: 'الإشعار غير موجود'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: {
        en: 'Notification marked as read',
        ar: 'تم تمييز الإشعار كمقروء'
      },
      data: {
        notification: (() => {
          let title, message;
          
          // Check if title/message are objects but have same value for en and ar (old format stored as object)
          const titleIsSame = typeof notification.title === 'object' && notification.title !== null && 
                             notification.title.en === notification.title.ar && notification.title.en;
          const messageIsSame = typeof notification.message === 'object' && notification.message !== null && 
                               notification.message.en === notification.message.ar && notification.message.en;
          
          // If both title and message have same en/ar values, try to convert them
          if (titleIsSame && messageIsSame) {
            const converted = convertOldNotificationToBilingual(notification.title.en, notification.message.en, notification.data || {});
            title = converted.title;
            message = converted.message;
          } else if (typeof notification.title === 'object' && notification.title !== null && notification.title.en && notification.title.ar && 
                     typeof notification.message === 'object' && notification.message !== null && notification.message.en && notification.message.ar) {
            // Already in proper bilingual format
            title = notification.title;
            message = notification.message;
          } else if (typeof notification.title === 'string' || typeof notification.message === 'string') {
            // Old format (string) - try to convert to bilingual
            const titleStr = typeof notification.title === 'string' ? notification.title : (notification.title?.en || notification.title || '');
            const messageStr = typeof notification.message === 'string' ? notification.message : (notification.message?.en || notification.message || '');
            const converted = convertOldNotificationToBilingual(titleStr, messageStr, notification.data || {});
            title = converted.title;
            message = converted.message;
          } else {
            // Fallback
            title = { 
              en: notification.title?.en || (typeof notification.title === 'string' ? notification.title : '') || '', 
              ar: notification.title?.ar || (typeof notification.title === 'string' ? notification.title : '') || '' 
            };
            message = { 
              en: notification.message?.en || (typeof notification.message === 'string' ? notification.message : '') || '', 
              ar: notification.message?.ar || (typeof notification.message === 'string' ? notification.message : '') || '' 
            };
          }
          
          return {
            id: notification._id.toString(),
            title,
            message,
            read: notification.read,
            createdAt: notification.createdAt.toISOString(),
            data: transformNotificationData(notification.data || {})
          };
        })()
      }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: {
        en: 'Failed to mark notification as read',
        ar: 'فشل تمييز الإشعار كمقروء'
      },
      error: error.message
    });
  }
};

/**
 * PATCH /api/v1/user/notifications/read-all
 * Mark all notifications as read for authenticated user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update all unread notifications
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true, updatedAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: {
        en: 'All notifications marked as read',
        ar: 'تم تمييز جميع الإشعارات كمقروءة'
      },
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: {
        en: 'Failed to mark all notifications as read',
        ar: 'فشل تمييز جميع الإشعارات كمقروءة'
      },
      error: error.message
    });
  }
};

/**
 * DELETE /api/v1/user/notifications/:id
 * Delete a specific notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Find and delete notification (verify ownership)
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: {
          en: 'Notification not found',
          ar: 'الإشعار غير موجود'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: {
        en: 'Notification deleted successfully',
        ar: 'تم حذف الإشعار بنجاح'
      }
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: {
        en: 'Failed to delete notification',
        ar: 'فشل حذف الإشعار'
      },
      error: error.message
    });
  }
};

/**
 * DELETE /api/v1/user/notifications
 * Delete all notifications for authenticated user
 */
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all notifications for user
    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: {
        en: 'All notifications deleted',
        ar: 'تم حذف جميع الإشعارات'
      },
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: {
        en: 'Failed to delete all notifications',
        ar: 'فشل حذف جميع الإشعارات'
      },
      error: error.message
    });
  }
};
