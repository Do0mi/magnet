# API v1 Documentation

## Overview
This document provides comprehensive API documentation for the Magnet e-commerce platform's v1 endpoints. The API is organized into three main sections: User, Business, and Dashboard routes.

**Base URL:** `/api/v1`

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control
- **Customer**: Regular users who can browse products, place orders, and manage their profile
- **Business**: Business users who can manage their products, view their orders, and handle reviews
- **Admin/Employee**: Administrative users with full system access

---

## 🔐 User Routes (`/api/v1/user`)

### Authentication (`/api/v1/user/auth`)

#### Register User
- **POST** `/api/v1/user/auth/register`
- **Description**: Register a new customer account
- **Authentication**: None required
- **Body**:
  ```json
  {
    "firstname": "string",
    "lastname": "string", 
    "email": "string",
    "phone": "string",
    "password": "string",
    "country": "string",
    "language": "string"
  }
  ```

#### Business Registration
- **POST** `/api/v1/user/auth/business-register`
- **Description**: Register a business user (goes under review)
- **Authentication**: None required
- **Body**:
  ```json
  {
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "phone": "string",
    "password": "string",
    "crNumber": "string",
    "vatNumber": "string",
    "companyName": "string",
    "companyType": "string",
    "country": "string",
    "city": "string",
    "district": "string",
    "streetName": "string"
  }
  ```

#### Login
- **POST** `/api/v1/user/auth/login`
- **Description**: Authenticate user with email/phone and password
- **Authentication**: None required
- **Body**:
  ```json
  {
    "identifier": "string (email or phone)",
    "password": "string"
  }
  ```

#### Send Email OTP
- **POST** `/api/v1/user/auth/send-email-otp`
- **Description**: Send OTP verification code to email
- **Authentication**: None required
- **Body**:
  ```json
  {
    "email": "string"
  }
  ```

#### Send Phone OTP
- **POST** `/api/v1/user/auth/send-phone-otp`
- **Description**: Send OTP verification code to phone
- **Authentication**: None required
- **Body**:
  ```json
  {
    "phone": "string"
  }
  ```

#### Confirm OTP
- **POST** `/api/v1/user/auth/confirm-otp`
- **Description**: Verify OTP code
- **Authentication**: None required
- **Body**:
  ```json
  {
    "identifier": "string (email or phone)",
    "otp": "string"
  }
  ```

#### Login with OTP
- **POST** `/api/v1/user/auth/login-with-otp`
- **Description**: Login using OTP instead of password
- **Authentication**: None required
- **Body**:
  ```json
  {
    "identifier": "string (email or phone)"
  }
  ```

#### Confirm Login OTP
- **POST** `/api/v1/user/auth/confirm-login-otp`
- **Description**: Complete OTP login process
- **Authentication**: None required
- **Body**:
  ```json
  {
    "identifier": "string (email or phone)",
    "otp": "string"
  }
  ```

#### Change Password
- **POST** `/api/v1/user/password`
- **Description**: Change user password
- **Authentication**: Required (Customer)
- **Body**:
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```

### Profile (`/api/v1/user/profile`)

#### Get Profile
- **GET** `/api/v1/user/profile`
- **Description**: Get current customer profile
- **Authentication**: Required (Customer)

#### Update Profile
- **PUT** `/api/v1/user/profile`
- **Description**: Update current customer profile
- **Authentication**: Required (Customer)
- **Body**:
  ```json
  {
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "phone": "string",
    "country": "string",
    "language": "string"
  }
  ```

### Products (`/api/v1/user/products`)

#### Get All Products
- **GET** `/api/v1/user/products`
- **Description**: Get all approved and allowed products
- **Authentication**: Public (Optional auth)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `category` (optional): Filter by category
  - `search` (optional): Search term
  - `minPrice` (optional): Minimum price filter
  - `maxPrice` (optional): Maximum price filter
  - `sortBy` (optional): Sort field (default: createdAt)
  - `sortOrder` (optional): Sort order (default: desc)

#### Get Product by ID
- **GET** `/api/v1/user/products/:id`
- **Description**: Get specific product details
- **Authentication**: Public (Optional auth)

### Orders (`/api/v1/user/orders`)

#### Get All Orders
- **GET** `/api/v1/user/orders`
- **Description**: Get all customer's orders
- **Authentication**: Required (Customer)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `status` (optional): Filter by order status

#### Get Order by ID
- **GET** `/api/v1/user/orders/:id`
- **Description**: Get specific customer's order
- **Authentication**: Required (Customer)

#### Create Order
- **POST** `/api/v1/user/orders`
- **Description**: Create a new order
- **Authentication**: Required (Customer)
- **Body**:
  ```json
  {
    "items": [
      {
        "productId": "string",
        "quantity": "number",
        "price": "number"
      }
    ],
    "shippingAddress": "string",
    "paymentMethod": "string",
    "notes": "string"
  }
  ```

#### Update Order
- **PUT** `/api/v1/user/orders/order/:id`
- **Description**: Update existing order
- **Authentication**: Required (Customer)
- **Body**:
  ```json
  {
    "items": "array",
    "shippingAddress": "string",
    "paymentMethod": "string",
    "notes": "string"
  }
  ```

#### Cancel Order
- **PUT** `/api/v1/user/orders/order/:id/cancel`
- **Description**: Cancel order before shipment
- **Authentication**: Required (Customer)

### Addresses (`/api/v1/user/addresses`)

#### Get All Addresses
- **GET** `/api/v1/user/addresses`
- **Description**: Get all customer's addresses
- **Authentication**: Required (Customer)

#### Get Address by ID
- **GET** `/api/v1/user/addresses/:id`
- **Description**: Get specific customer's address
- **Authentication**: Required (Customer)

#### Create Address
- **POST** `/api/v1/user/addresses/address`
- **Description**: Create a new address
- **Authentication**: Required (Customer)
- **Body**:
  ```json
  {
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string",
    "isDefault": "boolean"
  }
  ```

#### Update Address
- **PUT** `/api/v1/user/addresses/:id`
- **Description**: Update existing address
- **Authentication**: Required (Customer)
- **Body**:
  ```json
  {
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string",
    "isDefault": "boolean"
  }
  ```

#### Delete Address
- **DELETE** `/api/v1/user/addresses/:id`
- **Description**: Delete existing address
- **Authentication**: Required (Customer)

### Wishlists (`/api/v1/user/wishlists`)

#### Get Wishlist
- **GET** `/api/v1/user/wishlists`
- **Description**: Get customer's wishlist
- **Authentication**: Required (Customer)

#### Toggle Wishlist Item
- **PUT** `/api/v1/user/wishlist`
- **Description**: Add product if not exists, remove if exists
- **Authentication**: Required (Customer)
- **Body**:
  ```json
  {
    "productId": "string"
  }
  ```

### Reviews

#### Add Review
- **POST** `/api/v1/user/products/:id/reviews`
- **Description**: Add a review to a product
- **Authentication**: Required (Customer)
- **Body**:
  ```json
  {
    "rating": "number (1-5)",
    "comment": "string"
  }
  ```

- **GET** `/api/v1/user/products/:id/reviews`
- **Description**: Get all reviews for a specific product
- **Authentication**: Required (Customer)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page

- **DELETE** `/api/v1/user/products/:id/reviews/:reviewId`
- **Description**: Delete a review (only own reviews)
- **Authentication**: Required (Customer)

---

## 🏢 Business Routes (`/api/v1/business`)

### Products (`/api/v1/business/products`)

#### Get Business Products
- **GET** `/api/v1/business/products`
- **Description**: Get all products belonging to the business user
- **Authentication**: Required (Business)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `status` (optional): Filter by product status
  - `search` (optional): Search term

#### Get Product by ID
- **GET** `/api/v1/business/products/:id`
- **Description**: Get specific product details
- **Authentication**: Required (Business)

#### Create Product
- **POST** `/api/v1/business/products/product`
- **Description**: Create a new product
- **Authentication**: Required (Business)
- **Body**:
  ```json
  {
    "code": "string",
    "category": "string",
    "name": {
      "en": "string",
      "ar": "string"
    },
    "description": {
      "en": "string",
      "ar": "string"
    },
    "unit": {
      "en": "string",
      "ar": "string"
    },
    "minOrder": "number",
    "pricePerUnit": "number",
    "stock": "number",
    "images": "array",
    "customFields": "array",
    "attachments": "array"
  }
  ```

#### Update Product
- **PUT** `/api/v1/business/products/product/:id`
- **Description**: Update existing product
- **Authentication**: Required (Business)
- **Body**:
  ```json
  {
    "code": "string",
    "category": "string",
    "name": {
      "en": "string",
      "ar": "string"
    },
    "description": {
      "en": "string",
      "ar": "string"
    },
    "unit": {
      "en": "string",
      "ar": "string"
    },
    "minOrder": "number",
    "pricePerUnit": "number",
    "stock": "number",
    "images": "array",
    "customFields": "array",
    "attachments": "array",
    "status": "string"
  }
  ```

#### Delete Product
- **DELETE** `/api/v1/business/products/product/:id`
- **Description**: Delete product
- **Authentication**: Required (Business)

#### Toggle Product
- **PUT** `/api/v1/business/products/product/:id/toggle`
- **Description**: Toggle allow/disallow product
- **Authentication**: Required (Business)

### Orders (`/api/v1/business/orders`)

#### Get Business Orders
- **GET** `/api/v1/business/orders`
- **Description**: Get orders containing business user's products only
- **Authentication**: Required (Business)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `status` (optional): Filter by order status

#### Get Order by ID
- **GET** `/api/v1/business/orders/:id`
- **Description**: Get specific order containing business products
- **Authentication**: Required (Business)

### Reviews (`/api/v1/business/reviews`)

#### Get Business Reviews
- **GET** `/api/v1/business/reviews`
- **Description**: Get all reviews for business user's products
- **Authentication**: Required (Business)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `productId` (optional): Filter by product

#### Get Review by ID
- **GET** `/api/v1/business/reviews/:id`
- **Description**: Get specific review details
- **Authentication**: Required (Business)

### Profile (`/api/v1/business/profile`)

#### Get Business Profile
- **GET** `/api/v1/business/profile`
- **Description**: Get business user profile
- **Authentication**: Required (Business)

#### Update Business Profile
- **PUT** `/api/v1/business/profile`
- **Description**: Update business user profile
- **Authentication**: Required (Business)
- **Body**:
  ```json
  {
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "phone": "string",
    "businessName": "string",
    "businessType": "string",
    "businessDescription": "string",
    "country": "string",
    "language": "string"
  }
  ```

---

## 📊 Dashboard Routes (`/api/v1/dashboard`)

*All dashboard routes require Admin or Employee authentication*

### Users (`/api/v1/dashboard/users`)

#### Get All Users
- **GET** `/api/v1/dashboard/users`
- **Description**: Get all users with pagination and filtering
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `role` (optional): Filter by user role
  - `search` (optional): Search term
  - `isAllowed` (optional): Filter by allowed status

#### Get User by ID
- **GET** `/api/v1/dashboard/users/:id`
- **Description**: Get specific user details
- **Authentication**: Required (Admin/Employee)

#### Create User
- **POST** `/api/v1/dashboard/users/user`
- **Description**: Create a new user
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "phone": "string",
    "password": "string",
    "role": "string",
    "country": "string",
    "language": "string",
    "crNumber": "string (required if role is business)",
    "vatNumber": "string (required if role is business)",
    "companyName": "string (required if role is business)",
    "companyType": "string (required if role is business)",
    "city": "string (required if role is business)",
    "district": "string (required if role is business)",
    "streetName": "string (required if role is business)",
    "accessPages": {
      "dashboard": "boolean (for admin/employee)",
      "analytics": "boolean (for admin/employee)",
      "users": "boolean (for admin/employee)",
      "products": "boolean (for admin/employee)",
      "orders": "boolean (for admin/employee)",
      "reviews": "boolean (for admin/employee)",
      "wishlists": "boolean (for admin/employee)",
      "categories": "boolean (for admin/employee)",
      "addresses": "boolean (for admin/employee)"
    }
  }
  ```

#### Update User
- **PUT** `/api/v1/dashboard/users/user/:id`
- **Description**: Update existing user (supports all fields based on user role)
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    // Basic user fields
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "phone": "string",
    "role": "string",
    "country": "string",
    "language": "string",
    "imageUrl": "string",
    "isAllowed": "boolean",
    "isEmailVerified": "boolean",
    "isPhoneVerified": "boolean",
    
    // Business specific fields (for business users)
    "crNumber": "string",
    "vatNumber": "string",
    "companyName": "string",
    "companyType": "string",
    "city": "string",
    "district": "string",
    "streetName": "string",
    "approvalStatus": "string (pending/approved/rejected)",
    "rejectionReason": "string",
    
    // Access pages (for admin/employee users)
    "accessPages": {
      "dashboard": "boolean",
      "analytics": "boolean",
      "users": "boolean",
      "products": "boolean",
      "orders": "boolean",
      "reviews": "boolean",
      "wishlists": "boolean",
      "categories": "boolean",
      "addresses": "boolean"
    },
    
    // Disallow fields (for customer users)
    "disallowReason": "string"
  }
  ```

#### Toggle User
- **PUT** `/api/v1/dashboard/users/user/:id/toggle`
- **Description**: Toggle user allow/disallow status
- **Authentication**: Required (Admin/Employee)
- **Body** (when disallowing user):
  ```json
  {
    "disallowReason": "string (required when disallowing user)"
  }
  ```
- **Body** (when allowing user):
  ```json
  {}
  ```

#### Delete User
- **DELETE** `/api/v1/dashboard/users/user/:id`
- **Description**: Delete user
- **Authentication**: Required (Admin/Employee)

### Products (`/api/v1/dashboard/products`)

#### Get All Products
- **GET** `/api/v1/dashboard/products`
- **Description**: Get all products with pagination and filtering
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `category` (optional): Filter by category
  - `status` (optional): Filter by approval status
  - `search` (optional): Search term

#### Get Product by ID
- **GET** `/api/v1/dashboard/products/:id`
- **Description**: Get specific product details
- **Authentication**: Required (Admin/Employee)

#### Create Product
- **POST** `/api/v1/dashboard/products/product`
- **Description**: Create product for specific business user
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "code": "string",
    "category": "string",
    "name": {
      "en": "string",
      "ar": "string"
    },
    "description": {
      "en": "string",
      "ar": "string"
    },
    "unit": {
      "en": "string",
      "ar": "string"
    },
    "minOrder": "number",
    "pricePerUnit": "number",
    "stock": "number",
    "images": "array",
    "customFields": "array",
    "attachments": "array"
  }
  ```

#### Update Product
- **PUT** `/api/v1/dashboard/products/product/:id`
- **Description**: Update product for specific business user
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "code": "string",
    "category": "string",
    "name": {
      "en": "string",
      "ar": "string"
    },
    "description": {
      "en": "string",
      "ar": "string"
    },
    "unit": {
      "en": "string",
      "ar": "string"
    },
    "minOrder": "number",
    "pricePerUnit": "number",
    "stock": "number",
    "images": "array",
    "customFields": "array",
    "attachments": "array",
    "status": "string"
  }
  ```

#### Delete Product
- **DELETE** `/api/v1/dashboard/products/product/:id`
- **Description**: Delete product
- **Authentication**: Required (Admin/Employee)

#### Approve Product
- **PUT** `/api/v1/dashboard/products/product/:id/approve`
- **Description**: Approve product
- **Authentication**: Required (Admin/Employee)

#### Decline Product
- **PUT** `/api/v1/dashboard/products/product/:id/decline`
- **Description**: Decline product
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "reason": "string"
  }
  ```

#### Toggle Product
- **PUT** `/api/v1/dashboard/products/product/:id/toggle`
- **Description**: Toggle allow/disallow product
- **Authentication**: Required (Admin/Employee)

#### Get Product Reviews
- **GET** `/api/v1/dashboard/products/:id/reviews`
- **Description**: Get all reviews for specific product
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page

#### Get Product Orders
- **GET** `/api/v1/dashboard/products/:id/orders`
- **Description**: Get all orders containing specific product
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page

#### Get Product Review by ID
- **GET** `/api/v1/dashboard/products/:productId/reviews/:reviewId`
- **Description**: Get specific product review
- **Authentication**: Required (Admin/Employee)

#### Get Product Order by ID
- **GET** `/api/v1/dashboard/products/:productId/orders/:orderId`
- **Description**: Get specific product order
- **Authentication**: Required (Admin/Employee)

### Categories (`/api/v1/dashboard/categories`)

#### Get All Categories
- **GET** `/api/v1/dashboard/categories`
- **Description**: Get all categories
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `search` (optional): Search term
  - `status` (optional): Filter by status (active/inactive)

#### Get Category by ID
- **GET** `/api/v1/dashboard/categories/:id`
- **Description**: Get specific category details
- **Authentication**: Required (Admin/Employee)

#### Create Category
- **POST** `/api/v1/dashboard/categories/category`
- **Description**: Create a new category
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "name": {
      "en": "string",
      "ar": "string"
    },
    "description": {
      "en": "string",
      "ar": "string"
    },
    "status": "string (active/inactive)"
  }
  ```

#### Update Category
- **PUT** `/api/v1/dashboard/categories/category/:id`
- **Description**: Update existing category
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "name": {
      "en": "string",
      "ar": "string"
    },
    "description": {
      "en": "string",
      "ar": "string"
    },
    "status": "string (active/inactive)"
  }
  ```

#### Delete Category
- **DELETE** `/api/v1/dashboard/categories/category/:id`
- **Description**: Delete category
- **Authentication**: Required (Admin/Employee)

#### Toggle Category
- **PUT** `/api/v1/dashboard/categories/category/:id/toggle`
- **Description**: Toggle allow/disallow category
- **Authentication**: Required (Admin/Employee)

### Orders (`/api/v1/dashboard/orders`)

#### Get All Orders
- **GET** `/api/v1/dashboard/orders`
- **Description**: Get all orders with pagination and filtering
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `status` (optional): Filter by order status
  - `userId` (optional): Filter by user

#### Get Order by ID
- **GET** `/api/v1/dashboard/orders/:id`
- **Description**: Get specific order details
- **Authentication**: Required (Admin/Employee)

#### Create Order
- **POST** `/api/v1/dashboard/orders/order`
- **Description**: Create order for specific user
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "userId": "string",
    "items": [
      {
        "productId": "string",
        "quantity": "number",
        "price": "number"
      }
    ],
    "shippingAddress": "string",
    "paymentMethod": "string"
  }
  ```

#### Update Order
- **PUT** `/api/v1/dashboard/orders/order/:id`
- **Description**: Update existing order
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "items": "array",
    "shippingAddress": "string",
    "paymentMethod": "string",
    "status": "string"
  }
  ```

#### Delete Order
- **DELETE** `/api/v1/dashboard/orders/order/:id`
- **Description**: Delete order
- **Authentication**: Required (Admin/Employee)

### Reviews (`/api/v1/dashboard/reviews`)

#### Get All Reviews
- **GET** `/api/v1/dashboard/reviews`
- **Description**: Get all reviews with pagination and filtering
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `productId` (optional): Filter by product
  - `userId` (optional): Filter by user

#### Get Review by ID
- **GET** `/api/v1/dashboard/reviews/:id`
- **Description**: Get specific review details
- **Authentication**: Required (Admin/Employee)

#### Reject Review
- **PUT** `/api/v1/dashboard/reviews/review/:id`
- **Description**: Reject review
- **Authentication**: Required (Admin/Employee)

#### Delete Review
- **DELETE** `/api/v1/dashboard/reviews/review/:id`
- **Description**: Delete review
- **Authentication**: Required (Admin/Employee)

### Addresses (`/api/v1/dashboard/addresses`)

#### Get All Addresses
- **GET** `/api/v1/dashboard/addresses`
- **Description**: Get all addresses with pagination and filtering
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `userId` (optional): Filter by user

#### Get Address by ID
- **GET** `/api/v1/dashboard/addresses/:id`
- **Description**: Get specific address details
- **Authentication**: Required (Admin/Employee)

#### Create Address
- **POST** `/api/v1/dashboard/addresses/address`
- **Description**: Create address for specific user
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "userId": "string",
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string",
    "isDefault": "boolean"
  }
  ```

#### Update Address
- **PUT** `/api/v1/dashboard/addresses/address/:id`
- **Description**: Update existing address
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string",
    "isDefault": "boolean"
  }
  ```

#### Delete Address
- **DELETE** `/api/v1/dashboard/addresses/address/:id`
- **Description**: Delete address
- **Authentication**: Required (Admin/Employee)

### Wishlists (`/api/v1/dashboard/wishlists`)

#### Get All Wishlists
- **GET** `/api/v1/dashboard/wishlists`
- **Description**: Get all wishlists with pagination and filtering
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `userId` (optional): Filter by user

#### Get Wishlist by ID
- **GET** `/api/v1/dashboard/wishlists/:id`
- **Description**: Get specific wishlist details
- **Authentication**: Required (Admin/Employee)

#### Create Wishlist
- **POST** `/api/v1/dashboard/wishlists/wishlist`
- **Description**: Create wishlist for specific user
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "userId": "string",
    "productId": "string"
  }
  ```

#### Update Wishlist
- **PUT** `/api/v1/dashboard/wishlists/wishlist/:id`
- **Description**: Update existing wishlist
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "productId": "string"
  }
  ```

#### Delete Wishlist
- **DELETE** `/api/v1/dashboard/wishlists/wishlist/:id`
- **Description**: Delete wishlist
- **Authentication**: Required (Admin/Employee)

### Business Management (`/api/v1/dashboard/business`)

#### Get All Business Requests
- **GET** `/api/v1/dashboard/business/businesses`
- **Description**: Get all business registration requests
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `status` (optional): Filter by approval status

#### Get Business Request by ID
- **GET** `/api/v1/dashboard/business/businesses/:id`
- **Description**: Get specific business request details
- **Authentication**: Required (Admin/Employee)

#### Approve Business Request
- **PUT** `/api/v1/dashboard/business/approve`
- **Description**: Approve business registration request
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "businessId": "string"
  }
  ```

#### Decline Business Request
- **PUT** `/api/v1/dashboard/business/decline`
- **Description**: Decline business registration request
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "businessId": "string",
    "reason": "string"
  }
  ```

### Profile (`/api/v1/dashboard/profile`)

#### Get Admin Profile
- **GET** `/api/v1/dashboard/profile`
- **Description**: Get current admin/employee profile
- **Authentication**: Required (Admin/Employee)

#### Update Admin Profile
- **PUT** `/api/v1/dashboard/profile`
- **Description**: Update current admin/employee profile
- **Authentication**: Required (Admin/Employee)
- **Body**:
  ```json
  {
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "phone": "string",
    "country": "string",
    "language": "string"
  }
  ```

### Statistics (`/api/v1/dashboard/stats`)

#### Get User Statistics
- **GET** `/api/v1/dashboard/stats/users`
- **Description**: Get comprehensive user statistics
- **Authentication**: Required (Admin/Employee)
- **Response**:
  ```json
  {
    "totalUsers": "number",
    "customers": "number",
    "businesses": "number",
    "admins": "number",
    "employees": "number",
    "allowedUsers": "number",
    "disallowedUsers": "number",
    "recentUsers": "number"
  }
  ```

#### Get Order Statistics
- **GET** `/api/v1/dashboard/stats/orders`
- **Description**: Get comprehensive order statistics and revenue data
- **Authentication**: Required (Admin/Employee)
- **Response**:
  ```json
  {
    "totalOrders": "number",
    "pendingOrders": "number",
    "confirmedOrders": "number",
    "processingOrders": "number",
    "shippedOrders": "number",
    "deliveredOrders": "number",
    "cancelledOrders": "number",
    "refundedOrders": "number",
    "totalRevenue": "number",
    "recentOrders": "number"
  }
  ```

#### Get Product Statistics
- **GET** `/api/v1/dashboard/stats/products`
- **Description**: Get comprehensive product statistics and category breakdown
- **Authentication**: Required (Admin/Employee)
- **Response**:
  ```json
  {
    "totalProducts": "number",
    "approvedProducts": "number",
    "pendingProducts": "number",
    "declinedProducts": "number",
    "averagePrice": "number",
    "productsByCategory": "array",
    "recentProducts": "number"
  }
  ```

#### Get Review Statistics
- **GET** `/api/v1/dashboard/stats/reviews`
- **Description**: Get comprehensive review statistics and rating breakdown
- **Authentication**: Required (Admin/Employee)
- **Response**:
  ```json
  {
    "totalReviews": "number",
    "approvedReviews": "number",
    "pendingReviews": "number",
    "rejectedReviews": "number",
    "averageRating": "number",
    "reviewsByRating": "array",
    "recentReviews": "number"
  }
  ```

#### Get General Statistics
- **GET** `/api/v1/dashboard/stats/general`
- **Description**: Get overall platform statistics and recent activity
- **Authentication**: Required (Admin/Employee)
- **Response**:
  ```json
  {
    "overview": {
      "totalUsers": "number",
      "totalProducts": "number",
      "totalOrders": "number",
      "totalReviews": "number",
      "totalWishlists": "number",
      "totalAddresses": "number",
      "totalRevenue": "number"
    },
    "recentActivity": {
      "recentUsers": "number",
      "recentProducts": "number",
      "recentOrders": "number",
      "recentReviews": "number"
    }
  }
  ```

---

## Response Format

All API responses follow a consistent format and return both English and Arabic languages by default:

### Bilingual Response Format
All endpoints now automatically return both English and Arabic content without requiring the `lang=both` parameter. Bilingual fields are structured as:
```json
{
  "fieldName": {
    "en": "English content",
    "ar": "المحتوى العربي"
  }
}
```

### Standard Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "pagination": {
    // Pagination info (when applicable)
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "limit": 10
  }
}
```

### Product Response Format

Product objects in responses include the following bilingual fields:

#### All Products
```json
{
  "id": "string",
  "code": "string",
  "name": {
    "en": "string",
    "ar": "string"
  },
  "description": {
    "en": "string",
    "ar": "string"
  },
  "category": {
    "en": "string",
    "ar": "string"
  },
  "unit": {
    "en": "string",
    "ar": "string"
  },
  "minOrder": "number",
  "pricePerUnit": "number",
  "stock": "number",
  "images": "array",
  "customFields": "array",
  "attachments": "array",
  "rating": "number",
  "status": "string",
  "isAllowed": "boolean",
  "owner": {
    "id": "string",
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "businessInfo": {
      "companyName": "string"
    }
  },
  "approvedBy": {
    "id": "string",
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "role": "string"
  },
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Category Response Format

Category objects in responses include the following bilingual fields:

#### All Categories
```json
{
  "id": "string",
  "name": {
    "en": "string",
    "ar": "string"
  },
  "description": {
    "en": "string",
    "ar": "string"
  },
  "status": "string (active/inactive)",
  "createdBy": {
    "id": "string",
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "role": "string"
  },
  "createdAt": "string",
  "updatedAt": "string"
}
```

### User Response Format

User objects in responses include the following fields:

#### All Users
```json
{
  "id": "string",
  "firstname": "string",
  "lastname": "string",
  "email": "string",
  "phone": "string",
  "role": "string",
  "country": "string",
  "language": "string",
  "imageUrl": "string",
  "isAllowed": "boolean",
  "createdAt": "string",
  "updatedAt": "string",
  "isEmailVerified": "boolean",
  "isPhoneVerified": "boolean",
  "allowedBy": {
    "id": "string",
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "role": "string"
  },
  "allowedAt": "string",
  "disallowReason": "string",
  "disallowedBy": {
    "id": "string",
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "role": "string"
  },
  "disallowedAt": "string"
}
```

#### Business Users (Additional Fields)
```json
{
  // ... all user fields above
  "businessInfo": {
    "crNumber": "string",
    "vatNumber": "string",
    "companyName": "string",
    "companyType": "string",
    "address": {
      "city": "string",
      "district": "string",
      "streetName": "string"
    },
    "approvalStatus": "string",
    "approvedBy": {
      "id": "string",
      "firstname": "string",
      "lastname": "string",
      "email": "string",
      "role": "string"
    },
    "approvedAt": "string",
    "rejectedBy": {
      "id": "string",
      "firstname": "string",
      "lastname": "string",
      "email": "string",
      "role": "string"
    },
    "rejectedAt": "string",
    "rejectionReason": "string"
  }
}
```

#### Admin/Employee Users (Additional Fields)
```json
{
  // ... all user fields above
  "accessPages": {
    "dashboard": "boolean",
    "analytics": "boolean",
    "users": "boolean",
    "products": "boolean",
    "orders": "boolean",
    "reviews": "boolean",
    "wishlists": "boolean",
    "categories": "boolean",
    "addresses": "boolean"
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

## Status Codes

- **200**: OK - Request successful
- **201**: Created - Resource created successfully
- **400**: Bad Request - Invalid request data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **500**: Internal Server Error - Server error

## Rate Limiting

API endpoints are subject to rate limiting to ensure fair usage and system stability. Rate limits may vary by endpoint and user role.

## Support

For API support and questions, please contact the development team or refer to the internal documentation.
