import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuotationsClient from "./QuotationsClient";
import { getQuotations } from "@/lib/actions/quotations";

export default async function QuotationsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch quotations
  const { data: quotations } = await getQuotations();

  return (
    <QuotationsClient
      initialQuotations={quotations || []}
    />
  );
}
