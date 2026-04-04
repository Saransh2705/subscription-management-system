# Subscription Plans - Discount Model

## Overview

Subscription plans now use a **discount-based pricing model** instead of fixed prices. This allows for flexible pricing where:

1. Plans contain a **discount percentage** (0-100%)
2. Each plan selects which **products** to include
3. Final price is calculated: `sum(included_products) × (1 - discount_percentage/100)`

## Database Schema

### Updated `subscription_plans` Table

**Removed columns:**
- `price` - No longer needed (calculated from products)
- `currency` - Products have their own currency
- `billing_cycle` - Removed (can be subscription-specific)

**Added columns:**
- `discount_percentage` - NUMERIC(5,2) - Discount applied to included products (0-100)

### New `subscription_plan_products` Table

Junction table linking plans to products:

```sql
subscription_plan_products (
  id UUID PRIMARY KEY,
  plan_id UUID FOREIGN KEY → subscription_plans,
  product_id UUID FOREIGN KEY → products,
  tier_price NUMERIC(12,2) DEFAULT 0,  -- Override product price for this tier
  is_included BOOLEAN DEFAULT true,     -- Include in plan
  quantity_limit INTEGER,               -- Max quantity (NULL = unlimited)
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Helper View: `subscription_plans_with_pricing`

Automatically calculates pricing for each plan:

```sql
SELECT 
  sp.*,
  SUM(product_prices) AS base_price,
  SUM(product_prices) * (1 - discount_percentage/100) AS final_price,
  COUNT(products) AS product_count
FROM subscription_plans sp
LEFT JOIN subscription_plan_products spp ON sp.id = spp.plan_id
LEFT JOIN products p ON spp.product_id = p.id
GROUP BY sp.id
```

## Example Plan Structure

### Starter Plan (0% discount)
- 5 AI tools selected
- Base price: $145 (sum of 5 product prices)
- Final price: $145 (no discount)

### Professional Plan (10% discount)
- 15 AI tools selected
- Base price: $500
- Final price: $450 ($500 × 0.9)

### Business Plan (20% discount)
- All AI tools
- Base price: $1,200
- Final price: $960 ($1,200 × 0.8)

### Enterprise Plan (25% discount)
- Custom product selection
- Custom tier pricing per product
- Base price: varies
- Final price: base × 0.75

## Migration Path

**Migration 013:** `013_subscription_plans_discount_model.sql`

1. Drops dependent views/functions that referenced `plan.price`
2. Adds `discount_percentage` column
3. Drops `price`, `currency`, `billing_cycle` columns
4. Creates `subscription_plan_products` table
5. Creates indexes and RLS policies
6. Sets default discounts:
   - Starter: 0%
   - Professional: 10%
   - Business: 20%
   - Enterprise: 25%
7. Creates `subscription_plans_with_pricing` view

## TypeScript Types

Updated `SubscriptionPlan` interface:

```typescript
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number; // 0-100
  trial_days: number;
  features: any[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

`SubscriptionPlanProduct` interface (already existed):

```typescript
export interface SubscriptionPlanProduct {
  id: string;
  plan_id: string;
  product_id: string;
  tier_price: number;           // Override price for this tier
  is_included: boolean;          // Include in plan calculations
  quantity_limit: number | null; // Usage limit
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

## Server Actions

**plans.ts:**

- `getPlans()` - Get all plans with calculated pricing
- `getPlanWithProducts(planId)` - Get plan and its products
- `updatePlanDiscount(planId, percentage)` - Update discount
- `addProductToPlan(input)` - Add product to plan
- `updatePlanProduct(id, input)` - Update tier price/limits
- `removeProductFromPlan(id)` - Remove product from plan

## UI Features

### Plans Management Page

**For each plan displays:**
- Plan name and description
- Discount percentage badge
- Base price (sum of included products)
- Final price (after discount)
- Product count

**Actions:**
- Edit discount percentage (0-100%)
- Manage included products
- View/edit tier-specific pricing
- Toggle product inclusion
- Add/remove products

### Permissions

Only **SYSTEM_ADMIN** and **ADMIN** can:
- Edit plan discounts
- Manage plan products
- Set tier pricing overrides

## Benefits

✅ **Flexible Pricing:** Each plan tier gets a percentage discount
✅ **Product Selection:** Choose which products to include per plan
✅ **Tier Overrides:** Set custom prices for specific products in specific tiers
✅ **Automatic Calculation:** Prices update based on included products
✅ **Enterprise Customization:** Manual product selection with custom pricing
✅ **Scalable:** Easy to add new products without changing plan prices

## Business Logic

When a customer subscribes:

1. Select a plan (e.g., "Professional")
2. System calculates total from included products
3. Applies plan discount (e.g., 10%)
4. Generates subscription with final price
5. Can add additional products at catalog price

When product prices change:
- Plan total automatically updates
- Existing subscriptions maintain their locked-in price
- New subscriptions get updated pricing
