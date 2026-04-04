# Sublytics API Documentation

## Overview
The Sublytics API is a RESTful API for managing customers, invoices, and subscriptions. All API requests must include a valid Bearer token obtained through authentication.

**Base URL**: `http://localhost:3000/api/v1` (development)

## Interactive Documentation
Visit `/api-docs` in your browser for interactive Swagger UI documentation with the ability to test endpoints directly.

## Authentication

### Get Access Token
**Endpoint**: `POST /api/v1/auth`

Exchange your company credentials for a JWT access token.

**Request Body**:
```json
{
  "company_id": "your-company-id",
  "company_secret": "your-company-secret"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "30m",
  "token_type": "Bearer"
}
```

**Usage**:
Include the token in subsequent requests:
```
Authorization: Bearer <token>
```

---

## Customers

### Create Customer
**Endpoint**: `POST /api/v1/customers`

Create a new customer record.

**Request Body**:
```json
{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-0100",
  "company": "Acme Corp",
  "address": "123 Main St",
  "city": "San Francisco",
  "country": "US",
  "notes": "Enterprise customer"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0100",
    "company": "Acme Corp",
    "address": "123 Main St",
    "city": "San Francisco",
    "country": "US",
    "notes": "Enterprise customer",
    "is_active": true,
    "created_at": "2026-04-05T10:30:00Z",
    "updated_at": "2026-04-05T10:30:00Z"
  }
}
```

### Get Customer by ID
**Endpoint**: `GET /api/v1/customers/{id}`

Retrieve a single customer by their ID.

**Parameters**:
- `id` (path, required): Customer UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    ...
  }
}
```

---

## Invoices

### Get All Invoices
**Endpoint**: `GET /api/v1/invoices`

Retrieve all invoices with optional currency conversion using ROE (Rate of Exchange).

**Query Parameters**:
- `currency` (optional): 3-letter currency code (e.g., EUR, GBP, JPY). Defaults to system currency (USD).

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "invoice_number": "INV-2026-123456",
      "customer_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "draft",
      "subtotal": 149.00,
      "tax_amount": 14.90,
      "discount_amount": 7.45,
      "total": 156.45,
      "currency": "EUR",
      "original_currency": "USD",
      "original_total": 155.71,
      "items": [...],
      "customer": {...}
    }
  ],
  "conversion": {
    "from_currency": "USD",
    "to_currency": "EUR",
    "roe_rate": 0.92,
    "currency_name": "Euro"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid currency code format
```json
{
  "success": false,
  "error": {
    "code": 400,
    "type": "BadRequest",
    "message": "Invalid currency code. Must be a 3-letter code (e.g., USD, EUR, GBP)"
  }
}
```

- **404 Not Found**: Currency not found in ROE table
```json
{
  "success": false,
  "error": {
    "code": 404,
    "type": "NotFound",
    "message": "Currency 'XYZ' not found or inactive in ROE table"
  }
}
```

**Example Usage**:
```bash
# Get invoices in system currency (USD)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/invoices

# Get invoices converted to EUR
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/invoices?currency=EUR

# Get invoices converted to GBP
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/invoices?currency=GBP
```

### Create Invoice
**Endpoint**: `POST /api/v1/invoices`

Create a new invoice with line items.

**Request Body**:
```json
{
  "customer_id": "550e8400-e29b-41d4-a716-446655440000",
  "subscription_id": "660e8400-e29b-41d4-a716-446655440001",
  "due_date": "2026-05-05",
  "issue_date": "2026-04-05",
  "tax_percent": 10,
  "discount_percent": 5,
  "currency": "USD",
  "notes": "Monthly subscription invoice",
  "items": [
    {
      "product_id": "770e8400-e29b-41d4-a716-446655440002",
      "description": "Professional Plan - Monthly",
      "quantity": 1,
      "unit_price": 99.00
    },
    {
      "description": "Additional Users (x5)",
      "quantity": 5,
      "unit_price": 10.00
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "invoice_number": "INV-2026-123456",
    "customer_id": "550e8400-e29b-41d4-a716-446655440000",
    "subscription_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "draft",
    "issue_date": "2026-04-05",
    "due_date": "2026-05-05",
    "subtotal": 149.00,
    "tax_percent": 10,
    "tax_amount": 14.16,
    "discount_percent": 5,
    "discount_amount": 7.45,
    "total": 155.71,
    "currency": "USD",
    "notes": "Monthly subscription invoice",
    "items": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "product_id": "770e8400-e29b-41d4-a716-446655440002",
        "description": "Professional Plan - Monthly",
        "quantity": 1,
        "unit_price": 99.00,
        "total": 99.00,
        "product": {
          "name": "Professional Plan",
          "sku": "PLAN-PRO"
        }
      },
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440005",
        "product_id": null,
        "description": "Additional Users (x5)",
        "quantity": 5,
        "unit_price": 10.00,
        "total": 50.00,
        "product": null
      }
    ],
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Corporation",
      "email": "contact@acme.com"
    }
  }
}
```

### Get Invoice by ID
**Endpoint**: `GET /api/v1/invoices/{id}`

Retrieve a single invoice with all details including line items.

**Parameters**:
- `id` (path, required): Invoice UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "invoice_number": "INV-2026-123456",
    "customer_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "draft",
    "total": 155.71,
    "items": [...],
    "customer": {...}
  }
}
```

### Download Invoice PDF
**Endpoint**: `GET /api/v1/invoices/{id}/pdf`

Download a professionally formatted invoice as a PDF file.

**Parameters**:
- `id` (path, required): Invoice UUID

**Response** (200 OK):
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="invoice-INV-2026-123456.pdf"`
- Binary PDF file

**Example**:
```bash
curl -o invoice.pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/invoices/{invoice-id}/pdf
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": 400,
    "type": "BadRequest",
    "message": "Detailed error message"
  }
}
```

### Common Error Codes
- **400 Bad Request**: Invalid input parameters
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: API key is inactive
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists (e.g., duplicate email)
- **500 Server Error**: Internal server error

---

## Example Usage

### Node.js Example

```javascript
const COMPANY_ID = 'your-company-id';
const COMPANY_SECRET = 'your-company-secret';
const API_BASE_URL = 'http://localhost:3000/api/v1';

// 1. Authenticate
async function authenticate() {
  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_id: COMPANY_ID,
      company_secret: COMPANY_SECRET
    })
  });
  const data = await response.json();
  return data.token;
}

// 2. Create Customer
async function createCustomer(token) {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      company: 'Acme Corp',
      city: 'San Francisco',
      country: 'US'
    })
  });
  return await response.json();
}

// 3. Create Invoice
async function createInvoice(token, customerId) {
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      customer_id: customerId,
      due_date: '2026-05-05',
      tax_percent: 10,
      currency: 'USD',
      items: [
        {
          description: 'Professional Plan',
          quantity: 1,
          unit_price: 99.00
        }
      ]
    })
  });
  return await response.json();
}

// Usage
(async () => {
  const token = await authenticate();
  const customer = await createCustomer(token);
  const invoice = await createInvoice(token, customer.data.id);
  console.log('Invoice created:', invoice);
})();
```

### cURL Example

```bash
# 1. Authenticate
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"company_id":"your-id","company_secret":"your-secret"}' \
  | jq -r '.token')

# 2. Create Customer
CUSTOMER=$(curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Acme Corp",
    "email": "contact@acme.com"
  }')

# 3. Get Customer
CUSTOMER_ID=$(echo $CUSTOMER | jq -r '.data.id')
curl http://localhost:3000/api/v1/customers/$CUSTOMER_ID \
  -H "Authorization: Bearer $TOKEN"

# 4. Create Invoice
curl -X POST http://localhost:3000/api/v1/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"due_date\": \"2026-05-05\",
    \"tax_percent\": 10,
    \"items\": [
      {
        \"description\": \"Professional Plan\",
        \"quantity\": 1,
        \"unit_price\": 99.00
      }
    ]
  }"
```

---

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Authentication**: 10 requests per minute per IP
- **Other endpoints**: 100 requests per minute per token

When rate limit is exceeded, you'll receive a 429 Too Many Requests response.

---

## Support

For API support or questions:
- Email: api-support@sublytics.io
- Documentation: Visit `/api-docs` for interactive Swagger UI
- GitHub: [github.com/sublytics/api](https://github.com/sublytics/api)
