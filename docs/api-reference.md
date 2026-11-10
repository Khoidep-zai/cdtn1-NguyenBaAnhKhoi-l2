# API Reference — Mekong Mobile L2

Examples captured through real local HTTP requests at 2026-11-09T10:43:03.048Z. Credentials are redacted; account-list examples omit unrelated users. Binary examples report their actual byte count.

Authentication uses the `mekong_session` cookie, not a URL token. All business APIs require an active account. Branch-scoped ticket access is enforced on the server. API timestamps are ISO strings. Ticket/customer operations currently use the in-memory prototype store; account management and service-center lookup use PostgreSQL. Restarting the process can discard in-memory mutations.

Reproduce examples with `NODE_ENV=test node scripts/capture-api-evidence.js` against a prepared test database, then `node scripts/build-api-reference.js`. Temporary account fixtures are removed on completion.

## GET /health

### 1. Method and path

`GET /health`

### 2. Business purpose

Check whether the application is running.

### 3. Authentication and authorization

Public route; no authenticated session required.

### 4. Parameters and request

No request body.

### 5. Successful response

HTTP 200. 

```json
{
  "status": "ok"
}
```

### 6. Error responses

No business-specific error response.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## GET /health/db

### 1. Method and path

`GET /health/db`

### 2. Business purpose

Check database connectivity without disclosing connection details.

### 3. Authentication and authorization

Public route; no authenticated session required.

### 4. Parameters and request

No request body.

### 5. Successful response

HTTP 200. 

```json
{
  "status": "ok",
  "database": {
    "connected": true
  },
  "requestId": "8c45d244-bca7-4e23-b718-fd2b26bc0027"
}
```

### 6. Error responses

503 database unavailable, with only a boolean connection status.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## POST /api/auth/login

### 1. Method and path

`POST /api/auth/login`

### 2. Business purpose

Authenticate a user and issue an HttpOnly session cookie.

### 3. Authentication and authorization

Public route; no authenticated session required.

### 4. Parameters and request

| Field | Type / constraints |
|---|---|
| username | String, 3–80 letters/digits/dot/underscore/hyphen; required for login/create. |
| password | String; maximum 128; create/update minimum 12 in production, 6 outside production; never sent in URL. |

Captured request (sensitive values redacted):

```json
{
  "username": "evidence_a7343314106a",
  "password": "[REDACTED temporary test password]"
}
```

### 5. Successful response

HTTP 200. 

```json
{
  "data": {
    "id": "320",
    "username": "evidence_a7343314106a",
    "name": "Evidence temporary user",
    "phone": "",
    "role": "QUAN_LY_HE_THONG",
    "roleLabel": "Quản lý hệ thống",
    "branchId": null,
    "branchName": "Toàn hệ thống",
    "isActive": true,
    "avatar": "TU",
    "canViewAllCenters": true,
    "canManageStaff": true,
    "canManageAllAccounts": true,
    "canOverrideSla": true,
    "canReassignTechnician": true
  }
}
```

### 6. Error responses

401 invalid credentials; 429 too many login attempts; 500/503 infrastructure failure.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## GET /api/auth/me

### 1. Method and path

`GET /api/auth/me`

### 2. Business purpose

Read the current user and effective permissions.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

No request body.

### 5. Successful response

HTTP 200. 

```json
{
  "data": {
    "id": "320",
    "username": "evidence_a7343314106a",
    "name": "Evidence temporary user",
    "phone": "",
    "role": "QUAN_LY_HE_THONG",
    "roleLabel": "Quản lý hệ thống",
    "branchId": null,
    "branchName": "Toàn hệ thống",
    "isActive": true,
    "avatar": "TU",
    "canViewAllCenters": true,
    "canManageStaff": true,
    "canManageAllAccounts": true,
    "canOverrideSla": true,
    "canReassignTechnician": true
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## PATCH /api/auth/profile

### 1. Method and path

`PATCH /api/auth/profile`

### 2. Business purpose

Update the current user profile.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

| Field | Type / constraints |
|---|---|
| full_name | String; required for profile/create; account names 2–120 characters. |
| phone | Customer phone: normalized Vietnamese mobile number; profile phone is optional, maximum 20 characters. |

Captured request (sensitive values redacted):

```json
{
  "full_name": "Evidence User",
  "phone": ""
}
```

### 5. Successful response

HTTP 200. 

```json
{
  "data": {
    "id": "320",
    "username": "evidence_a7343314106a",
    "name": "Evidence User",
    "phone": "",
    "role": "QUAN_LY_HE_THONG",
    "roleLabel": "Quản lý hệ thống",
    "branchId": null,
    "branchName": "Toàn hệ thống",
    "isActive": true,
    "avatar": "EU",
    "canViewAllCenters": true,
    "canManageStaff": true,
    "canManageAllAccounts": true,
    "canOverrideSla": true,
    "canReassignTechnician": true
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## POST /api/auth/users

### 1. Method and path

`POST /api/auth/users`

### 2. Business purpose

List or create accounts within the caller role and branch scope.

### 3. Authentication and authorization

Valid session; branch manager or system manager. Branch restrictions still apply.

### 4. Parameters and request

| Field | Type / constraints |
|---|---|
| username | String, 3–80 letters/digits/dot/underscore/hyphen; required for login/create. |
| password | String; maximum 128; create/update minimum 12 in production, 6 outside production; never sent in URL. |
| full_name | String; required for profile/create; account names 2–120 characters. |
| role | NHAN_VIEN, QUAN_LY_CHI_NHANH, QUAN_LY_HE_THONG; branch managers cannot escalate roles. |
| center_id | Positive integer; required for non-system accounts; restricted to caller branch. |

Captured request (sensitive values redacted):

```json
{
  "username": "evidence_child_a7343314106a",
  "password": "[REDACTED temporary test password]",
  "full_name": "Evidence Staff",
  "role": "NHAN_VIEN",
  "center_id": 1
}
```

### 5. Successful response

HTTP 201. 

```json
{
  "data": {
    "id": "321",
    "username": "evidence_child_a7343314106a",
    "name": "Evidence Staff",
    "phone": "",
    "role": "NHAN_VIEN",
    "roleLabel": "Nhân viên tiếp nhận",
    "branchId": 1,
    "branchName": "Chi nhánh 01",
    "isActive": true,
    "avatar": "ES",
    "canViewAllCenters": false,
    "canManageStaff": false,
    "canManageAllAccounts": false,
    "canOverrideSla": false,
    "canReassignTechnician": false
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).

### 7. Special behavior and limits

Branch managers administer only branch staff. The last active system manager cannot be disabled or demoted. Existing accounts are never implicitly replaced by setup.

## PATCH /api/auth/users/{id}

### 1. Method and path

`PATCH /api/auth/users/{id}`

### 2. Business purpose

Update an account within the caller administrative scope.

### 3. Authentication and authorization

Valid session; branch manager or system manager. Branch restrictions still apply.

### 4. Parameters and request

`id`: required existing resource identifier in the path.

| Field | Type / constraints |
|---|---|
| full_name | String; required for profile/create; account names 2–120 characters. |

Captured request (sensitive values redacted):

```json
{
  "full_name": "Evidence Updated Staff"
}
```

### 5. Successful response

HTTP 200. 

```json
{
  "data": {
    "id": "321",
    "username": "evidence_child_a7343314106a",
    "name": "Evidence Updated Staff",
    "phone": "",
    "role": "NHAN_VIEN",
    "roleLabel": "Nhân viên tiếp nhận",
    "branchId": 1,
    "branchName": "Chi nhánh 01",
    "isActive": true,
    "avatar": "US",
    "canViewAllCenters": false,
    "canManageStaff": false,
    "canManageAllAccounts": false,
    "canOverrideSla": false,
    "canReassignTechnician": false
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).

### 7. Special behavior and limits

Branch managers administer only branch staff. The last active system manager cannot be disabled or demoted. Existing accounts are never implicitly replaced by setup.

## GET /api/auth/users

### 1. Method and path

`GET /api/auth/users`

### 2. Business purpose

List or create accounts within the caller role and branch scope.

### 3. Authentication and authorization

Valid session; branch manager or system manager. Branch restrictions still apply.

### 4. Parameters and request

No request body.

### 5. Successful response

HTTP 200. Unrelated account rows omitted

```json
{
  "data": [
    {
      "id": "320",
      "username": "evidence_a7343314106a",
      "name": "Evidence User",
      "phone": "",
      "role": "QUAN_LY_HE_THONG",
      "roleLabel": "Quản lý hệ thống",
      "branchId": null,
      "branchName": "Toàn hệ thống",
      "isActive": true,
      "avatar": "EU",
      "canViewAllCenters": true,
      "canManageStaff": true,
      "canManageAllAccounts": true,
      "canOverrideSla": true,
      "canReassignTechnician": true
    },
    {
      "id": "321",
      "username": "evidence_child_a7343314106a",
      "name": "Evidence Updated Staff",
      "phone": "",
      "role": "NHAN_VIEN",
      "roleLabel": "Nhân viên tiếp nhận",
      "branchId": 1,
      "branchName": "TTBH Quận 10",
      "isActive": true,
      "avatar": "US",
      "canViewAllCenters": false,
      "canManageStaff": false,
      "canManageAllAccounts": false,
      "canOverrideSla": false,
      "canReassignTechnician": false
    }
  ]
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

### 7. Special behavior and limits

Branch managers administer only branch staff. The last active system manager cannot be disabled or demoted. Existing accounts are never implicitly replaced by setup.

## GET /api/categories

### 1. Method and path

`GET /api/categories`

### 2. Business purpose

List incident categories.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

No request body.

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "total": 6,
  "data": [
    {
      "category_id": 1,
      "category_name": "MAN_HINH",
      "default_priority": "CAO",
      "is_active": true
    },
    {
      "category_id": 2,
      "category_name": "PIN",
      "default_priority": "TRUNG_BINH",
      "is_active": true
    },
    {
      "category_id": 3,
      "category_name": "SAC",
      "default_priority": "TRUNG_BINH",
      "is_active": true
    },
    {
      "category_id": 4,
      "category_name": "PHAN_MEM",
      "default_priority": "THAP",
      "is_active": true
    },
    {
      "category_id": 5,
      "category_name": "NUOC_VAO",
      "default_priority": "CAO",
      "is_active": true
    },
    {
      "category_id": 6,
      "category_name": "KHAC",
      "default_priority": "TRUNG_BINH",
      "is_active": true
    }
  ]
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## GET /api/centers

### 1. Method and path

`GET /api/centers`

### 2. Business purpose

List service centers.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

No request body.

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "total": 11,
  "data": [
    {
      "center_id": 1,
      "center_code": "TT01",
      "center_name": "TTBH Quận 10",
      "thanh_pho": "TP. Hồ Chí Minh"
    },
    {
      "center_id": 2,
      "center_code": "TT02",
      "center_name": "TTBH Quận Tân Bình",
      "thanh_pho": "TP. Hồ Chí Minh"
    },
    {
      "center_id": 3,
      "center_code": "TT03",
      "center_name": "TTBH TP. Thủ Đức",
      "thanh_pho": "TP. Hồ Chí Minh"
    },
    {
      "center_id": 4,
      "center_code": "TT04",
      "center_name": "TTBH Ninh Kiều",
      "thanh_pho": "Cần Thơ"
    },
    {
      "center_id": 5,
      "center_code": "TT05",
      "center_name": "TTBH Cái Răng",
      "thanh_pho": "Cần Thơ"
    },
    {
      "center_id": 6,
      "center_code": "TT06",
      "center_name": "TTBH Cầu Giấy",
      "thanh_pho": "Hà Nội"
    },
    {
      "center_id": 7,
      "center_code": "TT07",
      "center_name": "TTBH TP. Hồ Chí Minh",
      "thanh_pho": "TP. Hồ Chí Minh"
    },
    {
      "center_id": 8,
      "center_code": "TT08",
      "center_name": "TTBH Hà Nội",
      "thanh_pho": "Hà Nội"
    },
    {
      "center_id": 9,
      "center_code": "TT09",
      "center_name": "TTBH Nha Trang",
      "thanh_pho": "Nha Trang"
    },
    {
      "center_id": 10,
      "center_code": "TT10",
      "center_name": "TTBH Huế",
      "thanh_pho": "Huế"
    },
    {
      "center_id": 11,
      "center_code": "TT11",
      "center_name": "TTBH Cần Thơ",
      "thanh_pho": "Cần Thơ"
    }
  ]
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## GET /api/products

### 1. Method and path

`GET /api/products`

### 2. Business purpose

Search the product catalog.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

Optional query strings: `search`, `brand`, `phonesOnly` (true/1), `limit` (count or all).

No request body.

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "total": 320,
  "data": [
    {
      "product_id": 1,
      "product_code": "SS0001",
      "product_name": "Samsung Y2",
      "thuong_hieu": "Samsung",
      "nhom_san_pham": "Điện thoại phổ thông",
      "gia_niem_yet": 1890000,
      "warranty_months": 12
    }
  ]
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## POST /api/customers

### 1. Method and path

`POST /api/customers`

### 2. Business purpose

Look up or register a customer by normalized phone number.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

| Field | Type / constraints |
|---|---|
| full_name | String; required for profile/create; account names 2–120 characters. |
| phone | Customer phone: normalized Vietnamese mobile number; profile phone is optional, maximum 20 characters. |

Captured request (sensitive values redacted):

```json
{
  "full_name": "Synthetic Evidence Customer",
  "phone": "0920982963"
}
```

### 5. Successful response

HTTP 201. 

```json
{
  "success": true,
  "message": "Đăng ký hồ sơ khách hàng mới thành công.",
  "data": {
    "customer_id": 51282,
    "full_name": "Synthetic Evidence Customer",
    "phone": "0920982963",
    "raw_phone": "0920982963",
    "email": "",
    "address": "",
    "created_at": "2026-11-09"
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## GET /api/customers

### 1. Method and path

`GET /api/customers`

### 2. Business purpose

Look up or register a customer by normalized phone number.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

`phone`: required query string containing the customer phone.

No request body.

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "found": true,
  "data": {
    "customer_id": 51282,
    "full_name": "Synthetic Evidence Customer",
    "phone": "0920982963",
    "email": "",
    "address": "",
    "created_at": "2026-11-09",
    "devices": []
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## POST /api/tickets

### 1. Method and path

`POST /api/tickets`

### 2. Business purpose

List or receive warranty tickets within the caller branch scope.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

| Field | Type / constraints |
|---|---|
| customer_name | string; see the captured request below. |
| customer_phone | Required registered Vietnamese mobile phone. |
| product_name | string; see the captured request below. |
| serial_imei | Required serial: letters/digits/hyphens; must not have another open ticket. |
| issue_category_id | string; see the captured request below. |
| store_id | string; see the captured request below. |
| center_id | Positive integer; required for non-system accounts; restricted to caller branch. |
| issue_description | Required string, minimum 10 characters. |
| priority | CAO, TRUNG_BINH, THAP; default TRUNG_BINH. |

Captured request (sensitive values redacted):

```json
{
  "customer_name": "Synthetic Evidence Customer",
  "customer_phone": "0920982963",
  "product_name": "Evidence Device",
  "serial_imei": "EVID-a7343314106a",
  "issue_category_id": "1",
  "store_id": "STORE_01",
  "center_id": 1,
  "issue_description": "Synthetic device test issue",
  "priority": "TRUNG_BINH"
}
```

### 5. Successful response

HTTP 201. 

```json
{
  "success": true,
  "message": "Tạo phiếu bảo hành thành công.",
  "data": {
    "id": "TKT-8801",
    "ticket_id": 8801,
    "ticket_code": "BH-008801/2026",
    "customer_id": 51282,
    "customer_name": "Synthetic Evidence Customer",
    "customer_phone": "0920982963",
    "customer_address": "",
    "product_id": 1,
    "product_name": "Evidence Device",
    "serial_no": "EVID-a7343314106a",
    "serial_imei": "EVID-a7343314106a",
    "category_id": 1,
    "issue_category_id": "1",
    "center_id": 1,
    "store_id": "STORE_01",
    "issue_desc": "Synthetic device test issue",
    "issue_description": "Synthetic device test issue",
    "priority": "TRUNG_BINH",
    "status": "MOI",
    "is_warranty": false,
    "warranty_verified": false,
    "received_at": "2026-11-09T10:43:02.980Z",
    "due_date": "2026-11-12T10:43:02.980Z",
    "closed_at": null,
    "created_at": "2026-11-09T10:43:02.980Z",
    "updated_at": "2026-11-09T10:43:02.980Z"
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## GET /api/tickets

### 1. Method and path

`GET /api/tickets`

### 2. Business purpose

List or receive warranty tickets within the caller branch scope.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

Optional query fields: `status`, `center_id`, `store_id`, `q`, `page`, `limit`, `offset`. Branch staff cannot widen their scope by changing center_id. `overdue` is not implemented as a filter.

No request body.

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "data": [
    {
      "id": "TKT-8801",
      "ticket_id": 8801,
      "ticket_code": "BH-008801/2026",
      "customer_id": 51282,
      "customer_name": "Synthetic Evidence Customer",
      "customer_phone": "0920982963",
      "customer_address": "",
      "product_id": 1,
      "product_name": "Evidence Device",
      "serial_no": "EVID-a7343314106a",
      "serial_imei": "EVID-a7343314106a",
      "category_id": 1,
      "issue_category_id": "1",
      "center_id": 1,
      "store_id": "STORE_01",
      "issue_desc": "Synthetic device test issue",
      "issue_description": "Synthetic device test issue",
      "priority": "TRUNG_BINH",
      "status": "MOI",
      "is_warranty": false,
      "warranty_verified": false,
      "received_at": "2026-11-09T10:43:02.980Z",
      "due_date": "2026-11-12T10:43:02.980Z",
      "closed_at": null,
      "created_at": "2026-11-09T10:43:02.980Z",
      "updated_at": "2026-11-09T10:43:02.980Z"
    }
  ],
  "total": 7801,
  "summary": {
    "total": 7801,
    "new": 1,
    "processing": 1162,
    "urgent": 1162
  },
  "page": 1,
  "limit": 1,
  "totalPages": 7801,
  "offset": 0
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## GET /api/tickets/{id}

### 1. Method and path

`GET /api/tickets/{id}`

### 2. Business purpose

Read ticket details and status history.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

`id`: required existing resource identifier in the path.

No request body.

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "data": {
    "id": "TKT-8801",
    "ticket_id": 8801,
    "ticket_code": "BH-008801/2026",
    "customer_id": 51282,
    "customer_name": "Synthetic Evidence Customer",
    "customer_phone": "0920982963",
    "customer_address": "",
    "product_id": 1,
    "product_name": "Evidence Device",
    "serial_no": "EVID-a7343314106a",
    "serial_imei": "EVID-a7343314106a",
    "category_id": 1,
    "issue_category_id": "1",
    "center_id": 1,
    "store_id": "STORE_01",
    "issue_desc": "Synthetic device test issue",
    "issue_description": "Synthetic device test issue",
    "priority": "TRUNG_BINH",
    "status": "MOI",
    "is_warranty": false,
    "warranty_verified": false,
    "received_at": "2026-11-09T10:43:02.980Z",
    "due_date": "2026-11-12T10:43:02.980Z",
    "closed_at": null,
    "created_at": "2026-11-09T10:43:02.980Z",
    "updated_at": "2026-11-09T10:43:02.980Z",
    "status_history": [
      {
        "log_id": 1,
        "id": 1,
        "ticket_id": "TKT-8801",
        "from_status": null,
        "old_status": null,
        "to_status": "MOI",
        "new_status": "MOI",
        "changed_by": "evidence_a7343314106a",
        "updated_by": "evidence_a7343314106a",
        "note": "Khởi tạo phiếu tiếp nhận bảo hành mới tại quầy",
        "changed_at": "2026-11-09T10:43:02.980Z"
      }
    ]
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## PATCH /api/tickets/{id}/classify

### 1. Method and path

`PATCH /api/tickets/{id}/classify`

### 2. Business purpose

Change incident classification and recalculate the deadline.

### 3. Authentication and authorization

Valid session; branch manager or system manager. Branch restrictions still apply.

### 4. Parameters and request

`id`: required existing resource identifier in the path.

| Field | Type / constraints |
|---|---|
| issue_category_id | string; see the captured request below. |
| priority | CAO, TRUNG_BINH, THAP; default TRUNG_BINH. |

Captured request (sensitive values redacted):

```json
{
  "issue_category_id": "1",
  "priority": "CAO"
}
```

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "message": "Phân loại sự cố phiếu bảo hành thành công.",
  "data": {
    "id": "TKT-8801",
    "ticket_id": 8801,
    "ticket_code": "BH-008801/2026",
    "customer_id": 51282,
    "customer_name": "Synthetic Evidence Customer",
    "customer_phone": "0920982963",
    "customer_address": "",
    "product_id": 1,
    "product_name": "Evidence Device",
    "serial_no": "EVID-a7343314106a",
    "serial_imei": "EVID-a7343314106a",
    "category_id": 1,
    "issue_category_id": "1",
    "center_id": 1,
    "store_id": "STORE_01",
    "issue_desc": "Synthetic device test issue",
    "issue_description": "Synthetic device test issue",
    "priority": "CAO",
    "status": "MOI",
    "is_warranty": false,
    "warranty_verified": false,
    "received_at": "2026-11-09T10:43:02.980Z",
    "due_date": "2026-11-10T10:43:02.980Z",
    "closed_at": null,
    "created_at": "2026-11-09T10:43:02.980Z",
    "updated_at": "2026-11-09T10:43:03.002Z"
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## PATCH /api/tickets/{id}/service-consent

### 1. Method and path

`PATCH /api/tickets/{id}/service-consent`

### 2. Business purpose

Record consent to paid service for a new ticket.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

`id`: required existing resource identifier in the path.

| Field | Type / constraints |
|---|---|
| note | For consent/exception: required nonempty string, maximum 180 characters. |

Captured request (sensitive values redacted):

```json
{
  "note": "Synthetic customer consents"
}
```

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "data": {
    "id": "TKT-8801",
    "ticket_id": 8801,
    "ticket_code": "BH-008801/2026",
    "customer_id": 51282,
    "customer_name": "Synthetic Evidence Customer",
    "customer_phone": "0920982963",
    "customer_address": "",
    "product_id": 1,
    "product_name": "Evidence Device",
    "serial_no": "EVID-a7343314106a",
    "serial_imei": "EVID-a7343314106a",
    "category_id": 1,
    "issue_category_id": "1",
    "center_id": 1,
    "store_id": "STORE_01",
    "issue_desc": "Synthetic device test issue",
    "issue_description": "Synthetic device test issue",
    "priority": "CAO",
    "status": "MOI",
    "is_warranty": false,
    "warranty_verified": false,
    "received_at": "2026-11-09T10:43:02.980Z",
    "due_date": "2026-11-10T10:43:02.980Z",
    "closed_at": null,
    "created_at": "2026-11-09T10:43:02.980Z",
    "updated_at": "2026-11-09T10:43:03.008Z",
    "service_consent": true,
    "service_consent_by": "evidence_a7343314106a",
    "service_consent_at": "2026-11-09T10:43:03.008Z"
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## PATCH /api/tickets/{id}/warranty-exception

### 1. Method and path

`PATCH /api/tickets/{id}/warranty-exception`

### 2. Business purpose

Approve a warranty exception for a new ticket.

### 3. Authentication and authorization

Valid session; branch manager or system manager. Branch restrictions still apply.

### 4. Parameters and request

`id`: required existing resource identifier in the path.

| Field | Type / constraints |
|---|---|
| note | For consent/exception: required nonempty string, maximum 180 characters. |

Captured request (sensitive values redacted):

```json
{
  "note": "Synthetic manager approval"
}
```

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "data": {
    "id": "TKT-8801",
    "ticket_id": 8801,
    "ticket_code": "BH-008801/2026",
    "customer_id": 51282,
    "customer_name": "Synthetic Evidence Customer",
    "customer_phone": "0920982963",
    "customer_address": "",
    "product_id": 1,
    "product_name": "Evidence Device",
    "serial_no": "EVID-a7343314106a",
    "serial_imei": "EVID-a7343314106a",
    "category_id": 1,
    "issue_category_id": "1",
    "center_id": 1,
    "store_id": "STORE_01",
    "issue_desc": "Synthetic device test issue",
    "issue_description": "Synthetic device test issue",
    "priority": "CAO",
    "status": "MOI",
    "is_warranty": false,
    "warranty_verified": false,
    "received_at": "2026-11-09T10:43:02.980Z",
    "due_date": "2026-11-10T10:43:02.980Z",
    "closed_at": null,
    "created_at": "2026-11-09T10:43:02.980Z",
    "updated_at": "2026-11-09T10:43:03.014Z",
    "service_consent": true,
    "service_consent_by": "evidence_a7343314106a",
    "service_consent_at": "2026-11-09T10:43:03.008Z",
    "warranty_exception_approved": true
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

## PATCH /api/tickets/{id}/status

### 1. Method and path

`PATCH /api/tickets/{id}/status`

### 2. Business purpose

Advance the ticket lifecycle and append an audit record.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

`id`: required existing resource identifier in the path.

| Field | Type / constraints |
|---|---|
| status | Required supported lifecycle status; only permitted transitions accepted. |
| updated_by | Required by the current validator; effective actor is replaced by authenticated username. |

Captured request (sensitive values redacted):

```json
{
  "status": "DA_PHAN_CONG",
  "updated_by": "evidence_a7343314106a"
}
```

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "message": "Cập nhật trạng thái phiếu thành công.",
  "data": {
    "id": "TKT-8801",
    "ticket_id": 8801,
    "ticket_code": "BH-008801/2026",
    "customer_id": 51282,
    "customer_name": "Synthetic Evidence Customer",
    "customer_phone": "0920982963",
    "customer_address": "",
    "product_id": 1,
    "product_name": "Evidence Device",
    "serial_no": "EVID-a7343314106a",
    "serial_imei": "EVID-a7343314106a",
    "category_id": 1,
    "issue_category_id": "1",
    "center_id": 1,
    "store_id": "STORE_01",
    "issue_desc": "Synthetic device test issue",
    "issue_description": "Synthetic device test issue",
    "priority": "CAO",
    "status": "DA_PHAN_CONG",
    "is_warranty": false,
    "warranty_verified": false,
    "received_at": "2026-11-09T10:43:02.980Z",
    "due_date": "2026-11-10T10:43:02.980Z",
    "closed_at": null,
    "created_at": "2026-11-09T10:43:02.980Z",
    "updated_at": "2026-11-09T10:43:03.021Z",
    "service_consent": true,
    "service_consent_by": "evidence_a7343314106a",
    "service_consent_at": "2026-11-09T10:43:03.008Z",
    "warranty_exception_approved": true
  }
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).

### 7. Special behavior and limits

One-way lifecycle. Assignment requires verified warranty, approved exception or service consent. Handover requires a photo.

## PUT /api/tickets/{id}/handover-photo

### 1. Method and path

`PUT /api/tickets/{id}/handover-photo`

### 2. Business purpose

Read or upload handover evidence.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

`id`: required existing resource identifier in the path.

| Field | Type / constraints |
|---|---|
| binary | string; see the captured request below. |
| bytes | number; see the captured request below. |

Captured request (sensitive values redacted):

```json
{
  "binary": "image/png",
  "bytes": 68
}
```

### 5. Successful response

HTTP 200. 

```json
{
  "success": true,
  "message": "Đã lưu ảnh minh chứng bàn giao."
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).

404 no photo/resource; 409 ticket not ready for upload; 413 over 8 MB; 415 invalid/unsupported image.

### 7. Special behavior and limits

Upload raw JPEG/PNG/WebP bytes with the matching Content-Type. Successful reads return binary image data. A handover photo is required before DA_BAN_GIAO.

## GET /api/tickets/{id}/handover-photo

### 1. Method and path

`GET /api/tickets/{id}/handover-photo`

### 2. Business purpose

Read or upload handover evidence.

### 3. Authentication and authorization

Valid session; access is restricted by the current account and branch scope.

### 4. Parameters and request

`id`: required existing resource identifier in the path.

No request body.

### 5. Successful response

HTTP 200. 

```json
{
  "bytes": 68,
  "contentType": "image/png"
}
```

### 6. Error responses

401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.

404 no photo/resource; 409 ticket not ready for upload; 413 over 8 MB; 415 invalid/unsupported image.

### 7. Special behavior and limits

Upload raw JPEG/PNG/WebP bytes with the matching Content-Type. Successful reads return binary image data. A handover photo is required before DA_BAN_GIAO.

## POST /api/auth/logout

### 1. Method and path

`POST /api/auth/logout`

### 2. Business purpose

Clear the session cookie.

### 3. Authentication and authorization

Public route; no authenticated session required.

### 4. Parameters and request

No request body.

### 5. Successful response

HTTP 204. 

```json
{
  "bytes": 0,
  "contentType": ""
}
```

### 6. Error responses

No business-specific error response.

### 7. Special behavior and limits

Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.

