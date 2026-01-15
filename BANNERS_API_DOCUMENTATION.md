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
  ]
}
```

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
  ]
}
```

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
  ]
}
```

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

**Note:** This endpoint is public and returns only banners where `isAllowed: true`. Products are included with discounted prices and currency conversion based on user's country.
**ملاحظة:** هذه النقطة عامة وتُرجع فقط البانرات التي لديها `isAllowed: true`. يتم تضمين المنتجات مع الأسعار المخفضة وتحويل العملة بناءً على دولة المستخدم.

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

**Note:** This endpoint automatically calculates discounted prices and converts currency based on user's country.
**ملاحظة:** تقوم هذه النقطة بحساب الأسعار المخفضة وتحويل العملة تلقائياً بناءً على دولة المستخدم.

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
| `isAllowed` | Boolean | No | Whether the banner is active/visible (default: true) |
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

**Last Updated:** 2024-01-15
**آخر تحديث:** 2024-01-15
