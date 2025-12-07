# Complete Notifications Triggers Report / تقرير شامل لمشغلات الإشعارات
# 📱 When Notifications Are Sent / متى يتم إرسال الإشعارات

This document provides a complete scan of all notification triggers in the codebase.

يوفر هذا المستند فحصاً كاملاً لجميع مشغلات الإشعارات في قاعدة الكود.

---

## 📋 Table of Contents / جدول المحتويات

1. [Order Notifications / إشعارات الطلبات](#1-order-notifications--إشعارات-الطلبات)
2. [Product Notifications / إشعارات المنتجات](#2-product-notifications--إشعارات-المنتجات)
3. [Business Status Notifications / إشعارات حالة الأعمال](#3-business-status-notifications--إشعارات-حالة-الأعمال)
4. [Summary / الملخص](#summary--الملخص)

---

## 1. Order Notifications / إشعارات الطلبات

### 1.1 Order Placed (Customer Creates Order) / طلب تم وضعه (العميل ينشئ طلب)

**Location / الموقع:**
- File: `controllers/user/orders/orders-controller.js`
- Function: `exports.createOrder`
- Line: ~236

**Trigger / المشغل:**
- When a customer or business user creates a new order
- Order status is set to `pending`
- After order is successfully saved to database

**Notification Details / تفاصيل الإشعار:**
```javascript
{
  title: "Order Placed",
  message: "Your order ORD-XXXX has been placed and is pending confirmation",
  data: {
    type: "order",
    url: "/orders/:orderId",
    orderId: "...",
    orderNumber: "ORD-XXXX"
  }
}
```

**Recipient / المستلم:**
- The customer who created the order (`order.customer`)

**API Endpoint / نقطة النهاية:**
- `POST /api/v1/user/orders`

---

### 1.2 Order Confirmed (Admin Creates Order) / طلب مؤكد (المدير ينشئ طلب)

**Location / الموقع:**
- File: `controllers/dashboard/orders/orders-controller.js`
- Function: `exports.createOrder`
- Line: ~257

**Trigger / المشغل:**
- When admin or employee creates an order for a customer
- Order status is automatically set to `confirmed`
- After order is successfully saved to database

**Notification Details / تفاصيل الإشعار:**
```javascript
{
  title: "Order Confirmed",
  message: "Your order ORD-XXXX has been confirmed",
  data: {
    type: "order_confirmed",
    url: "/orders/:orderId",
    orderId: "...",
    orderNumber: "ORD-XXXX"
  }
}
```

**Recipient / المستلم:**
- The customer for whom the order was created (`order.customer`)

**API Endpoint / نقطة النهاية:**
- `POST /api/v1/dashboard/orders/order`

---

### 1.3 Order Status Updated (Dashboard) / تحديث حالة الطلب (لوحة التحكم)

**Location / الموقع:**
- File: `controllers/dashboard/orders/orders-controller.js`
- Function: `exports.updateOrder`
- Line: ~473

**Trigger / المشغل:**
- When admin/employee updates order status via dashboard
- Only triggers if status actually changes (oldStatus !== newStatus)
- Statuses: `confirmed`, `shipped`, `delivered`, `cancelled`

**Notification Details / تفاصيل الإشعار:**

**When status = 'confirmed':**
```javascript
{
  title: "Order Confirmed",
  message: "Your order ORD-XXXX has been confirmed",
  data: {
    type: "order_confirmed",
    url: "/orders/:orderId",
    orderId: "...",
    orderNumber: "ORD-XXXX"
  }
}
```

**When status = 'shipped':**
```javascript
{
  title: "Order Shipped",
  message: "Your order ORD-XXXX has been shipped",
  data: {
    type: "order_shipped",
    url: "/orders/:orderId",
    orderId: "...",
    orderNumber: "ORD-XXXX"
  }
}
```

**When status = 'delivered':**
```javascript
{
  title: "Order Delivered",
  message: "Your order ORD-XXXX has been delivered",
  data: {
    type: "order_delivered",
    url: "/orders/:orderId",
    orderId: "...",
    orderNumber: "ORD-XXXX"
  }
}
```

**When status = 'cancelled':**
```javascript
{
  title: "Order Cancelled",
  message: "Your order ORD-XXXX has been cancelled",
  data: {
    type: "order_cancelled",
    url: "/orders/:orderId",
    orderId: "...",
    orderNumber: "ORD-XXXX"
  }
}
```

**Recipient / المستلم:**
- The customer who owns the order (`order.customer`)

**API Endpoint / نقطة النهاية:**
- `PUT /api/v1/dashboard/orders/order/:id`

**Note / ملاحظة:**
- Notification is only sent if status field is provided AND status actually changed
- Other order updates (items, shipping address, etc.) do NOT trigger notifications

---

### 1.4 Order Cancelled (Customer Cancels) / طلب ملغي (العميل يلغي)

**Location / الموقع:**
- File: `controllers/user/orders/orders-controller.js`
- Function: `exports.cancelOrder`
- Line: ~591

**Trigger / المشغل:**
- When customer cancels their own order
- Only allowed if order status is NOT `shipped` or `delivered`
- After order status is updated to `cancelled`
- After product stock is restored

**Notification Details / تفاصيل الإشعار:**
```javascript
{
  title: "Order Cancelled",
  message: "Your order ORD-XXXX has been cancelled",
  data: {
    type: "order_cancelled",
    url: "/orders/:orderId",
    orderId: "...",
    orderNumber: "ORD-XXXX"
  }
}
```

**Recipient / المستلم:**
- The customer who cancelled the order (`updatedOrder.customer`)

**API Endpoint / نقطة النهاية:**
- `PUT /api/v1/user/orders/order/:id/cancel`

---

## 2. Product Notifications / إشعارات المنتجات

### 2.1 Product Approved / منتج معتمد

**Location / الموقع:**
- File: `controllers/dashboard/products/products-controller.js`
- Function: `exports.approveProduct`
- Line: ~599

**Trigger / المشغل:**
- When admin/employee approves a product via the approve endpoint
- Product status changes to `approved`
- Product `isAllowed` is set to `true`
- After product is successfully updated

**Notification Details / تفاصيل الإشعار:**
```javascript
{
  title: "Product Approved",
  message: "Your product \"[Product Name]\" has been approved and is now live",
  data: {
    type: "product",
    url: "/products/:productId",
    productId: "..."
  }
}
```

**Recipient / المستلم:**
- The product owner (`product.owner`)

**API Endpoint / نقطة النهاية:**
- `PUT /api/v1/dashboard/products/product/:id/approve`

**Additional Notes / ملاحظات إضافية:**
- Also sends email notification (existing functionality)
- Product name is extracted from `product.name.en` or `product.name.ar`

---

### 2.2 Product Declined / منتج مرفوض

**Location / الموقع:**
- File: `controllers/dashboard/products/products-controller.js`
- Function: `exports.declineProduct`
- Line: ~680

---

### 2.3 Product Status Changed (General Update) / تغيير حالة المنتج (تحديث عام)

**Location / الموقع:**
- File: `controllers/dashboard/products/products-controller.js`
- Function: `exports.updateProduct`
- Line: ~476-510

**Trigger / المشغل:**
- When admin/employee updates a product and changes `status` field
- Only triggers if status actually changed (oldStatus !== newStatus)
- Statuses: `approved`, `declined`
- After product is successfully updated

**Notification Details / تفاصيل الإشعار:**

**When status = 'approved':**
```javascript
{
  title: "Product Approved",
  message: "Your product \"[Product Name]\" has been approved and is now live",
  data: {
    type: "product",
    url: "/products/:productId",
    productId: "..."
  }
}
```

**When status = 'declined':**
```javascript
{
  title: "Product Declined",
  message: "Your product \"[Product Name]\" has been declined: [reason]",
  data: {
    type: "product",
    url: "/products/:productId",
    productId: "..."
  }
}
```

**Recipient / المستلم:**
- The product owner (`product.owner`)

**API Endpoint / نقطة النهاية:**
- `PUT /api/v1/dashboard/products/product/:id`

**Additional Notes / ملاحظات إضافية:**
- Also sends email notification (existing functionality)
- Push notification now included for consistency
- Rejection reason is included in the message if provided

---

### 2.4 Product Declined (Specific Endpoint) / منتج مرفوض (نقطة نهاية محددة)

**Trigger / المشغل:**
- When admin/employee declines a product via the decline endpoint
- Product status changes to `declined`
- Product `isAllowed` is set to `false`
- Requires `rejectionReason` in request body
- After product is successfully updated

**Notification Details / تفاصيل الإشعار:**
```javascript
{
  title: "Product Declined",
  message: "Your product \"[Product Name]\" has been declined: [reason]",
  data: {
    type: "product",
    url: "/products/:productId",
    productId: "..."
  }
}
```

**Recipient / المستلم:**
- The product owner (`product.owner`)

**API Endpoint / نقطة النهاية:**
- `PUT /api/v1/dashboard/products/product/:id/decline`

**Additional Notes / ملاحظات إضافية:**
- Also sends email notification (existing functionality)
- Rejection reason is included in the message if provided

---

## 3. Business Status Notifications / إشعارات حالة الأعمال

### 3.1 Business Approved (Specific Endpoint) / أعمال معتمدة (نقطة نهاية محددة)

**Location / الموقع:**
- File: `controllers/dashboard/users/users-controller.js`
- Function: `exports.approveBusinessUser`
- Line: ~687

**Trigger / المشغل:**
- When admin/employee approves a business user via the approve endpoint
- Business `approvalStatus` changes to `approved`
- Business `isAllowed` is set to `true`
- Only triggers if business was NOT already approved
- After business is successfully updated

**Notification Details / تفاصيل الإشعار:**
```javascript
{
  title: "Business Approved",
  message: "Your business \"[Company Name]\" has been approved. You can now access all features.",
  data: {
    type: "profile_update",
    url: "/profile"
  }
}
```

**Recipient / المستلم:**
- The business user (`updatedBusiness._id`)

**API Endpoint / نقطة النهاية:**
- `PUT /api/v1/dashboard/users/business/:id/approve`

**Additional Notes / ملاحظات إضافية:**
- Also sends email notification (existing functionality)
- Company name is extracted from `businessInfo.companyName` or defaults to "Your Business"

---

### 3.2 Business Rejected (Specific Endpoint) / أعمال مرفوضة (نقطة نهاية محددة)

**Location / الموقع:**
- File: `controllers/dashboard/users/users-controller.js`
- Function: `exports.declineBusinessUser`
- Line: ~793

**Trigger / المشغل:**
- When admin/employee rejects a business user via the decline endpoint
- Business `approvalStatus` changes to `rejected`
- Business `isAllowed` is set to `false`
- Requires `rejectionReason` in request body
- Only triggers if business was NOT already rejected
- After business is successfully updated

**Notification Details / تفاصيل الإشعار:**
```javascript
{
  title: "Business Rejected",
  message: "Your business \"[Company Name]\" has been rejected: [reason]",
  data: {
    type: "profile_update",
    url: "/profile"
  }
}
```

**Recipient / المستلم:**
- The business user (`updatedBusiness._id`)

**API Endpoint / نقطة النهاية:**
- `PUT /api/v1/dashboard/users/business/:id/decline`

**Additional Notes / ملاحظات إضافية:**
- Also sends email notification (existing functionality)
- Rejection reason is included in the message

---

### 3.3 Business Status Changed (General Update) / تغيير حالة الأعمال (تحديث عام)

**Location / الموقع:**
- File: `controllers/dashboard/users/users-controller.js`
- Function: `exports.updateUser`
- Line: ~509, ~520

**Trigger / المشغل:**
- When admin/employee updates a user and changes `approvalStatus` field
- Only triggers if:
  - User role is `business`
  - `approvalStatus` is provided in request body
  - Status actually changed (oldStatus !== newStatus)
- After user is successfully updated

**Notification Details / تفاصيل الإشعار:**

**When approvalStatus = 'approved':**
```javascript
{
  title: "Business Approved",
  message: "Your business \"[Company Name]\" has been approved. You can now access all features.",
  data: {
    type: "profile_update",
    url: "/profile"
  }
}
```

**When approvalStatus = 'rejected':**
```javascript
{
  title: "Business Rejected",
  message: "Your business \"[Company Name]\" has been rejected: [reason]",
  data: {
    type: "profile_update",
    url: "/profile"
  }
}
```

**Recipient / المستلم:**
- The business user (`user._id`)

**API Endpoint / نقطة النهاية:**
- `PUT /api/v1/dashboard/users/user/:id`

**Additional Notes / ملاحظات إضافية:**
- This is a general update endpoint, so notification only triggers when approvalStatus specifically changes
- Rejection reason is included if available in `businessInfo.rejectionReason`

---

## Summary / الملخص

### Total Notification Triggers / إجمالي مشغلات الإشعارات: **9 Push Notifications**

### By Category / حسب الفئة:

#### Order Notifications / إشعارات الطلبات: **4 triggers**
1. ✅ Order Placed (Customer creates order)
2. ✅ Order Confirmed (Admin creates order)
3. ✅ Order Status Updated (Admin updates status: confirmed/shipped/delivered/cancelled)
4. ✅ Order Cancelled (Customer cancels order)

#### Product Notifications / إشعارات المنتجات: **3 triggers**
1. ✅ Product Approved (Admin approves product via specific endpoint)
2. ✅ Product Declined (Admin declines product via specific endpoint)
3. ✅ Product Status Changed (General update - sends both email and push notification)

#### Business Status Notifications / إشعارات حالة الأعمال: **3 triggers**
1. ✅ Business Approved (Specific approve endpoint)
2. ✅ Business Rejected (Specific reject endpoint)
3. ✅ Business Status Changed (General update endpoint)

### Notification Types Used / أنواع الإشعارات المستخدمة:

- `order` - General order notification
- `order_confirmed` - Order confirmed
- `order_shipped` - Order shipped
- `order_delivered` - Order delivered
- `order_cancelled` - Order cancelled
- `product` - Product-related notifications
- `profile_update` - Profile/business status updates

### Important Notes / ملاحظات مهمة:

1. **Error Handling / معالجة الأخطاء:**
   - All notifications are sent in try-catch blocks
   - If notification fails, the API request still succeeds
   - Errors are logged to console but don't break functionality

2. **Notification Prerequisites / متطلبات الإشعارات:**
   - User must have registered FCM token via `POST /api/v1/user/notifications/token`
   - Firebase Admin SDK must be configured (FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_PATH)
   - If FCM fails, notification is still saved to database

3. **Notification Data Structure / بنية بيانات الإشعار:**
   - All notifications include proper `data` object with `type`, `url`, and relevant IDs
   - Order notifications include `orderNumber` for display
   - Product notifications include `productId`
   - Business notifications use `profile_update` type

4. **Email Notifications / إشعارات البريد الإلكتروني:**
   - Product approval/decline also sends email (existing functionality)
   - Business approval/rejection also sends email (existing functionality)
   - Order notifications are push-only (no email)

---

## Files Modified / الملفات المعدلة:

1. `controllers/user/orders/orders-controller.js` - Order creation & cancellation
2. `controllers/dashboard/orders/orders-controller.js` - Order creation & status updates
3. `controllers/dashboard/products/products-controller.js` - Product approval & decline
4. `controllers/dashboard/users/users-controller.js` - Business approval & rejection

---

## Testing Checklist / قائمة التحقق من الاختبار:

- [ ] Test order creation by customer → Should receive "Order Placed" notification
- [ ] Test order creation by admin → Should receive "Order Confirmed" notification
- [ ] Test order status update to "confirmed" → Should receive "Order Confirmed" notification
- [ ] Test order status update to "shipped" → Should receive "Order Shipped" notification
- [ ] Test order status update to "delivered" → Should receive "Order Delivered" notification
- [ ] Test order status update to "cancelled" → Should receive "Order Cancelled" notification
- [ ] Test order cancellation by customer → Should receive "Order Cancelled" notification
- [ ] Test product approval via specific endpoint → Should receive "Product Approved" notification
- [ ] Test product decline via specific endpoint → Should receive "Product Declined" notification
- [ ] Test product status change via general update (approved) → Should receive "Product Approved" notification
- [ ] Test product status change via general update (declined) → Should receive "Product Declined" notification
- [ ] Test business approval via specific endpoint → Should receive "Business Approved" notification
- [ ] Test business rejection via specific endpoint → Should receive "Business Rejected" notification
- [ ] Test business status change via general update → Should receive appropriate notification

---

**Last Updated / آخر تحديث:** Generated automatically from codebase scan
**Version / الإصدار:** 1.0
