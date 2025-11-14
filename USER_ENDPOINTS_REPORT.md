# User Endpoints Documentation Report
# تقرير توثيق نقاط نهاية المستخدم

**Generated Date / تاريخ الإنشاء:** {{ Current Date }}
**Base URL / الرابط الأساسي:** `/api/v1/user`

---

## 📋 Table of Contents / جدول المحتويات

1. [Overview / نظرة عامة](#overview)
2. [Authentication / المصادقة](#authentication)
3. [Auth Endpoints / نقاط نهاية المصادقة](#auth-endpoints)
4. [Profile Endpoints / نقاط نهاية الملف الشخصي](#profile-endpoints)
5. [Products Endpoints / نقاط نهاية المنتجات](#products-endpoints)
6. [Orders Endpoints / نقاط نهاية الطلبات](#orders-endpoints)
7. [Addresses Endpoints / نقاط نهاية العناوين](#addresses-endpoints)
8. [Wishlists Endpoints / نقاط نهاية قوائم الرغبات](#wishlists-endpoints)
9. [Reviews Endpoints / نقاط نهاية التقييمات](#reviews-endpoints)
10. [Cart Endpoints / نقاط نهاية السلة](#cart-endpoints)
11. [Categories Endpoints / نقاط نهاية التصنيفات](#categories-endpoints)
12. [Summary / الملخص](#summary)

---

## Overview / نظرة عامة

This document provides a comprehensive scan and documentation of all user-related API endpoints in the Magnet e-commerce platform. User endpoints are prefixed with `/api/v1/user` and serve both customers and business users.

يوفر هذا المستند فحصًا وتوثيقًا شاملًا لجميع نقاط نهاية واجهة برمجة التطبيقات المتعلقة بالمستخدمين في منصة Magnet للتجارة الإلكترونية. نقاط نهاية المستخدم تبدأ ب `/api/v1/user` وتخدم كل من العملاء ومستخدمي الأعمال.

### Route Structure / هيكل المسارات

```
/api/v1/user
├── /auth          - Authentication (8 endpoints)
├── /profile       - Profile management (2 endpoints)
├── /products      - Product browsing (2 endpoints)
├── /orders        - Order management (5 endpoints)
├── /addresses     - Address management (5 endpoints)
├── /wishlists     - Wishlist management (2 endpoints)
├── /reviews       - Review management (3 endpoints)
├── /cart          - Cart management (2 endpoints)
└── /categories    - Category browsing (1 endpoint)
```

**Total Endpoints / إجمالي النقاط:** 30 endpoints

---

## Authentication / المصادقة

### Requirements / المتطلبات

User endpoints have different authentication requirements:
- **Public endpoints** (products): No authentication required (optional authentication for personalized results)
- **Protected endpoints**: Require JWT token in Authorization header: `Authorization: Bearer <token>`
- **Role requirements**: Most endpoints require `customer` role, some accept both `customer` and `business` roles

نقاط نهاية المستخدم لها متطلبات مصادقة مختلفة:
- **نقاط النهاية العامة** (المنتجات): لا تتطلب مصادقة (مصادقة اختيارية للنتائج المخصصة)
- **نقاط النهاية المحمية**: تتطلب رمز JWT في رأس Authorization: `Authorization: Bearer <token>`
- **متطلبات الدور**: معظم النقاط تتطلب دور `customer`، بعضها يقبل كل من `customer` و `business`

### Middleware Used / الـ Middleware المستخدم

- `verifyToken`: Applied to protected routes (verifies JWT token)
- `requireCustomer`: Applied to customer-specific routes
- `optionalAuth`: Applied to product routes (attaches user if token provided)

---

## Auth Endpoints / نقاط نهاية المصادقة

**Base Path / المسار الأساسي:** `/api/v1/user/auth`

These endpoints handle user registration, authentication, and password management.

### 1. Register User
**POST** `/api/v1/user/auth/register`

**Description / الوصف:**  
Registers a new customer account. Auto-verifies email/phone based on Saudi phone numbers.

**Authentication:** Not required

**Request Body / جسم الطلب:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "phone": "+966501234567",
  "password": "password123",
  "country": "SA",
  "language": "en"
}
```

**Required Fields / الحقول المطلوبة:**
- `firstname`, `lastname`, `password`
- Either `email` or `phone` (or both)

**Validation Rules / قواعد التحقق:**
- Email must be unique
- Phone must be unique (if provided)
- Saudi phone numbers (starting with +966, 966, or 00966) auto-verify phone
- Non-Saudi phones require email verification

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Registration successful",
    "ar": "تم التسجيل بنجاح"
  },
  "data": {
    "user": {
      "id": "user_id",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "phone": "+966501234567",
      "role": "customer",
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "isAllowed": true
    },
    "token": "jwt_token_here"
  }
}
```

**Controller Function:** `AuthController.register`  
**File Location:** `controllers/user/auth/auth-controller.js` (lines 31-78)

**Features / الميزات:**
- Automatic role assignment (customer)
- Auto-verification for Saudi phones
- Returns JWT token for immediate login
- Password is hashed before storage

---

### 2. Business Registration
**POST** `/api/v1/user/auth/business-register`

**Description / الوصف:**  
Registers a new business user account. Business accounts require admin approval before they can be activated.

**Authentication:** Not required

**Request Body / جسم الطلب:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "business@example.com",
  "phone": "+966501234567",
  "password": "password123",
  "crNumber": "CR123456",
  "vatNumber": "VAT123456",
  "companyName": "My Company",
  "companyType": "LLC",
  "country": "SA",
  "city": "Riyadh",
  "district": "Olaya",
  "streetName": "King Fahd Road"
}
```

**Required Fields / الحقول المطلوبة:**
- `firstname`, `lastname`, `email`, `phone`, `password`
- `crNumber`, `vatNumber`, `companyName`, `companyType`
- `city`, `district`, `streetName`

**Validation Rules / قواعد التحقق:**
- Email must be unique
- Phone must be unique
- Business is created with `approvalStatus: 'pending'`
- Sends notification email to business user

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Business registration submitted. Your account is under review.",
    "ar": "تم تقديم تسجيل الأعمال. حسابك قيد المراجعة."
  },
  "data": {
    "business": {
      "id": "business_id",
      "firstname": "John",
      "lastname": "Doe",
      "email": "business@example.com",
      "role": "business",
      "businessInfo": {
        "companyName": "My Company",
        "approvalStatus": "pending"
      }
    }
  }
}
```

**Note:** No token is returned. Business must wait for admin approval before login.

**Controller Function:** `AuthController.businessRegister`  
**File Location:** `controllers/user/auth/auth-controller.js` (lines 81-135)

---

### 3. Login
**POST** `/api/v1/user/auth/login`

**Description / الوصف:**  
Authenticates user with email/phone and password. Returns JWT token.

**Authentication:** Not required

**Request Body / جسم الطلب:**
```json
{
  "identifier": "john@example.com",
  "password": "password123"
}
```

**Required Fields / الحقول المطلوبة:**
- `identifier` - Email or phone number
- `password` - User password

**Validation Rules / قواعد التحقق:**
- User must exist
- User must be allowed (`isAllowed: true`)
- Password must match

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Login successful",
    "ar": "تم تسجيل الدخول بنجاح"
  },
  "data": {
    "user": {
      // Complete user object
    },
    "token": "jwt_token_here"
  }
}
```

**Error Responses / استجابات الخطأ:**
- `400` - Invalid credentials
- `403` - Account not allowed

**Controller Function:** `AuthController.login`  
**File Location:** `controllers/user/auth/auth-controller.js` (lines 204-228)

---

### 4. Send Email OTP
**POST** `/api/v1/user/auth/send-email-otp`

**Description / الوصف:**  
Sends OTP code to email address for verification during registration.

**Authentication:** Not required

**Request Body / جسم الطلب:**
```json
{
  "email": "newuser@example.com"
}
```

**Required Fields / الحقول المطلوبة:**
- `email` - Email address to verify

**Validation Rules / قواعد التحقق:**
- Email must not already exist in system
- OTP expires in 10 minutes

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "OTP sent to email successfully",
    "ar": "تم إرسال رمز التحقق إلى البريد الإلكتروني بنجاح"
  }
}
```

**Controller Function:** `AuthController.sendEmailOTP`  
**File Location:** `controllers/user/auth/auth-controller.js` (lines 138-157)

---

### 5. Send Phone OTP
**POST** `/api/v1/user/auth/send-phone-otp`

**Description / الوصف:**  
Sends OTP code to phone number for verification during registration.

**Authentication:** Not required

**Request Body / جسم الطلب:**
```json
{
  "phone": "+966501234567"
}
```

**Required Fields / الحقول المطلوبة:**
- `phone` - Phone number to verify

**Validation Rules / قواعد التحقق:**
- Phone must not already exist in system
- OTP expires in 10 minutes

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "OTP sent to phone successfully",
    "ar": "تم إرسال رمز التحقق إلى الهاتف بنجاح"
  }
}
```

**Controller Function:** `AuthController.sendPhoneOTP`  
**File Location:** `controllers/user/auth/auth-controller.js` (lines 160-179)

---

### 6. Confirm OTP
**POST** `/api/v1/user/auth/confirm-otp`

**Description / الوصف:**  
Verifies OTP code sent during registration.

**Authentication:** Not required

**Request Body / جسم الطلب:**
```json
{
  "identifier": "newuser@example.com",
  "otp": "123456"
}
```

**Required Fields / الحقول المطلوبة:**
- `identifier` - Email or phone used to send OTP
- `otp` - OTP code received

**Validation Rules / قواعد التحقق:**
- OTP must match the sent code
- OTP must not be expired (10 minutes)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "OTP verified successfully",
    "ar": "تم التحقق من رمز OTP بنجاح"
  }
}
```

**Controller Function:** `AuthController.confirmOTP`  
**File Location:** `controllers/user/auth/auth-controller.js` (lines 182-201)

---

### 7. Login with OTP
**POST** `/api/v1/user/auth/login-with-otp`

**Description / الوصف:**  
Initiates OTP-based login. Sends OTP to user's email or phone.

**Authentication:** Not required

**Request Body / جسم الطلب:**
```json
{
  "identifier": "john@example.com"
}
```

**Required Fields / الحقول المطلوبة:**
- `identifier` - Email or phone number

**Validation Rules / قواعد التحقق:**
- User must exist
- User must be allowed and can login
- Phone login is Saudi-only
- OTP expires in 10 minutes

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "OTP sent successfully",
    "ar": "تم إرسال رمز OTP بنجاح"
  }
}
```

**Controller Function:** `AuthController.loginWithOTP`  
**File Location:** `controllers/user/auth/auth-controller.js` (lines 231-268)

---

### 8. Confirm Login OTP
**POST** `/api/v1/user/auth/confirm-login-otp`

**Description / الوصف:**  
Verifies OTP code and completes login. Returns JWT token.

**Authentication:** Not required

**Request Body / جسم الطلب:**
```json
{
  "identifier": "john@example.com",
  "otp": "123456"
}
```

**Required Fields / الحقول المطلوبة:**
- `identifier` - Email or phone used to send OTP
- `otp` - OTP code received

**Validation Rules / قواعد التحقق:**
- User must exist
- OTP must match and not be expired
- Verifies email/phone based on identifier type

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Email/Phone verified and login successful",
    "ar": "تم التحقق من البريد الإلكتروني/الهاتف وتسجيل الدخول بنجاح"
  },
  "data": {
    "user": {
      // Complete user object
    },
    "token": "jwt_token_here"
  }
}
```

**Controller Function:** `AuthController.confirmLoginOTP`  
**File Location:** `controllers/user/auth/auth-controller.js` (lines 271-303)

---

### 9. Change Password
**POST** `/api/v1/user/auth/password`

**Description / الوصف:**  
Changes user's password. Requires current password verification.

**Authentication:** Required

**Request Body / جسم الطلب:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Required Fields / الحقول المطلوبة:**
- `currentPassword` - Current password
- `newPassword` - New password

**Validation Rules / قواعد التحقق:**
- Current password must be correct
- New password is hashed before storage

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Password changed successfully",
    "ar": "تم تغيير كلمة المرور بنجاح"
  },
  "data": null
}
```

**Error Responses / استجابات الخطأ:**
- `400` - Invalid current password or missing fields

**Controller Function:** `AuthController.changePassword`  
**File Location:** `controllers/user/auth/auth-controller.js` (lines 306-353)

---

## Profile Endpoints / نقاط نهاية الملف الشخصي

**Base Path / المسار الأساسي:** `/api/v1/user/profile`

All profile routes use `verifyToken` middleware. Role validation is done inside the controller.

### 1. Get Profile
**GET** `/api/v1/user/profile`

**Description / الوصف:**  
Retrieves the authenticated user's profile (customer or business).

**Authentication:** Required (Customer or Business role)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user_id",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "phone": "+966501234567",
      "role": "customer",
      "country": "SA",
      "language": "en",
      "imageUrl": "profile_image_url",
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "isAllowed": true,
      "businessInfo": {
        // Only if role is business
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Controller Function:** `ProfileController.getProfile`  
**File Location:** `controllers/user/profile/profile-controller.js` (lines 18-43)

---

### 2. Update Profile
**PUT** `/api/v1/user/profile`

**Description / الوصف:**  
Updates the authenticated user's profile. Email and phone cannot be updated through this endpoint.

**Authentication:** Required (Customer or Business role)

**Request Body / جسم الطلب:**
```json
{
  "firstname": "John",
  "lastname": "Updated",
  "country": "SA",
  "language": "en",
  "imageUrl": "new_profile_image_url"
}
```

**All fields are optional** - Only provided fields will be updated.

**Restrictions / القيود:**
- `email` and `phone` **cannot** be updated through this endpoint

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
      // Updated user object
    }
  }
}
```

**Controller Function:** `ProfileController.updateProfile`  
**File Location:** `controllers/user/profile/profile-controller.js` (lines 46-97)

---

## Products Endpoints / نقاط نهاية المنتجات

**Base Path / المسار الأساسي:** `/api/v1/user/products`

Product routes use `optionalAuth` middleware (authentication is optional).

### 1. Get Products
**GET** `/api/v1/user/products`

**Description / الوصف:**  
Retrieves all approved and allowed products. Public endpoint with optional authentication.

**Authentication:** Optional (provides personalized results if authenticated)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `category` (optional) - Filter by category ID
- `search` (optional) - Search in product name, description, tags, or owner info
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter
- `sortBy` (optional, default: 'createdAt') - Sort field
- `sortOrder` (optional, default: 'desc') - Sort order (asc/desc)

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
**File Location:** `controllers/user/products/products-controller.js` (lines 7-200)

**Features / الميزات:**
- Only returns approved products
- Advanced search using MongoDB aggregation
- Supports price range filtering
- Supports sorting by various fields

---

### 2. Get Product by ID
**GET** `/api/v1/user/products/:id`

**Description / الوصف:**  
Retrieves a specific approved product by its ID.

**Authentication:** Optional

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

**Error Responses / استجابات الخطأ:**
- `404` - Product not found or not approved

**Controller Function:** `ProductController.getProductById`  
**File Location:** `controllers/user/products/products-controller.js` (lines 203-231)

---

## Orders Endpoints / نقاط نهاية الطلبات

**Base Path / المسار الأساسي:** `/api/v1/user/orders`

All order routes use `verifyToken` and `requireCustomer` middleware.

### 1. Get Orders
**GET** `/api/v1/user/orders`

**Description / الوصف:**  
Retrieves all orders for the authenticated customer.

**Authentication:** Required (Customer role)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by order status
- `search` (optional) - Search in order number

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
        "shippingAddress": {
          // Complete address object
        },
        "status": "pending",
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

**Controller Function:** `OrderController.getOrders`  
**File Location:** `controllers/user/orders/orders-controller.js` (lines 170-256)

---

### 2. Get Order by ID
**GET** `/api/v1/user/orders/:id`

**Description / الوصف:**  
Retrieves a specific order by ID. Only returns orders belonging to the authenticated customer.

**Authentication:** Required (Customer role)

**Path Parameters / معاملات المسار:**
- `id` (required) - Order ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "order": {
      // Complete order object
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Order not found or doesn't belong to user

**Controller Function:** `OrderController.getOrderById`  
**File Location:** `controllers/user/orders/orders-controller.js` (lines 259-331)

---

### 3. Create Order
**POST** `/api/v1/user/orders/order`

**Description / الوصف:**  
Creates a new order for the authenticated customer. Validates products, stock, and calculates totals.

**Authentication:** Required (Customer role)

**Request Body / جسم الطلب:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 10
    }
  ],
  "shippingAddress": "address_id",
  "paymentMethod": "cash_on_delivery",
  "notes": "Special delivery instructions"
}
```

**Required Fields / الحقول المطلوبة:**
- `items` - Array of order items (at least one item)
- `shippingAddress` - ID of shipping address

**Validation Rules / قواعد التحقق:**
- Shipping address must exist and belong to customer
- All products must exist and be approved
- Products must have sufficient stock
- Order is created with status 'pending'

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
- Automatically reduces product stock
- Calculates subtotal and total
- Creates order with status 'pending'

**Controller Function:** `OrderController.createOrder`  
**File Location:** `controllers/user/orders/orders-controller.js` (lines 20-167)

---

### 4. Update Order
**PUT** `/api/v1/user/orders/order/:id`

**Description / الوصف:**  
Updates an existing order. Only allowed if order status is 'pending' or 'confirmed'.

**Authentication:** Required (Customer role)

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
  "notes": "Updated notes"
}
```

**All fields are optional** - Only provided fields will be updated.

**Validation Rules / قواعد التحقق:**
- Order must belong to user
- Order status must be 'pending' or 'confirmed'
- Products are re-validated if items are updated
- Totals are recalculated

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

**Error Responses / استجابات الخطأ:**
- `404` - Order not found
- `400` - Order cannot be updated (wrong status)

**Controller Function:** `OrderController.updateOrder`  
**File Location:** `controllers/user/orders/orders-controller.js` (lines 334-475)

---

### 5. Cancel Order
**PUT** `/api/v1/user/orders/order/:id/cancel`

**Description / الوصف:**  
Cancels an order. Only allowed if order is not shipped or delivered. Restores product stock.

**Authentication:** Required (Customer role)

**Path Parameters / معاملات المسار:**
- `id` (required) - Order ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Order cancelled successfully",
    "ar": "تم إلغاء الطلب بنجاح"
  },
  "data": {
    "order": {
      // Cancelled order object (status: "cancelled")
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Order not found
- `400` - Order cannot be cancelled (already shipped or delivered)

**Features / الميزات:**
- Sets order status to 'cancelled'
- Restores product stock automatically

**Controller Function:** `OrderController.cancelOrder`  
**File Location:** `controllers/user/orders/orders-controller.js` (lines 478-577)

---

## Addresses Endpoints / نقاط نهاية العناوين

**Base Path / المسار الأساسي:** `/api/v1/user/addresses`

All address routes use `verifyToken` and `requireCustomer` middleware.

### 1. Get Addresses
**GET** `/api/v1/user/addresses`

**Description / الوصف:**  
Retrieves all addresses for the authenticated customer.

**Authentication:** Required (Customer role)

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
          "lastname": "Doe"
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Controller Function:** `AddressController.getAddresses`  
**File Location:** `controllers/user/addresses/addresses-controller.js` (lines 18-38)

---

### 2. Get Address by ID
**GET** `/api/v1/user/addresses/:id`

**Description / الوصف:**  
Retrieves a specific address by ID. Only returns addresses belonging to the authenticated customer.

**Authentication:** Required (Customer role)

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

**Error Responses / استجابات الخطأ:**
- `404` - Address not found or doesn't belong to user

**Controller Function:** `AddressController.getAddressById`  
**File Location:** `controllers/user/addresses/addresses-controller.js` (lines 41-69)

---

### 3. Create Address
**POST** `/api/v1/user/addresses/address`

**Description / الوصف:**  
Creates a new address for the authenticated customer.

**Authentication:** Required (Customer role)

**Request Body / جسم الطلب:**
```json
{
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
- `addressLine1`, `city`, `state`, `country`

**Validation Rules / قواعد التحقق:**
- Address must be unique for the user (no duplicates)
- First address is automatically set as default
- Setting address as default unsets other default addresses

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
**File Location:** `controllers/user/addresses/addresses-controller.js` (lines 72-162)

---

### 4. Update Address
**PUT** `/api/v1/user/addresses/address/:id`

**Description / الوصف:**  
Updates an existing address. Only the address owner can update it.

**Authentication:** Required (Customer role)

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
- Address must belong to user
- Updated address must be unique (no duplicates)
- Setting address as default unsets other default addresses

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
**File Location:** `controllers/user/addresses/addresses-controller.js` (lines 165-245)

---

### 5. Delete Address
**DELETE** `/api/v1/user/addresses/address/:id`

**Description / الوصف:**  
Deletes an address. Only the address owner can delete it.

**Authentication:** Required (Customer role)

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

**Error Responses / استجابات الخطأ:**
- `404` - Address not found or doesn't belong to user

**Controller Function:** `AddressController.deleteAddress`  
**File Location:** `controllers/user/addresses/addresses-controller.js` (lines 248-268)

---

## Wishlists Endpoints / نقاط نهاية قوائم الرغبات

**Base Path / المسار الأساسي:** `/api/v1/user/wishlists`

All wishlist routes use `verifyToken` and `requireCustomer` middleware.

### 1. Get Wishlist
**GET** `/api/v1/user/wishlists`

**Description / الوصف:**  
Retrieves the authenticated customer's wishlist. Creates empty wishlist if it doesn't exist.

**Authentication:** Required (Customer role)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "wishlist": {
      "_id": "wishlist_id",
      "products": [
        {
          // Product object
        }
      ]
    }
  }
}
```

**Features / الميزات:**
- Auto-creates wishlist if it doesn't exist
- Filters out unavailable products (not approved or out of stock)
- Updates wishlist automatically if products are filtered

**Controller Function:** `WishlistController.getWishlist`  
**File Location:** `controllers/user/wishlists/wishlists-controller.js` (lines 19-61)

---

### 2. Toggle Wishlist
**PUT** `/api/v1/user/wishlist`

**Description / الوصف:**  
Adds product to wishlist if not exists, removes product if exists (toggle functionality).

**Authentication:** Required (Customer role)

**Request Body / جسم الطلب:**
```json
{
  "productId": "product_id"
}
```

**Required Fields / الحقول المطلوبة:**
- `productId` - ID of the product to add/remove

**Validation Rules / قواعد التحقق:**
- Product must exist and be approved
- Wishlist is auto-created if it doesn't exist

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Product added to wishlist successfully",
    "ar": "تم إضافة المنتج إلى قائمة الرغبات بنجاح"
  },
  "data": {
    "wishlist": {
      // Updated wishlist object
    },
    "action": "added"
  }
}
```

**Note:** Message changes based on action (added/removed).

**Controller Function:** `WishlistController.toggleWishlist`  
**File Location:** `controllers/user/wishlists/wishlists-controller.js` (lines 64-137)

---

## Reviews Endpoints / نقاط نهاية التقييمات

**Base Path / المسار الأساسي:** `/api/v1/user/reviews`

All review routes use `verifyToken` and `requireCustomer` middleware.

### 1. Add Review
**POST** `/api/v1/user/reviews/products/:id/reviews`

**Description / الوصف:**  
Adds a review to a product. Updates product rating automatically.

**Authentication:** Required (Customer role)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID

**Request Body / جسم الطلب:**
```json
{
  "rating": 5,
  "comment": "Great product! Highly recommended."
}
```

**Required Fields / الحقول المطلوبة:**
- `rating` - Rating value (1-5)

**Optional Fields / الحقول الاختيارية:**
- `comment` - Review comment text

**Validation Rules / قواعد التحقق:**
- Product must exist and be approved
- Rating must be between 1 and 5
- User can only review a product once
- Product rating is automatically updated

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Review added successfully",
    "ar": "تم إضافة التقييم بنجاح"
  },
  "data": {
    "review": {
      // Complete review object
    }
  }
}
```

**Features / الميزات:**
- Prevents duplicate reviews
- Automatically updates product average rating
- Sends email notification to product owner (business user)

**Controller Function:** `ReviewController.addReview`  
**File Location:** `controllers/user/reviews/reviews-controller.js` (lines 27-123)

---

### 2. Get Product Reviews
**GET** `/api/v1/user/reviews/products/:id/reviews`

**Description / الوصف:**  
Retrieves all reviews for a specific product with pagination.

**Authentication:** Required (Customer role)

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
          // Product object
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

**Controller Function:** `ReviewController.getProductReviews`  
**File Location:** `controllers/user/reviews/reviews-controller.js` (lines 126-181)

---

### 3. Delete Review
**DELETE** `/api/v1/user/reviews/products/:id/reviews/:reviewId`

**Description / الوصف:**  
Deletes a review. Only the review owner can delete it. Updates product rating automatically.

**Authentication:** Required (Customer role)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID
- `reviewId` (required) - Review ID

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

**Error Responses / استجابات الخطأ:**
- `404` - Review not found
- `400` - Review doesn't belong to the product
- `403` - User doesn't own this review

**Features / الميزات:**
- Only review owner can delete
- Automatically updates product average rating after deletion

**Controller Function:** `ReviewController.deleteReview`  
**File Location:** `controllers/user/reviews/reviews-controller.js` (lines 184-224)

---

## Cart Endpoints / نقاط نهاية السلة

**Base Path / المسار الأساسي:** `/api/v1/user/cart`

Cart routes use `verifyToken` together with `requireCustomer` to ensure only authenticated customers can access their shopping carts.

### 1. Get Cart
**GET** `/api/v1/user/cart`

**Description / الوصف:**  
Returns the authenticated customer's cart (creates an empty cart on first access) with computed totals.

**Authentication:** Required (Customer role)

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Cart retrieved successfully",
    "ar": "تم جلب السلة بنجاح"
  },
  "data": {
    "cart": {
      "id": "cart_id",
      "subtotal": 150,
      "totalItems": 3,
      "currency": "SAR",
      "items": [
        {
          "id": "item_id",
          "quantity": 2,
          "unitPrice": 50,
          "totalPrice": 100,
          "notes": "Extra cold",
          "product": {
            "id": "product_id",
            "name": {
              "en": "Fresh Juice",
              "ar": "عصير طازج"
            },
            "pricePerUnit": "50.00",
            "stock": 20,
            "status": "approved"
          }
        }
      ]
    }
  }
}
```

**Features / الميزات:**
- Auto-creates an empty cart on first access
- Populates product snapshots for each item
- Calculates subtotal and total quantity automatically

**Controller Function:** `CartController.getCart`  
**File Location:** `controllers/user/cart/cart-controller.js` (lines 66-84)

---

### 2. Update Cart
**PUT** `/api/v1/user/cart`

**Description / الوصف:**  
Replaces the customer's cart items with the provided list, validating inventory, approval status, and pricing.

**Authentication:** Required (Customer role)

**Request Body / جسم الطلب:**
```json
{
  "items": [
    {
      "productId": "664a1d1a5b8c12001c111111",
      "quantity": 3,
      "notes": "Deliver chilled"
    },
    {
      "productId": "664a1d1a5b8c12001c222222",
      "quantity": 1
    }
  ]
}
```

**Validation Rules / قواعد التحقق:**
- `items` must be an array (empty array clears the cart)
- `productId` must be a valid MongoDB ObjectId and exist in the catalog
- `quantity` must be an integer ≥ 1; duplicates are merged server-side
- Products must be approved, allowed, and have sufficient stock
- Uses the latest `pricePerUnit` to calculate totals

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Cart updated",
    "ar": "تم تحديث السلة"
  },
  "data": {
    "cart": {
      // Updated cart snapshot with totals
    }
  }
}
```

**Controller Function:** `CartController.updateCart`  
**File Location:** `controllers/user/cart/cart-controller.js` (lines 86-195)

---

## Categories Endpoints / نقاط نهاية التصنيفات

**Base Path / المسار الأساسي:** `/api/v1/user/categories`

Category routes are public and do not require authentication. They return only the categories that are currently approved/active (allowed) for end users.

### 1. Get Allowed Categories
**GET** `/api/v1/user/categories`

**Description / الوصف:**  
Returns all active categories with bilingual names and descriptions, ordered alphabetically.

**Authentication:** Not required (public)

**Query Parameters / معاملات الاستعلام:** None

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Categories retrieved successfully",
    "ar": "تم جلب التصنيفات بنجاح"
  },
  "data": {
    "categories": [
      {
        "id": "category_id",
        "name": {
          "en": "Beverages",
          "ar": "مشروبات"
        },
        "description": {
          "en": "All kinds of drinks",
          "ar": "جميع أنواع المشروبات"
        },
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-05T00:00:00.000Z"
      }
    ]
  }
}
```

**Features / الميزات:**
- Filters out inactive categories automatically
- Returns bilingual fields for UI display
- Sorted alphabetically by English name for consistent ordering

**Controller Function:** `CategoriesController.getAllowedCategories`  
**File Location:** `controllers/user/categories/categories-controller.js`

---

## Summary / الملخص

### Endpoint Count / عدد النقاط

| Category / الفئة | Count / العدد |
|------------------|---------------|
| Auth / المصادقة | 8 endpoints |
| Profile / الملف الشخصي | 2 endpoints |
| Products / المنتجات | 2 endpoints |
| Orders / الطلبات | 5 endpoints |
| Addresses / العناوين | 5 endpoints |
| Wishlists / قوائم الرغبات | 2 endpoints |
| Reviews / التقييمات | 3 endpoints |
| Cart / السلة | 2 endpoints |
| Categories / التصنيفات | 1 endpoint |
| **Total / المجموع** | **30 endpoints** |

### Authentication Summary / ملخص المصادقة

- **Public endpoints** (products): No authentication required
- **Protected endpoints**: Require JWT authentication (`verifyToken`)
- **Role requirements**: Most endpoints require `customer` role
- **OTP-based authentication**: Available for login without password

### Key Features / الميزات الرئيسية

1. **Authentication / المصادقة:**
   - Customer and business registration
   - Email/phone login
   - OTP-based login
   - Password change
   - Email/phone verification

2. **Profile Management / إدارة الملف الشخصي:**
   - View and update profile
   - Supports both customer and business users
   - Email and phone cannot be updated

3. **Product Browsing / تصفح المنتجات:**
   - Public access (no authentication required)
   - Advanced search and filtering
   - Price range filtering
   - Sorting options

4. **Order Management / إدارة الطلبات:**
   - Full order lifecycle
   - Order creation with validation
   - Order updates (pending/confirmed only)
   - Order cancellation with stock restoration
   - Stock management

5. **Address Management / إدارة العناوين:**
   - Multiple addresses per user
   - Default address management
   - Duplicate prevention
   - Full CRUD operations

6. **Wishlist Management / إدارة قوائم الرغبات:**
   - Auto-creation of wishlist
   - Toggle add/remove functionality
   - Automatic filtering of unavailable products

7. **Review Management / إدارة التقييمات:**
   - Add reviews to products
   - View product reviews
   - Delete own reviews
   - Automatic rating calculation
   - Email notifications to business owners

### Security Features / ميزات الأمان

- Password hashing (bcrypt)
- JWT token authentication
- Role-based access control
- Input validation
- Ownership validation (orders, addresses, reviews)
- OTP verification for email/phone
- Duplicate prevention

### Email Notifications / إشعارات البريد الإلكتروني

The user endpoints send email notifications for:
- Business registration submission
- OTP codes for verification
- New review notifications to business owners

### Data Flow / تدفق البيانات

**Public Endpoints:**
```
Request → optionalAuth → Controller → Database → Response
```

**Protected Endpoints:**
```
Request → verifyToken → requireCustomer → Controller → Validation → Database → Response
```

---

## File Locations / مواقع الملفات

### Routes / المسارات
- Main router: `routes/user/index.js`
- Auth: `routes/user/auth/auth-routes.js`
- Profile: `routes/user/profile/profile-routes.js`
- Products: `routes/user/products/products-routes.js`
- Orders: `routes/user/orders/orders-routes.js`
- Addresses: `routes/user/addresses/addresses-routes.js`
- Wishlists: `routes/user/wishlists/wishlists-routes.js`
- Reviews: `routes/user/reviews/reviews-routes.js`

### Controllers / المتحكمات
- Main controller index: `controllers/user/index.js`
- Auth: `controllers/user/auth/auth-controller.js`
- Profile: `controllers/user/profile/profile-controller.js`
- Products: `controllers/user/products/products-controller.js`
- Orders: `controllers/user/orders/orders-controller.js`
- Addresses: `controllers/user/addresses/addresses-controller.js`
- Wishlists: `controllers/user/wishlists/wishlists-controller.js`
- Reviews: `controllers/user/reviews/reviews-controller.js`

### Middleware / الـ Middleware
- Authentication: `middleware/auth-middleware.js` (verifyToken)
- Optional authentication: `middleware/optional-auth-middleware.js` (optionalAuth)
- Role validation: `middleware/role-middleware.js` (requireCustomer)
- Validation: `middleware/validation-middleware.js` (various validators)

---

**End of Report / نهاية التقرير**

