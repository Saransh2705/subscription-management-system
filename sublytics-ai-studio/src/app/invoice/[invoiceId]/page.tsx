import InvoicePageClient from "@/components/pages/InvoicePageClient";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ planId?: string; customerName?: string }>;
}) {
  const { invoiceId } = await params;
  const query = await searchParams;

  return (
    <InvoicePageClient
      invoiceId={invoiceId}
      planId={query.planId}
      customerName={query.customerName}
    />
  );
}
