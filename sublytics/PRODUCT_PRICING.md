# Product Tiered Pricing System

This document explains the product tiered pricing system that allows products to have different prices across different subscription plans.

## Overview

The system enables:
- Products with base pricing
- Different pricing tiers for products in different subscription plans
- Calculation of total subscription cost including products
- Flexible product inclusion in subscription plans

## Database Schema

### Tables

#### `products`
Stores the core product information with a base price.
- `id` - UUID primary key
- `name` - Product name
- `description` - Product description
- `sku` - Stock keeping unit
- `unit_price` - Base price for the product
- `currency` - Currency (default: USD)
- `is_active` - Active status

#### `subscription_plan_products`
Junction table linking products to subscription plans with tier-specific pricing.
- `id` - UUID primary key
- `plan_id` - Reference to subscription plan
- `product_id` - Reference to product
- `tier_price` - Price for this product in this specific plan
- `is_included` - Whether the product is included in the base plan price
- `quantity_limit` - Maximum quantity allowed (null = unlimited)
- `notes` - Additional notes

#### `subscription_products`
Tracks which products are in each subscription instance.
- `id` - UUID primary key
- `subscription_id` - Reference to subscription
- `product_id` - Reference to product
- `plan_product_id` - Reference to plan product pricing
- `quantity` - Quantity of this product
- `unit_price` - Price per unit (copied from tier price)
- `total_price` - Calculated total (quantity × unit_price)
- `is_active` - Active status

## How It Works

### 1. Create Products
Products are created with a base price that serves as the default:

```typescript
const product = await createProduct({
  name: "API Access",
  description: "REST API access",
  sku: "API-001",
  unit_price: 99.00,
  currency: "USD"
});
```

### 2. Add Products to Plans with Tier Pricing
Each product can have different prices in different subscription plans:

```typescript
// Starter Plan - Discounted API Access
await createPlanProduct({
  plan_id: "starter-plan-id",
  product_id: "api-product-id",
  tier_price: 49.00,  // Discounted from base $99
  is_included: true,
  quantity_limit: 1000  // 1000 API calls
});

// Enterprise Plan - Premium API Access
await createPlanProduct({
  plan_id: "enterprise-plan-id",
  product_id: "api-product-id",
  tier_price: 149.00,  // Premium pricing
  is_included: true,
  quantity_limit: null  // Unlimited calls
});
```

### 3. Calculate Subscription Total
The total subscription cost is calculated as:

```
Total = (Plan Base Price + Sum of Product Prices) × (1 - Discount %)
```

Use the helper function:

```typescript
const total = await calculateSubscriptionTotal(subscriptionId);
```

## API Functions

### Product Management
- `getProducts()` - Fetch all products
- `getProductById(id)` - Fetch single product
- `getProductsWithTiers()` - Fetch products with all tier pricing
- `createProduct(input)` - Create new product
- `updateProduct(id, input)` - Update product
- `deleteProduct(id)` - Delete product

### Plan-Product Management
- `getPlanProducts(planId)` - Get all products for a plan
- `getProductPlans(productId)` - Get all plans for a product
- `createPlanProduct(input)` - Add product to plan with tier price
- `updatePlanProduct(id, input)` - Update tier pricing
- `deletePlanProduct(id)` - Remove product from plan

### Subscription Calculation
- `calculateSubscriptionTotal(subscriptionId)` - Calculate total subscription price

## UI Components

### Products Page
- List all products
- Create/Edit/Delete products
- Shows base pricing and status
- Located: `/products`

### Plan Products Manager Component
- Manage products within a subscription plan
- Set tier-specific pricing
- Configure inclusion and limits
- Component: `<PlanProductsManager planId={id} planName={name} />`

## Example Use Cases

### Use Case 1: Software as a Service
Different API tiers with varying prices:
- **Basic Plan**: API Access @ $29/mo (1000 calls)
- **Pro Plan**: API Access @ $99/mo (10,000 calls)
- **Enterprise Plan**: API Access @ $299/mo (unlimited)

### Use Case 2: Cloud Storage
Storage products with tiered pricing:
- **Starter Plan**: 10GB Storage @ $5/mo
- **Business Plan**: 100GB Storage @ $15/mo (bulk discount)
- **Enterprise Plan**: 1TB Storage @ $50/mo (volume discount)

### Use Case 3: Multi-Product Bundles
- **Basic Plan**: 
  - Email Service @ $10/mo
  - 5GB Storage @ $5/mo
  - Total: $15/mo
  
- **Premium Plan**:
  - Email Service @ $8/mo (included discount)
  - 50GB Storage @ $15/mo (included discount)
  - Video Conferencing @ $20/mo
  - Total: $43/mo

## Migration

Run the migration file to set up the database schema:

```sql
-- Migration: 006_product_plan_pricing.sql
-- Creates: subscription_plan_products, subscription_products tables
-- Includes: RLS policies, indexes, and calculation function
```

## Best Practices

1. **Base Pricing**: Set a sensible base price on products as a default
2. **Tier Pricing**: Use tier prices to create value differentiation
3. **Included vs Add-on**: Mark products as included or optional add-ons
4. **Quantity Limits**: Set limits to create clear plan boundaries
5. **Currency Consistency**: Keep currency consistent across plans and products
6. **Pricing Strategy**: Use tiered pricing to encourage upgrades

## Future Enhancements

Potential additions:
- Metered billing for usage-based products
- Product bundles and packages
- Promotional pricing and discounts
- Multi-currency support with exchange rates
- Product dependencies and requirements
- Custom pricing overrides per customer
