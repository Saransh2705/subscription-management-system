import { requireAuth } from '@/lib/auth/rbac';
import { ProductsClient } from './ProductsClient';
import { getSystemSettings, getAvailableCurrencies } from '@/lib/actions/settings';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  await requireAuth();
  
  // Fetch system settings and available currencies
  const settings = await getSystemSettings();
  const currencies = await getAvailableCurrencies();
  
  return (
    <ProductsClient 
      systemCurrency={settings.system_currency_code} 
      availableCurrencies={currencies}
    />
  );
}
