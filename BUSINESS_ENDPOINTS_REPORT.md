# Business Endpoints Documentation Report
# تقرير توثيق نقاط نهاية الأعمال

**Generated Date / تاريخ الإنشاء:** {{ Current Date }}
**Base URL / الرابط الأساسي:** `/api/v1/business`

---

## 📋 Table of Contents / جدول المحتويات

1. [Overview / نظرة عامة](#overview)
2. [Authentication / المصادقة](#authentication)
3. [Products Endpoints / نقاط نهاية المنتجات](#products-endpoints)
4. [Orders Endpoints / نقاط نهاية الطلبات](#orders-endpoints)
5. [Reviews Endpoints / نقاط نهاية التقييمات](#reviews-endpoints)
6. [Profile Endpoints / نقاط نهاية الملف الشخصي](#profile-endpoints)
7. [Summary / الملخص](#summary)

---

## Overview / نظرة عامة

This document provides a comprehensive scan and documentation of all business-related API endpoints in the Magnet e-commerce platform. All business endpoints are prefixed with `/api/v1/business` and require authentication.

يوفر هذا المستند فحصًا وتوثيقًا شاملًا لجميع نقاط نهاية واجهة برمجة التطبيقات المتعلقة بالأعمال في منصة Magnet للتجارة الإلكترونية. جميع نقاط نهاية الأعمال تبدأ ب `/api/v1/business` وتتطلب المصادقة.

### Route Structure / هيكل المسارات

```
/api/v1/business
├── /products          - Product management
├── /orders            - Order management
├── /reviews           - Review management
└── /profile           - Profile management
```

---

## Authentication / المصادقة

### Requirements / المتطلبات

All business endpoints require:
- **JWT Token** in the Authorization header: `Authorization: Bearer <token>`
- **Role**: User must have `business` role (validated either via middleware or controller)

جميع نقاط نهاية الأعمال تتطلب:
- **رمز JWT** في رأس Authorization: `Authorization: Bearer <token>`
- **الدور**: يجب أن يكون للمستخدم دور `business` (يتم التحقق إما عبر middleware أو controller)

### Middleware Used / الـ Middleware المستخدم

- `verifyToken`: Applied to all routes (verifies JWT token)
- `requireBusiness`: Applied to most routes (validates business role at route level)
- Controller-level validation: Some routes validate business role inside the controller

---

## Products Endpoints / نقاط نهاية المنتجات

**Base Path / المسار الأساسي:** `/api/v1/business/products`

All product routes use `verifyToken` and `requireBusiness` middleware.

### 1. Get Business Products
**GET** `/api/v1/business/products`

**Description / الوصف:**  
Retrieves all products owned by the authenticated business user with pagination and filtering support.

**Authentication:** Required (Business role)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by product status (e.g., 'pending', 'approved', 'rejected')
- `search` (optional) - Search in product name, description, or product code

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "product_id",
        "code": "PROD123",
        "name": { "en": "Product Name", "ar": "اسم المنتج" },
        "description": { "en": "Description", "ar": "الوصف" },
        "category": { "id": "category_id", "name": { "en": "Category", "ar": "الفئة" } },
        "images": ["url1", "url2"],
        "unit": { "en": "kg", "ar": "كجم" },
        "minOrder": 10,
        "pricePerUnit": 100,
        "stock": 500,
        "customFields": [
          {
            "key": { "en": "Key", "ar": "المفتاح" },
            "value": { "en": "Value", "ar": "القيمة" }
          }
        ],
        "attachments": ["product_id1", "product_id2"],
        "status": "approved",
        "isAllowed": true,
        "owner": {
          "id": "user_id",
          "firstname": "John",
          "lastname": "Doe",
          "email": "john@example.com",
          "role": "business",
          "companyName": "Company Name"
        },
        "approvedBy": {
          "id": "admin_id",
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
      "totalProducts": 50,
      "limit": 10
    }
  }
}
```

**Controller Function:** `ProductController.getProducts`  
**File Location:** `controllers/business/products/products-controller.js` (lines 26-74)

**Features / الميزات:**
- Only returns products owned by the authenticated business user
- Supports pagination
- Supports filtering by status
- Supports search functionality
- Populates category, owner, and approvedBy information

---

### 2. Get Product by ID
**GET** `/api/v1/business/products/:id`

**Description / الوصف:**  
Retrieves a specific product by its ID, only if the product belongs to the authenticated business user.

**Authentication:** Required (Business role)

**Path Parameters / معاملات المسار:**
- `id` (required) - Product ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "product": {
      // Same structure as in Get Products response
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Product not found
- `403` - Product does not belong to the business user

**Controller Function:** `ProductController.getProductById`  
**File Location:** `controllers/business/products/products-controller.js` (lines 77-113)

**Features / الميزات:**
- Validates product ownership before returning
- Returns detailed product information with populated fields

---

### 3. Create Product
**POST** `/api/v1/business/products/product`

**Description / الوصف:**  
Creates a new product for the business user. The product will have a status of 'pending' and requires admin approval.

**Authentication:** Required (Business role)

**Request Body / جسم الطلب:**
```json
{
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
      "key": {
        "en": "Color",
        "ar": "اللون"
      },
      "value": {
        "en": "Red",
        "ar": "أحمر"
      }
    }
  ],
  "attachments": ["product_id1", "product_id2"],
  "code": "PROD123" // Optional, auto-generated if not provided
}
```

**Required Fields / الحقول المطلوبة:**
- `name` (both `en` and `ar` required)
- `description` (both `en` and `ar` required)
- `pricePerUnit`
- `category` (both `en` and `ar` required)
- `customFields` (array with 3-10 items, each with bilingual key and value)

**Validation Rules / قواعد التحقق:**
- Category must exist and be active
- Custom fields must be between 3-10 items
- All bilingual fields must have both English and Arabic
- Attachments must be valid approved products
- Product code is auto-generated if not provided

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
      // Product object with status: "pending"
    }
  }
}
```

**Controller Function:** `ProductController.createProduct`  
**File Location:** `controllers/business/products/products-controller.js` (lines 116-238)

**Features / الميزات:**
- Creates product with 'pending' status (requires admin approval)
- Validates category existence and active status
- Validates attachments are approved products
- Auto-generates product code if not provided
- Validates all bilingual fields

---

### 4. Update Product
**PUT** `/api/v1/business/products/product/:id`

**Description / الوصف:**  
Updates an existing product. If the product was previously approved, it will be reset to 'pending' status for re-approval.

**Authentication:** Required (Business role)

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
  "attachments": ["product_id1"]
}
```

**All fields are optional** - Only provided fields will be updated.

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
      // Status will be "pending" if previously approved
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Product not found
- `403` - Product does not belong to the business user
- `400` - Invalid category or attachments

**Controller Function:** `ProductController.updateProduct`  
**File Location:** `controllers/business/products/products-controller.js` (lines 241-350)

**Features / الميزات:**
- Validates product ownership
- Resets status to 'pending' if product was approved
- Validates category and attachments if provided
- Only updates provided fields

---

### 5. Delete Product
**DELETE** `/api/v1/business/products/product/:id`

**Description / الوصف:**  
Permanently deletes a product owned by the business user.

**Authentication:** Required (Business role)

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

**Error Responses / استجابات الخطأ:**
- `404` - Product not found
- `403` - Product does not belong to the business user

**Controller Function:** `ProductController.deleteProduct`  
**File Location:** `controllers/business/products/products-controller.js` (lines 353-392)

**Features / الميزات:**
- Validates product ownership before deletion
- Permanently removes product from database

---

### 6. Toggle Product Status
**PUT** `/api/v1/business/products/product/:id/toggle`

**Description / الوصف:**  
Toggles the `isAllowed` status of a product (allows/disallows the product). This controls whether the product is available for purchase.

**Authentication:** Required (Business role)

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
      // Product object with toggled isAllowed status
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Product not found
- `403` - Product does not belong to the business user

**Controller Function:** `ProductController.toggleProduct`  
**File Location:** `controllers/business/products/products-controller.js` (lines 395-436)

**Features / الميزات:**
- Toggles `isAllowed` field (true ↔ false)
- Validates product ownership

---

## Orders Endpoints / نقاط نهاية الطلبات

**Base Path / المسار الأساسي:** `/api/v1/business/orders`

All order routes use `verifyToken` and `requireBusiness` middleware.

### 1. Get Business Orders
**GET** `/api/v1/business/orders`

**Description / الوصف:**  
Retrieves all orders that contain products owned by the authenticated business user. Only returns order items that belong to the business.

**Authentication:** Required (Business role)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by order status
- `search` (optional) - Search in order number, customer name, or email

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "order_id",
        "orderNumber": "ORD123456",
        "status": "pending",
        "customer": {
          "id": "customer_id",
          "firstname": "John",
          "lastname": "Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "imageUrl": "profile_image_url"
        },
        "shippingAddress": {
          "id": "address_id"
        },
        "items": [
          {
            "product": {
              "id": "product_id",
              "name": {
                "en": "Product Name",
                "ar": "اسم المنتج"
              },
              "images": ["url1", "url2"],
              "owner": "business_user_id"
            },
            "quantity": 10,
            "itemTotal": 1000
          }
        ],
        "total": 1000,
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
**File Location:** `controllers/business/orders/orders-controller.js` (lines 33-123)

**Features / الميزات:**
- Only returns orders containing business products
- Filters order items to show only business-owned products
- Supports pagination and filtering
- Returns empty result if business has no products

---

### 2. Get Order by ID
**GET** `/api/v1/business/orders/:id`

**Description / الوصف:**  
Retrieves a specific order by ID, but only if the order contains products owned by the business user. Returns only the business-owned items in the order.

**Authentication:** Required (Business role)

**Path Parameters / معاملات المسار:**
- `id` (required) - Order ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "ORD123456",
      "status": "pending",
      "customer": {
        "id": "customer_id",
        "firstname": "John",
        "lastname": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "imageUrl": "profile_image_url"
      },
      "shippingAddress": {
        "id": "address_id"
      },
      "items": [
        {
          "product": {
            "id": "product_id",
            "images": ["url1", "url2"],
            "name": {
              "en": "Product Name",
              "ar": "اسم المنتج"
            }
          },
          "quantity": 10,
          "itemTotal": 1000
        }
      ],
      "total": 1000,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Order not found or business has no products
- `403` - Order does not contain business products

**Controller Function:** `OrderController.getOrderById`  
**File Location:** `controllers/business/orders/orders-controller.js` (lines 126-243)

**Features / الميزات:**
- Validates order contains business products
- Filters items to show only business-owned products
- Calculates total based only on business items
- Returns customer and shipping address information

---

## Reviews Endpoints / نقاط نهاية التقييمات

**Base Path / المسار الأساسي:** `/api/v1/business/reviews`

All review routes use `verifyToken` middleware. Business role validation is done inside the controller (allows access regardless of approval status).

### 1. Get Business Product Reviews
**GET** `/api/v1/business/reviews`

**Description / الوصف:**  
Retrieves all reviews for products owned by the authenticated business user.

**Authentication:** Required (Business role - validated in controller)

**Query Parameters / معاملات الاستعلام:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `rating` (optional) - Filter by rating (1-5)
- `status` (optional) - Filter by review status
- `search` (optional) - Search in review comment or product name

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
          "id": "product_id",
          "name": {
            "en": "Product Name",
            "ar": "اسم المنتج"
          }
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
**File Location:** `controllers/business/reviews/reviews-controller.js` (lines 25-77)

**Features / الميزات:**
- Only returns reviews for business-owned products
- Supports pagination and filtering
- Populates user and product information
- Allows access regardless of business approval status

---

### 2. Get Review by ID
**GET** `/api/v1/business/reviews/:id`

**Description / الوصف:**  
Retrieves a specific review by ID, only if the review is for a product owned by the business user.

**Authentication:** Required (Business role - validated in controller)

**Path Parameters / معاملات المسار:**
- `id` (required) - Review ID

**Response / الاستجابة:**
```json
{
  "status": "success",
  "message": {
    "en": "Review retrieved successfully",
    "ar": "تم استرجاع التقييم بنجاح"
  },
  "data": {
    "review": {
      // Same structure as in Get Reviews response
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `404` - Review not found
- `403` - Review is not for a business product

**Controller Function:** `ReviewController.getReviewById`  
**File Location:** `controllers/business/reviews/reviews-controller.js` (lines 80-119)

**Features / الميزات:**
- Validates review belongs to business product
- Returns detailed review information
- Allows access regardless of business approval status

---

## Profile Endpoints / نقاط نهاية الملف الشخصي

**Base Path / المسار الأساسي:** `/api/v1/business/profile`

All profile routes use `verifyToken` middleware. Business role validation is done inside the controller (allows access regardless of approval status).

### 1. Get Business Profile
**GET** `/api/v1/business/profile`

**Description / الوصف:**  
Retrieves the authenticated business user's profile information including business-specific details.

**Authentication:** Required (Business role - validated in controller)

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
      "phone": "+1234567890",
      "country": "SA",
      "language": "en",
      "role": "business",
      "imageUrl": "profile_image_url",
      "businessInfo": {
        "companyName": "Company Name",
        "crNumber": "CR123456",
        "vatNumber": "VAT123456",
        "companyType": "LLC",
        "approvalStatus": "approved",
        "address": {
          "city": "Riyadh",
          "district": "Olaya",
          "streetName": "King Fahd Road"
        },
        "approvedBy": {
          "id": "admin_id",
          "firstname": "Admin",
          "lastname": "User",
          "email": "admin@example.com",
          "role": "admin"
        },
        "approvedAt": "2024-01-01T00:00:00.000Z"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Controller Function:** `ProfileController.getProfile`  
**File Location:** `controllers/business/profile/profile-controller.js` (lines 18-43)

**Features / الميزات:**
- Returns complete business user profile
- Includes business-specific information
- Populates approval information
- Allows access regardless of approval status

---

### 2. Update Business Profile
**PUT** `/api/v1/business/profile`

**Description / الوصف:**  
Updates the business user's profile. Note: Updating business info fields will reset the approval status to 'pending' and require re-approval.

**Authentication:** Required (Business role - validated in controller)

**Request Body / جسم الطلب:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "country": "SA",
  "language": "en",
  "imageUrl": "new_profile_image_url",
  "companyName": "Updated Company Name",
  "crNumber": "CR789012",
  "vatNumber": "VAT789012",
  "companyType": "Corporation",
  "city": "Jeddah",
  "district": "Al-Balad",
  "streetName": "Corniche Road"
}
```

**Restrictions / القيود:**
- `email` and `phone` **cannot** be updated through this endpoint
- All business info fields are optional
- Updating business info fields resets approval status to 'pending'

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
      // If business info was updated, approvalStatus will be "pending"
    }
  }
}
```

**Error Responses / استجابات الخطأ:**
- `400` - Attempted to update email or phone
- `404` - User not found

**Controller Function:** `ProfileController.updateProfile`  
**File Location:** `controllers/business/profile/profile-controller.js` (lines 46-150)

**Features / الميزات:**
- Updates basic profile fields
- Updates business-specific information
- Automatically resets approval status when business info is updated
- Preserves existing address fields when partially updating
- Blocks email and phone updates

**Important Notes / ملاحظات مهمة:**
- When business info fields are updated, the following fields are reset:
  - `approvalStatus` → `'pending'`
  - `approvedBy` → `null`
  - `approvedAt` → `null`
  - `rejectedBy` → `null`
  - `rejectedAt` → `null`
  - `rejectionReason` → `null`

---

## Summary / الملخص

### Endpoint Count / عدد النقاط

| Category / الفئة | Count / العدد |
|------------------|---------------|
| Products / المنتجات | 6 endpoints |
| Orders / الطلبات | 2 endpoints |
| Reviews / التقييمات | 2 endpoints |
| Profile / الملف الشخصي | 2 endpoints |
| **Total / المجموع** | **12 endpoints** |

### Authentication Summary / ملخص المصادقة

- **All endpoints** require JWT authentication (`verifyToken`)
- **Most endpoints** require business role validation at route level (`requireBusiness`)
- **Some endpoints** (reviews, profile) validate business role inside controller for flexibility

### Key Features / الميزات الرئيسية

1. **Product Management / إدارة المنتجات:**
   - Full CRUD operations
   - Product approval workflow (pending → approved)
   - Toggle product availability
   - Bilingual support (English/Arabic)
   - Custom fields support
   - Product attachments

2. **Order Management / إدارة الطلبات:**
   - View orders containing business products
   - Filtered view (only business items shown)
   - Customer information included

3. **Review Management / إدارة التقييمات:**
   - View reviews for business products
   - Filtering and search capabilities
   - Access regardless of approval status

4. **Profile Management / إدارة الملف الشخصي:**
   - View and update business profile
   - Business-specific information
   - Approval status management

### Security Features / ميزات الأمان

- All endpoints require authentication
- Role-based access control
- Ownership validation (products, orders, reviews)
- Input validation for all fields
- Bilingual field validation
- Category and attachment validation

### Data Flow / تدفق البيانات

```
Request → verifyToken → requireBusiness (if applicable) → Controller → Validation → Database → Response
```

---

## File Locations / مواقع الملفات

### Routes / المسارات
- Main router: `routes/business/index.js`
- Products: `routes/business/products/products-routes.js`
- Orders: `routes/business/orders/orders-routes.js`
- Reviews: `routes/business/reviews/reviews-routes.js`
- Profile: `routes/business/profile/profile-routes.js`

### Controllers / المتحكمات
- Main controller index: `controllers/business/index.js`
- Products: `controllers/business/products/products-controller.js`
- Orders: `controllers/business/orders/orders-controller.js`
- Reviews: `controllers/business/reviews/reviews-controller.js`
- Profile: `controllers/business/profile/profile-controller.js`

### Middleware / الـ Middleware
- Authentication: `middleware/auth-middleware.js` (verifyToken)
- Role validation: `middleware/role-middleware.js` (requireBusiness)

---

**End of Report / نهاية التقرير**

