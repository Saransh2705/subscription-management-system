import CheckoutPageClient from "@/components/pages/CheckoutPageClient";

export default async function CheckoutPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;

  return <CheckoutPageClient planId={planId} />;
}
