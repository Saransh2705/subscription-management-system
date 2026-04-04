# Authentication Flow

## Overview
This application uses Supabase for authentication with two different login methods:

1. **Password-based login** (for seed admin users)
2. **Magic link login** (for regular staff users)

## Environment Variables
Required in `.env.local` (see `.env.example`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=secure_password_here
```

## Seed Admin Login Flow

### 1. Initial Login
- User enters email and password on `/login` page
- If credentials match `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`:
  - System checks if user exists in Supabase Auth
  - If not, automatically creates the user account
  - Creates/updates `staff_users` record with:
    - `role: "ADMIN"`
    - `is_active: true`
    - `must_change_password: true`
  - User is signed in automatically

### 2. Password Reset Redirect
- After successful seed login, user is redirected to `/reset-password`
- User must set a new password (minimum 8 characters)
- Passwords are validated and must match

### 3. Final Redirect to Dashboard
- After password reset, `must_change_password` flag is set to `false`
- User is redirected to `/staff` (admin dashboard)

## Regular Staff Login Flow

### 1. Magic Link Request
- User enters email only on `/login` page (no password)
- System checks if email exists in `staff_users` table
- If active, sends magic link to email

### 2. Magic Link Click
- User clicks link in email
- Auth callback handles token exchange
- Checks `must_change_password` flag:
  - If `true`: redirects to `/reset-password`
  - If `false`: redirects to dashboard

## Security Features

### Edge Case Handling
1. **Duplicate User Prevention**: Checks if user exists before creating
2. **Invalid Credentials**: Returns appropriate error messages
3. **Inactive Accounts**: Rejects login for inactive staff users
4. **Unauthorized Access**: Only staff users in `staff_users` table can login

### Password Requirements
- Minimum 8 characters
- Passwords must match during reset
- Seed password should be changed on first login

## API Endpoints

### POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "optional_password"
}
```

**Response (Seed Login):**
```json
{
  "ok": true,
  "requirePasswordReset": true
}
```

**Response (Magic Link):**
```json
{
  "ok": true,
  "magicLinkSent": true
}
```

### GET `/auth/callback`
Handles OAuth callback and session exchange.
Checks `must_change_password` and redirects accordingly.

### POST `/api/auth/password-updated`
Updates `must_change_password` flag to `false` after successful password reset.

## Testing the Flow

### Test Seed Admin Login:
1. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env.local`
2. Navigate to `/login`
3. Enter seed email and password
4. Should redirect to `/reset-password`
5. Set new password
6. Should redirect to `/staff`

### Test Magic Link Login:
1. Navigate to `/login`
2. Enter authorized staff email (no password)
3. Check email for magic link
4. Click link
5. Should redirect to dashboard

## Database Schema

### `staff_users` table:
```sql
{
  id: uuid (references auth.users)
  email: text
  role: text (ADMIN | STAFF)
  is_active: boolean
  must_change_password: boolean
  created_at: timestamp
  updated_at: timestamp
}
```
