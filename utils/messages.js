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
  'only_admin_or_magnet_employee_can_add_products': {
    en: 'Only admin or magnet employees can add products',
    ar: 'فقط المدير أو موظفي مغناطيس يمكنهم إضافة المنتجات'
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
  
  'business_product_reviews_retrieved': {
    en: 'Business product reviews retrieved successfully',
    ar: 'تم استرجاع تقييمات منتجات الأعمال بنجاح'
  },
  
  'failed_get_business_product_reviews': {
    en: 'Failed to get business product reviews',
    ar: 'فشل في الحصول على تقييمات منتجات الأعمال'
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
  'product_added_wishlist': {
    en: 'Product added to wishlist',
    ar: 'تمت إضافة المنتج إلى قائمة الرغبات'
  },
  'product_removed_wishlist': {
    en: 'Product removed from wishlist',
    ar: 'تمت إزالة المنتج من قائمة الرغبات'
  },
  'failed_add_wishlist': {
    en: 'Failed to add to wishlist',
    ar: 'فشل في الإضافة إلى قائمة الرغبات'
  },
  'failed_remove_wishlist': {
    en: 'Failed to remove from wishlist',
    ar: 'فشل في الإزالة من قائمة الرغبات'
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
  },
  
  // Admin messages
  'insufficient_permissions': {
    en: 'Insufficient permissions to perform this action',
    ar: 'صلاحيات غير كافية لتنفيذ هذا الإجراء'
  },
  'account_disallowed': {
    en: 'Your account has been disallowed. Please contact support.',
    ar: 'تم منع حسابك. يرجى الاتصال بالدعم.'
  },
  'user_created_successfully': {
    en: 'User created successfully',
    ar: 'تم إنشاء المستخدم بنجاح'
  },
  'user_creation_failed': {
    en: 'Failed to create user',
    ar: 'فشل في إنشاء المستخدم'
  },
  'users_retrieved_successfully': {
    en: 'Users retrieved successfully',
    ar: 'تم استرجاع المستخدمين بنجاح'
  },
  'failed_get_users': {
    en: 'Failed to get users',
    ar: 'فشل في الحصول على المستخدمين'
  },
  'user_stats_retrieved': {
    en: 'User statistics retrieved successfully',
    ar: 'تم استرجاع إحصائيات المستخدمين بنجاح'
  },
  'failed_get_user_stats': {
    en: 'Failed to get user statistics',
    ar: 'فشل في الحصول على إحصائيات المستخدمين'
  },
  'user_updated_successfully': {
    en: 'User updated successfully',
    ar: 'تم تحديث المستخدم بنجاح'
  },
  'user_update_failed': {
    en: 'Failed to update user',
    ar: 'فشل في تحديث المستخدم'
  },
  'user_deleted_successfully': {
    en: 'User deleted successfully',
    ar: 'تم حذف المستخدم بنجاح'
  },
  'user_deletion_failed': {
    en: 'Failed to delete user',
    ar: 'فشل في حذف المستخدم'
  },
  'user_disallowed_successfully': {
    en: 'User disallowed successfully',
    ar: 'تم منع المستخدم بنجاح'
  },
  'user_disallow_failed': {
    en: 'Failed to disallow user',
    ar: 'فشل في منع المستخدم'
  },
  'user_allowed_successfully': {
    en: 'User allowed successfully',
    ar: 'تم السماح للمستخدم بنجاح'
  },
  'user_allow_failed': {
    en: 'Failed to allow user',
    ar: 'فشل في السماح للمستخدم'
  },
  'disallow_reason_required': {
    en: 'Disallow reason is required',
    ar: 'سبب المنع مطلوب'
  },
  'user_already_disallowed': {
    en: 'User is already disallowed',
    ar: 'المستخدم محظور بالفعل'
  },
  'user_not_disallowed': {
    en: 'User is not disallowed',
    ar: 'المستخدم غير محظور'
  },
  'cannot_disallow_admin': {
    en: 'Cannot disallow admin users',
    ar: 'لا يمكن منع مستخدمي المدير'
  },
  'cannot_disallow_self': {
    en: 'Cannot disallow your own account',
    ar: 'لا يمكن منع حسابك الخاص'
  },
  'invalid_user_id': {
    en: 'Invalid user ID',
    ar: 'معرف المستخدم غير صحيح'
  },
  'user_not_found_by_id': {
    en: 'User not found with the provided ID',
    ar: 'لم يتم العثور على المستخدم بالمعرف المقدم'
  },
  'email_phone_already_exists': {
    en: 'Email or phone number already exists',
    ar: 'البريد الإلكتروني أو رقم الهاتف موجود بالفعل'
  },
  'invalid_role': {
    en: 'Invalid role specified',
    ar: 'الدور المحدد غير صحيح'
  },
  'admin_user_created_successfully': {
    en: 'Admin user created successfully',
    ar: 'تم إنشاء مستخدم المدير بنجاح'
  },
  'admin_creation_failed': {
    en: 'Failed to create admin user',
    ar: 'فشل في إنشاء مستخدم المدير'
  },
  'magnet_employee_created_successfully': {
    en: 'Magnet employee created successfully',
    ar: 'تم إنشاء موظف Magnet بنجاح'
  },
  'magnet_employee_creation_failed': {
    en: 'Failed to create magnet employee',
    ar: 'فشل في إنشاء موظف Magnet'
  },
  'business_user_created_successfully': {
    en: 'Business user created successfully',
    ar: 'تم إنشاء مستخدم الأعمال بنجاح'
  },
  'business_creation_failed': {
    en: 'Failed to create business user',
    ar: 'فشل في إنشاء مستخدم الأعمال'
  },
  'customer_user_created_successfully': {
    en: 'Customer user created successfully',
    ar: 'تم إنشاء مستخدم العميل بنجاح'
  },
  'customer_creation_failed': {
    en: 'Failed to create customer user',
    ar: 'فشل في إنشاء مستخدم العميل'
  },
  'password_required': {
    en: 'Password is required',
    ar: 'كلمة المرور مطلوبة'
  },
  'password_too_short': {
    en: 'Password must be at least 8 characters long',
    ar: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل'
  },
  'password_requirements_not_met': {
    en: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ar: 'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل، وحرف صغير واحد، ورقم واحد'
  },
  'firstname_required': {
    en: 'First name is required',
    ar: 'الاسم الأول مطلوب'
  },
  'lastname_required': {
    en: 'Last name is required',
    ar: 'اسم العائلة مطلوب'
  },
  'email_required': {
    en: 'Email is required',
    ar: 'البريد الإلكتروني مطلوب'
  },
  'country_required': {
    en: 'Country is required',
    ar: 'البلد مطلوب'
  },
  'invalid_email_format': {
    en: 'Invalid email format',
    ar: 'تنسيق البريد الإلكتروني غير صحيح'
  },
  'invalid_phone_format': {
    en: 'Invalid phone number format',
    ar: 'تنسيق رقم الهاتف غير صحيح'
  },
  'business_info_required': {
    en: 'Business information is required for business users',
    ar: 'معلومات الأعمال مطلوبة لمستخدمي الأعمال'
  },
  'cr_number_required': {
    en: 'CR number is required for business users',
    ar: 'رقم السجل التجاري مطلوب لمستخدمي الأعمال'
  },
  'vat_number_required': {
    en: 'VAT number is required for business users',
    ar: 'رقم الضريبة على القيمة المضافة مطلوب لمستخدمي الأعمال'
  },
  'company_name_required': {
    en: 'Company name is required for business users',
    ar: 'اسم الشركة مطلوب لمستخدمي الأعمال'
  },
  'company_type_required': {
    en: 'Company type is required for business users',
    ar: 'نوع الشركة مطلوب لمستخدمي الأعمال'
  },
  'city_required': {
    en: 'City is required for business users',
    ar: 'المدينة مطلوبة لمستخدمي الأعمال'
  },
  'district_required': {
    en: 'District is required for business users',
    ar: 'الحي مطلوب لمستخدمي الأعمال'
  },
  'street_name_required': {
    en: 'Street name is required for business users',
    ar: 'اسم الشارع مطلوب لمستخدمي الأعمال'
  },
  'missing_required_fields': {
    en: 'Missing required fields',
    ar: 'الحقول المطلوبة مفقودة'
  },
  'business_fields_required': {
    en: 'Business fields are required for business users',
    ar: 'حقول الأعمال مطلوبة لمستخدمي الأعمال'
  },
  'failed_create_user': {
    en: 'Failed to create user',
    ar: 'فشل في إنشاء المستخدم'
  },
  'failed_get_user': {
    en: 'Failed to get user',
    ar: 'فشل في الحصول على المستخدم'
  },
  'cannot_delete_self': {
    en: 'Cannot delete your own account',
    ar: 'لا يمكن حذف حسابك الخاص'
  },
  'failed_disallow_user': {
    en: 'Failed to disallow user',
    ar: 'فشل في منع المستخدم'
  },
  'failed_allow_user': {
    en: 'Failed to allow user',
    ar: 'فشل في السماح للمستخدم'
  },

  'address_line1_required': {
    en: 'Address line 1 is required',
    ar: 'عنوان السطر الأول مطلوب'
  },
  'state_required': {
    en: 'State is required',
    ar: 'الولاية مطلوبة'
  },
  'failed_update_user': {
    en: 'Failed to update user',
    ar: 'فشل في تحديث المستخدم'
  },

  // Admin Wishlist Management Messages
  'failed_get_wishlists': {
    en: 'Failed to get wishlists',
    ar: 'فشل في الحصول على قوائم الرغبات'
  },
  'failed_get_wishlist': {
    en: 'Failed to get wishlist',
    ar: 'فشل في الحصول على قائمة الرغبات'
  },
  'wishlist_created_successfully': {
    en: 'Wishlist created successfully',
    ar: 'تم إنشاء قائمة الرغبات بنجاح'
  },
  'failed_create_wishlist': {
    en: 'Failed to create wishlist',
    ar: 'فشل في إنشاء قائمة الرغبات'
  },
  'wishlist_updated_successfully': {
    en: 'Wishlist updated successfully',
    ar: 'تم تحديث قائمة الرغبات بنجاح'
  },
  'failed_update_wishlist': {
    en: 'Failed to update wishlist',
    ar: 'فشل في تحديث قائمة الرغبات'
  },
  'wishlist_deleted_successfully': {
    en: 'Wishlist deleted successfully',
    ar: 'تم حذف قائمة الرغبات بنجاح'
  },
  'failed_delete_wishlist': {
    en: 'Failed to delete wishlist',
    ar: 'فشل في حذف قائمة الرغبات'
  },
  'product_not_approved': {
    en: 'Product is not approved',
    ar: 'المنتج غير معتمد'
  },

  // Admin Review Management Messages
  'review_created_successfully': {
    en: 'Review created successfully',
    ar: 'تم إنشاء التقييم بنجاح'
  },
  'failed_create_review': {
    en: 'Failed to create review',
    ar: 'فشل في إنشاء التقييم'
  },
  'review_updated_successfully': {
    en: 'Review updated successfully',
    ar: 'تم تحديث التقييم بنجاح'
  },
  'failed_update_review': {
    en: 'Failed to update review',
    ar: 'فشل في تحديث التقييم'
  },
  'review_deleted_successfully': {
    en: 'Review deleted successfully',
    ar: 'تم حذف التقييم بنجاح'
  },
  'failed_delete_review': {
    en: 'Failed to delete review',
    ar: 'فشل في حذف التقييم'
  },
  'review_rejected_successfully': {
    en: 'Review rejected successfully',
    ar: 'تم رفض التقييم بنجاح'
  },
  'failed_reject_review': {
    en: 'Failed to reject review',
    ar: 'فشل في رفض التقييم'
  },
  'review_already_rejected': {
    en: 'Review is already rejected',
    ar: 'التقييم مرفوض بالفعل'
  },
  'rejection_reason_required': {
    en: 'Rejection reason is required',
    ar: 'سبب الرفض مطلوب'
  },
  'invalid_rating': {
    en: 'Invalid rating. Must be between 1 and 5',
    ar: 'تقييم غير صحيح. يجب أن يكون بين 1 و 5'
  },

  // Admin Address Management Messages
  'address_created_successfully': {
    en: 'Address created successfully',
    ar: 'تم إنشاء العنوان بنجاح'
  },
  'failed_create_address': {
    en: 'Failed to create address',
    ar: 'فشل في إنشاء العنوان'
  },
  'address_updated_successfully': {
    en: 'Address updated successfully',
    ar: 'تم تحديث العنوان بنجاح'
  },
  'failed_update_address': {
    en: 'Failed to update address',
    ar: 'فشل في تحديث العنوان'
  },
  'address_deleted_successfully': {
    en: 'Address deleted successfully',
    ar: 'تم حذف العنوان بنجاح'
  },
  'failed_delete_address': {
    en: 'Failed to delete address',
    ar: 'فشل في حذف العنوان'
  },

  // Admin Order Management Messages
  'order_created_successfully': {
    en: 'Order created successfully',
    ar: 'تم إنشاء الطلب بنجاح'
  },
  'failed_create_order': {
    en: 'Failed to create order',
    ar: 'فشل في إنشاء الطلب'
  },
  'order_updated_successfully': {
    en: 'Order updated successfully',
    ar: 'تم تحديث الطلب بنجاح'
  },
  'failed_update_order': {
    en: 'Failed to update order',
    ar: 'فشل في تحديث الطلب'
  },
  'order_deleted_successfully': {
    en: 'Order deleted successfully',
    ar: 'تم حذف الطلب بنجاح'
  },
  'failed_delete_order': {
    en: 'Failed to delete order',
    ar: 'فشل في حذف الطلب'
  },
  'invalid_order_items': {
    en: 'Invalid order items format',
    ar: 'تنسيق عناصر الطلب غير صحيح'
  },
  'invalid_order_item': {
    en: 'Invalid order item. Product and quantity are required',
    ar: 'عنصر طلب غير صحيح. المنتج والكمية مطلوبان'
  },
  'invalid_action': {
    en: 'Invalid action. Must be "add" or "remove"',
    ar: 'إجراء غير صحيح. يجب أن يكون "إضافة" أو "إزالة"'
  },

  // Admin Verification Management Messages
  'email_already_verified': {
    en: 'Email is already verified',
    ar: 'البريد الإلكتروني مُتحقق منه بالفعل'
  },
  'email_verified_successfully': {
    en: 'Email verified successfully',
    ar: 'تم التحقق من البريد الإلكتروني بنجاح'
  },
  'failed_verify_email': {
    en: 'Failed to verify email',
    ar: 'فشل في التحقق من البريد الإلكتروني'
  },
  'email_not_verified': {
    en: 'Email is not verified',
    ar: 'البريد الإلكتروني غير مُتحقق منه'
  },
  'email_unverified_successfully': {
    en: 'Email unverified successfully',
    ar: 'تم إلغاء التحقق من البريد الإلكتروني بنجاح'
  },
  'failed_unverify_email': {
    en: 'Failed to unverify email',
    ar: 'فشل في إلغاء التحقق من البريد الإلكتروني'
  },
  'phone_already_verified': {
    en: 'Phone is already verified',
    ar: 'الهاتف مُتحقق منه بالفعل'
  },
  'phone_verified_successfully': {
    en: 'Phone verified successfully',
    ar: 'تم التحقق من الهاتف بنجاح'
  },
  'failed_verify_phone': {
    en: 'Failed to verify phone',
    ar: 'فشل في التحقق من الهاتف'
  },
  'phone_not_verified': {
    en: 'Phone is not verified',
    ar: 'الهاتف غير مُتحقق منه'
  },
  'phone_unverified_successfully': {
    en: 'Phone unverified successfully',
    ar: 'تم إلغاء التحقق من الهاتف بنجاح'
  },
  'failed_unverify_phone': {
    en: 'Failed to unverify phone',
    ar: 'فشل في إلغاء التحقق من الهاتف'
  },
  'user_has_no_phone': {
    en: 'User has no phone number',
    ar: 'المستخدم ليس لديه رقم هاتف'
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