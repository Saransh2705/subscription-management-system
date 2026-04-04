/**
 * Sublytics API Test Examples
 * 
 * This file demonstrates how to use the Sublytics API endpoints.
 * Run with: bun run test-api.ts
 */

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Replace with your actual credentials from company_api_keys table
const COMPANY_ID = 'your-company-id';
const COMPANY_SECRET = 'your-company-secret';

let authToken: string;

// 1. Authenticate and get access token
async function authenticate() {
  console.log('\n📝 Authenticating...');
  
  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_id: COMPANY_ID,
      company_secret: COMPANY_SECRET
    })
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Authentication successful!');
    console.log(`   Token expires in: ${data.expires_in}`);
    authToken = data.token;
    return data.token;
  } else {
    console.error('❌ Authentication failed:', data.error);
    throw new Error('Authentication failed');
  }
}

// 2. Create a customer
async function createCustomer() {
  console.log('\n👤 Creating customer...');
  
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      name: 'Test Company Ltd',
      email: `test-${Date.now()}@example.com`,
      phone: '+1-555-0199',
      company: 'Test Company Ltd',
      address: '456 Test Ave',
      city: 'Test City',
      country: 'US',
      notes: 'Created via API test'
    })
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Customer created successfully!');
    console.log(`   Customer ID: ${data.data.id}`);
    console.log(`   Name: ${data.data.name}`);
    console.log(`   Email: ${data.data.email}`);
    return data.data;
  } else {
    console.error('❌ Customer creation failed:', data.error);
    throw new Error('Customer creation failed');
  }
}

// 3. Get customer by ID
async function getCustomer(customerId: string) {
  console.log('\n🔍 Fetching customer...');
  
  const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Customer retrieved successfully!');
    console.log(`   ID: ${data.data.id}`);
    console.log(`   Name: ${data.data.name}`);
    console.log(`   Email: ${data.data.email}`);
    return data.data;
  } else {
    console.error('❌ Customer fetch failed:', data.error);
    throw new Error('Customer fetch failed');
  }
}

// 4. Create an invoice
async function createInvoice(customerId: string) {
  console.log('\n📄 Creating invoice...');
  
  const today = new Date();
  const dueDate = new Date(today.setDate(today.getDate() + 30))
    .toISOString()
    .split('T')[0];

  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      customer_id: customerId,
      due_date: dueDate,
      tax_percent: 10,
      discount_percent: 0,
      currency: 'USD',
      notes: 'Test invoice created via API',
      items: [
        {
          description: 'Professional Plan - Monthly Subscription',
          quantity: 1,
          unit_price: 99.00
        },
        {
          description: 'Additional User Seats',
          quantity: 5,
          unit_price: 10.00
        }
      ]
    })
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Invoice created successfully!');
    console.log(`   Invoice Number: ${data.data.invoice_number}`);
    console.log(`   Subtotal: $${data.data.subtotal}`);
    console.log(`   Tax: $${data.data.tax_amount}`);
    console.log(`   Total: $${data.data.total}`);
    console.log(`   Status: ${data.data.status}`);
    console.log(`   Items: ${data.data.items.length}`);
    return data.data;
  } else {
    console.error('❌ Invoice creation failed:', data.error);
    throw new Error('Invoice creation failed');
  }
}

// 5. Get invoice by ID
async function getInvoice(invoiceId: string) {
  console.log('\n🔍 Fetching invoice...');
  
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Invoice retrieved successfully!');
    console.log(`   Invoice Number: ${data.data.invoice_number}`);
    console.log(`   Customer: ${data.data.customer.name}`);
    console.log(`   Total: $${data.data.total}`);
    console.log(`   Status: ${data.data.status}`);
    console.log(`   Line Items:`);
    data.data.items.forEach((item: any, index: number) => {
      console.log(`     ${index + 1}. ${item.description} - $${item.total}`);
    });
    return data.data;
  } else {
    console.error('❌ Invoice fetch failed:', data.error);
    throw new Error('Invoice fetch failed');
  }
}

// 6. Get all invoices with currency conversion
async function getAllInvoices(currency?: string) {
  console.log(`\n📋 Fetching all invoices${currency ? ` in ${currency}` : ''}...`);
  
  const url = currency 
    ? `${API_BASE_URL}/invoices?currency=${currency}`
    : `${API_BASE_URL}/invoices`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Invoices retrieved successfully!');
    console.log(`   Total Invoices: ${data.data.length}`);
    
    if (data.conversion) {
      console.log(`   Conversion Applied:`);
      console.log(`     From: ${data.conversion.from_currency}`);
      console.log(`     To: ${data.conversion.to_currency} (${data.conversion.currency_name})`);
      console.log(`     ROE Rate: ${data.conversion.roe_rate}`);
    }
    
    if (data.data.length > 0) {
      console.log(`   Sample Invoice:`);
      const sample = data.data[0];
      console.log(`     ${sample.invoice_number} - ${sample.customer.name}`);
      console.log(`     Total: ${sample.currency} ${sample.total.toFixed(2)}`);
      if (sample.original_total) {
        console.log(`     Original: ${sample.original_currency} ${sample.original_total.toFixed(2)}`);
      }
    }
    
    return data;
  } else {
    console.error('❌ Invoices fetch failed:', data.error);
    throw new Error('Invoices fetch failed');
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Sublytics API Tests...');
  console.log('=====================================');

  try {
    // Step 1: Authenticate
    await authenticate();

    // Step 2: Create a customer
    const customer = await createCustomer();

    // Step 3: Get the customer by ID
    await getCustomer(customer.id);

    // Step 4: Create an invoice for the customer
    const invoice = await createInvoice(customer.id);

    // Step 5: Get the invoice by ID
    await getInvoice(invoice.id);

    // Step 6: Get all invoices (default currency)
    await getAllInvoices();

    // Step 7: Get all invoices in EUR (if ROE data exists)
    console.log('\n💱 Testing currency conversion...');
    try {
      await getAllInvoices('EUR');
    } catch (error) {
      console.log('   ℹ️  EUR conversion not available (ROE data may not be seeded)');
    }

    console.log('\n=====================================');
    console.log('✅ All tests completed successfully!');
    console.log('=====================================\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
