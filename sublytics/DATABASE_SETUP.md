# Database Setup Instructions

## 1. Run SQL Migration

Execute the SQL migration file in your Supabase SQL Editor:

File: `src/migrations/001_initial_setup.sql`

This will create:
- `user_profiles` table with RBAC
- `staff_invites` table
- Row Level Security policies
- Triggers for user management

## 2. Seed Admin User

After running the migration, seed the admin user by visiting:

```
http://localhost:3000/api/seed-admin
```

This will create the admin user with credentials from your `.env.local`:
- **Email**: As specified in `SEED_ADMIN_EMAIL`
- **Password**: As specified in `SEED_ADMIN_PASSWORD`

The admin user will:
- Have `ADMIN` role
- Be marked as active
- NOT require password change on first login

## 3. Verify Setup

1. Visit `http://localhost:3000/login`
2. Use the seed admin credentials to sign in via magic link
3. Navigate to `/staff` to manage users

## Environment Variables

Ensure your `.env.local` has all required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://oaevwxmazshakpcapmmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
MAIL_SENDER_EMAIL=sublytics@primexmeta.com
MAIL_SENDER_NAME=Sublytics
SEED_ADMIN_EMAIL=admin@sublytics.com
SEED_ADMIN_PASSWORD=Admin@123456
```

## Notes

- The seed admin endpoint is idempotent - it won't create duplicate admins
- Only run the migration once
- The seed endpoint can be accessed anytime but will only create the admin on first run
