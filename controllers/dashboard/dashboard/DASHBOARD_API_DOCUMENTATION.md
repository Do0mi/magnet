# Dashboard API Documentation / توثيق واجهة برمجة تطبيقات لوحة التحكم

## Overview / نظرة عامة

This document provides comprehensive documentation for the Dashboard API endpoints. These endpoints provide statistical overviews and detailed analytics for all data in the project.

هذا المستند يوفر توثيقًا شاملًا لنقاط نهاية واجهة برمجة تطبيقات لوحة التحكم. توفر هذه النقاط الطرفية نظرة عامة إحصائية وتحليلات مفصلة لجميع البيانات في المشروع.

---

## Table of Contents / جدول المحتويات

1. [Authentication](#authentication--المصادقة)
2. [Endpoints](#endpoints--النقاط-الطرفية)
   - [Get Dashboard Overview](#1-get-dashboard-overview)
   - [Get Analytics](#2-get-analytics)
3. [Response Format](#response-format--تنسيق-الاستجابة)
4. [Error Handling](#error-handling--معالجة-الأخطاء)
5. [Field Explanations](#field-explanations--شرح-الحقول)

---

## Authentication / المصادقة

All dashboard endpoints require:
- **JWT Token** in the Authorization header: `Authorization: Bearer <token>`
- **Role**: `admin` or `magnet_employee`

جميع نقاط نهاية لوحة التحكم تتطلب:
- **رمز JWT** في رأس Authorization: `Authorization: Bearer <token>`
- **الدور**: `admin` أو `magnet_employee`

---

## Endpoints / النقاط الطرفية

### 1. Get Dashboard Overview / الحصول على نظرة عامة على لوحة التحكم

**Endpoint:** `GET /api/v1/dashboard/dashboard`

**Description / الوصف:**
Returns a comprehensive overview of all project statistics including users, products, orders, revenue, reviews, categories, wishlists, addresses, special orders, and applicants.

يعيد نظرة عامة شاملة على جميع إحصائيات المشروع بما في ذلك المستخدمين والمنتجات والطلبات والإيرادات والمراجعات والفئات وقوائم الأمنيات والعناوين والطلبات الخاصة والمتقدمين.

**Authentication / المصادقة:** Required (JWT Token + Admin/Employee role)

**Query Parameters / معاملات الاستعلام:** None

**Request Example / مثال على الطلب:**
```http
GET /api/v1/dashboard/dashboard HTTP/1.1
Host: your-api-domain.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Structure / هيكل الاستجابة:**

```json
{
  "status": "success",
  "data": {
    "overview": {
      "users": {
        "total": 1500,
        "customers": 1200,
        "businesses": 250,
        "admins": 5,
        "employees": 45,
        "allowed": 1400,
        "disallowed": 100,
        "pendingBusinesses": 30,
        "approvedBusinesses": 220,
        "recent": 150,
        "today": 10
      },
      "products": {
        "total": 5000,
        "approved": 4500,
        "pending": 300,
        "declined": 200,
        "allowed": 4800,
        "disallowed": 200,
        "averagePrice": 125.50,
        "minPrice": 5.00,
        "maxPrice": 5000.00,
        "totalStock": 50000,
        "recent": 200,
        "today": 15
      },
      "orders": {
        "total": 3000,
        "pending": 50,
        "confirmed": 100,
        "processing": 80,
        "shipped": 200,
        "delivered": 2300,
        "cancelled": 200,
        "refunded": 70,
        "recent": 300,
        "today": 25
      },
      "revenue": {
        "total": 450000.00,
        "today": 5000.00,
        "week": 35000.00,
        "month": 150000.00,
        "averageOrderValue": 195.65
      },
      "reviews": {
        "total": 2000,
        "approved": 1800,
        "pending": 150,
        "rejected": 50,
        "averageRating": 4.25,
        "reviewsByRating": [
          { "_id": 1, "count": 50 },
          { "_id": 2, "count": 100 },
          { "_id": 3, "count": 200 },
          { "_id": 4, "count": 600 },
          { "_id": 5, "count": 1050 }
        ],
        "recent": 200,
        "today": 15
      },
      "categories": {
        "total": 50,
        "active": 45,
        "inactive": 5
      },
      "wishlists": {
        "total": 800,
        "withProducts": 750,
        "empty": 50
      },
      "addresses": {
        "total": 2000,
        "default": 1500
      },
      "specialOrders": {
        "total": 100,
        "pending": 20,
        "reviewed": 15,
        "contacted": 10,
        "completed": 40,
        "cancelled": 15,
        "recent": 30
      },
      "applicants": {
        "total": 200,
        "pending": 50,
        "accepted": 100,
        "rejected": 50,
        "withCV": 150,
        "recent": 40
      }
    },
    "recentActivity": {
      "users": 50,
      "products": 30,
      "orders": 100,
      "reviews": 40,
      "specialOrders": 10,
      "applicants": 15
    },
    "todayActivity": {
      "users": 10,
      "products": 15,
      "orders": 25,
      "reviews": 15,
      "revenue": 5000.00
    },
    "currency": "USD",
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Field Explanations / شرح الحقول:**

#### Users Statistics / إحصائيات المستخدمين
- `total`: Total number of users / إجمالي عدد المستخدمين
- `customers`: Number of customer role users / عدد مستخدمي دور العميل
- `businesses`: Number of business role users / عدد مستخدمي دور الأعمال
- `admins`: Number of admin role users / عدد مستخدمي دور المسؤول
- `employees`: Number of employee role users / عدد مستخدمي دور الموظف
- `allowed`: Number of allowed users / عدد المستخدمين المسموح لهم
- `disallowed`: Number of disallowed users / عدد المستخدمين غير المسموح لهم
- `pendingBusinesses`: Businesses awaiting approval / الأعمال في انتظار الموافقة
- `approvedBusinesses`: Approved businesses / الأعمال المعتمدة
- `recent`: Users created in last 30 days / المستخدمون المنشأون في آخر 30 يومًا
- `today`: Users created today / المستخدمون المنشأون اليوم

#### Products Statistics / إحصائيات المنتجات
- `total`: Total number of products / إجمالي عدد المنتجات
- `approved`: Approved products / المنتجات المعتمدة
- `pending`: Products pending approval / المنتجات في انتظار الموافقة
- `declined`: Declined products / المنتجات المرفوضة
- `allowed`: Allowed products / المنتجات المسموح بها
- `disallowed`: Disallowed products / المنتجات غير المسموح بها
- `averagePrice`: Average price per unit / متوسط السعر لكل وحدة
- `minPrice`: Minimum product price / الحد الأدنى لسعر المنتج
- `maxPrice`: Maximum product price / الحد الأقصى لسعر المنتج
- `totalStock`: Total stock quantity / إجمالي كمية المخزون
- `recent`: Products created in last 30 days / المنتجات المنشأة في آخر 30 يومًا
- `today`: Products created today / المنتجات المنشأة اليوم

#### Orders Statistics / إحصائيات الطلبات
- `total`: Total number of orders / إجمالي عدد الطلبات
- `pending`: Pending orders / الطلبات المعلقة
- `confirmed`: Confirmed orders / الطلبات المؤكدة
- `processing`: Processing orders / الطلبات قيد المعالجة
- `shipped`: Shipped orders / الطلبات المشحونة
- `delivered`: Delivered orders / الطلبات المسلمة
- `cancelled`: Cancelled orders / الطلبات الملغاة
- `refunded`: Refunded orders / الطلبات المسترجعة
- `recent`: Orders created in last 30 days / الطلبات المنشأة في آخر 30 يومًا
- `today`: Orders created today / الطلبات المنشأة اليوم

#### Revenue Statistics / إحصائيات الإيرادات
- `total`: Total revenue from delivered/shipped orders / إجمالي الإيرادات من الطلبات المسلمة/المشحونة
- `today`: Revenue from today's delivered/shipped orders / الإيرادات من طلبات اليوم المسلمة/المشحونة
- `week`: Revenue from last 7 days / الإيرادات من آخر 7 أيام
- `month`: Revenue from last 30 days / الإيرادات من آخر 30 يومًا
- `averageOrderValue`: Average value per order / متوسط القيمة لكل طلب

#### Reviews Statistics / إحصائيات المراجعات
- `total`: Total number of reviews / إجمالي عدد المراجعات
- `approved`: Approved reviews / المراجعات المعتمدة
- `pending`: Pending reviews / المراجعات المعلقة
- `rejected`: Rejected reviews / المراجعات المرفوضة
- `averageRating`: Average rating across all reviews / متوسط التقييم عبر جميع المراجعات
- `reviewsByRating`: Array of rating distribution / مصفوفة توزيع التقييمات
- `recent`: Reviews created in last 30 days / المراجعات المنشأة في آخر 30 يومًا
- `today`: Reviews created today / المراجعات المنشأة اليوم

#### Categories Statistics / إحصائيات الفئات
- `total`: Total number of categories / إجمالي عدد الفئات
- `active`: Active categories / الفئات النشطة
- `inactive`: Inactive categories / الفئات غير النشطة

#### Wishlists Statistics / إحصائيات قوائم الأمنيات
- `total`: Total number of wishlists / إجمالي عدد قوائم الأمنيات
- `withProducts`: Wishlists containing products / قوائم الأمنيات التي تحتوي على منتجات
- `empty`: Empty wishlists / قوائم الأمنيات الفارغة

#### Addresses Statistics / إحصائيات العناوين
- `total`: Total number of addresses / إجمالي عدد العناوين
- `default`: Number of default addresses / عدد العناوين الافتراضية

#### Special Orders Statistics / إحصائيات الطلبات الخاصة
- `total`: Total number of special orders / إجمالي عدد الطلبات الخاصة
- `pending`: Pending special orders / الطلبات الخاصة المعلقة
- `reviewed`: Reviewed special orders / الطلبات الخاصة المراجعة
- `contacted`: Contacted special orders / الطلبات الخاصة المتصل بها
- `completed`: Completed special orders / الطلبات الخاصة المكتملة
- `cancelled`: Cancelled special orders / الطلبات الخاصة الملغاة
- `recent`: Special orders created in last 30 days / الطلبات الخاصة المنشأة في آخر 30 يومًا

#### Applicants Statistics / إحصائيات المتقدمين
- `total`: Total number of applicants / إجمالي عدد المتقدمين
- `pending`: Pending applicants / المتقدمون المعلقون
- `accepted`: Accepted applicants / المتقدمون المقبولون
- `rejected`: Rejected applicants / المتقدمون المرفوضون
- `withCV`: Applicants with CV / المتقدمون الذين لديهم سيرة ذاتية
- `recent`: Applicants created in last 30 days / المتقدمون المنشأون في آخر 30 يومًا

#### Activity Statistics / إحصائيات النشاط
- `recentActivity`: Counts for last 7 days / الأعداد لآخر 7 أيام
- `todayActivity`: Counts for today / الأعداد لليوم

**Business Logic / المنطق التجاري:**
- Calculates statistics from all models in the database / يحسب الإحصائيات من جميع النماذج في قاعدة البيانات
- Revenue only includes orders with status `delivered` or `shipped` / الإيرادات تشمل فقط الطلبات بحالة `delivered` أو `shipped`
- Recent activity refers to last 30 days / النشاط الأخير يشير إلى آخر 30 يومًا
- Today activity refers to records created today / نشاط اليوم يشير إلى السجلات المنشأة اليوم
- All prices and revenue are in USD / جميع الأسعار والإيرادات بالدولار الأمريكي
- All numeric values are converted to JavaScript numbers using `Number()` to handle MongoDB Decimal128 types / جميع القيم الرقمية يتم تحويلها إلى أرقام JavaScript باستخدام `Number()` للتعامل مع أنواع Decimal128 من MongoDB
- Null values are handled gracefully with default value of 0 / القيم null يتم التعامل معها بشكل صحيح مع القيمة الافتراضية 0
- Price calculations use MongoDB aggregation with `$avg`, `$min`, `$max` operators / حسابات الأسعار تستخدم تجميع MongoDB مع عوامل `$avg`، `$min`، `$max`
- Stock calculations use MongoDB aggregation with `$sum` operator / حسابات المخزون تستخدم تجميع MongoDB مع عامل `$sum`
- Approved products filter includes both `status: 'approved'` and `isAllowed: true` / فلتر المنتجات المعتمدة يشمل كل من `status: 'approved'` و `isAllowed: true`

**Error Responses / استجابات الأخطاء:**

```json
{
  "status": "error",
  "message": {
    "en": "Failed to get dashboard",
    "ar": "فشل في الحصول على لوحة التحكم"
  }
}
```

Status Code: `500 Internal Server Error`

---

### 2. Get Analytics / الحصول على التحليلات

**Endpoint:** `GET /api/v1/dashboard/analytics`

**Description / الوصف:**
Returns detailed time-series analytics and distribution data for users, products, orders, reviews, special orders, and applicants over a specified time period.

يعيد تحليلات السلاسل الزمنية التفصيلية وبيانات التوزيع للمستخدمين والمنتجات والطلبات والمراجعات والطلبات الخاصة والمتقدمين على مدى فترة زمنية محددة.

**Authentication / المصادقة:** Required (JWT Token + Admin/Employee role)

**Query Parameters / معاملات الاستعلام:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | number | No | `30` | Time period in days. Valid values: `7`, `30`, `90`, `365` |

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|---------|------|--------|----------|----------|
| `period` | رقم | لا | `30` | الفترة الزمنية بالأيام. القيم الصالحة: `7`، `30`، `90`، `365` |

**Request Example / مثال على الطلب:**
```http
GET /api/v1/dashboard/analytics?period=30 HTTP/1.1
Host: your-api-domain.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Structure / هيكل الاستجابة:**

```json
{
  "status": "success",
  "data": {
    "period": 30,
    "periodStart": "2023-12-16T00:00:00.000Z",
    "periodEnd": "2024-01-15T00:00:00.000Z",
    "users": {
      "growth": [
        {
          "_id": {
            "year": 2024,
            "month": 1,
            "day": 1
          },
          "count": 10
        },
        {
          "_id": {
            "year": 2024,
            "month": 1,
            "day": 2
          },
          "count": 15
        }
      ],
      "byRole": [
        { "_id": "customer", "count": 1200 },
        { "_id": "business", "count": 250 },
        { "_id": "admin", "count": 5 },
        { "_id": "magnet_employee", "count": 45 }
      ],
      "businessStatusDistribution": [
        { "_id": "pending", "count": 30 },
        { "_id": "approved", "count": 220 }
      ]
    },
    "products": {
      "growth": [
        {
          "_id": {
            "year": 2024,
            "month": 1,
            "day": 1
          },
          "count": 5
        }
      ],
      "byStatus": [
        { "_id": "approved", "count": 4500 },
        { "_id": "pending", "count": 300 },
        { "_id": "declined", "count": 200 }
      ],
      "byCategory": [
        { "categoryName": "Electronics", "count": 500 },
        { "categoryName": "Clothing", "count": 400 }
      ],
      "priceDistribution": [
        {
          "_id": 0,
          "count": 1000,
          "avgPrice": 25.50
        },
        {
          "_id": 50,
          "count": 2000,
          "avgPrice": 75.00
        }
      ]
    },
    "orders": {
      "growth": [
        {
          "_id": {
            "year": 2024,
            "month": 1,
            "day": 1
          },
          "count": 20,
          "revenue": 4000.00
        }
      ],
      "byStatus": [
        {
          "_id": "delivered",
          "count": 2300,
          "totalRevenue": 450000.00
        },
        {
          "_id": "pending",
          "count": 50,
          "totalRevenue": 0
        }
      ],
      "revenueOverTime": [
        {
          "_id": {
            "year": 2024,
            "month": 1,
            "day": 1
          },
          "revenue": 5000.00,
          "orderCount": 25
        }
      ],
      "avgOrderValueByStatus": [
        {
          "status": "delivered",
          "avgValue": 195.65,
          "count": 2300
        }
      ],
      "topCustomers": [
        {
          "customerId": "507f1f77bcf86cd799439011",
          "customerName": "John Doe",
          "customerEmail": "john@example.com",
          "orderCount": 50,
          "totalSpent": 10000.00
        }
      ]
    },
    "reviews": {
      "growth": [
        {
          "_id": {
            "year": 2024,
            "month": 1,
            "day": 1
          },
          "count": 10,
          "avgRating": 4.5
        }
      ],
      "byStatus": [
        { "_id": "approved", "count": 1800 },
        { "_id": "pending", "count": 150 },
        { "_id": "reject", "count": 50 }
      ],
      "ratingOverTime": [
        {
          "date": "2024-01-01",
          "avgRating": 4.25,
          "count": 20
        }
      ]
    },
    "specialOrders": {
      "growth": [
        {
          "_id": {
            "year": 2024,
            "month": 1,
            "day": 1
          },
          "count": 2
        }
      ],
      "byStatus": [
        { "_id": "pending", "count": 20 },
        { "_id": "reviewed", "count": 15 },
        { "_id": "contacted", "count": 10 },
        { "_id": "completed", "count": 40 },
        { "_id": "cancelled", "count": 15 }
      ]
    },
    "applicants": {
      "growth": [
        {
          "_id": {
            "year": 2024,
            "month": 1,
            "day": 1
          },
          "count": 3
        }
      ],
      "byStatus": [
        { "_id": "pending", "count": 50 },
        { "_id": "accepted", "count": 100 },
        { "_id": "rejected", "count": 50 }
      ],
      "byGender": [
        { "_id": "male", "count": 120 },
        { "_id": "female", "count": 80 }
      ]
    },
    "metrics": {
      "orderConversionRate": 76.67,
      "productApprovalRate": 90.00,
      "businessApprovalRate": 88.00,
      "reviewApprovalRate": 90.00
    },
    "currency": "USD",
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Field Explanations / شرح الحقول:**

#### Period Information / معلومات الفترة
- `period`: Selected period in days / الفترة المحددة بالأيام
- `periodStart`: Start date of the period / تاريخ بداية الفترة
- `periodEnd`: End date of the period (today) / تاريخ نهاية الفترة (اليوم)

#### Users Analytics / تحليلات المستخدمين
- `growth`: Daily user growth over the period / نمو المستخدمين اليومي خلال الفترة
  - `_id`: Date object with year, month, day / كائن التاريخ مع السنة والشهر واليوم
  - `count`: Number of users created on that day / عدد المستخدمين المنشأين في ذلك اليوم
- `byRole`: Distribution of users by role / توزيع المستخدمين حسب الدور
- `businessStatusDistribution`: Distribution of business approval statuses / توزيع حالات موافقة الأعمال

#### Products Analytics / تحليلات المنتجات
- `growth`: Daily product growth over the period / نمو المنتجات اليومي خلال الفترة
- `byStatus`: Distribution of products by status / توزيع المنتجات حسب الحالة
- `byCategory`: Top 10 categories by product count / أفضل 10 فئات حسب عدد المنتجات
  - `categoryName`: Name of the category / اسم الفئة
  - `count`: Number of products in category / عدد المنتجات في الفئة
- `priceDistribution`: Products grouped by price ranges / المنتجات مجمعة حسب نطاقات الأسعار
  - Price buckets: 0-50, 50-100, 100-200, 200-500, 500-1000, 1000-5000, 5000+ / نطاقات الأسعار: 0-50، 50-100، 100-200، 200-500، 500-1000، 1000-5000، 5000+

#### Orders Analytics / تحليلات الطلبات
- `growth`: Daily order growth with revenue / نمو الطلبات اليومي مع الإيرادات
  - `count`: Number of orders / عدد الطلبات
  - `revenue`: Total revenue for that day / إجمالي الإيرادات لذلك اليوم
- `byStatus`: Distribution of orders by status with revenue / توزيع الطلبات حسب الحالة مع الإيرادات
- `revenueOverTime`: Daily revenue from delivered/shipped orders / الإيرادات اليومية من الطلبات المسلمة/المشحونة
  - `revenue`: Revenue for that day / الإيرادات لذلك اليوم
  - `orderCount`: Number of orders / عدد الطلبات
- `avgOrderValueByStatus`: Average order value grouped by status / متوسط قيمة الطلب مجمعة حسب الحالة
- `topCustomers`: Top 10 customers by order count / أفضل 10 عملاء حسب عدد الطلبات
  - `customerId`: Customer user ID / معرف مستخدم العميل
  - `customerName`: Full name of customer / الاسم الكامل للعميل
  - `customerEmail`: Email of customer / بريد العميل الإلكتروني
  - `orderCount`: Total number of orders / إجمالي عدد الطلبات
  - `totalSpent`: Total amount spent / إجمالي المبلغ المنفق

#### Reviews Analytics / تحليلات المراجعات
- `growth`: Daily review growth with average rating / نمو المراجعات اليومي مع متوسط التقييم
  - `count`: Number of reviews / عدد المراجعات
  - `avgRating`: Average rating for that day / متوسط التقييم لذلك اليوم
- `byStatus`: Distribution of reviews by status / توزيع المراجعات حسب الحالة
- `ratingOverTime`: Daily average rating over time / متوسط التقييم اليومي بمرور الوقت
  - `date`: Date in YYYY-MM-DD format / التاريخ بتنسيق YYYY-MM-DD
  - `avgRating`: Average rating / متوسط التقييم
  - `count`: Number of reviews / عدد المراجعات

#### Special Orders Analytics / تحليلات الطلبات الخاصة
- `growth`: Daily special order growth / نمو الطلبات الخاصة اليومي
- `byStatus`: Distribution of special orders by status / توزيع الطلبات الخاصة حسب الحالة

#### Applicants Analytics / تحليلات المتقدمين
- `growth`: Daily applicant growth / نمو المتقدمين اليومي
- `byStatus`: Distribution of applicants by status / توزيع المتقدمين حسب الحالة
- `byGender`: Distribution of applicants by gender / توزيع المتقدمين حسب الجنس

#### Performance Metrics / مقاييس الأداء
- `orderConversionRate`: Percentage of orders that were delivered (delivered orders / total order attempts) / نسبة الطلبات التي تم تسليمها (الطلبات المسلمة / إجمالي محاولات الطلب)
- `productApprovalRate`: Percentage of products that were approved / نسبة المنتجات التي تم اعتمادها
- `businessApprovalRate`: Percentage of businesses that were approved / نسبة الأعمال التي تم اعتمادها
- `reviewApprovalRate`: Percentage of reviews that were approved / نسبة المراجعات التي تم اعتمادها

**Business Logic / المنطق التجاري:**
- Time period defaults to 30 days if invalid value provided / الفترة الزمنية الافتراضية 30 يومًا إذا تم توفير قيمة غير صالحة
- Valid periods: 7, 30, 90, 365 days / الفترات الصالحة: 7، 30، 90، 365 يومًا
- Growth data is grouped by day using MongoDB date operators (`$year`, `$month`, `$dayOfMonth`) / بيانات النمو مجمعة حسب اليوم باستخدام عوامل تاريخ MongoDB (`$year`، `$month`، `$dayOfMonth`)
- Revenue calculations only include delivered/shipped orders / حسابات الإيرادات تشمل فقط الطلبات المسلمة/المشحونة
- Top customers limited to 10 / أفضل العملاء محدود بـ 10
- Top categories limited to 10 / أفضل الفئات محدود بـ 10
- Price distribution uses predefined buckets: [0, 50, 100, 200, 500, 1000, 5000, Infinity] / توزيع الأسعار يستخدم نطاقات محددة مسبقًا: [0، 50، 100، 200، 500، 1000، 5000، Infinity]
- All rates are calculated as percentages / جميع المعدلات محسوبة كنسب مئوية
- All numeric values are converted to JavaScript numbers using `Number()` before formatting / جميع القيم الرقمية يتم تحويلها إلى أرقام JavaScript باستخدام `Number()` قبل التنسيق
- Null values in aggregation results are handled with default value of 0 / القيم null في نتائج التجميع يتم التعامل معها مع القيمة الافتراضية 0
- Date formatting in `ratingOverTime` uses `padStart` to ensure 2-digit months and days / تنسيق التاريخ في `ratingOverTime` يستخدم `padStart` لضمان أشهر وأيام مكونة من رقمين
- Customer names are concatenated from `firstname` and `lastname` fields / أسماء العملاء يتم دمجها من حقول `firstname` و `lastname`
- Order conversion rate calculation: `(deliveredOrders / (totalOrders + cancelledOrders)) * 100` / حساب معدل تحويل الطلبات: `(الطلبات المسلمة / (إجمالي الطلبات + الطلبات الملغاة)) * 100`

**Error Responses / استجابات الأخطاء:**

```json
{
  "status": "error",
  "message": {
    "en": "Failed to get analytics",
    "ar": "فشل في الحصول على التحليلات"
  }
}
```

Status Code: `500 Internal Server Error`

**Usage Examples / أمثلة الاستخدام:**

1. Get analytics for last 7 days / الحصول على تحليلات آخر 7 أيام:
```http
GET /api/v1/dashboard/analytics?period=7
```

2. Get analytics for last 90 days / الحصول على تحليلات آخر 90 يومًا:
```http
GET /api/v1/dashboard/analytics?period=90
```

3. Get analytics for last year / الحصول على تحليلات آخر سنة:
```http
GET /api/v1/dashboard/analytics?period=365
```

---

## Response Format / تنسيق الاستجابة

All successful responses follow this structure:
جميع الاستجابات الناجحة تتبع هذا الهيكل:

```json
{
  "status": "success",
  "data": {
    // Endpoint-specific data
    // بيانات خاصة بالنقطة الطرفية
  }
}
```

All error responses follow this structure:
جميع استجابات الأخطاء تتبع هذا الهيكل:

```json
{
  "status": "error",
  "message": {
    "en": "English error message",
    "ar": "رسالة الخطأ بالعربية"
  }
}
```

---

## Error Handling / معالجة الأخطاء

### Common Error Codes / رموز الأخطاء الشائعة

| Status Code | Description | Description (Arabic) |
|-------------|-------------|---------------------|
| `401` | Unauthorized - Missing or invalid token | غير مصرح - رمز مفقود أو غير صالح |
| `403` | Forbidden - Insufficient permissions | محظور - صلاحيات غير كافية |
| `500` | Internal Server Error | خطأ في الخادم الداخلي |

### Permission Errors / أخطاء الصلاحيات

If a user without `admin` or `magnet_employee` role tries to access these endpoints:
إذا حاول مستخدم بدون دور `admin` أو `magnet_employee` الوصول إلى هذه النقاط الطرفية:

```json
{
  "status": "error",
  "message": {
    "en": "Insufficient permissions",
    "ar": "صلاحيات غير كافية"
  }
}
```

Status Code: `403 Forbidden`

---

## Field Explanations / شرح الحقول

### Date Ranges / النطاقات الزمنية

- **Today**: Records created from 00:00:00 of current day / السجلات المنشأة من 00:00:00 من اليوم الحالي
- **Recent (30 days)**: Records created in the last 30 days / السجلات المنشأة في آخر 30 يومًا
- **Last 7 days**: Records created in the last 7 days / السجلات المنشأة في آخر 7 أيام
- **Period**: Custom period specified in analytics endpoint / الفترة المخصصة المحددة في نقطة نهاية التحليلات

### Status Values / قيم الحالة

#### Order Statuses / حالات الطلب
- `pending`: Order is pending confirmation / الطلب في انتظار التأكيد
- `confirmed`: Order is confirmed / الطلب مؤكد
- `processing`: Order is being processed / الطلب قيد المعالجة
- `shipped`: Order has been shipped / تم شحن الطلب
- `delivered`: Order has been delivered / تم تسليم الطلب
- `cancelled`: Order was cancelled / تم إلغاء الطلب
- `refunded`: Order was refunded / تم استرجاع الطلب

#### Product Statuses / حالات المنتج
- `approved`: Product is approved / المنتج معتمد
- `pending`: Product is pending approval / المنتج في انتظار الموافقة
- `declined`: Product was declined / تم رفض المنتج

#### Review Statuses / حالات المراجعة
- `approved`: Review is approved / المراجعة معتمدة
- `pending`: Review is pending approval / المراجعة في انتظار الموافقة
- `reject`: Review was rejected / تم رفض المراجعة

#### Special Order Statuses / حالات الطلب الخاص
- `pending`: Special order is pending / الطلب الخاص معلق
- `reviewed`: Special order has been reviewed / تمت مراجعة الطلب الخاص
- `contacted`: Customer has been contacted / تم الاتصال بالعميل
- `completed`: Special order is completed / الطلب الخاص مكتمل
- `cancelled`: Special order was cancelled / تم إلغاء الطلب الخاص

#### Applicant Statuses / حالات المتقدم
- `pending`: Applicant is pending review / المتقدم في انتظار المراجعة
- `accepted`: Applicant was accepted / تم قبول المتقدم
- `rejected`: Applicant was rejected / تم رفض المتقدم

---

## File Locations / مواقع الملفات

- **Controller**: `controllers/dashboard/dashboard/dashboard-controller.js`
- **Routes**: 
  - `routes/dashboard/dashboard/dashboard-routes.js` (dashboard endpoint)
  - `routes/dashboard/index.js` (analytics endpoint)

## Implementation Details / تفاصيل التنفيذ

### Helper Functions / الدوال المساعدة

#### `validateAdminOrEmployeePermissions(req, res)`
- Validates that the user has `admin` or `magnet_employee` role / يتحقق من أن المستخدم لديه دور `admin` أو `magnet_employee`
- Returns `null` if authorized, or sends 403 error response if not / يعيد `null` إذا كان مصرحًا، أو يرسل استجابة خطأ 403 إذا لم يكن كذلك
- Uses `getBilingualMessage('insufficient_permissions')` for error message / يستخدم `getBilingualMessage('insufficient_permissions')` لرسالة الخطأ

### Data Processing / معالجة البيانات

#### Number Conversion / تحويل الأرقام
- All aggregation results are converted using `Number()` to handle MongoDB Decimal128 types / جميع نتائج التجميع يتم تحويلها باستخدام `Number()` للتعامل مع أنواع Decimal128 من MongoDB
- Format: `Number(value) || 0` to ensure valid numbers / التنسيق: `Number(value) || 0` لضمان أرقام صالحة

#### Null Handling / معالجة القيم الفارغة
- All aggregation results check for `null` values before use / جميع نتائج التجميع تتحقق من القيم `null` قبل الاستخدام
- Format: `(result.length > 0 && result[0].field != null) ? Number(result[0].field) || 0 : 0` / التنسيق: `(result.length > 0 && result[0].field != null) ? Number(result[0].field) || 0 : 0`

#### Date Calculations / حسابات التاريخ
- `today`: Set to 00:00:00 of current day using `new Date(year, month, date)` / `today`: مضبوط على 00:00:00 من اليوم الحالي باستخدام `new Date(year, month, date)`
- `sevenDaysAgo`: Calculated by subtracting 7 days from today / `sevenDaysAgo`: محسوب بطرح 7 أيام من اليوم
- `thirtyDaysAgo`: Calculated by subtracting 30 days from today / `thirtyDaysAgo`: محسوب بطرح 30 يومًا من اليوم
- `periodStart`: Calculated by subtracting period days from today in analytics endpoint / `periodStart`: محسوب بطرح أيام الفترة من اليوم في نقطة نهاية التحليلات

### MongoDB Aggregations / تجميعات MongoDB

#### Price Statistics / إحصائيات الأسعار
```javascript
Product.aggregate([
  { $group: { 
    _id: null, 
    averagePrice: { $avg: '$pricePerUnit' }, 
    minPrice: { $min: '$pricePerUnit' }, 
    maxPrice: { $max: '$pricePerUnit' } 
  }}
])
```

#### Stock Calculation / حساب المخزون
```javascript
Product.aggregate([
  { $group: { 
    _id: null, 
    totalStock: { $sum: '$stock' } 
  }}
])
```

#### Revenue Calculation / حساب الإيرادات
```javascript
Order.aggregate([
  { $match: { status: { $in: ['delivered', 'shipped'] } } },
  { $group: { 
    _id: null, 
    totalRevenue: { $sum: '$total' }, 
    averageOrderValue: { $avg: '$total' } 
  }}
])
```

#### Growth Over Time / النمو بمرور الوقت
```javascript
Model.aggregate([
  { $match: { createdAt: { $gte: periodStart } } },
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
])
```

#### Price Distribution / توزيع الأسعار
```javascript
Product.aggregate([
  {
    $bucket: {
      groupBy: '$pricePerUnit',
      boundaries: [0, 50, 100, 200, 500, 1000, 5000, Infinity],
      default: 'Other',
      output: {
        count: { $sum: 1 },
        avgPrice: { $avg: '$pricePerUnit' }
      }
    }
  }
])
```

#### Top Customers / أفضل العملاء
```javascript
Order.aggregate([
  { $group: { 
    _id: '$customer', 
    orderCount: { $sum: 1 }, 
    totalSpent: { $sum: '$total' } 
  }},
  { $sort: { orderCount: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'customerInfo'
    }
  },
  { $unwind: '$customerInfo' },
  {
    $project: {
      customerId: '$_id',
      customerName: { $concat: ['$customerInfo.firstname', ' ', '$customerInfo.lastname'] },
      customerEmail: '$customerInfo.email',
      orderCount: 1,
      totalSpent: { $round: ['$totalSpent', 2] }
    }
  }
])
```

---

## Changelog / سجل التغييرات

### Version 1.1.0
- Added detailed implementation documentation / إضافة توثيق تفصيلي للتنفيذ
- Added MongoDB aggregation pipeline examples / إضافة أمثلة على خطوط تجميع MongoDB
- Added number conversion and null handling details / إضافة تفاصيل تحويل الأرقام ومعالجة القيم الفارغة
- Enhanced business logic documentation / تحسين توثيق المنطق التجاري
- Added helper functions documentation / إضافة توثيق الدوال المساعدة
- Added data processing details / إضافة تفاصيل معالجة البيانات

### Version 1.0.0
- Initial release / الإصدار الأولي
- Dashboard overview endpoint / نقطة نهاية نظرة عامة على لوحة التحكم
- Analytics endpoint with time-series data / نقطة نهاية التحليلات مع بيانات السلاسل الزمنية
- Support for multiple time periods / دعم فترات زمنية متعددة
- Comprehensive statistics for all models / إحصائيات شاملة لجميع النماذج
- Performance metrics calculation / حساب مقاييس الأداء

---

## Notes / ملاحظات

1. **Performance**: These endpoints perform multiple database queries and aggregations. Consider caching for production use.
   **الأداء**: تقوم هذه النقاط الطرفية بتنفيذ استعلامات وتجميعات متعددة لقاعدة البيانات. ضع في اعتبارك التخزين المؤقت للاستخدام في الإنتاج.

2. **Currency**: All monetary values are in USD (BASE_CURRENCY = 'USD').
   **العملة**: جميع القيم النقدية بالدولار الأمريكي (BASE_CURRENCY = 'USD').

3. **Date Calculations**: All date calculations use server timezone.
   **حسابات التاريخ**: جميع حسابات التاريخ تستخدم المنطقة الزمنية للخادم.

4. **Aggregation Performance**: Analytics endpoint may take longer for large datasets.
   **أداء التجميع**: قد تستغرق نقطة نهاية التحليلات وقتًا أطول لمجموعات البيانات الكبيرة.

5. **Number Formatting**: All numeric values are formatted to 2 decimal places using `toFixed(2)` and `parseFloat()`.
   **تنسيق الأرقام**: جميع القيم الرقمية يتم تنسيقها إلى منزلتين عشريتين باستخدام `toFixed(2)` و `parseFloat()`.

6. **Error Handling**: All errors are caught and logged to console, then return bilingual error messages.
   **معالجة الأخطاء**: جميع الأخطاء يتم التقاطها وتسجيلها في الكونسول، ثم إرجاع رسائل خطأ ثنائية اللغة.

7. **Response Formatting**: All responses use `createResponse('success', data)` utility function.
   **تنسيق الاستجابة**: جميع الاستجابات تستخدم دالة الأداة `createResponse('success', data)`.

8. **Permission Validation**: Both endpoints use `validateAdminOrEmployeePermissions()` helper function before processing.
   **التحقق من الصلاحيات**: كلا النقطتين الطرفيتين تستخدمان دالة المساعدة `validateAdminOrEmployeePermissions()` قبل المعالجة.

---

**Last Updated / آخر تحديث:** 2024-01-15

