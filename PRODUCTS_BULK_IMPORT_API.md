# Products Bulk Import API Documentation / توثيق API استيراد المنتجات بالجملة

## Overview / نظرة عامة

This endpoint allows business users to create multiple products at once by sending an array of product data. The Excel file should be parsed in the frontend, and the parsed data should be sent to this endpoint.

يسمح هذا الـ endpoint لمستخدمي الأعمال بإنشاء منتجات متعددة دفعة واحدة عن طريق إرسال مصفوفة من بيانات المنتجات. يجب تحليل ملف Excel في الواجهة الأمامية، وإرسال البيانات المحللة إلى هذا الـ endpoint.

---

## Endpoint / نقطة النهاية

```
POST /api/v1/business/products/products
```

**Authentication Required:** Yes (Bearer Token)  
**Role Required:** `business`

---

## Request Body Structure / بنية طلب البيانات

### Single Product Structure / بنية منتج واحد:

```json
{
  "products": [
    {
      "code": "A12",                    // Optional - will be auto-generated if not provided
      "category": {
        "en": "Electronics",
        "ar": "إلكترونيات"
      },
      "name": {
        "en": "Product Name",
        "ar": "اسم المنتج"
      },
      "description": {
        "en": "Product description in English",
        "ar": "وصف المنتج بالعربية"
      },
      "unit": {                         // Optional
        "en": "Piece",
        "ar": "قطعة"
      },
      "pricePerUnit": "100.50",
      "stock": 50,
      "minOrder": 1,                     // Optional
      "images": [                        // Optional
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "customFields": [                  // Required: 3-10 fields
        {
          "key": {
            "en": "Color",
            "ar": "اللون"
          },
          "value": {
            "en": "Red",
            "ar": "أحمر"
          }
        },
        {
          "key": {
            "en": "Size",
            "ar": "الحجم"
          },
          "value": {
            "en": "Large",
            "ar": "كبير"
          }
        },
        {
          "key": {
            "en": "Material",
            "ar": "المادة"
          },
          "value": {
            "en": "Cotton",
            "ar": "قطن"
          }
        }
        // ... up to 10 custom fields
      ],
      "attachments": []                  // Optional: Array of product IDs
    }
    // ... more products (max 100)
  ]
}
```

---

## Excel File Format / تنسيق ملف Excel

### Required Columns / الأعمدة المطلوبة:

| Column Name | Description | Example |
|------------|-------------|---------|
| **Name (EN)** | Product name in English | "Laptop Computer" |
| **Name (AR)** | Product name in Arabic | "جهاز كمبيوتر محمول" |
| **Category (EN)** | Category name in English | "Electronics" |
| **Category (AR)** | Category name in Arabic | "إلكترونيات" |
| **Description (EN)** | Description in English | "High performance laptop..." |
| **Description (AR)** | Description in Arabic | "جهاز كمبيوتر عالي الأداء..." |
| **Price Per Unit** | Product price | "1500.00" |
| **Stock** | Available stock quantity | "25" |
| **Min Order** | Minimum order quantity | "1" |
| **Unit (EN)** | Unit name in English (optional) | "Piece" |
| **Unit (AR)** | Unit name in Arabic (optional) | "قطعة" |
| **Code** | Product code (optional, auto-generated if empty) | "A12" |
| **Images** | Comma-separated image URLs (optional) | "url1.jpg,url2.jpg" |

### Custom Fields Columns / أعمدة الحقول المخصصة:

For each custom field (1-10), you need 4 columns:
لكل حقل مخصص (1-10)، تحتاج إلى 4 أعمدة:

- `Custom Field 1 Key (EN)` - "Color"
- `Custom Field 1 Key (AR)` - "اللون"
- `Custom Field 1 Value (EN)` - "Red"
- `Custom Field 1 Value (AR)` - "أحمر"

Repeat for Custom Field 2, 3, ... up to 10.
كرر للحقول 2، 3، ... حتى 10.

**Note:** At least 3 custom fields are required, maximum 10.
**ملاحظة:** مطلوب 3 حقول مخصصة على الأقل، بحد أقصى 10.

---

## Frontend Implementation Example / مثال تطبيق الواجهة الأمامية

### Using xlsx library (npm install xlsx):

```javascript
import * as XLSX from 'xlsx';

// Function to parse Excel and convert to API format
function parseExcelToProducts(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          defval: '', 
          raw: false 
        });

        // Transform to API format
        const products = jsonData.map((row, index) => {
          // Build custom fields
          const customFields = [];
          for (let i = 1; i <= 10; i++) {
            const keyEn = (row[`Custom Field ${i} Key (EN)`] || '').toString().trim();
            const keyAr = (row[`Custom Field ${i} Key (AR)`] || '').toString().trim();
            const valueEn = (row[`Custom Field ${i} Value (EN)`] || '').toString().trim();
            const valueAr = (row[`Custom Field ${i} Value (AR)`] || '').toString().trim();

            if (keyEn && keyAr && valueEn && valueAr) {
              customFields.push({
                key: { en: keyEn, ar: keyAr },
                value: { en: valueEn, ar: valueAr }
              });
            }
          }

          // Parse images (comma-separated)
          const imagesStr = (row['Images'] || '').toString().trim();
          const images = imagesStr ? imagesStr.split(',').map(img => img.trim()).filter(img => img) : [];

          return {
            code: (row['Code'] || '').toString().trim() || undefined,
            category: {
              en: (row['Category (EN)'] || '').toString().trim(),
              ar: (row['Category (AR)'] || '').toString().trim()
            },
            name: {
              en: (row['Name (EN)'] || '').toString().trim(),
              ar: (row['Name (AR)'] || '').toString().trim()
            },
            description: {
              en: (row['Description (EN)'] || '').toString().trim(),
              ar: (row['Description (AR)'] || '').toString().trim()
            },
            unit: (row['Unit (EN)'] && row['Unit (AR)']) ? {
              en: row['Unit (EN)'].toString().trim(),
              ar: row['Unit (AR)'].toString().trim()
            } : undefined,
            pricePerUnit: (row['Price Per Unit'] || '').toString().trim(),
            stock: row['Stock'] !== undefined ? parseInt(row['Stock']) || 0 : 0,
            minOrder: row['Min Order'] !== undefined ? parseInt(row['Min Order']) : undefined,
            images: images,
            customFields: customFields,
            attachments: []
          };
        });

        resolve(products);
      } catch (error) {
        reject(new Error(`Failed to parse Excel: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Function to send products to API
async function importProducts(file, authToken) {
  try {
    // Parse Excel file
    const products = await parseExcelToProducts(file);
    
    // Validate at least one product
    if (products.length === 0) {
      throw new Error('No products found in Excel file');
    }

    // Send to API
    const response = await fetch('/api/v1/business/products/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ products })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to import products');
    }

    return data;
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
}

// Usage example
const fileInput = document.getElementById('excelFile');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const result = await importProducts(file, 'your-auth-token');
    console.log('Import result:', result);
    // result.data contains:
    // - success: number of successfully created products
    // - failed: number of failed products
    // - total: total number of products
    // - products: array of created products
    // - failedProducts: array of failed products (if any)
    // - validationErrors: array of validation errors (if any)
  } catch (error) {
    console.error('Import failed:', error);
  }
});
```

---

## Response Format / تنسيق الاستجابة

### Success Response (201) / استجابة النجاح:

```json
{
  "status": "success",
  "message": "Products created successfully",
  "data": {
    "success": 5,
    "failed": 2,
    "total": 7,
    "products": [
      {
        "id": "...",
        "code": "A12",
        "name": { "en": "...", "ar": "..." },
        // ... full product object
      }
    ],
    "failedProducts": [
      {
        "index": 3,
        "product": "Product Name",
        "error": "Category not found"
      },
      {
        "index": 6,
        "product": "Another Product",
        "errors": ["Row 6: Name (EN) is required"]
      }
    ],
    "validationErrors": [
      "Row 1: Description (AR) is required",
      "Row 2: At least 3 custom fields are required"
    ]
  }
}
```

### Error Response (400) / استجابة الخطأ:

```json
{
  "status": "error",
  "message": "All products failed validation. Please check the errors",
  "data": {
    "total": 5,
    "failed": 5,
    "validationErrors": [...],
    "failedProducts": [...]
  }
}
```

---

## Validation Rules / قواعد التحقق

1. **Products Array:** Must be an array with at least 1 product, maximum 100 products.
2. **Required Fields:** `name` (en & ar), `category` (en & ar), `description` (en & ar), `pricePerUnit`
3. **Custom Fields:** Minimum 3, maximum 10. Each must have `key` and `value` in both languages.
4. **Category:** Must exist in database and be active.
5. **Unit:** If provided, both EN and AR are required.
6. **Code:** If provided and already exists, a new code will be auto-generated.

---

## Notes / ملاحظات

1. Products created through this endpoint will have `status: 'pending'` and require admin approval.
2. Product codes are auto-generated if not provided or if duplicate.
3. The endpoint processes products sequentially and returns detailed results for both successful and failed creations.
4. You can use the existing single product endpoint (`POST /api/v1/business/products/product`) for individual products.

---

## Error Handling / معالجة الأخطاء

The endpoint will:
- Validate all products before processing
- Continue processing even if some products fail
- Return detailed error information for each failed product
- Return all successfully created products in the response

---

## Example Excel Template / مثال قالب Excel

You can create an Excel file with the following structure:

| Name (EN) | Name (AR) | Category (EN) | Category (AR) | Description (EN) | Description (AR) | Price Per Unit | Stock | Min Order | Unit (EN) | Unit (AR) | Custom Field 1 Key (EN) | Custom Field 1 Key (AR) | Custom Field 1 Value (EN) | Custom Field 1 Value (AR) | ... |
|-----------|-----------|---------------|---------------|------------------|------------------|----------------|-------|-----------|-----------|-----------|-------------------------|-------------------------|---------------------------|---------------------------|-----|
| Laptop | كمبيوتر محمول | Electronics | إلكترونيات | High performance | عالي الأداء | 1500.00 | 25 | 1 | Piece | قطعة | Color | اللون | Black | أسود | ... |

---

## Support / الدعم

For questions or issues, please contact the development team.
للأسئلة أو المشاكل، يرجى الاتصال بفريق التطوير.
