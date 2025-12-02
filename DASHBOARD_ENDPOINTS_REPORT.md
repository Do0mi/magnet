# Dashboard Endpoints Documentation Report
# تقرير توثيق نقاط نهاية لوحة التحكم

**Generated Date / تاريخ الإنشاء:** January 2025
**Base URL / الرابط الأساسي:** `/api/v1/dashboard`

---

## 📋 Table of Contents / جدول المحتويات

1. [Overview / نظرة عامة](#overview)
2. [Authentication / المصادقة](#authentication)
3. [Users Endpoints / نقاط نهاية المستخدمين](#users-endpoints)
4. [Products Endpoints / نقاط نهاية المنتجات](#products-endpoints)
5. [Categories Endpoints / نقاط نهاية الفئات](#categories-endpoints)
6. [Profile Endpoints / نقاط نهاية الملف الشخصي](#profile-endpoints)
7. [Orders Endpoints / نقاط نهاية الطلبات](#orders-endpoints)
8. [Reviews Endpoints / نقاط نهاية التقييمات](#reviews-endpoints)
9. [Addresses Endpoints / نقاط نهاية العناوين](#addresses-endpoints)
10. [Wishlists Endpoints / نقاط نهاية قوائم الرغبات](#wishlists-endpoints)
11. [Stats Endpoints / نقاط نهاية الإحصائيات](#stats-endpoints)
12. [Applicants Endpoints / نقاط نهاية المتقدمين](#applicants-endpoints)
13. [Special Orders Endpoints / نقاط نهاية الطلبات الخاصة](#special-orders-endpoints)
14. [Summary / الملخص](#summary)

---

## Overview / نظرة عامة

This document provides a comprehensive scan and documentation of all dashboard-related API endpoints in the Magnet e-commerce platform. All dashboard endpoints are prefixed with `/api/v1/dashboard` and require admin or employee authentication.

يوفر هذا المستند فحصًا وتوثيقًا شاملًا لجميع نقاط نهاية واجهة برمجة التطبيقات المتعلقة بلوحة التحكم في منصة Magnet للتجارة الإلكترونية. جميع نقاط نهاية لوحة التحكم تبدأ ب `/api/v1/dashboard` وتتطلب مصادقة مسؤول أو موظف.

### Route Structure / هيكل المسارات

```
/api/v1/dashboard
├── /users          - User management (9 endpoints)
├── /products       - Product management (12 endpoints)
├── /categories     - Category management (6 endpoints)
├── /profile        - Admin/Employee profile (2 endpoints)
├── /orders         - Order management (5 endpoints)
├── /reviews        - Review management (4 endpoints)
├── /addresses      - Address management (5 endpoints)
├── /wishlists      - Wishlist management (5 endpoints)
├── /stats          - Statistics (5 endpoints)
├── /applicants     - Applicant management (6 endpoints)
└── /special-orders - Special order management (5 endpoints)
```

**Total Endpoints / إجمالي النقاط:** 62 endpoints

**Base Currency / العملة الأساسية:**
- All monetary values are displayed in **USD**
- Currency field (`currency: "USD"`) is included in all relevant responses (products, orders, wishlists, reviews)

---

## Authentication / المصادقة

### Requirements / المتطلبات

All dashboard endpoints require:
- **JWT Token** in the Authorization header: `Authorization: Bearer <token>`
- **Role**: User must have `admin` or `magnet_employee` role

جميع نقاط نهاية لوحة التحكم تتطلب:
- **رمز JWT** في رأس Authorization: `Authorization: Bearer <token>`
- **الدور**: يجب أن يكون للمستخدم دور `admin` أو `magnet_employee`

### Middleware Used / الـ Middleware المستخدم

- `verifyToken`: Applied to all routes (verifies JWT token)
- `requireAdminOrEmployee`: Applied to all routes (validates admin/employee role)

---

## Users Endpoints / نقاط نهاية المستخدمين

**Base Path / المسار الأساسي:** `/api/v1/dashboard/users`

All user routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get All Users
**GET** `/api/v1/dashboard/users`

**Description / الوصف:**  
Retrieves all users with pagination and filtering support.

**Authentication:** Required (Admin/Employee)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `role` (optional) - Filter by user role (customer, business, admin, magnet_employee)
- `isAllowed` (optional, true/false) - Filter by allowed status
- `search` (optional) - Search in firstname, lastname, email, or phone

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "user_id",
        "firstname": "John",
        "lastname": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "role": "customer",
        "country": "SA",
        "language": "en",
        "imageUrl": "profile_image_url",
        "isAllowed": true,
        "isEmailVerified": true,
        "isPhoneVerified": true,
        "businessInfo": {
          // Only if role is business
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "limit": 10
    }
  }
}
```

**Controller Function:** `UserController.getUsers`  
**File Location:** `controllers/dashboard/users/users-controller.js` (lines 174-224)

---

### 2. Get User by ID
**GET** `/api/v1/dashboard/users/:id`

**Description / الوصف:**  
Retrieves a specific user by their ID.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - User ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "user": {
      // Complete user object with all fields
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - User not found

**Controller Function:** `UserController.getUserById`  
**File Location:** `controllers/dashboard/users/users-controller.js` (lines 325-353)

---

### 3. Create User
**POST** `/api/v1/dashboard/users/user`

**Description / الوصف:**  
Creates a new user. Can create users with any role (customer, business, admin, employee). Business users are auto-approved when created by admin.

**Authentication:** Required (Admin/Employee)

**Request Body / جسم الطلب:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "role": "customer",
  "country": "SA",
  "language": "en",
  "crNumber": "CR123456",
  "vatNumber": "VAT123456",
  "companyName": "Company Name",
  "companyType": "LLC",
  "city": "Riyadh",
  "district": "Olaya",
  "streetName": "King Fahd Road",
  "accessPages": {
    "dashboard": true,
    "analytics": true,
    "users": true,
    "products": true,
    "orders": true,
    "reviews": true,
    "wishlists": true,
    "categories": true,
    "addresses": true
  }
}
```

**Required Fields / الحقول المطلوبة:**
- `firstname`, `lastname`, `email`, `password`, `role`

**Business User Required Fields (if role is business):**
- `crNumber`, `vatNumber`, `companyName`, `companyType`, `city`, `district`, `streetName`

**Validation Rules / قواعد التحقق:**
- Email must be unique
- Phone must be unique
- Role must be one of: admin, magnet_employee, business, customer
- Business users are automatically approved when created by admin
- Access pages only apply to admin/employee roles

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "User created successfully",
    "ar": "تم إنشاء المستخدم بنجاح"
  },
  "data": {
    "user": {
      // Created user object
    }
  }
}
```

**Controller Function:** `UserController.createUser`  
**File Location:** `controllers/dashboard/users/users-controller.js` (lines 26-171)

---

### 4. Update User
**PUT** `/api/v1/dashboard/users/user/:id`

**Description / الوصف:**  
Updates an existing user. Can update all user fields except email and phone (which cannot be changed).

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - User ID

**Request Body / جسم الطلب:**
```json
{
  "firstname": "John",
  "lastname": "Updated",
  "role": "customer",
  "country": "SA",
  "language": "en",
  "imageUrl": "new_image_url",
  "isAllowed": true,
  "isEmailVerified": true,
  "isPhoneVerified": true,
  "crNumber": "CR789012",
  "vatNumber": "VAT789012",
  "companyName": "Updated Company",
  "companyType": "Corporation",
  "city": "Jeddah",
  "district": "Al-Balad",
  "streetName": "Corniche Road",
  "approvalStatus": "approved",
  "rejectionReason": null,
  "accessPages": {
    "dashboard": true,
    "analytics": false
  },
  "disallowReason": "Reason for disallowing"
}
```

**All fields are optional** - Only provided fields will be updated.

**Special Features / الميزات الخاصة:**
- Can update business approval status
- Can set approval/rejection metadata
- Can update access pages for admin/employee
- Can set disallow reason for customers

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "User updated successfully",
    "ar": "تم تحديث المستخدم بنجاح"
  },
  "data": {
    "user": {
      // Updated user object
    }
  }
}
```

**Controller Function:** `UserController.updateUser`  
**File Location:** `controllers/dashboard/users/users-controller.js` (lines 356-508)

---

### 5. Delete User
**DELETE** `/api/v1/dashboard/users/user/:id`

**Description / الوصف:**  
Permanently deletes a user.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - User ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "User deleted successfully",
    "ar": "تم حذف المستخدم بنجاح"
  },
  "data": null
}
```

**Error Responses / استجابات الخطأ:**
- `404` - User not found

**Controller Function:** `UserController.deleteUser`  
**File Location:** `controllers/dashboard/users/users-controller.js` (lines 511-533)

---

### 6. Toggle User Status
**PUT** `/api/v1/dashboard/users/user/:id/toggle`

**Description / الوصف:**  
Toggles the `isAllowed` status of a user (allows/disallows the user). Requires `disallowReason` when disallowing a user.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - User ID

**Request Body / جسم الطلب:**
```json
{
  "disallowReason": "Reason for disallowing user"
}
```

**Note:** `disallowReason` is required when disallowing a user (when `isAllowed` changes from `true` to `false`).

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "User status toggled successfully",
    "ar": "تم تغيير حالة المستخدم بنجاح"
  },
  "data": {
    "user": {
      // Updated user object with toggled isAllowed status
    }
  }
}
```

**Features / الميزات:**
- Sends email notification when user is allowed/disallowed
- Tracks who disallowed the user and when
- Clears disallow fields when user is re-allowed

**Controller Function:** `UserController.toggleUser`  
**File Location:** `controllers/dashboard/users/users-controller.js` (lines 227-322)

---

### 7. Get Pending Business Users
**GET** `/api/v1/dashboard/users/business/pending`

**Description / الوصف:**  
Retrieves all business users with pending approval status.

**Authentication:** Required (Admin/Employee)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "businesses": [
      {
        // Business user object with pending approval status
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalBusinesses": 50,
      "limit": 10
    }
  }
}
```

**Controller Function:** `UserController.getPendingBusinessUsers`  
**File Location:** `controllers/dashboard/users/users-controller.js` (lines 536-576)

---

### 8. Approve Business User
**PUT** `/api/v1/dashboard/users/business/:id/approve`

**Description / الوصف:**  
Approves a pending business user. Sets approval status to 'approved' and enables the user.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Business User ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Business approved successfully",
    "ar": "تم الموافقة على الأعمال بنجاح"
  },
  "data": {
    "business": {
      // Business user with approvalStatus: "approved"
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Business not found
- `400` - User is not a business user or already approved

**Features / الميزات:**
- Sets `approvalStatus` to 'approved'
- Sets `isAllowed` to `true`
- Records who approved and when
- Sends approval notification email
- Clears rejection fields

**Controller Function:** `UserController.approveBusinessUser`  
**File Location:** `controllers/dashboard/users/users-controller.js` (lines 579-661)

---

### 9. Decline Business User
**PUT** `/api/v1/dashboard/users/business/:id/decline`

**Description / الوصف:**  
Declines a pending business user. Sets approval status to 'rejected' and disables the user.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Business User ID

**Request Body / جسم الطلب:**
```json
{
  "rejectionReason": "Reason for rejection"
}
```

**Required Fields / الحقول المطلوبة:**
- `rejectionReason` - Reason for rejecting the business user

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Business declined successfully",
    "ar": "تم رفض الأعمال بنجاح"
  },
  "data": {
    "business": {
      // Business user with approvalStatus: "rejected"
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Business not found
- `400` - User is not a business user, already rejected, or rejection reason missing

**Features / الميزات:**
- Sets `approvalStatus` to 'rejected'
- Sets `isAllowed` to `false`
- Records who rejected and when
- Stores rejection reason
- Sends rejection notification email
- Clears approval fields

**Controller Function:** `UserController.declineBusinessUser`  
**File Location:** `controllers/dashboard/users/users-controller.js` (lines 664-755)

---

## Products Endpoints / نقاط نهاية المنتجات

**Base Path / المسار الأساسي:** `/api/v1/dashboard/products`

All product routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get All Products
**GET** `/api/v1/dashboard/products`

**Description / الوصف:**  
Retrieves all products with pagination and filtering support. Supports advanced search across product and owner fields.

**Authentication:** Required (Admin/Employee)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `category` (optional) - Filter by category ID
- `status` (optional) - Filter by product status (pending, approved, declined)
- `search` (optional) - Search in product name (en/ar), description (en/ar), code, or owner name

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "products": [
      {
        // Complete product object
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 50,
      "limit": 10
    }
  }
}
```

**Controller Function:** `ProductController.getProducts`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 26-194)

**Features / الميزات:**
- Advanced search using MongoDB aggregation when search parameter is provided
- Searches across product fields (name.en, name.ar, description.en, description.ar, code) and owner information (firstname, lastname)
- Supports pagination and filtering
- When search is used, MongoDB aggregation pipeline is used for complex queries
- When search is not used, standard find with populate is used for better performance
- Review counts are automatically attached to products using `attachReviewCountsToProducts` utility
- Products are sorted by creation date (newest first)

---

### 2. Get Product by ID
**GET** `/api/v1/dashboard/products/:id`

**Description / الوصف:**  
Retrieves a specific product by its ID.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "product": {
      // Complete product object with populated fields
    }
  }
}
```

**Controller Function:** `ProductController.getProductById`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 197-224)

**Populated Fields / الحقول المملوءة:**
- `owner`: firstname, lastname, email, role, businessInfo.companyName
- `approvedBy`: firstname, lastname, email, role
- Review counts are automatically attached

**Response Currency / عملة الاستجابة:**
- All product responses include `currency: "USD"` field

---

### 3. Create Product
**POST** `/api/v1/dashboard/products/product`

**Description / الوصف:**  
Creates a new product for a specific business user. Products created by admin/employee are automatically approved.

**Authentication:** Required (Admin/Employee)

**Request Body / جسم الطلب:**
```json
{
  "businessUserId": "business_user_id",
  "category": {
    "en": "Electronics",
    "ar": "إلكترونيات"
  },
  "name": {
    "en": "Product Name",
    "ar": "اسم المنتج"
  },
  "description": {
    "en": "Product description",
    "ar": "وصف المنتج"
  },
  "images": ["url1", "url2"],
  "unit": {
    "en": "kg",
    "ar": "كجم"
  },
  "minOrder": 10,
  "pricePerUnit": 100,
  "stock": 500,
  "customFields": [
    {
      "key": { "en": "Color", "ar": "اللون" },
      "value": { "en": "Red", "ar": "أحمر" }
    }
  ],
  "attachments": ["product_id1", "product_id2"],
  "code": "PROD123"
}
```

**Required Fields / الحقول المطلوبة:**
- `businessUserId` - ID of the business user who owns the product
- `name` (both `en` and `ar` required)
- `description` (both `en` and `ar` required)
- `pricePerUnit`
- `category` (both `en` and `ar` required)
- `customFields` (array with 3-10 items)

**Validation Rules / قواعد التحقق:**
- Business user must exist and be approved (if role is business)
- Business user must be allowed (if role is business)
- Business user can be admin or magnet_employee (allowed roles: business, admin, magnet_employee)
- Category must exist and be active (checked by matching both en and ar names)
- Custom fields must be between 3-10 items
- All bilingual fields must have both English and Arabic (name, description, category, unit, customFields)
- Attachments must be valid approved products (status: 'approved', isAllowed: true)
- Product code is auto-generated if not provided using `generateProductCode` utility
- Products created by admin/employee are automatically approved and allowed

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Product created successfully",
    "ar": "تم إنشاء المنتج بنجاح"
  },
  "data": {
    "product": {
      // Product object with status: "approved" (auto-approved)
    }
  }
}
```

**Controller Function:** `ProductController.createProduct`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 227-382)

**Business Logic / المنطق التجاري:**
- Product is created with `status: 'approved'` and `isAllowed: true` automatically
- `approvedBy` is set to the current admin/employee user ID
- If owner is admin or magnet_employee, company name is set to 'Magnet' in businessInfo
- Review counts are attached after creation
- Product code is generated if not provided

---

### 4. Update Product
**PUT** `/api/v1/dashboard/products/product/:id`

**Description / الوصف:**  
Updates an existing product. Can update product fields and status.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID

**Request Body / جسم الطلب:**
```json
{
  "category": {
    "en": "Electronics",
    "ar": "إلكترونيات"
  },
  "name": {
    "en": "Updated Product Name",
    "ar": "اسم المنتج المحدث"
  },
  "description": {
    "en": "Updated description",
    "ar": "الوصف المحدث"
  },
  "images": ["url1", "url2"],
  "unit": {
    "en": "kg",
    "ar": "كجم"
  },
  "minOrder": 10,
  "pricePerUnit": 150,
  "stock": 600,
  "customFields": [
    {
      "key": { "en": "Color", "ar": "اللون" },
      "value": { "en": "Blue", "ar": "أزرق" }
    }
  ],
  "attachments": ["product_id1"],
  "status": "approved",
  "declinedReason": null
}
```

**All fields are optional** - Only provided fields will be updated.

**Status Management / إدارة الحالة:**
- If `status` is set to 'approved', product is automatically allowed (`isAllowed: true`)
- If `status` is set to 'declined', product is automatically disallowed (`isAllowed: false`)
- Status changes trigger email notifications to product owner
- When status changes to 'approved', `approvedBy` is set to current user and `declinedReason` is cleared
- When status changes to 'declined', `declinedReason` can be provided
- Email notifications include product name, owner name, action by, and timestamp

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Product updated successfully",
    "ar": "تم تحديث المنتج بنجاح"
  },
  "data": {
    "product": {
      // Updated product object
    }
  }
}
```

**Controller Function:** `ProductController.updateProduct`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 385-492)

---

### 5. Delete Product
**DELETE** `/api/v1/dashboard/products/product/:id`

**Description / الوصف:**  
Permanently deletes a product.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Product deleted successfully",
    "ar": "تم حذف المنتج بنجاح"
  },
  "data": null
}
```

**Controller Function:** `ProductController.deleteProduct`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 495-518)

---

### 6. Approve Product
**PUT** `/api/v1/dashboard/products/product/:id/approve`

**Description / الوصف:**  
Approves a pending product. Sets status to 'approved' and enables the product.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Product approved successfully",
    "ar": "تم الموافقة على المنتج بنجاح"
  },
  "data": {
    "product": {
      // Product with status: "approved"
    }
  }
}
```

**Features / الميزات:**
- Sets `status` to 'approved'
- Sets `isAllowed` to `true`
- Records who approved the product (`approvedBy` field)
- Updates `updatedAt` timestamp
- Sends approval notification email to product owner
- Email includes product name, owner name, approver name, and approval date

**Controller Function:** `ProductController.approveProduct`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 521-579)

---

### 7. Decline Product
**PUT** `/api/v1/dashboard/products/product/:id/decline`

**Description / الوصف:**  
Declines a pending product. Sets status to 'declined' and disables the product.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID

**Request Body / جسم الطلب:**
```json
{
  "reason": "Reason for declining the product"
}
```

**Required Fields / الحقول المطلوبة:**
- `reason` - Reason for declining the product

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Product declined successfully",
    "ar": "تم رفض المنتج بنجاح"
  },
  "data": {
    "product": {
      // Product with status: "declined"
    }
  }
}
```

**Features / الميزات:**
- Sets `status` to 'declined'
- Sets `isAllowed` to `false`
- Stores decline reason (from request body `reason` field)
- Sets `approvedBy` to current user (for tracking)
- Updates `updatedAt` timestamp
- Sends decline notification email to product owner
- Email includes product name, owner name, decliner name, decline date, and reason

**Controller Function:** `ProductController.declineProduct`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 582-644)

---

### 8. Toggle Product Status
**PUT** `/api/v1/dashboard/products/product/:id/toggle`

**Description / الوصف:**  
Toggles the `isAllowed` status of a product (allows/disallows the product).

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Product status toggled successfully",
    "ar": "تم تغيير حالة المنتج بنجاح"
  },
  "data": {
    "product": {
      // Product with toggled isAllowed status
    }
  }
}
```

**Features / الميزات:**
- Toggles `isAllowed` field (true ↔ false)
- Updates `updatedAt` timestamp
- Sends allow/disallow notification email to product owner based on new status
- Email includes product name, owner name, action by, and action date
- Does not change product `status` field (only `isAllowed`)

**Controller Function:** `ProductController.toggleProduct`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 647-715)

---

### 9. Get Product Reviews
**GET** `/api/v1/dashboard/products/:id/reviews`

**Description / الوصف:**  
Retrieves all reviews for a specific product.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "reviews": [
      {
        // Review object with user and product information
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalReviews": 50,
      "limit": 10
    }
  }
}
```

**Controller Function:** `ProductController.getProductReviews`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 718-769)

**Populated Fields / الحقول المملوءة:**
- `user`: firstname, lastname, email, role
- `rejectedBy`: firstname, lastname, email, role
- `product.owner`: firstname, lastname, email, businessInfo.companyName
- `product.approvedBy`: firstname, lastname, email, role

**Sorting / الترتيب:**
- Reviews are sorted by creation date (newest first)

---

### 10. Get Product Orders
**GET** `/api/v1/dashboard/products/:id/orders`

**Description / الوصف:**  
Retrieves all orders containing a specific product.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "order_id",
        "orderNumber": "ORD-12345678",
        "customer": {
          "id": "customer_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "items": [
          {
            "id": "item_id",
            "product": {
              "id": "product_id",
              "name": { "en": "Product Name", "ar": "اسم المنتج" },
              "images": ["url1"],
              "pricePerUnit": 100
            },
            "quantity": 10,
            "unitPrice": 100,
            "itemTotal": 1000
          }
        ],
        "subtotal": 1000,
        "shippingCost": 50,
        "total": 1050,
        "shippingAddress": { /* address object */ },
        "status": "confirmed",
        "paymentMethod": "cash_on_delivery",
        "notes": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalOrders": 50,
      "limit": 10
    }
  }
}
```

**Controller Function:** `ProductController.getProductOrders`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 809-888)

**Note:** All orders returned include `paymentMethod` and `notes` fields.

**ملاحظة:** جميع الطلبات المُرجعة تتضمن حقول `paymentMethod` و `notes`.

**Populated Fields / الحقول المملوءة:**
- `customer`: firstname, lastname, email
- `items.product`: name, pricePerUnit, images
- `shippingAddress`: addressLine1, addressLine2, city, state, postalCode, country

**Order Number Format / تنسيق رقم الطلب:**
- Format: `ORD-{last8charsofID}` (e.g., `ORD-12345678`)
- Generated from order ID's last 8 characters, uppercase

---

### 11. Get Product Review by ID
**GET** `/api/v1/dashboard/products/:productId/reviews/:reviewId`

**Description / الوصف:**  
Retrieves a specific review for a specific product.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `productId` (required) - Product ID
- `reviewId` (required) - Review ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "review": {
      // Complete review object
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Review not found or review doesn't belong to the product

**Controller Function:** `ProductController.getProductReviewById`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 891-936)

---

### 12. Get Product Order by ID
**GET** `/api/v1/dashboard/products/:productId/orders/:orderId`

**Description / الوصف:**  
Retrieves a specific order containing a specific product.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `productId` (required) - Product ID
- `orderId` (required) - Order ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "ORD-12345678",
      "customer": {
        "id": "customer_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "items": [
        {
          "id": "item_id",
          "product": {
            "id": "product_id",
            "name": { "en": "Product Name", "ar": "اسم المنتج" },
            "images": ["url1"],
            "pricePerUnit": 100
          },
          "quantity": 10,
          "unitPrice": 100,
          "itemTotal": 1000
        }
      ],
      "subtotal": 1000,
      "shippingCost": 50,
      "total": 1050,
      "shippingAddress": { /* address object */ },
      "status": "confirmed",
      "paymentMethod": "cash_on_delivery",
      "notes": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Order not found or order doesn't contain the product

**Note:** The order response includes `paymentMethod` and `notes` fields.

**ملاحظة:** استجابة الطلب تتضمن حقول `paymentMethod` و `notes`.

**Controller Function:** `ProductController.getProductOrderById`  
**File Location:** `controllers/dashboard/products/products-controller.js` (lines 939-1003)

---

## Categories Endpoints / نقاط نهاية الفئات

**Base Path / المسار الأساسي:** `/api/v1/dashboard/categories`

All category routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get All Categories
**GET** `/api/v1/dashboard/categories`

**Description / الوصف:**  
Retrieves all categories with pagination and filtering support.

**Authentication:** Required (Admin/Employee)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `search` (optional) - Search in category name (en/ar) or description (en/ar)
- `status` (optional) - Filter by status (active, inactive)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "categories": [
      {
        "id": "category_id",
        "name": {
          "en": "Electronics",
          "ar": "إلكترونيات"
        },
        "description": {
          "en": "Electronic products",
          "ar": "منتجات إلكترونية"
        },
        "status": "active",
        "createdBy": {
          "id": "user_id",
          "firstname": "Admin",
          "lastname": "User"
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCategories": 50,
      "limit": 10
    }
  }
}
```

**Controller Function:** `CategoryController.getCategories`  
**File Location:** `controllers/dashboard/categories/categories-controller.js` (lines 19-70)

---

### 2. Get Category by ID
**GET** `/api/v1/dashboard/categories/:id`

**Description / الوصف:**  
Retrieves a specific category by its ID.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Category ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "category": {
      // Complete category object
    }
  }
}
```

**Controller Function:** `CategoryController.getCategoryById`  
**File Location:** `controllers/dashboard/categories/categories-controller.js` (lines 73-99)

---

### 3. Create Category
**POST** `/api/v1/dashboard/categories/category`

**Description / الوصف:**  
Creates a new category.

**Authentication:** Required (Admin/Employee)

**Request Body / جسم الطلب:**
```json
{
  "name": {
    "en": "Electronics",
    "ar": "إلكترونيات"
  },
  "description": {
    "en": "Electronic products",
    "ar": "منتجات إلكترونية"
  },
  "status": "active"
}
```

**Required Fields / الحقول المطلوبة:**
- `name` (both `en` and `ar` required)

**Optional Fields / الحقول الاختيارية:**
- `description` (both `en` and `ar` required if provided)
- `status` (default: "inactive", must be "active" or "inactive")

**Validation Rules / قواعد التحقق:**
- Category name must be unique in both English and Arabic
- Status must be 'active' or 'inactive'

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Category created successfully",
    "ar": "تم إنشاء الفئة بنجاح"
  },
  "data": {
    "category": {
      // Created category object
    }
  }
}
```

**Controller Function:** `CategoryController.createCategory`  
**File Location:** `controllers/dashboard/categories/categories-controller.js` (lines 102-183)

---

### 4. Update Category
**PUT** `/api/v1/dashboard/categories/category/:id`

**Description / الوصف:**  
Updates an existing category.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Category ID

**Request Body / جسم الطلب:**
```json
{
  "name": {
    "en": "Updated Electronics",
    "ar": "إلكترونيات محدثة"
  },
  "description": {
    "en": "Updated description",
    "ar": "وصف محدث"
  },
  "status": "active"
}
```

**All fields are optional** - Only provided fields will be updated.

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Category updated successfully",
    "ar": "تم تحديث الفئة بنجاح"
  },
  "data": {
    "category": {
      // Updated category object
    }
  }
}
```

**Controller Function:** `CategoryController.updateCategory`  
**File Location:** `controllers/dashboard/categories/categories-controller.js` (lines 186-272)

---

### 5. Delete Category
**DELETE** `/api/v1/dashboard/categories/category/:id`

**Description / الوصف:**  
Deletes a category. Cannot delete if category has products or subcategories.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Category ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Category deleted successfully",
    "ar": "تم حذف الفئة بنجاح"
  },
  "data": null
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Category not found
- `400` - Category has products or subcategories

**Controller Function:** `CategoryController.deleteCategory`  
**File Location:** `controllers/dashboard/categories/categories-controller.js` (lines 275-316)

---

### 6. Toggle Category Status
**PUT** `/api/v1/dashboard/categories/category/:id/toggle`

**Description / الوصف:**  
Toggles the category status between 'active' and 'inactive'.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Category ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Category status toggled successfully",
    "ar": "تم تغيير حالة الفئة بنجاح"
  },
  "data": {
    "category": {
      // Category with toggled status
    }
  }
}
```

**Controller Function:** `CategoryController.toggleCategory`  
**File Location:** `controllers/dashboard/categories/categories-controller.js` (lines 319-355)

---

## Profile Endpoints / نقاط نهاية الملف الشخصي

**Base Path / المسار الأساسي:** `/api/v1/dashboard/profile`

All profile routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get Profile
**GET** `/api/v1/dashboard/profile`

**Description / الوصف:**  
Retrieves the authenticated admin/employee user's profile.

**Authentication:** Required (Admin/Employee)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "user": {
      // Complete user profile
    }
  }
}
```

**Controller Function:** `ProfileController.getProfile`  
**File Location:** `controllers/dashboard/profile/profile-controller.js` (lines 19-44)

---

### 2. Update Profile
**PUT** `/api/v1/dashboard/profile`

**Description / الوصف:**  
Updates the authenticated admin/employee user's profile. Can update email, phone, password, and other fields.

**Authentication:** Required (Admin/Employee)

**Request Body / جسم الطلب:**
```json
{
  "firstname": "John",
  "lastname": "Updated",
  "email": "newemail@example.com",
  "phone": "+9876543210",
  "password": "newpassword123",
  "country": "SA",
  "language": "en",
  "imageUrl": "new_profile_image_url"
}
```

**All fields are optional** - Only provided fields will be updated.

**Validation Rules / قواعد التحقق:**
- Email must be unique (if changed)
- Phone must be unique (if changed)
- Password must be at least 6 characters (if provided)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Profile updated successfully",
    "ar": "تم تحديث الملف الشخصي بنجاح"
  },
  "data": {
    "user": {
      // Updated user profile
    }
  }
}
```

**Controller Function:** `ProfileController.updateProfile`  
**File Location:** `controllers/dashboard/profile/profile-controller.js` (lines 47-135)

---

## Orders Endpoints / نقاط نهاية الطلبات

**Base Path / المسار الأساسي:** `/api/v1/dashboard/orders`

All order routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get All Orders
**GET** `/api/v1/dashboard/orders`

**Description / الوصف:**  
Retrieves all orders with pagination and filtering support.

**Authentication:** Required (Admin/Employee)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by order status
- `search` (optional) - Search in order number, customer name, or email
- `startDate` (optional) - Filter orders from this date
- `endDate` (optional) - Filter orders until this date

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "order_id",
        "status": "confirmed",
        "paymentMethod": "cash_on_delivery",
        "notes": "Special delivery instructions",
        "customer": {
          // Customer object
        },
        "items": [
          // Order items array
        ],
        "subtotal": 1000,
        "shippingCost": 50,
        "total": 1050,
        "shippingAddress": {
          // Address object
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalOrders": 50,
      "limit": 10
    },
    "currency": "USD"
  }
}
```

**Note:** All order endpoints return `paymentMethod` and `notes` fields in the response.

**ملاحظة:** جميع نقاط نهاية الطلبات ترجع حقول `paymentMethod` و `notes` في الاستجابة.

**Controller Function:** `OrderController.getOrders`  
**File Location:** `controllers/dashboard/orders/orders-controller.js` (lines 23-78)

---

### 2. Get Order by ID
**GET** `/api/v1/dashboard/orders/:id`

**Description / الوصف:**  
Retrieves a specific order by its ID.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Order ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "order_id",
      "status": "confirmed",
      "paymentMethod": "cash_on_delivery",
      "notes": "Special delivery instructions",
      "customer": {
        // Customer object
      },
      "items": [
        // Order items array
      ],
      "subtotal": 1000,
      "shippingCost": 50,
      "total": 1050,
      "shippingAddress": {
        // Address object
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "currency": "USD"
  }
}
```

**Note:** The order response includes `paymentMethod` and `notes` fields.

**ملاحظة:** استجابة الطلب تتضمن حقول `paymentMethod` و `notes`.

**Controller Function:** `OrderController.getOrderById`  
**File Location:** `controllers/dashboard/orders/orders-controller.js` (lines 81-112)

**Note:** The order response includes `paymentMethod` and `notes` fields (via formatOrder function).

**ملاحظة:** استجابة الطلب تتضمن حقول `paymentMethod` و `notes` (عبر دالة formatOrder).

---

### 3. Create Order
**POST** `/api/v1/dashboard/orders/order`

**Description / الوصف:**  
Creates a new order for a specific customer. Validates products, stock, and calculates totals.

**Authentication:** Required (Admin/Employee)

**Request Body / جسم الطلب:**
```json
{
  "customerId": "customer_id",
  "items": [
    {
      "productId": "product_id",
      "quantity": 10
    }
  ],
  "shippingAddress": "address_id",
  "shippingCost": 50,
  "paymentMethod": "cash_on_delivery",
  "notes": "Special delivery instructions"
}
```

**Required Fields / الحقول المطلوبة:**
- `customerId` - ID of the customer
- `items` - Array of order items (at least one item)
- `shippingAddress` - ID of shipping address

**Validation Rules / قواعد التحقق:**
- Customer must exist and be a customer role
- Shipping address must exist and belong to customer
- All products must exist and be approved
- Products must have sufficient stock
- Order is created with status 'confirmed'

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Order created successfully",
    "ar": "تم إنشاء الطلب بنجاح"
  },
  "data": {
    "order": {
      // Created order object
    }
  }
}
```

**Features / الميزات:**
- Automatically reduces product stock for each item (decrements by quantity)
- Calculates subtotal (sum of all item totals) and total (subtotal + shippingCost)
- Creates order with status 'confirmed'
- Records order creation in status log with:
  - Status: confirmed (from status mapping)
  - Timestamp: current date/time
  - Updated by: current admin/employee user ID
  - Note: "Order created by admin/employee"
- Order number is generated as `ORD-{last8charsofID}`
- All products are validated for existence, approval status, and sufficient stock
- Shipping address ownership is verified

**Controller Function:** `OrderController.createOrder`  
**File Location:** `controllers/dashboard/orders/orders-controller.js` (lines 115-308)

**Note:** The response includes `paymentMethod` and `notes` fields.

**ملاحظة:** الاستجابة تتضمن حقول `paymentMethod` و `notes`.

---

### 4. Update Order
**PUT** `/api/v1/dashboard/orders/order/:id`

**Description / الوصف:**  
Updates an existing order. Can update items, shipping address, status, and other fields.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Order ID

**Request Body / جسم الطلب:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 15
    }
  ],
  "shippingAddress": "new_address_id",
  "shippingCost": 75,
  "paymentMethod": "credit_card",
  "notes": "Updated notes",
  "status": "processing"
}
```

**All fields are optional** - Only provided fields will be updated.

**Validation Rules / قواعد التحقق:**
- If items are updated, products are re-validated (must exist and be approved)
- **Note:** Stock validation is NOT performed on update (unlike create)
- Shipping address must belong to customer (verified by matching address.user with order.customer)
- Totals are recalculated if items or shipping cost change
- If only shippingCost is updated, total = existing subtotal + new shippingCost
- If items are updated, subtotal and total are recalculated from scratch
- Product stock is NOT updated when order items are changed

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Order updated successfully",
    "ar": "تم تحديث الطلب بنجاح"
  },
  "data": {
    "order": {
      // Updated order object
    }
  }
}
```

**Controller Function:** `OrderController.updateOrder`  
**File Location:** `controllers/dashboard/orders/orders-controller.js` (lines 311-476)

**Note:** The response includes `paymentMethod` and `notes` fields in the manually formatted response.

**ملاحظة:** الاستجابة تتضمن حقول `paymentMethod` و `notes` في الاستجابة المنسقة يدوياً.

**Note:** The response includes `paymentMethod` and `notes` fields.

**ملاحظة:** الاستجابة تتضمن حقول `paymentMethod` و `notes`.

---

### 5. Delete Order
**DELETE** `/api/v1/dashboard/orders/order/:id`

**Description / الوصف:**  
Permanently deletes an order.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Order ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Order deleted successfully",
    "ar": "تم حذف الطلب بنجاح"
  },
  "data": null
}
```

**Controller Function:** `OrderController.deleteOrder`  
**File Location:** `controllers/dashboard/orders/orders-controller.js` (lines 479-502)

**Important Notes / ملاحظات مهمة:**
- ⚠️ **Permanent deletion** - This operation cannot be undone
- ⚠️ **Product stock is NOT restored** - When an order is deleted, the product stock that was reduced during order creation is NOT automatically restored
- Consider implementing soft delete or stock restoration logic if needed

---

---

## Reviews Endpoints / نقاط نهاية التقييمات

**Base Path / المسار الأساسي:** `/api/v1/dashboard/reviews`

All review routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get All Reviews
**GET** `/api/v1/dashboard/reviews`

**Description / الوصف:**  
Retrieves all reviews with pagination and filtering support.

**Authentication:** Required (Admin/Employee)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `rating` (optional) - Filter by rating (1-5)
- `status` (optional) - Filter by review status (approved, pending, reject)
- `search` (optional) - Search in comment, user name, or product name

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "reviews": [
      {
        "id": "review_id",
        "rating": 5,
        "comment": "Great product!",
        "status": "approved",
        "user": {
          "id": "user_id",
          "firstname": "John",
          "lastname": "Doe",
          "email": "john@example.com",
          "role": "customer"
        },
        "product": {
          // Product object with owner and approval info
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalReviews": 50,
      "limit": 10
    }
  }
}
```

**Controller Function:** `ReviewController.getReviews`  
**File Location:** `controllers/dashboard/reviews/reviews-controller.js` (lines 21-82)

**Populated Fields / الحقول المملوءة:**
- `user`: firstname, lastname, email, role
- `product.owner`: firstname, lastname, email, businessInfo.companyName
- `product.approvedBy`: firstname, lastname, email, role

**Search Fields / حقول البحث:**
- Comment text
- User firstname and lastname
- Product name (searches in populated product field)

**Response Currency / عملة الاستجابة:**
- All review responses include `currency: "USD"` field

---

### 2. Get Review by ID
**GET** `/api/v1/dashboard/reviews/:id`

**Description / الوصف:**  
Retrieves a specific review by its ID.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Review ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "review": {
      // Complete review object
    }
  }
}
```

**Controller Function:** `ReviewController.getReviewById`  
**File Location:** `controllers/dashboard/reviews/reviews-controller.js` (lines 85-124)

**Populated Fields / الحقول المملوءة:**
- `user`: firstname, lastname, email, role
- `product.owner`: firstname, lastname, email, businessInfo.companyName
- `product.approvedBy`: firstname, lastname, email, role

**Response Currency / عملة الاستجابة:**
- Response includes `currency: "USD"` field

---

### 3. Reject Review
**PUT** `/api/v1/dashboard/reviews/review/:id`

**Description / الوصف:**  
Rejects a review. Sets status to 'reject' and sends notification email to the reviewer.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Review ID

**Request Body / جسم الطلب:**
```json
{
  "reason": "Reason for rejecting the review"
}
```

**Required Fields / الحقول المطلوبة:**
- `reason` - Reason for rejecting the review

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Review rejected successfully",
    "ar": "تم رفض التقييم بنجاح"
  },
  "data": {
    "review": {
      // Review with status: "reject"
    }
  }
}
```

**Features / الميزات:**
- Sets `status` to 'reject'
- Stores rejection reason (from request body `reason` field, required and cannot be empty)
- Records who rejected (`rejectedBy` set to current user ID) and when (`rejectedAt` timestamp)
- Updates `updatedAt` timestamp
- Sends rejection notification email to reviewer
- Email includes user name, product name, and rejection reason

**Controller Function:** `ReviewController.rejectReview`  
**File Location:** `controllers/dashboard/reviews/reviews-controller.js` (lines 127-211)

---

### 4. Delete Review
**DELETE** `/api/v1/dashboard/reviews/review/:id`

**Description / الوصف:**  
Permanently deletes a review.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Review ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Review deleted successfully",
    "ar": "تم حذف التقييم بنجاح"
  },
  "data": null
}
```

**Controller Function:** `ReviewController.deleteReview`  
**File Location:** `controllers/dashboard/reviews/reviews-controller.js` (lines 214-237)

---

## Addresses Endpoints / نقاط نهاية العناوين

**Base Path / المسار الأساسي:** `/api/v1/dashboard/addresses`

All address routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get All Addresses
**GET** `/api/v1/dashboard/addresses`

**Description / الوصف:**  
Retrieves all addresses with pagination and filtering support.

**Authentication:** Required (Admin/Employee)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `search` (optional) - Search in address fields or user information
- `country` (optional) - Filter by country
- `city` (optional) - Filter by city

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "addresses": [
      {
        "id": "address_id",
        "addressLine1": "123 Main St",
        "addressLine2": "Apt 4B",
        "city": "Riyadh",
        "state": "Riyadh",
        "postalCode": "12345",
        "country": "SA",
        "isDefault": true,
        "user": {
          "id": "user_id",
          "firstname": "John",
          "lastname": "Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "role": "customer"
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalAddresses": 50,
      "limit": 10
    }
  }
}
```

**Controller Function:** `AddressController.getAddresses`  
**File Location:** `controllers/dashboard/addresses/addresses-controller.js` (lines 19-72)

---

### 2. Get Address by ID
**GET** `/api/v1/dashboard/addresses/:id`

**Description / الوصف:**  
Retrieves a specific address by its ID.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Address ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "address": {
      // Complete address object
    }
  }
}
```

**Controller Function:** `AddressController.getAddressById`  
**File Location:** `controllers/dashboard/addresses/addresses-controller.js` (lines 75-100)

---

### 3. Create Address
**POST** `/api/v1/dashboard/addresses/address`

**Description / الوصف:**  
Creates a new address for a specific user.

**Authentication:** Required (Admin/Employee)

**Request Body / جسم الطلب:**
```json
{
  "userId": "user_id",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",
  "city": "Riyadh",
  "state": "Riyadh",
  "postalCode": "12345",
  "country": "SA",
  "isDefault": false
}
```

**Required Fields / الحقول المطلوبة:**
- `userId` - ID of the user
- `addressLine1` - First address line
- `city` - City name
- `state` - State/Province name
- `country` - Country code

**Validation Rules / قواعد التحقق:**
- User must exist
- Address must be unique for the user (no duplicates - checked by comparing all address fields)
- First address for a user is automatically set as default (if user has no existing addresses)
- If `isDefault` is true, all other default addresses for the user are unset
- Required fields: addressLine1, city, state, country
- Optional fields: addressLine2, postalCode

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Address added successfully",
    "ar": "تم إضافة العنوان بنجاح"
  },
  "data": {
    "address": {
      // Created address object
    }
  }
}
```

**Controller Function:** `AddressController.createAddress`  
**File Location:** `controllers/dashboard/addresses/addresses-controller.js` (lines 103-209)

---

### 4. Update Address
**PUT** `/api/v1/dashboard/addresses/address/:id`

**Description / الوصف:**  
Updates an existing address.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Address ID

**Request Body / جسم الطلب:**
```json
{
  "addressLine1": "456 Updated St",
  "addressLine2": "Suite 10",
  "city": "Jeddah",
  "state": "Makkah",
  "postalCode": "54321",
  "country": "SA",
  "isDefault": true
}
```

**All fields are optional** - Only provided fields will be updated.

**Validation Rules / قواعد التحقق:**
- Updated address must be unique for the user (no duplicates - excludes current address from check)
- Setting address as default unsets other default addresses for the user
- All address fields are trimmed before validation and storage
- Address fields can be set to null/empty (addressLine2, postalCode)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Address updated successfully",
    "ar": "تم تحديث العنوان بنجاح"
  },
  "data": {
    "address": {
      // Updated address object
    }
  }
}
```

**Controller Function:** `AddressController.updateAddress`  
**File Location:** `controllers/dashboard/addresses/addresses-controller.js` (lines 212-293)

---

### 5. Delete Address
**DELETE** `/api/v1/dashboard/addresses/address/:id`

**Description / الوصف:**  
Permanently deletes an address.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Address ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Address deleted successfully",
    "ar": "تم حذف العنوان بنجاح"
  },
  "data": null
}
```

**Controller Function:** `AddressController.deleteAddress`  
**File Location:** `controllers/dashboard/addresses/addresses-controller.js` (lines 296-318)

---

## Wishlists Endpoints / نقاط نهاية قوائم الرغبات

**Base Path / المسار الأساسي:** `/api/v1/dashboard/wishlists`

All wishlist routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get All Wishlists
**GET** `/api/v1/dashboard/wishlists`

**Description / الوصف:**  
Retrieves all wishlists with pagination and filtering support.

**Authentication:** Required (Admin/Employee)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `search` (optional) - Search in user name or product name

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "wishlists": [
      {
        "id": "wishlist_id",
        "user": {
          "id": "user_id",
          "firstname": "John",
          "lastname": "Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "role": "customer"
        },
        "products": [
          {
            // Product object
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalWishlists": 50,
      "limit": 10
    }
  }
}
```

**Controller Function:** `WishlistController.getWishlists`  
**File Location:** `controllers/dashboard/wishlists/wishlists-controller.js` (lines 20-79)

**Populated Fields / الحقول المملوءة:**
- `user`: firstname, lastname, email, phone, role
- `products`: name, pricePerUnit, images, description
- Review counts are automatically attached to all products using `attachReviewCountsToProducts` utility

**Response Currency / عملة الاستجابة:**
- All wishlist responses include `currency: "USD"` field

**Search Fields / حقول البحث:**
- User firstname, lastname, email
- Product name (searches in populated products field)

**Response Format / تنسيق الاستجابة:**
- User is formatted with `includeBusinessInfo: false` and `includeVerification: false`
- Products are formatted with `includeOwner: false` and `includeApproval: false`

---

### 2. Get Wishlist by ID
**GET** `/api/v1/dashboard/wishlists/:id`

**Description / الوصف:**  
Retrieves a specific wishlist by its ID.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Wishlist ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "wishlist": {
      // Complete wishlist object
    }
  }
}
```

**Controller Function:** `WishlistController.getWishlistById`  
**File Location:** `controllers/dashboard/wishlists/wishlists-controller.js` (lines 82-122)

**Populated Fields / الحقول المملوءة:**
- `user`: firstname, lastname, email, phone, role
- `products`: name, pricePerUnit, images, description
- Review counts are automatically attached to products

**Response Currency / عملة الاستجابة:**
- Response includes `currency: "USD"` field

---

### 3. Create Wishlist
**POST** `/api/v1/dashboard/wishlists/wishlist`

**Description / الوصف:**  
Creates a new wishlist for a specific user.

**Authentication:** Required (Admin/Employee)

**Request Body / جسم الطلب:**
```json
{
  "userId": "user_id",
  "productIds": ["product_id1", "product_id2"]
}
```

**Required Fields / الحقول المطلوبة:**
- `userId` - ID of the user

**Optional Fields / الحقول الاختيارية:**
- `productIds` - Array of product IDs to add to wishlist

**Validation Rules / قواعد التحقق:**
- User must exist
- User can only have one wishlist (returns error if wishlist already exists for user)
- All products must exist (if provided in productIds array)
- ProductIds array can be empty (creates wishlist with no products)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Wishlist created successfully",
    "ar": "تم إنشاء قائمة الرغبات بنجاح"
  },
  "data": {
    "wishlist": {
      // Created wishlist object
    }
  }
}
```

**Controller Function:** `WishlistController.createWishlist`  
**File Location:** `controllers/dashboard/wishlists/wishlists-controller.js` (lines 125-205)

---

### 4. Update Wishlist
**PUT** `/api/v1/dashboard/wishlists/wishlist/:id`

**Description / الوصف:**  
Updates an existing wishlist. Can update the products in the wishlist.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Wishlist ID

**Request Body / جسم الطلب:**
```json
{
  "productIds": ["product_id1", "product_id2", "product_id3"]
}
```

**Required Fields / الحقول المطلوبة:**
- `productIds` - Array of product IDs (can be empty array)

**Validation Rules / قواعد التحقق:**
- All products must exist (validated by checking productIds against database)
- ProductIds array can be empty (removes all products from wishlist)
- If any product in productIds doesn't exist, returns error

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Wishlist updated successfully",
    "ar": "تم تحديث قائمة الرغبات بنجاح"
  },
  "data": {
    "wishlist": {
      // Updated wishlist object
    }
  }
}
```

**Controller Function:** `WishlistController.updateWishlist`  
**File Location:** `controllers/dashboard/wishlists/wishlists-controller.js` (lines 208-269)

---

### 5. Delete Wishlist
**DELETE** `/api/v1/dashboard/wishlists/wishlist/:id`

**Description / الوصف:**  
Permanently deletes a wishlist.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Wishlist ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Wishlist deleted successfully",
    "ar": "تم حذف قائمة الرغبات بنجاح"
  },
  "data": null
}
```

**Controller Function:** `WishlistController.deleteWishlist`  
**File Location:** `controllers/dashboard/wishlists/wishlists-controller.js` (lines 272-295)

---

## Stats Endpoints / نقاط نهاية الإحصائيات

**Base Path / المسار الأساسي:** `/api/v1/dashboard/stats`

All stats routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get User Statistics
**GET** `/api/v1/dashboard/stats/users`

**Description / الوصف:**  
Retrieves user-related statistics.

**Authentication:** Required (Admin/Employee)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "totalUsers": 1000,
    "customers": 800,
    "businesses": 150,
    "admins": 5,
    "employees": 45,
    "allowedUsers": 950,
    "disallowedUsers": 50,
    "recentUsers": 100
  }
}
```

**Controller Function:** `StatsController.getUserStats`  
**File Location:** `controllers/dashboard/stats/stats-controller.js` (lines 23-59)

**Notes / ملاحظات:**
- `recentUsers` - Users created in the last 30 days
- All counts are real-time from database
- Statistics include all user roles (customer, business, admin, magnet_employee)

---

### 2. Get Order Statistics
**GET** `/api/v1/dashboard/stats/orders`

**Description / الوصف:**  
Retrieves order-related statistics including revenue.

**Authentication:** Required (Admin/Employee)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "totalOrders": 5000,
    "pendingOrders": 50,
    "confirmedOrders": 200,
    "processingOrders": 150,
    "shippedOrders": 300,
    "deliveredOrders": 4000,
    "cancelledOrders": 200,
    "refundedOrders": 100,
    "totalRevenue": 500000,
    "recentOrders": 500
  }
}
```

**Controller Function:** `StatsController.getOrderStats`  
**File Location:** `controllers/dashboard/stats/stats-controller.js` (lines 62-108)

**Notes / ملاحظات:**
- `totalRevenue` - Sum of orders with status 'delivered' or 'shipped' (calculated from `total` field using MongoDB aggregation)
- `recentOrders` - Orders created in the last 30 days
- Revenue calculation uses MongoDB aggregation pipeline: `$match` for status filter, `$group` for sum
- All order statuses are tracked separately (pending, confirmed, processing, shipped, delivered, cancelled, refunded)

---

### 3. Get Product Statistics
**GET** `/api/v1/dashboard/stats/products`

**Description / الوصف:**  
Retrieves product-related statistics.

**Authentication:** Required (Admin/Employee)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "totalProducts": 2000,
    "approvedProducts": 1800,
    "pendingProducts": 150,
    "declinedProducts": 50,
    "averagePrice": 125.50,
    "productsByCategory": [
      {
        "categoryName": {
          "en": "Electronics",
          "ar": "إلكترونيات"
        },
        "count": 500
      }
    ],
    "recentProducts": 200
  }
}
```

**Controller Function:** `StatsController.getProductStats`  
**File Location:** `controllers/dashboard/stats/stats-controller.js` (lines 111-157)

**Notes / ملاحظات:**
- `averagePrice` - Average price across all products (calculated from `pricePerUnit` field using MongoDB aggregation)
- `productsByCategory` - Product count grouped by category (includes category name in both languages via $lookup)
- `recentProducts` - Products created in the last 30 days
- Category grouping uses MongoDB aggregation pipeline: `$group` by category, `$lookup` to join categories collection, `$unwind` and `$project` for formatting

---

### 4. Get Review Statistics
**GET** `/api/v1/dashboard/stats/reviews`

**Description / الوصف:**  
Retrieves review-related statistics.

**Authentication:** Required (Admin/Employee)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "totalReviews": 3000,
    "approvedReviews": 2800,
    "pendingReviews": 150,
    "rejectedReviews": 50,
    "averageRating": 4.5,
    "reviewsByRating": [
      { "_id": 5, "count": 1500 },
      { "_id": 4, "count": 1000 },
      { "_id": 3, "count": 300 },
      { "_id": 2, "count": 150 },
      { "_id": 1, "count": 50 }
    ],
    "recentReviews": 300
  }
}
```

**Controller Function:** `StatsController.getReviewStats`  
**File Location:** `controllers/dashboard/stats/stats-controller.js` (lines 160-204)

**Notes / ملاحظات:**
- `averageRating` - Average rating across all reviews (calculated using MongoDB aggregation)
- `reviewsByRating` - Review count grouped by rating (1-5), sorted by rating ascending
- `recentReviews` - Reviews created in the last 30 days
- Rating distribution shows count for each rating level

---

### 5. Get General Statistics
**GET** `/api/v1/dashboard/stats/general`

**Description / الوصف:**  
Retrieves general platform statistics including overview and recent activity.

**Authentication:** Required (Admin/Employee)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "overview": {
      "totalUsers": 1000,
      "totalProducts": 2000,
      "totalOrders": 5000,
      "totalReviews": 3000,
      "totalWishlists": 800,
      "totalAddresses": 1200,
      "totalRevenue": 500000
    },
    "recentActivity": {
      "recentUsers": 50,
      "recentProducts": 100,
      "recentOrders": 200,
      "recentReviews": 150
    }
  }
}
```

**Controller Function:** `StatsController.getGeneralStats`  
**File Location:** `controllers/dashboard/stats/stats-controller.js` (lines 207-261)

**Notes / ملاحظات:**
- `recentActivity` - Activity in the last 7 days (users, products, orders, reviews)
- `totalRevenue` - Sum of delivered/shipped orders (calculated from `total` field using MongoDB aggregation)
- Provides comprehensive platform overview in a single endpoint
- All counts are real-time database queries
- Revenue calculation: `$match` for status filter (delivered or shipped), `$group` for sum of total field

---

## Applicants Endpoints / نقاط نهاية المتقدمين

**Base Path / المسار الأساسي:** `/api/v1/dashboard/applicants`

All applicant routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get All Applicants
**GET** `/api/v1/dashboard/applicants`

**Description / الوصف:**  
Retrieves all job applicants with pagination and filtering support.

**Authentication:** Required (Admin/Employee)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by applicant status (pending, accepted, rejected)
- `search` (optional) - Search in applicant name

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "applicants": [
      {
        "id": "applicant_id",
        "name": "John Doe",
        "email": "john@example.com",
        "age": 28,
        "gender": "male",
        "status": "pending",
        "links": ["https://linkedin.com/in/johndoe"],
        "hasCV": true,
        "reviewedBy": null,
        "reviewedAt": null,
        "rejectionReason": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalApplicants": 50,
      "limit": 10
    }
  }
}
```

**Note:** CV buffer is excluded from list response to reduce payload size. Use the `/applicants/:id/cv` endpoint to download the CV.

**Controller Function:** `ApplicantController.getApplicants`  
**File Location:** `controllers/dashboard/applicants/applicants-controller.js` (lines 23-68)

---

### 2. Get Applicant by ID
**GET** `/api/v1/dashboard/applicants/:id`

**Description / الوصف:**  
Retrieves a specific applicant by their ID (without CV buffer).

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Applicant ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "applicant": {
      "id": "applicant_id",
      "name": "John Doe",
      "email": "john@example.com",
      "age": 28,
      "gender": "male",
      "status": "pending",
      "links": ["https://linkedin.com/in/johndoe"],
      "hasCV": true,
      "reviewedBy": null,
      "reviewedAt": null,
      "rejectionReason": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Note:** CV buffer is excluded. Use `/applicants/:id/cv` to download the CV.

**Controller Function:** `ApplicantController.getApplicantById`  
**File Location:** `controllers/dashboard/applicants/applicants-controller.js` (lines 71-96)

---

### 3. Get Applicant CV
**GET** `/api/v1/dashboard/applicants/:id/cv`

**Description / الوصف:**  
Downloads the CV file for a specific applicant.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Applicant ID

**Response / الاستجابة:**
- Returns PDF file as binary download
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="{applicant_name}_CV.pdf"`

**Error Responses / استجابات الخطأ:**
- `404` - Applicant not found or CV not available

**Controller Function:** `ApplicantController.getApplicantCV`  
**File Location:** `controllers/dashboard/applicants/applicants-controller.js` (lines 99-130)

---

### 4. Update Applicant Status
**PUT** `/api/v1/dashboard/applicants/:id/status`

**Description / الوصف:**  
Updates the status of an applicant (pending, accepted, rejected). Sets reviewer information automatically.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Applicant ID

**Request Body / جسم الطلب:**
```json
{
  "status": "accepted",
  "rejectionReason": null
}
```

For rejected status:
```json
{
  "status": "rejected",
  "rejectionReason": "Reason for rejection"
}
```

**Required Fields / الحقول المطلوبة:**
- `status` - Must be one of: `pending`, `accepted`, `rejected`
- `rejectionReason` - Required if status is `rejected`

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Applicant status updated successfully",
    "ar": "تم تحديث حالة المتقدم بنجاح"
  },
  "data": {
    "applicant": {
      // Updated applicant object
    }
  }
}
```

**Features / الميزات:**
- Automatically sets `reviewedBy` to current admin/employee
- Automatically sets `reviewedAt` timestamp
- Sends email notification to applicant when status changes to accepted/rejected
- Stores rejection reason if status is rejected

**Controller Function:** `ApplicantController.updateApplicantStatus`  
**File Location:** `controllers/dashboard/applicants/applicants-controller.js` (lines 133-224)

---

### 5. Add/Submit Applicant
**POST** `/api/v1/dashboard/applicants`

**Description / الوصف:**  
Allows admin/employee to submit an application on behalf of a candidate (with file upload).

**Authentication:** Required (Admin/Employee)

**Request Body / جسم الطلب:**
- Multipart form data with file upload

**Fields:**
- `name` (required) - Applicant name
- `email` (required) - Applicant email
- `age` (required) - Applicant age (1-150)
- `gender` (required) - Must be 'male' or 'female'
- `links` (optional) - Array of links (up to 5 links) or single link string
- `cv` (required) - PDF file (multipart/form-data)

**Validation Rules / قواعد التحقق:**
- Email must be unique (case-insensitive check using regex)
- CV must be PDF format (mimetype: 'application/pdf')
- CV file size limit enforced by upload middleware
- Age must be between 1-150 (numeric validation)
- Gender must be 'male' or 'female' (exact match)
- Maximum 5 links allowed (array is sliced to 5 if more provided)
- Links can be provided as array or single string (converted to array)
- Empty links are filtered out
- Links are trimmed before storage
- Name and email are trimmed before storage

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Application submitted successfully",
    "ar": "تم تقديم الطلب بنجاح"
  },
  "data": {
    "applicant": {
      // Created applicant object (CV buffer excluded)
    }
  }
}
```

**Features / الميزات:**
- Sends submission confirmation email to applicant
- Stores CV as binary buffer in database (cv field)
- Stores CV content type (cvContentType field, default: 'application/pdf')
- Sets `has_cv` flag to true if CV is uploaded
- Validates PDF format and file size
- Status is set to 'pending' by default
- CV buffer is excluded from list and detail responses (use /cv endpoint to download)

**Controller Function:** `ApplicantController.addApplicant`  
**File Location:** `controllers/dashboard/applicants/applicants-controller.js` (lines 227-367)

---

### 6. Delete Applicant
**DELETE** `/api/v1/dashboard/applicants/:id`

**Description / الوصف:**  
Permanently deletes an applicant and their CV.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Applicant ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Applicant deleted successfully",
    "ar": "تم حذف المتقدم بنجاح"
  },
  "data": null
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Applicant not found

**Controller Function:** `ApplicantController.deleteApplicant`  
**File Location:** `controllers/dashboard/applicants/applicants-controller.js` (lines 370-394)

---

## Special Orders Endpoints / نقاط نهاية الطلبات الخاصة

**Base Path / المسار الأساسي:** `/api/v1/dashboard/special-orders`

All special order routes use `verifyToken` and `requireAdminOrEmployee` middleware.

### 1. Get All Special Orders
**GET** `/api/v1/dashboard/special-orders`

**Description / الوصف:**  
Retrieves all special orders with pagination and filtering support.

**Authentication:** Required (Admin/Employee)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by status (pending, reviewed, contacted)
- `userId` (optional) - Filter by user ID
- `productId` (optional) - Filter by product ID
- `search` (optional) - Search in needs, reason, or notes

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "specialOrders": [
      {
        "id": "special_order_id",
        "user": {
          // User object with business info
        },
        "product": {
          // Product object with owner and category
        },
        "needs": "Custom quantity request",
        "reason": "Need bulk order for business",
        "status": "pending",
        "reviewedBy": null,
        "reviewedAt": null,
        "notes": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

**Controller Function:** `SpecialOrderController.getSpecialOrders`  
**File Location:** `controllers/dashboard/special-orders/special-orders-controller.js` (lines 59-132)

**Populated Fields / الحقول المملوءة:**
- `userId`: firstname, lastname, email, phone, role, country, imageUrl, businessInfo
- `productId.owner`: firstname, lastname, email, role, businessInfo.companyName
- `productId.category`: name, description
- `reviewedBy`: firstname, lastname, email, role

**Search Fields / حقول البحث:**
- needs (case-insensitive regex)
- reason (case-insensitive regex)
- notes (case-insensitive regex)

**Sorting / الترتيب:**
- Special orders are sorted by creation date (newest first)

---

### 2. Get Special Order by ID
**GET** `/api/v1/dashboard/special-orders/:id`

**Description / الوصف:**  
Retrieves a specific special order by its ID.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Special Order ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "specialOrder": {
      "id": "special_order_id",
      "user": {
        // Complete user object with business info
      },
      "product": {
        // Complete product object with owner and category
      },
      "needs": "Custom quantity request",
      "reason": "Need bulk order for business",
      "status": "pending",
      "reviewedBy": null,
      "reviewedAt": null,
      "notes": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Special order not found

**Controller Function:** `SpecialOrderController.getSpecialOrderById`  
**File Location:** `controllers/dashboard/special-orders/special-orders-controller.js` (lines 135-185)

**Populated Fields / الحقول المملوءة:**
- `userId`: firstname, lastname, email, phone, role, country, imageUrl, businessInfo
- `productId.owner`: firstname, lastname, email, role, businessInfo.companyName
- `productId.category`: name, description
- `reviewedBy`: firstname, lastname, email, role

**Response Format / تنسيق الاستجابة:**
- User is formatted with full business info and verification details
- Product is formatted with owner and approval information
- ReviewedBy is formatted with basic user info (no business info, no verification)

---

### 3. Create Special Order
**POST** `/api/v1/dashboard/special-orders`

**Description / الوصف:**  
Creates a new special order on behalf of a user. Allows admin/employee to create special orders for customers.

**Authentication:** Required (Admin/Employee)

**Request Body / جسم الطلب:**
```json
{
  "userId": "user_id",
  "productId": "product_id",
  "needs": "Custom quantity request details",
  "reason": "Reason for special order"
}
```

**Required Fields / الحقول المطلوبة:**
- `userId` - ID of the user requesting the special order
- `productId` - ID of the product
- `needs` - Description of what the user needs
- `reason` - Reason for the special order request

**Validation Rules / قواعد التحقق:**
- User must exist
- Product must exist

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Special order created successfully",
    "ar": "تم إنشاء الطلب الخاص بنجاح"
  },
  "data": {
    "specialOrder": {
      // Created special order object
    }
  }
}
```

**Controller Function:** `SpecialOrderController.createSpecialOrder`  
**File Location:** `controllers/dashboard/special-orders/special-orders-controller.js` (lines 188-266)

**Business Logic / المنطق التجاري:**
- All text fields (needs, reason) are trimmed before storage
- Status defaults to 'pending' (initial status)
- User and product existence are validated before creation
- Special order is created with populated user and product for response

---

### 4. Update Special Order
**PUT** `/api/v1/dashboard/special-orders/:id`

**Description / الوصف:**  
Updates an existing special order. Can update needs, reason, status, and notes.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Special Order ID

**Request Body / جسم الطلب:**
```json
{
  "needs": "Updated needs description",
  "reason": "Updated reason",
  "status": "reviewed",
  "notes": "Admin notes about this order"
}
```

**All fields are optional** - Only provided fields will be updated.

**Status Values / قيم الحالة:**
- `pending` - Initial status (default when created)
- `reviewed` - Order has been reviewed by admin/employee
- `contacted` - User has been contacted about the order

**Status Constants / ثوابت الحالة:**
- Status values are defined in `SPECIAL_ORDER_STATUS` constant from the model
- When status is set to 'reviewed' or 'contacted', `reviewedBy` and `reviewedAt` are automatically set

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Special order updated successfully",
    "ar": "تم تحديث الطلب الخاص بنجاح"
  },
  "data": {
    "specialOrder": {
      // Updated special order object
    }
  }
}
```

**Features / الميزات:**
- When status is set to 'reviewed' or 'contacted', automatically sets `reviewedBy` (current user ID) and `reviewedAt` (current timestamp)
- Allows adding admin notes (notes field, can be set to null)
- All text fields (needs, reason, notes) are trimmed before storage
- Status validation ensures only valid status values are accepted
- Populated fields include user (with business info), product (with owner and category), and reviewedBy

**Controller Function:** `SpecialOrderController.updateSpecialOrder`  
**File Location:** `controllers/dashboard/special-orders/special-orders-controller.js` (lines 269-351)

---

### 5. Delete Special Order
**DELETE** `/api/v1/dashboard/special-orders/:id`

**Description / الوصف:**  
Permanently deletes a special order.

**Authentication:** Required (Admin/Employee)

**Path Parameters / معاملات المسار:**
- `id` (required) - Special Order ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Special order deleted successfully",
    "ar": "تم حذف الطلب الخاص بنجاح"
  },
  "data": null
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Special order not found

**Controller Function:** `SpecialOrderController.deleteSpecialOrder`  
**File Location:** `controllers/dashboard/special-orders/special-orders-controller.js` (lines 354-384)

---

## Summary / الملخص

### Endpoint Count / عدد النقاط

| Category / الفئة | Count / العدد |
|------------------|---------------|
| Users / المستخدمين | 9 endpoints |
| Products / المنتجات | 12 endpoints |
| Categories / الفئات | 6 endpoints |
| Profile / الملف الشخصي | 2 endpoints |
| Orders / الطلبات | 5 endpoints |
| Reviews / التقييمات | 4 endpoints |
| Addresses / العناوين | 5 endpoints |
| Wishlists / قوائم الرغبات | 5 endpoints |
| Stats / الإحصائيات | 5 endpoints |
| Applicants / المتقدمين | 6 endpoints |
| Special Orders / الطلبات الخاصة | 5 endpoints |
| **Total / المجموع** | **62 endpoints** |

### Authentication Summary / ملخص المصادقة

- **All endpoints** require JWT authentication (`verifyToken`)
- **All endpoints** require admin or employee role (`requireAdminOrEmployee`)

### Key Features / الميزات الرئيسية

1. **User Management / إدارة المستخدمين:**
   - Full CRUD operations
   - Business user approval workflow
   - User status management (allow/disallow)
   - Role-based user creation
   - Access pages management for admin/employee

2. **Product Management / إدارة المنتجات:**
   - Full CRUD operations
   - Product approval workflow
   - Product status management
   - View product reviews and orders
   - Advanced search capabilities

3. **Category Management / إدارة الفئات:**
   - Full CRUD operations
   - Category status management
   - Bilingual support
   - Duplicate prevention

4. **Profile Management / إدارة الملف الشخصي:**
   - View and update admin/employee profile
   - Email and phone update capability
   - Password update

5. **Order Management / إدارة الطلبات:**
   - Full CRUD operations
   - Order creation with validation
   - Stock management
   - Date range filtering
   - Payment method tracking
   - Order notes support

6. **Review Management / إدارة التقييمات:**
   - View all reviews
   - Review rejection with reason
   - Email notifications
   - Review deletion

7. **Address Management / إدارة العناوين:**
   - Full CRUD operations
   - Default address management
   - Duplicate prevention
   - User-specific addresses

8. **Wishlist Management / إدارة قوائم الرغبات:**
   - Full CRUD operations
   - One wishlist per user
   - Product validation

9. **Statistics / الإحصائيات:**
   - User statistics
   - Order statistics with revenue
   - Product statistics
   - Review statistics
   - General platform overview

10. **Applicant Management / إدارة المتقدمين:**
    - Full CRUD operations
    - CV file upload and download
    - Status management (pending, accepted, rejected)
    - Email notifications
    - Review tracking

11. **Special Order Management / إدارة الطلبات الخاصة:**
    - Full CRUD operations
    - Create orders on behalf of users
    - Status management (pending, reviewed, contacted)
    - Notes support
    - Search and filtering capabilities

### Security Features / ميزات الأمان

- All endpoints require authentication
- Role-based access control (admin/employee only)
- Input validation for all fields
- Bilingual field validation
- Duplicate prevention
- Ownership validation

### Email Notifications / إشعارات البريد الإلكتروني

The dashboard sends email notifications for:
- **User Management:**
  - User allow/disallow actions (via `sendUserAllowNotification` and `sendUserDisallowNotification`)
  - Business user approval/rejection (via `sendBusinessApprovalNotification`)
- **Product Management:**
  - Product approval (via `sendProductApprovalNotification`)
  - Product decline/rejection (via `sendProductDeclineNotification`)
  - Product allow/disallow toggle (via `sendProductAllowNotification` and `sendProductDisallowNotification`)
- **Review Management:**
  - Review rejection (via `sendReviewRejectionNotification`)
- **Applicant Management:**
  - Applicant status changes - acceptance (via `sendApplicantAcceptanceNotification`)
  - Applicant status changes - rejection (via `sendApplicantRejectionNotification`)
  - Applicant submission confirmation (via `sendApplicantSubmissionNotification`)

**Note:** Email failures do not cause API requests to fail - errors are logged but requests succeed

### Data Flow / تدفق البيانات

```
Request → verifyToken → requireAdminOrEmployee → Controller → Validation → Database → Response
```

---

## File Locations / مواقع الملفات

### Routes / المسارات
- Main router: `routes/dashboard/index.js`
- Users: `routes/dashboard/users/users-routes.js`
- Products: `routes/dashboard/products/products-routes.js`
- Categories: `routes/dashboard/categories/categories-routes.js`
- Profile: `routes/dashboard/profile/profile-routes.js`
- Orders: `routes/dashboard/orders/orders-routes.js`
- Reviews: `routes/dashboard/reviews/reviews-routes.js`
- Addresses: `routes/dashboard/addresses/addresses-routes.js`
- Wishlists: `routes/dashboard/wishlists/wishlists-routes.js`
- Stats: `routes/dashboard/stats/stats-routes.js`
- Applicants: `routes/dashboard/applicants/applicants-routes.js`
- Special Orders: `routes/dashboard/special-orders/special-orders-routes.js`

### Controllers / المتحكمات
- Main controller index: `controllers/dashboard/index.js`
- Users: `controllers/dashboard/users/users-controller.js`
- Products: `controllers/dashboard/products/products-controller.js`
- Categories: `controllers/dashboard/categories/categories-controller.js`
- Profile: `controllers/dashboard/profile/profile-controller.js`
- Orders: `controllers/dashboard/orders/orders-controller.js`
- Reviews: `controllers/dashboard/reviews/reviews-controller.js`
- Addresses: `controllers/dashboard/addresses/addresses-controller.js`
- Wishlists: `controllers/dashboard/wishlists/wishlists-controller.js`
- Stats: `controllers/dashboard/stats/stats-controller.js`
- Applicants: `controllers/dashboard/applicants/applicants-controller.js`
- Special Orders: `controllers/dashboard/special-orders/special-orders-controller.js`

### Middleware / الـ Middleware
- Authentication: `middleware/auth-middleware.js` (verifyToken)
- Role validation: `middleware/role-middleware.js` (requireAdminOrEmployee)

---

**End of Report / نهاية التقرير**

