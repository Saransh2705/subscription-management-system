# Company API Keys Management

## View Current Credentials

To view your current company API credentials:

```bash
bun run show-api-keys
```

This will display:
- Company ID
- Company Secret
- Active/Inactive status
- Creation date

## Default Credentials

The system automatically creates default credentials on first run:

- **Company ID**: `company_default`
- **Company Secret**: Auto-generated secure random string

## Environment Variables

You can set custom default credentials in your `.env.local` file:

```env
DEFAULT_COMPANY_ID=your_company_id
DEFAULT_COMPANY_SECRET=your_secure_secret
```

## Using the API

### 1. Authenticate

```bash
POST /api/v1/auth
Content-Type: application/json

{
  "company_id": "company_default",
  "company_secret": "your-secret-here"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "30m",
  "token_type": "Bearer"
}
```

### 2. Use the Token

Include the token in subsequent API requests:

```bash
GET /api/v1/customers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Notes

- **Never commit** your company secret to version control
- Store credentials securely (use environment variables)
- Rotate secrets regularly  
- Set `is_active` to false to revoke access without deletion
- The company secret is shown only once during creation
