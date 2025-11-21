# Postman Testing Guide - Applicants Endpoints
# دليل اختبار Postman - نقاط نهاية المتقدمين

## Base URL
```
http://localhost:5000
```
(Replace with your server URL if different)

---

## 1. POST - Submit Application (User Endpoint)
### Submit an application with CV - لا يتطلب مصادقة

**Endpoint:** `POST /api/v1/user/applicants`

**Method:** `POST`

**URL:** `http://localhost:5000/api/v1/user/applicants`

**Headers:**
```
None required (No authentication needed)
```

**Body:**
- Select: `form-data`
- Add the following fields:

| Key | Type | Value | Description |
|-----|------|-------|-------------|
| `name` | Text | `Ahmed Ali` | Applicant's full name |
| `age` | Text | `25` | Applicant's age (1-150) |
| `gender` | Text | `male` or `female` | Gender |
| `cv` | File | [Select PDF file] | CV file (PDF only, max 10MB) |

**Example Request:**
```
POST http://localhost:5000/api/v1/user/applicants
Content-Type: multipart/form-data

Form Data:
  name: "Ahmed Ali"
  email: "ahmed@example.com"
  age: 25
  gender: male
  cv: [Select a PDF file]
```

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "applicant": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "age": 25,
      "gender": "male",
      "status": "pending",
      "hasCV": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": {
    "en": "Application submitted successfully",
    "ar": "تم تقديم الطلب بنجاح"
  }
}
```

**Error Responses:**
- `400` - Missing required fields, invalid email/age/gender, or CV not PDF
- `500` - Server error

**Note:** An email notification will be sent to the applicant confirming that their application has been received and is under review.

---

## 2. POST - Add Applicant (Dashboard Endpoint)
### Add/Submit an application with CV - يتطلب مصادقة Admin/Employee

**Endpoint:** `POST /api/v1/dashboard/applicants`

**Method:** `POST`

**URL:** `http://localhost:5000/api/v1/dashboard/applicants`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
- Select: `form-data`
- Add the following fields:

| Key | Type | Value | Description |
|-----|------|-------|-------------|
| `name` | Text | `Sara Ahmed` | Applicant's full name |
| `email` | Text | `sara@example.com` | Applicant's email address |
| `age` | Text | `28` | Applicant's age (1-150) |
| `gender` | Text | `female` or `male` | Gender |
| `cv` | File | [Select PDF file] | CV file (PDF only, max 10MB) |

**Example Request:**
```
POST http://localhost:5000/api/v1/dashboard/applicants
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
  name: "Sara Ahmed"
  email: "sara@example.com"
  age: 28
  gender: female
  cv: [Select a PDF file]
```

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "applicant": {
      "id": "507f1f77bcf86cd799439012",
        "name": "Sara Ahmed",
        "email": "sara@example.com",
        "age": 28,
        "gender": "female",
        "status": "pending",
      "hasCV": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": {
    "en": "Application submitted successfully",
    "ar": "تم تقديم الطلب بنجاح"
  }
}
```

**Error Responses:**
- `400` - Missing required fields, invalid email/age/gender, or CV not PDF
- `401` - No token or invalid token
- `403` - Insufficient permissions (not admin/employee)
- `500` - Server error

**Note:** An email notification will be sent to the applicant confirming that their application has been received and is under review.

---

## 3. GET - Get All Applicants (Dashboard Endpoint)
### Get paginated list of applicants - يتطلب مصادقة Admin/Employee

**Endpoint:** `GET /api/v1/dashboard/applicants`

**Method:** `GET`

**URL:** `http://localhost:5000/api/v1/dashboard/applicants`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Query Parameters (Optional):**
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `page` | Number | `1` | Page number (default: 1) |
| `limit` | Number | `10` | Items per page (default: 10) |
| `status` | String | `pending` | Filter by status: pending, accepted, rejected |
| `search` | String | `Ahmed` | Search by name |

**Example URLs:**
```
http://localhost:5000/api/v1/dashboard/applicants
http://localhost:5000/api/v1/dashboard/applicants?page=1&limit=10
http://localhost:5000/api/v1/dashboard/applicants?status=pending
http://localhost:5000/api/v1/dashboard/applicants?search=Ahmed&page=1&limit=5
```

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "applicants": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Ahmed Ali",
        "email": "ahmed@example.com",
        "age": 25,
        "gender": "male",
        "status": "pending",
        "hasCV": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalApplicants": 1,
      "limit": 10
    }
  }
}
```

**Error Responses:**
- `401` - No token or invalid token
- `403` - Insufficient permissions (not admin/employee)
- `500` - Server error

---

## 4. GET - Get Applicant by ID (Dashboard Endpoint)
### Get specific applicant details - يتطلب مصادقة Admin/Employee

**Endpoint:** `GET /api/v1/dashboard/applicants/:id`

**Method:** `GET`

**URL:** `http://localhost:5000/api/v1/dashboard/applicants/507f1f77bcf86cd799439011`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Path Parameters:**
- `:id` - Applicant ID (replace with actual ID from step 1)

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "applicant": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Ahmed Ali",
      "age": 25,
      "gender": "male",
      "status": "pending",
      "hasCV": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` - No token or invalid token
- `403` - Insufficient permissions
- `404` - Applicant not found
- `500` - Server error

---

## 5. GET - Download Applicant CV (Dashboard Endpoint)
### Download the CV PDF file - يتطلب مصادقة Admin/Employee

**Endpoint:** `GET /api/v1/dashboard/applicants/:id/cv`

**Method:** `GET`

**URL:** `http://localhost:5000/api/v1/dashboard/applicants/507f1f77bcf86cd799439011/cv`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Path Parameters:**
- `:id` - Applicant ID

**Response:**
- Content-Type: `application/pdf`
- File download with filename: `{applicant_name}_CV.pdf`

**In Postman:**
1. Send the request
2. Click "Send and Download" to save the PDF file
3. Or view the binary response

**Error Responses:**
- `401` - No token or invalid token
- `403` - Insufficient permissions
- `404` - Applicant or CV not found
- `500` - Server error

---

## 6. PUT - Update Applicant Status (Dashboard Endpoint)
### Update applicant status (pending/accepted/rejected) - يتطلب مصادقة Admin/Employee

**Endpoint:** `PUT /api/v1/dashboard/applicants/:id/status`

**Method:** `PUT`

**URL:** `http://localhost:5000/api/v1/dashboard/applicants/507f1f77bcf86cd799439011/status`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (raw JSON):**

**For Accepted Status:**
```json
{
  "status": "accepted"
}
```

**For Rejected Status (rejectionReason is required):**
```json
{
  "status": "rejected",
  "rejectionReason": "Insufficient experience for this position"
}
```

**For Pending Status:**
```json
{
  "status": "pending"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "applicant": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "age": 25,
      "gender": "male",
      "status": "accepted",
      "hasCV": true,
      "reviewedAt": "2024-01-15T11:00:00.000Z",
      "reviewedBy": {
        "id": "507f191e810c19729de860ea",
        "firstname": "Admin",
        "lastname": "User",
        "email": "admin@example.com",
        "role": "admin"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  },
  "message": {
    "en": "Applicant status updated successfully",
    "ar": "تم تحديث حالة المتقدم بنجاح"
  }
}
```

**Note:** 
- When status is changed to `accepted`, an email will be sent to the applicant informing them that the team will contact them soon.
- When status is changed to `rejected`, an apology email will be sent to the applicant with the rejection reason.

**Error Responses:**
- `400` - Invalid status or missing rejectionReason for rejected status
- `401` - No token or invalid token
- `403` - Insufficient permissions
- `404` - Applicant not found
- `500` - Server error

---

## 7. DELETE - Delete Applicant (Dashboard Endpoint)
### Delete an applicant - يتطلب مصادقة Admin/Employee

**Endpoint:** `DELETE /api/v1/dashboard/applicants/:id`

**Method:** `DELETE`

**URL:** `http://localhost:5000/api/v1/dashboard/applicants/507f1f77bcf86cd799439011`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Path Parameters:**
- `:id` - Applicant ID

**Success Response (200):**
```json
{
  "status": "success",
  "data": null,
  "message": {
    "en": "Applicant deleted successfully",
    "ar": "تم حذف المتقدم بنجاح"
  }
}
```

**Error Responses:**
- `401` - No token or invalid token
- `403` - Insufficient permissions
- `404` - Applicant not found
- `500` - Server error

---

## How to Get JWT Token for Dashboard Endpoints

1. **Login as Admin/Employee** using your auth endpoint
2. Copy the `token` from the response
3. In Postman, add header:
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

**Example Login Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

---

## Postman Collection Setup Tips

### 1. Create Environment Variables
- `base_url`: `http://localhost:5000`
- `jwt_token`: Your JWT token
- `applicant_id`: Applicant ID from POST response

### 2. Use Variables in Requests
```
{{base_url}}/api/v1/user/applicants
{{base_url}}/api/v1/dashboard/applicants/{{applicant_id}}
```

### 3. For File Upload (POST)
1. Select `Body` tab
2. Choose `form-data`
3. For `cv` field, change type from "Text" to "File"
4. Click "Select Files" and choose a PDF

### 4. Test Flow
1. **POST** `/api/v1/user/applicants` - Submit application (no auth) - Public endpoint
2. **POST** `/api/v1/dashboard/applicants` - Add applicant (with auth) - Admin/Employee only
3. Copy the `applicant.id` from response
4. **GET** `/api/v1/dashboard/applicants` - List all (with auth)
5. **GET** `/api/v1/dashboard/applicants/:id` - Get details (with auth)
6. **GET** `/api/v1/dashboard/applicants/:id/cv` - Download CV (with auth)
7. **PUT** `/api/v1/dashboard/applicants/:id/status` - Update status (with auth)
8. **DELETE** `/api/v1/dashboard/applicants/:id` - Delete (with auth)

---

## Common Issues

### File Upload Issues
- Make sure CV field type is "File" not "Text"
- File must be PDF format
- Max file size: 10MB
- Field name must be exactly `cv`

### Authentication Issues
- Token must be in format: `Bearer YOUR_TOKEN`
- Token might expire - login again to get new token
- Must be admin or magnet_employee role

### Status Update Issues
- When status is `rejected`, `rejectionReason` is required
- Valid statuses: `pending`, `accepted`, `rejected`

