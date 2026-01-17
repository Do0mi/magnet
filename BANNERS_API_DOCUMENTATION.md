# Banners API Documentation
# توثيق واجهة برمجة تطبيقات البانرات

This document contains JSON request body examples for all banner endpoints.
يحتوي هذا المستند على أمثلة لأجسام الطلبات JSON لجميع نقاط نهاية البانرات.

---

## Dashboard Endpoints (Admin/Magnet Employee)
## نقاط النهاية للوحة التحكم (المدير/موظف Magnet)

### 1. POST /api/v1/dashboard/banners - Create Banner
### إنشاء بانر

**Request Body:**
```json
{
  "title": {
    "en": "Summer Sale 2024",
    "ar": "تخفيضات الصيف 2024"
  },
  "description": {
    "en": "Get up to 50% off on selected items",
    "ar": "احصل على خصم يصل إلى 50% على العناصر المحددة"
  },
  "imageUrl": "https://example.com/images/banners/summer-sale.jpg",
  "percentage": 50,
  "products": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "from": "2024-06-01T00:00:00.000Z",
  "to": "2024-08-31T23:59:59.999Z"
}
```

**Date Fields (Optional):**
- `from`: Start date/time when the banner becomes active (ISO 8601 format). If not provided, banner is available immediately (if `isAllowed` is true).
- `to`: End date/time when the banner expires (ISO 8601 format). If not provided, banner remains available indefinitely (if `isAllowed` is true).
- **Note:** The `from` date must be before or equal to the `to` date. If both dates are provided, validation will fail if `from > to`.
- **حقول التاريخ (اختيارية):**
  - `from`: تاريخ/وقت البدء عندما يصبح البانر نشطاً (تنسيق ISO 8601). إذا لم يتم توفيره، البانر متاح فوراً (إذا كان `isAllowed` صحيحاً).
  - `to`: تاريخ/وقت الانتهاء عندما ينتهي البانر (تنسيق ISO 8601). إذا لم يتم توفيره، البانر يبقى متاحاً إلى ما لا نهاية (إذا كان `isAllowed` صحيحاً).
  - **ملاحظة:** تاريخ `from` يجب أن يكون قبل أو يساوي تاريخ `to`. إذا تم توفير كلا التاريخين، ستفشل التحقق من الصحة إذا كان `from > to`.

**Note:** Products in the `products` array must not be in any other banner. If a product is already in another banner, you'll receive an error.
**ملاحظة:** المنتجات في مصفوفة `products` يجب ألا تكون في أي بانر آخر. إذا كان المنتج موجود في بانر آخر، ستحصل على خطأ.

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "banner": {
      "id": "507f1f77bcf86cd799439014",
      "title": {
        "en": "Summer Sale 2024",
        "ar": "تخفيضات الصيف 2024"
      },
      "description": {
        "en": "Get up to 50% off on selected items",
        "ar": "احصل على خصم يصل إلى 50% على العناصر المحددة"
      },
      "imageUrl": "https://example.com/images/banners/summer-sale.jpg",
      "percentage": 50,
      "isAllowed": true,
      "owner": {
        "id": "507f1f77bcf86cd799439001",
        "firstname": "Admin",
        "lastname": "User",
        "email": "admin@magnet.com",
        "role": "admin",
        "companyName": "Magnet"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": {
    "en": "Banner created successfully",
    "ar": "تم إنشاء البانر بنجاح"
  }
}
```

---

### 2. GET /api/v1/dashboard/banners - Get All Banners with Products
### الحصول على جميع البانرات مع المنتجات

**Request Query Parameters (Optional):**
```
?page=1&limit=10
```

**No Request Body Required**

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "banners": [
      {
        "id": "507f1f77bcf86cd799439014",
        "title": {
          "en": "Summer Sale 2024",
          "ar": "تخفيضات الصيف 2024"
        },
        "description": {
          "en": "Get up to 50% off on selected items",
          "ar": "احصل على خصم يصل إلى 50% على العناصر المحددة"
        },
        "imageUrl": "https://example.com/images/banners/summer-sale.jpg",
        "percentage": 50,
        "isAllowed": true,
        "from": "2024-06-01T00:00:00.000Z",
        "to": "2024-08-31T23:59:59.999Z",
        "owner": {
          "id": "507f1f77bcf86cd799439001",
          "firstname": "Admin",
          "lastname": "User",
          "email": "admin@magnet.com",
          "role": "admin",
          "companyName": "Magnet"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "products": [
          {
            "id": "507f1f77bcf86cd799439011",
            "code": "PRD-001",
            "name": {
              "en": "Product Name",
              "ar": "اسم المنتج"
            },
            "pricePerUnit": "25.00",
            "originalPrice": "50.00",
            "discountPercentage": 50,
            "discountedPrice": "25.00",
            "images": ["https://example.com/product.jpg"],
            "description": {
              "en": "Product description",
              "ar": "وصف المنتج"
            }
          }
        ]
      }
    ],
    "currency": "USD",
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalBanners": 50,
      "limit": 10
    }
  }
}
```

---

### 3. GET /api/v1/dashboard/banners/:id - Get Banner by ID
### الحصول على بانر بالمعرف

**No Request Body Required**

**URL Parameter:**
- `id`: Banner ID (e.g., `507f1f77bcf86cd799439014`)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "banner": {
      "id": "507f1f77bcf86cd799439014",
      "title": {
        "en": "Summer Sale 2024",
        "ar": "تخفيضات الصيف 2024"
      },
      "description": {
        "en": "Get up to 50% off on selected items",
        "ar": "احصل على خصم يصل إلى 50% على العناصر المحددة"
      },
      "imageUrl": "https://example.com/images/banners/summer-sale.jpg",
      "percentage": 50,
      "isAllowed": true,
      "owner": {
        "id": "507f1f77bcf86cd799439001",
        "firstname": "Admin",
        "lastname": "User",
        "email": "admin@magnet.com",
        "role": "admin",
        "companyName": "Magnet"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "products": [
      {
        "id": "507f1f77bcf86cd799439011",
        "code": "PRD-001",
        "name": {
          "en": "Product Name",
          "ar": "اسم المنتج"
        },
        "pricePerUnit": "25.00",
        "originalPrice": "50.00",
        "discountPercentage": 50,
        "discountedPrice": "25.00",
        "images": ["https://example.com/product.jpg"],
        "description": {
          "en": "Product description",
          "ar": "وصف المنتج"
        }
      }
    ],
    "currency": "USD"
  }
}
```

---

### 4. PUT /api/v1/dashboard/banners/:id - Update Banner
### تحديث بانر

**URL Parameter:**
- `id`: Banner ID (e.g., `507f1f77bcf86cd799439014`)

**Request Body (All fields are optional, only include fields you want to update):**
```json
{
  "title": {
    "en": "Updated Summer Sale 2024",
    "ar": "تخفيضات الصيف المحدثة 2024"
  },
  "description": {
    "en": "Get up to 60% off on selected items",
    "ar": "احصل على خصم يصل إلى 60% على العناصر المحددة"
  },
  "imageUrl": "https://example.com/images/banners/updated-summer-sale.jpg",
  "percentage": 60,
  "products": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014"
  ],
  "from": "2024-06-01T00:00:00.000Z",
  "to": "2024-09-30T23:59:59.999Z"
}
```

**Date Fields Update:**
- To update dates, include `from` and/or `to` in the request body
- To remove a date, set it to `null`
- If updating `to` date while banner is allowed, the new `to` date must be in the future or present (not in the past)
- **تحديث حقول التاريخ:**
  - لتحديث التواريخ، قم بتضمين `from` و/أو `to` في جسم الطلب
  - لإزالة تاريخ، قم بتعيينه إلى `null`
  - إذا كنت تقوم بتحديث تاريخ `to` بينما البانر مسموح، يجب أن يكون تاريخ `to` الجديد في المستقبل أو الحاضر (وليس في الماضي)

**Partial Update Example (only updating percentage and products):**
```json
{
  "percentage": 40,
  "products": [
    "507f1f77bcf86cd799439015",
    "507f1f77bcf86cd799439016"
  ]
}
```

**Note on Product Updates:**
- When updating products array, removed products will have their `isInBanner` field set to `false`
- Newly added products will have their `isInBanner` field set to `true`
- Products must not be in any other banner (excluding the current banner being updated)
- **ملاحظة حول تحديث المنتجات:**
  - عند تحديث مصفوفة المنتجات، المنتجات المحذوفة سيكون حقل `isInBanner` الخاص بها `false`
  - المنتجات المضافة حديثاً سيكون حقل `isInBanner` الخاص بها `true`
  - المنتجات يجب ألا تكون في أي بانر آخر (باستثناء البانر الحالي الذي يتم تحديثه)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "banner": {
      "id": "507f1f77bcf86cd799439014",
      "title": {
        "en": "Updated Summer Sale 2024",
        "ar": "تخفيضات الصيف المحدثة 2024"
      },
      "description": {
        "en": "Get up to 60% off on selected items",
        "ar": "احصل على خصم يصل إلى 60% على العناصر المحددة"
      },
      "imageUrl": "https://example.com/images/banners/updated-summer-sale.jpg",
      "percentage": 60,
      "isAllowed": true,
      "from": "2024-06-01T00:00:00.000Z",
      "to": "2024-09-30T23:59:59.999Z",
      "owner": {
        "id": "507f1f77bcf86cd799439001",
        "firstname": "Admin",
        "lastname": "User",
        "email": "admin@magnet.com",
        "role": "admin",
        "companyName": "Magnet"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:45:00.000Z"
    }
  },
  "message": {
    "en": "Banner updated successfully",
    "ar": "تم تحديث البانر بنجاح"
  }
}
```

---

### 5. DELETE /api/v1/dashboard/banners/:id - Delete Banner
### حذف بانر

**No Request Body Required**

**URL Parameter:**
- `id`: Banner ID (e.g., `507f1f77bcf86cd799439014`)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": null,
  "message": {
    "en": "Banner deleted successfully",
    "ar": "تم حذف البانر بنجاح"
  }
}
```

---

### 6. PUT /api/v1/dashboard/banners/:id/toggle - Toggle Allow Banner
### تبديل حالة البانر (مسموح/غير مسموح)

**No Request Body Required**

**URL Parameter:**
- `id`: Banner ID (e.g., `507f1f77bcf86cd799439014`)

**Important Notes:**
- You can always **disallow** a banner (set `isAllowed` to `false`)
- You can only **allow** a banner if:
  - The banner has no `to` date, OR
  - The `to` date is in the future or present (not in the past)
- If you try to allow a banner whose `to` date has already passed, you'll receive an error. You must first update the `to` date to a future or present date.
- **ملاحظات مهمة:**
  - يمكنك دائماً **تعطيل** البانر (تعيين `isAllowed` إلى `false`)
  - يمكنك فقط **تفعيل** البانر إذا:
    - البانر ليس له تاريخ `to`، أو
    - تاريخ `to` في المستقبل أو الحاضر (وليس في الماضي)
  - إذا حاولت تفعيل بانر انتهى تاريخ `to` الخاص به بالفعل، ستحصل على خطأ. يجب أولاً تحديث تاريخ `to` إلى تاريخ مستقبلي أو حاضر.

**Error Response (400 Bad Request) - Trying to allow past-dated banner:**
```json
{
  "status": "error",
  "message": {
    "en": "Cannot allow banner. The end date has already passed. Please update the date to a future or present date",
    "ar": "لا يمكن السماح بالبانر. تاريخ الانتهاء قد انتهى بالفعل. يرجى تحديث التاريخ إلى تاريخ مستقبلي أو حاضر"
  }
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "banner": {
      "id": "507f1f77bcf86cd799439014",
      "title": {
        "en": "Summer Sale 2024",
        "ar": "تخفيضات الصيف 2024"
      },
      "description": {
        "en": "Get up to 50% off on selected items",
        "ar": "احصل على خصم يصل إلى 50% على العناصر المحددة"
      },
      "imageUrl": "https://example.com/images/banners/summer-sale.jpg",
      "percentage": 50,
      "isAllowed": false,
      "from": "2024-06-01T00:00:00.000Z",
      "to": "2024-08-31T23:59:59.999Z",
      "owner": {
        "id": "507f1f77bcf86cd799439001",
        "firstname": "Admin",
        "lastname": "User",
        "email": "admin@magnet.com",
        "role": "admin",
        "companyName": "Magnet"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  },
  "message": {
    "en": "Banner status toggled successfully",
    "ar": "تم تغيير حالة البانر بنجاح"
  }
}
```

---

## Business Endpoints
## نقاط النهاية للعمل

### 1. POST /api/v1/business/banners - Create Banner
### إنشاء بانر

**Request Body:**
```json
{
  "title": {
    "en": "My Business Special Offer",
    "ar": "عرض خاص لعملي"
  },
  "description": {
    "en": "Special discounts for our customers",
    "ar": "خصومات خاصة لعملائنا"
  },
  "imageUrl": "https://example.com/images/banners/business-offer.jpg",
  "percentage": 30,
  "products": [
    "507f1f77bcf86cd799439021",
    "507f1f77bcf86cd799439022"
  ],
  "from": "2024-07-01T00:00:00.000Z",
  "to": "2024-07-31T23:59:59.999Z"
}
```

**Date Fields:** Same as dashboard endpoints (optional `from` and `to` fields)
**حقول التاريخ:** نفس نقاط نهاية لوحة التحكم (حقول `from` و`to` اختيارية)

**Note:** 
- The `products` array must only contain product IDs that belong to the authenticated business user
- Products must not be in any other banner
- **ملاحظة:**
  - يجب أن يحتوي مصفوفة `products` على معرفات المنتجات التي تنتمي إلى المستخدم التجاري المصادق عليه فقط
  - المنتجات يجب ألا تكون في أي بانر آخر

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "banner": {
      "id": "507f1f77bcf86cd799439024",
      "title": {
        "en": "My Business Special Offer",
        "ar": "عرض خاص لعملي"
      },
      "description": {
        "en": "Special discounts for our customers",
        "ar": "خصومات خاصة لعملائنا"
      },
      "imageUrl": "https://example.com/images/banners/business-offer.jpg",
      "percentage": 30,
      "isAllowed": true,
      "from": "2024-07-01T00:00:00.000Z",
      "to": "2024-07-31T23:59:59.999Z",
      "owner": {
        "id": "507f1f77bcf86cd799439020",
        "firstname": "Business",
        "lastname": "Owner",
        "email": "business@example.com",
        "role": "business",
        "companyName": "My Company"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": {
    "en": "Banner created successfully",
    "ar": "تم إنشاء البانر بنجاح"
  }
}
```

---

### 2. GET /api/v1/business/banners - Get All Banners with Products (Own Banners Only)
### الحصول على جميع البانرات مع المنتجات (بانرات المستخدم فقط)

**Request Query Parameters (Optional):**
```
?page=1&limit=10
```

**No Request Body Required**

**Note:** Returns all banners owned by the authenticated business user, regardless of date range or `isAllowed` status. This allows business users to see and manage all their banners, including past and future ones.
**ملاحظة:** يُرجع جميع البانرات المملوكة للمستخدم التجاري المصادق عليه، بغض النظر عن نطاق التاريخ أو حالة `isAllowed`. يسمح هذا للمستخدمين التجاريين برؤية وإدارة جميع بانراتهم، بما في ذلك الماضية والمستقبلية.

**Response (200 OK):** Same structure as dashboard GET all banners (with products included), but only returns banners owned by the authenticated business user.

---

### 3. GET /api/v1/business/banners/:id - Get Banner by ID
### الحصول على بانر بالمعرف

**No Request Body Required**

**URL Parameter:**
- `id`: Banner ID (must belong to the authenticated business user)

**Response (200 OK):** Same structure as dashboard GET banner by ID.

---

### 4. PUT /api/v1/business/banners/:id - Update Banner
### تحديث بانر

**URL Parameter:**
- `id`: Banner ID (must belong to the authenticated business user)

**Request Body (All fields are optional, only include fields you want to update):**
```json
{
  "title": {
    "en": "Updated Business Offer",
    "ar": "العرض التجاري المحدث"
  },
  "description": {
    "en": "Updated special discounts",
    "ar": "خصومات خاصة محدثة"
  },
  "imageUrl": "https://example.com/images/banners/updated-offer.jpg",
  "percentage": 35,
  "products": [
    "507f1f77bcf86cd799439021",
    "507f1f77bcf86cd799439022",
    "507f1f77bcf86cd799439023"
  ]
}
```

**Note:** Products must belong to the authenticated business user.
**ملاحظة:** يجب أن تنتمي المنتجات إلى المستخدم التجاري المصادق عليه.

**Response (200 OK):** Same structure as dashboard update banner.

---

### 5. DELETE /api/v1/business/banners/:id - Delete Banner
### حذف بانر

**No Request Body Required**

**URL Parameter:**
- `id`: Banner ID (must belong to the authenticated business user)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": null,
  "message": {
    "en": "Banner deleted successfully",
    "ar": "تم حذف البانر بنجاح"
  }
}
```

---

### 6. PUT /api/v1/business/banners/:id/toggle - Toggle Allow Banner
### تبديل حالة البانر (مسموح/غير مسموح)

**No Request Body Required**

**URL Parameter:**
- `id`: Banner ID (must belong to the authenticated business user)

**Important Notes:** Same rules as dashboard toggle endpoint - cannot allow banners with past `to` dates.
**ملاحظات مهمة:** نفس قواعد نقطة نهاية toggle في لوحة التحكم - لا يمكن تفعيل البانرات التي انتهى تاريخ `to` الخاص بها.

**Response (200 OK):** Same structure as dashboard toggle banner.

---

## User/Customer Endpoints (Public)
## نقاط النهاية للمستخدم/العميل (عامة)

### 1. GET /api/v1/user/banners - Get All Allowed Banners with Products
### الحصول على جميع البانرات المسموحة مع المنتجات

**Request Query Parameters (Optional):**
```
?page=1&limit=10
```

**No Request Body Required**

**Note:** This endpoint is public and returns only banners that are:
- `isAllowed: true` AND
- Currently within their date range (if dates are set):
  - Current date/time must be >= `from` date (if `from` is set)
  - Current date/time must be <= `to` date (if `to` is set)
- If no dates are set, banner is available as long as `isAllowed: true`

Products are included with discounted prices and currency conversion based on user's country.

**ملاحظة:** هذه النقطة عامة وتُرجع فقط البانرات التي:
- `isAllowed: true` و
- حالياً ضمن نطاق تاريخها (إذا تم تعيين التواريخ):
  - تاريخ/وقت الحالي يجب أن يكون >= تاريخ `from` (إذا تم تعيين `from`)
  - تاريخ/وقت الحالي يجب أن يكون <= تاريخ `to` (إذا تم تعيين `to`)
- إذا لم يتم تعيين تواريخ، البانر متاح طالما أن `isAllowed: true`

يتم تضمين المنتجات مع الأسعار المخفضة وتحويل العملة بناءً على دولة المستخدم.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "banners": [
      {
        "id": "507f1f77bcf86cd799439014",
        "title": {
          "en": "Summer Sale 2024",
          "ar": "تخفيضات الصيف 2024"
        },
        "description": {
          "en": "Get up to 50% off on selected items",
          "ar": "احصل على خصم يصل إلى 50% على العناصر المحددة"
        },
        "imageUrl": "https://example.com/images/banners/summer-sale.jpg",
        "percentage": 50,
        "isAllowed": true,
        "from": "2024-06-01T00:00:00.000Z",
        "to": "2024-08-31T23:59:59.999Z",
        "owner": {
          "id": "507f1f77bcf86cd799439001",
          "firstname": "Admin",
          "lastname": "User",
          "email": "admin@magnet.com",
          "role": "admin",
          "companyName": "Magnet"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "products": [
          {
            "id": "507f1f77bcf86cd799439011",
            "code": "PRD-001",
            "name": {
              "en": "Product Name",
              "ar": "اسم المنتج"
            },
            "pricePerUnit": "750.00",
            "originalPrice": "50.00",
            "discountPercentage": 50,
            "discountedPrice": "750.00",
            "images": ["https://example.com/product.jpg"],
            "description": {
              "en": "Product description",
              "ar": "وصف المنتج"
            }
          }
        ]
      },
      {
        "id": "507f1f77bcf86cd799439024",
        "title": {
          "en": "My Business Special Offer",
          "ar": "عرض خاص لعملي"
        },
        "description": {
          "en": "Special discounts for our customers",
          "ar": "خصومات خاصة لعملائنا"
        },
        "imageUrl": "https://example.com/images/banners/business-offer.jpg",
        "percentage": 30,
        "isAllowed": true,
        "from": "2024-07-01T00:00:00.000Z",
        "to": "2024-07-31T23:59:59.999Z",
        "owner": {
          "id": "507f1f77bcf86cd799439020",
          "firstname": "Business",
          "lastname": "Owner",
          "email": "business@example.com",
          "role": "business",
          "companyName": "My Company"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "products": [
          {
            "id": "507f1f77bcf86cd799439021",
            "code": "PRD-002",
            "name": {
              "en": "Another Product",
              "ar": "منتج آخر"
            },
            "pricePerUnit": "525.00",
            "originalPrice": "75.00",
            "discountPercentage": 30,
            "discountedPrice": "525.00",
            "images": ["https://example.com/product2.jpg"],
            "description": {
              "en": "Another product description",
              "ar": "وصف منتج آخر"
            }
          }
        ]
      }
    ],
    "currency": "EGP",
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalBanners": 25,
      "limit": 10
    }
  }
}
```

---

### 2. GET /api/v1/user/banners/:id - Get Banner by ID with Discounted Products
### الحصول على بانر بالمعرف مع المنتجات المخفضة

**No Request Body Required**

**URL Parameter:**
- `id`: Banner ID (must be an allowed banner)

**Note:** This endpoint automatically calculates discounted prices and converts currency based on user's country. Only returns banners that are currently allowed (within date range if dates are set).
**ملاحظة:** تقوم هذه النقطة بحساب الأسعار المخفضة وتحويل العملة تلقائياً بناءً على دولة المستخدم. تُرجع فقط البانرات المسموحة حالياً (ضمن نطاق التاريخ إذا تم تعيين التواريخ).

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "banner": {
      "id": "507f1f77bcf86cd799439014",
      "title": {
        "en": "Summer Sale 2024",
        "ar": "تخفيضات الصيف 2024"
      },
      "description": {
        "en": "Get up to 50% off on selected items",
        "ar": "احصل على خصم يصل إلى 50% على العناصر المحددة"
      },
      "imageUrl": "https://example.com/images/banners/summer-sale.jpg",
      "percentage": 50,
      "isAllowed": true,
      "from": "2024-06-01T00:00:00.000Z",
      "to": "2024-08-31T23:59:59.999Z",
      "owner": {
        "id": "507f1f77bcf86cd799439001",
        "firstname": "Admin",
        "lastname": "User",
        "email": "admin@magnet.com",
        "role": "admin",
        "companyName": "Magnet"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "products": [
      {
        "id": "507f1f77bcf86cd799439011",
        "code": "PRD-001",
        "name": {
          "en": "Product Name",
          "ar": "اسم المنتج"
        },
        "pricePerUnit": "25.00",
        "originalPrice": "50.00",
        "discountPercentage": 50,
        "discountedPrice": "25.00",
        "images": ["https://example.com/product.jpg"],
        "description": {
          "en": "Product description",
          "ar": "وصف المنتج"
        },
        "category": {
          "en": "Electronics",
          "ar": "إلكترونيات"
        },
        "unit": {
          "en": "piece",
          "ar": "قطعة"
        },
        "minOrder": 1,
        "stock": 100,
        "rating": 4.5,
        "reviewCount": 25,
        "owner": {
          "id": "507f1f77bcf86cd799439020",
          "firstname": "Business",
          "lastname": "Owner",
          "email": "business@example.com",
          "role": "business",
          "companyName": "My Company"
        }
      }
    ],
    "currency": "EGP"
  }
}
```

---

## Error Responses
## استجابات الأخطاء

### 400 Bad Request - Validation Error
```json
{
  "status": "error",
  "message": {
    "en": "Banner title is required in both languages (EN and AR)",
    "ar": "عنوان البانر مطلوب باللغتين (الإنجليزية والعربية)"
  }
}
```

### 400 Bad Request - Product Already in Banner
```json
{
  "status": "error",
  "message": {
    "en": "One or more products are already in another banner",
    "ar": "واحد أو أكثر من المنتجات موجود بالفعل في بانر آخر"
  },
  "data": {
    "conflicts": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "bannerId": "507f1f77bcf86cd799439020",
        "bannerTitle": {
          "en": "Existing Banner",
          "ar": "بانر موجود"
        }
      }
    ]
  }
}
```

### 400 Bad Request - Invalid Date Range
```json
{
  "status": "error",
  "message": {
    "en": "Invalid date range. The \"from\" date must be before or equal to the \"to\" date",
    "ar": "نطاق تاريخ غير صالح. يجب أن يكون تاريخ \"من\" قبل أو يساوي تاريخ \"إلى\""
  }
}
```

### 400 Bad Request - Cannot Allow Past-Dated Banner
```json
{
  "status": "error",
  "message": {
    "en": "Cannot allow banner. The end date has already passed. Please update the date to a future or present date",
    "ar": "لا يمكن السماح بالبانر. تاريخ الانتهاء قد انتهى بالفعل. يرجى تحديث التاريخ إلى تاريخ مستقبلي أو حاضر"
  }
}
```

### 403 Forbidden - Permission Error
```json
{
  "status": "error",
  "message": {
    "en": "Insufficient permissions",
    "ar": "صلاحيات غير كافية"
  }
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": {
    "en": "Banner not found",
    "ar": "البانر غير موجود"
  }
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": {
    "en": "Failed to create banner",
    "ar": "فشل في إنشاء البانر"
  }
}
```

---

## Field Descriptions
## وصف الحقول

### Banner Fields
### حقول البانر

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | Object (Bilingual) | Yes | Banner title in English and Arabic |
| `title.en` | String | Yes | English title |
| `title.ar` | String | Yes | Arabic title |
| `description` | Object (Bilingual) | Yes | Banner description in English and Arabic |
| `description.en` | String | Yes | English description |
| `description.ar` | String | Yes | Arabic description |
| `imageUrl` | String | Yes | URL of the banner image |
| `percentage` | Number | Yes | Discount percentage (0-100) |
| `products` | Array of ObjectIds | No | Array of product IDs to apply the discount to. **Note:** A product can only exist in one banner at a time |
| `isAllowed` | Boolean | No | Whether the banner is active/visible (default: true). **Note:** Even if `isAllowed` is true, banner must be within date range to be visible to users |
| `from` | Date (ISO 8601) | No | Start date/time when banner becomes active. If not set, banner is available immediately (if `isAllowed` is true) |
| `to` | Date (ISO 8601) | No | End date/time when banner expires. If not set, banner remains available indefinitely (if `isAllowed` is true) |
| `owner` | ObjectId | No | User ID who created the banner (null for admin/employee banners, shows as "Magnet") |

### Product Fields (when in a banner)
### حقول المنتج (عند وجوده في بانر)

When a product is included in a banner, additional fields are returned in product responses:

| Field | Type | Description |
|-------|------|-------------|
| `isInBanner` | Boolean | Indicates if the product exists in any banner (true/false) |
| `originalPrice` | String | Original price before discount (in base currency or user's currency) |
| `discountPercentage` | Number | Discount percentage from the banner (0-100) |
| `discountedPrice` | String | Final price after discount (in user's currency) |
| `pricePerUnit` | String | Final discounted price (same as discountedPrice, in user's currency) |
| `bannerId` | ObjectId | ID of the banner this product belongs to (optional, in some responses) |
| `bannerTitle` | Object (Bilingual) | Title of the banner this product belongs to (optional, in some responses) |

---

## Authentication
## المصادقة

- **Dashboard endpoints**: Require authentication token with `admin` or `magnet_employee` role
- **Business endpoints**: Require authentication token with `business` role
- **User endpoints**: Public (optional authentication for currency detection)

---

## Important Rules and Constraints
## القواعد والقيود المهمة

### Product-Banner Relationship
### العلاقة بين المنتج والبانر

1. **One Product Per Banner Rule**: A product can only exist in ONE banner at a time
   - When trying to add a product that's already in another banner, you'll receive an error
   - **قاعدة منتج واحد لكل بانر**: المنتج يمكن أن يكون في بانر واحد فقط في نفس الوقت
   - عند محاولة إضافة منتج موجود بالفعل في بانر آخر، ستحصل على خطأ

2. **Product `isInBanner` Field**: Each product has an `isInBanner` field that tracks if it's in a banner
   - **Automatically set to `true`** when product is added to a banner
   - **Automatically set to `false`** when:
     - Product is removed from a banner
     - Banner containing the product is deleted
   - **Default value**: `false` for new products
   - **حقل `isInBanner` في المنتج**: كل منتج له حقل `isInBanner` يتتبع وجوده في بانر
     - **يتم تعيينه تلقائياً إلى `true`** عند إضافة المنتج إلى بانر
     - **يتم تعيينه تلقائياً إلى `false`** عند:
       - إزالة المنتج من البانر
       - حذف البانر الذي يحتوي على المنتج
     - **القيمة الافتراضية**: `false` للمنتجات الجديدة

### Discount Information in Products
### معلومات الخصم في المنتجات

3. **Products in banners automatically return discount information** in all product endpoints:
   - `originalPrice`: Original price before discount
   - `discountPercentage`: Discount percentage from banner
   - `discountedPrice`: Final price after applying discount
   - `pricePerUnit`: Updated to show discounted price
   - **المنتجات في البانرات تُرجع معلومات الخصم تلقائياً** في جميع endpoints المنتجات:
     - `originalPrice`: السعر الأصلي قبل الخصم
     - `discountPercentage`: نسبة الخصم من البانر
     - `discountedPrice`: السعر النهائي بعد تطبيق الخصم
     - `pricePerUnit`: محدث لإظهار السعر المخفض

### Other Notes
## ملاحظات أخرى

4. All text fields support bilingual content (English and Arabic)
   - جميع حقول النصوص تدعم المحتوى ثنائي اللغة (الإنجليزية والعربية)

5. Product IDs in the `products` array must be valid MongoDB ObjectIds
   - معرفات المنتجات في مصفوفة `products` يجب أن تكون ObjectIds صالحة

6. For business users, products must belong to the authenticated business
   - للمستخدمين التجاريين، المنتجات يجب أن تنتمي إلى العمل المصادق عليه

7. Currency conversion is automatic based on user's country for user endpoints
   - تحويل العملة تلقائي بناءً على دولة المستخدم لـ endpoints المستخدم

8. Discount calculation: `discountedPrice = originalPrice * (1 - percentage / 100)`
   - حساب الخصم: `السعر_المخفض = السعر_الأصلي * (1 - النسبة / 100)`

9. Admin/Magnet Employee created banners show "Magnet" as the owner company name
   - البانرات التي ينشئها Admin/Magnet Employee تظهر "Magnet" كاسم الشركة المالكة

### Banner Date Range and Availability
### نطاق تاريخ البانر والتوفر

10. **Banner Availability Rules:**
    - A banner is visible to users only if:
      - `isAllowed: true` AND
      - Current date/time >= `from` date (if `from` is set) AND
      - Current date/time <= `to` date (if `to` is set)
    - If no dates are set, banner availability depends only on `isAllowed`
    - **Dashboard/Business endpoints:** Can access all banners (no date filtering)
    - **User endpoints:** Only return banners that are currently available (within date range)
    - **قواعد توفر البانر:**
      - البانر مرئي للمستخدمين فقط إذا:
        - `isAllowed: true` و
        - تاريخ/وقت الحالي >= تاريخ `from` (إذا تم تعيين `from`) و
        - تاريخ/وقت الحالي <= تاريخ `to` (إذا تم تعيين `to`)
      - إذا لم يتم تعيين تواريخ، يعتمد توفر البانر فقط على `isAllowed`
      - **نقاط نهاية Dashboard/Business:** يمكن الوصول إلى جميع البانرات (بدون تصفية حسب التاريخ)
      - **نقاط نهاية User:** تُرجع فقط البانرات المتاحة حالياً (ضمن نطاق التاريخ)

11. **Toggle Banner Restrictions:**
    - You can always **disallow** a banner (set `isAllowed` to `false`)
    - You can only **allow** a banner if the `to` date hasn't passed (or if no `to` date is set)
    - If trying to allow a banner with a past `to` date, you must first update the `to` date to a future or present date
    - **قيود تبديل البانر:**
      - يمكنك دائماً **تعطيل** البانر (تعيين `isAllowed` إلى `false`)
      - يمكنك فقط **تفعيل** البانر إذا لم ينته تاريخ `to` (أو إذا لم يتم تعيين تاريخ `to`)
      - إذا حاولت تفعيل بانر بتاريخ `to` ماضي، يجب أولاً تحديث تاريخ `to` إلى تاريخ مستقبلي أو حاضر

---

## Product Endpoints Integration
## تكامل endpoints المنتجات

When products are returned from product endpoints (dashboard, business, or user), if a product exists in a banner, the following discount information is automatically included:

عند إرجاع المنتجات من endpoints المنتجات (dashboard, business, أو user)، إذا كان المنتج موجود في بانر، يتم تضمين معلومات الخصم التالية تلقائياً:

### Example Product Response (with Banner Discount)
### مثال على استجابة المنتج (مع خصم البانر)

```json
{
  "status": "success",
  "data": {
    "product": {
      "id": "507f1f77bcf86cd799439011",
      "code": "PRD-001",
      "name": {
        "en": "Product Name",
        "ar": "اسم المنتج"
      },
      "pricePerUnit": "25.00",
      "originalPrice": "50.00",
      "discountPercentage": 50,
      "discountedPrice": "25.00",
      "isInBanner": true,
      "images": ["https://example.com/product.jpg"],
      "description": {
        "en": "Product description",
        "ar": "وصف المنتج"
      }
    },
    "currency": "USD"
  }
}
```

### Example Product Response (without Banner)
### مثال على استجابة المنتج (بدون بانر)

```json
{
  "status": "success",
  "data": {
    "product": {
      "id": "507f1f77bcf86cd799439011",
      "code": "PRD-001",
      "name": {
        "en": "Product Name",
        "ar": "اسم المنتج"
      },
      "pricePerUnit": "50.00",
      "isInBanner": false,
      "images": ["https://example.com/product.jpg"],
      "description": {
        "en": "Product description",
        "ar": "وصف المنتج"
      }
    },
    "currency": "USD"
  }
}
```

**Note:** The `isInBanner` field is always returned in product responses to indicate if the product is part of any banner.
**ملاحظة:** حقل `isInBanner` يُرجع دائماً في استجابات المنتجات للإشارة إلى ما إذا كان المنتج جزءاً من أي بانر.

---

**Last Updated:** 2024-12-19
**آخر تحديث:** 2024-12-19

**Changelog:**
- Added `from` and `to` date fields for banner availability control
- Updated user endpoints to filter banners by date range
- Added validation to prevent allowing banners with past end dates
- Dashboard and Business endpoints can access all banners regardless of date range
- User endpoints only return banners currently within their date range

**سجل التغييرات:**
- إضافة حقول `from` و`to` للتحكم في توفر البانر
- تحديث نقاط نهاية المستخدم لتصفية البانرات حسب نطاق التاريخ
- إضافة التحقق لمنع تفعيل البانرات التي انتهى تاريخ انتهائها
- نقاط نهاية Dashboard و Business يمكنها الوصول إلى جميع البانرات بغض النظر عن نطاق التاريخ
- نقاط نهاية User تُرجع فقط البانرات الموجودة حالياً ضمن نطاق تاريخها
