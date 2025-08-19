# Admin Functionality Summary

## Overview / نظرة عامة

This document summarizes the comprehensive admin functionality implemented for the Magnet project, allowing admins to manage all users in the system.

هذا المستند يلخص الوظائف الشاملة للمدير المطبقة لمشروع Magnet، مما يسمح للمديرين بإدارة جميع المستخدمين في النظام.

---

## Features Implemented / الميزات المطبقة

### **English:**
✅ **Complete User Management**
- Create any type of user (customer, business, magnet_employee, admin)
- View all users with pagination, filtering, and search
- Update user information and roles
- Delete users permanently
- Get comprehensive user statistics

✅ **User Disallowance System**
- Disallow users from logging in
- Prevent disallowed users from performing actions
- Track disallowance reasons and timestamps
- Allow previously disallowed users

✅ **Security & Protection**
- Admin self-protection (cannot delete/disallow themselves)
- Strong password requirements
- Automatic email/phone verification for admin-created users
- Comprehensive audit trail

### **العربية:**
✅ **إدارة شاملة للمستخدمين**
- إنشاء أي نوع من المستخدمين (عميل، عمل، موظف magnet، مدير)
- عرض جميع المستخدمين مع الترقيم والتصفية والبحث
- تحديث معلومات المستخدمين والأدوار
- حذف المستخدمين نهائياً
- الحصول على إحصائيات شاملة للمستخدمين

✅ **نظام منع المستخدمين**
- منع المستخدمين من تسجيل الدخول
- منع المستخدمين المحظورين من تنفيذ الإجراءات
- تتبع أسباب المنع والطوابع الزمنية
- السماح للمستخدمين المحظورين سابقاً

✅ **الأمان والحماية**
- حماية المدير الذاتية (لا يمكنه حذف/منع نفسه)
- متطلبات كلمة مرور قوية
- التحقق التلقائي من البريد الإلكتروني/الهاتف للمستخدمين المنشأين من قبل المدير
- مسار تدقيق شامل

---

## API Endpoints / نقاط نهاية API

### **Base URL:** `/api/admin`

| Endpoint / النقطة النهائية | Method / الطريقة | Description / الوصف |
|---------------------------|------------------|---------------------|
| `/users` | POST | Create any type of user |
| `/users` | GET | Get all users with filters |
| `/users/stats` | GET | Get user statistics |
| `/users/:id` | GET | Get specific user |
| `/users/:id` | PUT | Update user |
| `/users/:id` | DELETE | Delete user |
| `/users/:id/disallow` | PUT | Disallow user |
| `/users/:id/allow` | PUT | Allow user |

---

## User Types Supported / أنواع المستخدمين المدعومة

### **1. Customer / العميل**
- Basic user information
- Can place orders and manage profile
- No special business fields required

### **2. Business / العمل**
- Full business information required
- CR Number, VAT Number, Company details
- Automatically approved when created by admin
- Can add products and manage business profile

### **3. Magnet Employee / موظف Magnet**
- Internal employee with limited admin access
- Can manage products and orders
- Cannot manage other users

### **4. Admin / المدير**
- Full system access
- Can manage all users and system settings
- Cannot delete or disallow themselves

---

## Disallowance System / نظام المنع

### **How It Works / كيف يعمل:**

1. **Admin disallows user** → User cannot login
2. **Disallowed business users** → Cannot add products
3. **Disallowed users** → Cannot perform any actions
4. **Admin can allow users** → Restore access

### **Fields Tracked / الحقول المتتبعة:**
- `isDisallowed` (boolean)
- `disallowReason` (string)
- `disallowedBy` (admin ID)
- `disallowedAt` (timestamp)
- `allowedBy` (admin ID)
- `allowedAt` (timestamp)

---

## Security Features / ميزات الأمان

### **Admin Protection / حماية المدير**
- Admins cannot delete themselves
- Admins cannot disallow themselves
- All admin actions are logged with timestamps
- Strong password requirements enforced

### **User Verification / التحقق من المستخدمين**
- Admin-created users are automatically email verified
- Admin-created users with phone numbers are automatically phone verified
- Business users created by admin are automatically approved

### **Access Control / التحكم في الوصول**
- All admin endpoints require admin role
- JWT token validation on all requests
- Comprehensive error handling and validation

---

## Database Schema Updates / تحديثات مخطط قاعدة البيانات

### **User Model Additions / إضافات نموذج المستخدم:**

```javascript
// Disallowance fields
isDisallowed: {
  type: Boolean,
  default: false
},
disallowReason: String,
disallowedBy: {
  type: Schema.Types.ObjectId,
  ref: 'User'
},
disallowedAt: Date,
allowedBy: {
  type: Schema.Types.ObjectId,
  ref: 'User'
},
allowedAt: Date
```

### **Updated Methods / الطرق المحدثة:**
- `canLogin()` method now checks `isDisallowed` status
- Enhanced user validation and verification

---

## Integration Points / نقاط التكامل

### **Auth Controller Updates / تحديثات متحكم المصادقة:**
- Login checks for disallowed users
- Returns specific error messages for disallowed accounts

### **Product Controller Updates / تحديثات متحكم المنتج:**
- Business users cannot add products if disallowed
- Enhanced validation and error handling

### **Response Formatters / منسقات الاستجابة:**
- Include disallowance information in user responses
- Consistent formatting across all endpoints

---

## Usage Examples / أمثلة الاستخدام

### **Create a Business User / إنشاء مستخدم عمل**
```bash
POST /api/admin/users
{
  "firstname": "Ahmed",
  "lastname": "Al-Sayed",
  "email": "ahmed@company.com",
  "phone": "+966501234567",
  "password": "SecurePass123",
  "role": "business",
  "country": "Saudi Arabia",
  "crNumber": "CR789012",
  "vatNumber": "VAT789012",
  "companyName": "Al-Sayed Trading Co.",
  "companyType": "LLC",
  "city": "Riyadh",
  "district": "Al Olaya",
  "streetName": "King Fahd Road"
}
```

### **Get Users with Filters / الحصول على المستخدمين مع المرشحات**
```bash
GET /api/admin/users?role=business&status=active&search=company&page=1&limit=10
```

### **Disallow a User / منع مستخدم**
```bash
PUT /api/admin/users/60f7b3b3b3b3b3b3b3b3b3b3/disallow
{
  "reason": "Multiple terms of service violations"
}
```

---

## Benefits / الفوائد

### **For Admins / للمديرين:**
- Complete control over user management
- Comprehensive user statistics and insights
- Flexible filtering and search capabilities
- Secure user disallowance system

### **For System Security / لأمان النظام:**
- Prevents unauthorized access
- Tracks all admin actions
- Maintains audit trail
- Protects against abuse

### **For User Experience / لتجربة المستخدم:**
- Clear error messages for disallowed users
- Consistent API responses
- Proper validation and error handling

---

## Future Enhancements / التحسينات المستقبلية

### **Potential Additions / الإضافات المحتملة:**
1. **Bulk Operations**: Create/update/delete multiple users at once
2. **Advanced Analytics**: Detailed user behavior and activity reports
3. **Role-based Permissions**: Granular permissions for different admin levels
4. **Automated Actions**: Scheduled user management tasks
5. **Notification System**: Email notifications for admin actions

### **Monitoring & Logging / المراقبة والتسجيل:**
1. **Admin Action Logs**: Detailed logs of all admin actions
2. **User Activity Tracking**: Monitor user behavior and patterns
3. **Security Alerts**: Notifications for suspicious activities
4. **Performance Metrics**: Track API performance and usage

---

## Conclusion / الخلاصة

The admin functionality provides comprehensive user management capabilities while maintaining security and data integrity. The system allows admins to efficiently manage all aspects of user accounts while providing detailed insights and control over the platform.

توفر وظائف المدير إمكانيات إدارة شاملة للمستخدمين مع الحفاظ على الأمان وسلامة البيانات. يسمح النظام للمديرين بإدارة جميع جوانب حسابات المستخدمين بكفاءة مع توفير رؤى مفصلة والتحكم في المنصة.
