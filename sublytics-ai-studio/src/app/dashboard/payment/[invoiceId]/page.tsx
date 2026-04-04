import PaymentPageClient from "@/components/pages/PaymentPageClient";

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ planId?: string }>;
}) {
  const { invoiceId } = await params;
  const query = await searchParams;

  return <PaymentPageClient invoiceId={invoiceId} planId={query.planId} />;
}
