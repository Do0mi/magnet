# Backend API Implementation Prompt for Notifications Feature
# موجه تنفيذ واجهة برمجة التطبيقات الخلفية لميزة الإشعارات

## Overview / نظرة عامة

Implement a notifications system using Firebase Cloud Messaging (FCM) for a React web application. The frontend is already implemented and automatically sends FCM tokens to the backend when users authenticate. You need to implement the backend API endpoints to handle notifications.

قم بتنفيذ نظام إشعارات باستخدام Firebase Cloud Messaging (FCM) لتطبيق React. الواجهة الأمامية جاهزة بالفعل وترسل تلقائياً رموز FCM إلى الخادم عند مصادقة المستخدمين. تحتاج إلى تنفيذ نقاط نهاية واجهة برمجة التطبيقات الخلفية للتعامل مع الإشعارات.

## Important: Frontend Behavior / مهم: سلوك الواجهة الأمامية

**The frontend automatically sends FCM tokens to the backend** when:
- User logs in and grants notification permission
- The `initializeFCM()` function is called, which:
  1. Requests notification permission
  2. Gets FCM token from Firebase
  3. **Automatically calls `POST /api/v1/user/notifications/token`** with the token

**الواجهة الأمامية ترسل تلقائياً رموز FCM إلى الخادم** عندما:
- يسجل المستخدم دخوله ويمنح إذن الإشعارات
- يتم استدعاء الدالة `initializeFCM()` التي:
  1. تطلب إذن الإشعارات
  2. تحصل على رمز FCM من Firebase
  3. **تستدعي تلقائياً `POST /api/v1/user/notifications/token`** مع الرمز

## Required API Endpoints / نقاط النهاية المطلوبة

### Base URL: `/api/v1/user/notifications`

### 1. **POST `/api/v1/user/notifications/token`** ⭐ REQUIRED FIRST
   - **Purpose**: Register/update FCM token for authenticated user
   - **When Called**: Automatically by frontend when user grants notification permission
   - **Request Body**:
     ```json
     {
       "token": "string (FCM token from frontend)"
     }
     ```
   - **Response**:
     ```json
     {
       "success": true,
       "message": "Token registered successfully",
       "data": {
         "token": "string"
       }
     }
     ```
   - **Auth**: Required (Bearer token)
   - **Notes**: 
     - Store token in database linked to user ID
     - Update if token already exists for this user
     - Handle token refresh (same user, new token = update)
     - This endpoint is called automatically by frontend - no manual trigger needed

### 2. **GET `/api/v1/user/notifications`**
   - **Purpose**: Fetch all notifications for authenticated user
   - **Query Parameters** (optional):
     - `page`: number (default: 1)
     - `limit`: number (default: 20)
     - `read`: boolean (filter by read/unread status)
   - **Response**:
     ```json
     {
       "success": true,
       "data": {
         "notifications": [
           {
             "id": "string",
             "title": "string",
             "message": "string",
             "read": boolean,
             "createdAt": "ISO date string",
             "data": {
               "url": "string (optional - for navigation)",
               "type": "string (optional - notification type)",
               "orderId": "string (optional)",
               "productId": "string (optional)"
             }
           }
         ],
         "pagination": {
           "page": 1,
           "limit": 20,
           "total": 100,
           "totalPages": 5
         },
         "unreadCount": 15
       }
     }
     ```
   - **Auth**: Required
   - **Notes**: Return notifications sorted by `createdAt` DESC (newest first)

### 3. **PATCH `/api/v1/user/notifications/:id/read`**
   - **Purpose**: Mark a specific notification as read
   - **URL Parameters**: `id` (notification ID)
   - **Response**:
     ```json
     {
       "success": true,
       "message": "Notification marked as read",
       "data": {
         "notification": { ... }
       }
     }
     ```
   - **Auth**: Required
   - **Notes**: Verify notification belongs to authenticated user

### 4. **PATCH `/api/v1/user/notifications/read-all`**
   - **Purpose**: Mark all notifications as read for authenticated user
   - **Response**:
     ```json
     {
       "success": true,
       "message": "All notifications marked as read",
       "data": {
         "updatedCount": 15
       }
     }
     ```
   - **Auth**: Required

### 5. **DELETE `/api/v1/user/notifications/:id`**
   - **Purpose**: Delete a specific notification
   - **URL Parameters**: `id` (notification ID)
   - **Response**:
     ```json
     {
       "success": true,
       "message": "Notification deleted successfully"
     }
     ```
   - **Auth**: Required
   - **Notes**: Verify notification belongs to authenticated user

### 6. **DELETE `/api/v1/user/notifications`**
   - **Purpose**: Delete all notifications for authenticated user
   - **Response**:
     ```json
     {
       "success": true,
       "message": "All notifications deleted",
       "data": {
         "deletedCount": 50
       }
     }
     ```
   - **Auth**: Required

## Database Schema / مخطط قاعدة البيانات

### Notifications Collection/Table:
```javascript
{
  id: String (UUID or ObjectId),
  userId: String (Reference to User),
  title: String (required),
  message: String (required),
  read: Boolean (default: false),
  data: Object (optional) {
    url: String,
    type: String,
    orderId: String,
    productId: String,
    // ... any other custom data
  },
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

### FCM Tokens Collection/Table:
```javascript
{
  id: String (UUID or ObjectId),
  userId: String (Reference to User, unique index),
  token: String (required, unique per user),
  deviceInfo: Object (optional) {
    userAgent: String,
    platform: String
  },
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

**Important**: Create a unique index on `userId` in FCM Tokens table to ensure one token per user (update on duplicate).

## FCM Integration / تكامل FCM

### Setup Firebase Admin SDK:
```javascript
// Install: npm install firebase-admin

const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

### Send Notification Function:
Create a function to send notifications via FCM:

```javascript
// Example using Firebase Admin SDK
const admin = require('firebase-admin');

async function sendNotification(userId, title, message, data = {}) {
  try {
    // 1. Get user's FCM token from database
    const tokenDoc = await FCMToken.findOne({ userId });
    if (!tokenDoc || !tokenDoc.token) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, message: 'No FCM token found' };
    }

    // 2. Create notification in database
    const notification = await Notification.create({
      userId,
      title,
      message,
      read: false,
      data,
      createdAt: new Date()
    });

    // 3. Send via FCM
    const message = {
      notification: {
        title: title,
        body: message
      },
      data: {
        ...data,
        notificationId: notification.id.toString(),
        createdAt: notification.createdAt.toISOString()
      },
      token: tokenDoc.token
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);

    return {
      success: true,
      notificationId: notification.id,
      fcmMessageId: response
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // If FCM fails, still save notification in database
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      // Remove invalid token
      await FCMToken.deleteOne({ userId, token: tokenDoc.token });
    }
    
    return { success: false, error: error.message };
  }
}
```

### Send to Multiple Users:
```javascript
async function sendBulkNotifications(userIds, title, message, data = {}) {
  const tokens = await FCMToken.find({ userId: { $in: userIds } });
  const validTokens = tokens.map(t => t.token);
  
  // Create notifications in database
  const notifications = await Notification.insertMany(
    userIds.map(userId => ({
      userId,
      title,
      message,
      read: false,
      data,
      createdAt: new Date()
    }))
  );

  // Send via FCM multicast
  const message = {
    notification: {
      title: title,
      body: message
    },
    data: {
      ...data
    },
    tokens: validTokens
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  return { success: true, successCount: response.successCount };
}
```

## Authentication & Authorization / المصادقة والتفويض

- All endpoints require authentication (Bearer token)
- Verify notification ownership (user can only access their notifications)
- Use existing auth middleware (e.g., `verifyToken`, `requireCustomer`)

## Error Handling / معالجة الأخطاء

Standard error responses:
```json
{
  "success": false,
  "message": "Error message in English/Arabic",
  "error": "Detailed error (optional)"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (not authorized)
- `404`: Not Found
- `500`: Internal Server Error

## Additional Features / ميزات إضافية

### 1. Notification Types:
Support different types:
- `order`: Order updates
- `product`: Product-related
- `system`: System notifications
- `promotion`: Promotions/discounts

### 2. Notification Preferences:
Allow users to configure notification preferences:
```javascript
{
  userId: String,
  orderNotifications: Boolean (default: true),
  productNotifications: Boolean (default: true),
  systemNotifications: Boolean (default: true),
  promotionNotifications: Boolean (default: true)
}
```

### 3. Scheduled Notifications:
Support scheduled notifications (e.g., order reminders)

### 4. Notification Templates:
Create templates for common notifications:
- Order confirmed
- Order shipped
- Order delivered
- Product back in stock
- New review on product

## Testing / الاختبار

Test scenarios:
1. ✅ Register FCM token (called automatically by frontend)
2. ✅ Fetch notifications (with pagination)
3. ✅ Mark notification as read
4. ✅ Mark all as read
5. ✅ Delete single notification
6. ✅ Delete all notifications
7. ✅ Send notification via FCM
8. ✅ Handle invalid/expired FCM tokens
9. ✅ Verify user can only access their notifications
10. ✅ Test token update (same user, new token)

## Example Usage / مثال على الاستخدام

### Sending Notification When Order is Placed:
```javascript
// In your order controller
const order = await createOrder(orderData);

// Send notification
await sendNotification(
  order.userId,
  'Order Confirmed',
  `Your order #${order.id} has been confirmed`,
  {
    type: 'order',
    url: `/orders/${order.id}`,
    orderId: order.id
  }
);
```

### Sending Notification When Order Status Changes:
```javascript
await updateOrderStatus(orderId, 'shipped');

await sendNotification(
  order.userId,
  'Order Shipped',
  `Your order #${orderId} has been shipped`,
  {
    type: 'order',
    url: `/orders/${orderId}`,
    orderId: orderId,
    status: 'shipped'
  }
);
```

## Implementation Priority / أولوية التنفيذ

1. **HIGH PRIORITY** ⭐:
   - `POST /api/v1/user/notifications/token` - **MUST BE IMPLEMENTED FIRST**
   - `GET /api/v1/user/notifications` - For displaying notifications
   - `PATCH /api/v1/user/notifications/:id/read` - Basic functionality

2. **MEDIUM PRIORITY**:
   - `PATCH /api/v1/user/notifications/read-all` - User convenience
   - `DELETE /api/v1/user/notifications/:id` - User convenience
   - `DELETE /api/v1/user/notifications` - User convenience

3. **LOW PRIORITY**:
   - Notification preferences
   - Scheduled notifications
   - Notification templates

## Notes / ملاحظات

1. **Firebase Admin SDK**: Install and initialize Firebase Admin SDK in backend
2. **VAPID Key**: Use the same VAPID key from frontend configuration (already set in frontend)
3. **Token Management**: 
   - Handle token refresh and cleanup of invalid tokens
   - One token per user (update on duplicate)
   - Remove tokens when user logs out (optional)
4. **Performance**: Index `userId` and `createdAt` for faster queries
5. **Rate Limiting**: Consider rate limiting for notification sending
6. **Localization**: Support English/Arabic messages based on user preference
7. **Frontend Integration**: The frontend automatically handles token registration - you just need to implement the endpoint

## Dependencies / التبعيات

```json
{
  "firebase-admin": "^12.0.0",
  // ... your existing dependencies
}
```

## Frontend Integration Notes / ملاحظات تكامل الواجهة الأمامية

- The frontend **automatically calls** `POST /api/v1/user/notifications/token` when:
  - User logs in
  - User grants notification permission
  - FCM token is obtained
  
- No manual API calls needed from frontend for token registration
- Frontend expects standard response format: `{ success: true, message: "...", data: {...} }`
- Frontend handles errors gracefully - failed token registration won't break the app

---

**This prompt provides all the backend requirements. The frontend is ready and will work once these endpoints are implemented.**

**يوفر هذا الموجه جميع متطلبات الخادم. الواجهة الأمامية جاهزة وستعمل بمجرد تنفيذ نقاط النهاية هذه.**
