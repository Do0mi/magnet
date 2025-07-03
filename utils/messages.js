// Bilingual messages utility
const messages = {
  // Auth messages
  'email_already_registered': {
    en: 'Email already registered',
    ar: 'البريد الإلكتروني مسجل بالفعل'
  },
  'phone_already_registered': {
    en: 'Phone number already registered',
    ar: 'رقم الهاتف مسجل بالفعل'
  },
  'user_registered_successfully': {
    en: 'User registered successfully',
    ar: 'تم تسجيل المستخدم بنجاح'
  },
  'registration_failed': {
    en: 'Registration failed',
    ar: 'فشل في التسجيل'
  },
  'business_registration_submitted': {
    en: 'Business registration submitted successfully. Your application is under review.',
    ar: 'تم تقديم تسجيل الأعمال بنجاح. طلبك قيد المراجعة.'
  },
  'business_registration_failed': {
    en: 'Business registration failed',
    ar: 'فشل في تسجيل الأعمال'
  },
  'email_already_exists': {
    en: 'Email already exists',
    ar: 'البريد الإلكتروني موجود بالفعل'
  },
  'phone_already_exists': {
    en: 'Phone already exists',
    ar: 'الهاتف موجود بالفعل'
  },
  'failed_send_otp_email': {
    en: 'Failed to send OTP email',
    ar: 'فشل في إرسال رمز التحقق عبر البريد الإلكتروني'
  },
  'otp_sent_email_success': {
    en: 'OTP sent to your email successfully',
    ar: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح'
  },
  'failed_send_otp': {
    en: 'Failed to send OTP',
    ar: 'فشل في إرسال رمز التحقق'
  },
  'failed_send_otp_sms': {
    en: 'Failed to send OTP SMS',
    ar: 'فشل في إرسال رمز التحقق عبر الرسائل النصية'
  },
  'otp_sent_phone_success': {
    en: 'OTP sent to your phone successfully',
    ar: 'تم إرسال رمز التحقق إلى هاتفك بنجاح'
  },
  'no_otp_found': {
    en: 'No OTP found for this identifier',
    ar: 'لم يتم العثور على رمز تحقق لهذا المعرف'
  },
  'invalid_otp': {
    en: 'Invalid OTP',
    ar: 'رمز التحقق غير صحيح'
  },
  'otp_expired': {
    en: 'OTP has expired',
    ar: 'انتهت صلاحية رمز التحقق'
  },
  'otp_verified_success': {
    en: 'OTP verified successfully',
    ar: 'تم التحقق من رمز التحقق بنجاح'
  },
  'otp_confirmation_failed': {
    en: 'OTP confirmation failed',
    ar: 'فشل في تأكيد رمز التحقق'
  },
  'phone_login_saudi_only': {
    en: 'Phone login is only allowed for Saudi numbers',
    ar: 'تسجيل الدخول بالهاتف مسموح فقط للأرقام السعودية'
  },
  'invalid_credentials': {
    en: 'Invalid credentials',
    ar: 'بيانات الاعتماد غير صحيحة'
  },
  'account_not_active': {
    en: 'Account is not active. Please contact support.',
    ar: 'الحساب غير نشط. يرجى الاتصال بالدعم.'
  },
  'login_successful': {
    en: 'Login successful',
    ar: 'تم تسجيل الدخول بنجاح'
  },
  'login_failed': {
    en: 'Login failed',
    ar: 'فشل في تسجيل الدخول'
  },
  'user_not_found': {
    en: 'User not found',
    ar: 'المستخدم غير موجود'
  },
  'failed_send_otp_to': {
    en: 'Failed to send OTP to',
    ar: 'فشل في إرسال رمز التحقق إلى'
  },
  'otp_sent_to_success': {
    en: 'OTP sent to your',
    ar: 'تم إرسال رمز التحقق إلى'
  },
  'login_with_otp_failed': {
    en: 'Login with OTP failed',
    ar: 'فشل في تسجيل الدخول برمز التحقق'
  },
  'password_updated_success': {
    en: 'Password updated successfully',
    ar: 'تم تحديث كلمة المرور بنجاح'
  },
  'password_update_failed': {
    en: 'Password update failed',
    ar: 'فشل في تحديث كلمة المرور'
  },
  'no_otp_found_user': {
    en: 'No OTP found for this user',
    ar: 'لم يتم العثور على رمز تحقق لهذا المستخدم'
  },
  'email_phone_verified_login': {
    en: 'verified and login successful',
    ar: 'تم التحقق وتسجيل الدخول بنجاح'
  },
  'saudi_phone_auto_verified': {
    en: 'Saudi phone number automatically verified',
    ar: 'تم التحقق من الرقم السعودي تلقائياً'
  },
  'email_auto_verified': {
    en: 'Email automatically verified',
    ar: 'تم التحقق من البريد الإلكتروني تلقائياً'
  },

  // User messages
  'failed_get_profile': {
    en: 'Failed to get profile',
    ar: 'فشل في الحصول على الملف الشخصي'
  },
  'profile_updated_success': {
    en: 'Profile updated successfully',
    ar: 'تم تحديث الملف الشخصي بنجاح'
  },
  'failed_update_profile': {
    en: 'Failed to update profile',
    ar: 'فشل في تحديث الملف الشخصي'
  },
  'failed_get_business_requests': {
    en: 'Failed to get business requests',
    ar: 'فشل في الحصول على طلبات الأعمال'
  },
  'business_not_found': {
    en: 'Business not found',
    ar: 'الأعمال غير موجودة'
  },
  'user_not_business': {
    en: 'User is not a business',
    ar: 'المستخدم ليس عملاً تجارياً'
  },
  'business_approved_rejected': {
    en: 'Business',
    ar: 'الأعمال'
  },
  'successfully': {
    en: 'successfully',
    ar: 'بنجاح'
  },
  'failed_process_business_approval': {
    en: 'Failed to process business approval',
    ar: 'فشل في معالجة موافقة الأعمال'
  },
  'failed_get_business_details': {
    en: 'Failed to get business details',
    ar: 'فشل في الحصول على تفاصيل الأعمال'
  },
  'access_denied_business_profile': {
    en: 'Access denied. Business profile only.',
    ar: 'تم رفض الوصول. ملف الأعمال الشخصي فقط.'
  },
  'failed_get_business_profile': {
    en: 'Failed to get business profile',
    ar: 'فشل في الحصول على ملف الأعمال الشخصي'
  },
  'only_customers_add_favourites': {
    en: 'Only customers can add favourites',
    ar: 'العملاء فقط يمكنهم إضافة المفضلة'
  },
  'product_added_favourites': {
    en: 'Product added to favourites',
    ar: 'تمت إضافة المنتج إلى المفضلة'
  },
  'failed_add_favourites': {
    en: 'Failed to add to favourites',
    ar: 'فشل في الإضافة إلى المفضلة'
  },
  'only_customers_remove_favourites': {
    en: 'Only customers can remove favourites',
    ar: 'العملاء فقط يمكنهم إزالة المفضلة'
  },
  'product_removed_favourites': {
    en: 'Product removed from favourites',
    ar: 'تمت إزالة المنتج من المفضلة'
  },
  'failed_remove_favourites': {
    en: 'Failed to remove from favourites',
    ar: 'فشل في الإزالة من المفضلة'
  },
  'only_customers_view_favourites': {
    en: 'Only customers can view favourites',
    ar: 'العملاء فقط يمكنهم عرض المفضلة'
  },
  'failed_get_favourites': {
    en: 'Failed to get favourites',
    ar: 'فشل في الحصول على المفضلة'
  },
  'only_customers_add_cart': {
    en: 'Only customers can add to cart',
    ar: 'العملاء فقط يمكنهم الإضافة إلى السلة'
  },
  'product_added_cart': {
    en: 'Product added to cart',
    ar: 'تمت إضافة المنتج إلى السلة'
  },
  'failed_add_cart': {
    en: 'Failed to add to cart',
    ar: 'فشل في الإضافة إلى السلة'
  },
  'only_customers_remove_cart': {
    en: 'Only customers can remove from cart',
    ar: 'العملاء فقط يمكنهم الإزالة من السلة'
  },
  'product_removed_cart': {
    en: 'Product removed from cart',
    ar: 'تمت إزالة المنتج من السلة'
  },
  'failed_remove_cart': {
    en: 'Failed to remove from cart',
    ar: 'فشل في الإزالة من السلة'
  },
  'only_customers_update_cart': {
    en: 'Only customers can update cart',
    ar: 'العملاء فقط يمكنهم تحديث السلة'
  },
  'product_not_in_cart': {
    en: 'Product not in cart',
    ar: 'المنتج غير موجود في السلة'
  },
  'cart_updated': {
    en: 'Cart updated',
    ar: 'تم تحديث السلة'
  },
  'failed_update_cart': {
    en: 'Failed to update cart',
    ar: 'فشل في تحديث السلة'
  },
  'only_customers_view_cart': {
    en: 'Only customers can view cart',
    ar: 'العملاء فقط يمكنهم عرض السلة'
  },
  'failed_get_cart': {
    en: 'Failed to get cart',
    ar: 'فشل في الحصول على السلة'
  },

  // Product messages
  'failed_get_products': {
    en: 'Failed to get products',
    ar: 'فشل في الحصول على المنتجات'
  },
  'only_business_add_products': {
    en: 'Only business users can add products',
    ar: 'مستخدمي الأعمال فقط يمكنهم إضافة المنتجات'
  },
  'product_added_pending_approval': {
    en: 'Product added, pending approval',
    ar: 'تمت إضافة المنتج، في انتظار الموافقة'
  },
  'failed_add_product': {
    en: 'Failed to add product',
    ar: 'فشل في إضافة المنتج'
  },
  'product_not_found': {
    en: 'Product not found',
    ar: 'المنتج غير موجود'
  },
  'not_authorized_update_product': {
    en: 'Not authorized to update this product',
    ar: 'غير مصرح بتحديث هذا المنتج'
  },
  'product_updated_pending_approval': {
    en: 'Product updated, pending approval',
    ar: 'تم تحديث المنتج، في انتظار الموافقة'
  },
  'failed_update_product': {
    en: 'Failed to update product',
    ar: 'فشل في تحديث المنتج'
  },
  'not_authorized_delete_product': {
    en: 'Not authorized to delete this product',
    ar: 'غير مصرح بحذف هذا المنتج'
  },
  'product_deleted': {
    en: 'Product deleted',
    ar: 'تم حذف المنتج'
  },
  'failed_delete_product': {
    en: 'Failed to delete product',
    ar: 'فشل في حذف المنتج'
  },
  'failed_process_product_approval': {
    en: 'Failed to process product approval',
    ar: 'فشل في معالجة موافقة المنتج'
  },
  'product_approved_rejected': {
    en: 'Product',
    ar: 'المنتج'
  }
};

// Function to get bilingual message
const getMessage = (key, language = 'en') => {
  const message = messages[key];
  if (!message) {
    return key; // Return key if message not found
  }
  return message[language] || message['en']; // Default to English
};

// Function to get message object with both languages
const getBilingualMessage = (key) => {
  const message = messages[key];
  if (!message) {
    return {
      en: key,
      ar: key
    };
  }
  return message;
};

// Function to get message based on user's language preference
const getUserMessage = (key, userLanguage = 'en') => {
  return getMessage(key, userLanguage);
};

// Function to get message from request (extracts language from user or defaults to 'en')
const getMessageFromRequest = (key, req) => {
  const userLanguage = req.user?.language || 'en';
  return getMessage(key, userLanguage);
};

module.exports = {
  getMessage,
  getBilingualMessage,
  getUserMessage,
  getMessageFromRequest,
  messages
}; 