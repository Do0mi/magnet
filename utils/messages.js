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
  },
  'insufficient_permissions': {
    en: 'Insufficient permissions',
    ar: 'ليست لديك الصلاحيات الكافية'
  },
  'admin_user_created_successfully': {
    en: 'Admin user created successfully',
    ar: 'تم إنشاء مستخدم مسؤول بنجاح'
  },
  'admin_creation_failed': {
    en: 'Failed to create admin user',
    ar: 'فشل في إنشاء مستخدم مسؤول'
  },
  'magnet_employee_created_successfully': {
    en: 'Magnet employee user created successfully',
    ar: 'تم إنشاء موظف مغناطيس بنجاح'
  },
  'magnet_employee_creation_failed': {
    en: 'Failed to create magnet employee user',
    ar: 'فشل في إنشاء موظف مغناطيس'
  },
  'business_approval_success': {
    en: 'Business approval processed successfully',
    ar: 'تمت معالجة موافقة الأعمال بنجاح'
  },

  // Address messages
  'failed_get_addresses': {
    en: 'Failed to get addresses',
    ar: 'فشل في الحصول على العناوين'
  },
  'address_added': {
    en: 'Address added successfully',
    ar: 'تمت إضافة العنوان بنجاح'
  },
  'failed_add_address': {
    en: 'Failed to add address',
    ar: 'فشل في إضافة العنوان'
  },
  'address_not_found': {
    en: 'Address not found',
    ar: 'العنوان غير موجود'
  },
  'address_updated': {
    en: 'Address updated successfully',
    ar: 'تم تحديث العنوان بنجاح'
  },
  'failed_update_address': {
    en: 'Failed to update address',
    ar: 'فشل في تحديث العنوان'
  },
  'address_deleted': {
    en: 'Address deleted successfully',
    ar: 'تم حذف العنوان بنجاح'
  },
  'failed_delete_address': {
    en: 'Failed to delete address',
    ar: 'فشل في حذف العنوان'
  },

  // Category messages
  'failed_get_categories': {
    en: 'Failed to get categories',
    ar: 'فشل في الحصول على التصنيفات'
  },
  'category_created': {
    en: 'Category created successfully',
    ar: 'تم إنشاء التصنيف بنجاح'
  },
  'failed_create_category': {
    en: 'Failed to create category',
    ar: 'فشل في إنشاء التصنيف'
  },
  'category_not_found': {
    en: 'Category not found',
    ar: 'التصنيف غير موجود'
  },
  'not_authorized_update_category': {
    en: 'Not authorized to update this category',
    ar: 'غير مصرح بتحديث هذا التصنيف'
  },
  'category_updated': {
    en: 'Category updated successfully',
    ar: 'تم تحديث التصنيف بنجاح'
  },
  'failed_update_category': {
    en: 'Failed to update category',
    ar: 'فشل في تحديث التصنيف'
  },
  'not_authorized_delete_category': {
    en: 'Not authorized to delete this category',
    ar: 'غير مصرح بحذف هذا التصنيف'
  },
  'category_deleted': {
    en: 'Category deleted successfully',
    ar: 'تم حذف التصنيف بنجاح'
  },
  'failed_delete_category': {
    en: 'Failed to delete category',
    ar: 'فشل في حذف التصنيف'
  },

  // Order messages
  'order_must_have_items': {
    en: 'Order must have at least one item',
    ar: 'يجب أن يحتوي الطلب على عنصر واحد على الأقل'
  },
  'order_created': {
    en: 'Order created successfully',
    ar: 'تم إنشاء الطلب بنجاح'
  },
  'failed_create_order': {
    en: 'Failed to create order',
    ar: 'فشل في إنشاء الطلب'
  },
  'failed_get_orders': {
    en: 'Failed to get orders',
    ar: 'فشل في الحصول على الطلبات'
  },
  'order_not_found': {
    en: 'Order not found',
    ar: 'الطلب غير موجود'
  },
  'not_authorized_view_order': {
    en: 'Not authorized to view this order',
    ar: 'غير مصرح بعرض هذا الطلب'
  },
  'failed_get_order': {
    en: 'Failed to get order',
    ar: 'فشل في الحصول على الطلب'
  },
  'invalid_order_status': {
    en: 'Invalid order status',
    ar: 'حالة الطلب غير صالحة'
  },
  'order_status_updated': {
    en: 'Order status updated successfully',
    ar: 'تم تحديث حالة الطلب بنجاح'
  },
  'failed_update_order_status': {
    en: 'Failed to update order status',
    ar: 'فشل في تحديث حالة الطلب'
  },

  // Product messages (additional)
  'only_business_can_add_products': {
    en: 'Only business users can add products',
    ar: 'فقط مستخدمي الأعمال يمكنهم إضافة المنتجات'
  },
  'invalid_custom_fields_count': {
    en: 'Must provide 3–10 custom fields',
    ar: 'يجب توفير من 3 إلى 10 حقول مخصصة'
  },
  'only_magnet_employee_can_add_products': {
    en: 'Only magnet employees can add products',
    ar: 'فقط موظفي مغناطيس يمكنهم إضافة المنتجات'
  },
  'product_added_and_approved': {
    en: 'Product added and approved',
    ar: 'تمت إضافة المنتج والموافقة عليه'
  },
  'product_updated': {
    en: 'Product updated successfully',
    ar: 'تم تحديث المنتج بنجاح'
  },
  'not_authorized_approve_product': {
    en: 'Not authorized to approve this product',
    ar: 'غير مصرح بالموافقة على هذا المنتج'
  },
  'product_approved': {
    en: 'Product approved successfully',
    ar: 'تمت الموافقة على المنتج بنجاح'
  },
  'failed_approve_product': {
    en: 'Failed to approve product',
    ar: 'فشل في الموافقة على المنتج'
  },
  'not_authorized_decline_product': {
    en: 'Not authorized to decline this product',
    ar: 'غير مصرح برفض هذا المنتج'
  },
  'product_declined': {
    en: 'Product declined successfully',
    ar: 'تم رفض المنتج بنجاح'
  },
  'failed_decline_product': {
    en: 'Failed to decline product',
    ar: 'فشل في رفض المنتج'
  },

  // Review messages
  'product_not_found_or_not_approved': {
    en: 'Product not found or not approved',
    ar: 'المنتج غير موجود أو غير معتمد'
  },
  'already_reviewed_product': {
    en: 'You have already reviewed this product',
    ar: 'لقد قمت بتقييم هذا المنتج من قبل'
  },
  'review_added': {
    en: 'Review added successfully',
    ar: 'تمت إضافة التقييم بنجاح'
  },
  'failed_add_review': {
    en: 'Failed to add review',
    ar: 'فشل في إضافة التقييم'
  },
  'failed_get_reviews': {
    en: 'Failed to get reviews',
    ar: 'فشل في الحصول على التقييمات'
  },
  'review_not_found': {
    en: 'Review not found',
    ar: 'التقييم غير موجود'
  },
  'review_deleted': {
    en: 'Review deleted successfully',
    ar: 'تم حذف التقييم بنجاح'
  },
  'failed_delete_review': {
    en: 'Failed to delete review',
    ar: 'فشل في حذف التقييم'
  },

  // Wishlist messages
  'product_not_found_or_not_approved': {
    en: 'Product not found or not approved',
    ar: 'المنتج غير موجود أو غير معتمد'
  },
  'product_already_in_wishlist': {
    en: 'Product already in wishlist',
    ar: 'المنتج موجود بالفعل في قائمة الرغبات'
  },
  'wishlist_not_found': {
    en: 'Wishlist not found',
    ar: 'قائمة الرغبات غير موجودة'
  },

  // Bilingual product validation messages
  'product_name_required_both_languages': {
    en: 'Product name is required in both English and Arabic',
    ar: 'اسم المنتج مطلوب باللغتين الإنجليزية والعربية'
  },
  'product_description_required_both_languages': {
    en: 'Product description is required in both English and Arabic',
    ar: 'وصف المنتج مطلوب باللغتين الإنجليزية والعربية'
  },
  'custom_fields_required_both_languages': {
    en: 'Custom fields are required in both English and Arabic',
    ar: 'الحقول المخصصة مطلوبة باللغتين الإنجليزية والعربية'
  },
  'product_category_required_both_languages': {
    en: 'Product category is required in both English and Arabic',
    ar: 'فئة المنتج مطلوبة باللغتين الإنجليزية والعربية'
  },
  'product_unit_required_both_languages': {
    en: 'Product unit is required in both English and Arabic',
    ar: 'وحدة المنتج مطلوبة باللغتين الإنجليزية والعربية'
  },
  
  // Address validation messages
  'address_line1_required_both_languages': {
    en: 'Address line 1 is required in both English and Arabic',
    ar: 'عنوان السطر الأول مطلوب باللغتين الإنجليزية والعربية'
  },
  'address_line2_required_both_languages': {
    en: 'Address line 2 is required in both English and Arabic',
    ar: 'عنوان السطر الثاني مطلوب باللغتين الإنجليزية والعربية'
  },
  'city_required_both_languages': {
    en: 'City is required in both English and Arabic',
    ar: 'المدينة مطلوبة باللغتين الإنجليزية والعربية'
  },
  'state_required_both_languages': {
    en: 'State is required in both English and Arabic',
    ar: 'الولاية مطلوبة باللغتين الإنجليزية والعربية'
  },
  'country_required_both_languages': {
    en: 'Country is required in both English and Arabic',
    ar: 'البلد مطلوب باللغتين الإنجليزية والعربية'
  },
  
  // Category validation messages
  'category_name_required_both_languages': {
    en: 'Category name is required in both English and Arabic',
    ar: 'اسم الفئة مطلوب باللغتين الإنجليزية والعربية'
  },
  'category_description_required_both_languages': {
    en: 'Category description is required in both English and Arabic',
    ar: 'وصف الفئة مطلوب باللغتين الإنجليزية والعربية'
  },
  
  // Review validation messages
  'review_comment_required_both_languages': {
    en: 'Review comment is required in both English and Arabic',
    ar: 'تعليق التقييم مطلوب باللغتين الإنجليزية والعربية'
  },
  
  // Order status options messages
  'status_options_retrieved': {
    en: 'Status options retrieved successfully',
    ar: 'تم استرجاع خيارات الحالة بنجاح'
  },
  'failed_get_status_options': {
    en: 'Failed to get status options',
    ar: 'فشل في الحصول على خيارات الحالة'
  },
  
  'business_product_orders_retrieved': {
    en: 'Business product orders retrieved successfully',
    ar: 'تم استرجاع طلبات منتجات الأعمال بنجاح'
  },
  
  'failed_get_business_product_orders': {
    en: 'Failed to get business product orders',
    ar: 'فشل في الحصول على طلبات منتجات الأعمال'
  },
  
  'no_products_found': {
    en: 'No products found for this business',
    ar: 'لم يتم العثور على منتجات لهذا العمل'
  },
  
  'product_not_found': {
    en: 'Product not found',
    ar: 'المنتج غير موجود'
  },
  'product_access_denied': {
    en: 'Access denied to this product',
    ar: 'تم رفض الوصول لهذا المنتج'
  },
  'failed_get_product': {
    en: 'Failed to get product',
    ar: 'فشل في الحصول على المنتج'
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