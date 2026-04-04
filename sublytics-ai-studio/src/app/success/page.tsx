import SuccessPageClient from "@/components/pages/SuccessPageClient";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; invoiceId?: string }>;
}) {
  const query = await searchParams;

  return <SuccessPageClient planId={query.planId} invoiceId={query.invoiceId} />;
}
