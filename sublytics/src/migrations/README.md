# Sublytics Database Migrations

This folder contains SQL migration files for setting up the Sublytics database in Supabase.

## Migration Files

### 1. `001_initial_setup.sql`
**Initial Database Setup** - Creates all tables, indexes, triggers, and basic RLS configuration.

Run this first in your Supabase SQL Editor.

### 2. `002_rls_policies.sql`
**Comprehensive RLS Policies** - Fixes authentication issues and provides proper Row Level Security.

**IMPORTANT:** Run this file to fix login authentication issues!

### 3. `003a_system_admin_step1.sql` & `003b_system_admin_step2.sql`
**Add SYSTEM_ADMIN Role** - Creates a super admin role that cannot be modified.

**IMPORTANT:** These MUST be run in 2 steps due to PostgreSQL enum constraints:
1. First run `003a_system_admin_step1.sql` 
2. Then run `003b_system_admin_step2.sql`

### 4. `004_rate_limiting.sql`
**Rate Limiting & Security System** - Prevents brute force attacks and tracks authentication attempts.

**Features:**
- Tracks all login attempts (IP, email, user agent, timestamp)
- Auto-blocks IPs after 5 failed attempts in 15 minutes
- Manual IP blocking by SYSTEM_ADMIN
- Dashboard visible only to SYSTEM_ADMIN
- 30-day attempt history retention

**Configuration:**
- Max failed attempts: 5 in 15 minutes
- Auto-block duration: 60 minutes
- Permanent blocks available for persistent threats

Run this file to enable rate limiting and security monitoring.

### 5. `005_email_verification_tracking.sql`
**Email Verification & Invite Management** - Tracks invitation status and enables fault-tolerant invites.

**Features:**
- `email_verified` - Tracks if user has completed password setup
- `invited_at` - Timestamp of first invitation
- `invited_by` - Admin who sent the invitation
- `last_invite_sent_at` - Timestamp of last invite resend
- Allows re-inviting users who haven't completed setup
- Separates active staff from pending invitations
- Enables invite cancellation for unverified users

**Benefits:**
- Fault tolerance: Resend invites if email fails
- Clear separation between active and pending users
- Track invitation history and responsible admin
- Prevent duplicate invites for verified users

Run this file to enable advanced invitation tracking.

## How to Apply Migrations

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Run Initial Setup (if not done already)
1. Copy the contents of `001_initial_setup.sql`
2. Paste into the SQL Editor
3. Click **Run** or press `Ctrl+Enter`
4. Wait for completion message

### Step 3: Apply RLS Policies (CRITICAL FOR LOGIN)
1. Copy the contents of `002_rls_policies.sql`
2. Paste into the SQL Editor
3. Click **Run** or press `Ctrl+Enter`
4. You should see: "RLS Policies successfully created and configured!"

### Step 4: Verify Setup
Run this query to check if RLS is properly configured:
```sql
SELECT 
  schemaname, 
  tablename, 
  policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

You should see multiple policies for each table including "Service role has full access..." policies.

## What the RLS Policies Fix

### Problem
- ❌ "Invalid email or password" error when trying to log in
- ❌ RLS blocking queries before authentication completes
- ❌ Circular dependency with user profile checks

### Solution
- ✅ Service role (admin client) has full access for server-side operations
- ✅ Authentication flow works properly
- ✅ Proper role-based access control after login
- ✅ Users can only see their own data, managers/admins see all

## Key Features of RLS Policies

### Service Role Access
All tables have a policy allowing full access to the service role:
```sql
CREATE POLICY "Service role has full access to [table]"
  ON public.[table]
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

This allows server-side operations (like login verification) to bypass RLS.

### Helper Functions
Three security definer functions for clean policy definitions:
- `is_admin()` - Checks if current user is an admin
- `is_manager_or_admin()` - Checks if current user is manager or admin
- `is_active_user()` - Checks if current user is active

### Access Levels
- **Viewers**: Read-only access to most data
- **Staff**: Read-only access to most data
- **Managers**: Full CRUD on customers, products, subscriptions, invoices, quotations
- **Admins**: Full CRUD on everything including user management

## Environment Variables Required

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

⚠️ **IMPORTANT**: The `SUPABASE_SERVICE_ROLE_KEY` is required for server-side authentication to work!

## Troubleshooting

### Still getting "Invalid email or password"?
1. Verify `002_rls_policies.sql` was run successfully
2. Check that `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
3. Restart your Next.js dev server: `bun run dev`
4. Clear browser cache and try again

### Can't see data after login?
1. Check your user's role in the `user_profiles` table
2. Verify the user's `is_active` field is `true`
3. Check if RLS policies are enabled: 
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

### Need to reset everything?
Run `001_initial_setup.sql` again, then `002_rls_policies.sql`.

## Seeding Admin User

After applying migrations, create an admin user:

```bash
bun run seed
```

Or visit: `http://localhost:3000/api/seed-admin`

Default credentials (from `.env.local`):
- Email: `admin@sublytics.com`
- Password: `Admin@123456`

The seed script automatically creates a SYSTEM_ADMIN user with role protection.

## Rate Limiting Dashboard

After applying migration `004_rate_limiting.sql`, SYSTEM_ADMIN users can access the Security dashboard:

**URL**: `http://localhost:3000/security`

**Features:**
- View authentication attempt statistics (last 24 hours)
- Monitor recent login attempts with IP addresses
- Manage blocked IPs (view, block, unblock)
- See auto-blocked IPs from failed login attempts

**Access**: Only users with `SYSTEM_ADMIN` role can view this dashboard.

---

**Last Updated**: Migration 004 - Rate Limiting & Security System
