# Customer Integration Between Projects

## Overview
The AI Studio project now automatically creates and links customers in the main Sublytics API when users log in.

## Architecture

### Database Schema (AI Studio)
```sql
-- Migration 002: Add customer integration fields to staff_users
ALTER TABLE staff_users ADD COLUMN customer_id UUID;
ALTER TABLE staff_users ADD COLUMN customer_email TEXT;
ALTER TABLE staff_users ADD COLUMN customer_synced_at TIMESTAMPTZ;
```

### Flow

1. **User Logs In** → `app/auth/callback/route.ts`
   - User completes authentication
   - System checks if `customer_id` exists

2. **Customer Sync** → `lib/customer-sync.ts`
   - If no `customer_id`, calls V1 API `/customers` endpoint
   - Creates customer with user's email
   - Stores returned `customer_id` in `staff_users` table

3. **Subscription Creation**
   - Use `getCurrentUserCustomerId()` from `lib/get-customer.ts`
   - Pass `customer_id` when creating subscriptions via V1 API

## API Integration

### Authentication Flow
```typescript
// 1. Authenticate with V1 API
POST /api/v1/auth
{
  "company_id": process.env.DEFAULT_COMPANY_ID,
  "company_secret": process.env.DEFAULT_COMPANY_SECRET
}
// Returns: { success: true, token: "jwt_token" }

// 2. Create Customer
POST /api/v1/customers
Headers: { Authorization: "Bearer jwt_token" }
{
  "name": "User Name",
  "email": "user@example.com",
  "notes": "Created from AI Studio login"
}
// Returns: { success: true, data: { id: "uuid", ... } }
```

### Environment Variables
```env
# Server-side only (no NEXT_PUBLIC_ prefix)
API_BASE_URL=http://localhost:3000/api/v1
DEFAULT_COMPANY_ID=company_default
DEFAULT_COMPANY_SECRET=your-secure-company-secret-here
```

## Usage Examples

### Get Customer ID for Current User
```typescript
import { getCurrentUserCustomerId } from '@/lib/get-customer';

async function createSubscription() {
  const customerId = await getCurrentUserCustomerId();
  
  if (!customerId) {
    throw new Error('User must be logged in');
  }

  // Use customerId to create subscription via V1 API
  const response = await fetch(`${apiUrl}/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer_id: customerId,
      plan_id: selectedPlanId,
      // ... other fields
    }),
  });
}
```

### Get Full User with Customer Info
```typescript
import { getCurrentUserWithCustomer } from '@/lib/get-customer';

async function MyComponent() {
  const { user, customer_id, customer_email, customer_synced_at } = 
    await getCurrentUserWithCustomer();

  if (!customer_id) {
    return <div>Syncing your account...</div>;
  }

  // Show subscription options
}
```

## Security

✅ **Secure:**
- Company credentials stored server-side only (no `NEXT_PUBLIC_` prefix)
- API calls happen on the server
- Customer sync runs in background (non-blocking)

✅ **Automatic:**
- Customer created on first login
- No manual sync needed
- Transparent to users

## Revalidation

- Plans: Every 12 hours (43200 seconds)
- Customer sync: Once per user (cached in database)
- Auth token: Fresh for each API call (30-minute validity)

## Troubleshooting

### Customer Not Syncing
```bash
# Check server logs for:
🔄 [Auth Callback] Syncing customer for user: user@example.com
✅ [Customer Sync] User linked to customer: customer-uuid
```

### API Authentication Failed
```bash
# Verify environment variables are set:
- DEFAULT_COMPANY_ID
- DEFAULT_COMPANY_SECRET
- API_BASE_URL
```

### Customer ID Not Found
```typescript
// User may need to log out and log back in
// Or manually trigger sync:
import { syncCustomerForUser } from '@/lib/customer-sync';

await syncCustomerForUser(userId, userEmail, userName);
```

## Migration Commands

```bash
# Run migration on AI Studio database
psql -U postgres -d sublytics_ai_studio -f src/migrations/002_add_customer_integration.sql
```
