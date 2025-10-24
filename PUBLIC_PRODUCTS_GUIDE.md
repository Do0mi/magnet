# دليل المنتجات العامة للمستخدمين غير المصرح لهم / Public Products Guide for Unauthorized Users

## نظرة عامة / Overview

تم إنشاء نظام آمن لعرض المنتجات للمستخدمين غير المصرح لهم في متجرك الإلكتروني. هذا النظام يسمح للزوار بتصفح المنتجات المعتمدة فقط دون الحاجة للتسجيل أو المصادقة.

A secure system has been created to display products to unauthorized users in your e-commerce store. This system allows visitors to browse only approved products without the need for registration or authentication.

## المسارات المتاحة / Available Routes

### 1. الحصول على جميع المنتجات المعتمدة / Get All Approved Products
```
GET /api/public/products
```

**المعاملات الاختيارية / Optional Parameters:**
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد المنتجات في الصفحة (افتراضي: 10)
- `category`: تصفية حسب الفئة
- `search`: البحث في أسماء المنتجات
- `minPrice`: الحد الأدنى للسعر
- `maxPrice`: الحد الأقصى للسعر
- `lang`: اللغة (en/ar)

**مثال / Example:**
```
GET /api/public/products?page=1&limit=20&category=electronics&lang=ar
```

### 2. الحصول على منتج واحد / Get Single Product
```
GET /api/public/products/:id
```

**مثال / Example:**
```
GET /api/public/products/64a1b2c3d4e5f6789012345
```

### 3. البحث في المنتجات / Search Products
```
GET /api/public/products/search?q=searchTerm
```

**مثال / Example:**
```
GET /api/public/products/search?q=laptop&lang=en
```

### 4. المنتجات حسب الفئة / Products by Category
```
GET /api/public/products/category/:categoryName
```

**مثال / Example:**
```
GET /api/public/products/category/electronics
```

## ميزات الأمان / Security Features

### 1. حماية البيانات الحساسة / Sensitive Data Protection
- **إخفاء معلومات المستخدم الحساسة / Hide Sensitive User Information:**
  - لا يتم عرض البريد الإلكتروني / Email is not displayed
  - لا يتم عرض الاسم الشخصي / Personal name is not displayed
  - لا يتم عرض رقم الهاتف / Phone number is not displayed
  - يتم عرض اسم الشركة فقط / Only company name is displayed

### 2. تصفية المنتجات / Product Filtering
- **عرض المنتجات المعتمدة فقط / Show Only Approved Products:**
  - المنتجات المعلقة (pending) غير مرئية / Pending products are not visible
  - المنتجات المرفوضة (declined) غير مرئية / Declined products are not visible
  - المنتجات المعتمدة (approved) فقط مرئية / Only approved products are visible

### 3. التحكم في الوصول / Access Control
- **مصادقة اختيارية / Optional Authentication:**
  - يمكن للمستخدمين المصرح لهم الاستفادة من الميزات الإضافية / Authenticated users can benefit from additional features
  - المستخدمون غير المصرح لهم يحصلون على الوصول الأساسي / Unauthorized users get basic access

## استجابة API / API Response

### تنسيق الاستجابة الناجحة / Successful Response Format
```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "64a1b2c3d4e5f6789012345",
        "code": "PROD-001",
        "name": "Laptop Computer",
        "category": "Electronics",
        "pricePerUnit": "1500.00",
        "stock": 50,
        "rating": 4.5,
        "images": ["image1.jpg", "image2.jpg"],
        "owner": {
          "companyName": "Tech Solutions Inc"
        }
      }
    ],
    "stats": {
      "totalProducts": 150,
      "averageRating": 4.2
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 8,
    "totalItems": 150,
    "itemsPerPage": 20
  }
}
```

### تنسيق الاستجابة عند الخطأ / Error Response Format
```json
{
  "status": "error",
  "message": "Product not found"
}
```

## أفضل الممارسات / Best Practices

### 1. للواجهة الأمامية / For Frontend
- استخدم هذه المسارات للصفحات العامة / Use these routes for public pages
- قم بتخزين البيانات مؤقتاً لتحسين الأداء / Cache data for better performance
- اعرض رسائل مناسبة عند عدم وجود منتجات / Show appropriate messages when no products exist

### 2. للأمان / For Security
- لا تعرض معلومات حساسة في الواجهة / Don't display sensitive information in the UI
- استخدم HTTPS في الإنتاج / Use HTTPS in production
- قم بتنفيذ rate limiting لمنع الإساءة / Implement rate limiting to prevent abuse

### 3. للأداء / For Performance
- استخدم pagination للصفحات الكبيرة / Use pagination for large pages
- قم بتطبيق filters على مستوى قاعدة البيانات / Apply filters at database level
- استخدم indexes للبحث السريع / Use indexes for fast searching

## أمثلة على الاستخدام / Usage Examples

### JavaScript (Frontend)
```javascript
// الحصول على المنتجات / Get products
async function getPublicProducts(page = 1, limit = 20) {
  try {
    const response = await fetch(`/api/public/products?page=${page}&limit=${limit}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return data.data.products;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// البحث في المنتجات / Search products
async function searchProducts(searchTerm) {
  try {
    const response = await fetch(`/api/public/products/search?q=${encodeURIComponent(searchTerm)}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return data.data.products;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}
```

### React Component Example
```jsx
import React, { useState, useEffect } from 'react';

function PublicProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const response = await fetch('/api/public/products?limit=20');
        const data = await response.json();
        
        if (data.status === 'success') {
          setProducts(data.data.products);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="product-list">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <p>Price: ${product.pricePerUnit}</p>
          <p>Stock: {product.stock}</p>
          <p>Company: {product.owner.companyName}</p>
        </div>
      ))}
    </div>
  );
}

export default PublicProductList;
```

## ملاحظات مهمة / Important Notes

1. **الأمان / Security:** هذه المسارات آمنة وتحمي البيانات الحساسة / These routes are secure and protect sensitive data
2. **الأداء / Performance:** تم تحسين الاستعلامات للأداء الأمثل / Queries are optimized for best performance
3. **المرونة / Flexibility:** يمكن تخصيص الاستعلامات حسب الحاجة / Queries can be customized as needed
4. **الدعم متعدد اللغات / Multilingual Support:** يدعم النظام العربية والإنجليزية / System supports Arabic and English

## الدعم التقني / Technical Support

إذا واجهت أي مشاكل أو لديك أسئلة حول هذا النظام، يرجى التواصل مع فريق التطوير.

If you encounter any issues or have questions about this system, please contact the development team.
