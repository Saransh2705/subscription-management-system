# Sublytics - Subscription Management System

A comprehensive subscription management system built with **Next.js 15**, featuring customer management, subscription tracking, invoicing, and staff administration.

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 18, Tailwind CSS, Shadcn UI
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with RBAC
- **Email:** Resend
- **State Management:** TanStack Query
- **Testing:** Vitest, Playwright
- **Runtime:** Bun

## 📋 Features

### Core Functionality
- 📊 **Dashboard** - Overview of key metrics and analytics
- 👥 **Customer Management** - Complete customer lifecycle management
- 📦 **Product & Plans** - Flexible product and subscription plan configuration
- 💳 **Subscriptions** - Full subscription lifecycle management
- 🧾 **Invoicing** - Automated invoice generation and tracking
- 📄 **Quotations** - Create and manage sales quotations
- ✉️ **Email Templates** - Customizable email templates for notifications
- 👤 **Staff Management** - Role-based access control (ADMIN, MANAGER, STAFF)
- ⚙️ **Settings** - System configuration and preferences

### Authentication & Security
- ✅ Secure authentication via Supabase
- ✅ Role-based access control (RBAC)
- ✅ Staff invitation system (ADMIN only)
- ✅ Password reset functionality
- ✅ Protected routes and API endpoints

## 🛠️ Getting Started

### Prerequisites
- Bun runtime installed
- Supabase account
- Resend account (for email functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sublytics
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Set up the database**
   
   Run the SQL migrations in `src/migrations/001_initial_setup.sql` in your Supabase SQL editor.
   See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.

5. **Run the development server**
   ```bash
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Seed admin user** (optional)
   
   Navigate to `/seed-admin` to create an initial admin account.

## 📁 Project Structure

```
sublytics/
├── app/                      # Next.js App Router pages
│   ├── (app)/               # Protected app routes
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── plans/
│   │   ├── subscriptions/
│   │   ├── invoices/
│   │   ├── quotations/
│   │   ├── email-templates/
│   │   ├── staff/
│   │   ├── settings/
│   │   └── api-docs/
│   ├── api/                 # API routes
│   ├── auth/                # Auth callback
│   ├── login/
│   ├── forgot-password/
│   └── reset-password/
├── components/              # React components
│   ├── ui/                 # Shadcn UI components
│   ├── AppHeader.tsx
│   ├── AppLayout.tsx
│   ├── AppSidebar.tsx
│   ├── EmptyState.tsx
│   ├── NavLink.tsx
│   ├── StatCard.tsx
│   └── StatusBadge.tsx
├── lib/                     # Utilities and configurations
│   ├── actions/            # Server actions
│   ├── auth/               # RBAC and admin seeding
│   ├── email/              # Email service
│   ├── supabase/           # Supabase client configs
│   └── types/              # TypeScript types
├── hooks/                   # Custom React hooks
├── public/                  # Static assets
└── src/                     
    └── migrations/          # Database migrations
```

## 🧪 Testing

```bash
# Run unit tests
bun test

# Run tests in watch mode
bun test:watch

# Run E2E tests with Playwright
bun playwright test
```

## 🏗️ Build & Deploy

```bash
# Build for production
bun run build

# Start production server
bun start
```

## 📚 Database Schema

The system uses the following main tables:
- `customers` - Customer information
- `products` - Product catalog
- `subscription_plans` - Subscription plan configurations
- `subscriptions` - Active and historical subscriptions
- `invoices` / `invoice_items` - Invoicing system
- `quotations` / `quotation_items` - Quotation system
- `email_templates` - Customizable email templates
- `staff_invites` - Staff invitation management

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for complete schema details.

## 🔐 User Roles

- **ADMIN** - Full system access, can manage staff
- **MANAGER** - Manage customers, subscriptions, products, and invoices
- **STAFF** - View-only access to customer and subscription data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙋 Support

For support and questions, please open an issue in the repository.
